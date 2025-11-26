'use client';

import { useState } from 'react';
import { Group, Box, ThemeIcon, UnstyledButton, Text, Collapse } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import Link from 'next/link';
import classes from './NavbarLinksGroup.module.css';

interface LinksGroupProps {
  icon: React.FC<any>;
  label: string;
  link?: string;
  initiallyOpened?: boolean;
  links?: { label: string; link: string }[];
  onClick?: () => void;
  isModal?: boolean;
}

export function LinksGroup({ icon: Icon, label, link, initiallyOpened, links, onClick, isModal }: LinksGroupProps) {
  const hasLinks = Array.isArray(links);
  const [opened, setOpened] = useState(initiallyOpened || false);

  const items = (hasLinks ? links : []).map((link) => (
    <Link key={link.label} href={link.link} className={classes.link}>
      {link.label}
    </Link>
  ));

  if (hasLinks) {
    return (
      <>
        <UnstyledButton onClick={() => setOpened((o) => !o)} className={classes.control}>
          <Group justify="space-between" gap={0}>
            <Box style={{ display: 'flex', alignItems: 'center' }}>
              <ThemeIcon variant="light" size={30}>
                <Icon style={{ width: 18, height: 18 }} />
              </ThemeIcon>
              <Box ml="md">{label}</Box>
            </Box>
            <IconChevronRight
              className={classes.chevron}
              stroke={1.5}
              style={{
                width: 16,
                height: 16,
                transform: opened ? 'rotate(-90deg)' : 'none',
              }}
            />
          </Group>
        </UnstyledButton>
        <Collapse in={opened}>{items}</Collapse>
      </>
    );
  }

  // Hvis der er en direkte link, brug Link komponenten
  if (link) {
    // Hvis der er onClick/isModal, brug Link men forhindre navigation og kald onClick i stedet
    if (onClick || isModal) {
      return (
        <Link 
          href={link} 
          className={classes.control} 
          style={{ textDecoration: 'none' }}
          onClick={(e) => {
            e.preventDefault();
            if (onClick) onClick();
          }}
        >
          <Group justify="space-between" gap={0}>
            <Box style={{ display: 'flex', alignItems: 'center' }}>
              <ThemeIcon variant="light" size={30}>
                <Icon style={{ width: 18, height: 18 }} />
              </ThemeIcon>
              <Box ml="md">{label}</Box>
            </Box>
          </Group>
        </Link>
      );
    }
    
    return (
      <Link href={link} className={classes.control} style={{ textDecoration: 'none' }}>
        <Group justify="space-between" gap={0}>
          <Box style={{ display: 'flex', alignItems: 'center' }}>
            <ThemeIcon variant="light" size={30}>
              <Icon style={{ width: 18, height: 18 }} />
            </ThemeIcon>
            <Box ml="md">{label}</Box>
          </Box>
        </Group>
      </Link>
    );
  }

  // Hvis der er en onClick handler (fx for modal), brug UnstyledButton
  if (onClick || isModal) {
    return (
      <UnstyledButton onClick={onClick} className={classes.control}>
        <Group justify="space-between" gap={0}>
          <Box style={{ display: 'flex', alignItems: 'center' }}>
            <ThemeIcon variant="light" size={30}>
              <Icon style={{ width: 18, height: 18 }} />
            </ThemeIcon>
            <Box ml="md">{label}</Box>
          </Box>
        </Group>
      </UnstyledButton>
    );
  }

  return (
    <UnstyledButton className={classes.control}>
      <Group justify="space-between" gap={0}>
        <Box style={{ display: 'flex', alignItems: 'center' }}>
          <ThemeIcon variant="light" size={30}>
            <Icon style={{ width: 18, height: 18 }} />
          </ThemeIcon>
          <Box ml="md">{label}</Box>
        </Box>
      </Group>
    </UnstyledButton>
  );
}

