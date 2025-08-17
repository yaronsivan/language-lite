import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Store codes in memory (in production, use Redis or database)
const extensionCodes = new Map();

// Generate a short code (6 characters)
function generateShortCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Clean up expired codes
function cleanupExpiredCodes() {
  const now = Date.now();
  for (const [code, data] of extensionCodes.entries()) {
    if (now > data.exp) {
      extensionCodes.delete(code);
    }
  }
}

export async function POST(request) {
  try {
    const { action, code } = await request.json();
    
    if (action === 'generate') {
      // Generate a new code
      const authHeader = request.headers.get('authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'No token provided' }, { status: 401 });
      }
      
      const token = authHeader.substring(7);
      
      // Verify the token with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
      
      // Get user's mother tongue
      const { data: userData } = await supabase
        .from('users')
        .select('language')
        .eq('email', user.email)
        .single();
      
      // Generate short code
      let shortCode;
      do {
        shortCode = generateShortCode();
      } while (extensionCodes.has(shortCode));
      
      // Store code with token and metadata
      const codeData = {
        token: token,
        motherTongue: userData?.language || 'English',
        email: user.email,
        exp: Date.now() + (15 * 60 * 1000) // 15 minutes expiry
      };
      
      extensionCodes.set(shortCode, codeData);
      
      console.log('Generated extension code:', {
        code: shortCode,
        email: user.email,
        tokenLength: token?.length,
        expiresAt: new Date(codeData.exp).toISOString()
      });
      
      // Clean up old codes
      cleanupExpiredCodes();
      
      return NextResponse.json({ 
        code: shortCode,
        expiresIn: 15 // minutes
      });
      
    } else if (action === 'validate') {
      // Validate and exchange code for token
      if (!code) {
        return NextResponse.json({ error: 'No code provided' }, { status: 400 });
      }
      
      console.log('Validating code:', code.toUpperCase());
      console.log('Available codes:', Array.from(extensionCodes.keys()));
      
      const codeData = extensionCodes.get(code.toUpperCase());
      
      if (!codeData) {
        console.log('Code not found:', code);
        return NextResponse.json({ error: 'Invalid or expired code' }, { status: 404 });
      }
      
      if (Date.now() > codeData.exp) {
        console.log('Code expired:', code, 'Exp:', new Date(codeData.exp));
        extensionCodes.delete(code);
        return NextResponse.json({ error: 'Code has expired' }, { status: 410 });
      }
      
      console.log('Code validated successfully:', { 
        code, 
        email: codeData.email,
        tokenLength: codeData.token?.length 
      });
      
      // Delete code after use (one-time use)
      extensionCodes.delete(code.toUpperCase());
      
      return NextResponse.json({
        token: codeData.token,
        motherTongue: codeData.motherTongue,
        email: codeData.email
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error) {
    console.error('Extension code API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}