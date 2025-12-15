/**
 * useBookingActions - Custom hook til at håndtere booking actions (cancel/edit)
 * 
 * Håndterer logikken for at aflyse og redigere bookinger i Supabase.
 */
import { useState, useCallback } from 'react';
import { Booking } from '../components/myBookings/types';
import { parseBookingDate } from '../components/myBookings/utils';
import { supabase } from '../lib/supabaseClient';

interface UseBookingActionsProps {
  bookings: Booking[];
  onUpdate: () => void;
  onError: (error: string) => void;
}

export function useBookingActions({ bookings, onUpdate, onError }: UseBookingActionsProps) {
  const [cancelLoading, setCancelLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sletter booking fra databasen
  const handleCancel = useCallback(async (booking: Booking): Promise<boolean> => {
    if (!supabase) return false;
    setCancelLoading(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .delete() // Slet booking
        .eq('id', booking.id);
      
      if (error) throw error;
      setError(null);
      onUpdate(); // Opdater bookings liste
      return true; // Succes
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Kunne ikke aflyse booking';
      setError(errorMessage);
      onError(errorMessage);
      return false; // Fejl
    } finally {
      setCancelLoading(false);
    }
  }, [onUpdate, onError]);

  // Opdaterer booking tidspunkt
  const handleEdit = useCallback(async (
    bookingId: string, 
    newStartTime: string, 
    newEndTime: string
  ) => {
    if (!supabase) return;
    setEditLoading(true);
    setEditSuccess(false);
    setError(null); // Reset error når ny operation starter
    try {
      const originalBooking = bookings.find(b => b.id === bookingId);
      if (!originalBooking) throw new Error('Booking ikke fundet');
      
      const parsedDate = parseBookingDate(originalBooking.dato); // Parse dato
      if (!parsedDate) throw new Error('Ugyldig dato');
      
      const [startHours, startMinutes] = newStartTime.split(':').map(Number); // Split tid
      const [endHours, endMinutes] = newEndTime.split(':').map(Number);
      
      // Kombiner dato + tid til Date objekter
      const newStartDateTime = new Date(
        parsedDate.year, 
        parsedDate.monthIndex, 
        parsedDate.day, 
        startHours, 
        startMinutes
      );
      const newEndDateTime = new Date(
        parsedDate.year, 
        parsedDate.monthIndex, 
        parsedDate.day, 
        endHours, 
        endMinutes
      );
      
      // Opdater i Supabase
      const { error } = await supabase
        .from('bookings')
        .update({ 
          start_time: newStartDateTime.toISOString(), 
          end_time: newEndDateTime.toISOString() 
        })
        .eq('id', bookingId);
      
      if (error) throw error;
      
      setError(null);
      setEditSuccess(true);
      onUpdate(); // Opdater bookings liste
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Kunne ikke opdatere booking';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setEditLoading(false);
    }
  }, [bookings, onUpdate, onError]);

  // Reset funktion til at rydde success/error state
  const resetEditSuccess = useCallback(() => {
    setEditSuccess(false);
    setError(null);
  }, []);

  return {
    handleCancel,
    handleEdit,
    cancelLoading,
    editLoading,
    editSuccess,
    error,
    resetEditSuccess,
  };
}

