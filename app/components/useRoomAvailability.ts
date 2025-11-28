// Typer for lokaler og bookinger
type Room = {
  id: string;
  name: string;
  status: string | null;
  status_color: string | null;
  description: string | null;
  image_url: string | null;
  type?: string | null;
  capacity?: number | null;
  features?: string | null;
};

type Booking = {
  id: string;
  room_id: string;
  start_time: string;
  end_time: string;
  user_id?: string;
};

// Type for lokale med beregnet status
type RoomWithStatus = Room & {
  computedStatus: 'Ledig' | 'Optaget' | 'Kommende';
  statusColor: 'green' | 'red' | 'yellow';
  infoText: string;
};

type BookingsByRoom = { [roomId: string]: Booking[] };

/**
 * Hook der beregner status for hvert lokale baseret på bookinger
 * @param roomsRaw - Liste af lokaler
 * @param bookingsByRoom - Bookinger grupperet efter lokale ID
 * @returns Lokaler med beregnet status
 */
export function useRoomAvailability(
  roomsRaw: Room[],
  bookingsByRoom: BookingsByRoom
): RoomWithStatus[] {
  const now = new Date();
  
  // Hjælpefunktion til at formatere tid
  const formatTime = (date: Date) => 
    date.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });

  return roomsRaw.map((room) => {
    const roomBookings = bookingsByRoom[room.id] || [];

    // Hvis ingen bookinger → lokale er ledigt
    if (roomBookings.length === 0) {
      return {
        ...room,
        computedStatus: 'Ledig',
        statusColor: 'green',
        infoText: 'Ingen kommende bookinger',
      };
    }

    // Få næste booking
    const nextBooking = roomBookings[0];
    const bookingStart = new Date(nextBooking.start_time);
    const bookingEnd = new Date(nextBooking.end_time);
    const minutesUntilEnd = Math.max(0, Math.round((bookingEnd.getTime() - now.getTime()) / 60000));

    // Lokale er optaget lige nu
    if (bookingStart <= now && bookingEnd > now) {
      // Hvis der er 20 min eller mindre til det er frit → "Kommende"
      if (minutesUntilEnd <= 20) {
        return {
          ...room,
          computedStatus: 'Kommende',
          statusColor: 'yellow',
          infoText: `Bliver ledigt om ${minutesUntilEnd} min`,
        };
      }
      // Ellers "Optaget"
      return {
        ...room,
        computedStatus: 'Optaget',
        statusColor: 'red',
        infoText: `Optaget til kl. ${formatTime(bookingEnd)}`,
      };
    }

    // Næste booking er i fremtiden → lokale er ledigt nu
    if (bookingStart > now) {
      const minutesUntilNext = Math.max(0, Math.round((bookingStart.getTime() - now.getTime()) / 60000));
      return {
        ...room,
        computedStatus: 'Ledig',
        statusColor: 'green',
        infoText: `Ledig de næste ${minutesUntilNext} min (indtil kl. ${formatTime(bookingStart)})`,
      };
    }

    // Fallback
    return {
      ...room,
      computedStatus: 'Ledig',
      statusColor: 'green',
      infoText: 'Ingen aktuelle bookinger',
    };
  });
}
