// components/myBookings/utils.ts
// Fælles hjælpefunktioner til booking komponenter

import { Booking } from './types';

/**
 * Formaterer en dato fra "25. December, 2025" til "25/12-2025" format
 * 
 * @param dato - Datoen som skal formateres
 * @returns Formateret dato eller original hvis formatering fejler
 */
export function formatDate(dato: string): string {
  // Månedsnavne på dansk og deres numre
  const monthMap: { [key: string]: string } = {
    'januar': '01', 'februar': '02', 'marts': '03', 'april': '04',
    'maj': '05', 'juni': '06', 'juli': '07', 'august': '08',
    'september': '09', 'oktober': '10', 'november': '11', 'december': '12'
  };
  
  // Find dag, måned og år i datoen (fx "25. December, 2025")
  const parts = dato.match(/(\d+)\.\s*(\w+),\s*(\d+)/);
  
  if (parts) {
    const day = parts[1].padStart(2, '0');  // Dag med 0 foran hvis nødvendigt (fx "05")
    const month = monthMap[parts[2].toLowerCase()] || '01';  // Find månedsnummer
    const year = parts[3];  // År
    return `${day}/${month}-${year}`;  // Returner i format "25/12-2025"
  }
  
  // Hvis formatering fejler, returner original dato
  return dato;
}

/**
 * Splitter udstyr string til et array af enkelte udstyr
 * 
 * @param udstyr - Udstyr string (fx "Skærm" eller "Skærm, Vindue")
 * @returns Array af udstyr navne
 * 
 * Eksempel:
 * - Input: "Skærm, Vindue" → Output: ["Skærm", "Vindue"]
 * - Input: "Skærm" → Output: ["Skærm"]
 */
export function splitEquipment(udstyr: string): string[] {
  return udstyr.split(',').map(item => item.trim()).filter(Boolean);
}

/**
 * Formaterer lokale info til visning
 * 
 * @param booking - Booking objektet
 * @returns Formateret string (fx "Lokale 3.10, Klasselokale")
 */
export function formatRoomInfo(booking: Booking): string {
  return `Lokale ${booking.lokale}, ${booking.type}`;
}

