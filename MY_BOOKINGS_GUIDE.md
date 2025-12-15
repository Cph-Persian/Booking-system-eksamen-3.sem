# Mine Bookinger Side - Komplet Guide

## Oversigt
Denne side viser alle brugerens kommende bookinger og giver mulighed for at:
- Se alle bookinger i en liste
- Filtrere bookinger efter dato eller søge efter lokale/type/udstyr
- Redigere eksisterende bookinger (ændre tidspunkt)
- Aflyse bookinger

---

## Struktur og Flow

### 1. State Management
Alle state variabler der styrer siden:

- `user, loading` - Brugerdata fra UserContext
- `allBookings` - Komplet liste af brugerens kommende bookinger
- `searchValue` - Tekst til søgning efter lokale/type/udstyr
- `dateValue` - Valgt dato for filtrering (null = vis alle)
- `bookingsLoading` - Viser loader mens data hentes
- `bookingsError` - Fejlbesked hvis noget går galt
- `cancelModalOpened / editModalOpened` - Styrer om modaler er åbne
- `selectedBooking` - Den booking der er valgt til cancel/edit
- `isMounted` - Forhindrer hydration fejl med date picker
- `cancelLoading / editLoading / editSuccess` - Loading states for async operationer

### 2. Mount Effect
Sætter `isMounted` til true når komponenten er mounted. Bruges til at forhindre hydration fejl med date picker komponenten.

### 3. Data Fetching (`fetchBookings`)
Henter alle brugerens bookinger fra Supabase databasen.

**Hvad sker der:**
1. Tjekker om supabase og user.id eksisterer
2. Henter bookinger fra 'bookings' tabellen hvor user_id matcher
3. Joiner med 'rooms' tabellen for at få lokale info (name, type, features)
4. Sorterer efter start_time (ældste først)
5. Filtrerer kun kommende bookinger (end_time >= nu)
6. Konverterer Supabase format til Booking type via `convertSupabaseBookingToBooking`
7. Opdaterer `allBookings` state med resultatet

### 4. Fetch Effect
Kører `fetchBookings` når:
- User loading er færdig OG bruger har et id (bruger er logget ind)
- Hvis bruger ikke er logget ind, rydder bookinger og stopper loading

### 5. Real-time Updates (Supabase Realtime Subscription)
Lytter til ændringer i bookings tabellen i real-time.

**Hvad sker der:**
- Opretter en Supabase channel der lytter til postgres_changes events
- Når der sker ændringer (INSERT, UPDATE, DELETE) på bookings tabellen hvor user_id matcher brugerens id, kaldes `fetchBookings` automatisk
- Dette betyder at siden opdateres automatisk hvis:
  * Brugeren opretter en ny booking (fra en anden side)
  * En booking bliver redigeret eller slettet
- Cleanup: Fjerner subscription når komponenten unmounts

### 6. Filtering
Filtrerer bookinger baseret på søgning og dato:
- `matchesSearch`: Søger i lokale, type og udstyr
- `matchesDate`: Filtrerer efter valgt dato

### 7. Event Handlers

**`handleCancelBooking`**
- Åbner cancel modal med den valgte booking
- Kaldes når bruger klikker på "Aflys" knap i BookingRow

**`handleEditBooking`**
- Åbner edit modal med den valgte booking
- Kaldes når bruger klikker på "Rediger" knap i BookingRow

### 8. Cancel Booking (`handleConfirmCancel`)
Sletter booking fra databasen.

**Hvad sker der:**
1. Sletter booking fra Supabase bookings tabel
2. Opdaterer `allBookings` state (fjerner den slettede booking)
3. Lukker modal og rydder `selectedBooking`

### 9. Edit Booking (`handleConfirmEdit`)
Opdaterer booking tidspunkt i databasen.

**Hvad sker der:**
1. Finder den originale booking
2. Parser datoen fra booking.dato (fx "25. december, 2025")
3. Kombinerer dato med nye tidspunkter (newStartTime, newEndTime)
4. Opretter nye Date objekter med kombineret dato + tid
5. Opdaterer booking i Supabase med nye start_time og end_time
6. Opdaterer lokal state med nyt tidspunkt
7. Viser success besked i 1.5 sekunder før modal lukkes

### 10. Loading State
Viser loader hvis:
- User data stadig loader (`loading`)
- Bookinger stadig hentes (`bookingsLoading`)

### 11. Error State
Viser fejlbesked hvis noget går galt ved hentning af bookinger.

### 12. Avatar Logik
Bestemmer hvilket avatar der skal vises:
- Hvis brugerens navn indeholder "louise" → brug louise avatar
- Ellers brug brugerens avatarUrl eller fallback til frederik avatar

### 13. UI Rendering
Hovedkomponenten der vises:

**BookingsHeader**
- Viser "Mine bookinger" titel, brugerinfo og antal bookinger

**BookingsFilter**
- Søgefelt og datovælger til at filtrere bookinger
- Opdaterer `dateValue` og `searchValue` state

**BookingsTableHeader**
- Kolonneoverskrifter (Lokale, Dato, Tid, Udstyr, Handlinger)

**BookingsEmptyState**
- Vises hvis der ikke er nogen filtrerede bookinger
- `hasBookings`: True hvis der er bookinger, men de er filtreret væk
- `hasDateFilter`: True hvis der er valgt en dato

**BookingRow**
- Viser hver booking i listen
- Har "Aflys" og "Rediger" knapper der kalder `handleCancelBooking` og `handleEditBooking`

**CancelBookingModal**
- Bekræftelsesdialog til aflysning af booking
- Kalder `handleConfirmCancel` når bekræftet

**EditBookingModal**
- Dialog til redigering af booking tidspunkt
- Kalder `handleConfirmEdit` med nye tidspunkter
- Viser success besked ved succesfuld redigering

---

## Data Flow

1. **Initial Load:**
   - UserContext loader brugerdata
   - Når bruger er klar → `fetchBookings()` kaldes
   - Bookinger hentes fra Supabase og konverteres til Booking type
   - `allBookings` state opdateres

2. **Real-time Updates:**
   - Supabase subscription lytter til ændringer
   - Ved ændring → `fetchBookings()` kaldes automatisk
   - UI opdateres automatisk

3. **Filtering:**
   - Bruger indtaster søgetekst eller vælger dato
   - `searchValue` eller `dateValue` opdateres
   - `filteredBookings` beregnes automatisk
   - UI viser kun filtrerede bookinger

4. **Cancel Booking:**
   - Bruger klikker "Aflys" → `handleCancelBooking()` kaldes
   - Modal åbnes med booking info
   - Bruger bekræfter → `handleConfirmCancel()` kaldes
   - Booking slettes fra Supabase
   - `allBookings` state opdateres (booking fjernes)
   - Real-time subscription opdaterer også automatisk

5. **Edit Booking:**
   - Bruger klikker "Rediger" → `handleEditBooking()` kaldes
   - Modal åbnes med booking info
   - Bruger vælger nye tidspunkter og bekræfter → `handleConfirmEdit()` kaldes
   - Booking opdateres i Supabase med nye start_time og end_time
   - `allBookings` state opdateres med nyt tidspunkt
   - Success besked vises i 1.5 sekunder
   - Real-time subscription opdaterer også automatisk

---

## Vigtige Funktioner fra Utils

- `convertSupabaseBookingToBooking`: Konverterer Supabase booking format til Booking type
- `matchesSearch`: Tjekker om booking matcher søgetekst (lokale, type, udstyr)
- `matchesDate`: Tjekker om booking matcher valgt dato
- `parseBookingDate`: Parser dato string (fx "25. december, 2025") til objekt med day, monthIndex, year

---

## Tips

- Alle bookinger filtreres automatisk til kun at vise kommende bookinger (end_time >= nu)
- Real-time subscription sikrer at siden altid er opdateret, selv hvis ændringer sker fra andre sider
- `isMounted` state forhindrer hydration fejl med date picker komponenten
- Success besked ved redigering vises i 1.5 sekunder før modal lukkes automatisk

