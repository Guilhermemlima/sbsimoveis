import TenantDetailClient from './TenantDetailClient';

export default async function AdminTenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TenantDetailClient id={id} />;
}
