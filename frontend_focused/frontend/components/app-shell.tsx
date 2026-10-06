'use client';

import {
  InboxOutlined,
  KeyboardDoubleArrowLeftOutlined,
  KeyboardDoubleArrowRightOutlined,
  MenuOutlined,
} from '@mui/icons-material';
import { Box, ButtonBase, Drawer, IconButton, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useState } from 'react';

import BrandMark from '@/components/brand-mark';
import KeyboardShortcutsDialog from '@/components/keyboard-shortcuts-dialog';
import UserMenu from '@/components/user-menu';
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts';
import { saveSidebarCollapsed } from '@/lib/sidebar-preference';

const SIDEBAR_WIDTH = 232;
const COLLAPSED_SIDEBAR_WIDTH = 60;

interface NavigationItem {
  href: string;
  label: string;
  icon: ReactNode;
}

const NAVIGATION_ITEMS: NavigationItem[] = [
  { href: '/submissions', label: 'Submissions', icon: <InboxOutlined sx={{ fontSize: 18 }} /> },
];

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapsed?: () => void;
  onNavigate?: () => void;
  onShowShortcuts: () => void;
}

function CollapseToggle({ isCollapsed, onToggle }: { isCollapsed: boolean; onToggle: () => void }) {
  const label = isCollapsed ? 'Expand sidebar' : 'Collapse sidebar';
  return (
    <Tooltip title={`${label} · [`} placement="right">
      <IconButton aria-label={label} aria-expanded={!isCollapsed} onClick={onToggle}>
        {isCollapsed ? (
          <KeyboardDoubleArrowRightOutlined sx={{ fontSize: 18 }} />
        ) : (
          <KeyboardDoubleArrowLeftOutlined sx={{ fontSize: 18 }} />
        )}
      </IconButton>
    </Tooltip>
  );
}

function Sidebar({
  isCollapsed = false,
  onToggleCollapsed,
  onNavigate,
  onShowShortcuts,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 1.5 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: isCollapsed ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 0.5,
          pl: isCollapsed ? 0 : 1,
          py: 0.5,
          mb: 2,
        }}
      >
        <BrandMark showName={!isCollapsed} />
        {onToggleCollapsed && (
          <CollapseToggle isCollapsed={isCollapsed} onToggle={onToggleCollapsed} />
        )}
      </Box>
      <Box component="nav" aria-label="Main" sx={{ flexGrow: 1 }}>
        {NAVIGATION_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Tooltip
              key={item.href}
              title={isCollapsed ? item.label : ''}
              placement="right"
              describeChild
            >
              <ButtonBase
                component={Link}
                href={item.href}
                onClick={onNavigate}
                aria-current={isActive ? 'page' : undefined}
                aria-label={isCollapsed ? item.label : undefined}
                sx={(theme) => ({
                  width: '100%',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  gap: 1,
                  px: 1,
                  py: 0.75,
                  borderRadius: 1.5,
                  fontSize: 13,
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  color: isActive ? 'text.primary' : 'text.secondary',
                  bgcolor: isActive ? alpha(theme.palette.text.primary, 0.06) : 'transparent',
                  '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.06) },
                })}
              >
                {item.icon}
                {!isCollapsed && item.label}
              </ButtonBase>
            </Tooltip>
          );
        })}
      </Box>
      <UserMenu isCompact={isCollapsed} onShowShortcuts={onShowShortcuts} />
    </Box>
  );
}

interface AppShellProps {
  initialSidebarCollapsed: boolean;
  children: ReactNode;
}

export default function AppShell({ initialSidebarCollapsed, children }: AppShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(initialSidebarCollapsed);
  const [isMobileNavigationOpen, setIsMobileNavigationOpen] = useState(false);
  const [isShortcutsDialogOpen, setIsShortcutsDialogOpen] = useState(false);
  const showShortcuts = () => setIsShortcutsDialogOpen(true);

  function toggleSidebar() {
    const nextIsCollapsed = !isSidebarCollapsed;
    setIsSidebarCollapsed(nextIsCollapsed);
    saveSidebarCollapsed(nextIsCollapsed);
  }

  useKeyboardShortcuts({ '?': showShortcuts, '[': toggleSidebar });

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Box
        sx={{
          display: { xs: 'none', md: 'block' },
          width: isSidebarCollapsed ? COLLAPSED_SIDEBAR_WIDTH : SIDEBAR_WIDTH,
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'hidden',
          transition: (theme) =>
            theme.transitions.create('width', { duration: theme.transitions.duration.shorter }),
        }}
      >
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapsed={toggleSidebar}
          onShowShortcuts={showShortcuts}
        />
      </Box>

      <Drawer
        open={isMobileNavigationOpen}
        onClose={() => setIsMobileNavigationOpen(false)}
        sx={{ display: { md: 'none' } }}
        slotProps={{ paper: { sx: { width: SIDEBAR_WIDTH, bgcolor: 'background.default' } } }}
      >
        <Sidebar
          onNavigate={() => setIsMobileNavigationOpen(false)}
          onShowShortcuts={() => {
            setIsMobileNavigationOpen(false);
            showShortcuts();
          }}
        />
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
      <KeyboardShortcutsDialog
        open={isShortcutsDialogOpen}
        onClose={() => setIsShortcutsDialogOpen(false)}
      />
    </Box>
  );
}
