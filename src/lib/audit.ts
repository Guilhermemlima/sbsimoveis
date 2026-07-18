import { createServiceRoleClient } from '@/lib/supabase';

export interface AuditActor {
  id: string;
  name: string;
  role: string;
}

interface LogAuditParams {
  user: AuditActor;
  action: string;
  entityType: string;
  entityId?: string | null;
  description: string;
  metadata?: Record<string, unknown>;
}

export async function logAudit({
  user,
  action,
  entityType,
  entityId,
  description,
  metadata,
}: LogAuditParams): Promise<void> {
  const supabase = createServiceRoleClient();
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    user_name: user.name,
    user_role: user.role,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    description,
    metadata: metadata ?? null,
  });
}
