import type { CrmDealStage, CrmDealType } from '@/types';

export const DEAL_TYPE_LABEL: Record<CrmDealType, string> = {
  venda: 'Venda',
  locacao: 'Locação',
};

/** Etapas do funil, na ordem. "perdido" fica fora do fluxo principal. */
export const CRM_STAGES: {
  value: CrmDealStage;
  label: string;
  /** O que se espera anexar nesta etapa (aparece como dica no upload). */
  hint: string;
}[] = [
  {
    value: 'assinatura_opcao',
    label: 'Assinatura da Opção',
    hint: 'Opção de venda/locação assinada pelo proprietário',
  },
  {
    value: 'fotos_imovel',
    label: 'Fotos do Imóvel',
    hint: 'Fotos para o anúncio',
  },
  {
    value: 'divulgacao',
    label: 'Divulgação',
    hint: 'Prints da postagem nas redes e no site',
  },
  {
    value: 'comprador_locador',
    label: 'Comprador / Locador',
    hint: 'Proposta, documentos do interessado',
  },
  {
    value: 'vistoria',
    label: 'Vistoria',
    hint: 'Fotos e laudo da vistoria',
  },
  {
    value: 'contrato_assinado',
    label: 'Contrato Assinado',
    hint: 'Contrato final assinado',
  },
];

export const LOST_STAGE = { value: 'perdido' as CrmDealStage, label: 'Perdido' };

export const ALL_STAGES = [...CRM_STAGES, LOST_STAGE];

export function stageLabel(stage: CrmDealStage): string {
  return ALL_STAGES.find((s) => s.value === stage)?.label ?? stage;
}

export function stageIndex(stage: CrmDealStage): number {
  return CRM_STAGES.findIndex((s) => s.value === stage);
}

/** Etapa vizinha no funil, ou null se já está na ponta. */
export function adjacentStage(current: CrmDealStage, direction: 1 | -1): CrmDealStage | null {
  const idx = stageIndex(current);
  if (idx === -1) return null;
  const next = idx + direction;
  if (next < 0 || next >= CRM_STAGES.length) return null;
  return CRM_STAGES[next].value;
}
