import type { Metadata } from 'next';
import { Suspense } from 'react';

import SubmissionsWorkspace, {
  SubmissionsWorkspaceFallback,
} from '@/components/submissions/submissions-workspace';

export const metadata: Metadata = { title: 'Submissions' };

export default function SubmissionsPage() {
  return (
    <Suspense fallback={<SubmissionsWorkspaceFallback />}>
      <SubmissionsWorkspace />
    </Suspense>
  );
}
