import { Avatar } from '@mui/material';
import { alpha } from '@mui/material/styles';

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

interface PersonAvatarProps {
  name: string;
  size?: number;
}

export default function PersonAvatar({ name, size = 22 }: PersonAvatarProps) {
  return (
    <Avatar
      aria-hidden
      sx={(theme) => ({
        width: size,
        height: size,
        fontSize: Math.round(size * 0.45),
        fontWeight: 600,
        color: 'primary.main',
        bgcolor: alpha(theme.palette.primary.main, 0.12),
      })}
    >
      {initialsOf(name)}
    </Avatar>
  );
}
