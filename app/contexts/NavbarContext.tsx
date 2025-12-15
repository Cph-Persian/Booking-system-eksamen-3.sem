/**
 * NavbarContext - Context provider for navbar åben/lukket state
 * 
 * Håndterer navbar state (åben/lukket) gennem hele applikationen.
 * Giver toggle funktion til at åbne/lukke navbar og isOpen state til alle komponenter.
 * Bruges af NavbarNested og NavbarContent til at synkronisere navbar visning.
 */
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface NavbarContextType {
  isOpen: boolean;
  toggle: () => void;
}

const NavbarContext = createContext<NavbarContextType | undefined>(undefined);

export function NavbarProvider({ children }: { children: ReactNode }) {
  // ========================================
  // 1. STATE MANAGEMENT
  // ========================================
  const [isOpen, setIsOpen] = useState(true); // Default: åben

  // ========================================
  // 2. TOGGLE FUNCTION - Åbner/lukker navbar
  // ========================================
  const toggle = () => {
    setIsOpen((prev) => !prev);
  };

  // ========================================
  // 3. PROVIDER - Giver navbar context til hele appen
  // ========================================
  return (
    <NavbarContext.Provider value={{ isOpen, toggle }}>
      {children}
    </NavbarContext.Provider>
  );
}

// ========================================
// USE NAVBAR HOOK - Hook til at bruge navbar context
// ========================================
export function useNavbar() {
  const context = useContext(NavbarContext);
  if (context === undefined) {
    throw new Error('useNavbar must be used within a NavbarProvider');
  }
  return context;
}

