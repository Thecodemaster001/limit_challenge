import { Suspense } from 'react';

import { FullPageSpinner } from '@/components/full-page-spinner';
import { LoginForm } from '@/components/login-form';

export default function LoginPage() {
  return (
    <Suspense fallback={<FullPageSpinner label="Loading sign-in form" />}>
      <LoginForm />
    </Suspense>
  );
}
