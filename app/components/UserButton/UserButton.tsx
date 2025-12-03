'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UnstyledButton, Group, Avatar, Text, Box, Menu } from '@mantine/core';
import { IconChevronRight, IconLogout, IconUser } from '@tabler/icons-react';
import { useUser } from '../../contexts/UserContext';
import classes from './UserButton.module.css';
import louiseAvatar from '../../img/louise.png';

export function UserButton() {
  const router = useRouter();
  const { user, logout } = useUser();
  const [opened, setOpened] = useState(false);

  // Vælg profilbillede afhængigt af bruger
  // - Hvis det er Louise → brug louise-billede
  // - Ellers brug avatarUrl fra databasen eller standard Frederik-billede
  const avatarSrc = (() => {
    const name = user?.name?.toLowerCase() || '';
    if (name.includes('louise')) {
      return louiseAvatar.src;
    }
    return user?.avatarUrl || '/img/frederik.png';
  })();

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

