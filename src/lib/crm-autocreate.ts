import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Cria automaticamente o cadastro real (proprietario / inquilino) a partir
 * dos dados digitados na captacao, quando ainda nao ha um vinculado.
 * Evita duplicar: se ja existe alguem com o mesmo CPF ou e-mail, reaproveita.
 */

interface PessoaInput {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  document_number?: string | null;
  rg?: string | null;
  address?: string | null;
}

/** Procura um cadastro existente por CPF ou e-mail, para nao duplicar. */
async function acharExistente(
  supabase: SupabaseClient,
  tabela: string,
  pessoa: PessoaInput
): Promise<string | null> {
  const doc = pessoa.document_number?.trim();
  if (doc) {
    const { data } = await supabase.from(tabela).select('id').eq('document_number', doc).maybeSingle();
    if (data) return data.id;
  }
  const email = pessoa.email?.trim().toLowerCase();
  if (email) {
    const { data } = await supabase.from(tabela).select('id').ilike('email', email).maybeSingle();
    if (data) return data.id;
  }
  return null;
}

/**
 * Garante que exista um proprietario cadastrado para a captacao.
 * Retorna o id, ou null se nao havia nome para cadastrar.
 */
export async function garantirProprietario(
  supabase: SupabaseClient,
  pessoa: PessoaInput
): Promise<string | null> {
  const nome = pessoa.name?.trim();
  if (!nome) return null;

  const existente = await acharExistente(supabase, 'property_owners', pessoa);
  if (existente) return existente;

  const { data, error } = await supabase
    .from('property_owners')
    .insert({
      name: nome,
      email: pessoa.email || null,
      phone: pessoa.phone || null,
      document_number: pessoa.document_number || null,
      rg: pessoa.rg || null,
      address: pessoa.address || null,
    })
    .select('id')
    .single();

  return error ? null : data.id;
}

/**
 * Garante que exista um inquilino cadastrado (usado quando a captacao e
 * de locacao). Retorna o id, ou null se nao havia nome.
 */
export async function garantirInquilino(
  supabase: SupabaseClient,
  pessoa: PessoaInput
): Promise<string | null> {
  const nome = pessoa.name?.trim();
  if (!nome) return null;

  const existente = await acharExistente(supabase, 'tenants', pessoa);
  if (existente) return existente;

  const { data, error } = await supabase
    .from('tenants')
    .insert({
      name: nome,
      email: pessoa.email || null,
      phone: pessoa.phone || null,
      document_number: pessoa.document_number || null,
      rg: pessoa.rg || null,
      address: pessoa.address || null,
    })
    .select('id')
    .single();

  return error ? null : data.id;
}

/**
 * Garante que exista um comprador na aba Clientes. Diferente dos demais,
 * comprador e um usuario do portal, entao exige e-mail (chave de login).
 * Sem e-mail, devolve null e o motivo, para a tela avisar.
 */
export async function garantirComprador(
  supabase: SupabaseClient,
  pessoa: PessoaInput
): Promise<{ id: string | null; aviso: string | null }> {
  const nome = pessoa.name?.trim();
  if (!nome) return { id: null, aviso: null };

  const email = pessoa.email?.trim().toLowerCase();
  if (!email) {
    return {
      id: null,
      aviso: 'Comprador precisa de e-mail para entrar na aba Clientes (é o login dele no portal).',
    };
  }

  const { data: existente } = await supabase
    .from('users')
    .select('id, role')
    .eq('email', email)
    .maybeSingle();

  if (existente) {
    // Reaproveita se ja for cliente; se for outro papel, nao mexe.
    if (existente.role === 'client') return { id: existente.id, aviso: null };
    return { id: null, aviso: 'Já existe um usuário com esse e-mail em outro perfil.' };
  }

  const { data: novo, error } = await supabase
    .from('users')
    .insert({ name: nome, email, phone: pessoa.phone || null, role: 'client', is_active: true })
    .select('id')
    .single();

  if (error || !novo) return { id: null, aviso: 'Não foi possível criar o cliente.' };

  await supabase
    .from('clients')
    .insert({ id: novo.id, document_number: pessoa.document_number || null });

  return { id: novo.id, aviso: null };
}
