// components/myBookings/BookingRow.tsx
// Simpel komponent der viser én booking række

import { Paper, Text, Button, Group, Stack } from '@mantine/core';
import { IconClock } from '@tabler/icons-react';

type Booking = {
  id: string;
  lokale: string;
  type: string;
  dato: string;
  tid: string;
  udstyr: string;
};

interface BookingRowProps {
  booking: Booking;
  onCancel: (id: string) => void;
}

export function BookingRow({ booking, onCancel }: BookingRowProps) {
  return (
    <Paper p="md" bg="gray.1" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Text style={{ flex: 1, minWidth: '100px' }}>{booking.lokale}</Text>
      <Text style={{ flex: 1, minWidth: '120px' }}>{booking.type}</Text>
      <Text style={{ flex: 1, minWidth: '180px' }}>{booking.dato}</Text>
      <Stack gap={4} style={{ flex: 1, minWidth: '150px' }}>
        <Text>{booking.tid}</Text>
        <Group gap={4}>
          <IconClock size={14} />
          <Text size="xs" c="dimmed">2 timer</Text>
        </Group>
      </Stack>
      <Text style={{ flex: 1, minWidth: '120px' }}>{booking.udstyr}</Text>
      <Button color="#043055" size="sm" style={{ width: '100px' }} onClick={() => onCancel(booking.id)}>
        Aflys
      </Button>
    </Paper>
  );
}

