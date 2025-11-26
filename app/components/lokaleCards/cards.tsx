'use client'
import { Card, Image, Text, Badge, Button, Group } from '@mantine/core';

interface LokaleCardProps {
  title: string;
  status: string;
  statusColor: string;
  description: string;
  imageUrl: string;
}

export default function LokaleCard({ title, status, statusColor, description, imageUrl }: LokaleCardProps) {
  
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Card.Section>
        <Image
          src={imageUrl}
          height={160}
          alt={title}
        />
      </Card.Section>

      <Group justify="space-between" mt="md" mb="xs">
        <Text fw={500}>{title}</Text>
        <Badge color={statusColor}>{status}</Badge>
      </Group>

      <Text size="sm" c="dimmed">
        {description}
      </Text>

      <Button color="#043055" fullWidth mt="md" radius="md">
        Book lokale
      </Button>
    </Card>
  );
}