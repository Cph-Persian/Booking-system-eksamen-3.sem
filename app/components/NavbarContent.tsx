'use client';

import React from 'react';
import { useNavbar } from '../contexts/NavbarContext';

export function NavbarContent({ children }: { children: React.ReactNode }) {
  const { isOpen } = useNavbar();
  
  return (
    <div style={{ 
      marginLeft: isOpen ? '300px' : '0',
      transition: 'margin-left 0.3s ease'
    }}>
      {children}
    </div>
  );
}

