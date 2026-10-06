'use client';

import { CheckCircleOutlined, CloseOutlined, ErrorOutlineOutlined } from '@mui/icons-material';
import { Box, IconButton, Snackbar, Typography } from '@mui/material';
import { createContext, PropsWithChildren, useCallback, useContext, useState } from 'react';

type Severity = 'success' | 'error';

interface Notification {
  id: number;
  message: string;
  severity: Severity;
}

type Notify = (message: string, severity?: Severity) => void;

const NotificationContext = createContext<Notify | null>(null);

const AUTO_HIDE_MS: Record<Severity, number> = { success: 3500, error: 7000 };

const SEVERITY_ICONS: Record<Severity, React.ReactNode> = {
  success: <CheckCircleOutlined sx={{ fontSize: 18, color: '#5bd08f' }} />,
  error: <ErrorOutlineOutlined sx={{ fontSize: 18, color: '#ff8a80' }} />,
};

/** Short feedback ("Note posted") in a toast; a new message replaces the current one. */
export function NotificationProvider({ children }: PropsWithChildren) {
  const [notification, setNotification] = useState<Notification | null>(null);

  const notify = useCallback<Notify>((message, severity = 'success') => {
    setNotification({ id: Date.now(), message, severity });
  }, []);

  const close = (_event?: unknown, reason?: string) => {
    if (reason !== 'clickaway') setNotification(null);
  };

  return (
    <NotificationContext.Provider value={notify}>
      {children}
      <Snackbar
        key={notification?.id}
        open={notification !== null}
        autoHideDuration={notification ? AUTO_HIDE_MS[notification.severity] : null}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box
          role={notification?.severity === 'error' ? 'alert' : 'status'}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            pl: 1.5,
            pr: 0.5,
            py: 0.75,
            minWidth: 280,
            maxWidth: 420,
            borderRadius: 2,
            bgcolor: '#1b1c1f',
            color: '#fff',
            boxShadow: '0 8px 24px rgba(16, 17, 19, 0.24)',
          }}
        >
          {notification && SEVERITY_ICONS[notification.severity]}
          <Typography sx={{ fontSize: 13, flexGrow: 1 }}>{notification?.message}</Typography>
          <IconButton aria-label="Dismiss" onClick={close} sx={{ color: 'rgba(255,255,255,0.6)' }}>
            <CloseOutlined sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      </Snackbar>
    </NotificationContext.Provider>
  );
}

export function useNotify() {
  const notify = useContext(NotificationContext);
  if (!notify) throw new Error('useNotify must be used inside <NotificationProvider>.');
  return notify;
}
