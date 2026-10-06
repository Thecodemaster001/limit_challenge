import { Box, Typography } from '@mui/material';

import { statusOption } from '@/lib/submission-display';
import { SubmissionStatus } from '@/lib/types';

export function StatusDot({ color, size = 8 }: { color: string; size?: number }) {
  return (
    <Box
      component="span"
      aria-hidden
      sx={{ width: size, height: size, borderRadius: '50%', bgcolor: color, flexShrink: 0 }}
    />
  );
}

export default function StatusIndicator({ status }: { status: SubmissionStatus }) {
  const option = statusOption(status);
  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
      <StatusDot color={option.color} />
      <Typography component="span" variant="body2" sx={{ whiteSpace: 'nowrap' }}>
        {option.label}
      </Typography>
    </Box>
  );
}
