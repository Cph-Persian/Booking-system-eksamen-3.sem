/**
 * BookingsEmptyState - Viser besked når der ikke er bookinger at vise
 * 
 * Viser forskellige beskeder afhængigt af om brugeren har bookinger eller om
 * der er aktive filtre. Hjælper brugeren med at forstå hvorfor listen er tom.
 */
import { Text } from '@mantine/core';

interface BookingsEmptyStateProps {
  hasBookings: boolean;
  hasDateFilter: boolean;
}

export function BookingsEmptyState({ hasBookings, hasDateFilter }: BookingsEmptyStateProps) {
  // ========================================
  // BOOKINGS EMPTY STATE - Viser besked når der ikke er bookinger
  // ========================================
  // Viser forskellige beskeder afhængigt af om der er bookinger eller ej
  if (hasBookings) {
    return (
      <Text c="dimmed" size="lg" mt="xl">
        {hasDateFilter 
          ? 'Der er ingen bookinger for denne dato.'
          : 'Ingen bookinger matcher dine søgekriterier.'}
      </Text>
    );
  }
  
  return (
    <Text c="dimmed" size="lg" mt="xl">
      Du har ingen bookinger endnu.
    </Text>
  );
}

