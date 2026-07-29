import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getCurrentUser } from '@/lib/auth/session';
import { canAccessBackOffice } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';
import { logAudit } from '@/lib/audit';

// Visão unificada da base de pessoas: compradores (users role=client),
// inquilinos (tenants) e proprietários (property_owners). Cada tipo continua
// na sua própria tabela — usadas diretamente pelos contratos de locação —
// e aqui só são agregadas para exibição e cadastro num lugar só.

export type PartyType = 'buyer' | 'tenant' | 'owner';

export interface UnifiedPerson {
  key: string;
  id: string;
  type: PartyType;
  name: string;
  email: string | null;
  phone: string | null;
  document_number: string | null;
  is_active: boolean | null;
  detailHref: string;
  documentsEndpoint: string;
  created_at: string;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!canAccessBackOffice(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const supabase = createServiceRoleClient();

  const [buyersRes, tenantsRes, ownersRes] = await Promise.all([
    supabase
      .from('users')
      .select('id, name, email, phone, is_active, created_at')
      .eq('role', 'client')
      .order('created_at', { ascending: false }),
    supabase
      .from('tenants')
      .select('id, name, email, phone, document_number, created_at')
      .order('name', { ascending: true }),
    supabase
      .from('property_owners')
      .select('id, name, email, phone, document_number, created_at')
      .order('name', { ascending: true }),
  ]);

  const buyerDocs = await supabase
    .from('clients')
    .select('id, document_number');
  const buyerDocById = new Map((buyerDocs.data ?? []).map((c) => [c.id, c.document_number]));

  const people: UnifiedPerson[] = [
    ...(buyersRes.data ?? []).map((b) => ({
      key: `buyer:${b.id}`,
      id: b.id,
      type: 'buyer' as PartyType,
      name: b.name,
      email: b.email ?? null,
      phone: b.phone ?? null,
      document_number: buyerDocById.get(b.id) ?? null,
      is_active: b.is_active ?? null,
      detailHref: `/admin/clients/${b.id}`,
      documentsEndpoint: `/api/admin/clients/${b.id}/documents`,
      created_at: b.created_at,
    })),
    ...(tenantsRes.data ?? []).map((t) => ({
      key: `tenant:${t.id}`,
      id: t.id,
      type: 'tenant' as PartyType,
      name: t.name,
      email: t.email ?? null,
      phone: t.phone ?? null,
      document_number: t.document_number ?? null,
      is_active: null,
      detailHref: `/admin/tenants/${t.id}`,
      documentsEndpoint: `/api/admin/tenants/${t.id}/documents`,
      created_at: t.created_at,
    })),
    ...(ownersRes.data ?? []).map((o) => ({
      key: `owner:${o.id}`,
      id: o.id,
      type: 'owner' as PartyType,
      name: o.name,
      email: o.email ?? null,
      phone: o.phone ?? null,
      document_number: o.document_number ?? null,
      is_active: null,
      detailHref: `/admin/owners/${o.id}`,
      documentsEndpoint: `/api/admin/owners/${o.id}/documents`,
      created_at: o.created_at,
    })),
  ];

  people.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  return NextResponse.json(people);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!canAccessBackOffice(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const body = await request.json();
  const name = String(body.name ?? '').trim();
  const email = body.email ? String(body.email).trim().toLowerCase() : '';
  const phone = body.phone ? String(body.phone).trim() : null;
  const documentNumber = body.document_number ? String(body.document_number).trim() : null;
  const rg = body.rg ? String(body.rg).trim() : null;
  const address = body.address ? String(body.address).trim() : null;
  const notes = body.notes ? String(body.notes).trim() : null;
  const password = String(body.password ?? '');
  const types: PartyType[] = Array.isArray(body.types) ? body.types : [];

  if (!name) {
    return NextResponse.json({ error: 'Nome é obrigatório.' }, { status: 400 });
  }
  if (types.length === 0) {
    return NextResponse.json(
      { error: 'Selecione ao menos um tipo: comprador, inquilino ou proprietário.' },
      { status: 400 }
    );
  }
  if (types.includes('buyer') && (!email || password.length < 6)) {
    return NextResponse.json(
      { error: 'Comprador precisa de e-mail e senha provisória (mín. 6 caracteres) para o login do portal.' },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleClient();
  const created: { type: PartyType; id: string }[] = [];

  try {
    if (types.includes('buyer')) {
      const { data: existing } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
      if (existing) {
        return NextResponse.json({ error: 'Já existe um usuário com esse e-mail.' }, { status: 409 });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({ name, email, phone, role: 'client', password_hash: passwordHash, is_active: true })
        .select('id')
        .single();

      if (userError || !newUser) throw new Error(userError?.message ?? 'Falha ao criar comprador.');

      const { error: clientError } = await supabase
        .from('clients')
        .insert({ id: newUser.id, document_number: documentNumber });
      if (clientError) {
        await supabase.from('users').delete().eq('id', newUser.id);
        throw new Error(clientError.message);
      }

      created.push({ type: 'buyer', id: newUser.id });
    }

    if (types.includes('tenant')) {
      const { data, error } = await supabase
        .from('tenants')
        .insert({
          name,
          email: email || null,
          phone,
          document_number: documentNumber,
          rg,
          address,
          notes,
        })
        .select('id')
        .single();

      if (error || !data) throw new Error(error?.message ?? 'Falha ao criar inquilino.');
      created.push({ type: 'tenant', id: data.id });
    }

    if (types.includes('owner')) {
      const { data, error } = await supabase
        .from('property_owners')
        .insert({
          name,
          email: email || null,
          phone,
          document_number: documentNumber,
          rg,
          address,
          notes,
        })
        .select('id')
        .single();

      if (error || !data) throw new Error(error?.message ?? 'Falha ao criar proprietário.');
      created.push({ type: 'owner', id: data.id });
    }
  } catch (err) {
    // Desfaz o que já foi criado, para não deixar a pessoa cadastrada pela metade.
    for (const c of created) {
      if (c.type === 'buyer') await supabase.from('users').delete().eq('id', c.id);
      if (c.type === 'tenant') await supabase.from('tenants').delete().eq('id', c.id);
      if (c.type === 'owner') await supabase.from('property_owners').delete().eq('id', c.id);
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Falha ao cadastrar.' },
      { status: 400 }
    );
  }

  const typeLabels: Record<PartyType, string> = {
    buyer: 'comprador',
    tenant: 'inquilino',
    owner: 'proprietário',
  };

  await logAudit({
    user: user!,
    action: 'create',
    entityType: 'person',
    entityId: created[0]?.id ?? null,
    description: `Cadastrou "${name}" como ${created.map((c) => typeLabels[c.type]).join(' e ')}.`,
  });

  return NextResponse.json({ created }, { status: 201 });
}
