import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canAccessMaintenance } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';
import { logAudit } from '@/lib/audit';

const isAuthorized = canAccessMaintenance;

const LOCKED_STATUSES = ['completed', 'cancelled'];

const UPDATABLE_FIELDS = [
  'lease_contract_id',
  'owner_id',
  'tenant_id',
  'title',
  'description',
  'category',
  'priority',
  'estimated_cost',
  'responsibility',
  'responsibility_notes',
  'owner_share_percentage',
  'financial_action',
];

const STATUS_TRANSITIONS: Record<string, string[]> = {
  requested: ['under_review', 'cancelled'],
  under_review: ['approved', 'rejected', 'cancelled'],
  approved: ['in_progress', 'cancelled'],
  rejected: ['under_review', 'cancelled'],
  in_progress: ['cancelled'],
  completed: [],
  cancelled: [],
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!isAuthorized(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();

  const { data: maintenanceRequest } = await supabase
    .from('maintenance_requests')
    .select('*, properties(title, code, address, city, neighborhood)')
    .eq('id', id)
    .maybeSingle();

  if (!maintenanceRequest) {
    return NextResponse.json({ error: 'Solicitação não encontrada.' }, { status: 404 });
  }

  const { data: media } = await supabase
    .from('maintenance_media')
    .select('*')
    .eq('maintenance_request_id', id)
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
  if (maintenanceRequest.owner_id) {
    const { data: owner } = await supabase
      .from('property_owners')
      .select('name')
      .eq('id', maintenanceRequest.owner_id)
      .maybeSingle();
    ownerName = owner?.name ?? null;
  }
  if (maintenanceRequest.tenant_id) {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('name')
      .eq('id', maintenanceRequest.tenant_id)
      .maybeSingle();
    tenantName = tenant?.name ?? null;
  }

  return NextResponse.json({
    request: { ...maintenanceRequest, ownerName, tenantName },
    media: enrichedMedia,
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
    .from('maintenance_requests')
    .select('id, status, title')
    .eq('id', id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: 'Solicitação não encontrada.' }, { status: 404 });
  }
  if (LOCKED_STATUSES.includes(existing.status)) {
    return NextResponse.json(
      { error: 'Esta solicitação já foi concluída ou cancelada e não pode mais ser alterada.' },
      { status: 409 }
    );
  }

  const body = await request.json();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  for (const key of UPDATABLE_FIELDS) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  let statusChanged = false;
  if (body.status && body.status !== existing.status) {
    const allowed = STATUS_TRANSITIONS[existing.status] ?? [];
    if (!allowed.includes(body.status)) {
      return NextResponse.json(
        { error: `Não é possível mudar o status de "${existing.status}" para "${body.status}".` },
        { status: 400 }
      );
    }
    updates.status = body.status;
    statusChanged = true;

    if (body.status === 'approved' || body.status === 'rejected') {
      updates.reviewed_by = user!.id;
      updates.reviewed_at = new Date().toISOString();
      if (body.review_notes !== undefined) updates.review_notes = body.review_notes;
    }
  }

  const { data, error } = await supabase
    .from('maintenance_requests')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (statusChanged) {
    await logAudit({
      user: user!,
      action: 'update',
      entityType: 'maintenance_request',
      entityId: id,
      description: `Alterou o status da manutenção "${existing.title}" de "${existing.status}" para "${body.status}".`,
    });
  }

  return NextResponse.json(data);
}
