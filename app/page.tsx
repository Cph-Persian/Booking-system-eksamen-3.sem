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
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quickBookingModalOpened, setQuickBookingModalOpened] = useState(false);
  const [selectedRoomForQuickBooking, setSelectedRoomForQuickBooking] = useState<Room | null>(null);

  useEffect(() => {
    if (!userLoading && !user) router.push('/login');
  }, [user, userLoading, router]);

  const bookingsByRoom = useMemo(() => {
    const grouped: { [roomId: string]: Booking[] } = {};
    const now = new Date();
    bookings.forEach(booking => {
      if (new Date(booking.end_time) >= now) {
        if (!grouped[booking.room_id]) grouped[booking.room_id] = [];
        grouped[booking.room_id].push(booking);
      }
    });
    Object.keys(grouped).forEach(roomId => {
      grouped[roomId].sort((a, b) => 
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );
    });
    return grouped;
  }, [bookings]);

  const roomsWithStatus = useRoomAvailability(rooms, bookingsByRoom);

  useEffect(() => {
    if (!supabase) {
      setError('Systemet er ikke konfigureret korrekt. Kontakt venligst support');
      setLoading(false);
      return;
    }

    const supabaseClient = supabase;
    const fetchData = async () => {
      if (!supabaseClient) return;
      try {
        const [roomsResult, bookingsResult] = await Promise.all([
          supabaseClient.from('rooms').select('*').order('name'),
          supabaseClient.from('bookings').select('*').order('start_time'),
        ]);
        if (roomsResult.error) {
          setError('Vi kunne desværre ikke hente lokalerne lige nu. Prøv venligst igen senere');
        } else {
          setRooms((roomsResult.data as Room[]) || []);
        }
        if (bookingsResult.error) {
          setBookings([]);
        } else {
          setBookings((bookingsResult.data as Booking[]) || []);
        }
      } catch (err) {
        setError('Der opstod en uventet fejl ved hentning af data. Prøv venligst igen senere');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    if (!supabaseClient) return;
    const roomsChannel = supabaseClient.channel('rooms-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, fetchData)
      .subscribe();
    const bookingsChannel = supabaseClient.channel('bookings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, fetchData)
      .subscribe();
    return () => {
      supabaseClient.removeChannel(roomsChannel);
      supabaseClient.removeChannel(bookingsChannel);
    };
  }, []);

  const handleQuickBook = (room: Room) => {
    setSelectedRoomForQuickBooking(room);
    setQuickBookingModalOpened(true);
  };

  const handleBookingSuccess = async () => {
    if (!supabase) return;
    const { data } = await supabase.from('bookings').select('*').order('start_time');
    if (data) setBookings(data as Booking[]);
  };

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
