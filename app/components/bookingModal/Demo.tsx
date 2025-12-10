'use client';

import { useState, useEffect, useMemo } from 'react';
import { DatePickerInput, TimeInput } from '@mantine/dates';
import { Button, Modal, Stack, Text, Select, Alert, Loader, Center, Group, Badge, Divider, Box } from '@mantine/core';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import '@mantine/dates/styles.css';
import { supabase } from '../../lib/supabaseClient';
import { getFeatureIcon } from '../../utils/featureIcons';
import { timeStringToDate, normalizeTime, getDateObj } from '../../utils/bookingUtils';

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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const selectedRoom = useMemo(() => 
    selectedRoomId ? rooms.find(r => r.id === selectedRoomId) || null : null,
    [selectedRoomId, rooms]
  );

  useEffect(() => {
    if (!opened || !supabase) return;
    supabase.from('rooms').select('id, name, description, capacity, features').order('name')
      .then(({ data }) => data && setRooms(data as Room[]));
  }, [opened]);

  useEffect(() => {
    if (!opened || !date || !supabase) {
      setBookings([]);
      return;
    }
    const dateObj = getDateObj(date);
    if (!dateObj) return;
    const startOfDay = new Date(dateObj);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateObj);
    endOfDay.setHours(23, 59, 59, 999);
    supabase.from('bookings').select('*')
      .gte('start_time', startOfDay.toISOString())
      .lte('start_time', endOfDay.toISOString())
      .then(({ data }) => data && setBookings(data as Booking[]));
  }, [opened, date]);

  const availableRooms = useMemo(() => {
    if (!date || !startTime || !endTime) return rooms;
    const dateObj = getDateObj(date);
    if (!dateObj) return rooms;
    const startDateTime = timeStringToDate(startTime, dateObj);
    const endDateTime = timeStringToDate(endTime, dateObj);
    if (!startDateTime || !endDateTime) return rooms;
    
    return rooms.filter(room => {
      const roomBookings = bookings.filter(b => b.room_id === room.id);
      return !roomBookings.some(booking => {
        const bs = new Date(booking.start_time);
        const be = new Date(booking.end_time);
        return (startDateTime >= bs && startDateTime < be) ||
               (endDateTime > bs && endDateTime <= be) ||
               (startDateTime <= bs && endDateTime >= be);
      });
    });
  }, [rooms, bookings, date, startTime, endTime]);

  const validateBooking = (): string | null => {
    if (!date) return 'Vælg venligst en dato for din booking.';
    const dateObj = getDateObj(date);
    if (!dateObj) return 'Den valgte dato er ikke gyldig. Prøv venligst igen.';
    if (!startTime) return 'Vælg venligst en starttid for din booking.';
    if (!endTime) return 'Vælg venligst en sluttid for din booking.';
    if (!selectedRoomId) return 'Vælg venligst et lokale at booke.';
    
    const startDateTime = timeStringToDate(startTime, dateObj);
    const endDateTime = timeStringToDate(endTime, dateObj);
    if (!startDateTime || !endDateTime) return 'Den valgte tid er ikke gyldig. Prøv venligst igen.';
    if (endDateTime <= startDateTime) return 'Sluttiden skal være efter starttiden. Juster venligst tiderne.';
    
    const [, startMinutes] = startTime.split(':').map(Number);
    const [, endMinutes] = endTime.split(':').map(Number);
    if ((startMinutes !== 0 && startMinutes !== 30) || (endMinutes !== 0 && endMinutes !== 30)) {
      return 'Bookinger skal starte og slutte på hele eller halve timer (f.eks. 09:00, 09:30, 10:00).';
    }
    
    const durationMinutes = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60);
    if (durationMinutes > 120) return 'Du kan maksimalt booke et lokale i 2 timer. Juster venligst varigheden.';
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    if (selectedDate.getTime() === today.getTime() && startDateTime < now) {
      return 'Du kan ikke booke et lokale i fortiden. Vælg venligst et fremtidigt tidspunkt.';
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
      const dateObj = getDateObj(date);
      if (!dateObj) {
        setError('Den valgte dato er ikke gyldig. Prøv venligst igen.');
        setSubmitting(false);
        return;
      }
      const startDateTime = timeStringToDate(startTime, dateObj);
      const endDateTime = timeStringToDate(endTime, dateObj);
      if (!startDateTime || !endDateTime) {
        setError('Den valgte tid er ikke gyldig. Prøv venligst igen.');
        setSubmitting(false);
        return;
      }
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw new Error('Kunne ikke verificere din bruger. Prøv venligst at logge ind igen.');
      
      const { error: insertError } = await supabase.from('bookings').insert({
        room_id: selectedRoomId,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        user_id: user?.id || null,
      });

      if (insertError) {
        if (insertError.message.includes('duplicate') || insertError.message.includes('unique')) {
          throw new Error('Denne booking eksisterer allerede. Prøv venligst med et andet tidspunkt.');
        } else if (insertError.message.includes('permission') || insertError.message.includes('policy')) {
          throw new Error('Du har ikke tilladelse til at oprette denne booking. Kontakt venligst support.');
        } else if (insertError.message.includes('overlap') || insertError.message.includes('conflict')) {
          throw new Error('Lokalet er desværre allerede booket i det valgte tidsrum. Prøv et andet tidspunkt.');
        } else {
          throw new Error(`Der opstod en fejl ved oprettelse af booking: ${insertError.message}. Prøv venligst igen.`);
        }
      }

      setSuccess(true);
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
      const errorMessage = err instanceof Error 
        ? (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')
          ? 'Kunne ikke oprette forbindelse til serveren. Tjek din internetforbindelse og prøv igen.'
          : err.message)
        : 'Der opstod en uventet fejl ved oprettelse af booking. Prøv venligst igen.';
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

  const handleStartTimeBlur = () => {
    if (startTime) setStartTime(normalizeTime(startTime));
  };

  const handleStartTimeChange = (value: string) => {
    setStartTime(value);
    if (!value) setEndTime('');
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
            onBlur={() => endTime && setEndTime(normalizeTime(endTime))}
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
            <Select
              value={selectedRoomId}
              onChange={setSelectedRoomId}
              placeholder="Vælg et ledigt lokale"
              data={availableRooms.map(room => ({
                value: room.id,
                label: `${room.name}${room.capacity ? ` (${room.capacity} pladser)` : ''}`,
              }))}
              searchable
              clearable
            />
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
