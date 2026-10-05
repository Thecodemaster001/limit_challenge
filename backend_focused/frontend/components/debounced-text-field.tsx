'use client';

import { TextField, TextFieldProps } from '@mui/material';
import { ChangeEvent, useEffect, useRef, useState } from 'react';

type DebouncedTextFieldProps = Omit<TextFieldProps, 'value' | 'onChange'> & {
  value: string;
  onCommit: (value: string) => void;
  delayMs?: number;
};

/**
 * Text field that reports its value once typing pauses. It follows `value` when that changes
 * from outside (e.g. "Clear filters" or browser back), without losing what is being typed.
 */
export function DebouncedTextField({
  value,
  onCommit,
  delayMs = 400,
  ...textFieldProps
}: DebouncedTextFieldProps) {
  const [draft, setDraft] = useState(value);
  const [previousValue, setPreviousValue] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  if (value !== previousValue) {
    setPreviousValue(value);
    setDraft(value);
  }

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const nextValue = event.target.value;
    setDraft(nextValue);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => onCommit(nextValue.trim()), delayMs);
  }

  return <TextField {...textFieldProps} value={draft} onChange={handleChange} />;
}
