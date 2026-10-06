'use client';

import { VisibilityOffOutlined, VisibilityOutlined } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

import BrandMark from '@/components/brand-mark';
import { parseApiError } from '@/lib/api-errors';
import { useLogin } from '@/lib/hooks/use-auth';

interface LoginFormProps {
  redirectTo: string;
}

interface FieldErrors {
  username?: string;
  password?: string;
}

export default function LoginForm({ redirectTo }: LoginFormProps) {
  const router = useRouter();
  const login = useLogin();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const missingFields: FieldErrors = {
      username: username.trim() ? undefined : 'Enter your username.',
      password: password ? undefined : 'Enter your password.',
    };
    setFieldErrors(missingFields);
    if (missingFields.username || missingFields.password) return;

    login.mutate(
      { username: username.trim(), password },
      { onSuccess: () => router.replace(redirectTo) },
    );
  }

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 6,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 360 }}>
        <Box sx={{ mb: 3 }}>
          <BrandMark />
        </Box>
        <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 } }}>
          <Typography variant="h1" sx={{ mb: 0.5 }}>
            Sign in
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            Use your underwriting workspace account.
          </Typography>

          <Stack component="form" spacing={2} noValidate onSubmit={handleSubmit}>
            {login.isError && (
              <Alert severity="error" variant="outlined" sx={{ py: 0 }}>
                {parseApiError(login.error).message}
              </Alert>
            )}
            <TextField
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              fullWidth
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              error={Boolean(fieldErrors.username)}
              helperText={fieldErrors.username}
            />
            <TextField
              label="Password"
              name="password"
              type={isPasswordVisible ? 'text' : 'password'}
              autoComplete="current-password"
              fullWidth
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={Boolean(fieldErrors.password)}
              helperText={fieldErrors.password}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                        onClick={() => setIsPasswordVisible((isVisible) => !isVisible)}
                      >
                        {isPasswordVisible ? (
                          <VisibilityOffOutlined fontSize="small" />
                        ) : (
                          <VisibilityOutlined fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              size="medium"
              fullWidth
              loading={login.isPending}
            >
              Sign in
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}
