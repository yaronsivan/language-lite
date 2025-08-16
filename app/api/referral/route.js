import { supabase } from '../../../lib/supabase';

export async function POST(request) {
  try {
    const { referrerEmail, action } = await request.json();

    if (action === 'generate') {
      // Generate a unique referral code
      const referralCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // Store referral record
      const { data, error } = await supabase
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

      return Response.json({ 
        referralCode,
        shareLink: `https://language-lite.com?ref=${referralCode}`
      });
    }

    if (action === 'claim') {
      const { referralCode, newUserEmail } = await request.json();

      // Find the referral record
      const { data: referralData, error: referralError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referral_code', referralCode)
        .eq('status', 'pending')
        .single();

      if (referralError || !referralData) {
        return Response.json({ error: 'Invalid or expired referral code' }, { status: 400 });
      }

      // Update referral status
      await supabase
        .from('referrals')
        .update({ 
          status: 'completed',
          referred_email: newUserEmail,
          completed_at: new Date().toISOString()
        })
        .eq('referral_code', referralCode);

      // Add 20 credits to the referrer
      const { data: userData } = await supabase
        .from('users')
        .select('credits')
        .eq('email', referralData.referrer_email)
        .single();

      if (userData) {
        await supabase
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