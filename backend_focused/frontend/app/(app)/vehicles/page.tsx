import { Suspense } from 'react';

import { LoadingState } from '@/components/page-states';
import { VehicleSearch } from '@/components/vehicles/vehicle-search';

export default function VehiclesPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading vehicles" />}>
      <VehicleSearch />
    </Suspense>
  );
}
