'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import type { AppSettings } from '@/lib/settings';

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500 transition-colors';
const labelClass = 'block text-sm font-semibold text-gray-700 mb-2';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setSettings(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const set = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setSaved(false);
    setError('');

    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Não foi possível salvar.');
      return;
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 4000);
  };

  if (loading || !settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Carregando...</p>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold mb-2">Configurações</h1>
          <p className="text-navy-100">Dados da empresa exibidos no site</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {saved && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              Configurações salvas com sucesso.
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-md p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <h2 className="md:col-span-2 text-lg font-bold text-navy-950">Empresa</h2>

            <div>
              <label className={labelClass}>Nome da empresa</label>
              <input
                required
                value={settings.company_name}
                onChange={(e) => set('company_name', e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>E-mail de contato</label>
              <input
                required
                type="email"
                value={settings.company_email}
                onChange={(e) => set('company_email', e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Telefone (exibido no site)</label>
              <input
                required
                value={settings.company_phone}
                onChange={(e) => set('company_phone', e.target.value)}
                placeholder="(42) 98444-7987"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>WhatsApp (só números, com DDI 55)</label>
              <input
                required
                value={settings.whatsapp_number}
                onChange={(e) => set('whatsapp_number', e.target.value.replace(/\D/g, ''))}
                placeholder="5542984447987"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Cidade</label>
              <input
                required
                value={settings.company_city}
                onChange={(e) => set('company_city', e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Endereço exibido (ex: Cidade, UF)</label>
              <input
                required
                value={settings.company_address}
                onChange={(e) => set('company_address', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <h2 className="md:col-span-2 text-lg font-bold text-navy-950">Redes Sociais</h2>

            <div>
              <label className={labelClass}>Facebook (link completo)</label>
              <input
                value={settings.social_facebook ?? ''}
                onChange={(e) => set('social_facebook', e.target.value || null)}
                placeholder="https://www.facebook.com/..."
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Instagram (link completo)</label>
              <input
                value={settings.social_instagram ?? ''}
                onChange={(e) => set('social_instagram', e.target.value || null)}
                placeholder="https://www.instagram.com/..."
                className={inputClass}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <h2 className="md:col-span-2 text-lg font-bold text-navy-950">Preferências</h2>

            <div>
              <label className={labelClass}>Máx. imóveis no carrossel</label>
              <input
                type="number"
                min={1}
                max={10}
                value={settings.max_opportunities_carousel}
                onChange={(e) => set('max_opportunities_carousel', Number(e.target.value))}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Comissão padrão (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={settings.default_commission_rate}
                onChange={(e) => set('default_commission_rate', Number(e.target.value))}
                className={inputClass}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <h2 className="md:col-span-2 text-lg font-bold text-navy-950">Locação — Uso do Lucro</h2>
            <p className="md:col-span-2 text-sm text-gray-500 -mt-2">
              Percentual da taxa de administração já recebida (o lucro real da imobiliária com aluguéis)
              que pode ser usado para custear despesas administrativas. O dinheiro dos proprietários
              nunca é afetado por essa regra. Deixe em 0% para desativar.
            </p>

            <div>
              <label className={labelClass}>Limite de uso do lucro da locação (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={settings.rental_profit_expense_rate}
                onChange={(e) => set('rental_profit_expense_rate', Number(e.target.value))}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gold-500 text-navy-950 rounded-lg font-bold hover:bg-gold-400 transition-colors disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {!saving && <Save className="w-4 h-4" />}
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
