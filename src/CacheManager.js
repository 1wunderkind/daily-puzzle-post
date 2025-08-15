// Cache Manager for Daily Puzzle Post
// Implements comprehensive caching strategy for optimal performance

class CacheManager {
  constructor() {
    this.version = '1.0.0';
    this.cachePrefix = 'dpp_';
    this.maxCacheAge = 24 * 60 * 60 * 1000; // 24 hours
    this.maxCacheSize = 50; // Maximum number of cached items
  }

  // Generate cache key with version
  generateKey(key) {
    return `${this.cachePrefix}${this.version}_${key}`;
  }

  // Set item in cache with expiration
  set(key, data, customTTL = null) {
    try {
      const cacheKey = this.generateKey(key);
      const ttl = customTTL || this.maxCacheAge;
      const cacheItem = {
        data,
        timestamp: Date.now(),
        ttl,
        version: this.version
      };

      localStorage.setItem(cacheKey, JSON.stringify(cacheItem));
      this.cleanupOldEntries();
      
      return true;
    } catch (error) {
      console.warn('Cache set failed:', error);
      return false;
    }
  }

  // Get item from cache
  get(key) {
    try {
      const cacheKey = this.generateKey(key);
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) return null;

      const cacheItem = JSON.parse(cached);
      
      // Check if cache is expired
      if (Date.now() - cacheItem.timestamp > cacheItem.ttl) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      // Check version compatibility
      if (cacheItem.version !== this.version) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.warn('Cache get failed:', error);
      return null;
    }
  }

  // Remove item from cache
  remove(key) {
    try {
      const cacheKey = this.generateKey(key);
      localStorage.removeItem(cacheKey);
      return true;
    } catch (error) {
      console.warn('Cache remove failed:', error);
      return false;
    }
  }

  // Clear all cache entries
  clear() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.cachePrefix)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.warn('Cache clear failed:', error);
      return false;
    }
  }

  // Cleanup old entries to prevent storage overflow
  cleanupOldEntries() {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(this.cachePrefix));
      
      if (cacheKeys.length > this.maxCacheSize) {
        // Sort by timestamp and remove oldest entries
        const cacheItems = cacheKeys.map(key => {
          try {
            const item = JSON.parse(localStorage.getItem(key));
            return { key, timestamp: item.timestamp };
          } catch {
            return { key, timestamp: 0 };
          }
        }).sort((a, b) => a.timestamp - b.timestamp);

        // Remove oldest entries
        const toRemove = cacheItems.slice(0, cacheKeys.length - this.maxCacheSize);
        toRemove.forEach(item => localStorage.removeItem(item.key));
      }
    } catch (error) {
      console.warn('Cache cleanup failed:', error);
    }
  }

  // Get cache statistics
  getStats() {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(this.cachePrefix));
      
      let totalSize = 0;
      let validEntries = 0;
      let expiredEntries = 0;

      cacheKeys.forEach(key => {
        try {
          const value = localStorage.getItem(key);
          totalSize += value.length;
          
          const item = JSON.parse(value);
          if (Date.now() - item.timestamp > item.ttl) {
            expiredEntries++;
          } else {
            validEntries++;
          }
        } catch {
          expiredEntries++;
        }
      });

      return {
        totalEntries: cacheKeys.length,
        validEntries,
        expiredEntries,
        totalSize,
        version: this.version
      };
    } catch (error) {
      console.warn('Cache stats failed:', error);
      return null;
    }
  }
}

// Game state caching
export class GameStateCache extends CacheManager {
  constructor() {
    super();
    this.cachePrefix = 'dpp_game_';
  }

  // Save game state
  saveGameState(gameType, state) {
    const key = `${gameType}_state`;
    return this.set(key, state, 7 * 24 * 60 * 60 * 1000); // 7 days
  }

  // Load game state
  loadGameState(gameType) {
    const key = `${gameType}_state`;
    return this.get(key);
  }

  // Save game statistics
  saveGameStats(gameType, stats) {
    const key = `${gameType}_stats`;
    return this.set(key, stats, 30 * 24 * 60 * 60 * 1000); // 30 days
  }

  // Load game statistics
  loadGameStats(gameType) {
    const key = `${gameType}_stats`;
    return this.get(key);
  }
}

// Puzzle data caching
export class PuzzleDataCache extends CacheManager {
  constructor() {
    super();
    this.cachePrefix = 'dpp_puzzle_';
  }

  // Cache puzzle data
  cachePuzzle(puzzleType, puzzleId, data) {
    const key = `${puzzleType}_${puzzleId}`;
    return this.set(key, data, 7 * 24 * 60 * 60 * 1000); // 7 days
  }

  // Get cached puzzle
  getCachedPuzzle(puzzleType, puzzleId) {
    const key = `${puzzleType}_${puzzleId}`;
    return this.get(key);
  }

  // Cache today's puzzle
  cacheTodaysPuzzle(puzzleType, data) {
    const today = new Date().toISOString().split('T')[0];
    const key = `${puzzleType}_today_${today}`;
    return this.set(key, data, 24 * 60 * 60 * 1000); // 24 hours
  }

  // Get today's cached puzzle
  getTodaysCachedPuzzle(puzzleType) {
    const today = new Date().toISOString().split('T')[0];
    const key = `${puzzleType}_today_${today}`;
    return this.get(key);
  }
}

// User preferences caching
export class UserPreferencesCache extends CacheManager {
  constructor() {
    super();
    this.cachePrefix = 'dpp_prefs_';
  }

  // Save user preferences
  savePreferences(prefs) {
    return this.set('user_preferences', prefs, 365 * 24 * 60 * 60 * 1000); // 1 year
  }

  // Load user preferences
  loadPreferences() {
    return this.get('user_preferences') || {
      theme: 'newspaper',
      difficulty: 'medium',
      hints: true,
      sound: false,
      animations: true
    };
  }

  // Save premium status
  savePremiumStatus(status) {
    return this.set('premium_status', status, 30 * 24 * 60 * 60 * 1000); // 30 days
  }

  // Load premium status
  loadPremiumStatus() {
    return this.get('premium_status') || false;
  }
}

// Analytics caching
export class AnalyticsCache extends CacheManager {
  constructor() {
    super();
    this.cachePrefix = 'dpp_analytics_';
    this.maxEvents = 100;
  }

  // Queue analytics event
  queueEvent(event) {
    const events = this.get('queued_events') || [];
    events.push({
      ...event,
      timestamp: Date.now(),
      id: Math.random().toString(36).substr(2, 9)
    });

    // Keep only recent events
    const recentEvents = events.slice(-this.maxEvents);
    return this.set('queued_events', recentEvents, 7 * 24 * 60 * 60 * 1000); // 7 days
  }

  // Get queued events
  getQueuedEvents() {
    return this.get('queued_events') || [];
  }

  // Clear queued events
  clearQueuedEvents() {
    return this.remove('queued_events');
  }

  // Save performance metrics
  savePerformanceMetrics(metrics) {
    const key = `performance_${Date.now()}`;
    return this.set(key, metrics, 24 * 60 * 60 * 1000); // 24 hours
  }
}

// Resource caching for offline support
export class ResourceCache extends CacheManager {
  constructor() {
    super();
    this.cachePrefix = 'dpp_resource_';
  }

  // Cache API response
  cacheAPIResponse(endpoint, data) {
    const key = `api_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;
    return this.set(key, data, 60 * 60 * 1000); // 1 hour
  }

  // Get cached API response
  getCachedAPIResponse(endpoint) {
    const key = `api_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;
    return this.get(key);
  }

  // Cache static content
  cacheStaticContent(contentType, data) {
    const key = `static_${contentType}`;
    return this.set(key, data, 24 * 60 * 60 * 1000); // 24 hours
  }

  // Get cached static content
  getCachedStaticContent(contentType) {
    const key = `static_${contentType}`;
    return this.get(key);
  }
}

// Initialize cache managers
export const gameStateCache = new GameStateCache();
export const puzzleDataCache = new PuzzleDataCache();
export const userPreferencesCache = new UserPreferencesCache();
export const analyticsCache = new AnalyticsCache();
export const resourceCache = new ResourceCache();

// Cache utilities
export const cacheUtils = {
  // Preload critical data
  preloadCriticalData: async () => {
    try {
      // Preload today's puzzles
      const today = new Date().toISOString().split('T')[0];
      
      // Check if we have cached data for today
      const cachedCrossword = puzzleDataCache.getTodaysCachedPuzzle('crossword');
      const cachedSudoku = puzzleDataCache.getTodaysCachedPuzzle('sudoku');
      const cachedHangman = puzzleDataCache.getTodaysCachedPuzzle('hangman');

      // Load missing data
      if (!cachedCrossword) {
        // Load crossword data
        import('./crosswordRotation').then(module => {
          module.loadTodaysCrossword().then(data => {
            puzzleDataCache.cacheTodaysPuzzle('crossword', data);
          });
        });
      }

      if (!cachedSudoku) {
        // Load sudoku data
        import('./sudokuRotation').then(module => {
          module.loadTodaysSudoku().then(data => {
            puzzleDataCache.cacheTodaysPuzzle('sudoku', data);
          });
        });
      }

      if (!cachedHangman) {
        // Load hangman data
        import('./hangmanRotation').then(module => {
          module.loadTodaysWord().then(data => {
            puzzleDataCache.cacheTodaysPuzzle('hangman', data);
          });
        });
      }
    } catch (error) {
      console.warn('Preload failed:', error);
    }
  },

  // Clear all caches
  clearAllCaches: () => {
    gameStateCache.clear();
    puzzleDataCache.clear();
    userPreferencesCache.clear();
    analyticsCache.clear();
    resourceCache.clear();
  },

  // Get overall cache statistics
  getAllCacheStats: () => {
    return {
      gameState: gameStateCache.getStats(),
      puzzleData: puzzleDataCache.getStats(),
      userPreferences: userPreferencesCache.getStats(),
      analytics: analyticsCache.getStats(),
      resources: resourceCache.getStats()
    };
  }
};

export default CacheManager;

