// Sudoku API client for Daily Puzzle Post
// Provides hybrid API/local loading for Sudoku puzzles

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.dailypuzzlepost.com' 
  : 'http://localhost:5000';

/**
 * Hybrid Sudoku loader - tries API first, falls back to local files
 */
export const hybridSudokuLoader = {
  // Load today's Sudoku puzzle
  loadToday: async () => {
    try {
      // Try API first
      const response = await fetch(`${API_BASE_URL}/api/sudoku/today`);
      if (response.ok) {
        const data = await response.json();
        return {
          ...data.puzzle,
          source: 'api',
          rotation: data.rotation
        };
      }
    } catch (error) {
      console.log('API not available, using local rotation');
    }
    
    // Fallback to local rotation system
    const { loadTodaysSudoku } = await import('./sudokuRotation');
    return await loadTodaysSudoku();
  },

  // Load Sudoku puzzle by date
  loadByDate: async (date) => {
    try {
      // Try API first
      const response = await fetch(`${API_BASE_URL}/api/sudoku/date/${date}`);
      if (response.ok) {
        const data = await response.json();
        return {
          ...data.puzzle,
          source: 'api',
          rotation: data.rotation
        };
      }
    } catch (error) {
      console.log('API not available for date lookup');
    }
    
    // Fallback to local rotation system
    const { loadSudokuByDate } = await import('./sudokuRotation');
    return await loadSudokuByDate(date);
  },

  // Get rotation status
  getRotationStatus: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sudoku/rotation/status`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.log('API not available for rotation status');
    }
    
    // Fallback to local calculation
    const { getSudokuRotationStats } = await import('./sudokuRotation');
    return {
      success: true,
      rotation: getSudokuRotationStats(),
      source: 'local'
    };
  }
};

/**
 * Lindy.ai helper functions for Sudoku automation
 */
export const sudokuLindyHelpers = {
  // Inject new Sudoku puzzle (for Lindy.ai)
  injectPuzzle: async (puzzleData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sudoku/inject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(puzzleData)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Track successful injection
        if (window.gtag) {
          window.gtag('event', 'sudoku_puzzle_injected', {
            event_category: 'lindy_automation',
            event_label: puzzleData.id,
            puzzle_difficulty: puzzleData.difficulty
          });
        }
        
        return { success: true, data: result };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error injecting Sudoku puzzle:', error);
      return { success: false, error: error.message };
    }
  },

  // Validate puzzle format before injection
  validatePuzzle: async (puzzleData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sudoku/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(puzzleData)
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error validating Sudoku puzzle:', error);
      return { valid: false, errors: [error.message] };
    }
  },

  // Get puzzle bank status
  getBankStatus: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sudoku/bank`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.log('API not available for bank status');
    }
    
    return { success: false, error: 'API not available' };
  },

  // Create backup
  createBackup: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sudoku/backup`, {
        method: 'POST'
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error creating Sudoku backup:', error);
      return { success: false, error: error.message };
    }
  },

  // Health check
  healthCheck: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sudoku/health`);
      return await response.json();
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  },

  // Get analytics data for Lindy
  getAnalyticsData: async () => {
    try {
      const rotationStatus = await sudokuLindyHelpers.getBankStatus();
      const healthStatus = await sudokuLindyHelpers.healthCheck();
      
      return {
        timestamp: new Date().toISOString(),
        system: 'sudoku_automation',
        rotation: rotationStatus,
        health: healthStatus,
        api_available: healthStatus.status !== 'error'
      };
    } catch (error) {
      return {
        timestamp: new Date().toISOString(),
        system: 'sudoku_automation',
        error: error.message,
        api_available: false
      };
    }
  }
};

/**
 * Analytics tracking for Sudoku events
 */
export const trackSudokuEvent = (eventName, eventData = {}) => {
  try {
    // Google Analytics
    if (window.gtag) {
      window.gtag('event', eventName, {
        event_category: 'sudoku',
        ...eventData
      });
    }
    
    // Custom analytics
    const analyticsData = {
      event: eventName,
      timestamp: new Date().toISOString(),
      data: eventData,
      user_agent: navigator.userAgent,
      page_url: window.location.href
    };
    
    // Store in localStorage for local analytics
    const existingData = JSON.parse(localStorage.getItem('sudoku_analytics') || '[]');
    existingData.push(analyticsData);
    
    // Keep only last 100 events
    if (existingData.length > 100) {
      existingData.splice(0, existingData.length - 100);
    }
    
    localStorage.setItem('sudoku_analytics', JSON.stringify(existingData));
    
    // Send to API if available
    fetch(`${API_BASE_URL}/api/analytics/sudoku`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(analyticsData)
    }).catch(() => {
      // Silently fail if API not available
    });
    
  } catch (error) {
    console.error('Error tracking Sudoku event:', error);
  }
};

/**
 * Utility functions for Sudoku management
 */
export const sudokuUtils = {
  // Format time for display
  formatTime: (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  },

  // Calculate difficulty score
  getDifficultyScore: (difficulty) => {
    const scores = { easy: 1, medium: 2, hard: 3 };
    return scores[difficulty] || 1;
  },

  // Generate puzzle statistics
  getPuzzleStats: (puzzleData) => {
    if (!puzzleData || !puzzleData.given) return null;
    
    const givenCount = puzzleData.given.flat().filter(cell => cell !== 0).length;
    const emptyCount = 81 - givenCount;
    
    return {
      given_numbers: givenCount,
      empty_cells: emptyCount,
      difficulty: puzzleData.difficulty,
      estimated_time: puzzleData.estimated_time,
      completion_percentage: (givenCount / 81) * 100
    };
  },

  // Check if puzzle is valid Sudoku format
  isValidSudokuFormat: (grid) => {
    if (!Array.isArray(grid) || grid.length !== 9) return false;
    
    for (const row of grid) {
      if (!Array.isArray(row) || row.length !== 9) return false;
      for (const cell of row) {
        if (typeof cell !== 'number' || cell < 0 || cell > 9) return false;
      }
    }
    
    return true;
  }
};

export default {
  hybridSudokuLoader,
  sudokuLindyHelpers,
  trackSudokuEvent,
  sudokuUtils
};

