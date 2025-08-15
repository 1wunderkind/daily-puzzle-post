// Word Search API Client for Daily Puzzle Post
// Provides hybrid API/local loading for Word Search puzzles

const API_BASE_URL = 'http://localhost:5000'; // Flask API base URL

// Word Search API client
export const wordsearchAPI = {
  // Get today's Word Search puzzle
  getTodaysPuzzle: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/wordsearch/today`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const puzzle = await response.json();
      
      // Store in localStorage for offline access
      localStorage.setItem('dpp_current_wordsearch', JSON.stringify(puzzle));
      
      return puzzle;
    } catch (error) {
      console.error('Error fetching today\'s Word Search from API:', error);
      
      // Fallback to localStorage
      const cached = localStorage.getItem('dpp_current_wordsearch');
      if (cached) {
        return JSON.parse(cached);
      }
      
      throw error;
    }
  },
  
  // Get Word Search puzzle for specific date
  getPuzzleForDate: async (dateString) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/wordsearch/date/${dateString}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching Word Search for date ${dateString}:`, error);
      throw error;
    }
  },
  
  // Inject new Word Search puzzle (Lindy.ai automation)
  injectPuzzle: async (puzzleData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/wordsearch/inject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(puzzleData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error injecting Word Search puzzle:', error);
      throw error;
    }
  },
  
  // Get Word Search puzzle bank
  getPuzzleBank: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/wordsearch/bank`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching Word Search bank:', error);
      throw error;
    }
  },
  
  // Get rotation status
  getRotationStatus: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/wordsearch/rotation/status`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching rotation status:', error);
      throw error;
    }
  },
  
  // Validate Word Search puzzle
  validatePuzzle: async (puzzleData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/wordsearch/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(puzzleData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error validating Word Search puzzle:', error);
      throw error;
    }
  },
  
  // Create backup
  createBackup: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/wordsearch/backup`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating Word Search backup:', error);
      throw error;
    }
  },
  
  // Get analytics
  getAnalytics: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/wordsearch/analytics`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching Word Search analytics:', error);
      throw error;
    }
  },
  
  // Health check
  healthCheck: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/wordsearch/health`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error checking Word Search API health:', error);
      throw error;
    }
  }
};

// Hybrid loader for Word Search puzzles
export const hybridWordSearchLoader = {
  // Load today's puzzle with fallback strategy
  loadTodaysPuzzle: async () => {
    try {
      // Try API first
      return await wordsearchAPI.getTodaysPuzzle();
    } catch (apiError) {
      console.warn('API failed, trying local rotation:', apiError);
      
      try {
        // Fallback to local rotation system
        const { getTodaysWordSearch } = await import('./wordsearchRotation');
        return await getTodaysWordSearch();
      } catch (localError) {
        console.error('Local rotation also failed:', localError);
        
        // Final fallback to cached data
        const cached = localStorage.getItem('dpp_current_wordsearch');
        if (cached) {
          return JSON.parse(cached);
        }
        
        throw new Error('All Word Search loading methods failed');
      }
    }
  },
  
  // Load puzzle for specific date with fallback
  loadPuzzleForDate: async (dateString) => {
    try {
      // Try API first
      return await wordsearchAPI.getPuzzleForDate(dateString);
    } catch (apiError) {
      console.warn('API failed, trying local rotation:', apiError);
      
      try {
        // Fallback to local rotation system
        const { getWordSearchForDate } = await import('./wordsearchRotation');
        return await getWordSearchForDate(dateString);
      } catch (localError) {
        console.error('Local rotation also failed:', localError);
        throw new Error(`Failed to load Word Search for date ${dateString}`);
      }
    }
  }
};

// Word Search analytics tracking
export const wordsearchAnalytics = {
  // Track puzzle load
  trackPuzzleLoad: (puzzle) => {
    try {
      const event = {
        type: 'wordsearch_loaded',
        timestamp: new Date().toISOString(),
        puzzle_id: puzzle.id,
        theme: puzzle.theme,
        difficulty: puzzle.difficulty,
        word_count: puzzle.words.length,
        date: puzzle.date
      };
      
      // Store in localStorage for analytics
      const events = JSON.parse(localStorage.getItem('dpp_wordsearch_events') || '[]');
      events.push(event);
      
      // Keep only last 100 events
      if (events.length > 100) {
        events.splice(0, events.length - 100);
      }
      
      localStorage.setItem('dpp_wordsearch_events', JSON.stringify(events));
      
      // Also track with main analytics if available
      if (window.trackEvent) {
        window.trackEvent('wordsearch_loaded', {
          puzzle_id: puzzle.id,
          theme: puzzle.theme,
          difficulty: puzzle.difficulty,
          word_count: puzzle.words.length
        });
      }
    } catch (error) {
      console.error('Error tracking Word Search puzzle load:', error);
    }
  },
  
  // Track word found
  trackWordFound: (word, puzzle, totalFound) => {
    try {
      const event = {
        type: 'wordsearch_word_found',
        timestamp: new Date().toISOString(),
        word: word,
        word_length: word.length,
        puzzle_id: puzzle.id,
        theme: puzzle.theme,
        total_found: totalFound,
        total_words: puzzle.words.length
      };
      
      const events = JSON.parse(localStorage.getItem('dpp_wordsearch_events') || '[]');
      events.push(event);
      
      if (events.length > 100) {
        events.splice(0, events.length - 100);
      }
      
      localStorage.setItem('dpp_wordsearch_events', JSON.stringify(events));
      
      if (window.trackEvent) {
        window.trackEvent('wordsearch_word_found', {
          word: word,
          theme: puzzle.theme,
          word_length: word.length,
          total_found: totalFound
        });
      }
    } catch (error) {
      console.error('Error tracking Word Search word found:', error);
    }
  },
  
  // Track puzzle completion
  trackPuzzleCompletion: (puzzle, completionTime, hintsUsed) => {
    try {
      const event = {
        type: 'wordsearch_completed',
        timestamp: new Date().toISOString(),
        puzzle_id: puzzle.id,
        theme: puzzle.theme,
        difficulty: puzzle.difficulty,
        word_count: puzzle.words.length,
        completion_time: completionTime,
        hints_used: hintsUsed,
        date: puzzle.date
      };
      
      const events = JSON.parse(localStorage.getItem('dpp_wordsearch_events') || '[]');
      events.push(event);
      
      if (events.length > 100) {
        events.splice(0, events.length - 100);
      }
      
      localStorage.setItem('dpp_wordsearch_events', JSON.stringify(events));
      
      if (window.trackEvent) {
        window.trackEvent('wordsearch_completed', {
          theme: puzzle.theme,
          difficulty: puzzle.difficulty,
          word_count: puzzle.words.length,
          completion_time: completionTime,
          hints_used: hintsUsed
        });
      }
    } catch (error) {
      console.error('Error tracking Word Search completion:', error);
    }
  },
  
  // Get analytics summary
  getAnalyticsSummary: () => {
    try {
      const events = JSON.parse(localStorage.getItem('dpp_wordsearch_events') || '[]');
      
      const summary = {
        total_events: events.length,
        puzzles_loaded: events.filter(e => e.type === 'wordsearch_loaded').length,
        words_found: events.filter(e => e.type === 'wordsearch_word_found').length,
        puzzles_completed: events.filter(e => e.type === 'wordsearch_completed').length,
        themes_played: [...new Set(events.map(e => e.theme).filter(Boolean))],
        average_completion_time: 0,
        total_hints_used: 0
      };
      
      const completedPuzzles = events.filter(e => e.type === 'wordsearch_completed');
      if (completedPuzzles.length > 0) {
        summary.average_completion_time = completedPuzzles.reduce((sum, e) => sum + (e.completion_time || 0), 0) / completedPuzzles.length;
        summary.total_hints_used = completedPuzzles.reduce((sum, e) => sum + (e.hints_used || 0), 0);
      }
      
      return summary;
    } catch (error) {
      console.error('Error getting Word Search analytics summary:', error);
      return null;
    }
  }
};

// Lindy.ai helpers for Word Search automation
export const wordsearchLindyHelpers = {
  // Generate Word Search puzzle prompt for Lindy
  generatePuzzlePrompt: (theme, difficulty = 'medium') => {
    const difficultySpecs = {
      easy: { words: '10-12', time: '5-10 minutes' },
      medium: { words: '12-15', time: '8-15 minutes' },
      hard: { words: '15-18', time: '12-20 minutes' },
      expert: { words: '18-20', time: '15-25 minutes' }
    };
    
    const spec = difficultySpecs[difficulty] || difficultySpecs.medium;
    
    return `Generate a ${difficulty} difficulty Word Search puzzle with theme "${theme}" containing ${spec.words} words, place horizontally/vertically/diagonally in a 15x15 grid. Return in JSON format:
{
  "theme": "${theme}",
  "difficulty": "${difficulty}",
  "size": "15x15",
  "words": [array of ${spec.words} words related to ${theme}],
  "grid": [15x15 letter grid with words placed],
  "positions": [word coordinates and directions],
  "estimated_time": "${spec.time}"
}

Ensure all words are placed in the grid and can be found horizontally, vertically, or diagonally (forward or backward). Fill empty spaces with random letters.`;
  },
  
  // Validate Lindy-generated puzzle
  validateLindyPuzzle: async (puzzleData) => {
    try {
      return await wordsearchAPI.validatePuzzle(puzzleData);
    } catch (error) {
      // Fallback to local validation
      const { validateWordSearchPuzzle } = await import('./wordsearchRotation');
      return validateWordSearchPuzzle(puzzleData);
    }
  },
  
  // Inject Lindy-generated puzzle
  injectLindyPuzzle: async (puzzleData) => {
    try {
      return await wordsearchAPI.injectPuzzle(puzzleData);
    } catch (error) {
      console.error('Failed to inject Lindy puzzle via API:', error);
      throw error;
    }
  },
  
  // Get current rotation status for Lindy
  getRotationStatusForLindy: async () => {
    try {
      return await wordsearchAPI.getRotationStatus();
    } catch (error) {
      // Fallback to local rotation status
      const { getRotationStatus } = await import('./wordsearchRotation');
      return getRotationStatus();
    }
  },
  
  // Get analytics for Lindy optimization
  getAnalyticsForLindy: async () => {
    try {
      const apiAnalytics = await wordsearchAPI.getAnalytics();
      const localAnalytics = wordsearchAnalytics.getAnalyticsSummary();
      
      return {
        api: apiAnalytics,
        local: localAnalytics,
        combined: {
          ...apiAnalytics,
          local_events: localAnalytics
        }
      };
    } catch (error) {
      console.error('Error getting analytics for Lindy:', error);
      return {
        local: wordsearchAnalytics.getAnalyticsSummary()
      };
    }
  }
};

// Export default API object
export default wordsearchAPI;

