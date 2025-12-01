// app/myBookings/page.tsx
'use client';

/**
 * Mine Bookinger Side
 * 
 * Denne side viser alle brugerens bookinger og giver mulighed for at:
 * - Søge efter bookinger
 * - Filtrere efter dato
 * - Redigere bookinger
 * - Aflyse bookinger
 */

import { useState, useEffect } from 'react';
import { Container, Title, Paper, Text, Group, Stack, Avatar, TextInput, Loader, Center } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconChevronDown, IconCalendar } from '@tabler/icons-react';
import '@mantine/dates/styles.css';
import { useUser } from '../contexts/UserContext';
import { CancelBookingModal } from '../components/myBookings/CancelBookingModal';
import { EditBookingModal } from '../components/myBookings/EditBookingModal';
import { BookingRow } from '../components/myBookings/BookingRow';
import { Booking } from '../components/myBookings/types';

/**
 * Tjekker om en booking matcher den valgte dato
 * 
 * @param booking - Booking'en der skal tjekkes
 * @param dateValue - Den valgte dato (eller null hvis ingen dato valgt)
 * @returns true hvis booking matcher datoen, eller hvis ingen dato er valgt
 */
function matchesDate(booking: Booking, dateValue: Date | null): boolean {
  // Hvis ingen dato er valgt, vis alle bookinger
  if (!dateValue) return true;
  
  // Sikrer at dateValue er et Date objekt
  // Hvis det ikke er det, prøv at konvertere det
  let date: Date;
  if (dateValue instanceof Date) {
    date = dateValue;
  } else {
    // Hvis det ikke er et Date objekt, prøv at konvertere det
    date = new Date(dateValue);
    // Hvis konvertering fejler, vis alle bookinger
    if (isNaN(date.getTime())) return true;
  }
  
  // Månedsnavne på dansk
  const monthNames = 
  ['januar', 'februar', 'marts', 'april', 'maj', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'december'];
  
  // Hent dag og måned fra den valgte dato
  const day = date.getDate();                    // Dag (fx 25)
  const month = monthNames[date.getMonth()];     // Måned (fx "december")
  
  // Tjek om booking datoen indeholder både dagen og måneden
  return booking.dato.includes(`${day}.`) && booking.dato.toLowerCase().includes(month);
}

/**
 * Tjekker om en booking matcher søgeteksten
 * 
 * @param booking - Booking'en der skal tjekkes
 * @param searchValue - Søgeteksten brugeren har indtastet
 * @returns true hvis booking matcher søgeteksten, eller hvis søgeteksten er tom
 */
function matchesSearch(booking: Booking, searchValue: string): boolean {
  // Hvis ingen søgetekst, vis alle bookinger
  if (!searchValue) return true;
  
  // Konverter søgetekst til små bogstaver for sammenligning
  const search = searchValue.toLowerCase();
  
  // Tjek om søgeteksten findes i lokale, type eller udstyr
  return booking.lokale.toLowerCase().includes(search) ||
         booking.type.toLowerCase().includes(search) ||
         booking.udstyr.toLowerCase().includes(search);
}

export default function BookingPage() {
  // Hent bruger information fra UserContext
  const { user, loading } = useUser();
  
  // State (tilstand) - gemmer værdier der kan ændres
  const [searchValue, setSearchValue] = useState('');              // Søgetekst brugeren indtaster
  const [dateValue, setDateValue] = useState<Date | null>(null);  // Valgt dato fra date picker
  const [cancelModalOpened, setCancelModalOpened] = useState(false);  // Om aflys modal er åben
  const [editModalOpened, setEditModalOpened] = useState(false);     // Om rediger modal er åben
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);  // Den booking der er valgt til redigering/aflysning
  const [isClient, setIsClient] = useState(false);                 // Om vi er på klienten (til hydration fix)

  // Sikrer at vi kun renderer på klienten (fixer hydration fejl med DatePicker)
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Liste af alle bookinger (normalt ville dette komme fra en database)
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
  // Kun bookinger der matcher både søgetekst OG dato vises
  const filteredBookings = allBookings.filter(booking => 
    matchesSearch(booking, searchValue) && matchesDate(booking, dateValue)
  );

  /**
   * Håndterer når brugeren klikker "Aflys" på en booking
   * Finder booking'en og åbner aflys modal'en
   */
  const handleCancelBooking = (bookingId: string) => {
    const booking = allBookings.find(b => b.id === bookingId);
    if (booking) {
      setSelectedBooking(booking);        // Gem booking'en der skal aflyses
      setCancelModalOpened(true);         // Åbn aflys modal
    }
  };

  /**
   * Håndterer når brugeren klikker "Rediger" på en booking
   * Finder booking'en og åbner rediger modal'en
   */
  const handleEditBooking = (bookingId: string) => {
    const booking = allBookings.find(b => b.id === bookingId);
    if (booking) {
      setSelectedBooking(booking);       // Gem booking'en der skal redigeres
      setEditModalOpened(true);           // Åbn rediger modal
    }
  };

  /**
   * Håndterer når brugeren bekræfter aflysning af en booking
   * Fjerner booking'en fra listen og lukker modal'en
   */
  const handleConfirmCancel = () => {
    if (selectedBooking) {
      // Fjern booking fra listen ved at filtrere den væk
      setAllBookings(prevBookings => prevBookings.filter(b => b.id !== selectedBooking.id));
      // Luk modal og nulstil selected booking
      setCancelModalOpened(false);
      setSelectedBooking(null);
    }
  };

  /**
   * Håndterer når brugeren bekræfter redigering af en booking
   * Opdaterer booking'en med de nye tider og lukker modal'en
   */
  const handleConfirmEdit = (bookingId: string, newStartTime: string, newEndTime: string) => {
    // Opdater booking'en med nye tider
    // Vi bruger map til at finde den rigtige booking og opdatere den
    setAllBookings(prevBookings =>
      prevBookings.map(booking =>
        booking.id === bookingId
          ? { ...booking, tid: `${newStartTime}-${newEndTime}` }  // Opdater tid med nye værdier
          : booking                                                // Behold andre bookinger uændret
      )
    );
    // Luk modal og nulstil selected booking
    setEditModalOpened(false);
    setSelectedBooking(null);
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
            onChange={(value) => {
              // DatePickerInput returnerer Date | null, så vi kan bare sætte værdien direkte
              // Men vi sikrer os at det er et Date objekt eller null
              setDateValue(value as Date | null);
            }}
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

      {/* Modals */}
      <CancelBookingModal 
        opened={cancelModalOpened} 
        onClose={() => {
          setCancelModalOpened(false);
          setSelectedBooking(null);
        }}
        booking={selectedBooking}
        onConfirm={handleConfirmCancel}
      />
      <EditBookingModal
        opened={editModalOpened}
        onClose={() => {
          setEditModalOpened(false);
          setSelectedBooking(null);
        }}
        booking={selectedBooking}
        onConfirm={handleConfirmEdit}
      />
    </Container>
  );
}
