import type { Property, PropertyPurpose, PropertyType } from '@/types';

const TYPES: PropertyType[] = ['house', 'apartment', 'commercial'];
const NEIGHBORHOODS = ['Pinheiros', 'Vila Mariana', 'Mooca'];

// Aluguéis usam valores mensais bem menores que venda; alterna determinística
// para evitar mismatch de hidratação (nada de Math.random() em módulo top-level).
function purposeForIndex(i: number): PropertyPurpose {
  return (['sale', 'rent', 'sale', 'sale', 'rent'] as const)[i % 5];
}

export function generateMockProperties(
  count = 12,
  realtorId = 'realtor1'
): Property[] {
  return Array.from({ length: count }, (_, i) => {
    const purpose = purposeForIndex(i);
    const type = TYPES[i % TYPES.length];
    const saleValue = 500000 + i * 100000;
    const rentValue = 1800 + (i % 6) * 650;

    return {
      id: `prop-${realtorId}-${i}`,
      realtor_id: realtorId,
      title: `Imóvel ${i + 1} - ${type === 'house' ? 'Casa' : type === 'apartment' ? 'Apartamento' : 'Comercial'}`,
      code: `PROP-${String(i).padStart(3, '0')}`,
      type,
      purpose,
      value: purpose === 'rent' ? rentValue : saleValue,
      address: `Rua ${i}, 123`,
      city: 'São Paulo',
      neighborhood: NEIGHBORHOODS[i % NEIGHBORHOODS.length],
      latitude: -23.5 - i * 0.01,
      longitude: -46.6 - i * 0.01,
      total_area: 100 + i * 10,
      built_area: 80 + i * 8,
      bedrooms: 2 + (i % 3),
      bathrooms: 1 + (i % 2),
      parking_spaces: i % 3,
      description: `Descrição do imóvel ${i + 1}`,
      amenities: i % 2 === 0 ? ['Piscina'] : ['Academia'],
      status: 'available',
      is_opportunity: i % 2 === 0,
      is_featured: i < 3,
      is_exclusive: i < 2,
      views_count: (i * 37 + 50) % 500,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } satisfies Property;
  });
}

export const mockProperties = generateMockProperties(12);
