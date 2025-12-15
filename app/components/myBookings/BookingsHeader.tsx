/**
 * BookingsHeader - Header komponent der viser titel, booking tæller og brugerinfo
 * 
 * Viser "Mine bookinger" titel, antal bookinger og brugerens navn med avatar.
 * Opdaterer automatisk tekst baseret på antal bookinger (entals/pluralis form).
 */
import { Paper, Title, Text, Group, Avatar } from '@mantine/core';
import { User } from '../../types/user';

interface BookingsHeaderProps {
  user: User | null;
  totalBookings: number;
  avatarSrc: string;
}

export function BookingsHeader({ user, totalBookings, avatarSrc }: BookingsHeaderProps) {
  // ========================================
  // BOOKINGS HEADER - Header komponent med titel og brugerinfo
  // ========================================
  return (
    <Paper p="lg" mb="md" bg="gray.0" radius="md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      {/* Titel og booking tæller */}
      <div>
        <Title order={1} size="h1" fw={700} c="#043055">Mine bookinger</Title>
        {/* Dynamisk tekst baseret på antal bookinger */}
        <Text size="sm" c="dimmed" mt={4}>
          {totalBookings === 0 
            ? 'Du har ingen bookinger' 
            : `Du har ${totalBookings} ${totalBookings === 1 ? 'booking' : 'bookinger'}`}
        </Text>
      </div>
      {/* Bruger info med avatar */}
      <Group gap="sm">
        <Avatar src={avatarSrc} radius="xl" size="md" alt={user?.name || 'Bruger'} />
        <Text fw={700} size="md">{user?.name || 'Ikke logget ind'}</Text>
      </Group>
    </Paper>
  );
}

