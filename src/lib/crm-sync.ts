import type { SupabaseClient } from '@supabase/supabase-js';
import type { CrmDealStage } from '@/types';

const DOC_BUCKET = 'property-documents';
const IMAGE_BUCKET = 'property-images';

export interface SyncResult {
  synced_to: string | null;
  synced_ref_id: string | null;
  synced_error: string | null;
}

interface DealLinks {
  id: string;
  property_id: string | null;
  owner_id: string | null;
  tenant_id: string | null;
  guarantor_id: string | null;
  client_id: string | null;
  inspection_id: string | null;
  title: string;
}

/**
 * Para onde cada etapa manda o anexo. Retorna null quando a etapa nao
 * tem modulo correspondente (ex: prints de divulgacao ficam so no CRM).
 */
function targetForStage(stage: CrmDealStage, deal: DealLinks): { target: string; missing?: string } | null {
  switch (stage) {
    case 'assinatura_opcao':
      // A opcao assinada pertence ao proprietario; sem ele, vai para o imovel.
      if (deal.owner_id) return { target: 'owner_documents' };
      if (deal.property_id) return { target: 'property_documents' };
      return { target: 'owner_documents', missing: 'Vincule um proprietário ou um imóvel à captação.' };

    case 'fotos_imovel':
      if (!deal.property_id) {
        return { target: 'property_images', missing: 'Vincule um imóvel cadastrado à captação.' };
      }
      return { target: 'property_images' };

    case 'divulgacao':
      return null; // material de marketing, sem modulo proprio

    case 'comprador_locador':
      if (deal.tenant_id) return { target: 'tenant_documents' };
      if (deal.client_id) return { target: 'client_documents' };
      if (deal.guarantor_id) return { target: 'guarantor_documents' };
      return {
        target: 'tenant_documents',
        missing: 'Vincule um inquilino, cliente ou fiador à captação.',
      };

    case 'vistoria':
      if (!deal.property_id) {
        return { target: 'inspection_media', missing: 'Vincule um imóvel cadastrado à captação.' };
      }
      return { target: 'inspection_media' };

    case 'contrato_assinado':
      if (deal.property_id) return { target: 'property_documents' };
      return { target: 'property_documents', missing: 'Vincule um imóvel cadastrado à captação.' };

    default:
      return null;
  }
}

/** Copia o arquivo dentro do bucket de documentos, devolvendo o novo caminho. */
async function copyInDocBucket(
  supabase: SupabaseClient,
  fromPath: string,
  toPrefix: string
): Promise<string | null> {
  const ext = fromPath.split('.').pop() || 'pdf';
  const toPath = `${toPrefix}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(DOC_BUCKET).copy(fromPath, toPath);
  return error ? null : toPath;
}

/** Garante que existe uma vistoria da captacao; cria uma pendente se preciso. */
async function ensureInspection(
  supabase: SupabaseClient,
  deal: DealLinks,
  userId: string
): Promise<string | null> {
  if (deal.inspection_id) return deal.inspection_id;
  if (!deal.property_id) return null;

  const { data, error } = await supabase
    .from('inspections')
    .insert({
      property_id: deal.property_id,
      owner_id: deal.owner_id,
      tenant_id: deal.tenant_id,
      type: 'entry',
      status: 'in_progress',
      notes: `Vistoria criada a partir da captação "${deal.title}" no CRM.`,
      created_by: userId,
    })
    .select('id')
    .single();

  if (error || !data) return null;

  await supabase.from('crm_deals').update({ inspection_id: data.id }).eq('id', deal.id);
  return data.id;
}

/**
 * Envia uma copia do anexo do CRM para o modulo correspondente a etapa.
 * Nunca lanca erro: devolve o motivo em synced_error para a interface mostrar.
 */
export async function syncCrmFile(
  supabase: SupabaseClient,
  deal: DealLinks,
  file: { id: string; stage: CrmDealStage; name: string; file_path: string; file_type: string | null },
  userId: string
): Promise<SyncResult> {
  const none: SyncResult = { synced_to: null, synced_ref_id: null, synced_error: null };

  const dest = targetForStage(file.stage, deal);
  if (!dest) return none;
  if (dest.missing) return { ...none, synced_error: dest.missing };

  try {
    switch (dest.target) {
      case 'property_images': {
        // A galeria do imovel usa bucket publico proprio, entao baixa e reenvia.
        const { data: blob, error: dlError } = await supabase.storage.from(DOC_BUCKET).download(file.file_path);
        if (dlError || !blob) return { ...none, synced_error: 'Não foi possível ler o arquivo.' };

        const ext = file.file_path.split('.').pop() || 'jpg';
        const path = `${deal.property_id}/${crypto.randomUUID()}.${ext}`;
        const { error: upError } = await supabase.storage
          .from(IMAGE_BUCKET)
          .upload(path, await blob.arrayBuffer(), { contentType: file.file_type ?? 'image/jpeg' });
        if (upError) return { ...none, synced_error: upError.message };

        const { data: pub } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);

        const { count } = await supabase
          .from('property_images')
          .select('id', { count: 'exact', head: true })
          .eq('property_id', deal.property_id);

        const { data: row, error } = await supabase
          .from('property_images')
          .insert({
            property_id: deal.property_id,
            image_url: pub.publicUrl,
            is_main: (count ?? 0) === 0, // primeira foto vira a capa
            order: count ?? 0,
          })
          .select('id')
          .single();

        if (error) return { ...none, synced_error: error.message };
        return { synced_to: dest.target, synced_ref_id: row.id, synced_error: null };
      }

      case 'inspection_media': {
        const inspectionId = await ensureInspection(supabase, deal, userId);
        if (!inspectionId) return { ...none, synced_error: 'Não foi possível criar a vistoria.' };

        const copied = await copyInDocBucket(supabase, file.file_path, `inspection-${inspectionId}`);
        if (!copied) return { ...none, synced_error: 'Falha ao copiar o arquivo.' };

        const { data: row, error } = await supabase
          .from('inspection_media')
          .insert({
            inspection_id: inspectionId,
            file_path: copied,
            file_type: (file.file_type ?? '').startsWith('image/') ? 'photo' : 'document',
            uploaded_by: userId,
          })
          .select('id')
          .single();

        if (error) return { ...none, synced_error: error.message };
        return { synced_to: dest.target, synced_ref_id: row.id, synced_error: null };
      }

      default: {
        // Demais destinos seguem o mesmo formato de tabela de documentos.
        const config: Record<string, { table: string; column: string; value: string | null; prefix: string }> = {
          property_documents: {
            table: 'property_documents',
            column: 'property_id',
            value: deal.property_id,
            prefix: `${deal.property_id}`,
          },
          owner_documents: {
            table: 'owner_documents',
            column: 'owner_id',
            value: deal.owner_id,
            prefix: `owner-${deal.owner_id}`,
          },
          tenant_documents: {
            table: 'tenant_documents',
            column: 'tenant_id',
            value: deal.tenant_id,
            prefix: `tenant-${deal.tenant_id}`,
          },
          guarantor_documents: {
            table: 'guarantor_documents',
            column: 'guarantor_id',
            value: deal.guarantor_id,
            prefix: `guarantor-${deal.guarantor_id}`,
          },
          client_documents: {
            table: 'client_documents',
            column: 'client_id',
            value: deal.client_id,
            prefix: `client-${deal.client_id}`,
          },
        };

        const cfg = config[dest.target];
        if (!cfg || !cfg.value) return { ...none, synced_error: 'Destino sem cadastro vinculado.' };

        const copied = await copyInDocBucket(supabase, file.file_path, cfg.prefix);
        if (!copied) return { ...none, synced_error: 'Falha ao copiar o arquivo.' };

        const { data: row, error } = await supabase
          .from(cfg.table)
          .insert({
            [cfg.column]: cfg.value,
            name: file.name,
            file_path: copied,
            file_type: file.file_type,
            uploaded_by: userId,
          })
          .select('id')
          .single();

        if (error) return { ...none, synced_error: error.message };
        return { synced_to: dest.target, synced_ref_id: row.id, synced_error: null };
      }
    }
  } catch (err) {
    return { ...none, synced_error: err instanceof Error ? err.message : 'Erro ao sincronizar.' };
  }
}
