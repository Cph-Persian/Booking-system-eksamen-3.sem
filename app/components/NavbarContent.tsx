/**
 * NavbarContent - Wrapper komponent der justerer margin baseret på navbar state
 * 
 * Justerer margin-left automatisk når navbar åbnes/lukkes for at give plads til sidebar.
 * Bruger glidende transition for smooth animation. Sikrer at indholdet ikke overlapper navbar.
 */
'use client';

import React from 'react';
import { useNavbar } from '../contexts/NavbarContext';

export function NavbarContent({ children }: { children: React.ReactNode }) {
  // ========================================
  // NAVBAR CONTENT - Justerer margin baseret på navbar state
  // ========================================
  // Justerer margin-left når navbar er åben/lukket
  const { isOpen } = useNavbar();
  
  // Justerer margin baseret på navbar state - Glidende transition
  return (
    <div style={{ 
      marginLeft: isOpen ? '300px' : '0', // 300px margin når navbar er åben
      transition: 'margin-left 0.3s ease' // Glidende animation
    }}>
      {children}
    </div>
  );
}

