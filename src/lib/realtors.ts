import { createServiceRoleClient } from '@/lib/supabase';

export async function getActiveRealtorOptions(): Promise<{ id: string; name: string }[]> {
  const supabase = createServiceRoleClient();
  const { data: activeRealtors } = await supabase.from('realtors').select('id').eq('status', 'active');
  const ids = (activeRealtors ?? []).map((r) => r.id);
  if (ids.length === 0) return [];

  const { data: names } = await supabase.from('users').select('id, name').in('id', ids);
  return names ?? [];
}
