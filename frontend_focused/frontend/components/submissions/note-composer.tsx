'use client';

import { Box, Button, InputBase, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { KeyboardEvent, useState, useSyncExternalStore } from 'react';

import { useNotify } from '@/components/notifications';
import PersonAvatar from '@/components/person-avatar';
import { parseApiError } from '@/lib/api-errors';
import { useCurrentUser } from '@/lib/hooks/use-auth';
import { useAddNote } from '@/lib/hooks/use-submissions';

const NOTE_MAX_LENGTH = 5000;
const LENGTH_WARNING_THRESHOLD = NOTE_MAX_LENGTH - 500;

function subscribeToNothing() {
  return () => {};
}

/** "⌘" on Apple devices, "Ctrl" elsewhere; resolved after hydration to avoid a mismatch. */
function useShortcutModifier() {
  return useSyncExternalStore(
    subscribeToNothing,
    () => (/Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘' : 'Ctrl'),
    () => 'Ctrl',
  );
}

export default function NoteComposer({ submissionId }: { submissionId: string | number }) {
  const { data: user } = useCurrentUser();
  const authorName = user?.teamMember?.fullName || user?.fullName || user?.username || 'You';
  const addNote = useAddNote(submissionId, authorName);
  const notify = useNotify();
  const shortcutModifier = useShortcutModifier();
  const [draft, setDraft] = useState('');

  const body = draft.trim();
  const isTooLong = draft.length > NOTE_MAX_LENGTH;
  const canPost = body.length > 0 && !isTooLong;

  function post() {
    if (!canPost) return;
    setDraft('');
    addNote.mutate(body, {
      onError: (error) => {
        setDraft((current) => current || body);
        notify(`Note not posted. ${parseApiError(error).message}`, { severity: 'error' });
      },
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      post();
    }
  }

  return (
    <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
      <PersonAvatar name={authorName} size={27} />
      <Box
        sx={(theme) => ({
          flexGrow: 1,
          minWidth: 0,
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
          bgcolor: 'background.paper',
          transition: 'border-color 120ms, box-shadow 120ms',
          '&:focus-within': {
            borderColor: alpha(theme.palette.primary.main, 0.5),
            boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.12)}`,
          },
        })}
      >
        <InputBase
          multiline
          minRows={2}
          maxRows={10}
          fullWidth
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a note for the team…"
          inputProps={{ 'aria-label': 'New note' }}
          sx={{ px: 1.5, pt: 1.25, pb: 0.5, fontSize: 14, lineHeight: 1.55 }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, pb: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1 }}>
            {draft.length > LENGTH_WARNING_THRESHOLD ? (
              <Box component="span" sx={{ color: isTooLong ? 'error.main' : 'text.secondary' }}>
                {draft.length.toLocaleString()} / {NOTE_MAX_LENGTH.toLocaleString()} characters
              </Box>
            ) : (
              <>
                <Box
                  component="kbd"
                  sx={{ fontFamily: 'inherit', fontSize: 11, color: 'text.primary' }}
                >
                  {shortcutModifier} Enter
                </Box>{' '}
                to post
              </>
            )}
          </Typography>
          <Button variant="contained" disabled={!canPost} onClick={post}>
            Post note
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
