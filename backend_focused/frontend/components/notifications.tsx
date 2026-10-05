'use client';

import { Alert, AlertColor, Snackbar } from '@mui/material';
import { createContext, PropsWithChildren, useCallback, useContext, useState } from 'react';

interface Notification {
  id: number;
  message: string;
  severity: AlertColor;
}

type Notify = (message: string, severity?: AlertColor) => void;

const NotificationContext = createContext<Notify | null>(null);

const AUTO_HIDE_MS = { success: 4000, info: 5000, warning: 7000, error: 8000 } as const;

/** Shows short feedback ("Vehicle created") in a snackbar; a new message replaces the current one. */
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
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {notification ? (
          <Alert severity={notification.severity} variant="filled" onClose={close}>
            {notification.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </NotificationContext.Provider>
  );
}

export function useNotify(): Notify {
  const notify = useContext(NotificationContext);
  if (!notify) throw new Error('useNotify must be used inside <NotificationProvider>.');
  return notify;
}
