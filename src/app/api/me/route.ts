import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }
  return NextResponse.json({ id: user.id, name: user.name, role: user.role, permissions: user.permissions });
}
