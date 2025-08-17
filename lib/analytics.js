// Analytics utility with Supabase integration
class AnalyticsManager {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.isInitialized = false;
    this.eventQueue = [];
    this.userId = null;
  }

  generateSessionId() {
    // Check if we already have a session ID in sessionStorage
    if (typeof window !== 'undefined') {
      const existingSessionId = sessionStorage.getItem('analytics_session_id');
      if (existingSessionId) {
        return existingSessionId;
      }
    }
    
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    
    return sessionId;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Get current user if available
      if (typeof window !== 'undefined') {
        const { supabase } = await import('./supabase');
        const { data: { user } } = await supabase.auth.getUser();
        this.userId = user?.id || null;
      }
      
      // Process any queued events
      if (this.eventQueue.length > 0) {
        for (const event of this.eventQueue) {
          await this.sendEvent(event);
        }
        this.eventQueue = [];
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.warn('Analytics initialization failed:', error);
    }
  }

  async track(eventName, metadata = {}) {
    const event = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventType: this.inferEventType(eventName),
      eventName,
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: new Date().toISOString(),
      metadata,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      url: typeof window !== 'undefined' ? window.location.href : '',
      referrer: typeof document !== 'undefined' ? document.referrer : ''
    };

    if (!this.isInitialized) {
      this.eventQueue.push(event);
      return;
    }

    await this.sendEvent(event);
  }

  inferEventType(eventName) {
    if (eventName.includes('page_view') || eventName.includes('visit')) return 'page_view';
    if (eventName.includes('click') || eventName.includes('button')) return 'click';
    if (eventName.includes('signup') || eventName.includes('conversion') || eventName.includes('upgrade')) return 'conversion';
    return 'feature_usage';
  }

  async sendEvent(event) {
    try {
      const response = await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        throw new Error(`Analytics API error: ${response.status}`);
      }
    } catch (error) {
      console.warn('Failed to send analytics event:', error);
      // Re-queue the event for retry if needed
      if (this.eventQueue.length < 100) {
        this.eventQueue.push(event);
      }
    }
  }

  // Specific tracking methods for your use cases
  trackPageView(page, metadata = {}) {
    return this.track('page_view', { page, ...metadata });
  }

  trackSignupPageView(metadata = {}) {
    return this.track('signup_page_view', { page: 'signup', ...metadata });
  }

  trackSignupButtonClick(buttonType, metadata = {}) {
    return this.track('signup_button_click', { 
      element: `signup_button_${buttonType}`, 
      buttonType,
      ...metadata 
    });
  }

  trackSignupComplete(method, metadata = {}) {
    return this.track('signup_complete', { 
      conversion_type: 'signup',
      method, 
      ...metadata 
    });
  }

  trackTextAdaptation(metadata = {}) {
    return this.track('text_adaptation_used', { 
      feature: 'text_adaptation',
      ...metadata 
    });
  }

  trackShareForCredits(metadata = {}) {
    return this.track('share_for_credits', { 
      feature: 'share_credits',
      ...metadata 
    });
  }

  trackMenuClick(metadata = {}) {
    return this.track('menu_click', { 
      element: 'menu',
      ...metadata 
    });
  }

  trackMenuButtonClick(buttonName, metadata = {}) {
    return this.track('menu_button_click', { 
      element: `menu_button_${buttonName}`,
      buttonName,
      ...metadata 
    });
  }

  trackUpgradePageVisit(source, metadata = {}) {
    return this.track('upgrade_page_visit', { 
      page: 'upgrade',
      source,
      ...metadata 
    });
  }

  trackUpgradeButtonClick(metadata = {}) {
    return this.track('upgrade_button_click', { 
      element: 'upgrade_button',
      conversion_type: 'upgrade_intent',
      ...metadata 
    });
  }
}

// Singleton instance
const analytics = new AnalyticsManager();

// Auto-initialize on client-side
if (typeof window !== 'undefined') {
  // Delay initialization to avoid blocking main thread
  setTimeout(() => analytics.initialize(), 100);
  
  // Track page views automatically
  const trackCurrentPage = () => {
    const page = window.location.pathname;
    analytics.trackPageView(page, {
      search: window.location.search,
      hash: window.location.hash
    });
  };
  
  // Track initial page load
  if (document.readyState === 'complete') {
    trackCurrentPage();
  } else {
    window.addEventListener('load', trackCurrentPage);
  }
  
  // Track page changes (for SPA navigation)
  let lastPath = window.location.pathname;
  const observer = new MutationObserver(() => {
    const currentPath = window.location.pathname;
    if (currentPath !== lastPath) {
      lastPath = currentPath;
      trackCurrentPage();
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

export default analytics;