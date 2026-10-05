'use client';

import { useState } from 'react';

import { parseApiError } from '@/lib/api-errors';

/**
 * Form values plus the API's validation feedback. Editing a field clears that field's error,
 * so a message never lingers after the user has acted on it.
 */
export function useFormFields<Values extends object>(initialValues: Values | (() => Values)) {
  const [values, setValues] = useState<Values>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof Values, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);

  function setField<Field extends keyof Values>(field: Field, value: Values[Field]) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      const remaining = { ...current };
      delete remaining[field];
      return remaining;
    });
    setFormError(null);
  }

  function showApiError(error: unknown) {
    const details = parseApiError(error);
    setFieldErrors(details.fieldErrors as Partial<Record<keyof Values, string>>);
    setFormError(details.message);
  }

  return { values, setField, fieldErrors, formError, setFormError, showApiError };
}
