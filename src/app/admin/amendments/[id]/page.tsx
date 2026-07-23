import AmendmentDetailClient from './AmendmentDetailClient';

export default async function AmendmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AmendmentDetailClient id={id} />;
}
