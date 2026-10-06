import { PriorityBars } from '@/components/submissions/priority-indicator';
import { StatusDot } from '@/components/submissions/status-indicator';
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from '@/lib/submission-display';

/** Status and priority choices with their icons, shared by the filter bar and the detail panel. */
export const STATUS_MENU_OPTIONS = STATUS_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
  icon: <StatusDot color={option.color} />,
}));

export const PRIORITY_MENU_OPTIONS = PRIORITY_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
  icon: <PriorityBars priority={option.value} />,
}));
