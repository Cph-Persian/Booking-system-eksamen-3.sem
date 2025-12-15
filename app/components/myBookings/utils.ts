import { Booking } from './types';

export const MONTH_NAMES = ['januar', 'februar', 'marts', 'april', 'maj', 'juni', 
                             'juli', 'august', 'september', 'oktober', 'november', 'december'];

export function formatDate(dato: string): string {
  const monthMap: { [key: string]: string } = {
    'januar': '01', 'februar': '02', 'marts': '03', 'april': '04',
    'maj': '05', 'juni': '06', 'juli': '07', 'august': '08',
    'september': '09', 'oktober': '10', 'november': '11', 'december': '12'
  };
  const parts = dato.match(/(\d+)\.\s*(\w+),\s*(\d+)/);
  if (parts) {
    const day = parts[1].padStart(2, '0');
    const month = monthMap[parts[2].toLowerCase()] || '01';
    const year = parts[3];
    return `${day}/${month}-${year}`;
  }
  return dato;
}

export function splitEquipment(udstyr: string): string[] {
  return udstyr.split(',').map(item => item.trim()).filter(Boolean);
}

export function formatRoomInfo(booking: Booking): string {
  return `Lokale ${booking.lokale}, ${booking.type}`;
}

export function formatTime(date: Date): string {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

export function matchesDate(booking: Booking, dateValue: Date | null | string): boolean {
  if (!dateValue) return true;
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (isNaN(date.getTime())) return true;
  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  return booking.dato.includes(`${day}.`) && booking.dato.toLowerCase().includes(month);
}

export function matchesSearch(booking: Booking, searchValue: string): boolean {
  if (!searchValue) return true;
  const search = searchValue.toLowerCase();
  return booking.lokale.toLowerCase().includes(search) ||
         booking.type.toLowerCase().includes(search) ||
         booking.udstyr.toLowerCase().includes(search);
}

export function convertSupabaseBookingToBooking(supabaseBooking: any): Booking {
  const startDate = new Date(supabaseBooking.start_time);
  const endDate = new Date(supabaseBooking.end_time);
  const room = supabaseBooking.rooms;
  return {
    id: supabaseBooking.id,
    lokale: room?.name || 'Ukendt lokale',
    type: room?.type || 'Ukendt type',
    dato: `${startDate.getDate()}. ${MONTH_NAMES[startDate.getMonth()]}, ${startDate.getFullYear()}`,
    tid: `${formatTime(startDate)}-${formatTime(endDate)}`,
    udstyr: room?.features || 'Ingen',
  };
}

export function parseBookingDate(dato: string): { day: number; monthIndex: number; year: number } | null {
  const dateMatch = dato.match(/(\d+)\.\s*(\w+),\s*(\d+)/);
  if (!dateMatch) return null;
  const day = parseInt(dateMatch[1]);
  const monthIndex = MONTH_NAMES.findIndex(m => m.toLowerCase() === dateMatch[2].toLowerCase());
  const year = parseInt(dateMatch[3]);
  if (monthIndex === -1) return null;
  return { day, monthIndex, year };
}

