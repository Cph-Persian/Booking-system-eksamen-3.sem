import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Ugyldig data' }, { status: 400 });
    }

    if (!body.room_id || !body.start_time || !body.end_time) {
      return NextResponse.json({ error: 'Manglende data' }, { status: 400 });
    }

    let supabase;
    try {
      supabase = getSupabaseAdmin();
    } catch {
      return NextResponse.json({ error: 'Systemet ikke konfigureret' }, { status: 500 });
    }

    const { data, error } = await supabase
      .from("bookings")
      .insert({ room_id: body.room_id, start_time: body.start_time, end_time: body.end_time, user_id: body.user_id || null })
      .select()
      .single();

    if (error) {
      const userMessage = error.message.includes('duplicate') || error.message.includes('unique')
        ? 'Booking eksisterer allerede'
        : error.message.includes('overlap') || error.message.includes('conflict')
        ? 'Lokalet er allerede booket'
        : error.message.includes('permission') || error.message.includes('policy')
        ? 'Ingen tilladelse'
        : `Fejl: ${error.message}`;
      return NextResponse.json({ error: userMessage }, { status: 400 });
    }

    return NextResponse.json({ booking: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Uventet fejl';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { bookingId, start_time, end_time } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID mangler" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: existingBooking, error: checkError } = await supabase
      .from("bookings")
      .select("id, room_id")
      .eq("id", bookingId)
      .single();

    if (checkError || !existingBooking) {
      return NextResponse.json({ error: "Booking ikke fundet" }, { status: 404 });
    }

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
      const userMessage = error.message.includes('overlap') || error.message.includes('conflict')
        ? 'Lokalet er allerede booket'
        : 'Fejl ved opdatering';
      return NextResponse.json({ error: userMessage }, { status: 400 });
    }

    return NextResponse.json({ success: true, updated: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Uventet fejl';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("id");

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID mangler" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: existingBooking, error: checkError } = await supabase
      .from("bookings")
      .select("id, room_id")
      .eq("id", bookingId)
      .single();

    if (checkError || !existingBooking) {
      return NextResponse.json({ error: "Booking ikke fundet" }, { status: 404 });
    }

    const { error: deleteError } = await supabase
      .from("bookings")
      .delete()
      .eq("id", bookingId);

    if (deleteError) {
      return NextResponse.json({ error: 'Kunne ikke slette booking' }, { status: 400 });
    }

    return NextResponse.json({ success: true, deleted: { id: bookingId, room_id: existingBooking.room_id } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Uventet fejl';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const room_id = searchParams.get("room_id");
    const user_id = searchParams.get("user_id");
    const date = searchParams.get("date");

    const supabase = getSupabaseAdmin();
    let query = supabase.from("bookings").select("*");

    if (room_id) query = query.eq("room_id", room_id);
    if (user_id) query = query.eq("user_id", user_id);
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query = query.gte("start_time", startOfDay.toISOString()).lte("start_time", endOfDay.toISOString());
    }

    query = query.order("start_time", { ascending: true });
    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Kunne ikke hente bookinger' }, { status: 400 });
    }

    return NextResponse.json({ bookings: data || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Uventet fejl';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
