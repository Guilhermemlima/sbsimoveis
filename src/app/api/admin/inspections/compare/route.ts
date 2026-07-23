import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canAccessInspections } from '@/lib/auth/permissions';
import { createServiceRoleClient } from '@/lib/supabase';

const isAuthorized = canAccessInspections;

const RATING_RANK: Record<string, number | null> = {
  damaged: 0,
  bad: 1,
  regular: 2,
  good: 3,
  excellent: 4,
  new: 5,
  not_applicable: null,
};

async function loadInspectionItems(supabase: ReturnType<typeof createServiceRoleClient>, inspectionId: string) {
  const { data: environments } = await supabase
    .from('inspection_environments')
    .select('id, name')
    .eq('inspection_id', inspectionId);

  const envIds = (environments ?? []).map((e) => e.id);
  const envNameById = new Map((environments ?? []).map((e) => [e.id, e.name]));

  const { data: items } = envIds.length
    ? await supabase.from('inspection_items').select('*').in('environment_id', envIds)
    : { data: [] };

  const byKey = new Map<string, { rating: string; comments: string | null; damage_during_lease: boolean; pre_existing_damage: boolean }>();
  for (const item of items ?? []) {
    const envName = envNameById.get(item.environment_id) ?? '';
    byKey.set(`${envName}::${item.item_type}`, item);
  }
  return byKey;
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!isAuthorized(user)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const idA = searchParams.get('a');
  const idB = searchParams.get('b');

  if (!idA || !idB) {
    return NextResponse.json({ error: 'Informe as duas vistorias a comparar.' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data: inspections } = await supabase
    .from('inspections')
    .select('id, type, performed_date, property_id, properties(title, code)')
    .in('id', [idA, idB]);

  const inspectionA = inspections?.find((i) => i.id === idA);
  const inspectionB = inspections?.find((i) => i.id === idB);

  if (!inspectionA || !inspectionB) {
    return NextResponse.json({ error: 'Vistoria não encontrada.' }, { status: 404 });
  }
  if (inspectionA.property_id !== inspectionB.property_id) {
    return NextResponse.json({ error: 'As vistorias precisam ser do mesmo imóvel.' }, { status: 400 });
  }

  const itemsA = await loadInspectionItems(supabase, idA);
  const itemsB = await loadInspectionItems(supabase, idB);

  const allKeys = new Set([...itemsA.keys(), ...itemsB.keys()]);

  const results = [...allKeys].map((key) => {
    const [environment, itemType] = key.split('::');
    const before = itemsA.get(key);
    const after = itemsB.get(key);

    const rankBefore = before ? RATING_RANK[before.rating] : null;
    const rankAfter = after ? RATING_RANK[after.rating] : null;

    let category: string;
    if (rankBefore === null || rankAfter === null) {
      category = 'not_applicable';
    } else if (after?.damage_during_lease) {
      category = 'may_charge_tenant';
    } else if (rankAfter === rankBefore) {
      category = 'same';
    } else if (rankAfter > rankBefore) {
      category = 'improved';
    } else if (rankBefore - rankAfter === 1) {
      category = 'natural_wear';
    } else {
      category = 'damaged';
    }

    if (after && (after.rating === 'bad' || after.rating === 'damaged') && category !== 'may_charge_tenant') {
      category = 'needs_maintenance';
    }

    return {
      environment,
      itemType,
      before: before ? { rating: before.rating, comments: before.comments } : null,
      after: after ? { rating: after.rating, comments: after.comments } : null,
      category,
    };
  });

  return NextResponse.json({
    inspectionA,
    inspectionB,
    results,
  });
}
