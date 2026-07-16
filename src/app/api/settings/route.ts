import { NextResponse } from 'next/server';
import { getAppSettings } from '@/lib/settings';

export async function GET() {
  const settings = await getAppSettings();
  return NextResponse.json(settings);
}
