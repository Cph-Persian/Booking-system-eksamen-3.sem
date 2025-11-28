'use client';

import { UnstyledButton, Group, Avatar, Text, Box } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import { useUser } from '../../contexts/UserContext';
import classes from './UserButton.module.css';

export function UserButton() {
  const { user } = useUser();

  return (
    <UnstyledButton className={classes.user}>
      <Group>
        <Avatar
          src={user?.avatarUrl || '/img/frederik.png'}
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
  );
}

