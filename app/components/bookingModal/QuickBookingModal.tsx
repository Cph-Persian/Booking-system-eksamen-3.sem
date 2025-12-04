// app/components/bookingModal/QuickBookingModal.tsx
'use client';

// Hurtig booking modal - Book lokale for i dag
import { useState, useEffect } from 'react';
import { TimeInput } from '@mantine/dates';
import { Button, Modal, Stack, Text, Alert, Group, Badge, Divider, Box } from '@mantine/core';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import '@mantine/dates/styles.css';
import { supabase } from '../../lib/supabaseClient';
import { getFeatureIcon } from '../../utils/featureIcons';

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
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Hent eksisterende bookinger for i dag
  useEffect(() => {
    if (!opened || !supabase) {
      setBookings([]);
      return;
    }

    const fetchBookings = async () => {
      const client = supabase;
      if (!client) return;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      const { data } = await client
        .from('bookings')
        .select('*')
        .eq('room_id', roomId)
        .gte('start_time', today.toISOString())
        .lte('start_time', endOfDay.toISOString());

      if (data) setBookings(data as Booking[]);
    };

    fetchBookings();
  }, [opened, roomId]);

  // Konverterer time string til Date objekt
  const timeStringToDate = (timeStr: string, baseDate: Date): Date | null => {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;
    const date = new Date(baseDate);
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  // Validerer booking - tjekker alle regler
  const validateBooking = (): string | null => {
    if (!startTime || !endTime) return 'Vælg både start og slut tid';

    const today = new Date();
    const startDateTime = timeStringToDate(startTime, today);
    const endDateTime = timeStringToDate(endTime, today);
    
    if (!startDateTime || !endDateTime) return 'Ugyldig tid';
    if (endDateTime <= startDateTime) return 'Slut tid skal være efter start tid';

    const startMinutes = Number(startTime.split(':')[1]);
    const endMinutes = Number(endTime.split(':')[1]);
    const validMinute = (m: number) => m === 0 || m === 30;

    if (!validMinute(startMinutes) || !validMinute(endMinutes)) {
      return 'Bookinger skal være i halve timer (fx 09:00, 09:30, 10:00)';
    }

    const durationMinutes = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60);
    if (durationMinutes > 120) return 'Maksimal booking-tid er 2 timer';
    if (startDateTime < new Date()) return 'Du kan ikke booke i fortiden';

    // Tjek for overlappende bookinger
    const hasOverlap = bookings.some((booking) => {
      const bookingStart = new Date(booking.start_time);
      const bookingEnd = new Date(booking.end_time);
      return (
        (startDateTime >= bookingStart && startDateTime < bookingEnd) ||
        (endDateTime > bookingStart && endDateTime <= bookingEnd) ||
        (startDateTime <= bookingStart && endDateTime >= bookingEnd)
      );
    });

    return hasOverlap ? 'Lokalet er allerede booket i dette tidsrum' : null;
  };

  // Opretter booking i Supabase
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

      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('bookings').insert({
        room_id: roomId,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        user_id: user?.id || null,
      });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        setStartTime('');
        setEndTime('');
        setError(null);
        setSuccess(false);
        onBookingSuccess?.();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Fejl ved booking');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStartTime('');
    setEndTime('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  // Normaliserer tid til halve timer (00 eller 30)
  const handleStartTimeBlur = () => {
    if (!startTime) return;
    
    const [rawHours, rawMinutes = '0'] = startTime.split(':');
    const hoursNum = parseInt(rawHours, 10) || 0;
    const minutesNum = parseInt(rawMinutes, 10) || 0;

    // Normaliser til nærmeste halve time (00 eller 30)
    const normalizedMinutesNum = minutesNum < 30 ? 0 : 30;
    const normalizedStart = `${hoursNum.toString().padStart(2, '0')}:${normalizedMinutesNum
      .toString()
      .padStart(2, '0')}`;
    setStartTime(normalizedStart);
  };

  const handleStartTimeChange = (value: string) => {
    setStartTime(value);
    if (!value) {
      setEndTime('');
    }
  };

  // Split features op i en liste
  const featuresList = roomFeatures 
    ? roomFeatures.split(',').map(f => f.trim()).filter(Boolean)
    : [];

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={`Hurtig booking - ${roomName}`}
      size="md"
    >
      <Stack gap="md">
        {success && (
          <Alert icon={<IconCheck size={16} />} title="Booking oprettet!" color="green">
            Dit lokale er nu booket for i dag.
          </Alert>
        )}

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
            onBlur={() => {
              if (!endTime) return;
              const [rawHours, rawMinutes = '0'] = endTime.split(':');
              const hoursNum = parseInt(rawHours, 10) || 0;
              const minutesNum = parseInt(rawMinutes, 10) || 0;
              const normalizedMinutesNum = minutesNum < 30 ? 0 : 30;
              const normalized = `${hoursNum.toString().padStart(2, '0')}:${normalizedMinutesNum
                .toString()
                .padStart(2, '0')}`;
              setEndTime(normalized);
            }}
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

