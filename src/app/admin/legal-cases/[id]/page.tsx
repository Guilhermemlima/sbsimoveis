import LegalCaseDetailClient from './LegalCaseDetailClient';

export default async function LegalCaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LegalCaseDetailClient id={id} />;
}
