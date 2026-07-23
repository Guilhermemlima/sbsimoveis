'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, GitCompare } from 'lucide-react';
import { formatDateBR } from '@/lib/format';

interface InspectionOption {
  id: string;
  type: string;
  performed_date: string | null;
  scheduled_date: string | null;
  status: string;
  property_id: string;
  properties?: { title: string; code: string };
}

interface ComparisonRow {
  environment: string;
  itemType: string;
  before: { rating: string; comments: string | null } | null;
  after: { rating: string; comments: string | null } | null;
  category: string;
}

const TYPE_LABEL: Record<string, string> = {
  entry: 'Entrada',
  exit: 'Saída',
  periodic: 'Periódica',
  emergency: 'Emergencial',
  maintenance: 'Manutenção',
  custom: 'Personalizada',
};

const RATING_LABEL: Record<string, string> = {
  new: 'Novo',
  excellent: 'Ótimo',
  good: 'Bom',
  regular: 'Regular',
  bad: 'Ruim',
  damaged: 'Danificado',
  not_applicable: 'N/A',
};

const CATEGORY_LABEL: Record<string, string> = {
  same: 'Permaneceu igual',
  improved: 'Melhorou',
  natural_wear: 'Desgaste natural',
  damaged: 'Danificado',
  needs_maintenance: 'Precisa de manutenção',
  may_charge_tenant: 'Pode gerar cobrança ao inquilino',
  not_applicable: 'Não comparável',
};

const CATEGORY_COLOR: Record<string, string> = {
  same: 'border-gray-200 bg-white',
  improved: 'border-green-300 bg-green-50',
  natural_wear: 'border-yellow-300 bg-yellow-50',
  damaged: 'border-red-300 bg-red-50',
  needs_maintenance: 'border-orange-300 bg-orange-50',
  may_charge_tenant: 'border-red-400 bg-red-100',
  not_applicable: 'border-gray-200 bg-gray-50',
};

const CATEGORY_ORDER = [
  'may_charge_tenant',
  'damaged',
  'needs_maintenance',
  'natural_wear',
  'improved',
  'same',
  'not_applicable',
];

function getQueryParam(name: string): string {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get(name) || '';
}

export default function CompareInspectionsPage() {
  const [options, setOptions] = useState<InspectionOption[]>([]);
  const [propertyId, setPropertyId] = useState(() => getQueryParam('property'));
  const [idA, setIdA] = useState('');
  const [idB, setIdB] = useState(() => getQueryParam('b'));
  const [rows, setRows] = useState<ComparisonRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/inspections')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setOptions(Array.isArray(data) ? data : []));
  }, []);

  const propertyOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const o of options) {
      if (o.properties) map.set(o.property_id, `${o.properties.title} · ${o.properties.code}`);
    }
    return [...map.entries()];
  }, [options]);

  const inspectionsForProperty = useMemo(
    () => options.filter((o) => o.property_id === propertyId),
    [options, propertyId]
  );

  const runCompare = async () => {
    if (!idA || !idB) {
      setError('Selecione as duas vistorias.');
      return;
    }
    setError('');
    setLoading(true);
    const res = await fetch(`/api/admin/inspections/compare?a=${idA}&b=${idB}`);
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || 'Não foi possível comparar.');
      return;
    }
    setRows(data.results);
  };

  const grouped = useMemo(() => {
    const groups: Record<string, ComparisonRow[]> = {};
    for (const row of rows) {
      groups[row.category] = groups[row.category] ?? [];
      groups[row.category].push(row);
    }
    return groups;
  }, [rows]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-noise-navy text-white py-8">
        <div className="container mx-auto px-4">
          <Link
            href="/admin/inspections"
            className="inline-flex items-center gap-2 text-navy-100 hover:text-white mb-4 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar às Vistorias
          </Link>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <GitCompare className="w-7 h-7 text-gold-400" />
            Comparação de Vistorias
          </h1>
          <p className="text-navy-100">Compare entrada, saída ou vistorias periódicas do mesmo imóvel</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {error && (
            <div className="md:col-span-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Imóvel</label>
            <select
              value={propertyId}
              onChange={(e) => {
                setPropertyId(e.target.value);
                setIdA('');
                setIdB('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Selecione</option>
              {propertyOptions.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Vistoria &ldquo;antes&rdquo;</label>
            <select
              value={idA}
              onChange={(e) => setIdA(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Selecione</option>
              {inspectionsForProperty.map((o) => (
                <option key={o.id} value={o.id}>
                  {TYPE_LABEL[o.type]} —{' '}
                  {o.performed_date ? formatDateBR(o.performed_date) : formatDateBR(o.scheduled_date ?? '')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Vistoria &ldquo;depois&rdquo;</label>
            <select
              value={idB}
              onChange={(e) => setIdB(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Selecione</option>
              {inspectionsForProperty.map((o) => (
                <option key={o.id} value={o.id}>
                  {TYPE_LABEL[o.type]} —{' '}
                  {o.performed_date ? formatDateBR(o.performed_date) : formatDateBR(o.scheduled_date ?? '')}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <button
              onClick={runCompare}
              disabled={loading}
              className="px-6 py-3 bg-gold-500 text-navy-950 rounded-lg font-bold hover:bg-gold-400 transition-colors disabled:opacity-50"
            >
              {loading ? 'Comparando...' : 'Comparar'}
            </button>
          </div>
        </div>

        {rows.length > 0 && (
          <div className="space-y-6">
            {CATEGORY_ORDER.filter((cat) => grouped[cat]?.length).map((cat) => (
              <div key={cat}>
                <h2 className="text-lg font-bold text-navy-950 mb-3">
                  {CATEGORY_LABEL[cat]} ({grouped[cat].length})
                </h2>
                <div className="space-y-2">
                  {grouped[cat].map((row, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border ${CATEGORY_COLOR[cat]}`}
                    >
                      <div>
                        <p className="font-medium text-navy-950 text-sm">
                          {row.environment} · {row.itemType}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-1 rounded bg-gray-100 text-gray-700">
                          Antes: {row.before ? RATING_LABEL[row.before.rating] : '—'}
                        </span>
                        <span>→</span>
                        <span className="px-2 py-1 rounded bg-gray-100 text-gray-700">
                          Depois: {row.after ? RATING_LABEL[row.after.rating] : '—'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
