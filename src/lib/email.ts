import { Resend } from 'resend';

let client: Resend | null = null;

function getClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export interface SendEmailResult {
  sent: boolean;
  error?: string;
}

// Envio best-effort: nunca lança erro, para não quebrar o fluxo principal
// (geração de boleto, confirmação de pagamento etc) caso o e-mail falhe.
export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<SendEmailResult> {
  const resend = getClient();
  if (!resend) {
    return { sent: false, error: 'RESEND_API_KEY não configurada.' };
  }

  const from = process.env.EMAIL_FROM || 'SBS Imóveis <onboarding@resend.dev>';
  const replyTo = process.env.EMAIL_REPLY_TO || undefined;

  try {
    const { error } = await resend.emails.send({ from, to, subject, html, replyTo });
    if (error) return { sent: false, error: error.message };
    return { sent: true };
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : 'Erro desconhecido ao enviar e-mail.' };
  }
}
