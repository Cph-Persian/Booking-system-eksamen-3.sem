/**
 * useBookings - Custom hook til at hente og håndtere bookinger
 * 
 * Henter bookinger fra Supabase for den aktuelle bruger og opdaterer automatisk
 * via real-time subscriptions. Filtrerer kun kommende bookinger.
 */
import { useState, useEffect, useCallback } from 'react';
import { Booking } from '../components/myBookings/types';
import { convertSupabaseBookingToBooking } from '../components/myBookings/utils';
import { supabase } from '../lib/supabaseClient';

export function useBookings(userId: string | undefined) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Henter bookinger fra Supabase
  const fetchBookings = useCallback(async () => {
    if (!supabase || !userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, room_id, start_time, end_time, user_id, rooms (id, name, type, features)')
        .eq('user_id', userId) // Kun denne brugers bookinger
        .order('start_time', { ascending: true }); // Sorter efter start tid
      
      if (error) throw error;
      
      if (data) {
        const now = new Date();
        const convertedBookings = data
          .filter((b: any) => new Date(b.end_time) >= now) // Kun kommende bookinger
          .map(convertSupabaseBookingToBooking); // Konverter format
        setBookings(convertedBookings);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Kunne ikke hente bookinger');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Henter bookinger når bruger er klar
  useEffect(() => {
    if (userId) {
      fetchBookings(); // Hent bookinger hvis bruger er logget ind
    } else {
      setBookings([]); // Ryd bookinger hvis ikke logget ind
      setLoading(false);
    }
  }, [userId, fetchBookings]);

  // Real-time subscription - opdaterer automatisk ved ændringer
  useEffect(() => {
    if (!supabase || !userId) return;
    const channel = supabase
      .channel('bookings-changes')
      .on('postgres_changes', { 
        event: '*', // Lytter til alle events
        schema: 'public', 
        table: 'bookings', 
        filter: `user_id=eq.${userId}` // Kun denne brugers bookinger
      }, fetchBookings) // Opdater ved ændring
      .subscribe();
    
    return () => {
      if (supabase) {
        supabase.removeChannel(channel); // Ryd op ved unmount
      }
    };
  }, [userId, fetchBookings]);

  return { bookings, loading, error, refetch: fetchBookings };
}

