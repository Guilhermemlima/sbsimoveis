'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import BackToDashboardLink from '@/components/common/BackToDashboardLink';
import { Plus, X, Loader2, FileText, ShieldCheck, FileEdit, Umbrella, Upload, Download, Trash2, PenLine, RefreshCw, ExternalLink } from 'lucide-react';
import CurrencyInput from '@/components/common/CurrencyInput';
import type { Property, PropertyOwner, Tenant, Guarantor, BillingResponsible, DepositDeduction } from '@/types';

interface Lease {
  id: string;
  property_id: string;
  owner_id: string;
  tenant_id: string;
  guarantor_id?: string | null;
  realtor_id?: string | null;
  owners?: { owner_id: string; name: string }[];
  tenants?: { tenant_id: string; name: string }[];
  start_date: string;
  end_date: string;
  due_day: number;
  rent_value: number;
  admin_fee_percentage: number;
  deposit_value: number;
  deposit_months?: number | null;
  deposit_status: string;
  deposit_returned_amount?: number | null;
  fiance_insurance_company?: string | null;
  fiance_insurance_policy_number?: string | null;
  fiance_insurance_value?: number | null;
  fiance_insurance_start_date?: string | null;
  fiance_insurance_end_date?: string | null;
  fiance_insurance_file_path?: string | null;
  fiance_insurance_file_name?: string | null;
  first_rent_retention_type: string;
  first_rent_retention_installments: number;
  first_rent_retention_installments_applied: number;
  status: string;
  ownerName: string;
  tenantName: string;
  guarantorName?: string | null;
  properties?: { title: string; code: string; city: string; neighborhood: string };
}

interface SignatureRequestSigner {
  id: string;
  party_role: string;
  name: string;
  email: string;
  sign_url: string | null;
  signed_at: string | null;
  rejected_at: string | null;
}

interface SignatureRequest {
  id: string;
  status: string;
  document_name: string | null;
  created_at: string;
  signedDownloadUrl: string | null;
  signature_request_signers: SignatureRequestSigner[];
}

const SIGNATURE_STATUS_LABEL: Record<string, string> = {
  pending: 'Pendente',
  completed: 'Concluída',
  rejected: 'Recusada',
};

const PARTY_ROLE_LABEL: Record<string, string> = {
  owner: 'Proprietário',
  tenant: 'Inquilino',
  guarantor: 'Fiador',
  realtor: 'Corretor',
};

const DEPOSIT_STATUS_LABEL: Record<string, string> = {
  held: 'Retida',
  partially_refunded: 'Devolvida parcialmente',
  refunded: 'Devolvida',
  forfeited: 'Retida integralmente',
};

const DEPOSIT_STATUS_COLOR: Record<string, string> = {
  held: 'bg-blue-100 text-blue-800',
  partially_refunded: 'bg-yellow-100 text-yellow-800',
  refunded: 'bg-green-100 text-green-800',
  forfeited: 'bg-red-100 text-red-800',
};

const RESPONSIBLE_LABEL: Record<BillingResponsible, string> = {
  tenant: 'Inquilino',
  owner: 'Proprietário',
  agency: 'Imobiliária',
  split: 'Dividido',
  not_applicable: 'Não se aplica',
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'Rascunho',
  active: 'Ativo',
  expiring_soon: 'Vencendo em breve',
  expired: 'Vencido',
  terminated: 'Encerrado',
  cancelled: 'Cancelado',
};

const STATUS_COLOR: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-800',
  expiring_soon: 'bg-yellow-100 text-yellow-800',
  expired: 'bg-red-100 text-red-800',
  terminated: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-gray-100 text-gray-500',
};

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500 transition-colors';
const labelClass = 'block text-sm font-semibold text-gray-700 mb-2';

const RETENTION_TYPE_LABEL: Record<string, string> = {
  none: 'Não reter o primeiro aluguel',
  fifty_percent: 'Reter 50% do primeiro aluguel',
  hundred_percent: 'Reter 100% do primeiro aluguel',
  custom_percentage: 'Percentual personalizado',
  custom_amount: 'Valor fixo personalizado',
};

const responsibleFields: { key: string; label: string }[] = [
  { key: 'water_responsible', label: 'Água' },
  { key: 'energy_responsible', label: 'Energia' },
  { key: 'iptu_responsible', label: 'IPTU' },
  { key: 'insurance_responsible', label: 'Seguro' },
  { key: 'condo_responsible', label: 'Condomínio' },
];

export default function LeasesPage() {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [owners, setOwners] = useState<PropertyOwner[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [guarantors, setGuarantors] = useState<Guarantor[]>([]);
  const [realtors, setRealtors] = useState<{ id: string; name: string; email: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [depositLeaseId, setDepositLeaseId] = useState<string | null>(null);
  const [deductions, setDeductions] = useState<DepositDeduction[]>([]);
  const [deductionForm, setDeductionForm] = useState({ description: '', amount: '' });
  const [settling, setSettling] = useState(false);
  const [settleResult, setSettleResult] = useState<{ refundAmount: number; totalDeductions: number } | null>(
    null
  );

  const [insuranceLeaseId, setInsuranceLeaseId] = useState<string | null>(null);
  const [insuranceForm, setInsuranceForm] = useState({
    fiance_insurance_company: '',
    fiance_insurance_policy_number: '',
    fiance_insurance_value: '',
    fiance_insurance_start_date: '',
    fiance_insurance_end_date: '',
  });
  const [insuranceSaving, setInsuranceSaving] = useState(false);
  const [insuranceError, setInsuranceError] = useState('');
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null);
  const [insuranceFileInfo, setInsuranceFileInfo] = useState<{ downloadUrl: string | null; fileName: string | null }>({
    downloadUrl: null,
    fileName: null,
  });
  const [insuranceUploading, setInsuranceUploading] = useState(false);

  const [signatureLeaseId, setSignatureLeaseId] = useState<string | null>(null);
  const [signatureRequests, setSignatureRequests] = useState<SignatureRequest[]>([]);
  const [signatureLoading, setSignatureLoading] = useState(false);
  const [signatureError, setSignatureError] = useState('');
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [selectedSigners, setSelectedSigners] = useState<Record<string, boolean>>({});
  const [signatureSubmitting, setSignatureSubmitting] = useState(false);

  const [form, setForm] = useState<Record<string, string>>({
    property_id: '',
    owner_id: '',
    tenant_id: '',
    guarantor_id: '',
    start_date: new Date().toISOString().slice(0, 10),
    end_date: '',
    due_day: '10',
    rent_value: '',
    admin_fee_percentage: '10',
    deposit_value: '0',
    deposit_months: '',
    water_responsible: 'tenant',
    energy_responsible: 'tenant',
    iptu_responsible: 'owner',
    insurance_responsible: 'tenant',
    condo_responsible: 'tenant',
    notes: '',
    first_rent_retention_type: 'none',
    first_rent_retention_percentage: '',
    first_rent_retention_fixed_amount: '',
    first_rent_retention_basis: 'gross',
    first_rent_retention_include_extra_fees: '',
    first_rent_retention_installments: '1',
    first_rent_retention_notes: '',
  });

  const [leaseOwners, setLeaseOwners] = useState<
    { owner_id: string; percentage: string; commission_rate: string }[]
  >([{ owner_id: '', percentage: '100', commission_rate: '' }]);

  const addOwnerRow = () =>
    setLeaseOwners((rows) => [...rows, { owner_id: '', percentage: '', commission_rate: '' }]);

  const removeOwnerRow = (index: number) =>
    setLeaseOwners((rows) => (rows.length > 1 ? rows.filter((_, i) => i !== index) : rows));

  const setOwnerRow = (index: number, key: 'owner_id' | 'percentage' | 'commission_rate', value: string) =>
    setLeaseOwners((rows) => rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)));

  const ownersPercentageTotal = leaseOwners.reduce((sum, o) => sum + (Number(o.percentage) || 0), 0);

  const [leaseTenants, setLeaseTenants] = useState<{ tenant_id: string; participation_percentage: string }[]>([
    { tenant_id: '', participation_percentage: '100' },
  ]);

  const addTenantRow = () =>
    setLeaseTenants((rows) => [...rows, { tenant_id: '', participation_percentage: '' }]);

  const removeTenantRow = (index: number) =>
    setLeaseTenants((rows) => (rows.length > 1 ? rows.filter((_, i) => i !== index) : rows));

  const setTenantRow = (index: number, key: 'tenant_id' | 'participation_percentage', value: string) =>
    setLeaseTenants((rows) => rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)));

  const tenantsPercentageTotal = leaseTenants.reduce(
    (sum, t) => sum + (Number(t.participation_percentage) || 0),
    0
  );

  const loadLeases = () => {
    fetch('/api/admin/leases')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setLeases(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLeases();
    fetch('/api/realtor/properties')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setProperties(Array.isArray(data) ? data : []));
    fetch('/api/admin/owners')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setOwners(Array.isArray(data) ? data : []));
    fetch('/api/admin/tenants')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setTenants(Array.isArray(data) ? data : []));
    fetch('/api/admin/guarantors')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setGuarantors(Array.isArray(data) ? data : []));
    fetch('/api/admin/realtors')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setRealtors(Array.isArray(data) ? data : []));
  }, []);

  const availableProperties = useMemo(
    () => properties.filter((p) => p.status === 'available' || p.status === 'reserved'),
    [properties]
  );

  const retentionPreview = useMemo(() => {
    const rentValue = Number(form.rent_value) || 0;
    const adminFeePct = Number(form.admin_fee_percentage) || 0;
    const adminFeeAmount = rentValue * (adminFeePct / 100);
    const type = form.first_rent_retention_type;

    if (!rentValue || type === 'none') return null;

    const base = form.first_rent_retention_basis === 'net' ? rentValue - adminFeeAmount : rentValue;

    let retentionAmount = 0;
    if (type === 'custom_amount') {
      retentionAmount = Number(form.first_rent_retention_fixed_amount) || 0;
    } else {
      const pct =
        type === 'fifty_percent'
          ? 50
          : type === 'hundred_percent'
            ? 100
            : Number(form.first_rent_retention_percentage) || 0;
      retentionAmount = base * (pct / 100);
    }

    const installments = Number(form.first_rent_retention_installments) || 1;
    const perInstallment = retentionAmount / installments;
    const ownerNet = rentValue - adminFeeAmount - perInstallment;

    return { rentValue, adminFeeAmount, retentionAmount, perInstallment, ownerNet, installments };
  }, [
    form.rent_value,
    form.admin_fee_percentage,
    form.first_rent_retention_type,
    form.first_rent_retention_basis,
    form.first_rent_retention_fixed_amount,
    form.first_rent_retention_percentage,
    form.first_rent_retention_installments,
  ]);

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const openDeposit = (leaseId: string) => {
    setDepositLeaseId(leaseId);
    setSettleResult(null);
    setDeductionForm({ description: '', amount: '' });
    fetch(`/api/admin/leases/${leaseId}/deductions`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setDeductions(Array.isArray(data) ? data : []));
  };

  const addDeduction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositLeaseId || !deductionForm.description || !deductionForm.amount) return;

    const res = await fetch(`/api/admin/leases/${depositLeaseId}/deductions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: deductionForm.description, amount: Number(deductionForm.amount) }),
    });

    if (res.ok) {
      setDeductionForm({ description: '', amount: '' });
      openDeposit(depositLeaseId);
    }
  };

  const insuranceLease = leases.find((l) => l.id === insuranceLeaseId);

  const openInsurance = (lease: Lease) => {
    setInsuranceLeaseId(lease.id);
    setInsuranceError('');
    setInsuranceFile(null);
    setInsuranceForm({
      fiance_insurance_company: lease.fiance_insurance_company ?? '',
      fiance_insurance_policy_number: lease.fiance_insurance_policy_number ?? '',
      fiance_insurance_value: lease.fiance_insurance_value ? String(lease.fiance_insurance_value) : '',
      fiance_insurance_start_date: lease.fiance_insurance_start_date ?? '',
      fiance_insurance_end_date: lease.fiance_insurance_end_date ?? '',
    });
    setInsuranceFileInfo({ downloadUrl: null, fileName: lease.fiance_insurance_file_name ?? null });
    if (lease.fiance_insurance_file_name) {
      fetch(`/api/admin/leases/${lease.id}/insurance-policy`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => data && setInsuranceFileInfo(data));
    }
  };

  const saveInsuranceFields = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!insuranceLeaseId) return;
    setInsuranceError('');
    setInsuranceSaving(true);

    const res = await fetch(`/api/admin/leases/${insuranceLeaseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...insuranceForm,
        fiance_insurance_value: insuranceForm.fiance_insurance_value
          ? Number(insuranceForm.fiance_insurance_value)
          : null,
      }),
    });

    setInsuranceSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setInsuranceError(data.error || 'Não foi possível salvar os dados do seguro fiança.');
      return;
    }

    loadLeases();
  };

  const uploadInsuranceFile = async () => {
    if (!insuranceLeaseId || !insuranceFile) return;
    setInsuranceUploading(true);
    setInsuranceError('');

    const body = new FormData();
    body.append('file', insuranceFile);

    const res = await fetch(`/api/admin/leases/${insuranceLeaseId}/insurance-policy`, {
      method: 'POST',
      body,
    });

    setInsuranceUploading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setInsuranceError(data.error || 'Não foi possível enviar a apólice.');
      return;
    }

    setInsuranceFile(null);
    const leaseId = insuranceLeaseId;
    fetch(`/api/admin/leases/${leaseId}/insurance-policy`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setInsuranceFileInfo(data));
    loadLeases();
  };

  const removeInsuranceFile = async () => {
    if (!insuranceLeaseId) return;
    if (!confirm('Remover o arquivo da apólice?')) return;
    await fetch(`/api/admin/leases/${insuranceLeaseId}/insurance-policy`, { method: 'DELETE' });
    setInsuranceFileInfo({ downloadUrl: null, fileName: null });
    loadLeases();
  };

  const signatureLease = leases.find((l) => l.id === signatureLeaseId);

  const signerCandidates = useMemo(() => {
    if (!signatureLease) return [];
    const candidates: { key: string; party_role: string; party_id: string; name: string; email: string }[] = [];

    for (const o of signatureLease.owners ?? []) {
      const full = owners.find((x) => x.id === o.owner_id);
      if (full?.email) candidates.push({ key: `owner:${o.owner_id}`, party_role: 'owner', party_id: o.owner_id, name: full.name, email: full.email });
    }
    for (const t of signatureLease.tenants ?? []) {
      const full = tenants.find((x) => x.id === t.tenant_id);
      if (full?.email) candidates.push({ key: `tenant:${t.tenant_id}`, party_role: 'tenant', party_id: t.tenant_id, name: full.name, email: full.email });
    }
    if (signatureLease.guarantor_id) {
      const full = guarantors.find((x) => x.id === signatureLease.guarantor_id);
      if (full?.email) candidates.push({ key: `guarantor:${full.id}`, party_role: 'guarantor', party_id: full.id, name: full.name, email: full.email });
    }
    if (signatureLease.realtor_id) {
      const full = realtors.find((x) => x.id === signatureLease.realtor_id);
      if (full?.email) candidates.push({ key: `realtor:${full.id}`, party_role: 'realtor', party_id: full.id, name: full.name, email: full.email });
    }

    return candidates;
  }, [signatureLease, owners, tenants, guarantors, realtors]);

  const loadSignatureRequests = (leaseId: string) => {
    setSignatureLoading(true);
    fetch(`/api/admin/leases/${leaseId}/signature-request`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setSignatureRequests(Array.isArray(data) ? data : []))
      .finally(() => setSignatureLoading(false));
  };

  const openSignature = (lease: Lease) => {
    setSignatureLeaseId(lease.id);
    setSignatureError('');
    setSignatureFile(null);
    setSelectedSigners({});
    loadSignatureRequests(lease.id);
  };

  const submitSignatureRequest = async () => {
    if (!signatureLeaseId || !signatureFile) {
      setSignatureError('Escolha o arquivo do contrato em PDF.');
      return;
    }
    const chosen = signerCandidates.filter((c) => selectedSigners[c.key]);
    if (chosen.length === 0) {
      setSignatureError('Selecione ao menos um signatário.');
      return;
    }

    setSignatureError('');
    setSignatureSubmitting(true);

    const body = new FormData();
    body.append('file', signatureFile);
    body.append(
      'signers',
      JSON.stringify(chosen.map((c) => ({ party_role: c.party_role, party_id: c.party_id, name: c.name, email: c.email })))
    );

    const res = await fetch(`/api/admin/leases/${signatureLeaseId}/signature-request`, { method: 'POST', body });
    setSignatureSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setSignatureError(data.error || 'Não foi possível enviar para assinatura.');
      return;
    }

    setSignatureFile(null);
    setSelectedSigners({});
    loadSignatureRequests(signatureLeaseId);
  };

  const settleDeposit = async () => {
    if (!depositLeaseId) return;
    setSettling(true);
    const res = await fetch(`/api/admin/leases/${depositLeaseId}/settle-deposit`, { method: 'POST' });
    const data = await res.json();
    setSettling(false);
    if (res.ok) {
      setSettleResult({ refundAmount: data.refundAmount, totalDeductions: data.totalDeductions });
      loadLeases();
    } else {
      setError(data.error || 'Não foi possível finalizar a devolução.');
    }
  };

  const depositLease = leases.find((l) => l.id === depositLeaseId);
  const deductionsTotal = deductions.reduce((sum, d) => sum + Number(d.amount), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.property_id || !form.end_date || !form.rent_value) {
      setError('Preencha imóvel, valor do aluguel e data final.');
      return;
    }

    if (leaseOwners.some((o) => !o.owner_id)) {
      setError('Selecione o proprietário em todas as linhas.');
      return;
    }

    if (Math.abs(ownersPercentageTotal - 100) > 0.01) {
      setError(`A soma dos percentuais dos proprietários deve ser 100%. Total atual: ${ownersPercentageTotal.toFixed(2)}%.`);
      return;
    }

    if (leaseTenants.some((t) => !t.tenant_id)) {
      setError('Selecione o inquilino em todas as linhas.');
      return;
    }

    if (Math.abs(tenantsPercentageTotal - 100) > 0.01) {
      setError(`A soma das participações dos inquilinos deve ser 100%. Total atual: ${tenantsPercentageTotal.toFixed(2)}%.`);
      return;
    }

    setSubmitting(true);
    const res = await fetch('/api/admin/leases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        owners: leaseOwners.map((o) => ({
          owner_id: o.owner_id,
          percentage: Number(o.percentage),
          commission_rate: Number(o.commission_rate) || 0,
        })),
        tenants: leaseTenants.map((t) => ({
          tenant_id: t.tenant_id,
          participation_percentage: Number(t.participation_percentage),
        })),
        due_day: Number(form.due_day),
        rent_value: Number(form.rent_value),
        admin_fee_percentage: Number(form.admin_fee_percentage),
        deposit_value: Number(form.deposit_value),
        first_rent_retention_installments: Number(form.first_rent_retention_installments) || 1,
        first_rent_retention_include_extra_fees: form.first_rent_retention_include_extra_fees === 'true',
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Não foi possível criar o contrato.');
      return;
    }

    setForm((f) => ({
      ...f,
      property_id: '',
      owner_id: '',
      tenant_id: '',
      guarantor_id: '',
      rent_value: '',
      end_date: '',
      first_rent_retention_type: 'none',
      first_rent_retention_percentage: '',
      first_rent_retention_fixed_amount: '',
      first_rent_retention_installments: '1',
      first_rent_retention_include_extra_fees: '',
      first_rent_retention_notes: '',
    }));
    setLeaseOwners([{ owner_id: '', percentage: '100', commission_rate: '' }]);
    setLeaseTenants([{ tenant_id: '', participation_percentage: '100' }]);
    setFormOpen(false);
    loadLeases();
    fetch('/api/realtor/properties')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setProperties(Array.isArray(data) ? data : []));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-noise-navy text-white py-8">
        <div className="container mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <BackToDashboardLink />
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <FileText className="w-7 h-7 text-gold-400" />
              Contratos de Locação
            </h1>
            <p className="text-navy-100">
              Vincule imóvel, proprietário e inquilino com os termos do aluguel
            </p>
          </div>
          <button
            onClick={() => setFormOpen((v) => !v)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-gold-500 text-navy-950 rounded-lg font-bold hover:bg-gold-400 transition-colors"
          >
            {formOpen ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {formOpen ? 'Cancelar' : 'Novo Contrato'}
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        {(owners.length === 0 || tenants.length === 0) && !loading && (
          <div className="bg-gold-50 border border-gold-300 rounded-lg p-4 mb-6 text-sm text-navy-950">
            Antes de criar um contrato, cadastre pelo menos um{' '}
            <Link href="/admin/owners" className="text-gold-700 font-semibold hover:underline">
              proprietário
            </Link>{' '}
            e um{' '}
            <Link href="/admin/tenants" className="text-gold-700 font-semibold hover:underline">
              inquilino
            </Link>
            .
          </div>
        )}

        {formOpen && (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl shadow-md p-6 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {error && (
              <div className="md:col-span-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="md:col-span-2">
              <label className={labelClass}>Imóvel</label>
              <select
                required
                value={form.property_id}
                onChange={(e) => set('property_id', e.target.value)}
                className={inputClass}
              >
                <option value="">Selecione um imóvel</option>
                {availableProperties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} · {p.code}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between mb-2">
                <label className={labelClass + ' mb-0'}>
                  Proprietário(s) · Total: {ownersPercentageTotal.toFixed(2)}%
                  {Math.abs(ownersPercentageTotal - 100) > 0.01 && (
                    <span className="text-red-600 font-normal"> (deve somar 100%)</span>
                  )}
                </label>
                <button
                  type="button"
                  onClick={addOwnerRow}
                  className="text-xs font-semibold text-gold-700 hover:underline"
                >
                  + Adicionar Proprietário
                </button>
              </div>

              <div className="space-y-3">
                {leaseOwners.map((row, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_auto] gap-2 items-start">
                    <select
                      required
                      value={row.owner_id}
                      onChange={(e) => setOwnerRow(index, 'owner_id', e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Selecione o proprietário</option>
                      {owners.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                    <input
                      required
                      type="number"
                      min="0.01"
                      max="100"
                      step="0.01"
                      placeholder="% Participação"
                      value={row.percentage}
                      onChange={(e) => setOwnerRow(index, 'percentage', e.target.value)}
                      className={inputClass}
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="% Comissão"
                      value={row.commission_rate}
                      onChange={(e) => setOwnerRow(index, 'commission_rate', e.target.value)}
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => removeOwnerRow(index)}
                      disabled={leaseOwners.length === 1}
                      className="px-3 py-2 text-red-600 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Remover proprietário"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Se houver mais de um proprietário, os repasses são divididos automaticamente pelo percentual de cada um.
              </p>
            </div>

            <div className="md:col-span-2 border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between mb-2">
                <label className={labelClass + ' mb-0'}>
                  Inquilino(s) · Total: {tenantsPercentageTotal.toFixed(2)}%
                  {Math.abs(tenantsPercentageTotal - 100) > 0.01 && (
                    <span className="text-red-600 font-normal"> (deve somar 100%)</span>
                  )}
                </label>
                <button
                  type="button"
                  onClick={addTenantRow}
                  className="text-xs font-semibold text-gold-700 hover:underline"
                >
                  + Adicionar Inquilino
                </button>
              </div>

              <div className="space-y-3">
                {leaseTenants.map((row, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_auto] gap-2 items-start">
                    <select
                      required
                      value={row.tenant_id}
                      onChange={(e) => setTenantRow(index, 'tenant_id', e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Selecione o inquilino</option>
                      {tenants.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    <input
                      required
                      type="number"
                      min="0.01"
                      max="100"
                      step="0.01"
                      placeholder="% Participação"
                      value={row.participation_percentage}
                      onChange={(e) => setTenantRow(index, 'participation_percentage', e.target.value)}
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => removeTenantRow(index)}
                      disabled={leaseTenants.length === 1}
                      className="px-3 py-2 text-red-600 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Remover inquilino"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Se houver mais de um inquilino, cada um fica com o percentual de participação registrado no contrato.
              </p>
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Fiador (opcional)</label>
              <select
                value={form.guarantor_id}
                onChange={(e) => set('guarantor_id', e.target.value)}
                className={inputClass}
              >
                <option value="">Sem fiador</option>
                {guarantors.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                    {g.document_number ? ` · ${g.document_number}` : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Gerencie os dados do fiador em{' '}
                <Link href="/admin/guarantors" className="text-gold-700 hover:underline">
                  Fiadores
                </Link>
                .
              </p>
            </div>

            <div>
              <label className={labelClass}>Início do contrato</label>
              <input
                required
                type="date"
                value={form.start_date}
                onChange={(e) => set('start_date', e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Fim do contrato</label>
              <input
                required
                type="date"
                value={form.end_date}
                onChange={(e) => set('end_date', e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Valor do aluguel (mensal)</label>
              <CurrencyInput required value={form.rent_value} onChange={(v) => set('rent_value', v)} />
            </div>

            <div>
              <label className={labelClass}>Dia de vencimento</label>
              <input
                type="number"
                min="1"
                max="31"
                value={form.due_day}
                onChange={(e) => set('due_day', e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Taxa de administração (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={form.admin_fee_percentage}
                onChange={(e) => set('admin_fee_percentage', e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Caução</label>
              <CurrencyInput value={form.deposit_value} onChange={(v) => set('deposit_value', v)} />
            </div>

            <div>
              <label className={labelClass}>Caução — quantidade de meses</label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.deposit_months}
                onChange={(e) => set('deposit_months', e.target.value)}
                placeholder="Ex: 1, 2, 3"
                className={inputClass}
              />
            </div>

            <div className="md:col-span-2 bg-gray-50 rounded-lg p-4 space-y-4">
              <p className="text-sm font-semibold text-navy-950">
                Taxa de administração do primeiro aluguel
              </p>

              <div>
                <label className={labelClass}>Retenção</label>
                <select
                  value={form.first_rent_retention_type}
                  onChange={(e) => set('first_rent_retention_type', e.target.value)}
                  className={inputClass}
                >
                  {Object.entries(RETENTION_TYPE_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {form.first_rent_retention_type !== 'none' && (
                <>
                  {form.first_rent_retention_type === 'custom_percentage' && (
                    <div>
                      <label className={labelClass}>Percentual retido (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={form.first_rent_retention_percentage}
                        onChange={(e) => set('first_rent_retention_percentage', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  )}

                  {form.first_rent_retention_type === 'custom_amount' && (
                    <div>
                      <label className={labelClass}>Valor fixo retido</label>
                      <CurrencyInput
                        value={form.first_rent_retention_fixed_amount}
                        onChange={(v) => set('first_rent_retention_fixed_amount', v)}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {form.first_rent_retention_type !== 'custom_amount' && (
                      <div>
                        <label className={labelClass}>Base de cálculo</label>
                        <select
                          value={form.first_rent_retention_basis}
                          onChange={(e) => set('first_rent_retention_basis', e.target.value)}
                          className={inputClass}
                        >
                          <option value="gross">Valor bruto do aluguel</option>
                          <option value="net">Valor líquido (após taxa de administração)</option>
                        </select>
                      </div>
                    )}

                    <div>
                      <label className={labelClass}>Dividir retenção em quantos meses</label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={form.first_rent_retention_installments}
                        onChange={(e) => set('first_rent_retention_installments', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.first_rent_retention_include_extra_fees === 'true'}
                      onChange={(e) =>
                        set('first_rent_retention_include_extra_fees', e.target.checked ? 'true' : '')
                      }
                    />
                    Incluir água, energia, IPTU, condomínio e seguro do primeiro mês no cálculo
                  </label>

                  <div>
                    <label className={labelClass}>Observação interna (opcional)</label>
                    <textarea
                      value={form.first_rent_retention_notes}
                      onChange={(e) => set('first_rent_retention_notes', e.target.value)}
                      rows={2}
                      className={inputClass}
                      placeholder="Justificativa da retenção, combinado com o proprietário, etc."
                    />
                  </div>

                  {retentionPreview && (
                    <div className="bg-white border border-gold-300 rounded-lg p-4 text-sm space-y-1">
                      <p className="font-semibold text-navy-950 mb-2">
                        Prévia do cálculo (1ª parcela de {retentionPreview.installments})
                      </p>
                      <div className="flex justify-between text-gray-700">
                        <span>Valor do primeiro aluguel</span>
                        <span>R$ {retentionPreview.rentValue.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>Taxa de administração mensal</span>
                        <span>- R$ {retentionPreview.adminFeeAmount.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex justify-between text-red-700 font-semibold">
                        <span>Retido pela SBS Imóveis (nesta parcela)</span>
                        <span>- R$ {retentionPreview.perInstallment.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex justify-between text-green-700 font-bold border-t border-gray-200 pt-1 mt-1">
                        <span>Repasse líquido ao proprietário</span>
                        <span>R$ {retentionPreview.ownerNet.toLocaleString('pt-BR')}</span>
                      </div>
                      {retentionPreview.installments > 1 && (
                        <p className="text-xs text-gray-500 pt-1">
                          Total retido ao longo de {retentionPreview.installments} meses: R${' '}
                          {retentionPreview.retentionAmount.toLocaleString('pt-BR')}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="md:col-span-2 bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-semibold text-navy-950 mb-3">
                Responsável por cada cobrança
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {responsibleFields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      {field.label}
                    </label>
                    <select
                      value={form[field.key]}
                      onChange={(e) => set(field.key, e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                    >
                      {Object.entries(RESPONSIBLE_LABEL).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Observações</label>
              <textarea
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                rows={3}
                className={inputClass}
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gold-500 text-navy-950 rounded-lg font-bold hover:bg-gold-400 transition-colors disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? 'Salvando...' : 'Criar Contrato'}
              </button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Imóvel</th>
                  <th className="px-6 py-3">Proprietário</th>
                  <th className="px-6 py-3">Inquilino</th>
                  <th className="px-6 py-3">Aluguel</th>
                  <th className="px-6 py-3">Vencimento</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Caução</th>
                  <th className="px-6 py-3">Seguro Fiança</th>
                  <th className="px-6 py-3">Retenção 1º Aluguel</th>
                  <th className="px-6 py-3">Assinatura</th>
                  <th className="px-6 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {leases.map((lease) => (
                  <tr key={lease.id} className="border-t border-gray-100">
                    <td className="px-6 py-4">
                      <p className="font-medium text-navy-950">{lease.properties?.title}</p>
                      <p className="text-xs text-gray-500">{lease.properties?.code}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{lease.ownerName}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {lease.tenantName}
                      {lease.guarantorName && (
                        <p className="text-xs text-gray-400">Fiador: {lease.guarantorName}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-navy-950">
                      R$ {Number(lease.rent_value).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-gray-600">Dia {lease.due_day}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLOR[lease.status]}`}
                      >
                        {STATUS_LABEL[lease.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {Number(lease.deposit_value) > 0 ? (
                        <button
                          onClick={() => openDeposit(lease.id)}
                          className="inline-flex items-center gap-1 text-navy-700 hover:text-navy-900 font-semibold text-xs"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>
                            R$ {Number(lease.deposit_value).toLocaleString('pt-BR')}
                            {lease.deposit_months ? ` (${lease.deposit_months}x)` : ''} ·{' '}
                            {DEPOSIT_STATUS_LABEL[lease.deposit_status] ?? lease.deposit_status}
                          </span>
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">Sem caução</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {lease.fiance_insurance_company ? (
                        <button
                          onClick={() => openInsurance(lease)}
                          className="inline-flex items-center gap-1 text-navy-700 hover:text-navy-900 font-semibold text-xs"
                        >
                          <Umbrella className="w-4 h-4" />
                          <span>{lease.fiance_insurance_company}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => openInsurance(lease)}
                          className="text-xs text-gray-400 hover:text-navy-700"
                        >
                          Sem seguro fiança
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600">
                      {lease.first_rent_retention_type !== 'none' ? (
                        <span>
                          {RETENTION_TYPE_LABEL[lease.first_rent_retention_type] ?? lease.first_rent_retention_type}
                          {lease.first_rent_retention_installments > 1 && (
                            <>
                              {' '}
                              ({lease.first_rent_retention_installments_applied}/
                              {lease.first_rent_retention_installments})
                            </>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openSignature(lease)}
                        className="inline-flex items-center gap-1 text-navy-700 hover:text-navy-900 font-semibold text-xs"
                      >
                        <PenLine className="w-4 h-4" />
                        Assinatura Digital
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/amendments?lease=${lease.id}`}
                        className="inline-flex items-center gap-1 text-navy-700 hover:text-navy-900 font-semibold text-xs"
                      >
                        <FileEdit className="w-4 h-4" />
                        Aditivos
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && leases.length === 0 && (
            <div className="p-12 text-center text-gray-600">Nenhum contrato de locação ainda.</div>
          )}
          {loading && <div className="p-12 text-center text-gray-600">Carregando...</div>}
        </div>

        {depositLease && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-navy-950 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-navy-600" />
                    Caução — {depositLease.properties?.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Valor retido: R$ {Number(depositLease.deposit_value).toLocaleString('pt-BR')}
                    {depositLease.deposit_months
                      ? ` (equivalente a ${depositLease.deposit_months} ${depositLease.deposit_months === 1 ? 'mês' : 'meses'} de aluguel)`
                      : ''}
                  </p>
                </div>
                <button onClick={() => setDepositLeaseId(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 ${DEPOSIT_STATUS_COLOR[depositLease.deposit_status] ?? 'bg-gray-100 text-gray-700'}`}
              >
                {DEPOSIT_STATUS_LABEL[depositLease.deposit_status] ?? depositLease.deposit_status}
              </span>

              {depositLease.deposit_status !== 'held' ? (
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-navy-950">
                  Devolução finalizada: R${' '}
                  {Number(depositLease.deposit_returned_amount ?? 0).toLocaleString('pt-BR')}
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Deduções (vistoria de saída)</p>
                    {deductions.length === 0 && (
                      <p className="text-sm text-gray-400">Nenhuma dedução lançada.</p>
                    )}
                    <ul className="space-y-1">
                      {deductions.map((d) => (
                        <li key={d.id} className="flex justify-between text-sm border-b border-gray-100 py-1">
                          <span className="text-gray-700">{d.description}</span>
                          <span className="font-semibold text-navy-950">
                            R$ {Number(d.amount).toLocaleString('pt-BR')}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {deductions.length > 0 && (
                      <p className="text-right text-sm font-bold text-navy-950 mt-2">
                        Total: R$ {deductionsTotal.toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>

                  <form onSubmit={addDeduction} className="flex gap-2 mb-6">
                    <input
                      placeholder="Descrição (ex: pintura, limpeza)"
                      value={deductionForm.description}
                      onChange={(e) => setDeductionForm((f) => ({ ...f, description: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <div className="w-32">
                      <CurrencyInput
                        value={deductionForm.amount}
                        onChange={(v) => setDeductionForm((f) => ({ ...f, amount: v }))}
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-3 py-2 bg-navy-100 text-navy-900 rounded-lg font-semibold text-sm hover:bg-navy-200"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </form>

                  {settleResult ? (
                    <div className="bg-green-50 border border-green-300 rounded-lg p-4 text-sm text-navy-950">
                      Devolução finalizada. Valor devolvido ao inquilino: R${' '}
                      {settleResult.refundAmount.toLocaleString('pt-BR')} (deduções: R${' '}
                      {settleResult.totalDeductions.toLocaleString('pt-BR')})
                    </div>
                  ) : (
                    <button
                      onClick={settleDeposit}
                      disabled={settling}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-navy-950 text-white rounded-lg font-bold hover:bg-navy-900 transition-colors disabled:opacity-50"
                    >
                      {settling && <Loader2 className="w-4 h-4 animate-spin" />}
                      Finalizar devolução da caução
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {insuranceLease && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-navy-950 flex items-center gap-2">
                    <Umbrella className="w-5 h-5 text-navy-600" />
                    Seguro Fiança — {insuranceLease.properties?.title}
                  </h3>
                  <p className="text-sm text-gray-500">Alternativa ou complemento à caução</p>
                </div>
                <button
                  onClick={() => setInsuranceLeaseId(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {insuranceError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                  {insuranceError}
                </div>
              )}

              <form onSubmit={saveInsuranceFields} className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Seguradora</label>
                  <input
                    value={insuranceForm.fiance_insurance_company}
                    onChange={(e) =>
                      setInsuranceForm((f) => ({ ...f, fiance_insurance_company: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nº da apólice</label>
                  <input
                    value={insuranceForm.fiance_insurance_policy_number}
                    onChange={(e) =>
                      setInsuranceForm((f) => ({ ...f, fiance_insurance_policy_number: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Valor</label>
                  <CurrencyInput
                    value={insuranceForm.fiance_insurance_value}
                    onChange={(v) => setInsuranceForm((f) => ({ ...f, fiance_insurance_value: v }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Vigência — início</label>
                  <input
                    type="date"
                    value={insuranceForm.fiance_insurance_start_date}
                    onChange={(e) =>
                      setInsuranceForm((f) => ({ ...f, fiance_insurance_start_date: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Vigência — fim</label>
                  <input
                    type="date"
                    value={insuranceForm.fiance_insurance_end_date}
                    onChange={(e) =>
                      setInsuranceForm((f) => ({ ...f, fiance_insurance_end_date: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={insuranceSaving}
                    className="px-4 py-2 bg-gold-500 text-navy-950 rounded-lg font-bold text-sm hover:bg-gold-400 transition-colors disabled:opacity-50"
                  >
                    {insuranceSaving ? 'Salvando...' : 'Salvar dados do seguro'}
                  </button>
                </div>
              </form>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Arquivo da apólice</p>
                {insuranceFileInfo.fileName ? (
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 mb-2">
                    <span className="text-sm text-navy-950">{insuranceFileInfo.fileName}</span>
                    <div className="flex items-center gap-3">
                      {insuranceFileInfo.downloadUrl && (
                        <a
                          href={insuranceFileInfo.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-navy-900 hover:text-gold-600 font-semibold text-xs"
                        >
                          <Download className="w-3 h-3" />
                          Baixar
                        </a>
                      )}
                      <button
                        onClick={removeInsuranceFile}
                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-semibold text-xs"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remover
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 mb-2">Nenhum arquivo enviado ainda.</p>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => setInsuranceFile(e.target.files?.[0] ?? null)}
                    className="flex-1 text-xs text-gray-600"
                  />
                  <button
                    onClick={uploadInsuranceFile}
                    disabled={!insuranceFile || insuranceUploading}
                    className="inline-flex items-center gap-1 px-3 py-2 bg-navy-900 text-white rounded-lg text-xs font-semibold hover:bg-navy-800 disabled:opacity-50"
                  >
                    {insuranceUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                    Enviar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {signatureLease && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-navy-950 flex items-center gap-2">
                    <PenLine className="w-5 h-5 text-navy-600" />
                    Assinatura Digital — {signatureLease.properties?.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Envio do contrato para assinatura via Autentique (terceirizado)
                  </p>
                </div>
                <button
                  onClick={() => setSignatureLeaseId(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {signatureError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                  {signatureError}
                </div>
              )}

              <div className="border border-gray-200 rounded-lg p-4 mb-6">
                <p className="text-sm font-semibold text-navy-950 mb-3">Nova solicitação de assinatura</p>

                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Arquivo do contrato (PDF)
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setSignatureFile(e.target.files?.[0] ?? null)}
                    className="w-full text-sm text-gray-600"
                  />
                </div>

                <p className="text-xs font-semibold text-gray-600 mb-2">Signatários</p>
                {signerCandidates.length === 0 ? (
                  <p className="text-sm text-gray-400 mb-3">
                    Nenhuma parte com e-mail cadastrado encontrada para este contrato (proprietário,
                    inquilino, fiador ou corretor).
                  </p>
                ) : (
                  <div className="space-y-2 mb-3">
                    {signerCandidates.map((c) => (
                      <label key={c.key} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={!!selectedSigners[c.key]}
                          onChange={(e) =>
                            setSelectedSigners((prev) => ({ ...prev, [c.key]: e.target.checked }))
                          }
                        />
                        <span className="font-medium text-navy-950">{PARTY_ROLE_LABEL[c.party_role]}</span>
                        <span className="text-gray-600">
                          {c.name} · {c.email}
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                <button
                  onClick={submitSignatureRequest}
                  disabled={signatureSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500 text-navy-950 rounded-lg font-bold text-sm hover:bg-gold-400 transition-colors disabled:opacity-50"
                >
                  {signatureSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {signatureSubmitting ? 'Enviando...' : 'Enviar para assinatura'}
                </button>
              </div>

              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-navy-950">Solicitações enviadas</p>
                <button
                  onClick={() => signatureLeaseId && loadSignatureRequests(signatureLeaseId)}
                  disabled={signatureLoading}
                  className="inline-flex items-center gap-1 text-xs text-navy-700 hover:text-navy-900 font-semibold"
                >
                  {signatureLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  Atualizar status
                </button>
              </div>

              {signatureRequests.length === 0 ? (
                <p className="text-sm text-gray-400">Nenhuma solicitação de assinatura enviada ainda.</p>
              ) : (
                <div className="space-y-3">
                  {signatureRequests.map((r) => (
                    <div key={r.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-navy-950">{r.document_name}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            r.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : r.status === 'rejected'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {SIGNATURE_STATUS_LABEL[r.status] ?? r.status}
                        </span>
                      </div>
                      <ul className="space-y-1">
                        {r.signature_request_signers.map((s) => (
                          <li key={s.id} className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">
                              {PARTY_ROLE_LABEL[s.party_role] ?? s.party_role} — {s.name}
                            </span>
                            <span className="flex items-center gap-2">
                              {s.signed_at ? (
                                <span className="text-green-700 font-semibold">Assinado</span>
                              ) : s.rejected_at ? (
                                <span className="text-red-600 font-semibold">Recusado</span>
                              ) : (
                                <span className="text-yellow-700 font-semibold">Pendente</span>
                              )}
                              {!s.signed_at && !s.rejected_at && s.sign_url && (
                                <a
                                  href={s.sign_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-0.5 text-navy-700 hover:text-navy-900"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Link
                                </a>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                      {r.signedDownloadUrl && (
                        <a
                          href={r.signedDownloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-2 text-xs text-navy-900 hover:text-gold-600 font-semibold"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Baixar contrato assinado
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
