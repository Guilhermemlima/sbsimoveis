import InspectionDetailClient from './InspectionDetailClient';

export default async function InspectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <InspectionDetailClient id={id} />;
}
