// components/myBookings/EditBookingModal.tsx
'use client';

// Modal til at redigere tiderne på en booking
import { useState, useEffect } from 'react';
import { Modal, Text, Button, Stack, Group, Alert } from '@mantine/core';
import { TimeInput } from '@mantine/dates';
import { IconClock, IconCheck, IconAlertCircle } from '@tabler/icons-react';
import '@mantine/dates/styles.css';
import { Booking } from './types';
import { formatRoomInfo } from './utils';

interface EditBookingModalProps {
  opened: boolean;
  onClose: () => void;
  booking: Booking | null;
  onConfirm: (bookingId: string, newStartTime: string, newEndTime: string) => void;
  loading?: boolean;
  error?: string | null;
  success?: boolean;
}

export function EditBookingModal({ 
  opened, 
  onClose, 
  booking, 
  onConfirm,
  loading = false,
  error = null,
  success = false
}: EditBookingModalProps) {
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [localError, setLocalError] = useState<string | null>(null);

  // Parse tider fra booking når den ændres
  useEffect(() => {
    if (booking?.tid) {
      const [start, end] = booking.tid.split('-');
      setStartTime(start.trim());
      setEndTime(end.trim());
    }
  }, [booking]);

  // Nulstil når modal lukkes
  useEffect(() => {
    if (!opened) {
      setStartTime('');
      setEndTime('');
      setLocalError(null);
    }
  }, [opened]);

  if (!booking) return null;

  // Normaliserer tid til halve timer (00 eller 30)
  const normalizeTime = (timeStr: string): string => {
    if (!timeStr) return '';
    const [rawHours, rawMinutes = '0'] = timeStr.split(':');
    const hoursNum = parseInt(rawHours, 10) || 0;
    const minutesNum = parseInt(rawMinutes, 10) || 0;
    const normalizedMinutes = minutesNum < 30 ? 0 : 30;
    return `${hoursNum.toString().padStart(2, '0')}:${normalizedMinutes.toString().padStart(2, '0')}`;
  };

  // Validerer booking
  const validateBooking = (): string | null => {
    if (!startTime || !endTime) {
      return 'Du skal vælge både start- og sluttid for at opdatere booking';
    }

    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);

    // Tjek halve timer
    if (startMinutes !== 0 && startMinutes !== 30) {
      return 'Starttid skal være i halve timer. Vælg fx 09:00 eller 09:30';
    }
    if (endMinutes !== 0 && endMinutes !== 30) {
      return 'Sluttid skal være i halve timer. Vælg fx 09:00 eller 09:30';
    }

    // Opret Date objekter for at beregne varighed
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;

    if (endTotalMinutes <= startTotalMinutes) {
      return 'Sluttid skal være senere end starttid';
    }

    const durationMinutes = endTotalMinutes - startTotalMinutes;
    if (durationMinutes > 120) {
      return 'Du kan maksimalt booke lokale i 2 timer ad gangen';
    }

    return null;
  };

  const handleConfirm = () => {
    const validationError = validateBooking();
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    setLocalError(null);
    onConfirm(booking.id, startTime, endTime);
  };

  const displayError = error || localError;
  const isValid = startTime && endTime && !validateBooking();

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      withCloseButton
      closeButtonProps={{ 'aria-label': 'Luk' }}
      radius="md"
      size="md"
      title={null}
    >
      <Stack gap="lg" p="lg">
        <Text size="xl" fw={700} style={{ fontSize: '24px' }}>
          Rediger booking
        </Text>

        {success && (
          <Alert icon={<IconCheck size={16} />} title="Booking opdateret!" color="green">
            Tiderne er nu opdateret.
          </Alert>
        )}

        {displayError && (
          <Alert icon={<IconAlertCircle size={16} />} title="Fejl" color="red">
            {displayError}
          </Alert>
        )}

        <Text size="sm" c="dark">
          {formatRoomInfo(booking)}
        </Text>

        <Stack gap="md">
          <div>
            <Text size="sm" fw={500} mb={5}>
              Start tid <Text component="span" c="red">*</Text>
            </Text>
            <TimeInput
              value={startTime}
              onChange={(e) => {
                const value = e.currentTarget.value;
                if (value) {
                  setStartTime(normalizeTime(value));
                } else {
                  setStartTime('');
                }
              }}
              onBlur={() => {
                if (startTime) {
                  setStartTime(normalizeTime(startTime));
                }
              }}
              leftSection={<IconClock size={16} />}
              placeholder="Vælg start tid"
            />
            <Text size="xs" c="dimmed" mt={4}>
              Kun halve eller hele timer (fx 09:00, 09:30)
            </Text>
          </div>

          <div>
            <Text size="sm" fw={500} mb={5}>
              Slut tid <Text component="span" c="red">*</Text>
            </Text>
            <TimeInput
              value={endTime}
              onChange={(e) => {
                const value = e.currentTarget.value;
                if (value) {
                  setEndTime(normalizeTime(value));
                } else {
                  setEndTime('');
                }
              }}
              onBlur={() => {
                if (endTime) {
                  setEndTime(normalizeTime(endTime));
                }
              }}
              leftSection={<IconClock size={16} />}
              placeholder="Vælg slut tid"
            />
            <Text size="xs" c="dimmed" mt={4}>
              Maksimal varighed: 2 timer
            </Text>
          </div>
        </Stack>

        <Group gap="md" mt="md">
          <Button
            color="#043055"
            style={{ flex: 1 }}
            size="md"
            onClick={onClose}
            disabled={loading}
          >
            Nej, gå tilbage
          </Button>
          <Button
            color="#228BE6"
            style={{ flex: 1 }}
            size="md"
            onClick={handleConfirm}
            disabled={!isValid || loading}
            loading={loading}
          >
            {loading ? 'Gemmer...' : 'Ja, rediger'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
