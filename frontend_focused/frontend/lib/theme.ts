import { alpha, createTheme } from '@mui/material/styles';

const colors = {
  textPrimary: '#1b1c1f',
  textSecondary: '#62656c',
  textDisabled: '#a0a3a9',
  border: '#e4e5e8',
  borderStrong: '#d3d5d9',
  surface: '#ffffff',
  canvas: '#f7f7f8',
  hover: '#f1f2f4',
  accent: '#3d5bd9',
};

const focusRing = {
  outline: `2px solid ${alpha(colors.accent, 0.45)}`,
  outlineOffset: 1,
};

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: colors.accent },
    text: {
      primary: colors.textPrimary,
      secondary: colors.textSecondary,
      disabled: colors.textDisabled,
    },
    divider: colors.border,
    background: { default: colors.canvas, paper: colors.surface },
    action: { hover: colors.hover, selected: alpha(colors.accent, 0.08) },
    error: { main: '#cd2b31' },
    success: { main: '#2b8a57' },
    warning: { main: '#c4751a' },
  },
  shape: { borderRadius: 6 },
  typography: {
    fontFamily: 'var(--font-inter), system-ui, -apple-system, "Segoe UI", sans-serif',
    fontSize: 14,
    h1: { fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.3 },
    h2: { fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.35 },
    h3: { fontSize: 15, fontWeight: 600, lineHeight: 1.4 },
    body1: { fontSize: 14, lineHeight: 1.5 },
    body2: { fontSize: 13, lineHeight: 1.5 },
    caption: { fontSize: 12, lineHeight: 1.4 },
    overline: {
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.06em',
      lineHeight: 1.6,
      textTransform: 'uppercase',
    },
    button: { textTransform: 'none', fontWeight: 500, fontSize: 13 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: colors.canvas },
        '::selection': { backgroundColor: alpha(colors.accent, 0.18) },
      },
    },
    MuiButtonBase: {
      defaultProps: { disableRipple: true },
      styleOverrides: { root: { '&.Mui-focusVisible': focusRing } },
    },
    MuiButton: {
      defaultProps: { disableElevation: true, size: 'small' },
      styleOverrides: {
        root: { borderRadius: 6, paddingInline: 10, minHeight: 30 },
        outlined: {
          borderColor: colors.borderStrong,
          color: colors.textPrimary,
          backgroundColor: colors.surface,
          '&:hover': { borderColor: colors.borderStrong, backgroundColor: colors.hover },
        },
      },
    },
    MuiIconButton: {
      defaultProps: { size: 'small' },
      styleOverrides: { root: { borderRadius: 6, color: colors.textSecondary } },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { outlined: { borderColor: colors.border } },
    },
    MuiTextField: { defaultProps: { size: 'small' } },
    MuiFormControl: { defaultProps: { size: 'small' } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: colors.surface,
          fontSize: 13,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.borderStrong },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.textDisabled },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderWidth: 1 },
          '&.Mui-focused': { boxShadow: `0 0 0 3px ${alpha(colors.accent, 0.15)}` },
        },
      },
    },
    MuiInputLabel: { styleOverrides: { root: { fontSize: 13 } } },
    MuiMenu: {
      styleOverrides: {
        paper: {
          border: `1px solid ${colors.border}`,
          boxShadow: '0 8px 24px rgba(16, 17, 19, 0.08)',
          marginTop: 4,
        },
        list: { paddingBlock: 4 },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          border: `1px solid ${colors.border}`,
          boxShadow: '0 8px 24px rgba(16, 17, 19, 0.08)',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: { fontSize: 13, minHeight: 32, marginInline: 4, borderRadius: 4 },
      },
    },
    MuiTooltip: {
      defaultProps: { enterDelay: 400, disableInteractive: true },
      styleOverrides: {
        tooltip: {
          backgroundColor: colors.textPrimary,
          fontSize: 12,
          fontWeight: 400,
          padding: '4px 8px',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: colors.border, fontSize: 13, paddingBlock: 10 },
        head: {
          color: colors.textSecondary,
          fontWeight: 500,
          fontSize: 12,
          backgroundColor: colors.surface,
          whiteSpace: 'nowrap',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 4, fontSize: 12, height: 24 },
        sizeSmall: { height: 22 },
      },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 10, border: `1px solid ${colors.border}` } },
    },
    MuiSkeleton: { defaultProps: { animation: 'wave' } },
    MuiLink: { defaultProps: { underline: 'hover' } },
  },
});
