/**
 * UserContext - Context provider for brugerautentificering og brugerdata
 * 
 * Håndterer login, logout og brugerdata gennem hele applikationen.
 * Tjekker automatisk om bruger er logget ind ved mount og lytter til auth state ændringer.
 * Giver login/logout funktioner og brugerdata til alle komponenter via useUser hook.
 */
'use client';

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
  // ========================================
  // 1. STATE MANAGEMENT
  // ========================================
  const [user, setUser] = useState<User | null>(null); // Brugerdata
  const [loading, setLoading] = useState(true); // Loading state

  // ========================================
  // 2. INITIAL USER CHECK - Tjekker om bruger er logget ind ved mount
  // ========================================
  useEffect(() => {
    const client = supabase;
    if (!client) {
      setLoading(false);
      return;
    }

    const checkUser = async () => {
      try {
        const { data: { session } } = await client.auth.getSession();
        if (session?.user) {
          // Prøver først at hente fra users tabel, ellers bruger metadata fra session
          const { data: userData, error: userError } = await client
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (userError) {
            // Fallback til session metadata hvis users tabel ikke findes
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || '',
              avatarUrl: session.user.user_metadata?.avatar_url,
              userType: session.user.user_metadata?.user_type || 'studerende',
            });
          } else if (userData) {
            // Bruger data fra users tabel hvis den findes
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
    
    // ========================================
    // 3. AUTH STATE LISTENER - Lytter til auth state ændringer
    // ========================================
    // Opdaterer brugerdata automatisk ved login/logout
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        checkUser(); // Opdater brugerdata ved login
      } else {
        setUser(null); // Ryd brugerdata ved logout
      }
    });
    return () => subscription.unsubscribe(); // Cleanup ved unmount
  }, []);

  // ========================================
  // 4. LOGIN FUNCTION - Logger bruger ind
  // ========================================
  const login = async (email: string, password: string) => {
    if (!supabase) throw new Error('Systemet er ikke konfigureret');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        // Konverterer Supabase fejl til brugervenlige beskeder
        if (error.message.includes('Invalid login credentials') || error.message.includes('Email not confirmed')) {
          throw new Error('Forkert email eller adgangskode');
        }
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          throw new Error('Ingen internetforbindelse');
        }
        throw error;
      }
      if (data.user) {
        // Henter brugerdata fra users tabel efter login
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();
        if (userError) {
          // Fallback til session metadata
          setUser({
            id: data.user.id,
            email: data.user.email || email,
            name: data.user.user_metadata?.name || email.split('@')[0],
            avatarUrl: data.user.user_metadata?.avatar_url,
            userType: data.user.user_metadata?.user_type || 'studerende',
          });
        } else if (userData) {
          // Bruger data fra users tabel
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
          throw new Error('Ingen internetforbindelse');
        }
        throw err;
      }
      throw new Error('Uventet fejl ved login');
    }
  };

  // ========================================
  // 5. LOGOUT FUNCTION - Logger bruger ud
  // ========================================
  const logout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut(); // Log ud fra Supabase
    setUser(null); // Ryd brugerdata
  };

  // ========================================
  // 6. PROVIDER - Giver brugercontext til hele appen
  // ========================================
  return (
    <UserContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

// ========================================
// USE USER HOOK - Hook til at bruge brugercontext
// ========================================
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

