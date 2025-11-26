// components/lokaleCards/cards.tsx
import { Card, Image, Text, Badge, Button } from '@mantine/core';

interface LokaleCardProps {
  title: string;
  status: string;
  statusColor: string;
  description: string;
  imageUrl: string;
}

export default function LokaleCard({ title, status, statusColor, description, imageUrl }: LokaleCardProps) {
  return (
    <Card shadow="sm" radius="md" withBorder>
      <Card.Section>
        <Image src={imageUrl} height={160} alt={title} />
      </Card.Section>

      <Text fw={700} mt="sm">
        {title}
      </Text>

      <Badge color={statusColor} mt="xs">
        {status}
      </Badge>

      <Text size="sm" mt="xs">
        {description}
      </Text>

      <Button color="#043055" fullWidth mt="md" radius="md">Book lokale</Button>
    </Card>
  );
}
