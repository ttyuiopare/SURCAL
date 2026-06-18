import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

async function getCount(): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from('waitlist')
    .select('*', { count: 'exact', head: true });
  return count ?? 0;
}

export async function GET() {
  try {
    const count = await getCount();
    return NextResponse.json({ count });
  } catch (err: any) {
    return NextResponse.json({ count: 0, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from('waitlist')
      .insert({ email: email.trim().toLowerCase() });

    // Treat duplicate email as success — the user is already on the list.
    if (error && !/duplicate|unique/i.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const count = await getCount();
    return NextResponse.json({ success: true, count });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Failed' }, { status: 500 });
  }
}
