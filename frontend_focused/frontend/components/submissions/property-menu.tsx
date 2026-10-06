'use client';

import { CheckOutlined, KeyboardArrowDownOutlined } from '@mui/icons-material';
import { ButtonBase, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import { ReactNode, useState } from 'react';

import { TOUCH_TARGET_SIZE, touchScreen } from '@/lib/theme';

export interface PropertyMenuOption<Value extends string> {
  value: Value;
  label: string;
  icon?: ReactNode;
}

interface PropertyMenuProps<Value extends string> {
  label: string;
  value: Value;
  options: PropertyMenuOption<Value>[];
  children: ReactNode;
  onSelect: (value: Value) => void;
}

/** Shows a property's current value and lets the user pick another one in place. */
export default function PropertyMenu<Value extends string>({
  label,
  value,
  options,
  children,
  onSelect,
}: PropertyMenuProps<Value>) {
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);
  const currentLabel = options.find((option) => option.value === value)?.label ?? value;

  return (
    <>
      <ButtonBase
        onClick={(event) => setAnchorElement(event.currentTarget)}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchorElement)}
        aria-label={`${label}: ${currentLabel}. Change ${label.toLowerCase()}`}
        sx={{
          width: '100%',
          justifyContent: 'space-between',
          gap: 1,
          mx: -1,
          px: 1,
          py: 0.5,
          borderRadius: 1.5,
          textAlign: 'left',
          border: 1,
          borderColor: 'transparent',
          [touchScreen]: { minHeight: TOUCH_TARGET_SIZE },
          '& .property-chevron': { opacity: 0.45, transition: 'opacity 120ms' },
          '&:hover, &.Mui-focusVisible': { bgcolor: 'action.hover', borderColor: 'divider' },
          '&:hover .property-chevron, &.Mui-focusVisible .property-chevron': { opacity: 1 },
        }}
      >
        {children}
        <KeyboardArrowDownOutlined
          className="property-chevron"
          sx={{ fontSize: 16, color: 'text.secondary' }}
        />
      </ButtonBase>
      <Menu
        anchorEl={anchorElement}
        open={Boolean(anchorElement)}
        onClose={() => setAnchorElement(null)}
        slotProps={{ paper: { sx: { minWidth: 220, maxHeight: 360 } } }}
      >
        {options.map((option) => (
          <MenuItem
            key={option.value}
            selected={option.value === value}
            onClick={() => {
              setAnchorElement(null);
              if (option.value !== value) onSelect(option.value);
            }}
            sx={{ gap: 1 }}
          >
            {option.icon && <ListItemIcon sx={{ minWidth: 0 }}>{option.icon}</ListItemIcon>}
            <ListItemText
              primary={option.label}
              slotProps={{ primary: { noWrap: true, fontSize: 13 } }}
            />
            {option.value === value && <CheckOutlined sx={{ fontSize: 16 }} />}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
