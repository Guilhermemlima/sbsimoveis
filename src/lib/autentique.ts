const API_URL = 'https://api.autentique.com.br/v2/graphql';

export interface AutentiqueSignerInput {
  name: string;
  email: string;
}

export interface AutentiqueSignatureResult {
  public_id: string;
  name: string | null;
  email: string;
  link: { short_link: string } | null;
}

export interface AutentiqueDocumentResult {
  id: string;
  name: string;
  signatures: AutentiqueSignatureResult[];
}

export interface AutentiqueDocumentStatus {
  id: string;
  name: string;
  files: { signed: string | null } | null;
  signatures: {
    public_id: string;
    name: string | null;
    email: string;
    signed: { created_at: string } | null;
    rejected: { created_at: string } | null;
  }[];
}

class AutentiqueError extends Error {}

function getToken(): string {
  const token = process.env.AUTENTIQUE_API_TOKEN;
  if (!token) throw new AutentiqueError('AUTENTIQUE_API_TOKEN não configurada.');
  return token;
}

async function graphqlMultipart(
  query: string,
  variables: Record<string, unknown>,
  file?: { buffer: ArrayBuffer; filename: string; type: string }
): Promise<Record<string, unknown>> {
  const token = getToken();

  const form = new FormData();
  if (file) {
    form.append(
      'operations',
      JSON.stringify({ query, variables: { ...variables, file: null } })
    );
    form.append('map', JSON.stringify({ file: ['variables.file'] }));
    form.append('file', new Blob([file.buffer], { type: file.type }), file.filename);
  } else {
    form.append('operations', JSON.stringify({ query, variables }));
    form.append('map', JSON.stringify({}));
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  const rawText = await res.text();
  let json: { errors?: { message: string }[]; data?: Record<string, unknown> };
  try {
    json = JSON.parse(rawText);
  } catch {
    throw new AutentiqueError(`HTTP ${res.status}: ${rawText.slice(0, 500)}`);
  }
  if (json.errors) {
    throw new AutentiqueError(`HTTP ${res.status}: ` + json.errors.map((e) => e.message).join('; '));
  }
  return json.data ?? {};
}

export async function createDocument(input: {
  fileBuffer: ArrayBuffer;
  fileName: string;
  fileType: string;
  documentName: string;
  signers: AutentiqueSignerInput[];
}): Promise<AutentiqueDocumentResult> {
  const query = `
    mutation CreateDocumentMutation($document: DocumentInput!, $signers: [SignerInput!]!, $file: Upload!) {
      createDocument(document: $document, signers: $signers, file: $file) {
        id
        name
        signatures {
          public_id
          name
          email
          link { short_link }
        }
      }
    }
  `;

  const data = await graphqlMultipart(
    query,
    {
      document: { name: input.documentName, sortable: false },
      signers: input.signers.map((s) => ({ name: s.name, email: s.email, action: 'SIGN' })),
    },
    { buffer: input.fileBuffer, filename: input.fileName, type: input.fileType }
  );

  return data.createDocument as AutentiqueDocumentResult;
}

export async function createSignatureLink(publicId: string): Promise<string | null> {
  const query = `
    mutation CreateLinkToSignature($public_id: UUID!) {
      createLinkToSignature(public_id: $public_id) {
        short_link
      }
    }
  `;

  try {
    const data = await graphqlMultipart(query, { public_id: publicId });
    const result = data.createLinkToSignature as { short_link: string } | null;
    return result?.short_link ?? null;
  } catch {
    return null;
  }
}

export async function getDocumentStatus(documentId: string): Promise<AutentiqueDocumentStatus> {
  const query = `
    query GetDocument($id: UUID!) {
      document(id: $id) {
        id
        name
        files { signed }
        signatures {
          public_id
          name
          email
          signed { created_at }
          rejected { created_at }
        }
      }
    }
  `;

  const data = await graphqlMultipart(query, { id: documentId });
  return data.document as AutentiqueDocumentStatus;
}
