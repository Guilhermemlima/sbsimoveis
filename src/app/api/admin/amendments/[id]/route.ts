import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { createServiceRoleClient } from '@/lib/supabase';
import { logAudit } from '@/lib/audit';

function isAuthorized(user: { role: string } | null) {
  return !!user && user.role === 'admin';
}

const LOCKED_STATUSES = ['signed', 'cancelled'];

const UPDATABLE_FIELDS = ['title', 'content', 'changes', 'effective_date'];

const STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['pending_signature', 'cancelled'],
  pending_signature: ['draft', 'cancelled'],
  signed: [],
  cancelled: [],
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!isAuthorized(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();

  const { data: amendment } = await supabase
    .from('lease_amendments')
    .select(
      '*, lease_contracts(id, property_id, owner_id, tenant_id, rent_value, end_date, properties(title, code, address, city, neighborhood))'
    )
    .eq('id', id)
    .maybeSingle();

  if (!amendment) {
    return NextResponse.json({ error: 'Aditivo não encontrado.' }, { status: 404 });
  }

  const { data: history } = await supabase
    .from('lease_amendments')
    .select('id, version, type, title, status, created_at')
    .eq('lease_contract_id', amendment.lease_contract_id)
    .order('version', { ascending: true });

  return NextResponse.json({ amendment, history: history ?? [] });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!isAuthorized(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();

  const { data: existing } = await supabase
    .from('lease_amendments')
    .select('id, status, title')
    .eq('id', id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: 'Aditivo não encontrado.' }, { status: 404 });
  }
  if (LOCKED_STATUSES.includes(existing.status)) {
    return NextResponse.json(
      { error: 'Este aditivo já foi assinado ou cancelado e não pode mais ser alterado.' },
      { status: 409 }
    );
  }

  const body = await request.json();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (existing.status === 'draft') {
    for (const key of UPDATABLE_FIELDS) {
      if (body[key] !== undefined) updates[key] = body[key];
    }
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
  }

  const { data, error } = await supabase
    .from('lease_amendments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (statusChanged) {
    await logAudit({
      user: user!,
      action: 'update',
      entityType: 'lease_amendment',
      entityId: id,
      description: `Alterou o status do aditivo "${existing.title}" de "${existing.status}" para "${body.status}".`,
    });
  }

  return NextResponse.json(data);
}
