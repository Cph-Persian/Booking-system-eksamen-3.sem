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
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

  const validateBooking = (): string | null => {
    if (!startTime || !endTime) return 'Vælg venligst både en start- og sluttid for din booking.';
    const today = new Date();
    const startDateTime = timeStringToDate(startTime, today);
    const endDateTime = timeStringToDate(endTime, today);
    if (!startDateTime || !endDateTime) return 'Den valgte tid er ikke gyldig. Prøv venligst igen.';
    if (endDateTime <= startDateTime) return 'Sluttiden skal være efter starttiden. Juster venligst tiderne.';
    
    const [, startMinutes] = startTime.split(':').map(Number);
    const [, endMinutes] = endTime.split(':').map(Number);
    if ((startMinutes !== 0 && startMinutes !== 30) || (endMinutes !== 0 && endMinutes !== 30)) {
      return 'Bookinger skal starte og slutte på hele eller halve timer (f.eks. 09:00, 09:30, 10:00).';
    }
    
    const durationMinutes = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60);
    if (durationMinutes > 120) return 'Du kan maksimalt booke et lokale i 2 timer. Juster venligst varigheden.';
    if (startDateTime < new Date()) return 'Du kan ikke booke et lokale i fortiden. Vælg venligst et fremtidigt tidspunkt.';
    
    const hasOverlap = bookings.some(booking => {
      const bs = new Date(booking.start_time);
      const be = new Date(booking.end_time);
      return (startDateTime >= bs && startDateTime < be) ||
             (endDateTime > bs && endDateTime <= be) ||
             (startDateTime <= bs && endDateTime >= be);
    });
    return hasOverlap ? 'Lokalet er desværre allerede booket i det valgte tidsrum. Prøv et andet tidspunkt.' : null;
  };

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
        setError('Den valgte tid er ikke gyldig. Prøv venligst igen.');
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Der opstod en uventet fejl ved oprettelse af booking. Prøv venligst igen.');
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

  const handleStartTimeBlur = () => {
    if (startTime) setStartTime(normalizeTime(startTime));
  };

  const handleStartTimeChange = (value: string) => {
    setStartTime(value);
    if (!value) setEndTime('');
  };

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

