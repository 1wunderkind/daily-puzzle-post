import React, { useState, useEffect } from 'react';
import './JSONDataEndpoint.css';

const JSONDataEndpoint = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [format, setFormat] = useState('pretty'); // 'pretty' or 'raw'

  // Collect all analytics data
  const collectAnalyticsData = () => {
    try {
      // Get localStorage data
      const localStorageData = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('dpp_')) {
          localStorageData[key] = localStorage.getItem(key);
        }
      }

      // Get analytics data if available
      const analyticsData = window.analytics ? window.analytics.getAnalyticsData() : {};

      // Get game statistics
      const gameStats = {
        totalGamesPlayed: parseInt(localStorage.getItem('dpp_games_played') || '0'),
        wordsCompleted: parseInt(localStorage.getItem('dpp_words_completed') || '0'),
        currentStreak: parseInt(localStorage.getItem('dpp_current_streak') || '0'),
        bestStreak: parseInt(localStorage.getItem('dpp_best_streak') || '0'),
        hintsUsed: parseInt(localStorage.getItem('dpp_hints_used') || '0'),
        premiumStatus: localStorage.getItem('dpp_premium_status') === 'true',
        lastPlayDate: localStorage.getItem('dpp_last_play_date'),
        favoriteCategory: localStorage.getItem('dpp_favorite_category') || 'animals'
      };

      // Get user engagement data
      const engagementData = {
        visitCount: parseInt(localStorage.getItem('dpp_visit_count') || '0'),
        dailyStreak: parseInt(localStorage.getItem('dpp_daily_streak') || '0'),
        lastVisitDate: localStorage.getItem('dpp_last_visit_date'),
        emailSubscribed: localStorage.getItem('dpp_email_subscribed') === 'true',
        cookieConsent: localStorage.getItem('dpp_cookie_consent'),
        consentDate: localStorage.getItem('dpp_consent_date')
      };

      // Get A/B testing data
      const abTestingData = {
        buttonVariant: localStorage.getItem('dpp_ab_button_variant'),
        variantAssignedDate: localStorage.getItem('dpp_ab_assigned_date'),
        premiumClickCount: parseInt(localStorage.getItem('dpp_premium_clicks') || '0'),
        conversionEvents: JSON.parse(localStorage.getItem('dpp_conversion_events') || '[]')
      };

      // Get performance metrics
      const performanceData = {
        pageLoadTime: performance.timing ? 
          performance.timing.loadEventEnd - performance.timing.navigationStart : null,
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        connectionType: navigator.connection ? navigator.connection.effectiveType : 'unknown',
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      // Compile comprehensive data object
      const compiledData = {
        timestamp: new Date().toISOString(),
        dataVersion: '1.0.0',
        source: 'Daily Puzzle Post Analytics',
        
        // Core sections
        gameStatistics: gameStats,
        userEngagement: engagementData,
        abTesting: abTestingData,
        performance: performanceData,
        
        // Raw data sections
        localStorage: localStorageData,
        analytics: analyticsData,
        
        // Metadata
        metadata: {
          totalDataPoints: Object.keys(localStorageData).length,
          dataCollectionTime: Date.now(),
          browserSupport: {
            localStorage: typeof(Storage) !== 'undefined',
            analytics: typeof(window.analytics) !== 'undefined',
            performance: typeof(performance) !== 'undefined'
          }
        }
      };

      return compiledData;
    } catch (err) {
      throw new Error(`Data collection failed: ${err.message}`);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Simulate API delay for realistic loading state
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const analyticsData = collectAnalyticsData();
        setData(analyticsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const downloadJSON = () => {
    if (!data) return;
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `daily-puzzle-post-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    if (!data) return;
    
    try {
      const jsonString = format === 'pretty' ? 
        JSON.stringify(data, null, 2) : 
        JSON.stringify(data);
      
      await navigator.clipboard.writeText(jsonString);
      alert('JSON data copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      alert('Failed to copy to clipboard. Please use the download option.');
    }
  };

  if (loading) {
    return (
      <div className="json-endpoint loading-state">
        <div className="newspaper-container">
          <header className="newspaper-header">
            <h1 className="masthead">DAILY PUZZLE POST</h1>
            <div className="date-line">API Data Endpoint - Loading...</div>
          </header>
          
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p>Collecting analytics data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="json-endpoint error-state">
        <div className="newspaper-container">
          <header className="newspaper-header">
            <h1 className="masthead">DAILY PUZZLE POST</h1>
            <div className="date-line">API Data Endpoint - Error</div>
          </header>
          
          <div className="error-content">
            <h2>Data Collection Error</h2>
            <p>Failed to collect analytics data: {error}</p>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="json-endpoint">
      <div className="newspaper-container">
        <header className="newspaper-header">
          <h1 className="masthead">DAILY PUZZLE POST</h1>
          <div className="date-line">JSON API Data Endpoint</div>
        </header>
        
        <div className="api-controls">
          <div className="control-group">
            <label>
              <input
                type="radio"
                value="pretty"
                checked={format === 'pretty'}
                onChange={(e) => setFormat(e.target.value)}
              />
              Pretty Format
            </label>
            <label>
              <input
                type="radio"
                value="raw"
                checked={format === 'raw'}
                onChange={(e) => setFormat(e.target.value)}
              />
              Raw Format
            </label>
          </div>
          
          <div className="action-buttons">
            <button onClick={downloadJSON} className="download-btn">
              📥 Download JSON
            </button>
            <button onClick={copyToClipboard} className="copy-btn">
              📋 Copy to Clipboard
            </button>
            <button onClick={() => window.location.reload()} className="refresh-btn">
              🔄 Refresh Data
            </button>
          </div>
        </div>

        <div className="data-summary">
          <h3>Data Summary</h3>
          <div className="summary-stats">
            <div className="stat">
              <strong>Total Games:</strong> {data?.gameStatistics?.totalGamesPlayed || 0}
            </div>
            <div className="stat">
              <strong>Words Completed:</strong> {data?.gameStatistics?.wordsCompleted || 0}
            </div>
            <div className="stat">
              <strong>Visit Count:</strong> {data?.userEngagement?.visitCount || 0}
            </div>
            <div className="stat">
              <strong>Premium Status:</strong> {data?.gameStatistics?.premiumStatus ? 'Active' : 'Free'}
            </div>
            <div className="stat">
              <strong>Data Points:</strong> {data?.metadata?.totalDataPoints || 0}
            </div>
            <div className="stat">
              <strong>Last Updated:</strong> {new Date(data?.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
        
        <div className="json-display">
          <h3>Raw JSON Data</h3>
          <pre className="json-content">
            {format === 'pretty' ? 
              JSON.stringify(data, null, 2) : 
              JSON.stringify(data)
            }
          </pre>
        </div>
        
        <div className="api-documentation">
          <h3>API Documentation</h3>
          <div className="doc-section">
            <h4>Endpoint Information</h4>
            <ul>
              <li><strong>URL:</strong> /api/data</li>
              <li><strong>Method:</strong> GET</li>
              <li><strong>Content-Type:</strong> application/json</li>
              <li><strong>Update Frequency:</strong> Real-time</li>
            </ul>
          </div>
          
          <div className="doc-section">
            <h4>Data Sections</h4>
            <ul>
              <li><strong>gameStatistics:</strong> Game performance and completion data</li>
              <li><strong>userEngagement:</strong> Visit patterns and user behavior</li>
              <li><strong>abTesting:</strong> A/B testing assignments and results</li>
              <li><strong>performance:</strong> Browser and system performance metrics</li>
              <li><strong>localStorage:</strong> Raw browser storage data</li>
              <li><strong>metadata:</strong> Collection timestamp and system info</li>
            </ul>
          </div>
          
          <div className="doc-section">
            <h4>AI Agent Usage</h4>
            <p>This endpoint is optimized for AI agent consumption with:</p>
            <ul>
              <li>Structured JSON format with consistent schema</li>
              <li>Comprehensive metadata for data validation</li>
              <li>Timestamp information for data freshness</li>
              <li>Error handling and status indicators</li>
              <li>Print-friendly CSS for PDF generation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JSONDataEndpoint;

