import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServiceRoleClient();

  const { data: property } = await supabase
    .from('properties')
    .select('id, shares_count')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (!property) {
    return NextResponse.json({ error: 'Imóvel não encontrado.' }, { status: 404 });
  }

  const { error } = await supabase
    .from('properties')
    .update({ shares_count: (property.shares_count ?? 0) + 1 })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
