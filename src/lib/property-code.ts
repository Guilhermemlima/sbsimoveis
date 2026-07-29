import type { PropertyType } from '@/types';

export const PROPERTY_CODE_PREFIX: Record<PropertyType, string> = {
  house: 'CS',
  apartment: 'AP',
  land: 'TR',
  commercial: 'CM',
  garage: 'GA',
  farm: 'CH',
  other: 'IM',
};

export function propertyCodePrefix(type: PropertyType): string {
  return PROPERTY_CODE_PREFIX[type] ?? 'IM';
}
