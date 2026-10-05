'use client';

import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { isAxiosError } from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth/auth-context';
import { safeRedirectPath } from '@/lib/safe-redirect-path';

function loginErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    if (error.response?.status === 401) return 'Incorrect username or password.';
    if (!error.response) return "Can't reach the server. Check that the API is running.";
  }
  return 'Something went wrong. Please try again.';
}

export function LoginForm() {
  const { status, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeRedirectPath(searchParams.get('next'));
  const sessionExpired = searchParams.get('reason') === 'session-expired';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') router.replace(nextPath);
  }, [status, nextPath, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await login({ username: username.trim(), password });
    } catch (error) {
      setErrorMessage(loginErrorMessage(error));
      setIsSubmitting(false);
    }
  }

  return (
    <Box flex={1} display="flex" alignItems="center" justifyContent="center" p={2}>
      <Card sx={{ width: '100%', maxWidth: 400 }} variant="outlined">
        <CardContent>
          <Stack component="form" spacing={2.5} onSubmit={handleSubmit} noValidate>
            <div>
              <Typography variant="h5" component="h1">
                Fleet Maintenance
              </Typography>
              <Typography color="text.secondary">Sign in to manage your fleet.</Typography>
            </div>
            {sessionExpired && !errorMessage && (
              <Alert severity="info">Your session expired. Please sign in again.</Alert>
            )}
            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
            <TextField
              label="Username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              autoFocus
              required
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              loading={isSubmitting}
              disabled={!username.trim() || !password}
            >
              Sign in
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
