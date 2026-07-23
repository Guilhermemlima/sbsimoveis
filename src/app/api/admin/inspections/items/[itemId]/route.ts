import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { createServiceRoleClient } from '@/lib/supabase';

function isAuthorized(user: { role: string } | null) {
  return !!user && user.role === 'admin';
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const user = await getCurrentUser();
  if (!isAuthorized(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { itemId } = await params;
  const supabase = createServiceRoleClient();

  const { data: item } = await supabase
    .from('inspection_items')
    .select('id, environment_id, inspection_environments(inspection_id, inspections(is_locked))')
    .eq('id', itemId)
    .maybeSingle();

  if (!item) return NextResponse.json({ error: 'Item não encontrado.' }, { status: 404 });

  const envField = item.inspection_environments as unknown as
    | { inspections: { is_locked: boolean } | { is_locked: boolean }[] }
    | { inspections: { is_locked: boolean } | { is_locked: boolean }[] }[]
    | null;
  const env = Array.isArray(envField) ? envField[0] : envField;
  const inspectionField = env?.inspections;
  const inspection = Array.isArray(inspectionField) ? inspectionField[0] : inspectionField;

  if (inspection?.is_locked) {
    return NextResponse.json({ error: 'Vistoria concluída não pode mais ser alterada.' }, { status: 409 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.rating !== undefined) updates.rating = body.rating;
  if (body.comments !== undefined) updates.comments = body.comments;
  if (body.pre_existing_damage !== undefined) updates.pre_existing_damage = !!body.pre_existing_damage;
  if (body.damage_during_lease !== undefined) updates.damage_during_lease = !!body.damage_during_lease;
  if (updates.rating !== undefined || updates.comments !== undefined) {
    updates.reviewed_by = user!.id;
    updates.reviewed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('inspection_items')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
