import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { createServiceRoleClient } from '@/lib/supabase';
import { logAudit } from '@/lib/audit';

function isAuthorized(user: { role: string } | null) {
  return !!user && user.role === 'admin';
}

const UPDATABLE_FIELDS = [
  'lease_contract_id',
  'owner_id',
  'tenant_id',
  'status',
  'scheduled_date',
  'scheduled_time',
  'performed_date',
  'performed_by',
  'notes',
  'final_report',
];

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!isAuthorized(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();

  const { data: inspection } = await supabase
    .from('inspections')
    .select('*, properties(title, code, address, city, neighborhood)')
    .eq('id', id)
    .maybeSingle();

  if (!inspection) {
    return NextResponse.json({ error: 'Vistoria não encontrada.' }, { status: 404 });
  }

  const { data: environments } = await supabase
    .from('inspection_environments')
    .select('*')
    .eq('inspection_id', id)
    .order('order_index', { ascending: true });

  const environmentIds = (environments ?? []).map((e) => e.id);

  const { data: items } = environmentIds.length
    ? await supabase
        .from('inspection_items')
        .select('*')
        .in('environment_id', environmentIds)
        .order('created_at', { ascending: true })
    : { data: [] };

  const { data: media } = await supabase
    .from('inspection_media')
    .select('*')
    .eq('inspection_id', id)
    .order('created_at', { ascending: false });

  const BUCKET = 'property-documents';
  const enrichedMedia = await Promise.all(
    (media ?? []).map(async (m) => {
      const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(m.file_path, 3600);
      return { ...m, url: signed?.signedUrl ?? null };
    })
  );

  let ownerName: string | null = null;
  let tenantName: string | null = null;
  if (inspection.owner_id) {
    const { data: owner } = await supabase
      .from('property_owners')
      .select('name')
      .eq('id', inspection.owner_id)
      .maybeSingle();
    ownerName = owner?.name ?? null;
  }
  if (inspection.tenant_id) {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('name')
      .eq('id', inspection.tenant_id)
      .maybeSingle();
    tenantName = tenant?.name ?? null;
  }

  const versionHistory: { id: string; version: number; status: string; created_at: string; is_locked: boolean }[] = [];
  let cursor = inspection.id;
  const backward: typeof versionHistory = [];
  while (true) {
    const { data: predecessor } = await supabase
      .from('inspections')
      .select('id, version, status, created_at, is_locked')
      .eq('superseded_by', cursor)
      .maybeSingle();
    if (!predecessor) break;
    backward.unshift(predecessor);
    cursor = predecessor.id;
  }
  versionHistory.push(...backward);
  versionHistory.push({
    id: inspection.id,
    version: inspection.version,
    status: inspection.status,
    created_at: inspection.created_at,
    is_locked: inspection.is_locked,
  });
  cursor = inspection.id;
  while (true) {
    const { data: current } = await supabase
      .from('inspections')
      .select('superseded_by')
      .eq('id', cursor)
      .maybeSingle();
    if (!current?.superseded_by) break;
    const { data: successor } = await supabase
      .from('inspections')
      .select('id, version, status, created_at, is_locked')
      .eq('id', current.superseded_by)
      .maybeSingle();
    if (!successor) break;
    versionHistory.push(successor);
    cursor = successor.id;
  }

  return NextResponse.json({
    inspection: { ...inspection, ownerName, tenantName },
    environments: environments ?? [],
    items: items ?? [],
    media: enrichedMedia,
    versionHistory,
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!isAuthorized(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();

  const { data: existing } = await supabase
    .from('inspections')
    .select('id, is_locked, status')
    .eq('id', id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: 'Vistoria não encontrada.' }, { status: 404 });
  }
  if (existing.is_locked) {
    return NextResponse.json(
      { error: 'Esta vistoria já foi assinada e concluída — não pode mais ser alterada.' },
      { status: 409 }
    );
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};
  for (const key of UPDATABLE_FIELDS) {
    if (body[key] !== undefined) updates[key] = body[key];
  }
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('inspections')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (updates.status && updates.status !== existing.status) {
    await logAudit({
      user: user!,
      action: 'update',
      entityType: 'inspection',
      entityId: id,
      description: `Alterou o status da vistoria de "${existing.status}" para "${updates.status}".`,
    });
  }

  return NextResponse.json(data);
}
