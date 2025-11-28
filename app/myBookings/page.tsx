// app/myBookings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Container, Title, Paper, Text, Group, Stack, Avatar, TextInput, Loader, Center } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconChevronDown, IconCalendar } from '@tabler/icons-react';
import '@mantine/dates/styles.css';
import { useUser } from '../contexts/UserContext';
import { CancelBookingModal } from '../components/myBookings/CancelBookingModal';
import { BookingRow } from '../components/myBookings/BookingRow';

type Booking = {
  id: string;
  lokale: string;
  type: string;
  dato: string;
  tid: string;
  udstyr: string;
};

// Hjælpefunktion: Tjek om booking matcher valgt dato
function matchesDate(booking: Booking, dateValue: Date | null): boolean {
  if (!dateValue) return true;
  
  const monthNames = 
  ['januar', 'februar', 'marts', 'april', 'maj', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'december'];
  const day = dateValue.getDate();
  const month = monthNames[dateValue.getMonth()];
  
  return booking.dato.includes(`${day}.`) && booking.dato.toLowerCase().includes(month);
}

// Hjælpefunktion: Tjek om booking matcher søgetekst
function matchesSearch(booking: Booking, searchValue: string): boolean {
  if (!searchValue) return true;
  const search = searchValue.toLowerCase();
  return booking.lokale.toLowerCase().includes(search) ||
         booking.type.toLowerCase().includes(search) ||
         booking.udstyr.toLowerCase().includes(search);
}

export default function BookingPage() {
  const { user, loading } = useUser();
  const [searchValue, setSearchValue] = useState('');
  const [dateValue, setDateValue] = useState<Date | null>(null);
  const [cancelModalOpened, setCancelModalOpened] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Sikrer at vi kun renderer på klienten (fixer hydration fejl)
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const [allBookings, setAllBookings] = useState<Booking[]>([
    { id: '1', lokale: '3.5', type: 'Klasselokale', dato: '25. December, 2025', tid: '13:00-15:00', udstyr: 'Skærm' },
    { id: '2', lokale: '3.9', type: 'Klasselokale', dato: '25. December, 2025', tid: '13:00-15:00', udstyr: 'Skærm' },
    { id: '3', lokale: '3.12', type: 'Klasselokale', dato: '25. December, 2025', tid: '13:00-15:00', udstyr: 'Skærm' },
    { id: '4', lokale: '310', type: 'Klasselokale', dato: '25. December, 2025', tid: '13:00-15:00', udstyr: 'Skærm' },
    { id: '5', lokale: '2.1', type: 'Mødelokale', dato: '26. December, 2025', tid: '10:00-12:00', udstyr: 'Projektor' },
    { id: '6', lokale: '4.3', type: 'Klasselokale', dato: '27. December, 2025', tid: '14:00-16:00', udstyr: 'Whiteboard' },
    { id: '7', lokale: '1.5', type: 'Klasselokale', dato: '26. November, 2025', tid: '09:00-11:00', udstyr: 'Skærm' },
  ]);
  
  // Filtrer bookinger baseret på søgning og dato
  const filteredBookings = allBookings.filter(booking => 
    matchesSearch(booking, searchValue) && matchesDate(booking, dateValue)
  );

  const handleCancelBooking = (bookingId: string) => {
    setAllBookings(allBookings.filter(b => b.id !== bookingId));
    setCancelModalOpened(true);
  };

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Center><Loader size="lg" /></Center>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      {/* Header */}
      <Paper p="lg" mb="md" bg="gray.0" radius="md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title order={1} size="h1" fw={700} c="#043055">Mine bookinger</Title>
        <Group gap="sm">
          <Avatar src={user?.avatarUrl || '/img/frederik.png'} radius="xl" size="md" alt={user?.name || 'Bruger'} />
          <Text fw={700} size="md">{user?.name || 'Ikke logget ind'}</Text>
          <IconChevronDown size={16} />
        </Group>
      </Paper>

      {/* Søgning og filtrering */}
      <Paper p="md" mb="md" bg="white" radius="md" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {isClient ? (
          <DatePickerInput
            leftSection={<IconCalendar size={16} />}
            placeholder="Vælg dato"
            value={dateValue}
            onChange={(value) => setDateValue(value as Date | null)}
            rightSection={<IconChevronDown size={16} />}
            style={{ flex: 1, maxWidth: '200px' }}
            suppressHydrationWarning
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
        <div style={{ width: '100px' }}></div>
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
            <BookingRow key={booking.id} booking={booking} onCancel={handleCancelBooking} />
          ))}
        </Stack>
      )}

      {/* Modal */}
      <CancelBookingModal opened={cancelModalOpened} onClose={() => setCancelModalOpened(false)} />
    </Container>
  );
}
