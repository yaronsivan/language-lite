'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

export default function AnalyticsPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [timeframe, setTimeframe] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      fetchDashboardData();
    }
  }, [timeframe, isAuthorized, fetchDashboardData]);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/';
        return;
      }
      
      // Authorization - only allow specific admin email
      const authorizedEmails = ['yaron@ulpan.co.il'];
      if (authorizedEmails.includes(user.email)) {
        setIsAuthorized(true);
      } else {
        setError('Unauthorized access. Contact admin for access.');
      }
    } catch (err) {
      setError('Authentication failed');
    }
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/dashboard?timeframe=${timeframe}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </main>
    );
  }

  if (!isAuthorized) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h1>
          <p className="text-gray-600">You don&apos;t have permission to view analytics.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <img 
                src="/language-lite-icon-transparent.png" 
                alt="Language Lite" 
                className="w-8 h-8"
              />
              <h1 className="text-2xl font-bold text-gray-900">Language Lite Analytics</h1>
            </div>
            <div className="flex items-center gap-4">
              <select 
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1d">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
              <button
                onClick={() => window.location.href = '/app'}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Back to App
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading analytics data...</span>
          </div>
        ) : dashboardData ? (
          <div className="space-y-8">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Total Events</h3>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.overview.totalEvents}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Unique Sessions</h3>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.overview.uniqueSessions}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Conversion Rate</h3>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.overview.conversionRate.toFixed(1)}%</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Upgrade Interest</h3>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.metrics.upgradeButtonClicks}</p>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">User Journey Metrics</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Signup Funnel</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Page Views</span>
                        <span className="font-medium">{dashboardData.metrics.signupPageViews}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Button Clicks</span>
                        <span className="font-medium">{dashboardData.metrics.signupButtonClicks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Completed Signups</span>
                        <span className="font-medium">{dashboardData.metrics.successfulSignups}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Feature Usage</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Text Adaptations</span>
                        <span className="font-medium">{dashboardData.metrics.textAdaptations}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Share Usage</span>
                        <span className="font-medium">{dashboardData.metrics.shareUsage}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Menu Interactions</span>
                        <span className="font-medium">{dashboardData.metrics.menuClicks}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Monetization</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Upgrade Page Visits</span>
                        <span className="font-medium">{dashboardData.metrics.upgradePageVisits}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Upgrade Clicks</span>
                        <span className="font-medium">{dashboardData.metrics.upgradeButtonClicks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Menu Button Clicks</span>
                        <span className="font-medium">{dashboardData.metrics.menuButtonClicks}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Conversion Funnel */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Conversion Funnel</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {dashboardData.funnel.map((stage, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <span className="font-medium text-gray-900">{stage.stage}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-bold text-gray-900">{stage.count}</span>
                        <span className="text-sm text-gray-500">({stage.percentage.toFixed(1)}%)</span>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${stage.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Menu Button Breakdown */}
            {dashboardData.menuButtonBreakdown && Object.keys(dashboardData.menuButtonBreakdown).length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Menu Button Clicks</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(dashboardData.menuButtonBreakdown).map(([button, count]) => (
                      <div key={button} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-900">
                          {button.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <span className="text-lg font-bold text-blue-600">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Event Breakdown */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">All Events</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(dashboardData.eventBreakdown).map(([event, count]) => (
                    <div key={event} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-900">
                        {event.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <span className="text-lg font-bold text-gray-600">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No analytics data available</p>
          </div>
        )}
      </div>
    </main>
  );
}