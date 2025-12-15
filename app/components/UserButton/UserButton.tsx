/**
 * UserButton - Bruger profil knap med dropdown menu
 * 
 * Viser brugerens avatar og navn. Ved klik åbnes en dropdown menu med konto info
 * og logout funktion. Håndterer logout og redirecter til login siden.
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UnstyledButton, Group, Avatar, Text, Box, Menu } from '@mantine/core';
import { IconChevronRight, IconLogout, IconUser } from '@tabler/icons-react';
import { useUser } from '../../contexts/UserContext';
import classes from './UserButton.module.css';
import louiseAvatar from '../../img/louise.png';

export function UserButton() {
  // ========================================
  // 1. STATE MANAGEMENT
  // ========================================
  const router = useRouter();
  const { user, logout } = useUser();
  const [opened, setOpened] = useState(false);

  // ========================================
  // 2. AVATAR LOGIK - Bestemmer hvilket avatar der skal vises
  // ========================================
  const avatarSrc = user?.name?.toLowerCase().includes('louise') 
    ? louiseAvatar.src 
    : user?.avatarUrl || '/img/frederik.png';

  // ========================================
  // 3. LOGOUT HANDLER - Logger bruger ud og redirecter til login
  // ========================================
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Fejl ved logout:', error);
    }
  };

  return (
    <Menu
      shadow="md"
      width={200}
      position="top-end"
      opened={opened}
      onChange={setOpened}
    >
      {/* Menu trigger - Bruger knap med avatar og navn */}
      <Menu.Target>
        <UnstyledButton className={classes.user}>
          <Group>
            <Avatar
              src={avatarSrc}
              radius="xl"
              alt={user?.name || 'Bruger'}
            />
            <Box style={{ flex: 1 }}>
              <Text size="sm" fw={500}>
                {user?.name || 'Ikke logget ind'}
              </Text>
              <Text c="dimmed" size="xs">
                {user?.email || ''}
              </Text>
            </Box>
            <IconChevronRight style={{ width: 16, height: 16 }} stroke={1.5} />
          </Group>
        </UnstyledButton>
      </Menu.Target>

      {/* Dropdown menu med konto info og logout */}
      <Menu.Dropdown>
        <Menu.Label>Konto</Menu.Label>
        <Menu.Item
          leftSection={<IconUser size={16} />}
          disabled
        >
          {user?.name || 'Bruger'}
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          leftSection={<IconLogout size={16} />}
          color="red"
          onClick={handleLogout}
        >
          Log ud
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

