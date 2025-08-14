import { supabase } from '../../../lib/supabase';

export async function GET() {
  try {
    await supabase.rpc('refresh_daily_credits');
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}