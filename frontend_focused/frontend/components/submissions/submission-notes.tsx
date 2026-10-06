import { ModeCommentOutlined } from '@mui/icons-material';
import { Box, Stack, Typography } from '@mui/material';

import PersonAvatar from '@/components/person-avatar';
import RelativeTime from '@/components/relative-time';
import SectionHeading from '@/components/section-heading';
import { isPendingNote } from '@/lib/hooks/use-submissions';
import { NoteDetail } from '@/lib/types';

interface SubmissionNotesProps {
  notes: NoteDetail[];
  composer?: React.ReactNode;
}

export default function SubmissionNotes({ notes, composer }: SubmissionNotesProps) {
  return (
    <Box component="section" aria-labelledby="notes-heading">
      <SectionHeading count={notes.length}>
        <span id="notes-heading">Notes</span>
      </SectionHeading>
      {composer}
      {notes.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            py: 3,
            color: 'text.secondary',
          }}
        >
          <ModeCommentOutlined sx={{ fontSize: 18, color: 'text.disabled' }} />
          <Typography variant="body2">
            No notes yet. Updates from the team will show here.
          </Typography>
        </Box>
      ) : (
        <Stack component="ol" sx={{ listStyle: 'none', m: 0, p: 0 }}>
          {notes.map((note, index) => (
            <Box
              component="li"
              key={note.id}
              aria-busy={isPendingNote(note)}
              sx={{
                display: 'flex',
                gap: 1.5,
                position: 'relative',
                pb: 2.5,
                opacity: isPendingNote(note) ? 0.6 : 1,
                transition: 'opacity 160ms',
              }}
            >
              {index < notes.length - 1 && (
                <Box
                  aria-hidden
                  sx={{
                    position: 'absolute',
                    left: 13,
                    top: 32,
                    bottom: 4,
                    width: '1px',
                    bgcolor: 'divider',
                  }}
                />
              )}
              <PersonAvatar name={note.authorName} size={27} />
              <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {note.authorName}
                  </Typography>
                  {isPendingNote(note) ? (
                    <Typography variant="caption" color="text.secondary">
                      Posting…
                    </Typography>
                  ) : (
                    <RelativeTime value={note.createdAt} sx={{ fontSize: 12 }} />
                  )}
                </Box>
                <Typography
                  variant="body2"
                  sx={{ mt: 0.25, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
                >
                  {note.body}
                </Typography>
              </Box>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}
