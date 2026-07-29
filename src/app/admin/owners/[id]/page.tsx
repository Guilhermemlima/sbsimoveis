import OwnerDetailClient from './OwnerDetailClient';

export default async function AdminOwnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OwnerDetailClient id={id} />;
}
