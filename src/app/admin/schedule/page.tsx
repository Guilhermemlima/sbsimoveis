'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import BackToDashboardLink from '@/components/common/BackToDashboardLink';
import { CalendarClock, Home, Receipt, PiggyBank, FileText } from 'lucide-react';
import { formatDateBR } from '@/lib/format';

interface ScheduleItem {
  id: string;
  kind: 'rent_charge' | 'expense' | 'owner_payout' | 'lease_renewal';
  description: string;
  amount: number | null;
  date: string;
  status: string;
  propertyLabel: string | null;
}

const KIND_ICON: Record<string, typeof Home> = {
  rent_charge: Home,
  expense: Receipt,
  owner_payout: PiggyBank,
  lease_renewal: FileText,
};

const KIND_LABEL: Record<string, string> = {
  rent_charge: 'Cobrança',
  expense: 'Despesa',
  owner_payout: 'Repasse',
  lease_renewal: 'Contrato',
};

const KIND_LINK: Record<string, string> = {
  rent_charge: '/admin/rent-charges',
  expense: '/admin/expenses',
  owner_payout: '/admin/payouts',
  lease_renewal: '/admin/leases',
};

function toLocalDate(dateOnly: string): Date {
  const [year, month, day] = dateOnly.split('-').map(Number);
  return new Date(year, month - 1, day);
}

type Bucket = 'overdue' | 'today' | 'week' | 'month' | 'later';

const BUCKET_LABEL: Record<Bucket, string> = {
  overdue: 'Vencido',
  today: 'Hoje',
  week: 'Próximos 7 dias',
  month: 'Este mês',
  later: 'Mais adiante',
};

const BUCKET_COLOR: Record<Bucket, string> = {
  overdue: 'border-red-300 bg-red-50',
  today: 'border-amber-300 bg-amber-50',
  week: 'border-blue-300 bg-blue-50',
  month: 'border-gray-200 bg-white',
  later: 'border-gray-200 bg-white',
};

function bucketOf(dateOnly: string): Bucket {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = toLocalDate(dateOnly);
  const diffDays = Math.round((date.getTime() - today.getTime()) / 86400000);

  if (diffDays < 0) return 'overdue';
  if (diffDays === 0) return 'today';
  if (diffDays <= 7) return 'week';
  if (diffDays <= 31) return 'month';
  return 'later';
}

export default function SchedulePage() {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/schedule')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => {
    const groups: Record<Bucket, ScheduleItem[]> = { overdue: [], today: [], week: [], month: [], later: [] };
    for (const item of items) {
      groups[bucketOf(item.date)].push(item);
    }
    return groups;
  }, [items]);

  const order: Bucket[] = ['overdue', 'today', 'week', 'month', 'later'];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-noise-navy text-white py-8">
        <div className="container mx-auto px-4">
          <BackToDashboardLink />
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <CalendarClock className="w-7 h-7 text-gold-400" />
            Cronograma Financeiro
          </h1>
          <p className="text-navy-100">
            Cobranças, despesas, repasses e contratos vencendo — tudo em uma linha do tempo
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 space-y-8">
        {order.map((bucket) => {
          const bucketItems = grouped[bucket];
          if (bucketItems.length === 0) return null;

          return (
            <div key={bucket}>
              <h2 className="text-lg font-bold text-navy-950 mb-3">{BUCKET_LABEL[bucket]}</h2>
              <div className="space-y-2">
                {bucketItems.map((item) => {
                  const Icon = KIND_ICON[item.kind];
                  return (
                    <Link
                      key={`${item.kind}-${item.id}`}
                      href={KIND_LINK[item.kind]}
                      className={`flex items-center justify-between gap-4 p-4 rounded-lg border ${BUCKET_COLOR[bucket]} hover:shadow-md transition-shadow`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-white shadow flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-navy-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-navy-950 truncate">{item.description}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {KIND_LABEL[item.kind]}
                            {item.propertyLabel ? ` · ${item.propertyLabel}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {item.amount !== null && (
                          <p className="font-semibold text-navy-950">
                            R$ {item.amount.toLocaleString('pt-BR')}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">{formatDateBR(item.date)}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}

        {!loading && items.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center text-gray-600">
            Nada pendente no momento. Tudo em dia.
          </div>
        )}
        {loading && <div className="bg-white rounded-xl shadow-md p-12 text-center text-gray-600">Carregando...</div>}
      </div>
    </div>
  );
}
