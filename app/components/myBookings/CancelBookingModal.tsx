/**
 * CancelBookingModal - Bekræftelsesdialog til aflysning af bookinger
 * 
 * Viser booking detaljer (lokale, dato, tid, udstyr) og beder brugeren om bekræftelse
 * før booking aflyses. Håndterer loading state under aflysning.
 */
'use client';

import { Modal, Text, Button, Stack, Group } from '@mantine/core';
import { Booking } from './types';
import { formatDate, splitEquipment, formatRoomInfo } from './utils';

interface CancelBookingModalProps {
  opened: boolean;
  onClose: () => void;
  booking: Booking | null;
  onConfirm: () => void;
  loading?: boolean;
}

export function CancelBookingModal({ opened, onClose, booking, onConfirm, loading = false }: CancelBookingModalProps) {
  // ========================================
  // CANCEL BOOKING MODAL - Bekræftelsesdialog til aflysning
  // ========================================
  if (!booking) return null; // Vis ikke modal hvis ingen booking valgt
  
  // Parser udstyr string til liste (fx "Projektor, Whiteboard" -> ["Projektor", "Whiteboard"])
  const equipmentItems = splitEquipment(booking.udstyr);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      withCloseButton
      closeButtonProps={{ 'aria-label': 'Luk' }}
      radius="md"
      size="md"
      title={null}
    >
      <Stack gap="lg" p="lg">
        <Text size="xl" fw={700} style={{ fontSize: '24px' }}>
          Bekræft aflysning?
        </Text>
        
        {/* Viser booking detaljer */}
        <Stack gap="xs">
          <Text size="sm" c="dark">
            {formatRoomInfo(booking)}
          </Text>
          <Text size="sm" c="dark">
            {formatDate(booking.dato)}
          </Text>
          <Text size="sm" c="dark">
            {booking.tid}
          </Text>
          {/* Viser udstyr som liste */}
          {equipmentItems.map((item, index) => (
            <Text key={index} size="sm" c="dark">
              + {item}
            </Text>
          ))}
        </Stack>

        {/* Bekræftelses knapper */}
        <Group gap="md" mt="md">
          <Button
            color="#043055"
            style={{ flex: 1 }}
            size="md"
            onClick={onClose}
            disabled={loading}
          >
            Nej, gå tilbage
          </Button>
          <Button color="#228BE6" style={{ flex: 1 }} size="md" onClick={onConfirm} loading={loading}>
            {loading ? 'Aflyser...' : 'Ja, bekræft'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
