'use client';

import { CheckOutlined, KeyboardArrowDownOutlined } from '@mui/icons-material';
import {
  Box,
  Button,
  Checkbox,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ReactNode, useState } from 'react';

export interface FilterMenuOption {
  value: string;
  label: string;
  icon?: ReactNode;
  count?: number;
}

interface FilterMenuProps {
  label: string;
  options: FilterMenuOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  multiple?: boolean;
  emptyMessage?: string;
}

function selectionSummary(options: FilterMenuOption[], selected: string[]) {
  if (selected.length === 0) return null;
  if (selected.length === 1) {
    return options.find((option) => option.value === selected[0])?.label ?? null;
  }
  return `${selected.length} selected`;
}

/** A compact toolbar button that opens a single- or multi-select list of options. */
export default function FilterMenu({
  label,
  options,
  selected,
  onChange,
  multiple = false,
  emptyMessage = 'Nothing to choose from yet',
}: FilterMenuProps) {
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);
  const summary = selectionSummary(options, selected);
  const isActive = selected.length > 0;

  function toggle(value: string) {
    if (!multiple) {
      onChange(selected.includes(value) ? [] : [value]);
      setAnchorElement(null);
      return;
    }
    onChange(
      selected.includes(value)
        ? selected.filter((selectedValue) => selectedValue !== value)
        : [...selected, value],
    );
  }

  return (
    <>
      <Button
        variant="outlined"
        onClick={(event) => setAnchorElement(event.currentTarget)}
        endIcon={<KeyboardArrowDownOutlined sx={{ fontSize: '18px !important' }} />}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchorElement)}
        sx={(theme) =>
          isActive
            ? {
                borderColor: alpha(theme.palette.primary.main, 0.4),
                bgcolor: alpha(theme.palette.primary.main, 0.06),
                '&:hover': {
                  borderColor: alpha(theme.palette.primary.main, 0.5),
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                },
              }
            : {}
        }
      >
        <Box component="span" sx={{ color: isActive ? 'text.secondary' : 'text.primary' }}>
          {label}
        </Box>
        {summary && (
          <Box
            component="span"
            sx={{
              ml: 0.75,
              maxWidth: 160,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: 'text.primary',
            }}
          >
            {summary}
          </Box>
        )}
      </Button>
      <Menu
        anchorEl={anchorElement}
        open={Boolean(anchorElement)}
        onClose={() => setAnchorElement(null)}
        slotProps={{ paper: { sx: { minWidth: 220, maxHeight: 360 } } }}
      >
        {options.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ px: 1.5, py: 1 }}>
            {emptyMessage}
          </Typography>
        )}
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <MenuItem
              key={option.value}
              onClick={() => toggle(option.value)}
              role={multiple ? 'menuitemcheckbox' : 'menuitemradio'}
              aria-checked={isSelected}
              sx={{ gap: 1 }}
            >
              {multiple && (
                <Checkbox
                  size="small"
                  checked={isSelected}
                  tabIndex={-1}
                  disableRipple
                  sx={{ p: 0, '& .MuiSvgIcon-root': { fontSize: 18 } }}
                />
              )}
              {option.icon && <ListItemIcon sx={{ minWidth: 0 }}>{option.icon}</ListItemIcon>}
              <ListItemText
                primary={option.label}
                slotProps={{ primary: { noWrap: true, fontSize: 13 } }}
              />
              {option.count !== undefined && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontVariantNumeric: 'tabular-nums', ml: 1 }}
                >
                  {option.count}
                </Typography>
              )}
              {!multiple && isSelected && <CheckOutlined sx={{ fontSize: 16 }} />}
            </MenuItem>
          );
        })}
        {isActive && [
          <Divider key="divider" sx={{ my: 0.5 }} />,
          <MenuItem
            key="clear"
            onClick={() => {
              onChange([]);
              setAnchorElement(null);
            }}
            sx={{ color: 'text.secondary' }}
          >
            Clear {label.toLowerCase()}
          </MenuItem>,
        ]}
      </Menu>
    </>
  );
}
