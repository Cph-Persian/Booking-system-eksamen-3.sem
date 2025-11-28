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

  // TODO: Når Supabase auth er implementeret, skal denne useEffect:
  // 1. Lytte til auth state changes fra Supabase
  // 2. Hente brugerdata fra Supabase (inkl. userType fra user_metadata eller en users tabel)
  // 3. Opdatere user state
  useEffect(() => {
    // Simulerer loading
    setTimeout(() => {
      // TODO: Erstat med Supabase auth check:
      // const { data: { session } } = await supabase.auth.getSession();
      // if (session?.user) {
      //   // Hent brugerdata fra Supabase
      //   const userData = await fetchUserData(session.user.id);
      //   setUser(userData);
      // }
      
      // Mock data for nu - fjern når Supabase auth er implementeret
      setUser({
        id: '1',
        email: 'amy.horsefighter@stud.ek.dk',
        name: 'Amy Horsefighter',
        avatarUrl: '/img/frederik.png',
        userType: 'studerende', // eller 'lærer'
      });
      setLoading(false);
    }, 500);
  }, []);

  const login = async (email: string, password: string) => {
    // TODO: Implementer Supabase login:
    // const { data, error } = await supabase.auth.signInWithPassword({
    //   email,
    //   password,
    // });
    // if (error) throw error;
    // if (data.user) {
    //   const userData = await fetchUserData(data.user.id);
    //   setUser(userData);
    // }
    
    // Mock login for nu
    console.log('Login:', email, password);
  };

  const logout = async () => {
    // TODO: Implementer Supabase logout:
    // await supabase.auth.signOut();
    // setUser(null);
    
    // Mock logout for nu
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

