/**
 * QuickBookingModal - Hurtig booking modal til at booke et lokale for i dag
 * 
 * Tillader brugeren at booke et lokale hurtigt ved at vælge start- og sluttid.
 * Validerer booking (halve timer, maks 2 timer, ingen overlap) og opretter booking i Supabase.
 * Henter eksisterende bookinger for i dag for at tjekke for konflikter.
 */
'use client';

import { useState, useEffect } from 'react';
import { TimeInput } from '@mantine/dates';
import { Button, Modal, Stack, Text, Alert, Group, Badge, Divider, Box } from '@mantine/core';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import '@mantine/dates/styles.css';
import { supabase } from '../../lib/supabaseClient';
import { getFeatureIcon } from '../../utils/featureIcons';
import { timeStringToDate, normalizeTime } from '../../utils/bookingUtils';

type Room = {
  id: string;
  name: string;
  description: string | null;
  capacity: number | null;
  features?: string | null;
};

type Booking = {
  id: string;
  room_id: string;
  start_time: string;
  end_time: string;
};

interface QuickBookingModalProps {
  opened: boolean;
  onClose: () => void;
  roomId: string;
  roomName: string;
  roomFeatures?: string | null;
  onBookingSuccess?: () => void;
}

export function QuickBookingModal({ 
  opened, 
  onClose, 
  roomId, 
  roomName,
  roomFeatures,
  onBookingSuccess 
}: QuickBookingModalProps) {
  // ========================================
  // 1. STATE MANAGEMENT
  // ========================================
  const [startTime, setStartTime] = useState<string>(''); // Start tidspunkt
  const [endTime, setEndTime] = useState<string>(''); // Slut tidspunkt
  const [bookings, setBookings] = useState<Booking[]>([]); // Eksisterende bookinger for i dag
  const [submitting, setSubmitting] = useState(false); // Loading state ved submit
  const [error, setError] = useState<string | null>(null); // Fejlbesked
  const [success, setSuccess] = useState(false); // Success besked

  // ========================================
  // 2. FETCH EXISTING BOOKINGS - Henter eksisterende bookinger for i dag
  // ========================================
  useEffect(() => {
    if (!opened || !supabase) {
      setBookings([]);
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    supabase.from('bookings').select('*')
      .eq('room_id', roomId)
      .gte('start_time', today.toISOString())
      .lte('start_time', endOfDay.toISOString())
      .then(({ data }) => data && setBookings(data as Booking[]));
  }, [opened, roomId]);

  // ========================================
  // 3. VALIDATION - Validerer booking input
  // ========================================
  // Tjekker:
  // - Start og slut tid er valgt
  // - Slut tid er efter start tid
  // - Kun halve eller hele timer (00 eller 30 minutter)
  // - Maksimal varighed er 2 timer
  // - Kan ikke booke i fortiden
  // - Ingen overlap med eksisterende bookinger
  const validateBooking = (): string | null => {
    if (!startTime || !endTime) return 'Vælg både start- og sluttid';
    const today = new Date();
    const startDateTime = timeStringToDate(startTime, today);
    const endDateTime = timeStringToDate(endTime, today);
    if (!startDateTime || !endDateTime) return 'Ugyldig tid';
    if (endDateTime <= startDateTime) return 'Sluttid skal være efter starttid';
    const [, startMinutes] = startTime.split(':').map(Number);
    const [, endMinutes] = endTime.split(':').map(Number);
    if ((startMinutes !== 0 && startMinutes !== 30) || (endMinutes !== 0 && endMinutes !== 30)) {
      return 'Kun halve eller hele timer';
    }
    const durationMinutes = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60);
    if (durationMinutes > 120) return 'Maksimal varighed er 2 timer';
    if (startDateTime < new Date()) return 'Kan ikke booke i fortiden';
    const hasOverlap = bookings.some(b => {
      const bs = new Date(b.start_time);
      const be = new Date(b.end_time);
      return (startDateTime >= bs && startDateTime < be) ||
             (endDateTime > bs && endDateTime <= be) ||
             (startDateTime <= bs && endDateTime >= be);
    });
    return hasOverlap ? 'Lokalet er allerede booket' : null;
  };

  // ========================================
  // 4. SUBMIT HANDLER - Opretter booking i Supabase
  // ========================================
  const handleSubmit = async () => {
    setError(null);
    setSuccess(false);
    const validationError = validateBooking();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!supabase) return;
    setSubmitting(true);
    try {
      const today = new Date();
      const startDateTime = timeStringToDate(startTime, today);
      const endDateTime = timeStringToDate(endTime, today);
      if (!startDateTime || !endDateTime) {
        setError('Ugyldig tid');
        setSubmitting(false);
        return;
      }
      // Henter bruger ID fra Supabase auth
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('bookings').insert({
        room_id: roomId,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        user_id: user?.id || null,
      });
      if (error) throw error;
      setSuccess(true);
      // Lukker modal automatisk efter 1.5 sekunder
      setTimeout(() => {
        setStartTime('');
        setEndTime('');
        setError(null);
        setSuccess(false);
        onBookingSuccess?.(); // Opdaterer bookings i parent komponent
        onClose();
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Uventet fejl');
    } finally {
      setSubmitting(false);
    }
  };

  // ========================================
  // 5. EVENT HANDLERS - Håndterer brugerinteraktioner
  // ========================================
  
  // Rydder state og lukker modal
  const handleClose = () => {
    setStartTime('');
    setEndTime('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  // Normaliserer tid ved blur (fx "9:5" -> "09:30")
  const handleStartTimeBlur = () => {
    if (startTime) setStartTime(normalizeTime(startTime));
  };

  // Opdaterer start tid og rydder slut tid hvis start tid fjernes
  const handleStartTimeChange = (value: string) => {
    setStartTime(value);
    if (!value) setEndTime(''); // Ryd slut tid hvis start tid fjernes
  };

  // ========================================
  // 6. FEATURES PARSING - Parser udstyr string til liste
  // ========================================
  const featuresList = roomFeatures 
    ? roomFeatures.split(',').map(f => f.trim()).filter(Boolean)
    : [];

  // ========================================
  // 7. UI RENDERING - Booking modal
  // ========================================
  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={`Hurtig booking - ${roomName}`}
      size="md"
    >
      <Stack gap="md">
        {/* Success besked - Vises efter succesfuld booking */}
        {success && (
          <Alert icon={<IconCheck size={16} />} title="Booking oprettet!" color="green">
            Dit lokale er nu booket for i dag.
          </Alert>
        )}

        {/* Fejlbesked - Vises hvis validering eller booking fejler */}
        {error && (
          <Alert icon={<IconAlertCircle size={16} />} title="Fejl" color="red">
            {error}
          </Alert>
        )}

        <Text size="sm" c="dimmed">
          Book {roomName} for i dag. Vælg start- og sluttid.
        </Text>

        <div>
          <Text size="sm" fw={500} mb={5}>
            Start tid <Text component="span" c="red">*</Text>
          </Text>
          <TimeInput
            value={startTime}
            onChange={(e) => handleStartTimeChange(e.currentTarget.value)}
            onBlur={handleStartTimeBlur}
            placeholder="Vælg start tid"
          />
          <Text size="xs" c="dimmed" mt={4}>
            Kun halve eller hele timer (fx 09:00, 09:30, 10:00)
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
            placeholder="Vælg slut tid"
            min={startTime || undefined}
          />
          <Text size="xs" c="dimmed" mt={4}>
            Maksimal varighed: 2 timer
          </Text>
        </div>

        {featuresList.length > 0 && (
          <Box>
            <Divider my="sm" />
            <Text size="sm" fw={600} mb="xs" c="dimmed" tt="uppercase">
              Udstyr
            </Text>
            <Group gap="xs">
              {featuresList.map((feature, index) => {
                const Icon = getFeatureIcon(feature);
                return (
                  <Badge
                    key={index}
                    variant="light"
                    color="blue"
                    leftSection={<Icon size={14} />}
                    size="sm"
                  >
                    {feature}
                  </Badge>
                );
              })}
            </Group>
          </Box>
        )}

        <Button
          onClick={handleSubmit}
          fullWidth
          mt="md"
          disabled={!startTime || !endTime || submitting}
          loading={submitting}
        >
          {submitting ? 'Booker...' : 'Book lokale'}
        </Button>
      </Stack>
    </Modal>
  );
}

