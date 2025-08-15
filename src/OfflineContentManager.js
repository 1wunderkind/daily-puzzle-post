/**
 * Offline Content Manager for Daily Puzzle Post
 * Handles limited offline content for free users vs unlimited for premium users
 */

class OfflineContentManager {
  constructor() {
    this.FREE_OFFLINE_LIMIT = 3; // Free users get 3 puzzles offline
    this.STORAGE_KEY = 'dpp_offline_usage';
    this.PREMIUM_KEY = 'dpp_premium_status';
  }

  /**
   * Check if user is premium
   */
  isPremiumUser() {
    const premiumStatus = localStorage.getItem(this.PREMIUM_KEY);
    if (!premiumStatus) return false;
    
    try {
      const status = JSON.parse(premiumStatus);
      return status.active && new Date(status.expires) > new Date();
    } catch (e) {
      return false;
    }
  }

  /**
   * Get offline usage data
   */
  getOfflineUsage() {
    const usage = localStorage.getItem(this.STORAGE_KEY);
    if (!usage) {
      return {
        puzzlesPlayed: 0,
        lastReset: new Date().toDateString(),
        gameTypes: {
          hangman: 0,
          crossword: 0,
          sudoku: 0,
          wordsearch: 0
        }
      };
    }
    
    try {
      const data = JSON.parse(usage);
      // Reset daily if it's a new day
      if (data.lastReset !== new Date().toDateString()) {
        return {
          puzzlesPlayed: 0,
          lastReset: new Date().toDateString(),
          gameTypes: {
            hangman: 0,
            crossword: 0,
            sudoku: 0,
            wordsearch: 0
          }
        };
      }
      return data;
    } catch (e) {
      return {
        puzzlesPlayed: 0,
        lastReset: new Date().toDateString(),
        gameTypes: {
          hangman: 0,
          crossword: 0,
          sudoku: 0,
          wordsearch: 0
        }
      };
    }
  }

  /**
   * Check if user can access offline content
   */
  canAccessOfflineContent(gameType = 'general') {
    // Premium users have unlimited access
    if (this.isPremiumUser()) {
      return {
        allowed: true,
        reason: 'premium',
        remaining: 'unlimited'
      };
    }

    // Check if online
    if (navigator.onLine) {
      return {
        allowed: true,
        reason: 'online',
        remaining: 'unlimited'
      };
    }

    // Offline free user - check limits
    const usage = this.getOfflineUsage();
    const remaining = this.FREE_OFFLINE_LIMIT - usage.puzzlesPlayed;

    if (remaining > 0) {
      return {
        allowed: true,
        reason: 'free_offline',
        remaining: remaining
      };
    }

    return {
      allowed: false,
      reason: 'limit_reached',
      remaining: 0,
      upgradeMessage: 'You\'ve reached your daily offline puzzle limit. Upgrade to Premium for unlimited offline access!'
    };
  }

  /**
   * Record offline puzzle play
   */
  recordOfflinePlay(gameType) {
    // Don't record if online or premium
    if (navigator.onLine || this.isPremiumUser()) {
      return;
    }

    const usage = this.getOfflineUsage();
    usage.puzzlesPlayed++;
    usage.gameTypes[gameType] = (usage.gameTypes[gameType] || 0) + 1;
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(usage));

    // Track analytics for later sync
    this.trackOfflineAnalytics(gameType, usage);
  }

  /**
   * Track offline analytics for later sync
   */
  trackOfflineAnalytics(gameType, usage) {
    const analyticsKey = 'dpp_offline_analytics';
    const existing = localStorage.getItem(analyticsKey);
    let analytics = [];
    
    if (existing) {
      try {
        analytics = JSON.parse(existing);
      } catch (e) {
        analytics = [];
      }
    }

    analytics.push({
      timestamp: new Date().toISOString(),
      gameType: gameType,
      totalPlayed: usage.puzzlesPlayed,
      userType: this.isPremiumUser() ? 'premium' : 'free',
      online: navigator.onLine
    });

    // Keep only last 100 entries
    if (analytics.length > 100) {
      analytics = analytics.slice(-100);
    }

    localStorage.setItem(analyticsKey, JSON.stringify(analytics));
  }

  /**
   * Get offline analytics for sync
   */
  getOfflineAnalytics() {
    const analyticsKey = 'dpp_offline_analytics';
    const data = localStorage.getItem(analyticsKey);
    if (!data) return [];
    
    try {
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  }

  /**
   * Clear offline analytics after sync
   */
  clearOfflineAnalytics() {
    localStorage.removeItem('dpp_offline_analytics');
  }

  /**
   * Get upgrade message based on usage
   */
  getUpgradeMessage() {
    const usage = this.getOfflineUsage();
    const remaining = this.FREE_OFFLINE_LIMIT - usage.puzzlesPlayed;

    if (remaining <= 0) {
      return {
        title: 'Offline Limit Reached',
        message: 'You\'ve used all 3 daily offline puzzles. Upgrade to Premium for unlimited offline access!',
        urgency: 'high'
      };
    } else if (remaining <= 2) {
      return {
        title: 'Almost at Limit',
        message: `Only ${remaining} offline puzzles remaining today. Upgrade to Premium for unlimited access!`,
        urgency: 'medium'
      };
    } else {
      return {
        title: 'Enjoying Offline Play?',
        message: `${remaining} offline puzzles remaining today. Upgrade to Premium for unlimited offline access!`,
        urgency: 'low'
      };
    }
  }

  /**
   * Reset daily usage (for testing)
   */
  resetDailyUsage() {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

// Export singleton instance
export const offlineContentManager = new OfflineContentManager();
export default offlineContentManager;

