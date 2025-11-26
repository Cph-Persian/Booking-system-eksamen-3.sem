// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { SimpleGrid, Text, Container, Alert, Loader, Center } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { supabase } from './lib/supabaseClient';
import LokaleCard from './components/lokaleCards/cards';

type Room = {
  id: string;
  name: string;
  status: string | null;
  status_color: string | null;
  description: string | null;
  image_url: string | null;
  type?: string | null;
  capacity?: number | null;
};

export default function Home() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRooms = async () => {
      if (!supabase) {
        setError('Supabase er ikke konfigureret. Tjek dine environment variabler i .env.local');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('rooms')
          .select('*')
          .order('name', { ascending: true });

        if (fetchError) {
          console.error('Fejl ved hentning af rooms:', fetchError.message);
          setError(`Fejl ved hentning af lokaler: ${fetchError.message}`);
        } else if (data) {
          setRooms(data as Room[]);
          setError(null);
        } else {
          setRooms([]);
        }
      } catch (err) {
        console.error('Uventet fejl:', err);
        setError('En uventet fejl opstod ved hentning af lokaler');
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();

    // Opsæt real-time subscription for at opdatere automatisk
    if (supabase) {
      const channel = supabase
        .channel('rooms-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'rooms'
          },
          () => {
            // Genhent data når der er ændringer
            fetchRooms();
          }
        )
        .subscribe();

      return () => {
        if (supabase) {
          supabase.removeChannel(channel);
        }
      };
    }
  }, []);

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Center>
          <Loader size="lg" />
          <Text ml="md">Henter lokaler…</Text>
        </Center>
      </Container>
    );
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
    <Container size="xl" py="xl">
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
        {rooms.map((room) => (
          <LokaleCard
            key={room.id}
            title={room.name}
            status={room.status ?? 'Ukendt'}
            statusColor={room.status_color ?? 'gray'}
            description={room.description ?? ''}
            imageUrl={room.image_url ?? ''}
          />
        ))}
      </SimpleGrid>
    </Container>
  );
}
