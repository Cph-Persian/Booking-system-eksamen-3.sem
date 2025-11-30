'use client';

import { usePathname } from 'next/navigation';
import { NavbarNested } from './NavbarNested';
import { NavbarContent } from './NavbarContent';
import { NavbarProvider } from '../contexts/NavbarContext';

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

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

