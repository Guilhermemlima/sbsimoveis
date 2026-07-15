import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';

export async function GET() {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('properties')
    .select('*, property_images(id, image_url, is_main, order)')
    .is('deleted_at', null)
    .eq('status', 'available')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
