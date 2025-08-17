import { supabaseAdmin } from '../../../../lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const event = await request.json();
    
    // Validate required fields
    if (!event.eventName || !event.sessionId || !event.timestamp) {
      return NextResponse.json(
        { error: 'Missing required event fields: eventName, sessionId, timestamp' },
        { status: 400 }
      );
    }

    // Prepare event data for database
    const eventData = {
      event_type: event.eventType || 'unknown',
      event_name: event.eventName,
      session_id: event.sessionId,
      user_id: event.userId || null,
      timestamp: event.timestamp,
      metadata: event.metadata || {},
      user_agent: event.userAgent || null,
      url: event.url || null,
      referrer: event.referrer || null
    };

    // Store event in analytics_events table
    const { data: eventResult, error: eventError } = await supabaseAdmin
      .from('analytics_events')
      .insert(eventData)
      .select('id')
      .single();

    if (eventError) {
      console.error('Error storing analytics event:', eventError);
      return NextResponse.json(
        { error: 'Failed to store analytics event' },
        { status: 500 }
      );
    }

    // Update session activity
    const { error: sessionError } = await supabaseAdmin
      .rpc('update_session_activity', { p_session_id: event.sessionId });

    if (sessionError) {
      console.warn('Warning: Failed to update session activity:', sessionError);
      // Don't fail the request for session update errors
    }

    return NextResponse.json({ 
      success: true, 
      eventId: eventResult.id 
    });

  } catch (error) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}