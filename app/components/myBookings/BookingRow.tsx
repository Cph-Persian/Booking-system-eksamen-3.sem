// components/myBookings/BookingRow.tsx
/**
 * BookingRow - Viser én booking række i listen
 * 
 * Denne komponent viser alle detaljer om en booking og giver mulighed
 * for at redigere eller aflyse booking'en.
 */

import { Paper, Text, Button, Group, Stack } from '@mantine/core';
import { IconClock } from '@tabler/icons-react';
import { Booking } from './types';

// Props (egenskaber) som komponenten modtager
interface BookingRowProps {
  booking: Booking;                      // Booking'en der skal vises
  onCancel: (id: string) => void;       // Funktion der kaldes når "Aflys" klikkes
  onEdit: (id: string) => void;          // Funktion der kaldes når "Rediger" klikkes
}

export function BookingRow({ booking, onCancel, onEdit }: BookingRowProps) {
  return (
    <Paper p="md" bg="gray.1" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      {/* Lokale nummer */}
      <Text style={{ flex: 1, minWidth: '100px' }}>{booking.lokale}</Text>
      
      {/* Type lokale */}
      <Text style={{ flex: 1, minWidth: '120px' }}>{booking.type}</Text>
      
      {/* Dato */}
      <Text style={{ flex: 1, minWidth: '180px' }}>{booking.dato}</Text>
      
      {/* Tid og varighed */}
      <Stack gap={4} style={{ flex: 1, minWidth: '150px' }}>
        <Text>{booking.tid}</Text>
        <Group gap={4}>
          <IconClock size={14} />
          <Text size="xs" c="dimmed">2 timer</Text>
        </Group>
      </Stack>
      
      {/* Udstyr */}
      <Text style={{ flex: 1, minWidth: '120px' }}>{booking.udstyr}</Text>
      
      {/* Handlingsknapper */}
      <Group gap="sm" style={{ width: '200px', justifyContent: 'flex-end' }}>
        <Button color="#043055" size="sm" onClick={() => onEdit(booking.id)}>
          Rediger
        </Button>
        <Button color="#043055" size="sm" onClick={() => onCancel(booking.id)}>
          Aflys
        </Button>
      </Group>
    </Paper>
  );
}

