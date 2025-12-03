// app/page.tsx
'use client';

/**
 * Hovedside - Lokale Oversigt
 * 
 * Denne side viser alle tilgængelige lokaler og giver mulighed for at:
 * - Se status for hvert lokale (Ledig, Optaget, Kommende)
 * - Se information om lokaler (beskrivelse, udstyr, kapacitet)
 * - Booke et lokale hurtigt via hurtig booking modal
 * - Få real-time opdateringer når lokaler eller bookinger ændres
 */

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
  // Hent router og bruger information fra context
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  
  // State (tilstand) - gemmer værdier der kan ændres
  const [rooms, setRooms] = useState<Room[]>([]);                    // Liste af alle lokaler fra databasen
  const [bookings, setBookings] = useState<Booking[]>([]);            // Liste af alle bookinger fra databasen
  const [loading, setLoading] = useState(true);                      // Om data stadig loader
  const [error, setError] = useState<string | null>(null);            // Fejlbesked hvis noget går galt
  const [quickBookingModalOpened, setQuickBookingModalOpened] = useState(false);  // Om hurtig booking modal er åben
  const [selectedRoomForQuickBooking, setSelectedRoomForQuickBooking] = useState<Room | null>(null);  // Det lokale der er valgt til hurtig booking

  // Redirect til login hvis bruger ikke er logget ind
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  // Grupper bookinger efter lokale ID (kun fremtidige bookinger)
  const bookingsByRoom = useMemo(() => {
    const grouped: { [roomId: string]: Booking[] } = {};
    const now = new Date();

    // Filtrer og grupper bookinger
    bookings.forEach((booking) => {
      const bookingEnd = new Date(booking.end_time);
      
      // Kun inkluder aktuelle eller fremtidige bookinger
      if (bookingEnd >= now) {
        if (!grouped[booking.room_id]) {
          grouped[booking.room_id] = [];
        }
        grouped[booking.room_id].push(booking);
      }
    });

    // Sorter bookinger for hvert lokale efter start tid
    Object.keys(grouped).forEach((roomId) => {
      grouped[roomId].sort((a, b) => 
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );
    });

    return grouped;
  }, [bookings]);

  // Brug hook'en til at beregne status
  const roomsWithStatus = useRoomAvailability(rooms, bookingsByRoom);

  // Hent data fra databasen
  useEffect(() => {
    if (!supabase) {
      setError('Supabase er ikke konfigureret');
      setLoading(false);
      return;
    }

    const client = supabase;

    const fetchData = async () => {
      try {
        // Hent lokaler og bookinger
        const [roomsResult, bookingsResult] = await Promise.all([
          client.from('rooms').select('*').order('name'),
          client.from('bookings').select('*').order('start_time'),
        ]);

        if (roomsResult.error) {
          setError(`Fejl: ${roomsResult.error.message}`);
        } else {
          setRooms((roomsResult.data as Room[]) || []);
        }

        if (bookingsResult.error) {
          console.error('Fejl ved bookinger:', bookingsResult.error.message);
          setBookings([]);
        } else {
          setBookings((bookingsResult.data as Booking[]) || []);
        }
      } catch (err) {
        setError('Uventet fejl ved hentning af data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Opsæt real-time opdateringer
    const roomsChannel = client
      .channel('rooms-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, fetchData)
      .subscribe();

    const bookingsChannel = client
      .channel('bookings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, fetchData)
      .subscribe();

    return () => {
      client.removeChannel(roomsChannel);
      client.removeChannel(bookingsChannel);
    };
  }, []);

  // Vis loading hvis bruger data loader eller hvis lokaler loader
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

  // Hvis ikke logget ind, vis intet (redirect sker i useEffect)
  if (!user) {
    return null;
  }

  if (error) {
    return (
      <Container size="xl" py="xl">
        <Alert icon={<IconAlertCircle size={16} />} title="Fejl" color="red">
          {error}
        </Alert>
      </Container>
    );
  }

  if (rooms.length === 0) {
    return (
      <Container size="xl" py="xl">
        <Alert title="Ingen lokaler fundet" color="blue">
          Der er ingen lokaler tilgængelige i øjeblikket.
        </Alert>
      </Container>
    );
  }

  /**
   * Håndterer når brugeren klikker "Book lokale" på et lokale kort
   * Åbner hurtig booking modal med det valgte lokale
   * 
   * @param room - Lokalet der skal bookes
   */
  const handleQuickBook = (room: Room) => {
    setSelectedRoomForQuickBooking(room);        // Gem det valgte lokale
    setQuickBookingModalOpened(true);            // Åbn hurtig booking modal
  };

  /**
   * Håndterer når en ny booking er oprettet
   * Genhenter alle bookinger fra databasen for at opdatere listen
   */
  const handleBookingSuccess = async () => {
    if (!supabase) return;
    const { data } = await supabase.from('bookings').select('*').order('start_time');
    if (data) setBookings(data as Booking[]);   // Opdater bookings state med nye data
  };

  return (
    <>
      <Container size="xl" py="xl">
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
