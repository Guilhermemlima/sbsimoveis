'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

interface AuditLogEntry {
  id: string;
  user_name: string | null;
  user_role: string | null;
  action: string;
  entity_type: string;
  description: string;
  created_at: string;
}

const ACTION_LABEL: Record<string, string> = {
  create: 'Criação',
  update: 'Alteração',
  activate: 'Reativação',
  deactivate: 'Desativação',
  permission_change: 'Permissão',
  login: 'Login',
  mark_paid: 'Pagamento',
  settle_deposit: 'Caução',
};

const ACTION_COLOR: Record<string, string> = {
  create: 'bg-green-100 text-green-800',
  update: 'bg-blue-100 text-blue-800',
  activate: 'bg-green-100 text-green-800',
  deactivate: 'bg-red-100 text-red-800',
  permission_change: 'bg-purple-100 text-purple-800',
  login: 'bg-gray-100 text-gray-700',
  mark_paid: 'bg-teal-100 text-teal-800',
  settle_deposit: 'bg-amber-100 text-amber-800',
};

const ENTITY_LABEL: Record<string, string> = {
  user: 'Usuário',
  session: 'Sessão',
  rent_charge: 'Cobrança de Aluguel',
  owner_payout: 'Repasse',
  lease_contract: 'Contrato de Locação',
  expense: 'Despesa',
  settings: 'Configurações',
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('all');

  useEffect(() => {
    fetch('/api/admin/audit-log')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setLogs(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const entityTypes = useMemo(
    () => [...new Set(logs.map((l) => l.entity_type))].sort(),
    [logs]
  );

  const filteredLogs = useMemo(
    () => (entityFilter === 'all' ? logs : logs.filter((l) => l.entity_type === entityFilter)),
    [logs, entityFilter]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-noise-navy text-white py-8">
        <div className="container mx-auto px-4">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 text-navy-100 hover:text-white mb-4 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </Link>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-gold-400" />
            Auditoria
          </h1>
          <p className="text-navy-100">Registro de ações sensíveis realizadas no sistema</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <div className="bg-white rounded-xl shadow-md p-4 mb-6 flex items-center gap-3">
          <label className="text-sm font-semibold text-gray-700">Filtrar por tipo</label>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">Todos</option>
            {entityTypes.map((type) => (
              <option key={type} value={type}>
                {ENTITY_LABEL[type] ?? type}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Data</th>
                  <th className="px-6 py-3">Usuário</th>
                  <th className="px-6 py-3">Ação</th>
                  <th className="px-6 py-3">Tipo</th>
                  <th className="px-6 py-3">Descrição</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="border-t border-gray-100">
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-navy-950 font-medium whitespace-nowrap">
                      {log.user_name ?? '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${ACTION_COLOR[log.action] ?? 'bg-gray-100 text-gray-700'}`}
                      >
                        {ACTION_LABEL[log.action] ?? log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                      {ENTITY_LABEL[log.entity_type] ?? log.entity_type}
                    </td>
                    <td className="px-6 py-4 text-gray-700">{log.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && filteredLogs.length === 0 && (
            <div className="p-12 text-center text-gray-600">Nenhum evento registrado ainda.</div>
          )}
          {loading && <div className="p-12 text-center text-gray-600">Carregando...</div>}
        </div>
      </div>
    </div>
  );
}
