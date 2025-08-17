-- Analytics Events Table
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    event_name VARCHAR(100) NOT NULL,
    session_id VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    user_agent TEXT,
    url TEXT,
    referrer TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_metadata ON analytics_events USING GIN(metadata);

-- User Sessions Table for session tracking
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    page_views INTEGER DEFAULT 0,
    events_count INTEGER DEFAULT 0,
    user_agent TEXT,
    referrer TEXT,
    landing_page TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for session lookup
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_start_time ON user_sessions(start_time DESC);

-- RLS Policies (optional - you can adjust based on your needs)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Policy to allow analytics collection from any session
CREATE POLICY "Allow analytics collection" ON analytics_events
    FOR INSERT 
    WITH CHECK (true);

-- Policy to allow reading analytics for authenticated users (for dashboard)
CREATE POLICY "Allow analytics reading for authenticated users" ON analytics_events
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Similar policies for user_sessions
CREATE POLICY "Allow session tracking" ON user_sessions
    FOR ALL 
    WITH CHECK (true);

-- Function to update session activity
CREATE OR REPLACE FUNCTION update_session_activity(p_session_id VARCHAR(100))
RETURNS VOID AS $$
BEGIN
    UPDATE user_sessions 
    SET 
        last_activity = NOW(),
        events_count = events_count + 1
    WHERE session_id = p_session_id;
    
    -- Create session if it doesn't exist
    IF NOT FOUND THEN
        INSERT INTO user_sessions (session_id, events_count)
        VALUES (p_session_id, 1)
        ON CONFLICT (session_id) DO UPDATE SET
            last_activity = NOW(),
            events_count = user_sessions.events_count + 1;
    END IF;
END;
$$ LANGUAGE plpgsql;