/**
 * BookingsTableHeader - Kolonneoverskrifter for booking tabel
 * 
 * Viser overskrifterne for booking listen (Lokale, Type, Dato, Tid, Udstyr).
 * Layout matcher BookingRow komponenten for konsistent visning.
 */
import { Paper, Text } from '@mantine/core';

export function BookingsTableHeader() {
  // ========================================
  // BOOKINGS TABLE HEADER - Kolonneoverskrifter for booking tabel
  // ========================================
  // Kolonneoverskrifter - Matcher layout fra BookingRow
  return (
    <Paper p="md" mb="md" bg="gray.0" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Text fw={600} style={{ flex: 1, minWidth: '100px' }}>Lokale</Text>
      <Text fw={600} style={{ flex: 1, minWidth: '120px' }}>Type</Text>
      <Text fw={600} style={{ flex: 1, minWidth: '180px' }}>Dato</Text>
      <Text fw={600} style={{ flex: 1, minWidth: '150px' }}>Tid</Text>
      <Text fw={600} style={{ flex: 1, minWidth: '120px' }}>Udstyr</Text>
      {/* Tom div til handlings kolonne */}
      <div style={{ width: '200px' }}></div>
    </Paper>
  );
}

