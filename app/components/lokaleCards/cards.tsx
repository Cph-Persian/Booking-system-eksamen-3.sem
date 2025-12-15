/**
 * LokaleCard - Viser et lokale kort med information og booking mulighed
 * 
 * Viser lokale detaljer inkl. billede, navn, status, beskrivelse, udstyr og booking knap.
 * Bruges på hoved siden til at vise alle tilgængelige lokaler i et grid layout.
 */
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

export default function LokaleCard({ title, status, statusColor, description, imageUrl, features, infoText, roomId, onBookClick }: LokaleCardProps) {
  // ========================================
  // LOKALE CARD - Viser et lokale kort med info og booking knap
  // ========================================
  // Parser features string til liste (fx "Projektor, Whiteboard" -> ["Projektor", "Whiteboard"])
  const featuresList = features ? features.split(',').map(f => f.trim()).filter(Boolean) : [];

  return (
    <Card shadow="sm" radius="md" withBorder h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Lokale billede */}
      <Card.Section>
        <Image src={imageUrl} height={160} alt={title} />
      </Card.Section>

      <Stack gap="xs" p="md" style={{ flex: 1 }}>
        {/* Titel og status badge */}
        <Group justify="space-between" align="flex-start">
          <Text fw={700} size="lg">
            {title}
          </Text>
          <Badge color={statusColor} variant="light">
            {status}
          </Badge>
        </Group>

        {/* Beskrivelse - Begrænset til 2 linjer */}
        {description && (
          <Text size="sm" c="dimmed" lineClamp={2}>
            {description}
          </Text>
        )}

        {/* Info tekst (fx "Næste ledige tid: 14:00") */}
        {infoText && (
          <Text size="xs" c="blue" fw={500}>
            {infoText}
          </Text>
        )}

        {/* Udstyr liste med ikoner */}
        {featuresList.length > 0 && (
          <>
            <Divider my="xs" />
            <Box>
              <Text size="xs" fw={600} mb="xs" c="dimmed" tt="uppercase">
                Udstyr
              </Text>
              <Group gap="xs">
                {featuresList.map((feature, index) => {
                  const Icon = getFeatureIcon(feature); // Henter ikon baseret på feature navn
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

        {/* Booking knap - Placeret i bunden med mt="auto" */}
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
