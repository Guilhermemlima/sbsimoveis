'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Upload, X, Star, Loader2 } from 'lucide-react';
import type { Property, PropertyImage, PropertyType, PropertyPurpose, PropertyStatus } from '@/types';

interface RealtorOption {
  id: string;
  name: string;
}

interface PropertyFormProps {
  propertyId?: string;
  initialData?: Property;
  initialImages?: PropertyImage[];
  canAssignRealtor?: boolean;
  realtorOptions?: RealtorOption[];
}

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold-500 transition-colors';
const labelClass = 'block text-sm font-semibold text-gray-700 mb-2';

export default function PropertyForm({
  propertyId,
  initialData,
  initialImages = [],
  canAssignRealtor = false,
  realtorOptions = [],
}: PropertyFormProps) {
  const router = useRouter();
  const isEdit = !!propertyId;

  const [form, setForm] = useState({
    title: initialData?.title ?? '',
    code: initialData?.code ?? '',
    type: (initialData?.type ?? 'apartment') as PropertyType,
    purpose: (initialData?.purpose ?? 'sale') as PropertyPurpose,
    value: initialData?.value?.toString() ?? '',
    address: initialData?.address ?? '',
    city: initialData?.city ?? 'São Paulo',
    neighborhood: initialData?.neighborhood ?? '',
    total_area: initialData?.total_area?.toString() ?? '',
    built_area: initialData?.built_area?.toString() ?? '',
    bedrooms: initialData?.bedrooms?.toString() ?? '0',
    bathrooms: initialData?.bathrooms?.toString() ?? '0',
    parking_spaces: initialData?.parking_spaces?.toString() ?? '0',
    description: initialData?.description ?? '',
    amenities: (initialData?.amenities ?? []).join(', '),
    status: (initialData?.status ?? 'available') as PropertyStatus,
    is_opportunity: initialData?.is_opportunity ?? false,
    is_featured: initialData?.is_featured ?? false,
    is_exclusive: initialData?.is_exclusive ?? false,
    realtor_id: initialData?.realtor_id ?? realtorOptions[0]?.id ?? '',
  });

  const [images, setImages] = useState<PropertyImage[]>(initialImages);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setPendingFiles((prev) => [...prev, ...files]);
    e.target.value = '';
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = async (imageId: string) => {
    if (!propertyId) return;
    setImages((prev) => prev.filter((img) => img.id !== imageId));
    await fetch(`/api/realtor/properties/${propertyId}/images/${imageId}`, { method: 'DELETE' });
  };

  const uploadFilesFor = async (id: string, files: File[]) => {
    for (const file of files) {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch(`/api/realtor/properties/${id}/images`, { method: 'POST', body });
      if (res.ok) {
        const img = await res.json();
        setImages((prev) => [...prev, img]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const payload: Record<string, unknown> = {
      title: form.title,
      code: form.code,
      type: form.type,
      purpose: form.purpose,
      value: Number(form.value),
      address: form.address,
      city: form.city,
      neighborhood: form.neighborhood,
      total_area: Number(form.total_area),
      built_area: Number(form.built_area),
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
      parking_spaces: Number(form.parking_spaces),
      description: form.description,
      amenities: form.amenities
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean),
      status: form.status,
      is_opportunity: form.is_opportunity,
      is_featured: form.is_featured,
      is_exclusive: form.is_exclusive,
    };

    if (canAssignRealtor && form.realtor_id) {
      payload.realtor_id = form.realtor_id;
    }

    const url = isEdit ? `/api/realtor/properties/${propertyId}` : '/api/realtor/properties';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Não foi possível salvar o imóvel.');
      setSubmitting(false);
      return;
    }

    const saved = await res.json();

    if (pendingFiles.length > 0) {
      await uploadFilesFor(saved.id, pendingFiles);
    }

    setSubmitting(false);
    router.push('/realtor/properties');
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Fotos */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-bold text-navy-950 mb-4">Fotos do imóvel</h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
          {images.map((img) => (
            <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
              <Image src={img.image_url} alt="" fill className="object-cover" unoptimized />
              {img.is_main && (
                <span className="absolute top-2 left-2 bg-gold-500 text-navy-950 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3" /> Capa
                </span>
              )}
              <button
                type="button"
                onClick={() => removeExistingImage(img.id)}
                className="absolute top-2 right-2 bg-white/90 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                aria-label="Remover foto"
              >
                <X className="w-4 h-4 text-red-600" />
              </button>
            </div>
          ))}

          {pendingFiles.map((file, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-dashed border-gold-400 bg-gold-50">
              <Image
                src={URL.createObjectURL(file)}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
              <span className="absolute bottom-1 left-1 right-1 bg-navy-950/80 text-white text-[10px] px-1.5 py-0.5 rounded text-center">
                Nova foto
              </span>
              <button
                type="button"
                onClick={() => removePendingFile(index)}
                className="absolute top-2 right-2 bg-white/90 rounded-full p-1 hover:bg-red-50"
                aria-label="Remover foto"
              >
                <X className="w-4 h-4 text-red-600" />
              </button>
            </div>
          ))}

          <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-gold-500 hover:bg-gold-50/50 transition-colors text-gray-500">
            <Upload className="w-6 h-6" />
            <span className="text-xs font-semibold text-center px-2">Adicionar Fotos</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </div>
        <p className="text-xs text-gray-500">
          JPG, PNG ou WebP, até 8MB cada. A primeira foto enviada vira a capa do anúncio.
        </p>
      </div>

      {/* Dados principais */}
      <div className="bg-white rounded-xl shadow-md p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <h2 className="md:col-span-2 text-lg font-bold text-navy-950">Dados do imóvel</h2>

        <div>
          <label className={labelClass}>Título</label>
          <input
            required
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            className={inputClass}
            placeholder="Ex: Apartamento Moderno em Pinheiros"
          />
        </div>

        <div>
          <label className={labelClass}>Código</label>
          <input
            required
            value={form.code}
            onChange={(e) => set('code', e.target.value)}
            className={inputClass}
            placeholder="Ex: APT-010"
          />
        </div>

        <div>
          <label className={labelClass}>Tipo</label>
          <select value={form.type} onChange={(e) => set('type', e.target.value as PropertyType)} className={inputClass}>
            <option value="apartment">Apartamento</option>
            <option value="house">Casa</option>
            <option value="commercial">Comercial</option>
            <option value="land">Terreno</option>
            <option value="garage">Garagem</option>
            <option value="farm">Fazenda</option>
            <option value="other">Outro</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Finalidade</label>
          <select
            value={form.purpose}
            onChange={(e) => set('purpose', e.target.value as PropertyPurpose)}
            className={inputClass}
          >
            <option value="sale">Venda</option>
            <option value="rent">Aluguel</option>
            <option value="temporary">Temporada</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>
            {form.purpose === 'rent' ? 'Valor do aluguel (mensal)' : 'Valor'}
          </label>
          <input
            required
            type="number"
            min="1"
            value={form.value}
            onChange={(e) => set('value', e.target.value)}
            className={inputClass}
            placeholder="R$"
          />
        </div>

        <div>
          <label className={labelClass}>Status</label>
          <select
            value={form.status}
            onChange={(e) => set('status', e.target.value as PropertyStatus)}
            className={inputClass}
          >
            <option value="available">Disponível</option>
            <option value="reserved">Reservado</option>
            <option value="sold">Vendido</option>
            <option value="rented">Alugado</option>
            <option value="archived">Arquivado</option>
          </select>
        </div>

        {canAssignRealtor && realtorOptions.length > 0 && (
          <div className="md:col-span-2">
            <label className={labelClass}>Corretor responsável</label>
            <select
              value={form.realtor_id}
              onChange={(e) => set('realtor_id', e.target.value)}
              className={inputClass}
            >
              {realtorOptions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Localização */}
      <div className="bg-white rounded-xl shadow-md p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <h2 className="md:col-span-2 text-lg font-bold text-navy-950">Localização</h2>

        <div className="md:col-span-2">
          <label className={labelClass}>Endereço</label>
          <input
            required
            value={form.address}
            onChange={(e) => set('address', e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Cidade</label>
          <input required value={form.city} onChange={(e) => set('city', e.target.value)} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Bairro</label>
          <input
            required
            value={form.neighborhood}
            onChange={(e) => set('neighborhood', e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Características */}
      <div className="bg-white rounded-xl shadow-md p-6 grid grid-cols-2 md:grid-cols-5 gap-4">
        <h2 className="col-span-2 md:col-span-5 text-lg font-bold text-navy-950">Características</h2>

        <div>
          <label className={labelClass}>Área total (m²)</label>
          <input
            required
            type="number"
            min="1"
            value={form.total_area}
            onChange={(e) => set('total_area', e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Área construída (m²)</label>
          <input
            required
            type="number"
            min="0"
            value={form.built_area}
            onChange={(e) => set('built_area', e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Quartos</label>
          <input
            type="number"
            min="0"
            value={form.bedrooms}
            onChange={(e) => set('bedrooms', e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Banheiros</label>
          <input
            type="number"
            min="0"
            value={form.bathrooms}
            onChange={(e) => set('bathrooms', e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Vagas</label>
          <input
            type="number"
            min="0"
            value={form.parking_spaces}
            onChange={(e) => set('parking_spaces', e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="col-span-2 md:col-span-5">
          <label className={labelClass}>Comodidades (separadas por vírgula)</label>
          <input
            value={form.amenities}
            onChange={(e) => set('amenities', e.target.value)}
            className={inputClass}
            placeholder="Piscina, Academia, Churrasqueira"
          />
        </div>

        <div className="col-span-2 md:col-span-5">
          <label className={labelClass}>Descrição</label>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={4}
            className={inputClass}
          />
        </div>
      </div>

      {/* Destaques */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-bold text-navy-950 mb-4">Destaques no site</h2>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.is_opportunity}
              onChange={(e) => set('is_opportunity', e.target.checked)}
            />
            Marcar como Oportunidade
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => set('is_featured', e.target.checked)}
            />
            Destacar na página inicial
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.is_exclusive}
              onChange={(e) => set('is_exclusive', e.target.checked)}
            />
            Marcar como Exclusivo
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.push('/realtor/properties')}
          className="px-6 py-3 rounded-lg font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gold-500 text-navy-950 rounded-lg font-bold hover:bg-gold-400 transition-colors disabled:opacity-50"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Cadastrar Imóvel'}
        </button>
      </div>
    </form>
  );
}
