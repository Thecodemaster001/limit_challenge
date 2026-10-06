import { MailOutlineOutlined, PhoneOutlined } from '@mui/icons-material';
import { Box, Link, Stack, Typography } from '@mui/material';

import SectionHeading from '@/components/section-heading';
import { TOUCH_TARGET_SIZE, touchScreen } from '@/lib/theme';
import { Contact } from '@/lib/types';

const contactLink = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.75,
  fontSize: 13,
  color: 'text.secondary',
  minWidth: 0,
  '&:hover': { color: 'primary.main' },
  [touchScreen]: { minHeight: TOUCH_TARGET_SIZE },
};

export default function SubmissionContacts({ contacts }: { contacts: Contact[] }) {
  return (
    <Box component="section" aria-labelledby="contacts-heading">
      <SectionHeading count={contacts.length}>
        <span id="contacts-heading">Contacts</span>
      </SectionHeading>
      {contacts.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No contacts on file.
        </Typography>
      ) : (
        <Stack spacing={2} component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
          {contacts.map((contact) => (
            <Box component="li" key={contact.id}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {contact.name}
              </Typography>
              {contact.role && (
                <Typography variant="caption" color="text.secondary" component="p">
                  {contact.role}
                </Typography>
              )}
              <Stack spacing={0.25} sx={{ mt: 0.5 }}>
                {contact.email && (
                  <Link href={`mailto:${contact.email}`} underline="none" sx={contactLink}>
                    <MailOutlineOutlined sx={{ fontSize: 14 }} />
                    <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {contact.email}
                    </Box>
                  </Link>
                )}
                {contact.phone && (
                  <Link
                    href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`}
                    underline="none"
                    sx={{ ...contactLink, fontVariantNumeric: 'tabular-nums' }}
                  >
                    <PhoneOutlined sx={{ fontSize: 14 }} />
                    {contact.phone}
                  </Link>
                )}
              </Stack>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}
