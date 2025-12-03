// contexts/UserContext.tsx
'use client';

/**
 * User Context
 * 
 * Denne context håndterer brugerautentificering og brugerdata:
 * - Tjekker om bruger er logget ind ved app start
 * - Giver login og logout funktionalitet
 * - Synkroniserer brugerdata med Supabase
 * - Lytter til auth state changes for real-time opdateringer
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/user';
import { supabase } from '../lib/supabaseClient';

interface UserContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  // Når Supabase auth er implementeret, kan vi tilføje:
  // signUp: (email: string, password: string, userType: UserType) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  // State (tilstand) - gemmer værdier der kan ændres
  const [user, setUser] = useState<User | null>(null);    // Den aktuelle bruger (eller null hvis ikke logget ind)
  const [loading, setLoading] = useState(true);             // Om brugerdata stadig loader

  // Tjek om bruger er logget ind når komponenten loader
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Gem supabase i lokal variabel så TypeScript ved den ikke er null
    const client = supabase;

    const checkUser = async () => {
      try {
        // Tjek om der er en aktiv session
        const { data: { session } } = await client.auth.getSession();
        
        if (session?.user) {
          // Hent brugerdata fra Supabase
          const { data: userData, error: userError } = await client
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (userError) {
            // Hvis der ikke er en users tabel, brug metadata fra auth
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || '',
              avatarUrl: session.user.user_metadata?.avatar_url,
              userType: session.user.user_metadata?.user_type || 'studerende',
            });
          } else if (userData) {
            setUser({
              id: userData.id,
              email: userData.email,
              name: userData.name,
              avatarUrl: userData.avatar_url,
              userType: userData.user_type,
            });
          }
        }
      } catch (err) {
        console.error('Fejl ved tjek af bruger:', err);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Lyt til auth state changes
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        checkUser();
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Logger brugeren ind med email og password
   * Henter brugerdata fra Supabase og opdaterer user state
   * 
   * @param email - Brugerens email
   * @param password - Brugerens password
   * @throws Error hvis login fejler eller Supabase ikke er konfigureret
   */
  const login = async (email: string, password: string) => {
    if (!supabase) {
      throw new Error('Supabase er ikke konfigureret');
    }

    // Login med Supabase authentication
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      // Hent brugerdata fra Supabase users tabel
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (userError) {
        // Hvis der ikke er en users tabel, brug metadata fra auth
        setUser({
          id: data.user.id,
          email: data.user.email || email,
          name: data.user.user_metadata?.name || email.split('@')[0],
          avatarUrl: data.user.user_metadata?.avatar_url,
          userType: data.user.user_metadata?.user_type || 'studerende',
        });
      } else if (userData) {
        // Brug data fra users tabel hvis den findes
        setUser({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          avatarUrl: userData.avatar_url,
          userType: userData.user_type,
        });
      }
    }
  };

  /**
   * Logger brugeren ud
   * Fjerner session fra Supabase og nulstiller user state
   */
  const logout = async () => {
    if (!supabase) return;
    
    await supabase.auth.signOut();  // Log ud fra Supabase
    setUser(null);                  // Nulstil user state
  };

  return (
    <UserContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

// TODO: Hjælpefunktion til at hente brugerdata fra Supabase
// async function fetchUserData(userId: string): Promise<User> {
//   const { data, error } = await supabase
//     .from('users')
//     .select('*')
//     .eq('id', userId)
//     .single();
//   
//   if (error) throw error;
//   
//   return {
//     id: data.id,
//     email: data.email,
//     name: data.name,
//     avatarUrl: data.avatar_url,
//     userType: data.user_type as UserType,
//   };
// }

