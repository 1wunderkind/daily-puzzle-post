// Hangman API Client for Frontend
// Handles communication with the Hangman backend API

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api/hangman' 
  : 'http://localhost:5000/api/hangman';

/**
 * Generic API request handler
 */
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const requestOptions = { ...defaultOptions, ...options };
  
  try {
    const response = await fetch(url, requestOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Hangman API request failed for ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Get today's word from the API
 */
export const getTodaysWordAPI = async () => {
  try {
    const response = await apiRequest('/words/today');
    return response.word;
  } catch (error) {
    console.error('Failed to get today\'s word from API:', error);
    throw error;
  }
};

/**
 * Get word for specific date from the API
 */
export const getWordForDateAPI = async (dateString) => {
  try {
    const response = await apiRequest(`/words/date/${dateString}`);
    return response.word;
  } catch (error) {
    console.error(`Failed to get word for date ${dateString} from API:`, error);
    throw error;
  }
};

/**
 * Get word bank from the API
 */
export const getWordBankAPI = async () => {
  try {
    const response = await apiRequest('/words/bank');
    return response.words;
  } catch (error) {
    console.error('Failed to get word bank from API:', error);
    throw error;
  }
};

/**
 * Get rotation status from the API
 */
export const getHangmanRotationStatusAPI = async () => {
  try {
    const response = await apiRequest('/words/rotation/status');
    return response.rotation;
  } catch (error) {
    console.error('Failed to get rotation status from API:', error);
    throw error;
  }
};

/**
 * Validate word data via API
 */
export const validateWordAPI = async (wordData) => {
  try {
    const response = await apiRequest('/words/validate', {
      method: 'POST',
      body: JSON.stringify(wordData),
    });
    return response.validation;
  } catch (error) {
    console.error('Failed to validate word via API:', error);
    throw error;
  }
};

/**
 * Inject new word via API (for Lindy.ai)
 */
export const injectWordAPI = async (wordData, options = {}) => {
  try {
    const payload = {
      wordData,
      ...options
    };
    
    const response = await apiRequest('/words/inject', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    
    return response;
  } catch (error) {
    console.error('Failed to inject word via API:', error);
    throw error;
  }
};

/**
 * Create backup via API
 */
export const createWordBackupAPI = async (type = 'manual', description = '') => {
  try {
    const response = await apiRequest('/words/backup', {
      method: 'POST',
      body: JSON.stringify({ type, description }),
    });
    return response.backup;
  } catch (error) {
    console.error('Failed to create backup via API:', error);
    throw error;
  }
};

/**
 * Record game analytics via API
 */
export const recordHangmanAnalyticsAPI = async (analyticsData) => {
  try {
    const response = await apiRequest('/words/analytics', {
      method: 'POST',
      body: JSON.stringify(analyticsData),
    });
    return response;
  } catch (error) {
    console.error('Failed to record analytics via API:', error);
    throw error;
  }
};

/**
 * Get game analytics via API
 */
export const getHangmanAnalyticsAPI = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/words/analytics?${queryParams}` : '/words/analytics';
    const response = await apiRequest(endpoint);
    return response.analytics;
  } catch (error) {
    console.error('Failed to get analytics from API:', error);
    throw error;
  }
};

/**
 * Get system health status
 */
export const getHangmanHealthStatusAPI = async () => {
  try {
    const response = await apiRequest('/words/health');
    return response.health;
  } catch (error) {
    console.error('Failed to get health status from API:', error);
    throw error;
  }
};

/**
 * Hangman API client with fallback to local data
 */
export class HangmanAPIClient {
  constructor(enableFallback = true) {
    this.enableFallback = enableFallback;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }
  
  /**
   * Get cached data or fetch from API
   */
  async getCached(key, fetchFunction) {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    
    try {
      const data = await fetchFunction();
      this.cache.set(key, {
        data,
        timestamp: Date.now()
      });
      return data;
    } catch (error) {
      if (cached) {
        console.warn('API failed, using cached data:', error);
        return cached.data;
      }
      throw error;
    }
  }
  
  /**
   * Get today's word with fallback
   */
  async getTodaysWord() {
    return this.getCached('today', getTodaysWordAPI);
  }
  
  /**
   * Get word for date with fallback
   */
  async getWordForDate(dateString) {
    return this.getCached(`date_${dateString}`, () => getWordForDateAPI(dateString));
  }
  
  /**
   * Get rotation status with fallback
   */
  async getRotationStatus() {
    return this.getCached('rotation', getHangmanRotationStatusAPI);
  }
  
  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
  
  /**
   * Check if API is available
   */
  async isAPIAvailable() {
    try {
      await getHangmanHealthStatusAPI();
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Default API client instance
export const hangmanAPI = new HangmanAPIClient(true);

/**
 * Hybrid word loader that tries API first, then falls back to local rotation
 */
export const hybridHangmanLoader = {
  async getTodaysWord() {
    try {
      // Try API first
      return await getTodaysWordAPI();
    } catch (error) {
      console.warn('API unavailable, falling back to local rotation:', error);
      
      // Import local rotation system as fallback
      const { getTodaysWord } = await import('./hangmanRotation');
      return await getTodaysWord();
    }
  },
  
  async getWordForDate(dateString) {
    try {
      // Try API first
      return await getWordForDateAPI(dateString);
    } catch (error) {
      console.warn('API unavailable, falling back to local rotation:', error);
      
      // Import local rotation system as fallback
      const { getWordForDate } = await import('./hangmanRotation');
      return await getWordForDate(dateString);
    }
  },
  
  async getRotationStatus() {
    try {
      // Try API first
      return await getHangmanRotationStatusAPI();
    } catch (error) {
      console.warn('API unavailable, falling back to local calculation:', error);
      
      // Import local rotation system as fallback
      const { getHangmanRotationStats } = await import('./hangmanRotation');
      return getHangmanRotationStats();
    }
  }
};

/**
 * Lindy.ai automation helpers for Hangman
 */
export const hangmanLindyHelpers = {
  /**
   * Inject word with Lindy-specific options
   */
  async injectWord(wordData, options = {}) {
    const lindyOptions = {
      strategy: 'replace_oldest',
      reason: 'Automated content refresh by Lindy.ai',
      qualityScore: options.qualityScore || 4.0,
      ...options
    };
    
    return await injectWordAPI(wordData, lindyOptions);
  },
  
  /**
   * Get word bank status for Lindy monitoring
   */
  async getBankStatus() {
    try {
      const [health, rotation, bank] = await Promise.all([
        getHangmanHealthStatusAPI(),
        getHangmanRotationStatusAPI(),
        getWordBankAPI()
      ]);
      
      return {
        health,
        rotation,
        totalWords: bank.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get bank status for Lindy:', error);
      throw error;
    }
  },
  
  /**
   * Validate word before injection
   */
  async validateBeforeInjection(wordData) {
    try {
      const validation = await validateWordAPI(wordData);
      
      if (!validation.isValid) {
        throw new Error(`Word validation failed: ${validation.errors.join(', ')}`);
      }
      
      return validation;
    } catch (error) {
      console.error('Word validation failed:', error);
      throw error;
    }
  },
  
  /**
   * Record game completion analytics for Lindy monitoring
   */
  async recordGameCompletion(wordId, gameData) {
    try {
      const analyticsData = {
        wordId,
        eventType: 'game_completed',
        userSession: gameData.sessionId || 'anonymous',
        gameDuration: gameData.duration,
        attemptsUsed: gameData.wrongGuesses,
        lettersGuessed: gameData.guessedLetters.join(''),
        isCompleted: true,
        isWon: gameData.isWon,
        hintUsed: gameData.hintUsed || false,
        metadata: {
          difficulty: gameData.difficulty,
          wordLength: gameData.wordLength,
          theme: gameData.theme,
          timestamp: new Date().toISOString()
        }
      };
      
      return await recordHangmanAnalyticsAPI(analyticsData);
    } catch (error) {
      console.error('Failed to record game completion:', error);
      // Don't throw error for analytics failures
      return null;
    }
  }
};

/**
 * Export all API functions for direct use
 */
export {
  getTodaysWordAPI as getTodaysWordFromAPI,
  getWordForDateAPI as getWordForDateFromAPI,
  getWordBankAPI as getWordBankFromAPI,
  getHangmanRotationStatusAPI as getRotationStatusFromAPI,
  validateWordAPI as validateWordFromAPI,
  injectWordAPI as injectWordFromAPI,
  createWordBackupAPI as createBackupFromAPI,
  getHangmanHealthStatusAPI as getHealthStatusFromAPI,
  recordHangmanAnalyticsAPI as recordAnalyticsFromAPI,
  getHangmanAnalyticsAPI as getAnalyticsFromAPI
};

