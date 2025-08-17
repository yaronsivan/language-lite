import { supabaseAdmin } from '../../../../lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '7d';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Calculate date range
    let dateFilter = '';
    if (startDate && endDate) {
      dateFilter = `AND timestamp >= '${startDate}' AND timestamp <= '${endDate}'`;
    } else {
      // Default timeframe logic
      const days = timeframe === '1d' ? 1 : timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 7;
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - days);
      dateFilter = `AND timestamp >= '${pastDate.toISOString()}'`;
    }

    // Get total events and unique sessions
    const { data: overviewData, error: overviewError } = await supabaseAdmin
      .from('analytics_events')
      .select('id, session_id')
      .gte('timestamp', startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (overviewError) {
      console.error('Error fetching overview data:', overviewError);
      // Return demo data if tables don't exist yet
      const demoData = {
        overview: {
          totalEvents: 0,
          uniqueSessions: 0,
          conversionRate: 0,
          topPages: [{ page: '/', count: 0 }]
        },
        metrics: {
          signupPageViews: 0,
          signupButtonClicks: 0,
          successfulSignups: 0,
          textAdaptations: 0,
          shareUsage: 0,
          menuClicks: 0,
          menuButtonClicks: 0,
          upgradePageVisits: 0,
          upgradeButtonClicks: 0
        },
        funnel: [
          { stage: 'Page Views', count: 0, percentage: 100 },
          { stage: 'Signup Clicks', count: 0, percentage: 0 },
          { stage: 'Successful Signups', count: 0, percentage: 0 },
          { stage: 'Text Adaptations', count: 0, percentage: 0 },
          { stage: 'Upgrade Intent', count: 0, percentage: 0 }
        ],
        eventBreakdown: {},
        menuButtonBreakdown: {},
        timeframe: {
          startDate: startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: endDate || new Date().toISOString()
        }
      };
      return NextResponse.json(demoData);
    }

    const totalEvents = overviewData.length;
    const uniqueSessions = new Set(overviewData.map(e => e.session_id)).size;

    // Get event breakdown
    const { data: eventBreakdown, error: breakdownError } = await supabaseAdmin
      .from('analytics_events')
      .select('event_name')
      .gte('timestamp', startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (breakdownError) {
      console.error('Error fetching event breakdown:', breakdownError);
    }

    // Process event counts
    const eventCounts = {};
    eventBreakdown?.forEach(event => {
      eventCounts[event.event_name] = (eventCounts[event.event_name] || 0) + 1;
    });

    // Get specific metrics you requested
    const metrics = {
      signupPageViews: eventCounts['signup_page_view'] || eventCounts['page_view'] || 0,
      signupButtonClicks: eventCounts['signup_button_click'] || 0,
      successfulSignups: eventCounts['signup_complete'] || 0,
      textAdaptations: eventCounts['text_adaptation_used'] || 0,
      shareUsage: eventCounts['share_for_credits'] || 0,
      menuClicks: eventCounts['menu_click'] || 0,
      menuButtonClicks: Object.keys(eventCounts)
        .filter(key => key.includes('menu_button_click'))
        .reduce((sum, key) => sum + eventCounts[key], 0),
      upgradePageVisits: eventCounts['upgrade_page_visit'] || 0,
      upgradeButtonClicks: eventCounts['upgrade_button_click'] || 0
    };

    // Calculate conversion funnel
    const funnel = [
      { 
        stage: 'Page Views', 
        count: metrics.signupPageViews, 
        percentage: 100 
      },
      { 
        stage: 'Signup Clicks', 
        count: metrics.signupButtonClicks, 
        percentage: metrics.signupPageViews ? (metrics.signupButtonClicks / metrics.signupPageViews * 100) : 0 
      },
      { 
        stage: 'Successful Signups', 
        count: metrics.successfulSignups, 
        percentage: metrics.signupPageViews ? (metrics.successfulSignups / metrics.signupPageViews * 100) : 0 
      },
      { 
        stage: 'Text Adaptations', 
        count: metrics.textAdaptations, 
        percentage: metrics.successfulSignups ? (metrics.textAdaptations / metrics.successfulSignups * 100) : 0 
      },
      { 
        stage: 'Upgrade Intent', 
        count: metrics.upgradeButtonClicks, 
        percentage: metrics.textAdaptations ? (metrics.upgradeButtonClicks / metrics.textAdaptations * 100) : 0 
      }
    ];

    // Get top pages
    const { data: pageViews, error: pageError } = await supabaseAdmin
      .from('analytics_events')
      .select('metadata')
      .eq('event_type', 'page_view')
      .gte('timestamp', startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const pageBreakdown = {};
    pageViews?.forEach(view => {
      const page = view.metadata?.page || 'unknown';
      pageBreakdown[page] = (pageBreakdown[page] || 0) + 1;
    });

    const topPages = Object.entries(pageBreakdown)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([page, count]) => ({ page, count }));

    // Get menu button breakdown
    const menuButtonBreakdown = {};
    eventBreakdown?.forEach(event => {
      if (event.event_name.includes('menu_button_click')) {
        const buttonName = event.event_name.replace('menu_button_click_', '');
        menuButtonBreakdown[buttonName] = (menuButtonBreakdown[buttonName] || 0) + 1;
      }
    });

    const dashboardData = {
      overview: {
        totalEvents,
        uniqueSessions,
        conversionRate: metrics.signupPageViews ? (metrics.successfulSignups / metrics.signupPageViews * 100) : 0,
        topPages
      },
      metrics,
      funnel,
      eventBreakdown: eventCounts,
      menuButtonBreakdown,
      timeframe: {
        startDate: startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: endDate || new Date().toISOString()
      }
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Dashboard data error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}