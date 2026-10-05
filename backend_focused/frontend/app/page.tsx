'use client';

import { Box, Container, Typography } from '@mui/material';

export default function HomePage() {
  return (
    <Container maxWidth="md" sx={{ py: 10 }}>
      <Box display="flex" flexDirection="column" gap={2}>
        <Typography variant="h3" component="h1">
          Fleet Maintenance
        </Typography>
        <Typography color="text.secondary">
          Vehicles, offices, mechanics and maintenance history in one place.
        </Typography>
      </Box>
    </Container>
  );
}
