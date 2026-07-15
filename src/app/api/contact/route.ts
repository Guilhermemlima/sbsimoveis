import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim();
  const phone = String(body.phone ?? '').trim();
  const subject = String(body.subject ?? '').trim();
  const message = String(body.message ?? '').trim();

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Preencha nome, e-mail e mensagem.' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from('leads').insert({
    name,
    email,
    phone,
    source: 'website',
    status: 'new',
    internal_notes: subject ? `Assunto: ${subject}\n\n${message}` : message,
  });

  if (error) {
    return NextResponse.json({ error: 'Não foi possível enviar sua mensagem.' }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
