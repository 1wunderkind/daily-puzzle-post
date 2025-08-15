// Hangman Word Rotation System for Daily Word Games
// Designed for 30-day cycle with Lindy.ai automation support

/**
 * Configuration for Hangman word rotation system
 */
export const HANGMAN_ROTATION_CONFIG = {
  CYCLE_LENGTH: 30, // 30-day rotation cycle
  LAUNCH_DATE: '2025-08-19', // Site launch date for calculation base
  WORD_BANK_PATH: '/words/bank/',
  CURRENT_WORD_PATH: '/words/daily/current.json',
  TIMEZONE: 'America/New_York', // Default timezone for word rotation
  REFRESH_TIME: '00:00', // Time when new word becomes available (midnight)
};

/**
 * Calculate days since launch date
 * @param {string} currentDate - Current date in YYYY-MM-DD format
 * @param {string} launchDate - Launch date in YYYY-MM-DD format
 * @returns {number} - Number of days since launch
 */
export const calculateDaysSinceLaunch = (currentDate = null, launchDate = HANGMAN_ROTATION_CONFIG.LAUNCH_DATE) => {
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
 * Get word index for current day using modulo rotation
 * @param {string} currentDate - Current date in YYYY-MM-DD format
 * @returns {number} - Word index (1-30)
 */
export const getCurrentWordIndex = (currentDate = null) => {
  const daysSinceLaunch = calculateDaysSinceLaunch(currentDate);
  const wordIndex = (daysSinceLaunch % HANGMAN_ROTATION_CONFIG.CYCLE_LENGTH) + 1;
  
  return wordIndex;
};

/**
 * Get word filename for given index
 * @param {number} wordIndex - Word index (1-30)
 * @returns {string} - Word filename
 */
export const getWordFilename = (wordIndex) => {
  const paddedIndex = wordIndex.toString().padStart(2, '0');
  return `word_${paddedIndex}.json`;
};

/**
 * Load word from bank by index
 * @param {number} wordIndex - Word index (1-30)
 * @returns {Promise<Object>} - Word data
 */
export const loadWordFromBank = async (wordIndex) => {
  try {
    const filename = getWordFilename(wordIndex);
    const response = await fetch(`${HANGMAN_ROTATION_CONFIG.WORD_BANK_PATH}${filename}`);
    
    if (!response.ok) {
      throw new Error(`Failed to load word ${filename}: ${response.status}`);
    }
    
    const wordData = await response.json();
    
    // Add rotation metadata
    wordData.rotation = {
      cycleDay: wordIndex,
      totalCycle: HANGMAN_ROTATION_CONFIG.CYCLE_LENGTH,
      loadedAt: new Date().toISOString(),
      isFromBank: true
    };
    
    return wordData;
  } catch (error) {
    console.error('Error loading word from bank:', error);
    throw error;
  }
};

/**
 * Get today's word using hybrid approach (API first, then local)
 * @param {string} currentDate - Optional current date override
 * @returns {Promise<Object>} - Today's word data
 */
export const getTodaysWord = async (currentDate = null) => {
  try {
    // Try API first if available
    if (typeof window !== 'undefined') {
      try {
        const { getTodaysWordAPI } = await import('./hangmanAPI');
        return await getTodaysWordAPI();
      } catch (apiError) {
        console.warn('API unavailable, using local rotation:', apiError);
      }
    }
    
    // Fallback to local rotation logic
    const wordIndex = getCurrentWordIndex(currentDate);
    const word = await loadWordFromBank(wordIndex);
    
    // Update word date to today for display
    const today = currentDate || new Date().toISOString().split('T')[0];
    word.displayDate = today;
    word.originalDate = word.date;
    word.date = today;
    
    // Add today's metadata
    word.todaysInfo = {
      wordIndex,
      daysSinceLaunch: calculateDaysSinceLaunch(currentDate),
      rotationCycle: Math.floor(calculateDaysSinceLaunch(currentDate) / HANGMAN_ROTATION_CONFIG.CYCLE_LENGTH) + 1,
      isToday: true
    };
    
    return word;
  } catch (error) {
    console.error('Error getting today\'s word:', error);
    
    // Fallback to a default word if rotation fails
    return getFallbackWord();
  }
};

/**
 * Get word for specific date
 * @param {string} targetDate - Target date in YYYY-MM-DD format
 * @returns {Promise<Object>} - Word data for the specified date
 */
export const getWordForDate = async (targetDate) => {
  try {
    const wordIndex = getCurrentWordIndex(targetDate);
    const word = await loadWordFromBank(wordIndex);
    
    // Update word metadata for the target date
    word.displayDate = targetDate;
    word.originalDate = word.date;
    word.date = targetDate;
    
    word.dateInfo = {
      wordIndex,
      daysSinceLaunch: calculateDaysSinceLaunch(targetDate),
      rotationCycle: Math.floor(calculateDaysSinceLaunch(targetDate) / HANGMAN_ROTATION_CONFIG.CYCLE_LENGTH) + 1,
      requestedDate: targetDate
    };
    
    return word;
  } catch (error) {
    console.error(`Error getting word for date ${targetDate}:`, error);
    throw error;
  }
};

/**
 * Get next word in rotation
 * @param {string} currentDate - Current date
 * @returns {Promise<Object>} - Next word data
 */
export const getNextWord = async (currentDate = null) => {
  const tomorrow = new Date(currentDate || new Date());
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  return getWordForDate(tomorrowStr);
};

/**
 * Get previous word in rotation
 * @param {string} currentDate - Current date
 * @returns {Promise<Object>} - Previous word data
 */
export const getPreviousWord = async (currentDate = null) => {
  const yesterday = new Date(currentDate || new Date());
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  return getWordForDate(yesterdayStr);
};

/**
 * Get word archive for date range
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<Array>} - Array of word data for the date range
 */
export const getWordArchive = async (startDate, endDate) => {
  const words = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split('T')[0];
    try {
      const word = await getWordForDate(dateStr);
      words.push(word);
    } catch (error) {
      console.warn(`Failed to load word for ${dateStr}:`, error);
    }
  }
  
  return words;
};

/**
 * Fallback word when rotation system fails
 * @returns {Object} - Basic fallback word
 */
export const getFallbackWord = () => {
  return {
    id: 'fallback_word',
    date: new Date().toISOString().split('T')[0],
    dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
    difficulty: 3,
    difficultyLabel: 'Medium',
    theme: 'General Knowledge',
    word: 'PUZZLE',
    hint: 'A challenging problem to solve',
    category: 'General',
    length: 6,
    alternativeWords: ['PUZZLE', 'GAME', 'WORD', 'CHALLENGE', 'BRAIN'],
    metadata: {
      constructor: 'Daily Puzzle Post',
      editor: 'Fallback System',
      copyright: '2025 Daily Puzzle Post',
      estimatedTime: '5-8 minutes',
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
 * Validate word data structure
 * @param {Object} word - Word data to validate
 * @returns {Object} - Validation result with isValid boolean and errors array
 */
export const validateWordData = (word) => {
  const errors = [];
  const required = ['id', 'date', 'word', 'hint', 'category', 'length'];
  
  required.forEach(field => {
    if (!word.hasOwnProperty(field)) {
      errors.push(`Missing required field: ${field}`);
    }
  });
  
  if (word.word) {
    if (typeof word.word !== 'string' || word.word.length === 0) {
      errors.push('Word must be a non-empty string');
    }
    
    if (word.length && word.word.length !== word.length) {
      errors.push(`Word length mismatch: expected ${word.length}, got ${word.word.length}`);
    }
    
    // Check for valid characters (letters only)
    if (!/^[A-Z]+$/.test(word.word)) {
      errors.push('Word must contain only uppercase letters');
    }
  }
  
  if (word.difficulty && (word.difficulty < 1 || word.difficulty > 5)) {
    errors.push('Difficulty must be between 1 and 5');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Cache management for word data
 */
export class WordCache {
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

// Global word cache instance
export const wordCache = new WordCache(10);

/**
 * Get cached word or load from bank
 * @param {number} wordIndex - Word index
 * @returns {Promise<Object>} - Word data
 */
export const getCachedWord = async (wordIndex) => {
  const cacheKey = `word_${wordIndex}`;
  
  let word = wordCache.get(cacheKey);
  if (word) {
    return { ...word }; // Return copy to prevent mutations
  }
  
  word = await loadWordFromBank(wordIndex);
  wordCache.set(cacheKey, word);
  
  return { ...word };
};

/**
 * Preload upcoming words for better performance
 * @param {number} days - Number of days ahead to preload
 */
export const preloadUpcomingWords = async (days = 7) => {
  const promises = [];
  
  for (let i = 0; i < days; i++) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + i);
    const wordIndex = getCurrentWordIndex(futureDate.toISOString().split('T')[0]);
    
    if (!wordCache.has(`word_${wordIndex}`)) {
      promises.push(getCachedWord(wordIndex));
    }
  }
  
  try {
    await Promise.all(promises);
    console.log(`Preloaded ${promises.length} upcoming words`);
  } catch (error) {
    console.warn('Error preloading words:', error);
  }
};

/**
 * Get rotation statistics
 * @returns {Object} - Rotation system statistics
 */
export const getHangmanRotationStats = () => {
  const daysSinceLaunch = calculateDaysSinceLaunch();
  const currentCycle = Math.floor(daysSinceLaunch / HANGMAN_ROTATION_CONFIG.CYCLE_LENGTH) + 1;
  const dayInCycle = (daysSinceLaunch % HANGMAN_ROTATION_CONFIG.CYCLE_LENGTH) + 1;
  
  return {
    daysSinceLaunch,
    currentCycle,
    dayInCycle,
    totalCycles: Math.ceil(daysSinceLaunch / HANGMAN_ROTATION_CONFIG.CYCLE_LENGTH),
    cycleLength: HANGMAN_ROTATION_CONFIG.CYCLE_LENGTH,
    launchDate: HANGMAN_ROTATION_CONFIG.LAUNCH_DATE,
    cacheSize: wordCache.cache.size,
    nextRotationDate: getNextHangmanRotationDate()
  };
};

/**
 * Get date when rotation will cycle back to word 1
 * @returns {string} - Next rotation date in YYYY-MM-DD format
 */
export const getNextHangmanRotationDate = () => {
  const daysSinceLaunch = calculateDaysSinceLaunch();
  const daysUntilNextCycle = HANGMAN_ROTATION_CONFIG.CYCLE_LENGTH - (daysSinceLaunch % HANGMAN_ROTATION_CONFIG.CYCLE_LENGTH);
  
  const nextRotation = new Date();
  nextRotation.setDate(nextRotation.getDate() + daysUntilNextCycle);
  
  return nextRotation.toISOString().split('T')[0];
};

/**
 * Export functions for Lindy.ai automation
 */
export const hangmanAutomationAPI = {
  getCurrentWordIndex,
  getTodaysWord,
  getWordForDate,
  getHangmanRotationStats,
  validateWordData,
  preloadUpcomingWords,
  clearCache: () => wordCache.clear()
};

