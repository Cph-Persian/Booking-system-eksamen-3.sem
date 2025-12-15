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

type RoomWithStatus = Room & {
  computedStatus: 'Ledig' | 'Optaget' | 'Kommende';
  statusColor: 'green' | 'red' | 'yellow';
  infoText: string;
};

type BookingsByRoom = { [roomId: string]: Booking[] };

export function useRoomAvailability(roomsRaw: Room[], bookingsByRoom: BookingsByRoom): RoomWithStatus[] {
  const now = new Date();
  const formatTime = (date: Date) => date.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });

  return roomsRaw.map((room) => {
    const roomBookings = bookingsByRoom[room.id] || [];
    if (roomBookings.length === 0) {
      return { ...room, computedStatus: 'Ledig' as const, statusColor: 'green' as const, infoText: 'Ingen kommende bookinger' };
    }
    const nextBooking = roomBookings[0];
    const bookingStart = new Date(nextBooking.start_time);
    const bookingEnd = new Date(nextBooking.end_time);
    const minutesUntilEnd = Math.max(0, Math.round((bookingEnd.getTime() - now.getTime()) / 60000));

    if (bookingStart <= now && bookingEnd > now) {
      if (minutesUntilEnd <= 20) {
        return { ...room, computedStatus: 'Kommende' as const, statusColor: 'yellow' as const, infoText: `Bliver ledigt om ${minutesUntilEnd} min` };
      }
      return { ...room, computedStatus: 'Optaget' as const, statusColor: 'red' as const, infoText: `Optaget til kl. ${formatTime(bookingEnd)}` };
    }

    if (bookingStart > now) {
      const minutesUntilNext = Math.max(0, Math.round((bookingStart.getTime() - now.getTime()) / 60000));
      return { ...room, computedStatus: 'Ledig' as const, statusColor: 'green' as const, infoText: `Ledig de næste ${minutesUntilNext} min (indtil kl. ${formatTime(bookingStart)})` };
    }

    return { ...room, computedStatus: 'Ledig' as const, statusColor: 'green' as const, infoText: 'Ingen aktuelle bookinger' };
  });
}
