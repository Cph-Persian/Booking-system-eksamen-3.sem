export function timeStringToDate(timeStr: string, baseDate: Date): Date | null {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return null;
  const date = new Date(baseDate);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export function normalizeTime(timeStr: string): string {
  if (!timeStr) return '';
  const [rawHours, rawMinutes = '0'] = timeStr.split(':');
  const hoursNum = parseInt(rawHours, 10) || 0;
  const minutesNum = parseInt(rawMinutes, 10) || 0;
  const normalizedMinutes = minutesNum < 30 ? 0 : 30;
  return `${hoursNum.toString().padStart(2, '0')}:${normalizedMinutes.toString().padStart(2, '0')}`;
}

export function isValidTime(timeStr: string): boolean {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return !isNaN(hours) && !isNaN(minutes) && (minutes === 0 || minutes === 30);
}

export function getDateObj(date: Date | string | null): Date | null {
  if (!date) return null;
  const dateObj = date instanceof Date ? date : new Date(date);
  return isNaN(dateObj.getTime()) ? null : dateObj;
}

