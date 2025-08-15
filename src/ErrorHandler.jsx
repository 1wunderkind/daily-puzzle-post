import React, { Component, useEffect, useState, useCallback } from 'react';
import { gameStateCache, analyticsCache } from './CacheManager';

// Error Boundary Component
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      errorId: Math.random().toString(36).substr(2, 9)
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    this.setState({
      error,
      errorInfo
    });

    // Report error to analytics
    this.reportError(error, errorInfo);
    
    // Store error for offline reporting
    this.storeErrorOffline(error, errorInfo);
  }

  reportError = (error, errorInfo) => {
    // Send to Google Analytics
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: true,
        error_boundary: true,
        component_stack: errorInfo.componentStack,
        event_category: 'error'
      });
    }

    // Send to custom error tracking
    if (window.errorTracker) {
      window.errorTracker.captureException(error, {
        extra: errorInfo,
        tags: {
          component: 'ErrorBoundary',
          errorId: this.state.errorId
        }
      });
    }
  };

  storeErrorOffline = (error, errorInfo) => {
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        errorId: this.state.errorId
      };

      analyticsCache.queueEvent({
        type: 'error_boundary',
        data: errorData
      });
    } catch (e) {
      console.error('Failed to store error offline:', e);
    }
  };

  handleRetry = () => {
    // Clear error state and retry
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });

    // Track retry attempt
    if (window.gtag) {
      window.gtag('event', 'error_retry', {
        event_category: 'error_recovery',
        error_id: this.state.errorId
      });
    }
  };

  handleReload = () => {
    // Track reload attempt
    if (window.gtag) {
      window.gtag('event', 'error_reload', {
        event_category: 'error_recovery',
        error_id: this.state.errorId
      });
    }

    // Reload the page
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container">
          <div className="error-boundary-content">
            <div className="error-icon">⚠️</div>
            <h2>Oops! Something went wrong</h2>
            <p>
              We're sorry, but something unexpected happened. 
              Don't worry - your game progress has been saved.
            </p>
            
            <div className="error-actions">
              <button 
                className="error-button primary"
                onClick={this.handleRetry}
              >
                Try Again
              </button>
              <button 
                className="error-button secondary"
                onClick={this.handleReload}
              >
                Reload Page
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <details className="error-details">
                <summary>Error Details (Development)</summary>
                <pre>{this.state.error && this.state.error.toString()}</pre>
                <pre>{this.state.errorInfo.componentStack}</pre>
              </details>
            )}

            <div className="error-help">
              <p>If this problem persists:</p>
              <ul>
                <li>Try refreshing your browser</li>
                <li>Clear your browser cache</li>
                <li>Check your internet connection</li>
                <li>Contact support with error ID: {this.state.errorId}</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Network Error Handler
export const NetworkErrorHandler = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [networkError, setNetworkError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setNetworkError(null);
      setRetryCount(0);
      
      // Sync offline data when back online
      syncOfflineData();
      
      if (window.gtag) {
        window.gtag('event', 'network_restored', {
          event_category: 'network',
          offline_duration: Date.now() - (window.offlineStartTime || Date.now())
        });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      window.offlineStartTime = Date.now();
      
      if (window.gtag) {
        window.gtag('event', 'network_lost', {
          event_category: 'network'
        });
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Monitor fetch failures
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        if (!response.ok) {
          handleFetchError(response, args[0]);
        }
        
        return response;
      } catch (error) {
        handleFetchError(error, args[0]);
        throw error;
      }
    };

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.fetch = originalFetch;
    };
  }, []);

  const handleFetchError = (error, url) => {
    const errorData = {
      type: 'network_error',
      url: url,
      message: error.message || `HTTP ${error.status}`,
      timestamp: Date.now(),
      retryCount
    };

    setNetworkError(errorData);
    
    // Store for offline reporting
    analyticsCache.queueEvent(errorData);
    
    // Auto-retry with exponential backoff
    if (retryCount < 3) {
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        // Trigger retry logic here
      }, Math.pow(2, retryCount) * 1000);
    }
  };

  const syncOfflineData = async () => {
    try {
      // Sync queued analytics events
      const queuedEvents = analyticsCache.getQueuedEvents();
      
      if (queuedEvents.length > 0) {
        await fetch('/api/analytics/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events: queuedEvents })
        });
        
        analyticsCache.clearQueuedEvents();
      }

      // Sync game state
      const gameTypes = ['hangman', 'crossword', 'sudoku'];
      for (const gameType of gameTypes) {
        const gameState = gameStateCache.loadGameState(gameType);
        if (gameState && gameState.needsSync) {
          await fetch(`/api/games/${gameType}/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(gameState)
          });
          
          // Mark as synced
          gameState.needsSync = false;
          gameStateCache.saveGameState(gameType, gameState);
        }
      }
    } catch (error) {
      console.warn('Failed to sync offline data:', error);
    }
  };

  if (!isOnline) {
    return (
      <div className="network-error-banner">
        <div className="network-error-content">
          <span className="network-error-icon">📡</span>
          <span className="network-error-text">
            You're offline. Your progress is being saved locally.
          </span>
          <button 
            className="network-retry-button"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return null;
};

// Game State Recovery
export const useGameStateRecovery = (gameType) => {
  const [recoveredState, setRecoveredState] = useState(null);
  const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(false);

  useEffect(() => {
    // Check for recoverable game state
    const savedState = gameStateCache.loadGameState(gameType);
    
    if (savedState && savedState.inProgress) {
      setRecoveredState(savedState);
      setShowRecoveryPrompt(true);
    }
  }, [gameType]);

  const acceptRecovery = useCallback(() => {
    setShowRecoveryPrompt(false);
    
    if (window.gtag) {
      window.gtag('event', 'game_state_recovered', {
        event_category: 'game_recovery',
        game_type: gameType
      });
    }
    
    return recoveredState;
  }, [recoveredState, gameType]);

  const rejectRecovery = useCallback(() => {
    setShowRecoveryPrompt(false);
    setRecoveredState(null);
    
    // Clear the saved state
    gameStateCache.remove(`${gameType}_state`);
    
    if (window.gtag) {
      window.gtag('event', 'game_state_rejected', {
        event_category: 'game_recovery',
        game_type: gameType
      });
    }
  }, [gameType]);

  return {
    showRecoveryPrompt,
    recoveredState,
    acceptRecovery,
    rejectRecovery
  };
};

// Performance Error Monitor
export const usePerformanceErrorMonitor = () => {
  useEffect(() => {
    // Monitor unhandled promise rejections
    const handleUnhandledRejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      if (window.gtag) {
        window.gtag('event', 'exception', {
          description: `Unhandled Promise: ${event.reason}`,
          fatal: false,
          event_category: 'error'
        });
      }
      
      // Store for offline reporting
      analyticsCache.queueEvent({
        type: 'unhandled_rejection',
        reason: event.reason?.toString(),
        timestamp: Date.now()
      });
    };

    // Monitor JavaScript errors
    const handleError = (event) => {
      console.error('JavaScript error:', event.error);
      
      if (window.gtag) {
        window.gtag('event', 'exception', {
          description: event.error?.message || 'Unknown error',
          fatal: false,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          event_category: 'error'
        });
      }
      
      // Store for offline reporting
      analyticsCache.queueEvent({
        type: 'javascript_error',
        message: event.error?.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: Date.now()
      });
    };

    // Monitor resource loading errors
    const handleResourceError = (event) => {
      const target = event.target;
      const resourceType = target.tagName?.toLowerCase();
      const resourceUrl = target.src || target.href;
      
      console.error('Resource loading error:', resourceType, resourceUrl);
      
      if (window.gtag) {
        window.gtag('event', 'resource_error', {
          event_category: 'error',
          resource_type: resourceType,
          resource_url: resourceUrl
        });
      }
      
      // Store for offline reporting
      analyticsCache.queueEvent({
        type: 'resource_error',
        resourceType,
        resourceUrl,
        timestamp: Date.now()
      });
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);
    window.addEventListener('error', handleResourceError, true);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
      window.removeEventListener('error', handleResourceError, true);
    };
  }, []);
};

// Graceful Degradation Component
export const GracefulDegradation = ({ children, fallback, feature }) => {
  const [isSupported, setIsSupported] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Check feature support
    const checkSupport = () => {
      switch (feature) {
        case 'localStorage':
          return typeof Storage !== 'undefined';
        case 'serviceWorker':
          return 'serviceWorker' in navigator;
        case 'webWorker':
          return typeof Worker !== 'undefined';
        case 'intersectionObserver':
          return 'IntersectionObserver' in window;
        case 'performanceObserver':
          return 'PerformanceObserver' in window;
        default:
          return true;
      }
    };

    setIsSupported(checkSupport());
  }, [feature]);

  if (!isSupported || hasError) {
    return fallback || (
      <div className="feature-not-supported">
        <p>This feature is not supported in your browser.</p>
        <p>Please update your browser for the best experience.</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
};

// Auto-save functionality
export const useAutoSave = (gameType, gameState, interval = 30000) => {
  useEffect(() => {
    if (!gameState) return;

    const saveInterval = setInterval(() => {
      try {
        gameStateCache.saveGameState(gameType, {
          ...gameState,
          lastSaved: Date.now(),
          inProgress: true
        });
      } catch (error) {
        console.warn('Auto-save failed:', error);
      }
    }, interval);

    return () => clearInterval(saveInterval);
  }, [gameType, gameState, interval]);
};

// Recovery Prompt Component
export const RecoveryPrompt = ({ 
  show, 
  gameType, 
  onAccept, 
  onReject,
  recoveredState 
}) => {
  if (!show) return null;

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="recovery-prompt-overlay">
      <div className="recovery-prompt-modal">
        <div className="recovery-prompt-header">
          <h3>Game Progress Found</h3>
        </div>
        
        <div className="recovery-prompt-content">
          <p>
            We found a saved {gameType} game from {formatTime(recoveredState?.lastSaved)}.
            Would you like to continue where you left off?
          </p>
          
          {recoveredState?.progress && (
            <div className="recovery-progress">
              <p>Progress: {recoveredState.progress}</p>
            </div>
          )}
        </div>
        
        <div className="recovery-prompt-actions">
          <button 
            className="recovery-button primary"
            onClick={onAccept}
          >
            Continue Game
          </button>
          <button 
            className="recovery-button secondary"
            onClick={onReject}
          >
            Start New Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorBoundary;

