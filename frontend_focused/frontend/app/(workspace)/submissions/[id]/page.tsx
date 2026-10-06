import type { Metadata } from 'next';

import SubmissionDetailView from '@/components/submissions/submission-detail-view';

export const metadata: Metadata = { title: 'Submission' };

interface SubmissionDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SubmissionDetailPage({ params }: SubmissionDetailPageProps) {
  const { id } = await params;
  return <SubmissionDetailView submissionId={id} />;
}
