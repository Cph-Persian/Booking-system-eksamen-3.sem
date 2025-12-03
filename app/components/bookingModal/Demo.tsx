// app/components/bookingModal/Demo.tsx
'use client';

/**
 * Booking Modal - Fremtidige Bookinger
 * 
 * Denne modal giver mulighed for at booke et lokale frem i tiden:
 * - Vælg dato (fremtidige datoer)
 * - Vælg start- og sluttid (kun halve timer: 00 eller 30 minutter)
 * - Maksimal varighed: 2 timer
 * - Filtrerer ledige lokaler baseret på valgt dato og tid
 * - Tjekker for overlappende bookinger
 * - Viser lokale udstyr/features med ikoner
 * - Opretter booking i Supabase database
 */

import { useState, useEffect, useMemo } from 'react';
import { DatePickerInput, TimeInput } from '@mantine/dates';
import { Button, Modal, Stack, Text, Select, Alert, Loader, Center, Group, Badge, Divider, Box } from '@mantine/core';
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

interface BookingModalProps {
  opened: boolean;
  onClose: () => void;
  onBookingSuccess?: () => void;
}

export function BookingModal({ opened, onClose, onBookingSuccess }: BookingModalProps) {
  // State (tilstand) - gemmer værdier der kan ændres
  const [date, setDate] = useState<Date | null>(null);                 // Den valgte dato
  const [startTime, setStartTime] = useState<string>('');              // Start tid brugeren vælger (fx "12:30")
  const [endTime, setEndTime] = useState<string>('');                 // Slut tid brugeren vælger (fx "14:00")
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);  // ID på det valgte lokale
  const [rooms, setRooms] = useState<Room[]>([]);                     // Liste af alle lokaler fra databasen
  const [bookings, setBookings] = useState<Booking[]>([]);           // Eksisterende bookinger for den valgte dato
  const [loading, setLoading] = useState(false);                      // Om lokaler loader
  const [submitting, setSubmitting] = useState(false);                 // Om booking request er i gang
  const [error, setError] = useState<string | null>(null);             // Fejlbesked hvis noget går galt
  const [success, setSuccess] = useState(false);                       // Om booking blev oprettet succesfuldt

  /**
   * Konverterer en time string (fx "12:30") til et Date objekt
   * 
   * @param timeStr - Time string i format "HH:MM"
   * @param baseDate - Datoen der skal bruges som base
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

  // Mapping af feature navne til ikoner (samme som i LokaleCard)
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

  // Find det valgte lokale
  const selectedRoom = useMemo(() => {
    if (!selectedRoomId) return null;
    return rooms.find(room => room.id === selectedRoomId) || null;
  }, [selectedRoomId, rooms]);

  // Hent lokaler når modal åbnes
  useEffect(() => {
    if (opened) {
      if (!supabase) {
        setError('Supabase er ikke konfigureret');
        return;
      }
      
      const fetchRooms = async () => {
        if (!supabase) return;
        
        const { data } = await supabase
          .from('rooms')
          .select('id, name, description, capacity, features')
          .order('name', { ascending: true });
        
        if (data) {
          setRooms(data as Room[]);
        }
      };
      fetchRooms();
    }
  }, [opened]);

  // Hent eksisterende bookinger når dato eller tid ændres
  useEffect(() => {
    if (opened && date) {
      if (!supabase) {
        return;
      }
      
      const fetchBookings = async () => {
        if (!supabase) return;
        
        // Hent alle bookinger for den valgte dato
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const { data } = await supabase
          .from('bookings')
          .select('*')
          .gte('start_time', startOfDay.toISOString())
          .lte('start_time', endOfDay.toISOString());

        if (data) {
          setBookings(data as Booking[]);
        }
      };
      fetchBookings();
    } else {
      setBookings([]);
    }
  }, [opened, date]);

  // Beregn ledige lokaler baseret på valgt dato og tid
  const availableRooms = useMemo(() => {
    if (!date || !startTime || !endTime) {
      return rooms;
    }

    // Kombiner dato med start og slut tid
    const startDateTime = timeStringToDate(startTime, date);
    const endDateTime = timeStringToDate(endTime, date);
    
    if (!startDateTime || !endDateTime) {
      return rooms;
    }

    // Filtrer lokaler der er ledige i det valgte tidsrum
    return rooms.filter((room) => {
      const roomBookings = bookings.filter((b) => b.room_id === room.id);
      
      // Tjek om der er overlappende bookinger
      const hasOverlap = roomBookings.some((booking) => {
        const bookingStart = new Date(booking.start_time);
        const bookingEnd = new Date(booking.end_time);
        
        // Tjek om tidsrummet overlapper
        return (
          (startDateTime >= bookingStart && startDateTime < bookingEnd) ||
          (endDateTime > bookingStart && endDateTime <= bookingEnd) ||
          (startDateTime <= bookingStart && endDateTime >= bookingEnd)
        );
      });

      return !hasOverlap;
    });
  }, [rooms, bookings, date, startTime, endTime]);

  // Valider booking
  // Regler:
  // - Man kan booke i halve timer (00 eller 30 minutter)
  // - Maksimal varighed er 2 timer
  const validateBooking = (): string | null => {
    if (!date) {
      return 'Vælg en dato';
    }

    if (!startTime) {
      return 'Vælg start tid';
    }

    if (!endTime) {
      return 'Vælg slut tid';
    }

    if (!selectedRoomId) {
      return 'Vælg et lokale';
    }

    // Kombiner dato med tider
    const startDateTime = timeStringToDate(startTime, date);
    const endDateTime = timeStringToDate(endTime, date);
    
    if (!startDateTime || !endDateTime) {
      return 'Ugyldig tid';
    }

    // Tjek at slut tid er efter start tid
    if (endDateTime <= startDateTime) {
      return 'Slut tid skal være efter start tid';
    }

    // Tjek at det er halve timer (00 eller 30 minutter)
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    const validMinute = (m: number) => m === 0 || m === 30;
    
    if (!validMinute(startMinutes) || !validMinute(endMinutes)) {
      return 'Bookinger skal være i halve timer (fx 09:00, 09:30, 10:00)';
    }

    // Beregn varighed i minutter
    const durationMinutes = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60);
    
    // Tjek maks 2 timer
    if (durationMinutes > 120) {
      return 'Maksimal booking-tid er 2 timer';
    }

    // Tjek at tiden ikke er i fortiden (hvis det er i dag)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (selectedDate.getTime() === today.getTime() && startDateTime < now) {
      return 'Du kan ikke booke i fortiden';
    }

    return null;
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(false);

    const validationError = validateBooking();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!date || !startTime || !endTime || !selectedRoomId || !supabase) {
      return;
    }

    setSubmitting(true);

    try {
      // Kombiner dato med tider
      const startDateTime = timeStringToDate(startTime, date);
      const endDateTime = timeStringToDate(endTime, date);
      
      if (!startDateTime || !endDateTime) {
        setError('Ugyldig tid');
        setSubmitting(false);
        return;
      }

      // Hent bruger (hvis der er authentication)
      const { data: { user } } = await supabase.auth.getUser();

      // Opret booking
      const { error: insertError } = await supabase
        .from('bookings')
        .insert({
          room_id: selectedRoomId,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          user_id: user?.id || null,
        });

      if (insertError) {
        throw insertError;
      }

      setSuccess(true);
      
      // Reset form efter kort pause
      setTimeout(() => {
        setDate(null);
        setStartTime('');
        setEndTime('');
        setSelectedRoomId(null);
        setError(null);
        setSuccess(false);
        onBookingSuccess?.();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Fejl ved booking:', err);
      setError(err.message || 'Der opstod en fejl ved booking af lokale');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setDate(null);
    setStartTime('');
    setEndTime('');
    setSelectedRoomId(null);
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

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Book lokale"
      size="md"
    >
      <Stack gap="md">
        {success && (
          <Alert icon={<IconCheck size={16} />} title="Booking oprettet!" color="green">
            Dit lokale er nu booket.
          </Alert>
        )}

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} title="Fejl" color="red">
            {error}
          </Alert>
        )}

        <div>
          <Text size="sm" fw={500} mb={5}>
            Dato <Text component="span" c="red">*</Text>
          </Text>
          <DatePickerInput
            value={date}
            onChange={(value) => {
              setDate(value as Date | null);
            }}
            placeholder="Vælg dato"
            minDate={new Date()}
            clearable
          />
        </div>

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

        {date && startTime && endTime && (
          <div>
            <Text size="sm" fw={500} mb={5}>
              Vælg lokale <Text component="span" c="red">*</Text>
            </Text>
            {loading ? (
              <Center py="md">
                <Loader size="sm" />
              </Center>
            ) : (
              <Select
                value={selectedRoomId}
                onChange={setSelectedRoomId}
                placeholder="Vælg et ledigt lokale"
                data={availableRooms.map((room) => ({
                  value: room.id,
                  label: `${room.name}${room.capacity ? ` (${room.capacity} pladser)` : ''}`,
                }))}
                searchable
                clearable
              />
            )}
            {availableRooms.length === 0 && (
              <Text size="xs" c="red" mt={4}>
                Ingen ledige lokaler i det valgte tidsrum
              </Text>
            )}
          </div>
        )}

        {selectedRoom && selectedRoom.features && (
          <Box>
            <Divider my="sm" />
            <Text size="sm" fw={600} mb="xs" c="dimmed" tt="uppercase">
              Udstyr i {selectedRoom.name}
            </Text>
            <Group gap="xs">
              {selectedRoom.features
                .split(',')
                .map(f => f.trim())
                .filter(Boolean)
                .map((feature, index) => {
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
          disabled={!date || !startTime || !endTime || !selectedRoomId || submitting}
          loading={submitting}
        >
          {submitting ? 'Booker...' : 'Book lokale'}
        </Button>
      </Stack>
    </Modal>
  );
}
