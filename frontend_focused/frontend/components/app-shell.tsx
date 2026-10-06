'use client';

import { InboxOutlined, MenuOutlined } from '@mui/icons-material';
import { Box, ButtonBase, Drawer, IconButton } from '@mui/material';
import { alpha } from '@mui/material/styles';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PropsWithChildren, ReactNode, useState } from 'react';

import BrandMark from '@/components/brand-mark';
import UserMenu from '@/components/user-menu';

const SIDEBAR_WIDTH = 232;

interface NavigationItem {
  href: string;
  label: string;
  icon: ReactNode;
}

const NAVIGATION_ITEMS: NavigationItem[] = [
  { href: '/submissions', label: 'Submissions', icon: <InboxOutlined sx={{ fontSize: 18 }} /> },
];

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 1.5 }}>
      <Box sx={{ px: 1, py: 1, mb: 2 }}>
        <BrandMark />
      </Box>
      <Box component="nav" aria-label="Main" sx={{ flexGrow: 1 }}>
        {NAVIGATION_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <ButtonBase
              key={item.href}
              component={Link}
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? 'page' : undefined}
              sx={(theme) => ({
                width: '100%',
                justifyContent: 'flex-start',
                gap: 1,
                px: 1,
                py: 0.75,
                borderRadius: 1.5,
                fontSize: 13,
                fontWeight: 500,
                color: isActive ? 'text.primary' : 'text.secondary',
                bgcolor: isActive ? alpha(theme.palette.text.primary, 0.06) : 'transparent',
                '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.06) },
              })}
            >
              {item.icon}
              {item.label}
            </ButtonBase>
          );
        })}
      </Box>
      <UserMenu />
    </Box>
  );
}

export default function AppShell({ children }: PropsWithChildren) {
  const [isMobileNavigationOpen, setIsMobileNavigationOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Box
        sx={{
          display: { xs: 'none', md: 'block' },
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          height: '100vh',
        }}
      >
        <Sidebar />
      </Box>

      <Drawer
        open={isMobileNavigationOpen}
        onClose={() => setIsMobileNavigationOpen(false)}
        sx={{ display: { md: 'none' } }}
        slotProps={{ paper: { sx: { width: SIDEBAR_WIDTH, bgcolor: 'background.default' } } }}
      >
        <Sidebar onNavigate={() => setIsMobileNavigationOpen(false)} />
      </Drawer>

      <Box
        sx={{
          flexGrow: 1,
          minWidth: 0,
          bgcolor: 'background.paper',
          borderLeft: { md: 1 },
          borderColor: { md: 'divider' },
        }}
      >
        <Box
          sx={{
            display: { xs: 'flex', md: 'none' },
            alignItems: 'center',
            gap: 1,
            px: 1.5,
            height: 52,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <IconButton aria-label="Open navigation" onClick={() => setIsMobileNavigationOpen(true)}>
            <MenuOutlined fontSize="small" />
          </IconButton>
          <BrandMark />
        </Box>
        <Box component="main">{children}</Box>
      </Box>
    </Box>
  );
}
