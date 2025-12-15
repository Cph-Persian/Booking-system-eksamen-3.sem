/**
 * My Bookings Page - Side der viser brugerens bookinger
 * 
 * Henter alle bookinger for den aktuelle bruger fra Supabase og viser dem i en liste.
 * Tillader filtrering efter dato og søgning i lokale, type eller udstyr.
 * Giver mulighed for at redigere eller aflyse bookinger via modaler.
 * Opdaterer data i real-time via Supabase subscriptions. Viser loading states og fejlhåndtering.
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Container, Paper, Text, Stack, Loader, Center } from '@mantine/core';
import '@mantine/dates/styles.css';

import { useUser } from '../contexts/UserContext';
import { CancelBookingModal } from '../components/myBookings/CancelBookingModal';
import { EditBookingModal } from '../components/myBookings/EditBookingModal';
import { BookingRow } from '../components/myBookings/BookingRow';
import { BookingsHeader } from '../components/myBookings/BookingsHeader';
import { BookingsFilter } from '../components/myBookings/BookingsFilter';
import { BookingsTableHeader } from '../components/myBookings/BookingsTableHeader';
import { BookingsEmptyState } from '../components/myBookings/BookingsEmptyState';
import { Booking } from '../components/myBookings/types';
import { matchesDate, matchesSearch, convertSupabaseBookingToBooking, parseBookingDate } from '../components/myBookings/utils';
import { supabase } from '../lib/supabaseClient';
import louiseAvatar from '../img/louise.png';

export default function BookingPage() {
  // ========================================
  // 1. STATE MANAGEMENT
  // ========================================
  const { user, loading } = useUser(); // Henter brugerdata
  const [allBookings, setAllBookings] = useState<Booking[]>([]); // Alle bookinger
  const [searchValue, setSearchValue] = useState(''); // Søgetekst
  const [dateValue, setDateValue] = useState<Date | null>(null); // Valgt dato
  const [bookingsLoading, setBookingsLoading] = useState(true); // Loading state
  const [bookingsError, setBookingsError] = useState<string | null>(null); // Fejlbesked
  const [cancelModalOpened, setCancelModalOpened] = useState(false); // Cancel modal åben/lukket
  const [editModalOpened, setEditModalOpened] = useState(false); // Edit modal åben/lukket
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null); // Valgt booking
  const [isMounted, setIsMounted] = useState(false); // Forhindrer hydration fejl
  const [cancelLoading, setCancelLoading] = useState(false); // Loading ved aflysning
  const [editLoading, setEditLoading] = useState(false); // Loading ved redigering
  const [editSuccess, setEditSuccess] = useState(false); // Success besked

  // ========================================
  // 2. MOUNT EFFECT
  // ========================================
  useEffect(() => {
    setIsMounted(true); // Marker komponent som mounted
  }, []);

  // ========================================
  // 3. DATA FETCHING (fetchBookings)
  // ========================================
  // Henter bookinger fra Supabase
  const fetchBookings = useCallback(async () => {
    if (!supabase || !user?.id) {
      setBookingsLoading(false);
      return;
    }
    setBookingsLoading(true);
    setBookingsError(null);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, room_id, start_time, end_time, user_id, rooms (id, name, type, features)')
        .eq('user_id', user.id) // Kun denne brugers bookinger
        .order('start_time', { ascending: true }); // Sorter efter start tid
      
      if (error) throw error;
      
      if (data) {
        const now = new Date();
        const convertedBookings = data
          .filter((b: any) => new Date(b.end_time) >= now) // Kun kommende bookinger
          .map(convertSupabaseBookingToBooking); // Konverter format
        setAllBookings(convertedBookings);
      }
    } catch (err: unknown) {
      setBookingsError(err instanceof Error ? err.message : 'Kunne ikke hente bookinger');
      setAllBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  }, [user?.id]);

  // ========================================
  // 4. FETCH EFFECT - Henter bookinger når bruger er klar
  // ========================================
  // Henter bookinger når bruger er klar
  useEffect(() => {
    if (!loading && user?.id) {
      fetchBookings(); // Hent bookinger hvis bruger er logget ind
    } else if (!loading && !user) {
      setAllBookings([]); // Ryd bookinger hvis ikke logget ind
      setBookingsLoading(false);
    }
  }, [user?.id, loading, fetchBookings]);

  // ========================================
  // 5. REAL-TIME UPDATES - Supabase Realtime Subscription
  // ========================================
  // Real-time subscription - opdaterer automatisk ved ændringer
  useEffect(() => {
    if (!supabase || !user?.id) return;
    const channel = supabase
      .channel('bookings-changes')
      .on('postgres_changes', { 
        event: '*', // Lytter til alle events
        schema: 'public', 
        table: 'bookings', 
        filter: `user_id=eq.${user.id}` // Kun denne brugers bookinger
      }, fetchBookings) // Opdater ved ændring
      .subscribe();
    
    return () => {
      if (supabase) {
        supabase.removeChannel(channel); // Ryd op ved unmount
      }
    };
  }, [user?.id, fetchBookings]);

  // ========================================
  // 6. FILTERING - Filtrerer bookinger baseret på søgning og dato
  // ========================================
  // Filtrer bookinger baseret på søgning og dato
  const filteredBookings = allBookings.filter(b => 
    matchesSearch(b, searchValue) && matchesDate(b, dateValue)
  );

  // ========================================
  // 7. EVENT HANDLERS - Håndterer brugerinteraktioner
  // ========================================
  
  // Åbner cancel modal
  const handleCancelBooking = useCallback((bookingId: string) => {
    const booking = allBookings.find(b => b.id === bookingId);
    if (booking) {
      setSelectedBooking(booking); // Gem valgt booking
      setCancelModalOpened(true); // Åbn modal
    }
  }, [allBookings]);

  // Åbner edit modal
  const handleEditBooking = useCallback((bookingId: string) => {
    const booking = allBookings.find(b => b.id === bookingId);
    if (booking) {
      setSelectedBooking(booking); // Gem valgt booking
      setEditModalOpened(true); // Åbn modal
    }
  }, [allBookings]);

  // ========================================
  // 8. CANCEL BOOKING - Sletter booking fra databasen
  // ========================================
  // Sletter booking fra databasen
  const handleConfirmCancel = async () => {
    if (!selectedBooking || !supabase) return;
    setCancelLoading(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .delete() // Slet booking
        .eq('id', selectedBooking.id);
      
      if (error) throw error;
      
      setAllBookings(prev => prev.filter(b => b.id !== selectedBooking.id)); // Fjern fra state
      setCancelModalOpened(false); // Luk modal
      setSelectedBooking(null);
    } catch (err: unknown) {
      setBookingsError(err instanceof Error ? err.message : 'Kunne ikke aflyse booking');
    } finally {
      setCancelLoading(false);
    }
  };

  // ========================================
  // 9. EDIT BOOKING - Opdaterer booking tidspunkt i databasen
  // ========================================
  // Opdaterer booking tidspunkt
  const handleConfirmEdit = async (bookingId: string, newStartTime: string, newEndTime: string) => {
    if (!selectedBooking || !supabase) return;
    setEditLoading(true);
    setEditSuccess(false);
    setBookingsError(null);
    try {
      const originalBooking = allBookings.find(b => b.id === bookingId);
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
      
      // Opdater lokal state
      setAllBookings(prev => prev.map(b => 
        b.id === bookingId 
          ? { ...b, tid: `${newStartTime}-${newEndTime}` } 
          : b
      ));
      
      setEditSuccess(true);
      setTimeout(() => {
        setEditModalOpened(false); // Luk modal efter 1.5 sek
        setSelectedBooking(null);
        setEditSuccess(false);
      }, 1500);
    } catch (err: unknown) {
      setBookingsError(err instanceof Error ? err.message : 'Kunne ikke opdatere booking');
    } finally {
      setEditLoading(false);
    }
  };

  // ========================================
  // 10. LOADING STATE - Viser loader mens data hentes
  // ========================================
  // Vis loader mens data hentes
  if (loading || bookingsLoading) {
    return (
      <Container size="xl" py="xl">
        <Center><Loader size="lg" /></Center>
      </Container>
    );
  }

  // ========================================
  // 11. ERROR STATE - Viser fejlbesked hvis noget går galt
  // ========================================
  // Vis fejlbesked hvis noget går galt
  if (bookingsError) {
    return (
      <Container size="xl" py="xl">
        <Paper p="md" withBorder>
          <Text c="red">{bookingsError}</Text>
        </Paper>
      </Container>
    );
  }

  // ========================================
  // 12. AVATAR LOGIK - Bestemmer hvilket avatar der skal vises
  // ========================================
  // Bestem avatar baseret på bruger navn
  const headerAvatarSrc = user?.name?.toLowerCase().includes('louise') 
    ? louiseAvatar.src 
    : user?.avatarUrl || '/img/frederik.png';

  // ========================================
  // 13. UI RENDERING - Hovedkomponenten der vises
  // ========================================
  return (
    <Container size="xl" py="xl">
      {/* Header med titel og brugerinfo */}
      <BookingsHeader 
        user={user} 
        totalBookings={allBookings.length} 
        avatarSrc={headerAvatarSrc} 
      />

      {/* Søge- og datofilter */}
      <BookingsFilter
        dateValue={dateValue}
        onDateChange={setDateValue}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        isMounted={isMounted}
      />

      {/* Tabel overskrifter */}
      <BookingsTableHeader />

      {/* Vis bookinger eller empty state */}
      {filteredBookings.length === 0 ? (
        <BookingsEmptyState 
          hasBookings={allBookings.length > 0} // Har bookinger men filtreret væk
          hasDateFilter={dateValue !== null} 
        />
      ) : (
        <Stack gap="md">
          {filteredBookings.map(booking => (
            <BookingRow 
              key={booking.id} 
              booking={booking} 
              onCancel={handleCancelBooking} // Åbner cancel modal
              onEdit={handleEditBooking} // Åbner edit modal
            />
          ))}
        </Stack>
      )}

      {/* Cancel modal */}
      <CancelBookingModal 
        opened={cancelModalOpened} 
        onClose={() => { 
          setCancelModalOpened(false); 
          setSelectedBooking(null); 
        }}
        booking={selectedBooking}
        onConfirm={handleConfirmCancel} // Sletter booking
        loading={cancelLoading}
      />
      
      {/* Edit modal */}
      <EditBookingModal
        opened={editModalOpened}
        onClose={() => { 
          setEditModalOpened(false); 
          setSelectedBooking(null); 
          setEditSuccess(false); 
        }}
        booking={selectedBooking}
        onConfirm={handleConfirmEdit} // Opdaterer booking
        loading={editLoading}
        error={bookingsError}
        success={editSuccess}
      />
    </Container>
  );
}
