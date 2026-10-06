import { redirect } from 'next/navigation';

import { SUBMISSIONS_PATH } from '@/lib/list-return-path';

export default function HomePage() {
  redirect(SUBMISSIONS_PATH);
}
