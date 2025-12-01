// app/components/ProtectedLayout.tsx
'use client';

/**
 * Protected Layout Komponent
 * 
 * Denne komponent bestemmer om navigation skal vises baseret på den aktuelle side:
 * - Login siden vises uden navigation
 * - Alle andre sider vises med navigation (NavbarNested og NavbarContent)
 * - Bruger mounted state for at undgå hydration mismatch fejl
 */

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { NavbarNested } from './NavbarNested';
import { NavbarContent } from './NavbarContent';
import { NavbarProvider } from '../contexts/NavbarContext';

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  // Hent den aktuelle pathname (fx '/login' eller '/')
  const pathname = usePathname();
  
  // State (tilstand) - gemmer værdier der kan ændres
  const [isLoginPage, setIsLoginPage] = useState(false);  // Om vi er på login siden
  const [mounted, setMounted] = useState(false);          // Om komponenten er mounted (til hydration fix)

  // Vent til komponenten er mounted på client-siden for at undgå hydration mismatch
  useEffect(() => {
    setMounted(true);
    setIsLoginPage(pathname === '/login');
  }, [pathname]);

  // Vis intet indtil komponenten er mounted (forhindrer hydration mismatch)
  if (!mounted) {
    return <>{children}</>;
  }

  // Hvis det er login siden, vis kun children uden navigation
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Ellers vis med navigation
  return (
    <NavbarProvider>
      <NavbarNested />
      <NavbarContent>{children}</NavbarContent>
    </NavbarProvider>
  );
}

