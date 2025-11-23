'use client';

import {
    IconCalendarStats,
    IconGauge,
  } from '@tabler/icons-react';
import { Group, ScrollArea, Text } from '@mantine/core';
import { LinksGroup } from './NavbarLinksGroup/NavbarLinksGroup';
import { UserButton } from './UserButton/UserButton';
import { Logo } from './Logo';
import classes from './NavbarNested.module.css';

const mockdata = [
  { label: 'Dashboard', icon: IconGauge, link: '/' },
  { label: 'Mine bookinger', icon: IconCalendarStats, link: '/myBookings' },
];

export function NavbarNested() {
  const links = mockdata.map((item) => <LinksGroup {...item} key={item.label} />);

  return (
    <nav className={classes.navbar}>
      <div className={classes.header}>
        <Group gap="sm">
          <Logo style={{ width: 40 }} />
          <Text fw={700} size="lg" c="#0540a3">EK Lokaler</Text>
        </Group>
      </div>

      <ScrollArea className={classes.links}>
        <div className={classes.linksInner}>{links}</div>
      </ScrollArea>

      <div className={classes.footer}>
        <UserButton />
      </div>
    </nav>
  );
}