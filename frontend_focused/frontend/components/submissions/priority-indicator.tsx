import { Box, Typography } from '@mui/material';

import { PRIORITY_LEVEL, priorityOption } from '@/lib/submission-display';
import { SubmissionPriority } from '@/lib/types';

const BAR_HEIGHTS = [5, 8, 11];

export function PriorityBars({ priority }: { priority: SubmissionPriority }) {
  const option = priorityOption(priority);
  const level = PRIORITY_LEVEL[priority];
  return (
    <Box
      component="svg"
      viewBox="0 0 14 12"
      aria-hidden
      sx={{ width: 14, height: 12, flexShrink: 0 }}
    >
      {BAR_HEIGHTS.map((height, index) => (
        <rect
          key={height}
          x={index * 5}
          y={12 - height}
          width="3"
          height={height}
          rx="1"
          fill={index < level ? option.color : '#d3d5d9'}
        />
      ))}
    </Box>
  );
}

interface PriorityIndicatorProps {
  priority: SubmissionPriority;
  showLabel?: boolean;
}

export default function PriorityIndicator({ priority, showLabel = true }: PriorityIndicatorProps) {
  const option = priorityOption(priority);
  return (
    <Box
      component="span"
      sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}
      aria-label={showLabel ? undefined : `${option.label} priority`}
    >
      <PriorityBars priority={priority} />
      {showLabel && (
        <Typography
          component="span"
          variant="body2"
          sx={{ color: priority === 'high' ? option.color : 'text.primary', whiteSpace: 'nowrap' }}
        >
          {option.label}
        </Typography>
      )}
    </Box>
  );
}
