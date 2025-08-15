// Puzzle Rotation System for Daily Crossword
// Designed for 30-day cycle with Lindy.ai automation support

/**
 * Configuration for puzzle rotation system
 */
export const ROTATION_CONFIG = {
  CYCLE_LENGTH: 30, // 30-day rotation cycle
  LAUNCH_DATE: '2025-08-19', // Site launch date for calculation base
  PUZZLE_BANK_PATH: '/puzzles/bank/',
  CURRENT_PUZZLE_PATH: '/puzzles/daily/current.json',
  TIMEZONE: 'America/New_York', // Default timezone for puzzle rotation
  REFRESH_TIME: '00:00', // Time when new puzzle becomes available (midnight)
};

/**
 * Calculate days since launch date
 * @param {string} currentDate - Current date in YYYY-MM-DD format
 * @param {string} launchDate - Launch date in YYYY-MM-DD format
 * @returns {number} - Number of days since launch
 */
export const calculateDaysSinceLaunch = (currentDate = null, launchDate = ROTATION_CONFIG.LAUNCH_DATE) => {
  const current = currentDate ? new Date(currentDate) : new Date();
  const launch = new Date(launchDate);
  
  // Reset time to midnight for accurate day calculation
  current.setHours(0, 0, 0, 0);
  launch.setHours(0, 0, 0, 0);
  
  const timeDiff = current.getTime() - launch.getTime();
  const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  
  return Math.max(0, daysDiff); // Ensure non-negative
};

/**
 * Get puzzle index for current day using modulo rotation
 * @param {string} currentDate - Current date in YYYY-MM-DD format
 * @returns {number} - Puzzle index (1-30)
 */
export const getCurrentPuzzleIndex = (currentDate = null) => {
  const daysSinceLaunch = calculateDaysSinceLaunch(currentDate);
  const puzzleIndex = (daysSinceLaunch % ROTATION_CONFIG.CYCLE_LENGTH) + 1;
  
  return puzzleIndex;
};

/**
 * Get puzzle filename for given index
 * @param {number} puzzleIndex - Puzzle index (1-30)
 * @returns {string} - Puzzle filename
 */
export const getPuzzleFilename = (puzzleIndex) => {
  const paddedIndex = puzzleIndex.toString().padStart(2, '0');
  return `puzzle_${paddedIndex}.json`;
};

/**
 * Load puzzle from bank by index
 * @param {number} puzzleIndex - Puzzle index (1-30)
 * @returns {Promise<Object>} - Puzzle data
 */
export const loadPuzzleFromBank = async (puzzleIndex) => {
  try {
    const filename = getPuzzleFilename(puzzleIndex);
    const response = await fetch(`${ROTATION_CONFIG.PUZZLE_BANK_PATH}${filename}`);
    
    if (!response.ok) {
      throw new Error(`Failed to load puzzle ${filename}: ${response.status}`);
    }
    
    const puzzleData = await response.json();
    
    // Add rotation metadata
    puzzleData.rotation = {
      cycleDay: puzzleIndex,
      totalCycle: ROTATION_CONFIG.CYCLE_LENGTH,
      loadedAt: new Date().toISOString(),
      isFromBank: true
    };
    
    return puzzleData;
  } catch (error) {
    console.error('Error loading puzzle from bank:', error);
    throw error;
  }
};

/**
 * Get today's puzzle using hybrid approach (API first, then local)
 * @param {string} currentDate - Optional current date override
 * @returns {Promise<Object>} - Today's puzzle data
 */
export const getTodaysPuzzle = async (currentDate = null) => {
  try {
    // Try API first if available
    if (typeof window !== 'undefined') {
      try {
        const { getTodaysPuzzleAPI } = await import('./puzzleAPI');
        return await getTodaysPuzzleAPI();
      } catch (apiError) {
        console.warn('API unavailable, using local rotation:', apiError);
      }
    }
    
    // Fallback to local rotation logic
    const puzzleIndex = getCurrentPuzzleIndex(currentDate);
    const puzzle = await loadPuzzleFromBank(puzzleIndex);
    
    // Update puzzle date to today for display
    const today = currentDate || new Date().toISOString().split('T')[0];
    puzzle.displayDate = today;
    puzzle.originalDate = puzzle.date;
    puzzle.date = today;
    
    // Add today's metadata
    puzzle.todaysInfo = {
      puzzleIndex,
      daysSinceLaunch: calculateDaysSinceLaunch(currentDate),
      rotationCycle: Math.floor(calculateDaysSinceLaunch(currentDate) / ROTATION_CONFIG.CYCLE_LENGTH) + 1,
      isToday: true
    };
    
    return puzzle;
  } catch (error) {
    console.error('Error getting today\'s puzzle:', error);
    
    // Fallback to a default puzzle if rotation fails
    return getFallbackPuzzle();
  }
};

/**
 * Get puzzle for specific date
 * @param {string} targetDate - Target date in YYYY-MM-DD format
 * @returns {Promise<Object>} - Puzzle data for the specified date
 */
export const getPuzzleForDate = async (targetDate) => {
  try {
    const puzzleIndex = getCurrentPuzzleIndex(targetDate);
    const puzzle = await loadPuzzleFromBank(puzzleIndex);
    
    // Update puzzle metadata for the target date
    puzzle.displayDate = targetDate;
    puzzle.originalDate = puzzle.date;
    puzzle.date = targetDate;
    
    puzzle.dateInfo = {
      puzzleIndex,
      daysSinceLaunch: calculateDaysSinceLaunch(targetDate),
      rotationCycle: Math.floor(calculateDaysSinceLaunch(targetDate) / ROTATION_CONFIG.CYCLE_LENGTH) + 1,
      requestedDate: targetDate
    };
    
    return puzzle;
  } catch (error) {
    console.error(`Error getting puzzle for date ${targetDate}:`, error);
    throw error;
  }
};

/**
 * Get next puzzle in rotation
 * @param {string} currentDate - Current date
 * @returns {Promise<Object>} - Next puzzle data
 */
export const getNextPuzzle = async (currentDate = null) => {
  const tomorrow = new Date(currentDate || new Date());
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  return getPuzzleForDate(tomorrowStr);
};

/**
 * Get previous puzzle in rotation
 * @param {string} currentDate - Current date
 * @returns {Promise<Object>} - Previous puzzle data
 */
export const getPreviousPuzzle = async (currentDate = null) => {
  const yesterday = new Date(currentDate || new Date());
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  return getPuzzleForDate(yesterdayStr);
};

/**
 * Get puzzle archive for date range
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<Array>} - Array of puzzle data for the date range
 */
export const getPuzzleArchive = async (startDate, endDate) => {
  const puzzles = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split('T')[0];
    try {
      const puzzle = await getPuzzleForDate(dateStr);
      puzzles.push(puzzle);
    } catch (error) {
      console.warn(`Failed to load puzzle for ${dateStr}:`, error);
    }
  }
  
  return puzzles;
};

/**
 * Fallback puzzle when rotation system fails
 * @returns {Object} - Basic fallback puzzle
 */
export const getFallbackPuzzle = () => {
  return {
    id: 'fallback_puzzle',
    date: new Date().toISOString().split('T')[0],
    dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
    difficulty: 3,
    difficultyLabel: 'Medium',
    title: 'Daily Crossword',
    theme: 'General Knowledge',
    size: 15,
    grid: Array(15).fill(null).map(() => Array(15).fill('.')),
    solution: Array(15).fill(null).map(() => Array(15).fill('.')),
    numbers: Array(15).fill(null).map(() => Array(15).fill('.')),
    clues: { across: {}, down: {} },
    metadata: {
      constructor: 'Daily Puzzle Post',
      editor: 'Fallback System',
      copyright: '2025 Daily Puzzle Post',
      estimatedTime: '15-20 minutes',
      averageRating: 4.0,
      isFallback: true
    },
    rotation: {
      isFallback: true,
      loadedAt: new Date().toISOString()
    }
  };
};

/**
 * Validate puzzle data structure
 * @param {Object} puzzle - Puzzle data to validate
 * @returns {Object} - Validation result with isValid boolean and errors array
 */
export const validatePuzzleData = (puzzle) => {
  const errors = [];
  const required = ['id', 'date', 'grid', 'solution', 'numbers', 'clues', 'size'];
  
  required.forEach(field => {
    if (!puzzle.hasOwnProperty(field)) {
      errors.push(`Missing required field: ${field}`);
    }
  });
  
  if (puzzle.size && puzzle.grid) {
    if (puzzle.grid.length !== puzzle.size) {
      errors.push(`Grid size mismatch: expected ${puzzle.size}, got ${puzzle.grid.length}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Cache management for puzzle data
 */
export class PuzzleCache {
  constructor(maxSize = 10) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }
  
  get(key) {
    if (this.cache.has(key)) {
      // Move to end (most recently used)
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return null;
  }
  
  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
  
  clear() {
    this.cache.clear();
  }
  
  has(key) {
    return this.cache.has(key);
  }
}

// Global puzzle cache instance
export const puzzleCache = new PuzzleCache(10);

/**
 * Get cached puzzle or load from bank
 * @param {number} puzzleIndex - Puzzle index
 * @returns {Promise<Object>} - Puzzle data
 */
export const getCachedPuzzle = async (puzzleIndex) => {
  const cacheKey = `puzzle_${puzzleIndex}`;
  
  let puzzle = puzzleCache.get(cacheKey);
  if (puzzle) {
    return { ...puzzle }; // Return copy to prevent mutations
  }
  
  puzzle = await loadPuzzleFromBank(puzzleIndex);
  puzzleCache.set(cacheKey, puzzle);
  
  return { ...puzzle };
};

/**
 * Preload upcoming puzzles for better performance
 * @param {number} days - Number of days ahead to preload
 */
export const preloadUpcomingPuzzles = async (days = 7) => {
  const promises = [];
  
  for (let i = 0; i < days; i++) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + i);
    const puzzleIndex = getCurrentPuzzleIndex(futureDate.toISOString().split('T')[0]);
    
    if (!puzzleCache.has(`puzzle_${puzzleIndex}`)) {
      promises.push(getCachedPuzzle(puzzleIndex));
    }
  }
  
  try {
    await Promise.all(promises);
    console.log(`Preloaded ${promises.length} upcoming puzzles`);
  } catch (error) {
    console.warn('Error preloading puzzles:', error);
  }
};

/**
 * Get rotation statistics
 * @returns {Object} - Rotation system statistics
 */
export const getRotationStats = () => {
  const daysSinceLaunch = calculateDaysSinceLaunch();
  const currentCycle = Math.floor(daysSinceLaunch / ROTATION_CONFIG.CYCLE_LENGTH) + 1;
  const dayInCycle = (daysSinceLaunch % ROTATION_CONFIG.CYCLE_LENGTH) + 1;
  
  return {
    daysSinceLaunch,
    currentCycle,
    dayInCycle,
    totalCycles: Math.ceil(daysSinceLaunch / ROTATION_CONFIG.CYCLE_LENGTH),
    cycleLength: ROTATION_CONFIG.CYCLE_LENGTH,
    launchDate: ROTATION_CONFIG.LAUNCH_DATE,
    cacheSize: puzzleCache.cache.size,
    nextRotationDate: getNextRotationDate()
  };
};

/**
 * Get date when rotation will cycle back to puzzle 1
 * @returns {string} - Next rotation date in YYYY-MM-DD format
 */
export const getNextRotationDate = () => {
  const daysSinceLaunch = calculateDaysSinceLaunch();
  const daysUntilNextCycle = ROTATION_CONFIG.CYCLE_LENGTH - (daysSinceLaunch % ROTATION_CONFIG.CYCLE_LENGTH);
  
  const nextRotation = new Date();
  nextRotation.setDate(nextRotation.getDate() + daysUntilNextCycle);
  
  return nextRotation.toISOString().split('T')[0];
};

/**
 * Export functions for Lindy.ai automation
 */
export const automationAPI = {
  getCurrentPuzzleIndex,
  getTodaysPuzzle,
  getPuzzleForDate,
  getRotationStats,
  validatePuzzleData,
  preloadUpcomingPuzzles,
  clearCache: () => puzzleCache.clear()
};

