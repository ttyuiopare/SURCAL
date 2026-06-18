import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const c = (await cookies()).get('surcal_access');
  return NextResponse.json({
    granted: !!c,
    isAdmin: c?.value === 'admin',
  });
}
