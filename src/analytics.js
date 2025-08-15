// Analytics Tracking Utility for Daily Puzzle Post
// Supports Google Analytics 4 (gtag) and custom event tracking

class AnalyticsTracker {
  constructor() {
    this.isEnabled = true
    this.sessionId = this.generateSessionId()
    this.userId = this.getUserId()
    this.gameSession = {
      startTime: null,
      currentWord: null,
      hintsUsed: 0,
      wrongGuesses: 0
    }
    
    // Initialize tracking on page load
    this.trackPageView()
  }

  // Generate unique session ID
  generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // Get or create user ID (stored in localStorage)
  getUserId() {
    let userId = localStorage.getItem('dpp_user_id')
    if (!userId) {
      userId = 'user_' + Date.now().toString(36) + Math.random().toString(36).substr(2)
      localStorage.setItem('dpp_user_id', userId)
    }
    return userId
  }

  // Check if user has premium status
  isPremiumUser() {
    return localStorage.getItem('dpp_premium_status') === 'active'
  }

  // Generic event tracking function
  trackEvent(eventName, eventData = {}) {
    if (!this.isEnabled) return

    const eventPayload = {
      event_name: eventName,
      session_id: this.sessionId,
      user_id: this.userId,
      timestamp: new Date().toISOString(),
      is_premium: this.isPremiumUser(),
      ...eventData
    }

    // Send to Google Analytics if available
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, {
        event_category: eventData.category || 'game',
        event_label: eventData.label || '',
        value: eventData.value || 0,
        custom_parameters: eventPayload
      })
    }

    // Send to custom analytics endpoint (if implemented)
    this.sendToCustomAnalytics(eventPayload)

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Event:', eventPayload)
    }
  }

  // Send to custom analytics endpoint
  async sendToCustomAnalytics(eventPayload) {
    try {
      // Replace with your actual analytics endpoint
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventPayload)
      })
      
      if (!response.ok) {
        console.warn('Analytics tracking failed:', response.statusText)
      }
    } catch (error) {
      // Fail silently - don't break user experience
      console.warn('Analytics tracking error:', error)
    }
  }

  // Page view tracking
  trackPageView() {
    this.trackEvent('page_view', {
      category: 'navigation',
      page_title: document.title,
      page_location: window.location.href,
      user_agent: navigator.userAgent,
      screen_resolution: `${screen.width}x${screen.height}`,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`
    })
  }

  // Game Events
  trackGameStart(category, word) {
    this.gameSession = {
      startTime: Date.now(),
      currentWord: word,
      hintsUsed: 0,
      wrongGuesses: 0,
      category: category
    }

    this.trackEvent('game_start', {
      category: 'game',
      label: category,
      word_length: word.length,
      game_type: 'hangman'
    })
  }

  trackGameComplete(status, timeElapsed, score, streak) {
    const gameData = {
      category: 'game',
      label: status, // 'won' or 'lost'
      value: score,
      time_elapsed: timeElapsed,
      word: this.gameSession.currentWord,
      word_length: this.gameSession.currentWord?.length || 0,
      hints_used: this.gameSession.hintsUsed,
      wrong_guesses: this.gameSession.wrongGuesses,
      streak: streak,
      game_type: 'hangman'
    }

    this.trackEvent('game_complete', gameData)

    // Track specific win/loss events
    if (status === 'won') {
      this.trackEvent('game_won', gameData)
    } else {
      this.trackEvent('game_lost', gameData)
    }
  }

  trackLetterGuess(letter, isCorrect, wrongGuessCount) {
    if (!isCorrect) {
      this.gameSession.wrongGuesses = wrongGuessCount
    }

    this.trackEvent('letter_guess', {
      category: 'game',
      label: letter,
      is_correct: isCorrect,
      wrong_guess_count: wrongGuessCount
    })
  }

  trackHintUsage(revealedLetter) {
    this.gameSession.hintsUsed += 1

    this.trackEvent('hint_used', {
      category: 'game',
      label: revealedLetter,
      hints_used_total: this.gameSession.hintsUsed,
      word: this.gameSession.currentWord
    })
  }

  trackCategoryChange(newCategory, previousCategory) {
    this.trackEvent('category_change', {
      category: 'game',
      label: newCategory,
      previous_category: previousCategory
    })
  }

  // Monetization Events
  trackAdImpression(adUnit, adSize) {
    this.trackEvent('ad_impression', {
      category: 'monetization',
      label: adUnit,
      ad_size: adSize,
      ad_unit: adUnit
    })
  }

  trackAdClick(adUnit) {
    this.trackEvent('ad_click', {
      category: 'monetization',
      label: adUnit,
      value: 1
    })
  }

  trackPremiumButtonClick(location) {
    this.trackEvent('premium_button_click', {
      category: 'monetization',
      label: location, // 'header', 'modal', 'between_games'
      value: 4.99
    })
  }

  trackPremiumModalOpen(trigger) {
    this.trackEvent('premium_modal_open', {
      category: 'monetization',
      label: trigger // 'header_button', 'after_games', 'between_games'
    })
  }

  trackPremiumModalClose(method) {
    this.trackEvent('premium_modal_close', {
      category: 'monetization',
      label: method // 'close_button', 'overlay_click', 'escape_key'
    })
  }

  trackPremiumPurchaseAttempt(paymentMethod) {
    this.trackEvent('premium_purchase_attempt', {
      category: 'monetization',
      label: paymentMethod, // 'stripe', 'paypal'
      value: 4.99
    })
  }

  trackPremiumPurchaseSuccess(paymentMethod, transactionId) {
    this.trackEvent('premium_purchase_success', {
      category: 'monetization',
      label: paymentMethod,
      value: 4.99,
      transaction_id: transactionId
    })

    // Track conversion
    if (typeof gtag !== 'undefined') {
      gtag('event', 'purchase', {
        transaction_id: transactionId,
        value: 4.99,
        currency: 'USD',
        items: [{
          item_id: 'premium_upgrade',
          item_name: 'Daily Puzzle Post Premium',
          category: 'digital_product',
          quantity: 1,
          price: 4.99
        }]
      })
    }
  }

  trackPremiumPurchaseFailure(paymentMethod, errorReason) {
    this.trackEvent('premium_purchase_failure', {
      category: 'monetization',
      label: paymentMethod,
      error_reason: errorReason
    })
  }

  // User Engagement Events
  trackTimeSpent(timeSpent) {
    this.trackEvent('time_spent', {
      category: 'engagement',
      value: Math.round(timeSpent / 1000), // Convert to seconds
      label: 'session_time'
    })
  }

  trackReturnVisit(daysSinceLastVisit) {
    this.trackEvent('return_visit', {
      category: 'engagement',
      value: daysSinceLastVisit,
      label: 'days_since_last_visit'
    })
  }

  // Performance Events
  trackPageLoadTime(loadTime) {
    this.trackEvent('page_load_time', {
      category: 'performance',
      value: loadTime,
      label: 'milliseconds'
    })
  }

  trackError(errorType, errorMessage) {
    this.trackEvent('error', {
      category: 'error',
      label: errorType,
      error_message: errorMessage
    })
  }

  // Utility Methods
  startSession() {
    const lastVisit = localStorage.getItem('dpp_last_visit')
    const now = Date.now()
    
    if (lastVisit) {
      const daysSince = Math.floor((now - parseInt(lastVisit)) / (1000 * 60 * 60 * 24))
      if (daysSince > 0) {
        this.trackReturnVisit(daysSince)
      }
    }
    
    localStorage.setItem('dpp_last_visit', now.toString())
  }

  endSession() {
    const sessionStart = localStorage.getItem('dpp_session_start')
    if (sessionStart) {
      const timeSpent = Date.now() - parseInt(sessionStart)
      this.trackTimeSpent(timeSpent)
    }
  }

  // Enable/disable tracking (for privacy compliance)
  setTrackingEnabled(enabled) {
    this.isEnabled = enabled
    localStorage.setItem('dpp_analytics_enabled', enabled.toString())
  }

  isTrackingEnabled() {
    const stored = localStorage.getItem('dpp_analytics_enabled')
    return stored !== 'false' // Default to enabled
  }
}

// Create global analytics instance
const analytics = new AnalyticsTracker()

// Track page load performance
window.addEventListener('load', () => {
  const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart
  analytics.trackPageLoadTime(loadTime)
})

// Track session start
analytics.startSession()

// Track session end on page unload
window.addEventListener('beforeunload', () => {
  analytics.endSession()
})

// Export for use in components
export default analytics

// Also make available globally for debugging
window.analytics = analytics

