import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  // Public launch: the private-beta gate is OFF by default. Everyone gets
  // straight to the login/signup form — no beta code, no waitlist.
  //
  // To re-enable the private beta later, set BETA_MODE=true in the Vercel
  // environment variables (then redeploy). While on, visitors need a valid
  // access code (see /api/access/validate) to reach the signup form.
  if (process.env.BETA_MODE !== 'true') {
    return NextResponse.json({ granted: true, isAdmin: false });
  }

  const c = (await cookies()).get('surcal_access');
  return NextResponse.json({
    granted: !!c,
    isAdmin: c?.value === 'admin',
  });
}
