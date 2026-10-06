'use client';

import { SwapVertOutlined } from '@mui/icons-material';
import { Button, Menu, MenuItem } from '@mui/material';
import { useState } from 'react';

import { DEFAULT_ORDERING } from '@/lib/submission-views';

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest first' },
  { value: 'createdAt', label: 'Oldest first' },
  { value: '-priority', label: 'Highest priority' },
  { value: 'status', label: 'Status' },
  { value: 'company', label: 'Company A–Z' },
];

interface SortMenuProps {
  ordering?: string;
  onChange: (ordering: string | undefined) => void;
}

/** Sorting for layouts without sortable column headers, such as the phone list. */
export default function SortMenu({ ordering, onChange }: SortMenuProps) {
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);
  const current = ordering ?? DEFAULT_ORDERING;
  const label = SORT_OPTIONS.find((option) => option.value === current)?.label ?? 'Custom';

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<SwapVertOutlined sx={{ fontSize: '16px !important' }} />}
        onClick={(event) => setAnchorElement(event.currentTarget)}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchorElement)}
      >
        {label}
      </Button>
      <Menu
        anchorEl={anchorElement}
        open={Boolean(anchorElement)}
        onClose={() => setAnchorElement(null)}
      >
        {SORT_OPTIONS.map((option) => (
          <MenuItem
            key={option.value}
            selected={option.value === current}
            onClick={() => {
              onChange(option.value === DEFAULT_ORDERING ? undefined : option.value);
              setAnchorElement(null);
            }}
          >
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
