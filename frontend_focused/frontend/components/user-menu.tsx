'use client';

import { LogoutOutlined, UnfoldMoreOutlined } from '@mui/icons-material';
import {
  Avatar,
  Box,
  ButtonBase,
  Divider,
  ListItemIcon,
  Menu,
  MenuItem,
  Skeleton,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useState } from 'react';

import { useCurrentUser, useLogout } from '@/lib/hooks/use-auth';

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export default function UserMenu() {
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
      <ButtonBase
        onClick={(event) => setAnchorElement(event.currentTarget)}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchorElement)}
        sx={{
          width: '100%',
          justifyContent: 'flex-start',
          gap: 1,
          px: 1,
          py: 0.75,
          borderRadius: 1.5,
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <Avatar
          sx={(theme) => ({
            width: 24,
            height: 24,
            fontSize: 11,
            fontWeight: 600,
            color: 'primary.main',
            bgcolor: alpha(theme.palette.primary.main, 0.12),
          })}
        >
          {initialsOf(displayName)}
        </Avatar>
        <Typography noWrap sx={{ fontSize: 13, fontWeight: 500, flexGrow: 1, textAlign: 'left' }}>
          {displayName}
        </Typography>
        <UnfoldMoreOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
      </ButtonBase>
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
