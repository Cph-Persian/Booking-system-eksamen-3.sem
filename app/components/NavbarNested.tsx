/**
 * NavbarNested - Sidebar navigation komponent med links og bruger menu
 * 
 * Viser sidebar navigation med links til hovedside, mine bookinger og booking modal.
 * Kan åbnes/lukkes via toggle knap. Viser logo, navigation links og UserButton i footer.
 * Viser floating toggle knap når navbar er lukket.
 */
'use client';

import { useState } from 'react';
import {
    IconCalendarStats,
    IconGauge,
    IconMenu2,
    IconSearch,
    IconX,
  } from '@tabler/icons-react';
import { Group, ScrollArea, Text, Button } from '@mantine/core';
import { LinksGroup } from './NavbarLinksGroup/NavbarLinksGroup';
import { UserButton } from './UserButton/UserButton';
import { Logo } from './Logo';
import { useNavbar } from '../contexts/NavbarContext';
import { BookingModal } from './bookingModal/Demo';
import classes from './NavbarNested.module.css';

const mockdata = [
  { label: 'Ledige lokaler', icon: IconGauge, link: '/' },
  { label: 'Mine bookinger', icon: IconCalendarStats, link: '/myBookings'},
  { label: 'Book lokale', icon: IconSearch, link: '#', isModal: true},
];

export function NavbarNested() {
  // ========================================
  // 1. STATE MANAGEMENT
  // ========================================
  const { isOpen, toggle } = useNavbar();
  const [modalOpened, setModalOpened] = useState(false);

  // ========================================
  // 2. NAVIGATION LINKS - Mapper navigation links
  // ========================================
  // Håndterer både links og modaler
  const links = mockdata.map((item) => {
    if (item.isModal) {
      return (
        <LinksGroup
          key={item.label}
          {...item}
          onClick={() => setModalOpened(true)}
        />
      );
    }
    return <LinksGroup {...item} key={item.label} />;
  });

  return (
    <>
      <nav className={`${classes.navbar} ${isOpen ? classes.navbarOpen : classes.navbarClosed}`}>
        <div className={classes.header}>
          <Group gap="sm" justify="space-between">
            <Group gap="sm">
              <Logo style={{ width: 40 }} />
              {/* Viser titel kun når navbar er åben */}
              {isOpen && <Text fw={700} size="lg" c="#0038A7">EK Lokaler</Text>}
            </Group>
            {/* Toggle knap til at åbne/lukke navbar */}
            <Button
              variant="subtle"
              onClick={toggle}
              size="sm"
              p="xs"
            >
              {isOpen ? <IconX size={20} /> : <IconMenu2 size={20} />}
            </Button>
          </Group>
        </div>

        {/* Viser navigation links og user button kun når navbar er åben */}
        {isOpen && (
          <>
            <ScrollArea className={classes.links}>
              <div className={classes.linksInner}>{links}</div>
            </ScrollArea>

            <div className={classes.footer}>
              <UserButton />
            </div>
          </>
        )}
      </nav>
      {/* Floating toggle knap når navbar er lukket */}
      {!isOpen && (
        <Button
          variant="filled"
          onClick={toggle}
          style={{
            position: 'fixed',
            top: '1rem',
            left: '1rem',
            zIndex: 1000,
          }}
        >
          <IconMenu2 size={20} />
        </Button>
      )}
      {/* Booking modal fra navigation */}
      <BookingModal opened={modalOpened} onClose={() => setModalOpened(false)} />
    </>
  );
}