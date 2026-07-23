import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { createServiceRoleClient } from '@/lib/supabase';

function isAuthorized(user: { role: string } | null) {
  return !!user && user.role === 'admin';
}

const STANDARD_ITEMS = [
  'Paredes',
  'Piso',
  'Teto',
  'Portas',
  'Janelas',
  'Pintura',
  'Iluminação',
  'Instalações elétricas',
  'Instalações hidráulicas',
  'Móveis',
  'Eletrodomésticos',
  'Chaves',
  'Fechaduras',
  'Vidros',
  'Limpeza',
  'Estado geral',
];

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!isAuthorized(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();

  const { data: inspection } = await supabase
    .from('inspections')
    .select('id, is_locked')
    .eq('id', id)
    .maybeSingle();

  if (!inspection) return NextResponse.json({ error: 'Vistoria não encontrada.' }, { status: 404 });
  if (inspection.is_locked) {
    return NextResponse.json({ error: 'Vistoria concluída não pode mais ser alterada.' }, { status: 409 });
  }

  const body = await request.json();
  const name = String(body.name ?? '').trim();
  if (!name) return NextResponse.json({ error: 'Informe o nome do ambiente.' }, { status: 400 });

  const { count } = await supabase
    .from('inspection_environments')
    .select('id', { count: 'exact', head: true })
    .eq('inspection_id', id);

  const { data: environment, error } = await supabase
    .from('inspection_environments')
    .insert({ inspection_id: id, name, order_index: count ?? 0 })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { data: items, error: itemsError } = await supabase
    .from('inspection_items')
    .insert(STANDARD_ITEMS.map((item_type) => ({ environment_id: environment.id, item_type })))
    .select();

  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 400 });

  return NextResponse.json({ environment, items }, { status: 201 });
}
