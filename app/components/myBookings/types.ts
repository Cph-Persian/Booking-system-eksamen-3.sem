// components/myBookings/types.ts
// Fælles type definitioner for booking komponenter

/**
 * Booking type - bruges til at beskrive en booking
 * Alle felter er strings for at matche dataen fra databasen
 */
export type Booking = {
  id: string;           // Unikt ID for booking'en
  lokale: string;       // Lokale nummer (fx "3.10")
  type: string;         // Type lokale (fx "Klasselokale")
  dato: string;         // Dato (fx "25. December, 2025")
  tid: string;          // Tid i format "13:00-15:00"
  udstyr: string;       // Udstyr (fx "Skærm" eller "Skærm, Vindue")
};

