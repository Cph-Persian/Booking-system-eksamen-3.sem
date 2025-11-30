'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Text,
  Title,
  Stack,
  Alert,
  Group,
  Loader,
  Center,
} from '@mantine/core';
import { IconAlertCircle, IconEye, IconEyeOff } from '@tabler/icons-react';
import { useUser } from '../contexts/UserContext';
import classes from './AuthenticationImage.module.css';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const { login, user, loading: userLoading } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirect hvis allerede logget ind
  useEffect(() => {
    if (!userLoading && user) {
      router.push('/');
    }
  }, [user, userLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Brug UserContext login funktion (den håndterer Supabase login)
      await login(email, password);
      // Redirect til dashboard
      router.push('/');
    } catch (err: any) {
      console.error('Login fejl:', err);
      setError(err.message || 'Forkert email eller password');
    } finally {
      setLoading(false);
    }
  };

  // Vis loading hvis bruger data loader
  if (userLoading) {
    return (
      <Center style={{ minHeight: '100vh' }}>
        <Loader size="lg" />
      </Center>
    );
  }

  // Hvis allerede logget ind, vis intet (redirect sker i useEffect)
  if (user) {
    return null;
  }

  return (
    <div className={classes.wrapper}>
      <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
        {/* Venstre side - Velkomst */}
        <Paper
          style={{
            flex: '1 1 50%',
            background: '#ffffff',
            padding: '100px 120px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <Group gap="sm" mb="xl">
            <Image 
              src="/ek-logo.jpg" 
              alt="EK Logo" 
              width={60} 
              height={60}
              style={{ objectFit: 'contain', borderRadius: '100%' }}
            />
            <div>
              <Text size="xs" c="dimmed" fw={500}>
                ERHVERVSAKADEMI
              </Text>
              <Text size="xs" c="dimmed" fw={500}>
                KØBENHAVN
              </Text>
            </div>
          </Group>

          <Text size="lg" c="dimmed" mb="xs">
            Velkommen til
          </Text>
          <Title order={1} size="3rem" fw={700} c="#0C53ED" mb="md">
            EK Lokaler
          </Title>
          <Text size="md" c="dimmed" style={{ maxWidth: '400px' }}>
            Book dit næste studielokale, møderum eller grupperum nemt og hurtigt. 
            Kræver login med din EK-mail.
          </Text>
        </Paper>

        {/* Højre side - Login form */}
        <Paper
          className={classes.form}
          style={{
            flex: '1 1 50%',
            background: 'white',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Stack gap="xl" style={{ width: '100%', maxWidth: '450px' }}>
            <div style={{ marginBottom: '2rem' }}>
              <Title order={1} size="2.5rem" fw={700} c="#0C53ED" mb="xl">
                EK Lokaler
              </Title>
              <Title order={2} size="1.5rem" fw={600} c="dark" mb="xl">
                Login
              </Title>
            </div>

            {error && (
              <Alert icon={<IconAlertCircle size={16} />} color="red" title="Fejl" mb="xl">
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Stack gap="xl">
                <div style={{ marginBottom: '1.5rem' }}>
                  <TextInput
                    label="E-mail"
                    placeholder="cph-ah767@stud.ek.dk"
                    value={email}
                    onChange={(e) => setEmail(e.currentTarget.value)}
                    required
                    size="lg"
                    radius="md"
                    styles={{
                      label: { marginBottom: 12, fontWeight: 500, fontSize: '14px' },
                      input: { padding: '14px 16px', fontSize: '16px', minHeight: '48px' },
                    }}
                  />
                  <Text size="xs" c="dimmed" mt={10} style={{ display: 'block' }}>
                    Indtast din skole eller medarbejder mail
                  </Text>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <PasswordInput
                    label="Password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.currentTarget.value)}
                    required
                    size="lg"
                    radius="md"
                    visibilityToggleIcon={({ reveal }) =>
                      reveal ? <IconEyeOff size={20} /> : <IconEye size={20} />
                    }
                    styles={{
                      label: { marginBottom: 12, fontWeight: 500, fontSize: '14px' },
                      input: { padding: '14px 16px', fontSize: '16px', minHeight: '48px' },
                    }}
                  />
                  <Text size="xs" c="dimmed" mt={10} style={{ display: 'block' }}>
                    Indtast dit password
                  </Text>
                </div>

                <Text
                  component="a"
                  href="#"
                  size="sm"
                  c="dark"
                  style={{ 
                    textDecoration: 'none', 
                    marginTop: '1rem', 
                    marginBottom: '2rem',
                    display: 'block'
                  }}
                  onClick={(e) => e.preventDefault()}
                >
                  Glemt adgangskode?
                </Text>

                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  radius="md"
                  loading={loading}
                  style={{
                    backgroundColor: '#0C53ED',
                    marginTop: '2rem',
                    padding: '16px',
                    fontSize: '16px',
                    fontWeight: 600,
                    minHeight: '52px',
                  }}
                >
                  Login
                </Button>
              </Stack>
            </form>
          </Stack>
        </Paper>
      </div>
    </div>
  );
}

