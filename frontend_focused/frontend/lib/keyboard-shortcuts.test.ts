import { describe, expect, it } from 'vitest';

import { nextIndex, shouldHandleShortcut } from './keyboard-shortcuts';

function keyEvent(overrides: Partial<Parameters<typeof shouldHandleShortcut>[0]> = {}) {
  return {
    key: 'j',
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    defaultPrevented: false,
    target: { tagName: 'BODY', isContentEditable: false, closest: () => null },
    ...overrides,
  };
}

describe('shouldHandleShortcut', () => {
  it('handles plain keys on the page', () => {
    expect(shouldHandleShortcut(keyEvent())).toBe(true);
  });

  it.each(['INPUT', 'TEXTAREA', 'SELECT'])('ignores keys typed into a %s', (tagName) => {
    expect(shouldHandleShortcut(keyEvent({ target: { tagName, closest: () => null } }))).toBe(
      false,
    );
  });

  it('ignores editable content', () => {
    const target = { tagName: 'DIV', isContentEditable: true, closest: () => null };
    expect(shouldHandleShortcut(keyEvent({ target }))).toBe(false);
  });

  it('ignores keys inside open menus and dialogs', () => {
    const target = { tagName: 'LI', closest: () => ({}) };
    expect(shouldHandleShortcut(keyEvent({ target }))).toBe(false);
  });

  it.each(['metaKey', 'ctrlKey', 'altKey'])('leaves %s combinations to the browser', (modifier) => {
    expect(shouldHandleShortcut(keyEvent({ [modifier]: true }))).toBe(false);
  });

  it('respects handlers that already took the event', () => {
    expect(shouldHandleShortcut(keyEvent({ defaultPrevented: true }))).toBe(false);
  });
});

describe('nextIndex', () => {
  it('starts at the first or last row when nothing is focused', () => {
    expect(nextIndex(-1, 1, 5)).toBe(0);
    expect(nextIndex(-1, -1, 5)).toBe(4);
  });

  it('moves and stops at the ends', () => {
    expect(nextIndex(2, 1, 5)).toBe(3);
    expect(nextIndex(4, 1, 5)).toBe(4);
    expect(nextIndex(0, -1, 5)).toBe(0);
  });

  it('returns -1 for an empty list', () => {
    expect(nextIndex(-1, 1, 0)).toBe(-1);
  });
});
