/**
 * useBookingModals - Custom hook til at håndtere modal state
 * 
 * Håndterer state for cancel og edit modaler samt valgt booking.
 */
import { useState, useCallback } from 'react';
import { Booking } from '../components/myBookings/types';

export function useBookingModals() {
  const [cancelModalOpened, setCancelModalOpened] = useState(false);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Åbner cancel modal
  const openCancelModal = useCallback((booking: Booking) => {
    setSelectedBooking(booking);
    setCancelModalOpened(true);
  }, []);

  // Lukker cancel modal
  const closeCancelModal = useCallback(() => {
    setCancelModalOpened(false);
    setSelectedBooking(null);
  }, []);

  // Åbner edit modal
  const openEditModal = useCallback((booking: Booking) => {
    setSelectedBooking(booking);
    setEditModalOpened(true);
  }, []);

  // Lukker edit modal
  const closeEditModal = useCallback(() => {
    setEditModalOpened(false);
    setSelectedBooking(null);
  }, []);

  return {
    cancelModal: {
      opened: cancelModalOpened,
      open: openCancelModal,
      close: closeCancelModal,
    },
    editModal: {
      opened: editModalOpened,
      open: openEditModal,
      close: closeEditModal,
    },
    selectedBooking,
  };
}

