/**
 * BookingsFilter - Søge- og datofilter komponent til booking listen
 * 
 * Giver brugeren mulighed for at filtrere bookinger efter dato og søge i lokale, type eller udstyr.
 * DatePicker loades dynamisk for at undgå hydration fejl ved server-side rendering.
 */
'use client';

import { Paper, TextInput } from '@mantine/core';
import { IconCalendar, IconChevronDown } from '@tabler/icons-react';
import dynamic from 'next/dynamic';

const DatePickerInput = dynamic(
  () => import('@mantine/dates').then((mod) => mod.DatePickerInput),
  { ssr: false }
);

interface BookingsFilterProps {
  dateValue: Date | null;
  onDateChange: (value: Date | null) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  isMounted: boolean;
}

export function BookingsFilter({ 
  dateValue, 
  onDateChange, 
  searchValue, 
  onSearchChange, 
  isMounted 
}: BookingsFilterProps) {
  // ========================================
  // BOOKINGS FILTER - Søge- og datofilter komponent
  // ========================================
  // DatePickerInput loades dynamisk for at forhindre hydration fejl
  return (
    <Paper p="md" mb="md" bg="white" radius="md" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      {/* DatePicker - Vises kun efter mount for at undgå hydration fejl */}
      {isMounted ? (
        <DatePickerInput
          leftSection={<IconCalendar size={16} />}
          placeholder="Vælg dato"
          value={dateValue}
          onChange={(value) => onDateChange(value as Date | null)}
          rightSection={<IconChevronDown size={16} />}
          style={{ flex: 1, maxWidth: '200px' }}
        />
      ) : (
        // Placeholder indtil komponenten er mounted
        <TextInput
          leftSection={<IconCalendar size={16} />}
          placeholder="Vælg dato"
          rightSection={<IconChevronDown size={16} />}
          style={{ flex: 1, maxWidth: '200px' }}
          readOnly
        />
      )}
      {/* Søge input - Filtrerer bookinger baseret på tekst */}
      <TextInput 
        placeholder="Søg i lokale, type eller udstyr..." 
        value={searchValue} 
        onChange={(e) => onSearchChange(e.currentTarget.value)} 
        style={{ flex: 1 }} 
      />
    </Paper>
  );
}

