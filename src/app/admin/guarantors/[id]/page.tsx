import GuarantorDetailClient from './GuarantorDetailClient';

export default async function AdminGuarantorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <GuarantorDetailClient id={id} />;
}
