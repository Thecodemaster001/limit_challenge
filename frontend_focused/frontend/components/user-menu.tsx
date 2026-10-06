'use client';

import { KeyboardOutlined, LogoutOutlined, UnfoldMoreOutlined } from '@mui/icons-material';
import {
  Box,
  ButtonBase,
  Divider,
  ListItemIcon,
  Menu,
  MenuItem,
  Skeleton,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';

import KeyboardKey from '@/components/keyboard-key';
import PersonAvatar from '@/components/person-avatar';
import { useCurrentUser, useLogout } from '@/lib/hooks/use-auth';

interface UserMenuProps {
  /** Avatar only, for the collapsed sidebar. */
  isCompact?: boolean;
  onShowShortcuts: () => void;
}

export default function UserMenu({ isCompact = false, onShowShortcuts }: UserMenuProps) {
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);

  if (!user) {
    return <Skeleton variant="rounded" height={36} />;
  }

  const displayName = user.teamMember?.fullName || user.fullName || user.username;
  const email = user.teamMember?.email;

  return (
    <>
      <Tooltip title={isCompact ? displayName : ''} placement="right" describeChild>
        <ButtonBase
          onClick={(event) => setAnchorElement(event.currentTarget)}
          aria-haspopup="menu"
          aria-expanded={Boolean(anchorElement)}
          aria-label={isCompact ? `Account menu for ${displayName}` : undefined}
          sx={{
            width: '100%',
            justifyContent: isCompact ? 'center' : 'flex-start',
            gap: 1,
            px: 1,
            py: 0.75,
            borderRadius: 1.5,
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <PersonAvatar name={displayName} size={24} />
          {!isCompact && (
            <>
              <Typography
                noWrap
                sx={{ fontSize: 13, fontWeight: 500, flexGrow: 1, textAlign: 'left' }}
              >
                {displayName}
              </Typography>
              <UnfoldMoreOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
            </>
          )}
        </ButtonBase>
      </Tooltip>
      <Menu
        anchorEl={anchorElement}
        open={Boolean(anchorElement)}
        onClose={() => setAnchorElement(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{ paper: { sx: { minWidth: 216, mt: -0.5 } } }}
      >
        <Box sx={{ px: 1.5, py: 1 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{displayName}</Typography>
          {email && (
            <Typography variant="caption" color="text.secondary">
              {email}
            </Typography>
          )}
        </Box>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem
          onClick={() => {
            setAnchorElement(null);
            onShowShortcuts();
          }}
        >
          <ListItemIcon>
            <KeyboardOutlined fontSize="small" />
          </ListItemIcon>
          <Box component="span" sx={{ flexGrow: 1 }}>
            Keyboard shortcuts
          </Box>
          <KeyboardKey>?</KeyboardKey>
        </MenuItem>
        <MenuItem onClick={() => logout.mutate()} disabled={logout.isPending}>
          <ListItemIcon>
            <LogoutOutlined fontSize="small" />
          </ListItemIcon>
          Sign out
        </MenuItem>
      </Menu>
    </>
  );
}
