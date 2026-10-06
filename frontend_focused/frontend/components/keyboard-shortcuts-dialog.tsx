'use client';

import { CloseOutlined } from '@mui/icons-material';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';

import KeyboardKey from '@/components/keyboard-key';

const SHORTCUT_GROUPS = [
  {
    title: 'Submissions list',
    shortcuts: [
      { keys: ['j'], description: 'Next submission' },
      { keys: ['k'], description: 'Previous submission' },
      { keys: ['Enter'], description: 'Open the selected submission' },
      { keys: ['/'], description: 'Search companies' },
    ],
  },
  {
    title: 'Submission page',
    shortcuts: [
      { keys: ['j'], description: 'Next submission in the list' },
      { keys: ['k'], description: 'Previous submission in the list' },
      { keys: ['Esc'], description: 'Back to the list' },
      { keys: ['⌘/Ctrl', 'Enter'], description: 'Post the note you are writing' },
    ],
  },
  {
    title: 'Anywhere',
    shortcuts: [{ keys: ['?'], description: 'Show keyboard shortcuts' }],
  },
];

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsDialog({ open, onClose }: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', fontSize: 15, py: 1.5 }}>
        Keyboard shortcuts
        <IconButton aria-label="Close" onClick={onClose} sx={{ ml: 'auto' }}>
          <CloseOutlined fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pb: 2.5 }}>
        <Stack spacing={2.5}>
          {SHORTCUT_GROUPS.map((group) => (
            <Box key={group.title}>
              <Typography variant="overline" color="text.secondary" component="h3">
                {group.title}
              </Typography>
              <Stack component="dl" spacing={1} sx={{ m: 0, mt: 0.5 }}>
                {group.shortcuts.map((shortcut) => (
                  <Box
                    key={shortcut.description}
                    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <Typography component="dt" variant="body2">
                      {shortcut.description}
                    </Typography>
                    <Box component="dd" sx={{ m: 0, display: 'flex', gap: 0.5 }}>
                      {shortcut.keys.map((key) => (
                        <KeyboardKey key={key}>{key}</KeyboardKey>
                      ))}
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
