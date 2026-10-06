import { Box, Typography } from '@mui/material';

interface BrandMarkProps {
  showName?: boolean;
}

export default function BrandMark({ showName = true }: BrandMarkProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box
        component="svg"
        viewBox="0 0 24 24"
        aria-hidden
        sx={{ width: 22, height: 22, flexShrink: 0, color: 'primary.main' }}
      >
        <rect width="24" height="24" rx="6" fill="currentColor" />
        <rect x="6" y="7" width="12" height="2.2" rx="1.1" fill="#fff" />
        <rect x="6" y="11" width="9" height="2.2" rx="1.1" fill="#fff" opacity="0.8" />
        <rect x="6" y="15" width="6" height="2.2" rx="1.1" fill="#fff" opacity="0.6" />
      </Box>
      {showName && (
        <Typography component="span" sx={{ fontSize: 14, fontWeight: 600 }}>
          Submission Tracker
        </Typography>
      )}
    </Box>
  );
}
