import { getCurrentUser } from '@/lib/auth/session';
import { canManageAllProperties } from '@/lib/auth/permissions';
import { getActiveRealtorOptions } from '@/lib/realtors';
import PropertyForm from '@/components/realtor/PropertyForm';

export default async function NewPropertyPage() {
  const user = await getCurrentUser();
  const canAssign = !!user && canManageAllProperties(user);
  const realtorOptions = canAssign ? await getActiveRealtorOptions() : [];

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="font-display text-3xl font-bold text-navy-950 mb-8">Novo Imóvel</h1>
        <PropertyForm canAssignRealtor={canAssign} realtorOptions={realtorOptions} />
      </div>
    </div>
  );
}
