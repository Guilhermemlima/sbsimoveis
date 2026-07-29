import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';

// Webhook opcional da Autentique (configurado no painel deles, nível de organização).
// Best-effort: se o payload não bater com o esperado, apenas retorna 200 sem quebrar.
// Servidores locais/sem URL pública não recebem esses eventos — o polling em
// GET /api/admin/leases/[id]/signature-request cobre esse caso.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.event) return NextResponse.json({ received: true });

  const eventType = body.event.type as string | undefined;
  const documentId = body.event.data?.id ?? body.event.data?.document?.id;

  if (!eventType || !documentId) return NextResponse.json({ received: true });

  const supabase = createServiceRoleClient();

  if (eventType === 'document.finished') {
    await supabase
      .from('signature_requests')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('provider_document_id', documentId)
      .eq('provider', 'autentique');
  }

  return NextResponse.json({ received: true });
}
