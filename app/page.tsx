/**
 * Home Page - Hovedside der viser alle tilgængelige lokaler
 * 
 * Henter lokaler og bookinger fra Supabase og viser dem i et grid layout.
 * Beregner automatisk status for hvert lokale baseret på eksisterende bookinger.
 * Tillader hurtig booking via QuickBookingModal. Opdaterer data i real-time via Supabase subscriptions.
 * Redirecter til login hvis bruger ikke er autentificeret.
 */
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { SimpleGrid, Text, Container, Alert, Loader, Center } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { supabase } from './lib/supabaseClient';
import LokaleCard from './components/lokaleCards/cards';
import { useRoomAvailability } from './components/useRoomAvailability';
import { QuickBookingModal } from './components/bookingModal/QuickBookingModal';
import { useUser } from './contexts/UserContext';

type Room = {
  id: string;
  name: string;
  status: string | null;
  status_color: string | null;
  description: string | null;
  image_url: string | null;
  type?: string | null;
  capacity?: number | null;
  features?: string | null;
};

type Booking = {
  id: string;
  room_id: string;
  start_time: string;
  end_time: string;
  user_id?: string;
};

export default function Home() {
  // ========================================
  // 1. STATE MANAGEMENT
  // ========================================
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  
  const [rooms, setRooms] = useState<Room[]>([]); // Alle lokaler
  const [bookings, setBookings] = useState<Booking[]>([]); // Alle bookinger
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState<string | null>(null); // Fejlbesked
  const [quickBookingModalOpened, setQuickBookingModalOpened] = useState(false); // Quick booking modal åben/lukket
  const [selectedRoomForQuickBooking, setSelectedRoomForQuickBooking] = useState<Room | null>(null); // Valgt lokale til booking

  // ========================================
  // 2. AUTHENTICATION CHECK - Redirect hvis ikke logget ind
  // ========================================
  useEffect(() => {
    if (!userLoading && !user) router.push('/login'); // Redirect til login hvis ikke logget ind
  }, [user, userLoading, router]);

  // ========================================
  // 3. BOOKINGS GROUPING - Grupperer bookinger efter lokale
  // ========================================
  // Grupperer bookinger efter room_id og filtrerer kun kommende bookinger
  const bookingsByRoom = useMemo(() => {
    const grouped: { [roomId: string]: Booking[] } = {};
    const now = new Date();
    bookings.forEach(booking => {
      if (new Date(booking.end_time) >= now) { // Kun kommende bookinger
        if (!grouped[booking.room_id]) grouped[booking.room_id] = [];
        grouped[booking.room_id].push(booking);
      }
    });
    // Sorter bookinger efter starttidspunkt
    Object.keys(grouped).forEach(roomId => {
      grouped[roomId].sort((a, b) => 
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );
    });
    return grouped;
  }, [bookings]);

  // ========================================
  // 4. ROOM STATUS CALCULATION - Beregner status for hvert lokale
  // ========================================
  // Bruger custom hook til at beregne status baseret på bookinger
  const roomsWithStatus = useRoomAvailability(rooms, bookingsByRoom);

  // ========================================
  // 5. DATA FETCHING - Henter lokaler og bookinger fra Supabase
  // ========================================
  useEffect(() => {
    if (!supabase) {
      setError('Systemet er ikke konfigureret korrekt. Kontakt venligst support');
      setLoading(false);
      return;
    }

    // Henter både lokaler og bookinger parallelt
    const fetchData = async () => {
      if (!supabase) return;
      try {
        // Henter både lokaler og bookinger parallelt for bedre performance
        const [roomsResult, bookingsResult] = await Promise.all([
          supabase.from('rooms').select('*').order('name'),
          supabase.from('bookings').select('*').order('start_time'),
        ]);
        if (roomsResult.error) {
          setError('Kunne ikke hente lokaler');
        } else {
          setRooms((roomsResult.data as Room[]) || []);
        }
        if (!bookingsResult.error && bookingsResult.data) {
          setBookings(bookingsResult.data as Booking[]);
        }
      } catch (err) {
        setError('Fejl ved hentning af data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // ========================================
    // 6. REAL-TIME UPDATES - Supabase Realtime Subscription
    // ========================================
    // Lytter til ændringer i både rooms og bookings tabeller
    const client = supabase;
    if (!client) return;
    // Opretter separate channels for rooms og bookings
    const roomsChannel = client.channel('rooms-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, fetchData)
      .subscribe();
    const bookingsChannel = client.channel('bookings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, fetchData)
      .subscribe();
    
    return () => {
      client.removeChannel(roomsChannel);
      client.removeChannel(bookingsChannel);
    };
  }, []);

  // ========================================
  // 7. EVENT HANDLERS - Håndterer brugerinteraktioner
  // ========================================
  
  // Åbner quick booking modal med valgt lokale
  const handleQuickBook = (room: Room) => {
    setSelectedRoomForQuickBooking(room); // Gem valgt lokale
    setQuickBookingModalOpened(true); // Åbn modal
  };

  // Opdaterer bookinger efter succesfuld booking
  const handleBookingSuccess = async () => {
    if (!supabase) return;
    const { data } = await supabase.from('bookings').select('*').order('start_time');
    if (data) setBookings(data as Booking[]); // Opdater bookings state
  };

  // ========================================
  // 8. LOADING STATE - Viser loader mens data hentes
  // ========================================
  if (userLoading || loading) {
    return (
      <Container size="xl" py="xl">
        <Center>
          <Loader size="lg" />
          <Text ml="md">Henter lokaler…</Text>
        </Center>
      </Container>
    );
  }

  // ========================================
  // 9. AUTHENTICATION CHECK - Returner null hvis ikke logget ind
  // ========================================
  if (!user) {
    return null;
  }

  // ========================================
  // 10. ERROR STATE - Viser fejlbesked hvis noget går galt
  // ========================================
  if (error) {
    return (
      <Container size="xl" py="xl">
        <Alert icon={<IconAlertCircle size={16} />} title="Fejl" color="red">
          {error}
        </Alert>
      </Container>
    );
  }

  // ========================================
  // 11. EMPTY STATE - Viser besked hvis ingen lokaler
  // ========================================
  if (rooms.length === 0) {
    return (
      <Container size="xl" py="xl">
        <Alert title="Ingen lokaler fundet" color="blue">
          Der er ingen lokaler tilgængelige i øjeblikket.
        </Alert>
      </Container>
    );
  }

  // ========================================
  // 12. UI RENDERING - Hovedkomponenten der vises
  // ========================================
  return (
    <>
      <Container size="xl" py="xl">
        {/* Grid layout - Responsive: 1 kolonne på mobil, 2 på tablet, 3 på desktop */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {roomsWithStatus.map((room) => (
            <LokaleCard
              key={room.id}
              title={room.name}
              status={room.computedStatus}
              statusColor={room.statusColor}
              description={room.description ?? ''}
              features={room.features ?? null}
              infoText={room.infoText}
              imageUrl={room.image_url ?? ''}
              roomId={room.id}
              onBookClick={() => handleQuickBook(room)}
            />
          ))}
        </SimpleGrid>
      </Container>

      {/* Quick booking modal - Vises kun hvis lokale er valgt */}
      {selectedRoomForQuickBooking && (
        <QuickBookingModal
          opened={quickBookingModalOpened}
          onClose={() => {
            setQuickBookingModalOpened(false);
            setSelectedRoomForQuickBooking(null);
          }}
          roomId={selectedRoomForQuickBooking.id}
          roomName={selectedRoomForQuickBooking.name}
          roomFeatures={selectedRoomForQuickBooking.features ?? null}
          onBookingSuccess={handleBookingSuccess}
        />
      )}
    </>
  );
}
