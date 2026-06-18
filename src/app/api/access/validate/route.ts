import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const REGULAR_CODE = process.env.ACCESS_CODE || '52625';
const ADMIN_CODE = process.env.ADMIN_ACCESS_CODE || '010411';

const COOKIE_NAME = 'surcal_access';
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function POST(req: Request) {
  try {
    const { code } = await req.json();
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Code required' }, { status: 400 });
    }

    const trimmed = code.trim();
    const isAdmin = trimmed === ADMIN_CODE;
    const isRegular = trimmed === REGULAR_CODE;

    if (!isAdmin && !isRegular) {
      return NextResponse.json({ error: 'Invalid access code' }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, isAdmin ? 'admin' : 'ok', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: ONE_YEAR,
      path: '/',
    });

    return NextResponse.json({ success: true, mode: isAdmin ? 'admin' : 'regular' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Validation failed' }, { status: 500 });
  }
}
