import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { createServiceRoleClient } from '@/lib/supabase';

const UPDATABLE_FIELDS = [
  'company_name',
  'company_logo_url',
  'company_phone',
  'company_email',
  'company_address',
  'company_city',
  'whatsapp_number',
  'max_opportunities_carousel',
  'default_commission_rate',
  'social_instagram',
  'social_facebook',
  'social_linkedin',
];

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const body = await request.json();
  const supabase = createServiceRoleClient();

  const { data: existing } = await supabase.from('app_settings').select('id').limit(1).maybeSingle();

  const updates: Record<string, unknown> = {};
  for (const key of UPDATABLE_FIELDS) {
    if (body[key] !== undefined) updates[key] = body[key];
  }
  updates.updated_at = new Date().toISOString();

  if (existing) {
    const { data, error } = await supabase
      .from('app_settings')
      .update(updates)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  }

  const { data, error } = await supabase.from('app_settings').insert(updates).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
