'use client';

import { useState, useEffect, useMemo } from 'react';
import { TimeInput } from '@mantine/dates';
import { Button, Modal, Stack, Text, Alert, Group, Badge, Divider, Box } from '@mantine/core';
import { 
  IconAlertCircle, 
  IconCheck,
  IconScreenShare, 
  IconDeviceDesktop, 
  IconPlug, 
  IconMicrophone, 
  IconVolume,
  IconPresentation,
  IconWifi,
  IconDeviceProjector
} from '@tabler/icons-react';
import '@mantine/dates/styles.css';
import { supabase } from '../../lib/supabaseClient';

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

// Mapping af feature navne til ikoner
const getFeatureIcon = (feature: string) => {
  const lowerFeature = feature.toLowerCase().trim();
  
  if (lowerFeature.includes('skærm') || lowerFeature.includes('screen') || lowerFeature.includes('display')) {
    return IconScreenShare;
  }
  if (lowerFeature.includes('whiteboard') || lowerFeature.includes('tavle')) {
    return IconPresentation;
  }
  if (lowerFeature.includes('oplader') || lowerFeature.includes('charger') || lowerFeature.includes('forlænger')) {
    return IconPlug;
  }
  if (lowerFeature.includes('mikrofon') || lowerFeature.includes('microphone')) {
    return IconMicrophone;
  }
  if (lowerFeature.includes('højtaler') || lowerFeature.includes('speaker') || lowerFeature.includes('sound')) {
    return IconVolume;
  }
  if (lowerFeature.includes('wifi') || lowerFeature.includes('internet')) {
    return IconWifi;
  }
  if (lowerFeature.includes('projector') || lowerFeature.includes('projektor')) {
    return IconDeviceProjector;
  }
  if (lowerFeature.includes('computer') || lowerFeature.includes('pc')) {
    return IconDeviceDesktop;
  }
  
  return IconPlug; // Default ikon
};

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

  // Hjælpefunktion til at konvertere time string til Date
  const timeStringToDate = (timeStr: string, baseDate: Date): Date | null => {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;
    const date = new Date(baseDate);
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  // Valider booking - tjek alle regler
  const validateBooking = (): string | null => {
    if (!startTime || !endTime) return 'Vælg både start og slut tid';

    const today = new Date();
    const startDateTime = timeStringToDate(startTime, today);
    const endDateTime = timeStringToDate(endTime, today);
    
    if (!startDateTime || !endDateTime) return 'Ugyldig tid';
    if (endDateTime <= startDateTime) return 'Slut tid skal være efter start tid';
    if (startTime.split(':')[1] !== '00' || endTime.split(':')[1] !== '00') {
      return 'Bookinger skal være i hele timer (fx 09:00, 10:00)';
    }

    const durationHours = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60);
    if (durationHours > 3) return 'Maksimal booking-tid er 3 timer';
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

  // Opret booking
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

  // Opdater endTime når startTime ændres (sæt til 1 time senere, maks 3 timer)
  const handleStartTimeChange = (value: string) => {
    setStartTime(value);
    if (value) {
      // Normaliser til hele timer (sæt minutter til 00)
      const [hours] = value.split(':');
      const normalizedStart = `${hours}:00`;
      setStartTime(normalizedStart);
      
      // Sæt slut tid til 1 time senere
      const hoursNum = parseInt(hours, 10);
      const newEndHour = (hoursNum + 1) % 24;
      const newEndTime = `${newEndHour.toString().padStart(2, '0')}:00`;
      setEndTime(newEndTime);
    } else {
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
            placeholder="Vælg start tid"
          />
          <Text size="xs" c="dimmed" mt={4}>
            Kun hele timer (fx 09:00, 10:00, 11:00)
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
                // Normaliser til hele timer (sæt minutter til 00)
                const [hours] = value.split(':');
                const normalized = `${hours}:00`;
                setEndTime(normalized);
              } else {
                setEndTime('');
              }
            }}
            placeholder="Vælg slut tid"
            min={startTime || undefined}
          />
          <Text size="xs" c="dimmed" mt={4}>
            Maksimal varighed: 3 timer
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

