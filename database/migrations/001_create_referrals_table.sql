-- Create referrals table for tracking referral system
CREATE TABLE IF NOT EXISTS referrals (
    id SERIAL PRIMARY KEY,
    referrer_email VARCHAR(255) NOT NULL,
    referral_code VARCHAR(50) UNIQUE NOT NULL,
    referred_email VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    FOREIGN KEY (referrer_email) REFERENCES auth.users(email) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_email);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- Add RLS (Row Level Security) policies
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own referrals
CREATE POLICY "Users can view own referrals" ON referrals
    FOR SELECT USING (referrer_email = auth.email());

-- Policy: Users can create referrals for themselves
CREATE POLICY "Users can create own referrals" ON referrals
    FOR INSERT WITH CHECK (referrer_email = auth.email());

-- Policy: System can update any referral (for claiming)
CREATE POLICY "System can update referrals" ON referrals
    FOR UPDATE USING (true);