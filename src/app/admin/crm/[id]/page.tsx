import CrmDealDetailClient from './CrmDealDetailClient';

export default async function CrmDealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CrmDealDetailClient id={id} />;
}
