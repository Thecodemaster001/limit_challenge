'use client';

import { Tooltip, Typography, TypographyProps } from '@mui/material';

import { formatDateTime, formatRelativeTime } from '@/lib/format';

type RelativeTimeProps = { value: string } & Omit<TypographyProps<'time'>, 'children'>;

export default function RelativeTime({ value, sx, ...typographyProps }: RelativeTimeProps) {
  return (
    <Tooltip title={formatDateTime(value)}>
      <Typography
        component="time"
        dateTime={value}
        variant="body2"
        color="text.secondary"
        sx={[
          { whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
        {...typographyProps}
      >
        {formatRelativeTime(value)}
      </Typography>
    </Tooltip>
  );
}
