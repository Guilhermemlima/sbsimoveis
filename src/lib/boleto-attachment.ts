import type { SupabaseClient } from '@supabase/supabase-js';
import type { SendEmailAttachment } from '@/lib/email';

const BUCKET = 'property-documents';

export async function loadBoletoAttachment(
  supabase: SupabaseClient,
  boletoFilePath: string | null,
  boletoFileName: string | null
): Promise<SendEmailAttachment | null> {
  if (!boletoFilePath || !boletoFileName) return null;

  const { data, error } = await supabase.storage.from(BUCKET).download(boletoFilePath);
  if (error || !data) return null;

  const content = Buffer.from(await data.arrayBuffer());
  return { filename: boletoFileName, content };
}
