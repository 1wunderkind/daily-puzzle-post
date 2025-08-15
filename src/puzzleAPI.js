// Puzzle API Client for Frontend
// Handles communication with the puzzle backend API

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:5000/api';

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
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Get today's puzzle from the API
 */
export const getTodaysPuzzleAPI = async () => {
  try {
    const response = await apiRequest('/puzzles/today');
    return response.puzzle;
  } catch (error) {
    console.error('Failed to get today\'s puzzle from API:', error);
    throw error;
  }
};

/**
 * Get puzzle for specific date from the API
 */
export const getPuzzleForDateAPI = async (dateString) => {
  try {
    const response = await apiRequest(`/puzzles/date/${dateString}`);
    return response.puzzle;
  } catch (error) {
    console.error(`Failed to get puzzle for date ${dateString} from API:`, error);
    throw error;
  }
};

/**
 * Get puzzle bank from the API
 */
export const getPuzzleBankAPI = async () => {
  try {
    const response = await apiRequest('/puzzles/bank');
    return response.puzzles;
  } catch (error) {
    console.error('Failed to get puzzle bank from API:', error);
    throw error;
  }
};

/**
 * Get rotation status from the API
 */
export const getRotationStatusAPI = async () => {
  try {
    const response = await apiRequest('/puzzles/rotation/status');
    return response.rotation;
  } catch (error) {
    console.error('Failed to get rotation status from API:', error);
    throw error;
  }
};

/**
 * Validate puzzle data via API
 */
export const validatePuzzleAPI = async (puzzleData) => {
  try {
    const response = await apiRequest('/puzzles/validate', {
      method: 'POST',
      body: JSON.stringify(puzzleData),
    });
    return response.validation;
  } catch (error) {
    console.error('Failed to validate puzzle via API:', error);
    throw error;
  }
};

/**
 * Inject new puzzle via API (for Lindy.ai)
 */
export const injectPuzzleAPI = async (puzzleData, options = {}) => {
  try {
    const payload = {
      ...puzzleData,
      ...options
    };
    
    const response = await apiRequest('/puzzles/inject', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    
    return response;
  } catch (error) {
    console.error('Failed to inject puzzle via API:', error);
    throw error;
  }
};

/**
 * Create backup via API
 */
export const createBackupAPI = async () => {
  try {
    const response = await apiRequest('/puzzles/backup', {
      method: 'POST',
    });
    return response.backup;
  } catch (error) {
    console.error('Failed to create backup via API:', error);
    throw error;
  }
};

/**
 * Get system health status
 */
export const getHealthStatusAPI = async () => {
  try {
    const response = await apiRequest('/puzzles/health');
    return response.health;
  } catch (error) {
    console.error('Failed to get health status from API:', error);
    throw error;
  }
};

/**
 * Puzzle API client with fallback to local data
 */
export class PuzzleAPIClient {
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
   * Get today's puzzle with fallback
   */
  async getTodaysPuzzle() {
    return this.getCached('today', getTodaysPuzzleAPI);
  }
  
  /**
   * Get puzzle for date with fallback
   */
  async getPuzzleForDate(dateString) {
    return this.getCached(`date_${dateString}`, () => getPuzzleForDateAPI(dateString));
  }
  
  /**
   * Get rotation status with fallback
   */
  async getRotationStatus() {
    return this.getCached('rotation', getRotationStatusAPI);
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
      await getHealthStatusAPI();
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Default API client instance
export const puzzleAPI = new PuzzleAPIClient(true);

/**
 * Hybrid puzzle loader that tries API first, then falls back to local rotation
 */
export const hybridPuzzleLoader = {
  async getTodaysPuzzle() {
    try {
      // Try API first
      return await getTodaysPuzzleAPI();
    } catch (error) {
      console.warn('API unavailable, falling back to local rotation:', error);
      
      // Import local rotation system as fallback
      const { getTodaysPuzzle } = await import('./puzzleRotation');
      return await getTodaysPuzzle();
    }
  },
  
  async getPuzzleForDate(dateString) {
    try {
      // Try API first
      return await getPuzzleForDateAPI(dateString);
    } catch (error) {
      console.warn('API unavailable, falling back to local rotation:', error);
      
      // Import local rotation system as fallback
      const { getPuzzleForDate } = await import('./puzzleRotation');
      return await getPuzzleForDate(dateString);
    }
  },
  
  async getRotationStatus() {
    try {
      // Try API first
      return await getRotationStatusAPI();
    } catch (error) {
      console.warn('API unavailable, falling back to local calculation:', error);
      
      // Import local rotation system as fallback
      const { getRotationStats } = await import('./puzzleRotation');
      return getRotationStats();
    }
  }
};

/**
 * Lindy.ai automation helpers
 */
export const lindyHelpers = {
  /**
   * Inject puzzle with Lindy-specific options
   */
  async injectPuzzle(puzzleData, options = {}) {
    const lindyOptions = {
      strategy: 'replace_oldest',
      reason: 'Automated content refresh by Lindy.ai',
      qualityScore: options.qualityScore || 4.0,
      ...options
    };
    
    return await injectPuzzleAPI(puzzleData, lindyOptions);
  },
  
  /**
   * Get puzzle bank status for Lindy monitoring
   */
  async getBankStatus() {
    try {
      const [health, rotation, bank] = await Promise.all([
        getHealthStatusAPI(),
        getRotationStatusAPI(),
        getPuzzleBankAPI()
      ]);
      
      return {
        health,
        rotation,
        totalPuzzles: bank.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get bank status for Lindy:', error);
      throw error;
    }
  },
  
  /**
   * Validate puzzle before injection
   */
  async validateBeforeInjection(puzzleData) {
    try {
      const validation = await validatePuzzleAPI(puzzleData);
      
      if (!validation.isValid) {
        throw new Error(`Puzzle validation failed: ${validation.errors.join(', ')}`);
      }
      
      return validation;
    } catch (error) {
      console.error('Puzzle validation failed:', error);
      throw error;
    }
  }
};

/**
 * Export all API functions for direct use
 */
export {
  getTodaysPuzzleAPI as getTodaysPuzzleFromAPI,
  getPuzzleForDateAPI as getPuzzleForDateFromAPI,
  getPuzzleBankAPI as getPuzzleBankFromAPI,
  getRotationStatusAPI as getRotationStatusFromAPI,
  validatePuzzleAPI as validatePuzzleFromAPI,
  injectPuzzleAPI as injectPuzzleFromAPI,
  createBackupAPI as createBackupFromAPI,
  getHealthStatusAPI as getHealthStatusFromAPI
};

