'use client';

import { ErrorOutlineOutlined } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';
import { ReactNode } from 'react';

import { parseApiError } from '@/lib/api-errors';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Box
      sx={{
        py: 8,
        px: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      {icon && <Box sx={{ color: 'text.disabled', mb: 1.5, display: 'flex' }}>{icon}</Box>}
      <Typography variant="h3" component="p">
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 360 }}>
          {description}
        </Typography>
      )}
      {action && <Box sx={{ mt: 2.5 }}>{action}</Box>}
    </Box>
  );
}

interface ErrorStateProps {
  error: unknown;
  title?: string;
  onRetry?: () => void;
}

export function ErrorState({ error, title = "Couldn't load this page", onRetry }: ErrorStateProps) {
  return (
    <EmptyState
      icon={<ErrorOutlineOutlined />}
      title={title}
      description={parseApiError(error).message}
      action={
        onRetry && (
          <Button variant="outlined" onClick={onRetry}>
            Try again
          </Button>
        )
      }
    />
  );
}
