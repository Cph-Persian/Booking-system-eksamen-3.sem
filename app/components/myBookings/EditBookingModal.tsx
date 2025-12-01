// components/myBookings/EditBookingModal.tsx
'use client';

/**
 * EditBookingModal - Modal til at redigere tiderne på en booking
 * 
 * Denne komponent giver brugeren mulighed for at ændre start- og sluttid
 * på en eksisterende booking. Den viser nuværende tider og tillader redigering.
 */

import { useState, useEffect } from 'react';
import { Modal, Text, Button, Stack, Group } from '@mantine/core';
import { TimeInput } from '@mantine/dates';
import { IconClock } from '@tabler/icons-react';
import '@mantine/dates/styles.css';
import { Booking } from './types';
import { formatRoomInfo } from './utils';

// Props (egenskaber) som komponenten modtager
interface EditBookingModalProps {
  opened: boolean;              // Om modal'en er åben eller lukket
  onClose: () => void;          // Funktion der kaldes når modal lukkes
  booking: Booking | null;      // Booking'en der skal redigeres (eller null hvis ingen)
  onConfirm: (bookingId: string, newStartTime: string, newEndTime: string) => void;  // Kaldes med nye tider når bekræftet
}

export function EditBookingModal({ opened, onClose, booking, onConfirm }: EditBookingModalProps) {
  // State (tilstand) - gemmer de tider brugeren indtaster
  const [startTime, setStartTime] = useState<string>('');  // Start tid (fx "13:00")
  const [endTime, setEndTime] = useState<string>('');        // Slut tid (fx "15:00")

  /**
   * Når booking'en ændres, parse tiderne fra "13:00-15:00" format
   * til separate start og slut tider og sæt dem i state
   */
  useEffect(() => {
    if (booking?.tid) {
      // Split "13:00-15:00" til ["13:00", "15:00"]
      const [start, end] = booking.tid.split('-');
      setStartTime(start.trim());  // Fjern mellemrum og sæt start tid
      setEndTime(end.trim());      // Fjern mellemrum og sæt slut tid
    }
  }, [booking]);

  /**
   * Når modal lukkes, nulstil tiderne
   * Dette sikrer at næste gang modal åbnes, starter den med tomme felter
   */
  useEffect(() => {
    if (!opened) {
      setStartTime('');
      setEndTime('');
    }
  }, [opened]);

  // Hvis der ikke er nogen booking, vis ikke noget
  if (!booking) return null;

  /**
   * Håndterer når brugeren klikker "Ja, rediger"
   * Sender de nye tider videre til parent komponenten
   */
  const handleConfirm = () => {
    if (startTime && endTime) {
      onConfirm(booking.id, startTime, endTime);  // Send booking ID og nye tider videre
      onClose();                                   // Luk modal
    }
  };

  /**
   * Valider at tiderne er korrekte:
   * - Både start og slut tid skal være udfyldt
   * - Slut tid skal være efter start tid
   */
  const isValid = startTime && endTime && endTime > startTime;

  return (
    <Modal
      opened={opened}                    // Kontrollerer om modal er åben
      onClose={onClose}                  // Kaldes når bruger lukker modal
      centered                            // Centrer modal på skærmen
      withCloseButton                     // Vis X knap i øverste højre hjørne
      closeButtonProps={{ 'aria-label': 'Luk' }}  // Accessibility label
      radius="md"                        // Afrundede hjørner
      size="md"                          // Medium størrelse
      title={null}                       // Ingen titel i header
    >
      <Stack gap="lg" p="lg">
        {/* Titel */}
        <Text size="xl" fw={700} style={{ fontSize: '24px' }}>
          Rediger booking
        </Text>
        
        {/* Lokale info */}
        <Text size="sm" c="dark">
          {formatRoomInfo(booking)}
        </Text>

        {/* Input felter for tider */}
        <Stack gap="md">
          {/* Start tid input */}
          <div>
            <Text size="sm" fw={500} mb={5}>
              Start
            </Text>
            <Text size="xs" c="dimmed" mb={5}>
              Starttid for lokale
            </Text>
            <TimeInput
              value={startTime}          // Værdien der vises i input feltet
              onChange={(e) => {
                // Når brugeren ændrer tiden, normaliser til hele timer (fx "13:00")
                const value = e.currentTarget.value;
                if (value) {
                  const [hours] = value.split(':');  // Tag kun timer (fx "13" fra "13:30")
                  setStartTime(`${hours}:00`);        // Sæt til hele timer (fx "13:00")
                } else {
                  setStartTime('');                    // Hvis tom, nulstil
                }
              }}
              leftSection={<IconClock size={16} />}  // Klokke ikon til venstre
              placeholder="Vælg start tid"
            />
          </div>

          {/* Slut tid input */}
          <div>
            <Text size="sm" fw={500} mb={5}>
              Slut
            </Text>
            <Text size="xs" c="dimmed" mb={5}>
              Sluttid for lokale
            </Text>
            <TimeInput
              value={endTime}            // Værdien der vises i input feltet
              onChange={(e) => {
                // Når brugeren ændrer tiden, normaliser til hele timer
                const value = e.currentTarget.value;
                if (value) {
                  const [hours] = value.split(':');
                  setEndTime(`${hours}:00`);
                } else {
                  setEndTime('');
                }
              }}
              leftSection={<IconClock size={16} />}  // Klokke ikon til venstre
              placeholder="Vælg slut tid"
            />
            {/* Advarsel om maksimal tid */}
            <Text size="xs" c="red" mt={4}>
              Lokalet kan bookes til kl.18
            </Text>
          </div>
        </Stack>

        {/* Knapper */}
        <Group gap="md" mt="md">
          {/* "Nej, gå tilbage" knap - lukker modal uden at gemme ændringer */}
          <Button
            color="#043055"              // Mørkeblå farve
            style={{ flex: 1 }}          // Tag lige meget plads som den anden knap
            size="md"
            onClick={onClose}            // Luk modal når klikket
          >
            Nej, gå tilbage
          </Button>
          
          {/* "Ja, rediger" knap - gemmer ændringerne */}
          <Button
            color="#228BE6"              // Lysblå farve
            style={{ flex: 1 }}          // Tag lige meget plads som den anden knap
            size="md"
            onClick={handleConfirm}      // Bekræft redigering når klikket
            disabled={!isValid}          // Deaktiver hvis tiderne ikke er gyldige
          >
            Ja, rediger
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

