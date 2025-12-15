/**
 * My Bookings Page - Side der viser brugerens bookinger
 * 
 * Henter alle bookinger for den aktuelle bruger fra Supabase og viser dem i en liste.
 * Tillader filtrering efter dato og søgning i lokale, type eller udstyr.
 * Giver mulighed for at redigere eller aflyse bookinger via modaler.
 * Opdaterer data i real-time via Supabase subscriptions. Viser loading states og fejlhåndtering.
 */
'use client';

import { useState, useEffect } from 'react';
import { Container, Paper, Text, Stack, Loader, Center } from '@mantine/core';
import '@mantine/dates/styles.css';

import { useUser } from '../contexts/UserContext';
import { CancelBookingModal } from '../components/myBookings/CancelBookingModal';
import { EditBookingModal } from '../components/myBookings/EditBookingModal';
import { BookingRow } from '../components/myBookings/BookingRow';
import { BookingsHeader } from '../components/myBookings/BookingsHeader';
import { BookingsFilter } from '../components/myBookings/BookingsFilter';
import { BookingsTableHeader } from '../components/myBookings/BookingsTableHeader';
import { BookingsEmptyState } from '../components/myBookings/BookingsEmptyState';
import { matchesDate, matchesSearch } from '../components/myBookings/utils';
import { useBookings } from '../hooks/useBookings';
import { useBookingModals } from '../hooks/useBookingModals';
import { useBookingActions } from '../hooks/useBookingActions';
import { getAvatarSrc } from '../utils/avatarUtils';

export default function BookingPage() {
  // ========================================
  // 1. HOOKS - Henter data og håndterer state
  // ========================================
  const { user, loading: userLoading } = useUser();
  const { bookings: allBookings, loading: bookingsLoading, error: bookingsError, refetch } = useBookings(user?.id);
  const { cancelModal, editModal, selectedBooking } = useBookingModals();
  const { handleCancel, handleEdit, cancelLoading, editLoading, editSuccess, error: actionError, resetEditSuccess } = useBookingActions({
    bookings: allBookings,
    onUpdate: refetch,
    onError: () => {}, // Error håndteres i hook og returneres
  });

  // ========================================
  // 2. LOCAL STATE - Filter og mount state
  // ========================================
  const [searchValue, setSearchValue] = useState(''); // Søgetekst
  const [dateValue, setDateValue] = useState<Date | null>(null); // Valgt dato
  const [isMounted, setIsMounted] = useState(false); // Forhindrer hydration fejl

  // ========================================
  // 3. MOUNT EFFECT - Marker komponent som mounted
  // ========================================
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ========================================
  // 3.5. EDIT SUCCESS EFFECT - Lukker edit modal efter success
  // ========================================
  useEffect(() => {
    if (editSuccess) {
      const timer = setTimeout(() => {
        editModal.close();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [editSuccess, editModal.close]);

  // ========================================
  // 3.6. RESET SUCCESS/ERROR STATE - Rydder state når modal lukkes
  // ========================================
  useEffect(() => {
    if (!editModal.opened) {
      resetEditSuccess(); // Reset success/error state når modal lukkes
    }
  }, [editModal.opened, resetEditSuccess]);

  // ========================================
  // 4. FILTERING - Filtrerer bookinger baseret på søgning og dato
  // ========================================
  const filteredBookings = allBookings.filter(b => 
    matchesSearch(b, searchValue) && matchesDate(b, dateValue)
  );

  // ========================================
  // 5. EVENT HANDLERS - Åbner modaler
  // ========================================
  const handleCancelBooking = (bookingId: string) => {
    const booking = allBookings.find(b => b.id === bookingId);
    if (booking) cancelModal.open(booking);
  };

  const handleEditBooking = (bookingId: string) => {
    const booking = allBookings.find(b => b.id === bookingId);
    if (booking) editModal.open(booking);
  };

  // ========================================
  // 6. CONFIRM HANDLERS - Bekræfter actions
  // ========================================
  const handleConfirmCancel = async () => {
    if (selectedBooking) {
      const success = await handleCancel(selectedBooking);
      if (success) cancelModal.close();
    }
  };

  const handleConfirmEdit = async (bookingId: string, newStartTime: string, newEndTime: string) => {
    await handleEdit(bookingId, newStartTime, newEndTime);
    // Modal lukkes automatisk i hook efter success
  };

  // ========================================
  // 7. LOADING STATE - Viser loader mens data hentes
  // ========================================
  if (userLoading || bookingsLoading) {
    return (
      <Container size="xl" py="xl">
        <Center><Loader size="lg" /></Center>
      </Container>
    );
  }

  // ========================================
  // 8. ERROR STATE - Viser fejlbesked hvis noget går galt
  // ========================================
  // Kun bookingsError vises på siden (kritisk fejl ved datahentning)
  // actionError vises kun i EditBookingModal (fejl ved edit operation)
  if (bookingsError) {
    return (
      <Container size="xl" py="xl">
        <Paper p="md" withBorder>
          <Text c="red">{bookingsError}</Text>
        </Paper>
      </Container>
    );
  }

  // ========================================
  // 9. UI RENDERING - Hovedkomponenten der vises
  // ========================================
  return (
    <Container size="xl" py="xl">
      {/* Header med titel og brugerinfo */}
      <BookingsHeader 
        user={user} 
        totalBookings={allBookings.length} 
        avatarSrc={getAvatarSrc(user)} 
      />

      {/* Søge- og datofilter */}
      <BookingsFilter
        dateValue={dateValue}
        onDateChange={setDateValue}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        isMounted={isMounted}
      />

      {/* Tabel overskrifter */}
      <BookingsTableHeader />

      {/* Vis bookinger eller empty state */}
      {filteredBookings.length === 0 ? (
        <BookingsEmptyState 
          hasBookings={allBookings.length > 0} // Har bookinger men filtreret væk
          hasDateFilter={dateValue !== null} 
        />
      ) : (
        <Stack gap="md">
          {filteredBookings.map(booking => (
            <BookingRow 
              key={booking.id} 
              booking={booking} 
              onCancel={handleCancelBooking} // Åbner cancel modal
              onEdit={handleEditBooking} // Åbner edit modal
            />
          ))}
        </Stack>
      )}

      {/* Cancel modal */}
      <CancelBookingModal 
        opened={cancelModal.opened} 
        onClose={cancelModal.close}
        booking={selectedBooking}
        onConfirm={handleConfirmCancel}
        loading={cancelLoading}
      />
      
      {/* Edit modal */}
      <EditBookingModal
        opened={editModal.opened}
        onClose={editModal.close}
        booking={selectedBooking}
        onConfirm={handleConfirmEdit}
        loading={editLoading}
        error={actionError}
        success={editSuccess}
      />
    </Container>
  );
}
