// types/user.ts
// Type definitioner for bruger systemet

export type UserType = 'studerende' | 'lærer';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  userType: UserType;
}

// Hjælpefunktion til at tjekke om bruger kan booke en bestemt type lokale
export function canBookRoomType(user: User | null, roomType: string): boolean {
  if (!user) return false;
  
  // Studerende kan kun booke møde lokaler
  if (user.userType === 'studerende') {
    return roomType.toLowerCase().includes('møde');
  }
  
  // Lærer kan booke både møde lokaler og klasse lokaler
  if (user.userType === 'lærer') {
    return roomType.toLowerCase().includes('møde') || roomType.toLowerCase().includes('klasse');
  }
  
  return false;
}

