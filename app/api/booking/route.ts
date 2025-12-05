// app/api/booking/route.ts
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("body", body);

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("bookings")
      .insert({
        room_id: body.room_id,
        start_time: body.start_time,
        end_time: body.end_time,
        user_id: body.user_id || null,
      })
      .select()
      .single();

    if (error) {
      const userMessage = error.message.includes('duplicate') || error.message.includes('unique')
        ? 'Denne booking eksisterer allerede'
        : error.message.includes('overlap') || error.message.includes('conflict')
        ? 'Lokalet er allerede booket i dette tidsrum'
        : 'Der opstod en fejl ved oprettelse af booking. Prøv venligst igen';
      return NextResponse.json({ error: userMessage }, { status: 400 });
    }

    return NextResponse.json({ booking: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Der opstod en uventet fejl. Prøv venligst igen';
    console.error("/api/booking error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { bookingId, start_time, end_time } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID mangler. Prøv venligst igen" }, { status: 400 });
    }

    console.log("PATCH request for booking ID:", bookingId);

    const supabase = getSupabaseAdmin();

    // First check if booking exists
    const { data: existingBooking, error: checkError } = await supabase
      .from("bookings")
      .select("id, room_id")
      .eq("id", bookingId)
      .single();

    if (checkError || !existingBooking) {
      return NextResponse.json({ error: "Vi kunne ikke finde den valgte booking. Prøv venligst igen" }, { status: 404 });
    }

    // Update the booking
    const updateData: { start_time?: string; end_time?: string } = {};
    if (start_time) updateData.start_time = start_time;
    if (end_time) updateData.end_time = end_time;

    const { data, error } = await supabase
      .from("bookings")
      .update(updateData)
      .eq("id", bookingId)
      .select()
      .single();

    if (error) {
      console.error("Update error:", error);
      const userMessage = error.message.includes('overlap') || error.message.includes('conflict')
        ? 'Lokalet er allerede booket i det valgte tidsrum'
        : 'Der opstod en fejl ved opdatering af booking. Prøv venligst igen';
      return NextResponse.json({ error: userMessage }, { status: 400 });
    }

    return NextResponse.json({ success: true, updated: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Der opstod en uventet fejl. Prøv venligst igen';
    console.error("/api/booking PATCH error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("id");

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID mangler. Prøv venligst igen" }, { status: 400 });
    }

    console.log("DELETE request for booking ID:", bookingId);

    const supabase = getSupabaseAdmin();

    // First check if booking exists and get its details
    const { data: existingBooking, error: checkError } = await supabase
      .from("bookings")
      .select("id, room_id")
      .eq("id", bookingId)
      .single();

    if (checkError || !existingBooking) {
      console.log("Booking not found or check error:", checkError);
      return NextResponse.json({ error: "Vi kunne ikke finde den valgte booking. Prøv venligst igen" }, { status: 404 });
    }

    console.log("Booking found, attempting deletion:", existingBooking);

    // Delete the booking using service role (bypasses RLS)
    // Note: Service role key should have "role": "service_role" in JWT
    const { data: deleteData, error: deleteError } = await supabase
      .from("bookings")
      .delete()
      .eq("id", bookingId)
      .select();

    console.log("Delete result:", { deleteData, deleteError });

    // Check if service role is actually being used
    if (deleteError && (deleteError.message?.includes("permission") || deleteError.message?.includes("policy"))) {
      console.error("RLS policy blocking deletion. Service role key may not be configured correctly.");
      console.error("Make sure SUPABASE_SERVICE_ROLE_KEY has 'role': 'service_role' in the JWT token");
    }

    if (deleteError) {
      console.error("Delete error:", deleteError);
      return NextResponse.json({ error: 'Vi kunne desværre ikke slette din booking lige nu. Prøv venligst igen' }, { status: 400 });
    }

    // Verify deletion by checking if it still exists
    const { data: verifyData, error: verifyError } = await supabase
      .from("bookings")
      .select("id")
      .eq("id", bookingId)
      .maybeSingle();

    console.log("Verification after delete:", { verifyData, verifyError });

    if (verifyData) {
      console.error("Booking still exists after deletion - RLS policy may be blocking");
      return NextResponse.json({
        error: "Vi kunne desværre ikke slette din booking. Kontakt venligst support hvis problemet fortsætter"
      }, { status: 500 });
    }

    // If no error and verification shows it's gone, deletion was successful
    return NextResponse.json({
      success: true,
      deleted: { id: bookingId, room_id: existingBooking.room_id }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Der opstod en uventet fejl. Prøv venligst igen';
    console.error("/api/booking DELETE error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const room_id = searchParams.get("room_id");
    const user_id = searchParams.get("user_id");
    const date = searchParams.get("date");

    console.log("GET request with params:", { room_id, user_id, date });

    const supabase = getSupabaseAdmin();

    let query = supabase.from("bookings").select("*");

    // Filtrer på room_id hvis angivet
    if (room_id) {
      query = query.eq("room_id", room_id);
    }

    // Filtrer på user_id hvis angivet
    if (user_id) {
      query = query.eq("user_id", user_id);
    }

    // Filtrer på dato hvis angivet
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      query = query
        .gte("start_time", startOfDay.toISOString())
        .lte("start_time", endOfDay.toISOString());
    }

    // Sorter efter start_time
    query = query.order("start_time", { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error("Get error:", error);
      return NextResponse.json({ error: 'Vi kunne desværre ikke hente bookingerne lige nu. Prøv venligst igen senere' }, { status: 400 });
    }

    return NextResponse.json({ bookings: data || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Der opstod en uventet fejl. Prøv venligst igen';
    console.error("/api/booking GET error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
