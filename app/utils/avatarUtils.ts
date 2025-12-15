/**
 * avatarUtils - Utility funktioner til avatar håndtering
 * 
 * Hjælpefunktioner til at bestemme hvilket avatar der skal vises.
 */
import { User } from '../types/user';
import louiseAvatar from '../img/louise.png';

/**
 * getAvatarSrc - Bestemmer hvilket avatar der skal vises baseret på bruger navn
 * 
 * @param user - Bruger objekt eller null
 * @returns Avatar URL string
 */
export function getAvatarSrc(user: User | null): string {
  if (!user) return '/img/frederik.png';
  
  // Tjekker om bruger navn indeholder "louise" (case insensitive)
  if (user.name?.toLowerCase().includes('louise')) {
    return louiseAvatar.src;
  }
  
  // Bruger avatarUrl hvis den findes, ellers fallback til frederik
  return user.avatarUrl || '/img/frederik.png';
}

