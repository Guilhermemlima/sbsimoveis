import { sendEmail } from '@/lib/email';
import { formatDateBR } from '@/lib/format';

function formatMoney(value: number): string {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function layout(title: string, bodyHtml: string): string {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1a2332;">
    <div style="background:#0b1e3d; padding: 24px; text-align: center;">
      <h1 style="color:#e8c56a; font-size: 20px; margin: 0;">SBS Imóveis</h1>
    </div>
    <div style="padding: 24px; background: #ffffff;">
      <h2 style="font-size: 18px; margin-top: 0;">${title}</h2>
      ${bodyHtml}
    </div>
    <div style="padding: 16px 24px; background: #f5f5f5; color: #6b7280; font-size: 12px; text-align: center;">
      SBS Imóveis — este é um e-mail automático, não é necessário responder.
    </div>
  </div>`;
}

interface ChargeEmailInput {
  tenantName: string;
  tenantEmail: string | null;
  propertyTitle: string;
  propertyCode: string;
  description: string;
  amount: number;
  dueDate: string;
}

export async function sendBoletoEmail(charge: ChargeEmailInput) {
  if (!charge.tenantEmail) return { sent: false, error: 'Inquilino sem e-mail cadastrado.' };

  const html = layout(
    'Novo boleto disponível',
    `<p>Olá, ${charge.tenantName}!</p>
     <p>Um novo boleto foi gerado para o imóvel <strong>${charge.propertyTitle}</strong> (${charge.propertyCode}).</p>
     <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
       <tr><td style="padding:6px 0; color:#6b7280;">Descrição</td><td style="padding:6px 0; text-align:right;">${charge.description}</td></tr>
       <tr><td style="padding:6px 0; color:#6b7280;">Valor</td><td style="padding:6px 0; text-align:right; font-weight:bold;">${formatMoney(charge.amount)}</td></tr>
       <tr><td style="padding:6px 0; color:#6b7280;">Vencimento</td><td style="padding:6px 0; text-align:right;">${formatDateBR(charge.dueDate)}</td></tr>
     </table>
     <p>Qualquer dúvida, estamos à disposição.</p>`
  );

  return sendEmail({ to: charge.tenantEmail, subject: `Novo boleto — ${charge.propertyTitle} (${charge.propertyCode})`, html });
}

export async function sendDueReminderEmail(charge: ChargeEmailInput) {
  if (!charge.tenantEmail) return { sent: false, error: 'Inquilino sem e-mail cadastrado.' };

  const html = layout(
    'Lembrete de vencimento',
    `<p>Olá, ${charge.tenantName}!</p>
     <p>Passando para lembrar que a parcela abaixo, referente ao imóvel <strong>${charge.propertyTitle}</strong> (${charge.propertyCode}), vence em breve.</p>
     <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
       <tr><td style="padding:6px 0; color:#6b7280;">Descrição</td><td style="padding:6px 0; text-align:right;">${charge.description}</td></tr>
       <tr><td style="padding:6px 0; color:#6b7280;">Valor</td><td style="padding:6px 0; text-align:right; font-weight:bold;">${formatMoney(charge.amount)}</td></tr>
       <tr><td style="padding:6px 0; color:#6b7280;">Vencimento</td><td style="padding:6px 0; text-align:right;">${formatDateBR(charge.dueDate)}</td></tr>
     </table>
     <p>Qualquer dúvida, estamos à disposição.</p>`
  );

  return sendEmail({ to: charge.tenantEmail, subject: `Lembrete de vencimento — ${charge.propertyTitle} (${charge.propertyCode})`, html });
}

interface OverdueEmailInput extends ChargeEmailInput {
  daysLate: number;
  lateFee: number;
  interest: number;
  total: number;
}

export async function sendOverdueCollectionEmail(charge: OverdueEmailInput) {
  if (!charge.tenantEmail) return { sent: false, error: 'Inquilino sem e-mail cadastrado.' };

  const html = layout(
    'Cobrança em atraso',
    `<p>Olá, ${charge.tenantName},</p>
     <p>Identificamos que a parcela abaixo, do imóvel <strong>${charge.propertyTitle}</strong> (${charge.propertyCode}), está em atraso.</p>
     <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
       <tr><td style="padding:6px 0; color:#6b7280;">Descrição</td><td style="padding:6px 0; text-align:right;">${charge.description}</td></tr>
       <tr><td style="padding:6px 0; color:#6b7280;">Vencimento</td><td style="padding:6px 0; text-align:right;">${formatDateBR(charge.dueDate)}</td></tr>
       <tr><td style="padding:6px 0; color:#6b7280;">Dias em atraso</td><td style="padding:6px 0; text-align:right;">${charge.daysLate}</td></tr>
       <tr><td style="padding:6px 0; color:#6b7280;">Valor original</td><td style="padding:6px 0; text-align:right;">${formatMoney(charge.amount)}</td></tr>
       <tr><td style="padding:6px 0; color:#6b7280;">Multa</td><td style="padding:6px 0; text-align:right;">${formatMoney(charge.lateFee)}</td></tr>
       <tr><td style="padding:6px 0; color:#6b7280;">Juros</td><td style="padding:6px 0; text-align:right;">${formatMoney(charge.interest)}</td></tr>
       <tr><td style="padding:10px 0 0; color:#0b1e3d; font-weight:bold;">Total atualizado</td><td style="padding:10px 0 0; text-align:right; font-weight:bold; color:#b91c1c;">${formatMoney(charge.total)}</td></tr>
     </table>
     <p>Poderia regularizar o pagamento? Qualquer dúvida estamos à disposição.</p>`
  );

  return sendEmail({ to: charge.tenantEmail, subject: `Cobrança em atraso — ${charge.propertyTitle} (${charge.propertyCode})`, html });
}

export async function sendPaymentConfirmationEmail(charge: ChargeEmailInput & { paidDate: string }) {
  if (!charge.tenantEmail) return { sent: false, error: 'Inquilino sem e-mail cadastrado.' };

  const html = layout(
    'Pagamento confirmado',
    `<p>Olá, ${charge.tenantName}!</p>
     <p>Confirmamos o recebimento do pagamento referente ao imóvel <strong>${charge.propertyTitle}</strong> (${charge.propertyCode}).</p>
     <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
       <tr><td style="padding:6px 0; color:#6b7280;">Descrição</td><td style="padding:6px 0; text-align:right;">${charge.description}</td></tr>
       <tr><td style="padding:6px 0; color:#6b7280;">Valor pago</td><td style="padding:6px 0; text-align:right; font-weight:bold;">${formatMoney(charge.amount)}</td></tr>
       <tr><td style="padding:6px 0; color:#6b7280;">Data do pagamento</td><td style="padding:6px 0; text-align:right;">${formatDateBR(charge.paidDate)}</td></tr>
     </table>
     <p>Obrigado!</p>`
  );

  return sendEmail({ to: charge.tenantEmail, subject: `Pagamento confirmado — ${charge.propertyTitle} (${charge.propertyCode})`, html });
}
