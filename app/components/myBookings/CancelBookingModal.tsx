// components/myBookings/CancelBookingModal.tsx
'use client';

// Modal til at bekræfte aflysning af en booking
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
  if (!booking) return null;

  const equipmentItems = splitEquipment(booking.udstyr);

  const handleConfirm = () => {
    onConfirm();
  };

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
          {equipmentItems.map((item, index) => (
            <Text key={index} size="sm" c="dark">
              + {item}
            </Text>
          ))}
        </Stack>

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
          <Button
            color="#228BE6"
            style={{ flex: 1 }}
            size="md"
            onClick={handleConfirm}
            loading={loading}
          >
            {loading ? 'Aflyser...' : 'Ja, bekræft'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
