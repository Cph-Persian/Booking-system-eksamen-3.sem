// contexts/UserContext.tsx
'use client';

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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Tjek om bruger er logget ind når komponenten loader
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const checkUser = async () => {
      try {
        // Tjek om der er en aktiv session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Hent brugerdata fra Supabase
          const { data: userData, error: userError } = await supabase
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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

  const login = async (email: string, password: string) => {
    if (!supabase) {
      throw new Error('Supabase er ikke konfigureret');
    }

    // Login med Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      // Hent brugerdata fra Supabase
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

  const logout = async () => {
    if (!supabase) return;
    
    await supabase.auth.signOut();
    setUser(null);
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

