import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { canManageAllProperties } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';
import { getActiveRealtorOptions } from '@/lib/realtors';
import { getAppSettings } from '@/lib/settings';
import PropertyForm from '@/components/realtor/PropertyForm';

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return notFound();

  const supabase = createServiceRoleClient();
  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (!property) return notFound();

  const canAssign = canManageAllProperties(user);
  if (!canAssign && property.realtor_id !== user.id) return notFound();

  const { data: images } = await supabase
    .from('property_images')
    .select('*')
    .eq('property_id', id)
    .order('order', { ascending: true });

  const [realtorOptions, settings] = await Promise.all([
    canAssign ? getActiveRealtorOptions() : Promise.resolve([]),
    getAppSettings(),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="font-display text-3xl font-bold text-navy-950 mb-8">Editar Imóvel</h1>
        <PropertyForm
          propertyId={id}
          initialData={property}
          initialImages={images ?? []}
          canAssignRealtor={canAssign}
          realtorOptions={realtorOptions}
          defaultCommissionRate={settings.default_commission_rate}
        />
      </div>
    </div>
  );
}
