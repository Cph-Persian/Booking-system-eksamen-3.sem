// app/components/bookingModal/Demo.tsx
'use client';

// Booking modal - Book lokale frem i tiden
import { useState, useEffect, useMemo } from 'react';
import { DatePickerInput, TimeInput } from '@mantine/dates';
import { Button, Modal, Stack, Text, Select, Alert, Loader, Center, Group, Badge, Divider, Box } from '@mantine/core';
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

interface BookingModalProps {
  opened: boolean;
  onClose: () => void;
  onBookingSuccess?: () => void;
}

export function BookingModal({ opened, onClose, onBookingSuccess }: BookingModalProps) {
  const [date, setDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Konverterer time string til Date objekt
  const timeStringToDate = (timeStr: string, baseDate: Date): Date | null => {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;
    const date = new Date(baseDate);
    date.setHours(hours, minutes, 0, 0);
    return date;
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
        setError('Systemet er ikke konfigureret korrekt. Kontakt venligst support');
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

  // Validerer booking - tjekker alle regler
  const validateBooking = (): string | null => {
    if (!date) {
      return 'Du skal vælge en dato for at booke lokale';
    }

    if (!startTime) {
      return 'Du skal vælge en starttid';
    }

    if (!endTime) {
      return 'Du skal vælge en sluttid';
    }

    if (!selectedRoomId) {
      return 'Du skal vælge et lokale at booke';
    }

    // Kombiner dato med tider
    const startDateTime = timeStringToDate(startTime, date);
    const endDateTime = timeStringToDate(endTime, date);
    
    if (!startDateTime || !endDateTime) {
      return 'Den valgte tid er ikke gyldig. Prøv at vælge tiden igen';
    }

    // Tjek at slut tid er efter start tid
    if (endDateTime <= startDateTime) {
      return 'Sluttid skal være senere end starttid';
    }

    // Tjek at det er halve timer (00 eller 30 minutter)
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    const validMinute = (m: number) => m === 0 || m === 30;
    
    if (!validMinute(startMinutes) || !validMinute(endMinutes)) {
      return 'Du kan kun booke i halve timer. Vælg fx 09:00, 09:30 eller 10:00';
    }

    // Beregn varighed i minutter
    const durationMinutes = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60);
    
    // Tjek maks 2 timer
    if (durationMinutes > 120) {
      return 'Du kan maksimalt booke lokale i 2 timer ad gangen';
    }

    // Tjek at tiden ikke er i fortiden (hvis det er i dag)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (selectedDate.getTime() === today.getTime() && startDateTime < now) {
      return 'Du kan ikke booke et lokale i fortiden. Vælg en tid der ligger i fremtiden';
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
        setError('Den valgte tid er ikke gyldig. Prøv at vælge tiden igen');
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
    } catch (err: unknown) {
      console.error('Fejl ved booking:', err);
      const errorMessage = err instanceof Error ? err.message : 'Der opstod en uventet fejl ved oprettelse af booking. Prøv venligst igen';
      setError(errorMessage);
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
