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
    
    // Initialize Google Analytics 4
    this.initializeGA4()
    
    // Initialize tracking on page load
    this.trackPageView()
  }

  // Initialize Google Analytics 4
  initializeGA4() {
    // Check if GA4 is already loaded
    if (typeof gtag !== 'undefined') {
      console.log('📊 Google Analytics 4 already loaded')
      return
    }

    // Load GA4 script
    const GA4_MEASUREMENT_ID = 'G-XXXXXXXXXX' // Replace with actual measurement ID
    
    // Create gtag script
    const gtagScript = document.createElement('script')
    gtagScript.async = true
    gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`
    document.head.appendChild(gtagScript)

    // Initialize gtag
    window.dataLayer = window.dataLayer || []
    function gtag(){dataLayer.push(arguments)}
    window.gtag = gtag
    
    gtag('js', new Date())
    gtag('config', GA4_MEASUREMENT_ID, {
      // Enhanced measurement settings
      send_page_view: true,
      allow_google_signals: true,
      allow_ad_personalization_signals: true,
      
      // Custom parameters
      custom_map: {
        'custom_parameter_1': 'game_category',
        'custom_parameter_2': 'premium_status'
      },
      
      // User properties
      user_properties: {
        'user_type': this.isPremiumUser() ? 'premium' : 'free',
        'session_id': this.sessionId
      }
    })

    console.log('📊 Google Analytics 4 initialized with ID:', GA4_MEASUREMENT_ID)
  }

  // Send events to Google Analytics 4
  sendGA4Event(eventName, parameters = {}) {
    if (typeof gtag !== 'undefined') {
      // Enhanced parameters for GA4
      const enhancedParams = {
        ...parameters,
        session_id: this.sessionId,
        user_id: this.userId,
        timestamp_micros: Date.now() * 1000,
        engagement_time_msec: this.getEngagementTime(),
        
        // Custom dimensions
        custom_parameter_1: parameters.game_category || 'unknown',
        custom_parameter_2: this.isPremiumUser() ? 'premium' : 'free'
      }

      gtag('event', eventName, enhancedParams)
      console.log('📊 GA4 Event sent:', eventName, enhancedParams)
    } else {
      console.warn('📊 GA4 not available, event not sent:', eventName)
    }
  }

  // Enhanced conversion tracking for GA4
  trackGA4Conversion(conversionName, value = 0, currency = 'USD') {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'conversion', {
        send_to: `G-XXXXXXXXXX/${conversionName}`, // Replace with actual conversion ID
        value: value,
        currency: currency,
        transaction_id: this.generateTransactionId()
      })

      // Also send as purchase event for e-commerce tracking
      if (conversionName === 'premium_purchase') {
        gtag('event', 'purchase', {
          transaction_id: this.generateTransactionId(),
          value: value,
          currency: currency,
          items: [{
            item_id: 'premium_upgrade',
            item_name: 'Daily Puzzle Post Premium',
            category: 'digital_product',
            quantity: 1,
            price: value
          }]
        })
      }
    }
  }

  // Enhanced user properties for GA4
  setGA4UserProperties(properties) {
    if (typeof gtag !== 'undefined') {
      gtag('config', 'G-XXXXXXXXXX', {
        user_properties: {
          ...properties,
          last_updated: new Date().toISOString()
        }
      })
    }
  }

  // Generate unique session ID
  generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // Generate transaction ID for conversions
  generateTransactionId() {
    return 'txn_' + Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // Get engagement time in milliseconds
  getEngagementTime() {
    const sessionStart = localStorage.getItem('dpp_session_start')
    if (sessionStart) {
      return Date.now() - parseInt(sessionStart)
    }
    return 0
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
    return localStorage.getItem('dpp_premium_status') === 'true'
  }

  // Generic event tracking function with GA4 integration
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

    // Send to Google Analytics 4
    this.sendGA4Event(eventName, {
      event_category: eventData.category || 'game',
      event_label: eventData.label || '',
      value: eventData.value || 0,
      game_category: eventData.game_category,
      premium_status: this.isPremiumUser() ? 'premium' : 'free',
      ...eventData
    })

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
      const response = await fetch('/api/analytics/track', {
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

  // Page view tracking with enhanced GA4 parameters
  trackPageView() {
    const pageData = {
      page_title: document.title,
      page_location: window.location.href,
      page_referrer: document.referrer,
      user_agent: navigator.userAgent,
      screen_resolution: `${screen.width}x${screen.height}`,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`,
      language: navigator.language,
      platform: navigator.platform
    }

    this.trackEvent('page_view', {
      category: 'navigation',
      ...pageData
    })

    // Send enhanced page view to GA4
    this.sendGA4Event('page_view', pageData)
  }

  // Game Events with GA4 integration
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
      game_type: 'hangman',
      game_category: category
    })

    // GA4 custom event
    this.sendGA4Event('level_start', {
      level_name: word,
      character: category,
      game_category: category
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
      game_type: 'hangman',
      game_category: this.gameSession.category
    }

    this.trackEvent('game_complete', gameData)

    // GA4 level completion event
    this.sendGA4Event('level_end', {
      level_name: this.gameSession.currentWord,
      success: status === 'won',
      character: this.gameSession.category,
      score: score,
      game_category: this.gameSession.category
    })

    // Track specific win/loss events
    if (status === 'won') {
      this.trackEvent('game_won', gameData)
      this.sendGA4Event('post_score', {
        score: score,
        character: this.gameSession.category,
        game_category: this.gameSession.category
      })
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
      wrong_guess_count: wrongGuessCount,
      game_category: this.gameSession.category
    })

    // GA4 custom event
    this.sendGA4Event('select_content', {
      content_type: 'letter',
      item_id: letter,
      game_category: this.gameSession.category
    })
  }

  trackHintUsage(revealedLetter) {
    this.gameSession.hintsUsed += 1

    this.trackEvent('hint_used', {
      category: 'game',
      label: revealedLetter,
      hints_used_total: this.gameSession.hintsUsed,
      word: this.gameSession.currentWord,
      game_category: this.gameSession.category
    })

    // GA4 custom event
    this.sendGA4Event('spend_virtual_currency', {
      virtual_currency_name: 'hint',
      value: 1,
      item_name: revealedLetter,
      game_category: this.gameSession.category
    })
  }

  trackCategoryChange(newCategory, previousCategory) {
    this.trackEvent('category_change', {
      category: 'game',
      label: newCategory,
      previous_category: previousCategory
    })

    // GA4 custom event
    this.sendGA4Event('select_content', {
      content_type: 'category',
      item_id: newCategory,
      game_category: newCategory
    })
  }

  // Monetization Events with enhanced GA4 tracking
  trackAdImpression(adUnit, adSize) {
    this.trackEvent('ad_impression', {
      category: 'monetization',
      label: adUnit,
      ad_size: adSize,
      ad_unit: adUnit
    })

    // GA4 ad impression
    this.sendGA4Event('ad_impression', {
      ad_platform: 'google_adsense',
      ad_unit_name: adUnit,
      ad_format: adSize,
      value: 0.01 // Estimated CPM value
    })
  }

  trackAdClick(adUnit) {
    this.trackEvent('ad_click', {
      category: 'monetization',
      label: adUnit,
      value: 1
    })

    // GA4 ad click with estimated revenue
    this.sendGA4Event('ad_click', {
      ad_platform: 'google_adsense',
      ad_unit_name: adUnit,
      value: 0.50 // Estimated CPC value
    })
  }

  trackPremiumButtonClick(location) {
    this.trackEvent('premium_button_click', {
      category: 'monetization',
      label: location, // 'header', 'modal', 'between_games'
      value: 4.99
    })

    // GA4 begin checkout event
    this.sendGA4Event('begin_checkout', {
      currency: 'USD',
      value: 4.99,
      items: [{
        item_id: 'premium_upgrade',
        item_name: 'Daily Puzzle Post Premium',
        category: 'digital_product',
        quantity: 1,
        price: 4.99
      }]
    })
  }

  trackPremiumModalOpen(trigger) {
    this.trackEvent('premium_modal_open', {
      category: 'monetization',
      label: trigger // 'header_button', 'after_games', 'between_games'
    })

    // GA4 view promotion event
    this.sendGA4Event('view_promotion', {
      promotion_id: 'premium_upgrade',
      promotion_name: 'Premium Upgrade Modal',
      creative_name: trigger,
      creative_slot: 'modal'
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

    // GA4 add payment info event
    this.sendGA4Event('add_payment_info', {
      currency: 'USD',
      value: 4.99,
      payment_type: paymentMethod
    })
  }

  trackPremiumPurchaseSuccess(paymentMethod, transactionId) {
    this.trackEvent('premium_purchase_success', {
      category: 'monetization',
      label: paymentMethod,
      value: 4.99,
      transaction_id: transactionId
    })

    // GA4 purchase event with enhanced e-commerce data
    this.sendGA4Event('purchase', {
      transaction_id: transactionId,
      value: 4.99,
      currency: 'USD',
      payment_type: paymentMethod,
      items: [{
        item_id: 'premium_upgrade',
        item_name: 'Daily Puzzle Post Premium',
        category: 'digital_product',
        quantity: 1,
        price: 4.99
      }]
    })

    // Track conversion
    this.trackGA4Conversion('premium_purchase', 4.99, 'USD')

    // Update user properties
    this.setGA4UserProperties({
      user_type: 'premium',
      premium_purchase_date: new Date().toISOString(),
      lifetime_value: 4.99
    })
  }

  trackPremiumPurchaseFailure(paymentMethod, errorReason) {
    this.trackEvent('premium_purchase_failure', {
      category: 'monetization',
      label: paymentMethod,
      error_reason: errorReason
    })

    // GA4 exception event
    this.sendGA4Event('exception', {
      description: `Payment failed: ${errorReason}`,
      fatal: false,
      payment_type: paymentMethod
    })
  }

  // User Engagement Events
  trackTimeSpent(timeSpent) {
    this.trackEvent('time_spent', {
      category: 'engagement',
      value: Math.round(timeSpent / 1000), // Convert to seconds
      label: 'session_time'
    })

    // GA4 user engagement
    this.sendGA4Event('user_engagement', {
      engagement_time_msec: timeSpent
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

    // GA4 timing event
    this.sendGA4Event('timing_complete', {
      name: 'page_load',
      value: loadTime
    })
  }

  trackError(errorType, errorMessage) {
    this.trackEvent('error', {
      category: 'error',
      label: errorType,
      error_message: errorMessage
    })

    // GA4 exception event
    this.sendGA4Event('exception', {
      description: errorMessage,
      fatal: false,
      error_type: errorType
    })
  }

  // Utility Methods
  startSession() {
    const lastVisit = localStorage.getItem('dpp_last_visit')
    const now = Date.now()
    
    localStorage.setItem('dpp_session_start', now.toString())
    
    if (lastVisit) {
      const daysSince = Math.floor((now - parseInt(lastVisit)) / (1000 * 60 * 60 * 24))
      if (daysSince > 0) {
        this.trackReturnVisit(daysSince)
      }
    }
    
    localStorage.setItem('dpp_last_visit', now.toString())

    // GA4 session start
    this.sendGA4Event('session_start', {
      session_id: this.sessionId
    })
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

    // Update GA4 consent
    if (typeof gtag !== 'undefined') {
      gtag('consent', 'update', {
        analytics_storage: enabled ? 'granted' : 'denied',
        ad_storage: enabled ? 'granted' : 'denied'
      })
    }
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

// Export individual functions for convenience
export const trackEvent = (eventName, eventData) => analytics.trackEvent(eventName, eventData)
export const trackGameStart = (category, word) => analytics.trackGameStart(category, word)
export const trackGameComplete = (status, timeElapsed, score, streak) => analytics.trackGameComplete(status, timeElapsed, score, streak)
export const trackLetterGuess = (letter, isCorrect, wrongGuessCount) => analytics.trackLetterGuess(letter, isCorrect, wrongGuessCount)
export const trackHintUsage = (revealedLetter) => analytics.trackHintUsage(revealedLetter)
export const trackCategoryChange = (newCategory, previousCategory) => analytics.trackCategoryChange(newCategory, previousCategory)
export const trackPremiumButtonClick = (location) => analytics.trackPremiumButtonClick(location)
export const trackPremiumModalOpen = (trigger) => analytics.trackPremiumModalOpen(trigger)
export const trackPremiumModalClose = (method) => analytics.trackPremiumModalClose(method)
export const trackPremiumPurchaseAttempt = (paymentMethod) => analytics.trackPremiumPurchaseAttempt(paymentMethod)
export const trackPremiumPurchaseSuccess = (paymentMethod, transactionId) => analytics.trackPremiumPurchaseSuccess(paymentMethod, transactionId)

// Also make available globally for debugging
window.analytics = analytics

