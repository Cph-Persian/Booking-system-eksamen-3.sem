// components/myBookings/CancelBookingModal.tsx
'use client';

/**
 * CancelBookingModal - Modal til at bekræfte aflysning af en booking
 * 
 * Denne komponent viser en bekræftelsesdialog når brugeren vil aflyse en booking.
 * Den viser booking detaljerne og giver mulighed for at bekræfte eller annullere.
 */

import { Modal, Text, Button, Stack, Group } from '@mantine/core';
import { Booking } from './types';
import { formatDate, splitEquipment, formatRoomInfo } from './utils';

// Props (egenskaber) som komponenten modtager
interface CancelBookingModalProps {
  opened: boolean;              // Om modal'en er åben eller lukket
  onClose: () => void;          // Funktion der kaldes når modal lukkes
  booking: Booking | null;       // Booking'en der skal aflyses (eller null hvis ingen)
  onConfirm: () => void;        // Funktion der kaldes når brugeren bekræfter aflysning
}

export function CancelBookingModal({ opened, onClose, booking, onConfirm }: CancelBookingModalProps) {
  // Hvis der ikke er nogen booking, vis ikke noget
  if (!booking) return null;

  // Split udstyr op i en liste (fx "Skærm, Vindue" → ["Skærm", "Vindue"])
  const equipmentItems = splitEquipment(booking.udstyr);

  /**
   * Håndterer når brugeren klikker "Ja, bekræft"
   * Kalder onConfirm som vil fjerne booking'en fra listen
   */
  const handleConfirm = () => {
    onConfirm();
    // Bemærk: onClose kaldes allerede i handleConfirmCancel i page.tsx
  };

  return (
    <Modal
      opened={opened}                    // Kontrollerer om modal er åben
      onClose={onClose}                  // Kaldes når bruger lukker modal (X knap eller udenfor)
      centered                            // Centrer modal på skærmen
      withCloseButton                     // Vis X knap i øverste højre hjørne
      closeButtonProps={{ 'aria-label': 'Luk' }}  // Accessibility label
      radius="md"                        // Afrundede hjørner
      size="md"                          // Medium størrelse
      title={null}                       // Ingen titel i header (vi bruger Text komponent i stedet)
    >
      <Stack gap="lg" p="lg">
        {/* Titel */}
        <Text size="xl" fw={700} style={{ fontSize: '24px' }}>
          Bekræft aflysning?
        </Text>
        
        {/* Booking detaljer */}
        <Stack gap="xs">
          {/* Lokale info (fx "Lokale 3.10, Klasselokale") */}
          <Text size="sm" c="dark">
            {formatRoomInfo(booking)}
          </Text>
          
          {/* Formateret dato (fx "25/12-2025") */}
          <Text size="sm" c="dark">
            {formatDate(booking.dato)}
          </Text>
          
          {/* Tid (fx "13:00-15:00") */}
          <Text size="sm" c="dark">
            {booking.tid}
          </Text>
          
          {/* Liste af udstyr med + foran hver */}
          {equipmentItems.map((item, index) => (
            <Text key={index} size="sm" c="dark">
              + {item}
            </Text>
          ))}
        </Stack>

        {/* Knapper */}
        <Group gap="md" mt="md">
          {/* "Nej, gå tilbage" knap - lukker modal uden at aflyse */}
          <Button
            color="#043055"              // Mørkeblå farve
            style={{ flex: 1 }}          // Tag lige meget plads som den anden knap
            size="md"
            onClick={onClose}            // Luk modal når klikket
          >
            Nej, gå tilbage
          </Button>
          
          {/* "Ja, bekræft" knap - bekræfter aflysning */}
          <Button
            color="#228BE6"              // Lysblå farve
            style={{ flex: 1 }}          // Tag lige meget plads som den anden knap
            size="md"
            onClick={handleConfirm}      // Bekræft aflysning når klikket
          >
            Ja, bekræft
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

