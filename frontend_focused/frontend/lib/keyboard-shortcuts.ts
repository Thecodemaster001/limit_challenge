interface ShortcutTarget {
  tagName?: string;
  isContentEditable?: boolean;
  closest?: (selector: string) => unknown;
}

interface ShortcutEvent {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  defaultPrevented: boolean;
  target: unknown;
}

const TYPING_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);
// Open menus and dialogs handle their own keys (arrows, Escape), so page shortcuts stay quiet.
const OVERLAY_SELECTOR = '[role="menu"], [role="dialog"], [role="listbox"]';

/**
 * Single-key shortcuts only fire when the user isn't typing, isn't inside an overlay,
 * and isn't holding a modifier that belongs to the browser or the operating system.
 */
export function shouldHandleShortcut(event: ShortcutEvent) {
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return false;
  const target = event.target as ShortcutTarget | null;
  if (!target) return true;
  if (target.isContentEditable || TYPING_TAGS.has(target.tagName ?? '')) return false;
  return !target.closest?.(OVERLAY_SELECTOR);
}

/** The element `step` places away from the focused one, clamped to the list's ends. */
export function nextIndex(currentIndex: number, step: number, length: number) {
  if (length === 0) return -1;
  if (currentIndex === -1) return step > 0 ? 0 : length - 1;
  return Math.min(Math.max(currentIndex + step, 0), length - 1);
}
