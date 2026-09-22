'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  BellRing,
  ClipboardCheck,
  FileEdit,
  Home,
  Percent,
  TrendingUp,
  Wrench,
} from 'lucide-react';

interface ScheduleItem {
  id: string;
  kind: string;
  date: string;
}

function toLocalDate(dateOnly: string): Date {
  const [year, month, day] = dateOnly.split('-').map(Number);
  return new Date(year, month - 1, day);
}

interface OperationalAlerts {
  contractsExpiringSoon: {
    lease_contract_id: string;
    property?: { title: string; code: string };
    days_until_end: number;
  }[];
  rentAdjustmentOverdue: {
    lease_contract_id: string;
    property?: { title: string; code: string };
    days_since_last_adjustment: number;
  }[];
  maintenanceAwaitingReview: {
    id: string;
    title: string;
    priority: string;
    properties?: { title: string; code: string };
  }[];
  inspectionsPending: {
    id: string;
    type: string;
    status: string;
    properties?: { title: string; code: string };
  }[];
  amendmentsPendingSignature: {
    id: string;
    title: string;
    lease_contracts?: { properties?: { title: string; code: string } };
  }[];
  occupancy: { total: number; occupied: number };
  counts: {
    contractsExpiringSoon: number;
    rentAdjustmentOverdue: number;
    maintenanceAwaitingReview: number;
    inspectionsPending: number;
    amendmentsPendingSignature: number;
    overdueRentCharges: number;
  };
}

export default function PainelOperacional() {
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [alerts, setAlerts] = useState<OperationalAlerts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/schedule')
      .then((res) => (res.ok ? res.json() : []))
      .then((items) => setScheduleItems(Array.isArray(items) ? items : []));

    fetch('/api/admin/alerts')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => setAlerts(json))
      .finally(() => setLoading(false));
  }, []);

  const notifications = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    let overdue = 0;
    let dueSoon = 0;
    for (const item of scheduleItems) {
      const date = toLocalDate(item.date);
      if (date < today) overdue += 1;
      else if (date <= weekFromNow) dueSoon += 1;
    }
    return { overdue, dueSoon, total: overdue + dueSoon };
  })();

  const ocupacao =
    alerts && alerts.occupancy.total > 0
      ? Math.round((alerts.occupancy.occupied / alerts.occupancy.total) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-noise-navy text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Painel Operacional</h1>
          <p className="text-navy-100">Ocupação, atrasos e pendências da locação</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        {loading && <p className="text-gray-600">Carregando painel...</p>}

        {notifications.total > 0 && (
          <Link
            href="/admin/schedule"
            className="flex items-center justify-between gap-4 mb-10 p-5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
                <BellRing className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-navy-950">
                  {notifications.overdue > 0 && (
                    <span className="text-red-700">{notifications.overdue} vencido(s)</span>
                  )}
                  {notifications.overdue > 0 && notifications.dueSoon > 0 && ' · '}
                  {notifications.dueSoon > 0 &&
                    `${notifications.dueSoon} vencendo nos próximos 7 dias`}
                </p>
                <p className="text-sm text-gray-600">
                  Cobranças, despesas, repasses e contratos precisando de atenção
                </p>
              </div>
            </div>
            <span className="text-sm font-semibold text-navy-950 whitespace-nowrap">
              Ver cronograma →
            </span>
          </Link>
        )}

        {alerts && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
              <div className="bg-white p-4 rounded-xl shadow border border-transparent">
                <Percent className="w-5 h-5 text-navy-500 mb-1" />
                <p className="text-2xl font-bold text-gray-900">{ocupacao}%</p>
                <p className="text-xs text-gray-600">
                  Ocupação ({alerts.occupancy.occupied}/{alerts.occupancy.total})
                </p>
              </div>

              <Link
                href="/admin/rent-charges/overdue"
                className={`p-4 rounded-xl shadow border transition ${alerts.counts.overdueRentCharges > 0 ? 'bg-red-50 border-red-200 hover:bg-red-100' : 'bg-white border-transparent'}`}
              >
                <AlertTriangle
                  className={`w-5 h-5 mb-1 ${alerts.counts.overdueRentCharges > 0 ? 'text-red-600' : 'text-gray-400'}`}
                />
                <p className="text-2xl font-bold text-gray-900">
                  {alerts.counts.overdueRentCharges}
                </p>
                <p className="text-xs text-gray-600">Aluguéis em atraso</p>
              </Link>

              <Link
                href="/admin/leases"
                className={`p-4 rounded-xl shadow border transition ${alerts.counts.contractsExpiringSoon > 0 ? 'bg-amber-50 border-amber-200 hover:bg-amber-100' : 'bg-white border-transparent'}`}
              >
                <Home
                  className={`w-5 h-5 mb-1 ${alerts.counts.contractsExpiringSoon > 0 ? 'text-amber-600' : 'text-gray-400'}`}
                />
                <p className="text-2xl font-bold text-gray-900">
                  {alerts.counts.contractsExpiringSoon}
                </p>
                <p className="text-xs text-gray-600">Contratos vencendo em 60 dias</p>
              </Link>

              <Link
                href="/admin/leases"
                className={`p-4 rounded-xl shadow border transition ${alerts.counts.rentAdjustmentOverdue > 0 ? 'bg-amber-50 border-amber-200 hover:bg-amber-100' : 'bg-white border-transparent'}`}
              >
                <TrendingUp
                  className={`w-5 h-5 mb-1 ${alerts.counts.rentAdjustmentOverdue > 0 ? 'text-amber-600' : 'text-gray-400'}`}
                />
                <p className="text-2xl font-bold text-gray-900">
                  {alerts.counts.rentAdjustmentOverdue}
                </p>
                <p className="text-xs text-gray-600">Sem reajuste há 12+ meses</p>
              </Link>

              <Link
                href="/admin/maintenance"
                className={`p-4 rounded-xl shadow border transition ${alerts.counts.maintenanceAwaitingReview > 0 ? 'bg-orange-50 border-orange-200 hover:bg-orange-100' : 'bg-white border-transparent'}`}
              >
                <Wrench
                  className={`w-5 h-5 mb-1 ${alerts.counts.maintenanceAwaitingReview > 0 ? 'text-orange-600' : 'text-gray-400'}`}
                />
                <p className="text-2xl font-bold text-gray-900">
                  {alerts.counts.maintenanceAwaitingReview}
                </p>
                <p className="text-xs text-gray-600">Manutenções aguardando análise</p>
              </Link>

              <Link
                href="/admin/inspections"
                className={`p-4 rounded-xl shadow border transition ${alerts.counts.inspectionsPending > 0 ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100' : 'bg-white border-transparent'}`}
              >
                <ClipboardCheck
                  className={`w-5 h-5 mb-1 ${alerts.counts.inspectionsPending > 0 ? 'text-emerald-600' : 'text-gray-400'}`}
                />
                <p className="text-2xl font-bold text-gray-900">
                  {alerts.counts.inspectionsPending}
                </p>
                <p className="text-xs text-gray-600">Vistorias pendentes</p>
              </Link>
            </div>

            {alerts.counts.amendmentsPendingSignature > 0 && (
              <Link
                href="/admin/amendments"
                className="flex items-center gap-3 p-4 rounded-xl border border-cyan-200 bg-cyan-50 hover:bg-cyan-100 transition mb-4"
              >
                <FileEdit className="w-5 h-5 text-cyan-700" />
                <p className="text-sm font-semibold text-navy-950">
                  {alerts.counts.amendmentsPendingSignature} aditivo(s) aguardando assinatura
                </p>
              </Link>
            )}

            {(alerts.contractsExpiringSoon.length > 0 ||
              alerts.rentAdjustmentOverdue.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {alerts.contractsExpiringSoon.length > 0 && (
                  <div className="bg-white rounded-xl shadow border border-gray-100 p-4">
                    <p className="text-sm font-bold text-navy-950 mb-2">Próximos vencimentos</p>
                    <ul className="space-y-1">
                      {alerts.contractsExpiringSoon.slice(0, 5).map((c) => (
                        <li
                          key={c.lease_contract_id}
                          className="text-xs text-gray-600 flex justify-between"
                        >
                          <span>
                            {c.property?.title} · {c.property?.code}
                          </span>
                          <span className="font-semibold">{c.days_until_end} dia(s)</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {alerts.rentAdjustmentOverdue.length > 0 && (
                  <div className="bg-white rounded-xl shadow border border-gray-100 p-4">
                    <p className="text-sm font-bold text-navy-950 mb-2">Sem reajuste há mais tempo</p>
                    <ul className="space-y-1">
                      {alerts.rentAdjustmentOverdue.slice(0, 5).map((c) => (
                        <li
                          key={c.lease_contract_id}
                          className="text-xs text-gray-600 flex justify-between"
                        >
                          <span>
                            {c.property?.title} · {c.property?.code}
                          </span>
                          <span className="font-semibold">
                            {Math.round(c.days_since_last_adjustment / 30)} mês(es)
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {!loading && !alerts && (
          <p className="text-gray-600">Não foi possível carregar os indicadores operacionais.</p>
        )}
      </div>
    </div>
  );
}
