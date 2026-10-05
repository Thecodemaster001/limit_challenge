'use client';

import { Box, Typography } from '@mui/material';
import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <Box
      display="flex"
      flexWrap="wrap"
      alignItems="flex-start"
      justifyContent="space-between"
      gap={2}
      mb={3}
    >
      <Box>
        <Typography variant="h4" component="h1">
          {title}
        </Typography>
        {description && (
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {description}
          </Typography>
        )}
      </Box>
      {actions && (
        <Box display="flex" gap={1}>
          {actions}
        </Box>
      )}
    </Box>
  );
}
