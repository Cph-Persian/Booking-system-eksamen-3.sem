/**
 * EditBookingModal - Modal til redigering af booking tider
 * 
 * Tillader brugeren at ændre start- og sluttidspunkt for en eksisterende booking.
 * Validerer input (halve timer, maks 2 timer varighed) og viser fejl/success beskeder.
 * Normaliserer automatisk tider til halve timer (00 eller 30 minutter).
 */
'use client';

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
  // ========================================
  // 1. STATE MANAGEMENT
  // ========================================
  const [startTime, setStartTime] = useState<string>(''); // Start tidspunkt
  const [endTime, setEndTime] = useState<string>(''); // Slut tidspunkt
  const [localError, setLocalError] = useState<string | null>(null); // Lokal fejlbesked

  // ========================================
  // 2. INITIALIZE TIMES - Sætter tider fra booking når modal åbnes
  // ========================================
  useEffect(() => {
    if (booking?.tid) {
      const [start, end] = booking.tid.split('-'); // Split tid string (fx "13:00-15:00")
      setStartTime(start.trim());
      setEndTime(end.trim());
    }
  }, [booking]);

  // ========================================
  // 3. RESET ON CLOSE - Rydder state når modal lukkes
  // ========================================
  useEffect(() => {
    if (!opened) {
      setStartTime('');
      setEndTime('');
      setLocalError(null);
    }
  }, [opened]);

  if (!booking) return null; // Vis ikke modal hvis ingen booking valgt

  // ========================================
  // 4. TIME NORMALIZATION - Normaliserer tid til halve timer
  // ========================================
  // Konverterer fx "9:5" til "09:30" eller "9:45" til "09:30"
  const normalizeTime = (timeStr: string): string => {
    if (!timeStr) return '';
    const [rawHours, rawMinutes = '0'] = timeStr.split(':');
    const hoursNum = parseInt(rawHours, 10) || 0;
    const minutesNum = parseInt(rawMinutes, 10) || 0;
    const normalizedMinutes = minutesNum < 30 ? 0 : 30; // Rund op/ned til 0 eller 30
    return `${hoursNum.toString().padStart(2, '0')}:${normalizedMinutes.toString().padStart(2, '0')}`;
  };

  // ========================================
  // 5. VALIDATION - Validerer booking input
  // ========================================
  // Tjekker:
  // - Start og slut tid er valgt
  // - Kun halve eller hele timer (00 eller 30 minutter)
  // - Slut tid er efter start tid
  // - Maksimal varighed er 2 timer
  const validateBooking = (): string | null => {
    if (!startTime || !endTime) return 'Vælg både start- og sluttid';
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    if (startMinutes !== 0 && startMinutes !== 30) return 'Starttid skal være i halve timer';
    if (endMinutes !== 0 && endMinutes !== 30) return 'Sluttid skal være i halve timer';
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    if (endTotalMinutes <= startTotalMinutes) return 'Sluttid skal være senere end starttid';
    if (endTotalMinutes - startTotalMinutes > 120) return 'Maksimal varighed er 2 timer';
    return null;
  };

  // ========================================
  // 6. CONFIRM HANDLER - Bekræfter redigering
  // ========================================
  const handleConfirm = () => {
    const validationError = validateBooking();
    if (validationError) {
      setLocalError(validationError); // Vis fejl hvis validering fejler
      return;
    }

    setLocalError(null);
    onConfirm(booking.id, startTime, endTime); // Kalder parent handler med nye tider
  };

  // Kombinerer fejl fra parent og lokal validering
  const displayError = error || localError;
  // Tjekker om input er gyldigt før submit
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

        {/* Success besked - Vises efter succesfuld opdatering */}
        {success && (
          <Alert icon={<IconCheck size={16} />} title="Booking opdateret!" color="green">
            Tiderne er nu opdateret.
          </Alert>
        )}

        {/* Fejlbesked - Vises hvis validering eller opdatering fejler */}
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
              onChange={(e) => setStartTime(e.currentTarget.value)}
              onBlur={() => startTime && setStartTime(normalizeTime(startTime))}
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
              onChange={(e) => setEndTime(e.currentTarget.value)}
              onBlur={() => endTime && setEndTime(normalizeTime(endTime))}
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
