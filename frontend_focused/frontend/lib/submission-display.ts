import { SubmissionPriority, SubmissionStatus } from '@/lib/types';

interface DisplayOption<Value extends string> {
  value: Value;
  label: string;
  color: string;
}

export const STATUS_OPTIONS: DisplayOption<SubmissionStatus>[] = [
  { value: 'new', label: 'New', color: '#3d5bd9' },
  { value: 'in_review', label: 'In review', color: '#d08a1e' },
  { value: 'closed', label: 'Closed', color: '#2b8a57' },
  { value: 'lost', label: 'Lost', color: '#8b8e96' },
];

export const PRIORITY_OPTIONS: DisplayOption<SubmissionPriority>[] = [
  { value: 'high', label: 'High', color: '#d4502b' },
  { value: 'medium', label: 'Medium', color: '#62656c' },
  { value: 'low', label: 'Low', color: '#62656c' },
];

export const PRIORITY_LEVEL: Record<SubmissionPriority, number> = { low: 1, medium: 2, high: 3 };

export const SUBMISSION_STATUSES = STATUS_OPTIONS.map((option) => option.value);
export const SUBMISSION_PRIORITIES = PRIORITY_OPTIONS.map((option) => option.value);

export function statusOption(status: SubmissionStatus) {
  return STATUS_OPTIONS.find((option) => option.value === status) ?? STATUS_OPTIONS[0];
}

export function priorityOption(priority: SubmissionPriority) {
  return PRIORITY_OPTIONS.find((option) => option.value === priority) ?? PRIORITY_OPTIONS[1];
}
