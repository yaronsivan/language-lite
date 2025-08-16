# Database Setup

## Referrals Table Migration

To add the referrals table to your Supabase database, run the following SQL in your Supabase SQL Editor:

```sql
-- Create referrals table for tracking referral system
CREATE TABLE IF NOT EXISTS referrals (
    id SERIAL PRIMARY KEY,
    referrer_email VARCHAR(255) NOT NULL,
    referral_code VARCHAR(50) UNIQUE NOT NULL,
    referred_email VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_email);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- Add RLS (Row Level Security) policies
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own referrals
CREATE POLICY "Users can view own referrals" ON referrals
    FOR SELECT USING (referrer_email = auth.jwt()->>'email');

-- Policy: Users can create referrals for themselves
CREATE POLICY "Users can create own referrals" ON referrals
    FOR INSERT WITH CHECK (referrer_email = auth.jwt()->>'email');

-- Policy: Allow service role to update any referral (for claiming)
CREATE POLICY "Service can update referrals" ON referrals
    FOR UPDATE USING (true);
```

## Table Structure

The `referrals` table includes:
- `id`: Primary key
- `referrer_email`: Email of the user who created the referral
- `referral_code`: Unique code for tracking
- `referred_email`: Email of the user who signed up (populated when claimed)
- `status`: 'pending', 'completed', or 'expired'
- `created_at`: When the referral was created
- `completed_at`: When the referral was claimed

## Security

Row Level Security (RLS) is enabled to ensure users can only access their own referral data.