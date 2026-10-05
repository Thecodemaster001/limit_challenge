'use client';

import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PropsWithChildren } from 'react';

import { useAuth } from '@/lib/auth/auth-context';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard' },
  { href: '/vehicles', label: 'Vehicles' },
  { href: '/offices', label: 'Offices' },
  { href: '/mechanics', label: 'Mechanics' },
];

function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

export function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const { username, logout } = useAuth();

  return (
    <>
      <AppBar
        position="sticky"
        color="default"
        elevation={0}
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Toolbar sx={{ gap: 2, flexWrap: 'wrap' }}>
          <Typography
            variant="h6"
            component={Link}
            href="/"
            sx={{ color: 'inherit', textDecoration: 'none', mr: 2 }}
          >
            Fleet Maintenance
          </Typography>
          <Box
            component="nav"
            aria-label="Main"
            sx={{ display: 'flex', gap: 1, flex: 1, overflowX: 'auto' }}
          >
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Button
                  key={item.href}
                  component={Link}
                  href={item.href}
                  color={active ? 'primary' : 'inherit'}
                  aria-current={active ? 'page' : undefined}
                  sx={{ fontWeight: active ? 600 : 400 }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            {username && (
              <Typography variant="body2" color="text.secondary">
                {username}
              </Typography>
            )}
            <Button variant="outlined" size="small" onClick={logout}>
              Log out
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      <Container component="main" maxWidth="lg" sx={{ py: 4, flex: 1 }}>
        {children}
      </Container>
    </>
  );
}
