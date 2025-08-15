import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import './AnalyticsViewer.css';

const AnalyticsViewer = () => {
  const [localData, setLocalData] = useState({
    events: [],
    sessions: {},
    summary: {
      totalEvents: 0,
      uniqueSessions: 0,
      gamesPlayed: 0,
      premiumClicks: 0,
      hintsUsed: 0
    }
  });

  const [filter, setFilter] = useState({
    eventType: 'all',
    timeRange: '1h',
    category: 'all'
  });

  const [isLive, setIsLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    loadLocalAnalytics();
    
    // Set up live updates every 5 seconds
    const interval = setInterval(() => {
      if (isLive) {
        loadLocalAnalytics();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [filter, isLive]);

  const loadLocalAnalytics = () => {
    try {
      // Get analytics data from window.analytics if available
      const analytics = window.analytics;
      if (!analytics) {
        console.warn('Analytics not available');
        return;
      }

      // Get stored events from localStorage
      const storedEvents = getStoredEvents();
      const filteredEvents = filterEvents(storedEvents);
      
      // Calculate summary statistics
      const summary = calculateSummary(filteredEvents);
      
      // Get session data
      const sessions = getSessionData();

      setLocalData({
        events: filteredEvents,
        sessions: sessions,
        summary: summary
      });

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading local analytics:', error);
    }
  };

  const getStoredEvents = () => {
    // Get events from various localStorage keys
    const events = [];
    
    // Get visit data
    const visitCount = localStorage.getItem('dpp_visit_count') || '0';
    const lastVisit = localStorage.getItem('dpp_last_visit_date');
    const dailyStreak = localStorage.getItem('dpp_daily_streak') || '0';
    
    // Get game data
    const score = localStorage.getItem('dpp_score') || '0';
    const streak = localStorage.getItem('dpp_streak') || '0';
    const gamesPlayed = localStorage.getItem('dpp_games_played') || '0';
    
    // Get premium data
    const premiumStatus = localStorage.getItem('dpp_premium_status');
    
    // Create synthetic events from stored data
    events.push({
      id: 'session_start',
      event: 'Session Started',
      timestamp: new Date().toISOString(),
      data: {
        visit_count: parseInt(visitCount),
        daily_streak: parseInt(dailyStreak),
        last_visit: lastVisit
      }
    });

    if (parseInt(gamesPlayed) > 0) {
      events.push({
        id: 'games_summary',
        event: 'Games Summary',
        timestamp: new Date().toISOString(),
        data: {
          total_games: parseInt(gamesPlayed),
          score: parseInt(score),
          streak: parseInt(streak)
        }
      });
    }

    if (premiumStatus === 'true') {
      events.push({
        id: 'premium_status',
        event: 'Premium User',
        timestamp: new Date().toISOString(),
        data: {
          status: 'active'
        }
      });
    }

    // Add real-time events if analytics is available
    if (window.analytics && window.analytics.getAnalyticsData) {
      const analyticsData = window.analytics.getAnalyticsData();
      if (analyticsData && analyticsData.events) {
        analyticsData.events.forEach((event, index) => {
          events.push({
            id: `analytics_${index}`,
            event: event.name || 'Unknown Event',
            timestamp: new Date(event.properties?.timestamp || Date.now()).toISOString(),
            data: event.properties || {}
          });
        });
      }
    }

    return events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const filterEvents = (events) => {
    let filtered = [...events];

    // Filter by event type
    if (filter.eventType !== 'all') {
      filtered = filtered.filter(event => 
        event.event.toLowerCase().includes(filter.eventType.toLowerCase())
      );
    }

    // Filter by time range
    const now = new Date();
    const timeRanges = {
      '5m': 5 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    };

    if (timeRanges[filter.timeRange]) {
      const cutoff = new Date(now.getTime() - timeRanges[filter.timeRange]);
      filtered = filtered.filter(event => 
        new Date(event.timestamp) >= cutoff
      );
    }

    return filtered;
  };

  const calculateSummary = (events) => {
    const summary = {
      totalEvents: events.length,
      uniqueSessions: new Set(events.map(e => e.data?.session_id).filter(Boolean)).size || 1,
      gamesPlayed: 0,
      premiumClicks: 0,
      hintsUsed: 0,
      categoryCounts: {}
    };

    events.forEach(event => {
      if (event.event.toLowerCase().includes('game')) {
        summary.gamesPlayed++;
      }
      if (event.event.toLowerCase().includes('premium')) {
        summary.premiumClicks++;
      }
      if (event.event.toLowerCase().includes('hint')) {
        summary.hintsUsed++;
      }

      // Count categories
      const category = event.data?.category || 'Unknown';
      summary.categoryCounts[category] = (summary.categoryCounts[category] || 0) + 1;
    });

    return summary;
  };

  const getSessionData = () => {
    return {
      sessionId: window.analytics?.sessionId || 'local_session',
      startTime: new Date().toISOString(),
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      language: navigator.language,
      platform: navigator.platform
    };
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatData = (data) => {
    if (!data || typeof data !== 'object') return 'No data';
    
    return Object.entries(data)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  };

  const exportData = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      filter: filter,
      events: localData.events,
      sessions: localData.sessions,
      summary: localData.summary
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearData = () => {
    if (window.analytics && window.analytics.clearAnalyticsData) {
      window.analytics.clearAnalyticsData();
    }
    
    // Clear relevant localStorage items
    const keys = [
      'dpp_visit_count', 'dpp_last_visit_date', 'dpp_daily_streak',
      'dpp_score', 'dpp_streak', 'dpp_games_played'
    ];
    
    keys.forEach(key => localStorage.removeItem(key));
    
    loadLocalAnalytics();
  };

  return (
    <>
      <Helmet>
        <title>Analytics Viewer - Daily Puzzle Post</title>
        <meta name="description" content="Real-time analytics and performance metrics for Daily Puzzle Post word games platform." />
        <meta name="keywords" content="analytics, real-time, metrics, Daily Puzzle Post, performance, data" />
        <meta name="robots" content="noindex, nofollow" />
        <meta property="og:title" content="Analytics Viewer - Daily Puzzle Post" />
        <meta property="og:description" content="Real-time analytics dashboard for Daily Puzzle Post" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="/analytics" />
      </Helmet>
      
      <div className="analytics-viewer">
      <header className="viewer-header">
        <h1>📊 Real-Time Analytics Viewer</h1>
        <div className="header-controls">
          <div className="live-indicator">
            <span className={`live-dot ${isLive ? 'active' : ''}`}></span>
            <span>Live Updates: {isLive ? 'ON' : 'OFF'}</span>
            <button 
              className="toggle-live"
              onClick={() => setIsLive(!isLive)}
            >
              {isLive ? 'Pause' : 'Resume'}
            </button>
          </div>
          <div className="last-update">
            Last Update: {formatTimestamp(lastUpdate)}
          </div>
        </div>
      </header>

      {/* Filters */}
      <section className="filters">
        <div className="filter-group">
          <label>Event Type:</label>
          <select 
            value={filter.eventType} 
            onChange={(e) => setFilter({...filter, eventType: e.target.value})}
          >
            <option value="all">All Events</option>
            <option value="game">Game Events</option>
            <option value="premium">Premium Events</option>
            <option value="session">Session Events</option>
            <option value="hint">Hint Events</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Time Range:</label>
          <select 
            value={filter.timeRange} 
            onChange={(e) => setFilter({...filter, timeRange: e.target.value})}
          >
            <option value="5m">Last 5 Minutes</option>
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>

        <div className="filter-actions">
          <button onClick={loadLocalAnalytics} className="refresh-btn">
            🔄 Refresh
          </button>
          <button onClick={exportData} className="export-btn">
            📥 Export
          </button>
          <button onClick={clearData} className="clear-btn">
            🗑️ Clear Data
          </button>
        </div>
      </section>

      {/* Summary Cards */}
      <section className="summary-cards">
        <div className="summary-card">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <h3>Total Events</h3>
            <p className="card-value">{localData.summary.totalEvents}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon">👥</div>
          <div className="card-content">
            <h3>Sessions</h3>
            <p className="card-value">{localData.summary.uniqueSessions}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon">🎮</div>
          <div className="card-content">
            <h3>Games</h3>
            <p className="card-value">{localData.summary.gamesPlayed}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon">⭐</div>
          <div className="card-content">
            <h3>Premium Clicks</h3>
            <p className="card-value">{localData.summary.premiumClicks}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon">💡</div>
          <div className="card-content">
            <h3>Hints Used</h3>
            <p className="card-value">{localData.summary.hintsUsed}</p>
          </div>
        </div>
      </section>

      {/* Session Info */}
      <section className="session-info">
        <h2>Current Session</h2>
        <div className="session-details">
          <div className="session-item">
            <strong>Session ID:</strong> {localData.sessions.sessionId}
          </div>
          <div className="session-item">
            <strong>Start Time:</strong> {formatTimestamp(localData.sessions.startTime)}
          </div>
          <div className="session-item">
            <strong>Screen:</strong> {localData.sessions.screenResolution}
          </div>
          <div className="session-item">
            <strong>Viewport:</strong> {localData.sessions.viewportSize}
          </div>
          <div className="session-item">
            <strong>Language:</strong> {localData.sessions.language}
          </div>
          <div className="session-item">
            <strong>Platform:</strong> {localData.sessions.platform}
          </div>
        </div>
      </section>

      {/* Events List */}
      <section className="events-list">
        <h2>Recent Events ({localData.events.length})</h2>
        <div className="events-container">
          {localData.events.length === 0 ? (
            <div className="no-events">
              <p>No events found for the selected filters.</p>
              <p>Try adjusting the time range or event type filters.</p>
            </div>
          ) : (
            localData.events.map((event, index) => (
              <div key={event.id || index} className="event-item">
                <div className="event-header">
                  <span className="event-name">{event.event}</span>
                  <span className="event-time">{formatTimestamp(event.timestamp)}</span>
                </div>
                <div className="event-data">
                  {formatData(event.data)}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Debug Info */}
      <section className="debug-info">
        <details>
          <summary>🔧 Debug Information</summary>
          <div className="debug-content">
            <h4>Analytics Object Available:</h4>
            <p>{window.analytics ? '✅ Yes' : '❌ No'}</p>
            
            <h4>LocalStorage Keys:</h4>
            <ul>
              {Object.keys(localStorage)
                .filter(key => key.startsWith('dpp_'))
                .map(key => (
                  <li key={key}>
                    <strong>{key}:</strong> {localStorage.getItem(key)}
                  </li>
                ))}
            </ul>

            <h4>Current Filter:</h4>
            <pre>{JSON.stringify(filter, null, 2)}</pre>
          </div>
        </details>
      </section>
    </div>
    </>
  );
};

export default AnalyticsViewer;

