// app/components/lokaleCards/cards.tsx

// Lokale Card - Viser information om et lokale med status og udstyr
import { Card, Image, Text, Badge, Button, Group, Stack, Divider, Box } from '@mantine/core';
import { getFeatureIcon } from '../../utils/featureIcons';

interface LokaleCardProps {
  title: string;
  status: string;
  statusColor: string;
  description: string;
  imageUrl: string;
  features?: string | null;
  infoText?: string;
  roomId?: string;
  onBookClick?: () => void;
}

export default function LokaleCard({ 
  title, 
  status, 
  statusColor, 
  description, 
  imageUrl, 
  features,
  infoText,
  roomId,
  onBookClick
}: LokaleCardProps) {
  // Split features op i en liste
  const featuresList = features 
    ? features.split(',').map(f => f.trim()).filter(Boolean)
    : [];

  return (
    <Card shadow="sm" radius="md" withBorder h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
      <Card.Section>
        <Image src={imageUrl} height={160} alt={title} />
      </Card.Section>

      <Stack gap="xs" p="md" style={{ flex: 1 }}>
        <Group justify="space-between" align="flex-start">
          <Text fw={700} size="lg">
            {title}
          </Text>
          <Badge color={statusColor} variant="light">
            {status}
          </Badge>
        </Group>

        {description && (
          <Text size="sm" c="dimmed" lineClamp={2}>
            {description}
          </Text>
        )}

        {infoText && (
          <Text size="xs" c="blue" fw={500}>
            {infoText}
          </Text>
        )}

        {featuresList.length > 0 && (
          <>
            <Divider my="xs" />
            <Box>
              <Text size="xs" fw={600} mb="xs" c="dimmed" tt="uppercase">
                Udstyr
              </Text>
              <Group gap="xs">
                {featuresList.map((feature, index) => {
                  const Icon = getFeatureIcon(feature);
                  return (
                    <Badge
                      key={index}
                      variant="light"
                      color="gray"
                      leftSection={<Icon size={14} />}
                      size="sm"
                    >
                      {feature}
                    </Badge>
                  );
                })}
              </Group>
            </Box>
          </>
        )}

        <Box mt="auto" pt="md">
          <Button 
            color="#043055" 
            fullWidth 
            radius="md"
            size="md"
            onClick={onBookClick}
          >
            Book lokale
          </Button>
        </Box>
      </Stack>
    </Card>
  );
}
