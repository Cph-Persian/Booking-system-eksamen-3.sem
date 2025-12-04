// app/myBookings/page.tsx - Mine bookinger side
'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Container, Title, Paper, Text, Group, Stack, Avatar, TextInput, Loader, Center } from '@mantine/core';
import { IconChevronDown, IconCalendar } from '@tabler/icons-react';
import '@mantine/dates/styles.css';

// Dynamic import for at undgå hydration fejl
const DatePickerInput = dynamic(
  () => import('@mantine/dates').then((mod) => mod.DatePickerInput),
  { ssr: false }
);
import { useUser } from '../contexts/UserContext';
import { CancelBookingModal } from '../components/myBookings/CancelBookingModal';
import { EditBookingModal } from '../components/myBookings/EditBookingModal';
import { BookingRow } from '../components/myBookings/BookingRow';
import { Booking } from '../components/myBookings/types';
import { supabase } from '../lib/supabaseClient';
import louiseAvatar from '../img/louise.png';

// Månedsnavne på dansk (bruges til dato formatering)
const MONTH_NAMES = ['januar', 'februar', 'marts', 'april', 'maj', 'juni', 
                     'juli', 'august', 'september', 'oktober', 'november', 'december'];

/**
 * Tjekker om en booking matcher den valgte dato
 */
function matchesDate(booking: Booking, dateValue: Date | null | string): boolean {
  if (!dateValue) return true; // Vis alle hvis ingen dato valgt
  
  // Konverter til Date objekt hvis det ikke allerede er det
  let date: Date;
  if (dateValue instanceof Date) {
    date = dateValue;
  } else if (typeof dateValue === 'string') {
    date = new Date(dateValue);
    if (isNaN(date.getTime())) return true; // Hvis ugyldig dato, vis alle
  } else {
    return true; // Hvis ukendt type, vis alle
  }
  
  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  
  // Tjek om booking datoen indeholder både dagen og måneden
  return booking.dato.includes(`${day}.`) && booking.dato.toLowerCase().includes(month);
}

/**
 * Tjekker om en booking matcher søgeteksten
 */
function matchesSearch(booking: Booking, searchValue: string): boolean {
  if (!searchValue) return true; // Vis alle hvis ingen søgetekst
  
  const search = searchValue.toLowerCase();
  return booking.lokale.toLowerCase().includes(search) ||
         booking.type.toLowerCase().includes(search) ||
         booking.udstyr.toLowerCase().includes(search);
}

/**
 * Formaterer tid fra Date objekt til "HH:MM" format
 */
function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Konverterer en booking fra Supabase format til Booking type
 */
function convertSupabaseBookingToBooking(supabaseBooking: any): Booking {
  const startDate = new Date(supabaseBooking.start_time);
  const endDate = new Date(supabaseBooking.end_time);
  
  // Formater dato: "25. december, 2025"
  const day = startDate.getDate();
  const month = MONTH_NAMES[startDate.getMonth()];
  const year = startDate.getFullYear();
  const formattedDate = `${day}. ${month}, ${year}`;
  
  // Formater tid: "13:00-15:00"
  const formattedTime = `${formatTime(startDate)}-${formatTime(endDate)}`;
  
  // Hent lokale information fra join
  const room = supabaseBooking.rooms;
  
  return {
    id: supabaseBooking.id,
    lokale: room?.name || 'Ukendt lokale',
    type: room?.type || 'Ukendt type',
    dato: formattedDate,
    tid: formattedTime,
    udstyr: room?.features || 'Ingen',
  };
}

export default function BookingPage() {
  const { user, loading } = useUser();
  
  // State variabler
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [dateValue, setDateValue] = useState<Date | null>(null);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [cancelModalOpened, setCancelModalOpened] = useState(false);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);

  // Sikrer at komponenten kun renderes på klienten (fix hydration fejl)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  /**
   * Henter alle bookinger for den aktuelle bruger fra Supabase
   */
  const fetchBookings = useCallback(async () => {
    if (!supabase || !user?.id) {
      setBookingsLoading(false);
      return;
    }

    setBookingsLoading(true);
    setBookingsError(null);

    try {
      // Hent bookinger med join til rooms tabel, filtreret på user_id
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          room_id,
          start_time,
          end_time,
          user_id,
          rooms (id, name, type, features)
        `)
        .eq('user_id', user.id)
        .order('start_time', { ascending: true });

      if (error) throw error;

      // Konverter til Booking type og opdater state
      if (data) {
        const convertedBookings = data.map(convertSupabaseBookingToBooking);
        setAllBookings(convertedBookings);
      }
    } catch (err: any) {
      console.error('Fejl ved hentning af bookinger:', err);
      setBookingsError(err.message || 'Kunne ikke hente bookinger');
      setAllBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  }, [user?.id]);

  // Hent bookinger når bruger er logget ind
  useEffect(() => {
    if (!loading && user?.id) {
      fetchBookings();
    } else if (!loading && !user) {
      setAllBookings([]);
      setBookingsLoading(false);
    }
  }, [user?.id, loading, fetchBookings]);

  // Opsæt real-time opdateringer (opdaterer automatisk når bookinger ændres)
  useEffect(() => {
    if (!supabase || !user?.id) return;

    const channel = supabase
      .channel('bookings-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        fetchBookings(); // Opdater når der sker ændringer
      })
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [user?.id, fetchBookings]);

  // Filtrer bookinger baseret på søgning og dato
  const filteredBookings = allBookings.filter(booking => 
    matchesSearch(booking, searchValue) && matchesDate(booking, dateValue)
  );

  /**
   * Åbner aflys modal med den valgte booking
   */
  const handleCancelBooking = (bookingId: string) => {
    const booking = allBookings.find(b => b.id === bookingId);
    if (booking) {
      setSelectedBooking(booking);
      setCancelModalOpened(true);
    }
  };

  /**
   * Åbner rediger modal med den valgte booking
   */
  const handleEditBooking = (bookingId: string) => {
    const booking = allBookings.find(b => b.id === bookingId);
    if (booking) {
      setSelectedBooking(booking);
      setEditModalOpened(true);
    }
  };

  // Sletter booking fra Supabase
  const handleConfirmCancel = async () => {
    if (!selectedBooking || !supabase) return;

    setCancelLoading(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', selectedBooking.id);

      if (error) throw error;

      setAllBookings(prevBookings => prevBookings.filter(b => b.id !== selectedBooking.id));
      setCancelModalOpened(false);
      setSelectedBooking(null);
    } catch (err: any) {
      console.error('Fejl ved aflysning af booking:', err);
      setBookingsError(err.message || 'Kunne ikke aflyse booking');
    } finally {
      setCancelLoading(false);
    }
  };

  // Opdaterer booking i Supabase med nye tider
  const handleConfirmEdit = async (bookingId: string, newStartTime: string, newEndTime: string) => {
    if (!selectedBooking || !supabase) return;

    setEditLoading(true);
    setEditSuccess(false);
    setBookingsError(null);

    try {
      const originalBooking = allBookings.find(b => b.id === bookingId);
      if (!originalBooking) throw new Error('Booking ikke fundet');

      const dateMatch = originalBooking.dato.match(/(\d+)\.\s*(\w+),\s*(\d+)/);
      if (!dateMatch) throw new Error('Kunne ikke parse dato');

      const day = parseInt(dateMatch[1]);
      const monthIndex = MONTH_NAMES.findIndex(m => m.toLowerCase() === dateMatch[2].toLowerCase());
      const year = parseInt(dateMatch[3]);

      if (monthIndex === -1) throw new Error('Ugyldig måned');

      const [startHours, startMinutes] = newStartTime.split(':').map(Number);
      const [endHours, endMinutes] = newEndTime.split(':').map(Number);
      const newStartDateTime = new Date(year, monthIndex, day, startHours, startMinutes);
      const newEndDateTime = new Date(year, monthIndex, day, endHours, endMinutes);

      const { error } = await supabase
        .from('bookings')
        .update({
          start_time: newStartDateTime.toISOString(),
          end_time: newEndDateTime.toISOString(),
        })
        .eq('id', bookingId);

      if (error) throw error;

      setAllBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.id === bookingId
            ? { ...booking, tid: `${newStartTime}-${newEndTime}` }
            : booking
        )
      );

      setEditSuccess(true);
      setTimeout(() => {
        setEditModalOpened(false);
        setSelectedBooking(null);
        setEditSuccess(false);
      }, 1500);
    } catch (err: any) {
      console.error('Fejl ved redigering af booking:', err);
      setBookingsError(err.message || 'Kunne ikke redigere booking');
    } finally {
      setEditLoading(false);
    }
  };

  // Vis loading mens data hentes
  if (loading || bookingsLoading) {
    return (
      <Container size="xl" py="xl">
        <Center><Loader size="lg" /></Center>
      </Container>
    );
  }

  // Vis fejl hvis der opstod en fejl
  if (bookingsError) {
    return (
      <Container size="xl" py="xl">
        <Paper p="md" withBorder>
          <Text c="red">{bookingsError}</Text>
        </Paper>
      </Container>
    );
  }

  // Vælg profilbillede afhængigt af bruger (samme logik som i UserButton)
  const headerAvatarSrc = (() => {
    const name = user?.name?.toLowerCase() || '';
    if (name.includes('louise')) {
      return louiseAvatar.src;
    }
    return user?.avatarUrl || '/img/frederik.png';
  })();

  return (
    <Container size="xl" py="xl">
      {/* Header med bruger info */}
      <Paper p="lg" mb="md" bg="gray.0" radius="md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title order={1} size="h1" fw={700} c="#043055">Mine bookinger</Title>
          <Text size="sm" c="dimmed" mt={4}>
            {allBookings.length === 0 
              ? 'Du har ingen bookinger' 
              : `Du har ${allBookings.length} ${allBookings.length === 1 ? 'booking' : 'bookinger'}`}
          </Text>
        </div>
        <Group gap="sm">
          <Avatar src={headerAvatarSrc} radius="xl" size="md" alt={user?.name || 'Bruger'} />
          <Text fw={700} size="md">{user?.name || 'Ikke logget ind'}</Text>
        </Group>
      </Paper>

      {/* Søgning og filtrering */}
      <Paper p="md" mb="md" bg="white" radius="md" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {isMounted ? (
          <DatePickerInput
            leftSection={<IconCalendar size={16} />}
            placeholder="Vælg dato"
            value={dateValue}
            onChange={(value) => setDateValue(value as Date | null)}
            rightSection={<IconChevronDown size={16} />}
            style={{ flex: 1, maxWidth: '200px' }}
          />
        ) : (
          <TextInput
            leftSection={<IconCalendar size={16} />}
            placeholder="Vælg dato"
            rightSection={<IconChevronDown size={16} />}
            style={{ flex: 1, maxWidth: '200px' }}
            readOnly
          />
        )}
        <TextInput 
          placeholder="Søg i lokale, type eller udstyr..." 
          value={searchValue} 
          onChange={(e) => setSearchValue(e.currentTarget.value)} 
          style={{ flex: 1 }} 
        />
      </Paper>

      {/* Tabel header */}
      <Paper p="md" mb="md" bg="gray.0" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Text fw={600} style={{ flex: 1, minWidth: '100px' }}>Lokale</Text>
        <Text fw={600} style={{ flex: 1, minWidth: '120px' }}>Type</Text>
        <Text fw={600} style={{ flex: 1, minWidth: '180px' }}>Dato</Text>
        <Text fw={600} style={{ flex: 1, minWidth: '150px' }}>Tid</Text>
        <Text fw={600} style={{ flex: 1, minWidth: '120px' }}>Udstyr</Text>
        <div style={{ width: '200px' }}></div>
      </Paper>

      {/* Booking liste */}
      {filteredBookings.length === 0 ? (
        <Text c="dimmed" size="lg" mt="xl">
          {allBookings.length === 0 
            ? 'Du har ingen bookinger endnu.' 
            : dateValue 
              ? 'Der er ingen bookinger for denne dato.'
              : 'Ingen bookinger matcher dine søgekriterier.'}
        </Text>
      ) : (
        <Stack gap="md">
          {filteredBookings.map(booking => (
            <BookingRow 
              key={booking.id} 
              booking={booking} 
              onCancel={handleCancelBooking}
              onEdit={handleEditBooking}
            />
          ))}
        </Stack>
      )}

      {/* Modals til aflysning og redigering */}
      <CancelBookingModal 
        opened={cancelModalOpened} 
        onClose={() => {
          setCancelModalOpened(false);
          setSelectedBooking(null);
        }}
        booking={selectedBooking}
        onConfirm={handleConfirmCancel}
        loading={cancelLoading}
      />
      <EditBookingModal
        opened={editModalOpened}
        onClose={() => {
          setEditModalOpened(false);
          setSelectedBooking(null);
          setEditSuccess(false);
        }}
        booking={selectedBooking}
        onConfirm={handleConfirmEdit}
        loading={editLoading}
        error={bookingsError}
        success={editSuccess}
      />
    </Container>
  );
}
