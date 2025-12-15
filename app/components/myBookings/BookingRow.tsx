/**
 * BookingRow - Viser en enkelt booking i listen med detaljer og handlingsknapper
 * 
 * Denne komponent viser booking information (lokale, type, dato, tid, udstyr) og 
 * beregner automatisk varigheden. Brugeren kan redigere eller aflyse booking via knapperne.
 */
import { Paper, Text, Button, Group, Stack } from '@mantine/core';
import { IconClock } from '@tabler/icons-react';
import { Booking } from './types';

interface BookingRowProps {
  booking: Booking;
  onCancel: (id: string) => void;
  onEdit: (id: string) => void;
}

// ========================================
// DURATION CALCULATION - Beregner varighed fra tid string
// ========================================
// Konverterer fx "13:00-15:30" til "2 timer 30 min"
function calculateDuration(timeString: string): string {
  const [start, end] = timeString.split('-');
  if (!start || !end) return '0 min';
  const [startHours, startMinutes] = start.trim().split(':').map(Number);
  const [endHours, endMinutes] = end.trim().split(':').map(Number);
  const durationMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
  if (durationMinutes < 60) return `${durationMinutes} min`;
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  if (minutes === 0) return `${hours} ${hours === 1 ? 'time' : 'timer'}`;
  return `${hours} ${hours === 1 ? 'time' : 'timer'} ${minutes} min`;
}

export function BookingRow({ booking, onCancel, onEdit }: BookingRowProps) {
  // ========================================
  // BOOKING ROW - Viser en enkelt booking i listen
  // ========================================
  // Beregner varighed fra tid string (fx "13:00-15:30" -> "2 timer 30 min")
  const duration = calculateDuration(booking.tid);
  
  return (
    <Paper p="md" bg="gray.1" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      {/* Booking detaljer - Responsive layout med flex */}
      <Text style={{ flex: 1, minWidth: '100px' }}>{booking.lokale}</Text>
      <Text style={{ flex: 1, minWidth: '120px' }}>{booking.type}</Text>
      <Text style={{ flex: 1, minWidth: '180px' }}>{booking.dato}</Text>
      <Stack gap={4} style={{ flex: 1, minWidth: '150px' }}>
        <Text>{booking.tid}</Text>
        {/* Viser varighed med ikon */}
        <Group gap={4}>
          <IconClock size={14} />
          <Text size="xs" c="dimmed">{duration}</Text>
        </Group>
      </Stack>
      <Text style={{ flex: 1, minWidth: '120px' }}>{booking.udstyr}</Text>
      {/* Handlings knapper */}
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

