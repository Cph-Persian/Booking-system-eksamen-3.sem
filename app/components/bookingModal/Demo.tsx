'use client';

import { useState } from 'react';
import { DatePicker, TimeInput } from '@mantine/dates';
import { Button, Modal, Stack, Text } from '@mantine/core';
import '@mantine/dates/styles.css';

interface BookingModalProps {
  opened: boolean;
  onClose: () => void;
}

export function BookingModal({ opened, onClose }: BookingModalProps) {
  const [date, setDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');

  const handleSubmit = () => {
    // Her kan du tilføje logik til at booke lokale
    console.log('Booking:', { 
      date, 
      startTime, 
      endTime 
    });
    onClose();
    // Reset form
    setDate(null);
    setStartTime('');
    setEndTime('');
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Book lokale"
      size="md"
    >
      <Stack gap="md">
        <div>
          <Text size="sm" fw={500} mb={5}>
            Dato <Text component="span" c="red">*</Text>
          </Text>

          <DatePicker
            value={date}
            onChange={(value) => setDate(value as Date | null)}
          />

        </div>

        <div>
          <Text size="sm" fw={500} mb={5}>
            Start tid (valgfri)
          </Text>

          <TimeInput
            placeholder="Vælg start tid"
            value={startTime}
            onChange={(e) => setStartTime(e.currentTarget.value)}
          />

        </div>

        <div>
          <Text size="sm" fw={500} mb={5}>
            Slut tid (valgfri)
          </Text>

          <TimeInput
            placeholder="Vælg slut tid"
            value={endTime}
            onChange={(e) => setEndTime(e.currentTarget.value)}
          />

        </div>

        <Button
          onClick={handleSubmit}
          fullWidth
          mt="md"
          disabled={!date}
        >
          Søg efter lokale
        </Button>
      </Stack>
    </Modal>
  );
}

