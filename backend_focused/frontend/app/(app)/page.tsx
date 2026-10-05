'use client';

import { Stack, Typography } from '@mui/material';

import { useAuth } from '@/lib/auth/auth-context';

export default function DashboardPage() {
  const { username } = useAuth();

  return (
    <Stack spacing={1}>
      <Typography variant="h4" component="h1">
        Dashboard
      </Typography>
      <Typography color="text.secondary">Welcome back{username ? `, ${username}` : ''}.</Typography>
    </Stack>
  );
}
