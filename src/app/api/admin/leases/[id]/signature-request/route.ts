import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canAccessBackOffice } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';
import { logAudit } from '@/lib/audit';
import { createDocument, createSignatureLink, getDocumentStatus } from '@/lib/autentique';

const isAuthorized = canAccessBackOffice;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!isAuthorized(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();

  const { data: requests } = await supabase
    .from('signature_requests')
    .select('*, signature_request_signers(*)')
    .eq('lease_contract_id', id)
    .order('created_at', { ascending: false });

  const pending = (requests ?? []).filter((r) => r.status === 'pending');

  for (const reqRow of pending) {
    try {
      const status = await getDocumentStatus(reqRow.provider_document_id);
      const signers = reqRow.signature_request_signers as {
        id: string;
        provider_signature_id: string | null;
      }[];

      for (const s of status.signatures) {
        const match = signers.find((x) => x.provider_signature_id === s.public_id);
        if (!match) continue;
        await supabase
          .from('signature_request_signers')
          .update({
            signed_at: s.signed?.created_at ?? null,
            rejected_at: s.rejected?.created_at ?? null,
          })
          .eq('id', match.id);
      }

      const allSigned = status.signatures.length > 0 && status.signatures.every((s) => s.signed);
      const anyRejected = status.signatures.some((s) => s.rejected);

      if (allSigned && status.files?.signed) {
        const fileRes = await fetch(status.files.signed);
        const fileBuffer = await fileRes.arrayBuffer();
        const path = `lease-${id}/signed-${reqRow.id}.pdf`;
        await supabase.storage
          .from('property-documents')
          .upload(path, fileBuffer, { contentType: 'application/pdf', upsert: true });

        await supabase
          .from('signature_requests')
          .update({ status: 'completed', signed_file_path: path, updated_at: new Date().toISOString() })
          .eq('id', reqRow.id);

        await logAudit({
          user: user!,
          action: 'signature_completed',
          entityType: 'lease_contract',
          entityId: id,
          description: `Contrato de locação assinado digitalmente por todas as partes (${reqRow.document_name}).`,
        });
      } else if (anyRejected) {
        await supabase
          .from('signature_requests')
          .update({ status: 'rejected', updated_at: new Date().toISOString() })
          .eq('id', reqRow.id);
      }
    } catch {
      // best-effort: mantém o status atual se a consulta ao provedor falhar
    }
  }

  const { data: refreshed } = await supabase
    .from('signature_requests')
    .select('*, signature_request_signers(*)')
    .eq('lease_contract_id', id)
    .order('created_at', { ascending: false });

  const withUrls = await Promise.all(
    (refreshed ?? []).map(async (r) => {
      if (!r.signed_file_path) return { ...r, signedDownloadUrl: null };
      const { data: signed } = await supabase.storage
        .from('property-documents')
        .createSignedUrl(r.signed_file_path, 3600);
      return { ...r, signedDownloadUrl: signed?.signedUrl ?? null };
    })
  );

  return NextResponse.json(withUrls);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!isAuthorized(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();

  const { data: lease } = await supabase.from('lease_contracts').select('id, realtor_id').eq('id', id).maybeSingle();
  if (!lease) {
    return NextResponse.json({ error: 'Contrato não encontrado.' }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const signersRaw = formData.get('signers');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Escolha o arquivo do contrato (PDF).' }, { status: 400 });
  }
  if (!signersRaw) {
    return NextResponse.json({ error: 'Selecione ao menos um signatário.' }, { status: 400 });
  }

  let signers: { party_role: string; party_id: string | null; name: string; email: string }[];
  try {
    signers = JSON.parse(String(signersRaw));
  } catch {
    return NextResponse.json({ error: 'Lista de signatários inválida.' }, { status: 400 });
  }

  if (!Array.isArray(signers) || signers.length === 0) {
    return NextResponse.json({ error: 'Selecione ao menos um signatário.' }, { status: 400 });
  }
  if (signers.some((s) => !s.email || !s.name)) {
    return NextResponse.json({ error: 'Todos os signatários precisam de nome e e-mail.' }, { status: 400 });
  }

  const documentName = `Contrato de Locação — ${file.name}`;

  let result;
  try {
    result = await createDocument({
      fileBuffer: await file.arrayBuffer(),
      fileName: file.name,
      fileType: file.type || 'application/pdf',
      documentName,
      signers: signers.map((s) => ({ name: s.name, email: s.email })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Não foi possível enviar para assinatura.' },
      { status: 500 }
    );
  }

  const { data: signatureRequest, error } = await supabase
    .from('signature_requests')
    .insert({
      lease_contract_id: id,
      provider: 'autentique',
      provider_document_id: result.id,
      document_name: documentName,
      status: 'pending',
      requested_by: user!.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const signerRows = await Promise.all(
    signers.map(async (s) => {
      const match = result.signatures.find((sig) => sig.email === s.email);
      const signUrl = match?.link?.short_link ?? (match ? await createSignatureLink(match.public_id) : null);
      return {
        signature_request_id: signatureRequest.id,
        party_role: s.party_role,
        party_id: s.party_id,
        name: s.name,
        email: s.email,
        provider_signature_id: match?.public_id ?? null,
        sign_url: signUrl,
      };
    })
  );

  await supabase.from('signature_request_signers').insert(signerRows);

  await logAudit({
    user: user!,
    action: 'signature_request',
    entityType: 'lease_contract',
    entityId: id,
    description: `Enviou o contrato de locação para assinatura digital (${signers.length} signatário(s)).`,
  });

  return NextResponse.json({ success: true, id: signatureRequest.id }, { status: 201 });
}
