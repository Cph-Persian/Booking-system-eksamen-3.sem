'use client';

import { useState, useMemo } from 'react';
import LokaleCard from './components/lokaleCards/cards';
import { SimpleGrid, TextInput, Container, Title, Text } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

const lokaler = [
  {
    title: 'Klasselokale 1',
    status: 'Ledig',
    statusColor: 'green',
    description: 'Dette er et klasselokale med 20 pladser.',
    imageUrl: 'https://cdn.pixabay.com/photo/2016/04/25/18/53/cellular-1352613_1280.jpg'
  },
  {
    title: 'Klasselokale 2',
    status: 'Optaget',
    statusColor: 'red',
    description: 'Dette er et klasselokale med 25 pladser.',
    imageUrl: 'https://cdn.pixabay.com/photo/2016/04/25/18/53/cellular-1352613_1280.jpg'
  },
  {
    title: 'Klasselokale 3',
    status: 'Ledig',
    statusColor: 'green',
    description: 'Dette er et klasselokale med 30 pladser.',
    imageUrl: 'https://cdn.pixabay.com/photo/2016/04/25/18/53/cellular-1352613_1280.jpg'
  },
  {
    title: 'Mødelokale A',
    status: 'Ledig',
    statusColor: 'green',
    description: 'Dette er et mødelokale med 10 pladser.',
    imageUrl: 'https://cdn.pixabay.com/photo/2017/03/28/12/06/chairs-2181916_1280.jpg'
  },
  {
    title: 'Mødelokale B',
    status: 'Optaget',
    statusColor: 'red',
    description: 'Dette er et mødelokale med 8 pladser.',
    imageUrl: 'https://cdn.pixabay.com/photo/2017/03/28/12/06/chairs-2181916_1280.jpg'
  },
  {
    title: 'Auditorium',
    status: 'Ledig',
    statusColor: 'green',
    description: 'Dette er et auditorium med 100 pladser.',
    imageUrl: 'https://cdn.pixabay.com/photo/2013/02/26/01/10/auditorium-86197_1280.jpg'
  },
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLokaler = useMemo(() => {
    if (!searchQuery.trim()) {
      return lokaler;
    }
    
    const query = searchQuery.toLowerCase();
    return lokaler.filter((lokale) =>
      lokale.title.toLowerCase().includes(query) ||
      lokale.description.toLowerCase().includes(query) ||
      lokale.status.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  return (
    <Container size="xl" py="xl">
      <Title order={1} mb="lg">Søg efter lokaler</Title>
      <TextInput
        placeholder="Søg efter lokaler..."
        leftSection={<IconSearch size={16} />}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.currentTarget.value)}
        mb="xl"
        size="md"
      />
      {filteredLokaler.length > 0 ? (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {filteredLokaler.map((lokale, index) => (
            <LokaleCard
              key={index}
              title={lokale.title}
              status={lokale.status}
              statusColor={lokale.statusColor}
              description={lokale.description}
              imageUrl={lokale.imageUrl}
            />
          ))}
        </SimpleGrid>
      ) : (
        <Text ta="center" py="xl" c="dimmed">
          Ingen lokaler fundet for "{searchQuery}"
        </Text>
      )}
    </Container>
  );
}