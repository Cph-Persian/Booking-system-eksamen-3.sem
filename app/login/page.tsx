/**
 * Login Page - Login side med split layout
 * 
 * Viser login formular med email og password input. Håndterer login via UserContext
 * og redirecter til hovedside ved succes. Viser fejlbeskeder ved forkert login.
 * Har split layout med baggrundsbillede på venstre side og form på højre side.
 * Redirecter automatisk til hovedside hvis bruger allerede er logget ind.
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Paper, TextInput, PasswordInput, Button, Text, Title, Stack, Alert, Group, Loader, Center } from '@mantine/core';
import { IconAlertCircle, IconEye, IconEyeOff } from '@tabler/icons-react';
import { useUser } from '../contexts/UserContext';
import classes from './AuthenticationImage.module.css';
import Image from 'next/image';
import loginBg from '../img/login-baggrund.png';

export default function LoginPage() {
  // ========================================
  // 1. STATE MANAGEMENT
  // ========================================
  const router = useRouter();
  const { login, user, loading: userLoading } = useUser();
  const [email, setEmail] = useState(''); // Email input
  const [password, setPassword] = useState(''); // Password input
  const [error, setError] = useState<string | null>(null); // Fejlbesked
  const [loading, setLoading] = useState(false); // Loading state ved login

  // ========================================
  // 2. AUTHENTICATION CHECK - Redirect hvis allerede logget ind
  // ========================================
  useEffect(() => {
    if (!userLoading && user) router.push('/'); // Redirect til hovedside hvis logget ind
  }, [user, userLoading, router]);

  // ========================================
  // 3. LOGIN HANDLER - Håndterer login formular submit
  // ========================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password); // Kalder login funktion fra UserContext
      router.push('/'); // Redirect til hovedside ved succes
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Forkert email eller adgangskode');
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // 4. LOADING STATE - Viser loader mens brugerdata hentes
  // ========================================
  if (userLoading) {
    return (
      <Center style={{ minHeight: '100vh' }}>
        <Loader size="lg" />
      </Center>
    );
  }

  // ========================================
  // 5. AUTHENTICATION CHECK - Returner null hvis allerede logget ind
  // ========================================
  if (user) {
    return null;
  }

  // ========================================
  // 6. UI RENDERING - Login side med split layout
  // ========================================
  return (
    <div className={classes.wrapper}>
      <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
        <Paper
          style={{
            flex: '1 1 50%',
            position: 'relative',
            padding: '100px 120px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            color: 'white',
            backgroundImage: `url(${loginBg.src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            overflow: 'visible',
          }}
        >
          <Group gap="sm" style={{ position: 'absolute', top: '15px', left: '15px', zIndex: 100 }}>
            <Image src="/ek-logo.jpg" alt="EK Logo" width={60} height={60} style={{ objectFit: 'contain', borderRadius: '100%' }} />
            <div>
              <Text size="xs" c="#0038A7" fw={500}>ERHVERVSAKADEMI</Text>
              <Text size="xs" c="#0038A7" fw={500}>KØBENHAVN</Text>
            </div>
          </Group>
          <Text size="lg" c="#0038A7" mb="xs">Velkommen til</Text>
          <Title order={1} size="3rem" fw={700} c="#0038A7" mb="md">EK Lokaler</Title>
          <Text size="md" c="#0038A7" style={{ maxWidth: '400px' }}>
            Book dit næste studielokale, møderum eller grupperum nemt og hurtigt. Kræver login med din EK-mail.
          </Text>
        </Paper>

        <Paper className={classes.form} style={{ flex: '1 1 50%', background: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <Stack gap="xl" style={{ width: '100%', maxWidth: '450px' }}>
            <div style={{ marginBottom: '2rem' }}>
              <Title order={1} size="2.5rem" fw={700} c="#0038A7" mb="xl">
                EK Lokaler
              </Title>
              <Title order={2} size="1.5rem" fw={600} c="dark" mb="xl">
                Login
              </Title>
            </div>

            {/* Viser fejlbesked hvis login fejler */}
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
