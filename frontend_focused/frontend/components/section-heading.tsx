import { Box, Typography } from '@mui/material';
import { ReactNode } from 'react';

interface SectionHeadingProps {
  children: ReactNode;
  count?: number;
  action?: ReactNode;
}

export default function SectionHeading({ children, count, action }: SectionHeadingProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, minHeight: 28 }}>
      <Typography variant="h3" component="h2">
        {children}
      </Typography>
      {count !== undefined && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {count}
        </Typography>
      )}
      {action && <Box sx={{ ml: 'auto' }}>{action}</Box>}
    </Box>
  );
}
