// contexts/UserContext.tsx
'use client';

// User Context - Håndterer brugerautentificering og brugerdata
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/user';
import { supabase } from '../lib/supabaseClient';

interface UserContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Tjek om bruger er logget ind ved app start
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

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

  // Logger brugeren ind
  const login = async (email: string, password: string) => {
    if (!supabase) {
      throw new Error('Systemet er ikke konfigureret korrekt. Kontakt venligst support');
    }

    try {
      // Login med Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Konverter tekniske fejl til forståelige beskeder
        if (error.message.includes('Invalid login credentials') || error.message.includes('Email not confirmed')) {
          throw new Error('Forkert email eller adgangskode. Prøv venligst igen');
        }
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          throw new Error('Kunne ikke oprette forbindelse til serveren. Tjek din internetforbindelse og prøv igen');
        }
        throw error;
      }

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
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          throw new Error('Kunne ikke oprette forbindelse til serveren. Tjek din internetforbindelse og prøv igen');
        }
        throw err;
      }
      throw new Error('Der opstod en uventet fejl ved login. Prøv venligst igen');
    }
  };

  // Logger brugeren ud
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

