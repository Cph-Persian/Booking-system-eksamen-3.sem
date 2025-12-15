/**
 * ProtectedLayout - Layout komponent der beskytter routes og viser navbar
 * 
 * Viser navbar på alle sider undtagen login siden. Forhindrer hydration fejl ved
 * at vente til komponenten er mounted før rendering. Wrapper hele appen med NavbarProvider.
 */
'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { NavbarNested } from './NavbarNested';
import { NavbarContent } from './NavbarContent';
import { NavbarProvider } from '../contexts/NavbarContext';

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  // ========================================
  // 1. MOUNT CHECK - Forhindrer hydration fejl
  // ========================================
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false); // Forhindrer hydration fejl

  useEffect(() => {
    setMounted(true);
  }, [pathname]);

  // ========================================
  // 2. CONDITIONAL RENDERING - Viser navbar på beskyttede sider
  // ========================================
  if (!mounted) return <>{children}</>; // Vent til mounted for at undgå hydration fejl
  if (pathname === '/login') return <>{children}</>; // Ingen navbar på login side

  return (
    <NavbarProvider>
      <NavbarNested /> {/* Sidebar navigation */}
      <NavbarContent>{children}</NavbarContent> {/* Hovedindhold med margin */}
    </NavbarProvider>
  );
}

