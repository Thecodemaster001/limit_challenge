'use client';

import { useEffect, useRef } from 'react';

import { shouldHandleShortcut } from '@/lib/keyboard-shortcuts';

type ShortcutHandlers = Record<string, (event: KeyboardEvent) => void>;

/** Runs the handler for `event.key` (e.g. "j", "/", "Escape") unless the user is typing. */
export function useKeyboardShortcuts(handlers: ShortcutHandlers, { enabled = true } = {}) {
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!enabled) return;
    function handleKeyDown(event: KeyboardEvent) {
      const handler = handlersRef.current[event.key];
      if (!handler || !shouldHandleShortcut(event)) return;
      event.preventDefault();
      handler(event);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);
}
