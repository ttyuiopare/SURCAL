import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Check Supabase Connectivity
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ status: 'unhealthy', error: 'Missing defined environmental variables' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { error } = await supabase.from('profiles').select('id').limit(1);

    if (error) {
      return NextResponse.json({ status: 'unhealthy', database: 'disconnected', error: error.message }, { status: 503 });
    }

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ status: 'unhealthy', error: error.message }, { status: 500 });
  }
}
