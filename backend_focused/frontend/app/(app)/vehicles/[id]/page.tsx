import { notFound } from 'next/navigation';

import { VehicleDetails } from '@/components/vehicles/vehicle-details';

export default async function VehicleDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id)) notFound();
  return <VehicleDetails vehicleId={Number(id)} />;
}
