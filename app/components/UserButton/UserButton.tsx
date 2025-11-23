'use client';

import { UnstyledButton, Group, Avatar, Text, Box } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import classes from './UserButton.module.css';

export function UserButton() {
  return (
    <UnstyledButton className={classes.user}>
      <Group>
        <Avatar
          src="https://i.pravatar.cc/150?img=12"
          radius="xl"
        />
        <Box style={{ flex: 1 }}>
          <Text size="sm" fw={500}>
            Frederik
          </Text>
          <Text c="dimmed" size="xs">
            cph-ff@stud.ek.dk
          </Text>
        </Box>
        <IconChevronRight style={{ width: 16, height: 16,}} stroke={1.5} />
      </Group>
    </UnstyledButton>
  );
}

