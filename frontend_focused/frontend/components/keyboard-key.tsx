import { Box } from '@mui/material';
import { PropsWithChildren } from 'react';

export default function KeyboardKey({ children }: PropsWithChildren) {
  return (
    <Box
      component="kbd"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 20,
        height: 20,
        px: 0.5,
        border: 1,
        borderColor: 'divider',
        borderBottomWidth: 2,
        borderRadius: 1,
        bgcolor: 'background.paper',
        color: 'text.secondary',
        fontFamily: 'inherit',
        fontSize: 11,
        fontWeight: 500,
        lineHeight: 1,
      }}
    >
      {children}
    </Box>
  );
}
