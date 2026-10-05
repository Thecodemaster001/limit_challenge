'use client';

import { Box, CircularProgress } from '@mui/material';

export function FullPageSpinner({ label }: { label: string }) {
  return (
    <Box flex={1} display="flex" alignItems="center" justifyContent="center" py={10}>
      <CircularProgress aria-label={label} />
    </Box>
  );
}
