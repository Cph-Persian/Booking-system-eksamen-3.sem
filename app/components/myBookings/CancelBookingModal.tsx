// components/myBookings/CancelBookingModal.tsx
'use client';

import { Modal, Text, Button, Stack } from '@mantine/core';
import { useRouter } from 'next/navigation';

interface CancelBookingModalProps {
  opened: boolean;
  onClose: () => void;
}

export function CancelBookingModal({ opened, onClose }: CancelBookingModalProps) {
  const router = useRouter();

  const handleGoToBooking = () => {
    onClose();
    // Naviger til booking side (hjemmesiden)
    router.push('/');
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
        <Text size="xl" fw={700} c="red" style={{ fontSize: '24px' }}>
          Din Booking er blevet anulleret...
        </Text>
        
        <Text size="sm" c="dark" style={{ lineHeight: 1.6 }}>
          En underviser har brug for det lokale, som du havde booket. Vælg venligst et andet ledigt lokale
        </Text>

        <Button
          color="#043055"
          fullWidth
          mt="md"
          size="md"
          onClick={handleGoToBooking}
        >
          Gå til booking
        </Button>
      </Stack>
    </Modal>
  );
}

