import {
  ArticleOutlined,
  GavelOutlined,
  InsertDriveFileOutlined,
  OpenInNewOutlined,
  SlideshowOutlined,
  TableChartOutlined,
} from '@mui/icons-material';
import { Box, Link, Stack, Typography } from '@mui/material';
import { ReactNode } from 'react';

import SectionHeading from '@/components/section-heading';
import { formatDate } from '@/lib/format';
import { Document } from '@/lib/types';

const DOCUMENT_TYPE_ICONS: Record<string, ReactNode> = {
  Spreadsheet: <TableChartOutlined sx={{ fontSize: 18, color: '#2b8a57' }} />,
  Presentation: <SlideshowOutlined sx={{ fontSize: 18, color: '#c4751a' }} />,
  Contract: <GavelOutlined sx={{ fontSize: 18, color: '#3d5bd9' }} />,
  Summary: <ArticleOutlined sx={{ fontSize: 18, color: '#62656c' }} />,
};

function DocumentIcon({ documentType }: { documentType: string }) {
  return (
    <Box
      sx={{
        width: 32,
        height: 32,
        borderRadius: 1.5,
        border: 1,
        borderColor: 'divider',
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
      }}
    >
      {DOCUMENT_TYPE_ICONS[documentType] ?? (
        <InsertDriveFileOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
      )}
    </Box>
  );
}

export default function SubmissionDocuments({ documents }: { documents: Document[] }) {
  return (
    <Box component="section" aria-labelledby="documents-heading">
      <SectionHeading count={documents.length}>
        <span id="documents-heading">Documents</span>
      </SectionHeading>
      {documents.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          The broker hasn&apos;t sent any documents yet.
        </Typography>
      ) : (
        <Stack spacing={0.5} component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
          {documents.map((document) => (
            <Box component="li" key={document.id}>
              <Link
                href={document.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                underline="none"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  p: 0.75,
                  mx: -0.75,
                  borderRadius: 1.5,
                  color: 'text.primary',
                  '&:hover': { bgcolor: 'action.hover' },
                  '&:hover .open-icon': { opacity: 1 },
                }}
              >
                <DocumentIcon documentType={document.docType} />
                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                  <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                    {document.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" component="p">
                    {document.docType} · {formatDate(document.uploadedAt)}
                  </Typography>
                </Box>
                <OpenInNewOutlined
                  className="open-icon"
                  aria-label="Opens in a new tab"
                  sx={{ fontSize: 14, color: 'text.secondary', opacity: 0 }}
                />
              </Link>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}
