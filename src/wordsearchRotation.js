// Word Search Rotation Logic for Daily Puzzle Post
// Matches the same pattern as crossword and hangman rotation systems

// Launch date for the rotation system
const LAUNCH_DATE = new Date('2025-08-19'); // August 19, 2025

// Calculate days since launch
export const getDaysSinceLaunch = (date = new Date()) => {
  const targetDate = new Date(date);
  const timeDiff = targetDate.getTime() - LAUNCH_DATE.getTime();
  return Math.floor(timeDiff / (1000 * 3600 * 24));
};

// Get puzzle index for a given date (1-30 cycle)
export const getPuzzleIndex = (date = new Date()) => {
  const daysSince = getDaysSinceLaunch(date);
  return (daysSince % 30) + 1;
};

// Get today's Word Search puzzle
export const getTodaysWordSearch = async () => {
  try {
    const puzzleIndex = getPuzzleIndex();
    const puzzleId = `wordsearch_${puzzleIndex.toString().padStart(2, '0')}`;
    
    // Try to load from local bank first
    const response = await fetch(`/wordsearch/bank/${puzzleId}.json`);
    
    if (response.ok) {
      const puzzle = await response.json();
      
      // Update the date to today
      puzzle.date = new Date().toISOString().split('T')[0];
      puzzle.isToday = true;
      
      // Store as current puzzle
      await storeTodaysPuzzle(puzzle);
      
      return puzzle;
    } else {
      throw new Error(`Failed to load puzzle ${puzzleId}`);
    }
  } catch (error) {
    console.error('Error loading today\'s Word Search:', error);
    
    // Fallback to a default puzzle
    return getDefaultWordSearch();
  }
};

// Get Word Search puzzle for a specific date
export const getWordSearchForDate = async (dateString) => {
  try {
    const date = new Date(dateString);
    const puzzleIndex = getPuzzleIndex(date);
    const puzzleId = `wordsearch_${puzzleIndex.toString().padStart(2, '0')}`;
    
    const response = await fetch(`/wordsearch/bank/${puzzleId}.json`);
    
    if (response.ok) {
      const puzzle = await response.json();
      puzzle.date = dateString;
      puzzle.isToday = dateString === new Date().toISOString().split('T')[0];
      
      return puzzle;
    } else {
      throw new Error(`Failed to load puzzle for date ${dateString}`);
    }
  } catch (error) {
    console.error(`Error loading Word Search for date ${dateString}:`, error);
    return null;
  }
};

// Store today's puzzle in daily folder
const storeTodaysPuzzle = async (puzzle) => {
  try {
    // In a real implementation, this would make an API call
    // For now, we'll store in localStorage as a fallback
    localStorage.setItem('dpp_current_wordsearch', JSON.stringify(puzzle));
    
    // Also store the current puzzle pointer
    const currentPointer = {
      puzzleId: puzzle.id,
      date: puzzle.date,
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem('dpp_wordsearch_current', JSON.stringify(currentPointer));
  } catch (error) {
    console.error('Error storing today\'s Word Search puzzle:', error);
  }
};

// Get default Word Search puzzle (fallback)
const getDefaultWordSearch = () => {
  return {
    id: 'wordsearch_default',
    date: new Date().toISOString().split('T')[0],
    theme: 'Animals',
    difficulty: 'medium',
    size: '15x15',
    words: ['ELEPHANT', 'GIRAFFE', 'TIGER', 'LION', 'ZEBRA', 'MONKEY', 'RABBIT', 'HORSE', 'DOLPHIN', 'WHALE', 'EAGLE', 'PENGUIN'],
    grid: [
      ['E', 'L', 'E', 'P', 'H', 'A', 'N', 'T', 'X', 'M', 'Q', 'W', 'R', 'T', 'Y'],
      ['G', 'I', 'R', 'A', 'F', 'F', 'E', 'Z', 'E', 'B', 'R', 'A', 'S', 'D', 'F'],
      ['T', 'I', 'G', 'E', 'R', 'H', 'J', 'K', 'L', 'O', 'N', 'K', 'E', 'Y', 'U'],
      ['L', 'I', 'O', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
      ['R', 'A', 'B', 'B', 'I', 'T', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
      ['H', 'O', 'R', 'S', 'E', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S'],
      ['D', 'O', 'L', 'P', 'H', 'I', 'N', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'A'],
      ['W', 'H', 'A', 'L', 'E', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'],
      ['E', 'A', 'G', 'L', 'E', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U'],
      ['P', 'E', 'N', 'G', 'U', 'I', 'N', 'V', 'W', 'X', 'Y', 'Z', 'A', 'B', 'C'],
      ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'],
      ['P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'A', 'B', 'C', 'D'],
      ['E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S'],
      ['T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
      ['I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
    ],
    positions: [
      { word: 'ELEPHANT', start: [0, 0], end: [0, 7], direction: [0, 1], positions: [[0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7]] },
      { word: 'GIRAFFE', start: [1, 0], end: [1, 6], direction: [0, 1], positions: [[1,0],[1,1],[1,2],[1,3],[1,4],[1,5],[1,6]] },
      { word: 'TIGER', start: [2, 0], end: [2, 4], direction: [0, 1], positions: [[2,0],[2,1],[2,2],[2,3],[2,4]] },
      { word: 'LION', start: [3, 0], end: [3, 3], direction: [0, 1], positions: [[3,0],[3,1],[3,2],[3,3]] },
      { word: 'ZEBRA', start: [1, 7], end: [1, 11], direction: [0, 1], positions: [[1,7],[1,8],[1,9],[1,10],[1,11]] },
      { word: 'MONKEY', start: [2, 9], end: [2, 14], direction: [0, 1], positions: [[2,9],[2,10],[2,11],[2,12],[2,13],[2,14]] },
      { word: 'RABBIT', start: [4, 0], end: [4, 5], direction: [0, 1], positions: [[4,0],[4,1],[4,2],[4,3],[4,4],[4,5]] },
      { word: 'HORSE', start: [5, 0], end: [5, 4], direction: [0, 1], positions: [[5,0],[5,1],[5,2],[5,3],[5,4]] },
      { word: 'DOLPHIN', start: [6, 0], end: [6, 6], direction: [0, 1], positions: [[6,0],[6,1],[6,2],[6,3],[6,4],[6,5],[6,6]] },
      { word: 'WHALE', start: [7, 0], end: [7, 4], direction: [0, 1], positions: [[7,0],[7,1],[7,2],[7,3],[7,4]] },
      { word: 'EAGLE', start: [8, 0], end: [8, 4], direction: [0, 1], positions: [[8,0],[8,1],[8,2],[8,3],[8,4]] },
      { word: 'PENGUIN', start: [9, 0], end: [9, 6], direction: [0, 1], positions: [[9,0],[9,1],[9,2],[9,3],[9,4],[9,5],[9,6]] }
    ],
    estimated_time: '8-15 minutes',
    word_count: 12,
    created_by: 'Daily Puzzle Post Default',
    version: '1.0',
    isDefault: true,
    isToday: true
  };
};

// Get rotation status and statistics
export const getRotationStatus = () => {
  const today = new Date();
  const daysSince = getDaysSinceLaunch(today);
  const currentIndex = getPuzzleIndex(today);
  const cycleNumber = Math.floor(daysSince / 30) + 1;
  const dayInCycle = (daysSince % 30) + 1;
  
  return {
    launchDate: LAUNCH_DATE.toISOString().split('T')[0],
    daysSinceLaunch: daysSince,
    currentPuzzleIndex: currentIndex,
    cycleNumber: cycleNumber,
    dayInCycle: dayInCycle,
    totalCycles: Math.ceil(daysSince / 30),
    nextRotationDate: getNextRotationDate(),
    puzzleBank: {
      totalPuzzles: 30,
      currentPuzzle: currentIndex,
      remaining: 30 - dayInCycle
    }
  };
};

// Get next rotation date (when cycle resets)
const getNextRotationDate = () => {
  const today = new Date();
  const daysSince = getDaysSinceLaunch(today);
  const daysUntilReset = 30 - (daysSince % 30);
  
  const nextReset = new Date(today);
  nextReset.setDate(today.getDate() + daysUntilReset);
  
  return nextReset.toISOString().split('T')[0];
};

// Validate puzzle data structure
export const validateWordSearchPuzzle = (puzzle) => {
  const requiredFields = ['id', 'date', 'theme', 'difficulty', 'size', 'words', 'grid', 'positions'];
  
  for (const field of requiredFields) {
    if (!puzzle[field]) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }
  
  // Validate grid dimensions
  if (!Array.isArray(puzzle.grid) || puzzle.grid.length !== 15) {
    return { valid: false, error: 'Grid must be 15x15 array' };
  }
  
  for (const row of puzzle.grid) {
    if (!Array.isArray(row) || row.length !== 15) {
      return { valid: false, error: 'Each grid row must have 15 columns' };
    }
  }
  
  // Validate words array
  if (!Array.isArray(puzzle.words) || puzzle.words.length === 0) {
    return { valid: false, error: 'Words array must contain at least one word' };
  }
  
  // Validate positions array
  if (!Array.isArray(puzzle.positions) || puzzle.positions.length !== puzzle.words.length) {
    return { valid: false, error: 'Positions array must match words array length' };
  }
  
  // Validate each position
  for (const position of puzzle.positions) {
    if (!position.word || !position.start || !position.end || !position.positions) {
      return { valid: false, error: 'Invalid position data structure' };
    }
    
    if (!puzzle.words.includes(position.word)) {
      return { valid: false, error: `Position word "${position.word}" not found in words array` };
    }
  }
  
  return { valid: true };
};

// Get puzzle statistics
export const getPuzzleStatistics = (puzzle) => {
  if (!puzzle) return null;
  
  const stats = {
    theme: puzzle.theme,
    difficulty: puzzle.difficulty,
    wordCount: puzzle.words.length,
    averageWordLength: puzzle.words.reduce((sum, word) => sum + word.length, 0) / puzzle.words.length,
    longestWord: puzzle.words.reduce((longest, word) => word.length > longest.length ? word : longest, ''),
    shortestWord: puzzle.words.reduce((shortest, word) => word.length < shortest.length ? word : shortest, puzzle.words[0]),
    estimatedTime: puzzle.estimated_time,
    gridSize: puzzle.size,
    totalLetters: 15 * 15,
    wordDirections: getWordDirections(puzzle.positions)
  };
  
  return stats;
};

// Analyze word directions in the puzzle
const getWordDirections = (positions) => {
  const directions = {
    horizontal: 0,
    vertical: 0,
    diagonal: 0
  };
  
  for (const position of positions) {
    const [dr, dc] = position.direction;
    
    if (dr === 0) {
      directions.horizontal++;
    } else if (dc === 0) {
      directions.vertical++;
    } else {
      directions.diagonal++;
    }
  }
  
  return directions;
};

// Cache management for Word Search puzzles
export const wordSearchCache = {
  // Cache key prefix
  keyPrefix: 'dpp_wordsearch_',
  
  // Store puzzle in cache
  storePuzzle: (puzzleId, puzzle) => {
    try {
      const key = `${wordSearchCache.keyPrefix}${puzzleId}`;
      localStorage.setItem(key, JSON.stringify(puzzle));
      
      // Update cache index
      const cacheIndex = wordSearchCache.getCacheIndex();
      cacheIndex[puzzleId] = {
        cached: Date.now(),
        size: JSON.stringify(puzzle).length
      };
      localStorage.setItem(`${wordSearchCache.keyPrefix}index`, JSON.stringify(cacheIndex));
    } catch (error) {
      console.error('Error storing Word Search puzzle in cache:', error);
    }
  },
  
  // Retrieve puzzle from cache
  getPuzzle: (puzzleId) => {
    try {
      const key = `${wordSearchCache.keyPrefix}${puzzleId}`;
      const cached = localStorage.getItem(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error retrieving Word Search puzzle from cache:', error);
      return null;
    }
  },
  
  // Get cache index
  getCacheIndex: () => {
    try {
      const index = localStorage.getItem(`${wordSearchCache.keyPrefix}index`);
      return index ? JSON.parse(index) : {};
    } catch (error) {
      console.error('Error retrieving Word Search cache index:', error);
      return {};
    }
  },
  
  // Clear old cache entries
  clearOldCache: (maxAge = 7 * 24 * 60 * 60 * 1000) => { // 7 days default
    try {
      const cacheIndex = wordSearchCache.getCacheIndex();
      const now = Date.now();
      
      for (const [puzzleId, info] of Object.entries(cacheIndex)) {
        if (now - info.cached > maxAge) {
          localStorage.removeItem(`${wordSearchCache.keyPrefix}${puzzleId}`);
          delete cacheIndex[puzzleId];
        }
      }
      
      localStorage.setItem(`${wordSearchCache.keyPrefix}index`, JSON.stringify(cacheIndex));
    } catch (error) {
      console.error('Error clearing old Word Search cache:', error);
    }
  }
};

// Initialize rotation system
export const initializeWordSearchRotation = () => {
  // Clear old cache on initialization
  wordSearchCache.clearOldCache();
  
  // Log rotation status
  const status = getRotationStatus();
  console.log('Word Search Rotation System Initialized:', status);
  
  return status;
};

// Export for Lindy.ai automation
export const wordSearchLindyHelpers = {
  // Get current puzzle for AI analysis
  getCurrentPuzzle: getTodaysWordSearch,
  
  // Get puzzle for specific date
  getPuzzleForDate: getWordSearchForDate,
  
  // Validate puzzle structure
  validatePuzzle: validateWordSearchPuzzle,
  
  // Get rotation statistics
  getRotationStats: getRotationStatus,
  
  // Get puzzle analytics
  getPuzzleAnalytics: getPuzzleStatistics,
  
  // Cache management
  cacheManager: wordSearchCache
};

export default {
  getTodaysWordSearch,
  getWordSearchForDate,
  getRotationStatus,
  validateWordSearchPuzzle,
  getPuzzleStatistics,
  initializeWordSearchRotation,
  wordSearchLindyHelpers
};

