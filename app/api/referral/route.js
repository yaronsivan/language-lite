import { supabase, supabaseAdmin } from '../../../lib/supabase';

export async function POST(request) {
  try {
    // Check if admin client is available
    if (!supabaseAdmin) {
      console.error('Supabase admin client not configured. Missing SUPABASE_SERVICE_ROLE_KEY');
      return Response.json({ error: 'Referral service not configured' }, { status: 500 });
    }

    const { referrerEmail, action } = await request.json();

    if (action === 'generate') {
      // Generate a unique referral code
      const referralCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // Store referral record using admin client to bypass RLS
      const { data, error } = await supabaseAdmin
        .from('referrals')
        .insert([{
          referrer_email: referrerEmail,
          referral_code: referralCode,
          status: 'pending',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating referral:', error);
        return Response.json({ error: 'Failed to create referral' }, { status: 500 });
      }

      // Use environment-appropriate base URL
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://language-lite.com' 
        : 'http://localhost:3000';
      
      return Response.json({ 
        referralCode,
        shareLink: `${baseUrl}?ref=${referralCode}`
      });
    }

    if (action === 'claim') {
      const { referralCode, newUserEmail } = await request.json();

      // Find the referral record
      const { data: referralData, error: referralError } = await supabaseAdmin
        .from('referrals')
        .select('*')
        .eq('referral_code', referralCode)
        .eq('status', 'pending')
        .single();

      if (referralError || !referralData) {
        return Response.json({ error: 'Invalid or expired referral code' }, { status: 400 });
      }

      // Update referral status
      await supabaseAdmin
        .from('referrals')
        .update({ 
          status: 'completed',
          referred_email: newUserEmail,
          completed_at: new Date().toISOString()
        })
        .eq('referral_code', referralCode);

      // Add 20 credits to the referrer
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('credits')
        .eq('email', referralData.referrer_email)
        .single();

      if (userData) {
        await supabaseAdmin
          .from('users')
          .update({ credits: userData.credits + 20 })
          .eq('email', referralData.referrer_email);
      }

      return Response.json({ success: true, creditsAdded: 20 });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error in referral API:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}