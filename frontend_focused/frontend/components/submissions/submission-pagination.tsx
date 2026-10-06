'use client';

import { ChevronLeftOutlined, ChevronRightOutlined } from '@mui/icons-material';
import { Box, IconButton, MenuItem, Select, Typography } from '@mui/material';

import { PAGE_SIZE_OPTIONS } from '@/lib/submission-search-params';
import { touchScreen } from '@/lib/theme';

interface SubmissionPaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export default function SubmissionPagination({
  page,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
}: SubmissionPaginationProps) {
  const firstItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalCount);
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <Box
      component="nav"
      aria-label="Pagination"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: { xs: 1.5, sm: 3 },
        px: { xs: 2, md: 3 },
        py: 1,
        borderTop: 1,
        borderColor: 'divider',
      }}
    >
      <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" color="text.secondary" id="page-size-label">
          Rows per page
        </Typography>
        <Select
          size="small"
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          slotProps={{ input: { 'aria-labelledby': 'page-size-label' } }}
          sx={{ fontSize: 13, '& .MuiSelect-select': { py: 0.5, [touchScreen]: { py: 1.25 } } }}
        >
          {PAGE_SIZE_OPTIONS.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      </Box>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ fontVariantNumeric: 'tabular-nums' }}
        aria-live="polite"
      >
        {firstItem}–{lastItem} of {totalCount}
      </Typography>
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <IconButton
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeftOutlined fontSize="small" />
        </IconButton>
        <IconButton
          aria-label="Next page"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRightOutlined fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}
