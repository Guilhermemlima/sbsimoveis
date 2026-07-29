-- Etapa 5.1 do roadmap: funil de CRM para leads, com histórico de movimentação.

-- Novo estágio "Contrato" entre Negociação e Concluído (mapeado para o status 'sold').
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'contract' AFTER 'negotiating';

-- Histórico de movimentação do lead entre estágios do funil.
CREATE TABLE IF NOT EXISTS lead_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  from_status lead_status,
  to_status lead_status NOT NULL,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_status_history_lead ON lead_status_history(lead_id);
