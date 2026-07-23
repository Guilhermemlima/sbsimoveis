import MaintenanceDetailClient from './MaintenanceDetailClient';

export default async function MaintenanceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MaintenanceDetailClient id={id} />;
}
