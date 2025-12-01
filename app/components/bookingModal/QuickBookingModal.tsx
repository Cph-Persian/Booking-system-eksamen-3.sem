// app/components/bookingModal/QuickBookingModal.tsx
'use client';

/**
 * Hurtig Booking Modal
 * 
 * Denne modal giver mulighed for at booke et lokale hurtigt for i dag:
 * - Vælg start- og sluttid (kun halve timer: 00 eller 30 minutter)
 * - Maksimal varighed: 2 timer
 * - Tjekker for overlappende bookinger
 * - Viser lokale udstyr/features med ikoner
 * - Opretter booking i Supabase database
 */

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
  // State (tilstand) - gemmer værdier der kan ændres
  const [startTime, setStartTime] = useState<string>('');              // Start tid brugeren vælger (fx "12:30")
  const [endTime, setEndTime] = useState<string>('');                 // Slut tid brugeren vælger (fx "14:00")
  const [bookings, setBookings] = useState<Booking[]>([]);            // Eksisterende bookinger for i dag for dette lokale
  const [submitting, setSubmitting] = useState(false);                 // Om booking request er i gang
  const [error, setError] = useState<string | null>(null);             // Fejlbesked hvis noget går galt
  const [success, setSuccess] = useState(false);                       // Om booking blev oprettet succesfuldt

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

  /**
   * Konverterer en time string (fx "12:30") til et Date objekt
   * 
   * @param timeStr - Time string i format "HH:MM"
   * @param baseDate - Datoen der skal bruges som base (fx i dag)
   * @returns Date objekt eller null hvis time string er ugyldig
   */
  const timeStringToDate = (timeStr: string, baseDate: Date): Date | null => {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;
    const date = new Date(baseDate);
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  /**
   * Validerer booking inden den oprettes
   * Tjekker alle regler:
   * - Start og slut tid skal være valgt
   * - Slut tid skal være efter start tid
   * - Tider skal være i halve timer (00 eller 30 minutter)
   * - Maksimal varighed er 2 timer
   * - Kan ikke booke i fortiden
   * - Ingen overlappende bookinger
   * 
   * @returns Fejlbesked hvis validation fejler, ellers null
   */
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

  /**
   * Håndterer når brugeren submitter booking formularen
   * Validerer booking, opretter den i Supabase, og kalder onBookingSuccess callback
   */
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

  // Normaliser start-tid til halve timer når brugeren tabber ud af feltet
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

  // Opdater start-tid når brugeren skriver (ingen automatisk slut-tid)
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

