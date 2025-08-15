/**
 * Anagram Rotation System for Daily Puzzle Post
 * Manages 30-day rotation cycle for anagram puzzles
 * Follows the same pattern as other games for consistency
 */

// Launch date for the puzzle platform
const LAUNCH_DATE = new Date('2025-08-19');

/**
 * Calculate which anagram puzzle to show today
 * Uses modulo 30 to cycle through puzzle bank
 */
export const getTodaysAnagramIndex = () => {
  const today = new Date();
  const daysSinceLaunch = Math.floor((today - LAUNCH_DATE) / (1000 * 60 * 60 * 24));
  return (daysSinceLaunch % 30) + 1;
};

/**
 * Get anagram puzzle filename for a given index
 */
export const getAnagramFilename = (index) => {
  return `anagram_${index.toString().padStart(2, '0')}.json`;
};

/**
 * Get today's anagram puzzle filename
 */
export const getTodaysAnagramFile = () => {
  const index = getTodaysAnagramIndex();
  return getAnagramFilename(index);
};

/**
 * Calculate rotation cycle information
 */
export const getRotationInfo = () => {
  const today = new Date();
  const daysSinceLaunch = Math.floor((today - LAUNCH_DATE) / (1000 * 60 * 60 * 24));
  const currentIndex = (daysSinceLaunch % 30) + 1;
  const cycleNumber = Math.floor(daysSinceLaunch / 30) + 1;
  const dayInCycle = (daysSinceLaunch % 30) + 1;
  
  return {
    launchDate: LAUNCH_DATE.toISOString().split('T')[0],
    currentDate: today.toISOString().split('T')[0],
    daysSinceLaunch,
    currentPuzzleIndex: currentIndex,
    cycleNumber,
    dayInCycle,
    totalPuzzlesInBank: 30,
    remainingInCycle: 30 - dayInCycle
  };
};

/**
 * Get anagram puzzle for a specific date
 */
export const getAnagramForDate = (dateString) => {
  const targetDate = new Date(dateString);
  const daysSinceLaunch = Math.floor((targetDate - LAUNCH_DATE) / (1000 * 60 * 60 * 24));
  
  if (daysSinceLaunch < 0) {
    throw new Error('Date is before launch date');
  }
  
  const index = (daysSinceLaunch % 30) + 1;
  return {
    index,
    filename: getAnagramFilename(index),
    date: dateString,
    isToday: dateString === new Date().toISOString().split('T')[0]
  };
};

/**
 * Validate anagram puzzle data structure
 */
export const validateAnagramData = (anagramData) => {
  const requiredFields = [
    'id',
    'originalWord',
    'scrambledWord', 
    'definition',
    'difficulty',
    'category',
    'wordLength'
  ];
  
  const errors = [];
  
  // Check required fields
  requiredFields.forEach(field => {
    if (!anagramData[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });
  
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  
  // Validate word consistency
  const original = anagramData.originalWord.toUpperCase();
  const scrambled = anagramData.scrambledWord.toUpperCase();
  
  if (original.length !== scrambled.length) {
    errors.push('Original and scrambled words must have the same length');
  }
  
  if (original === scrambled) {
    errors.push('Scrambled word must be different from original word');
  }
  
  // Check if letters match
  const originalSorted = original.split('').sort().join('');
  const scrambledSorted = scrambled.split('').sort().join('');
  
  if (originalSorted !== scrambledSorted) {
    errors.push('Scrambled word must contain exactly the same letters as original word');
  }
  
  // Validate word length matches
  if (anagramData.wordLength !== original.length) {
    errors.push('Word length field must match actual word length');
  }
  
  // Validate difficulty
  const validDifficulties = ['easy', 'medium', 'hard'];
  if (!validDifficulties.includes(anagramData.difficulty.toLowerCase())) {
    errors.push('Difficulty must be easy, medium, or hard');
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : null
  };
};

/**
 * Generate scrambled version of a word
 */
export const scrambleWord = (word) => {
  const letters = word.toUpperCase().split('');
  
  // Fisher-Yates shuffle algorithm
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  
  const scrambled = letters.join('');
  
  // Ensure the scrambled word is different from original
  if (scrambled === word.toUpperCase()) {
    // If same, try a simple swap
    if (letters.length >= 2) {
      [letters[0], letters[1]] = [letters[1], letters[0]];
      return letters.join('');
    }
  }
  
  return scrambled;
};

/**
 * Create default anagram puzzle structure
 */
export const createDefaultAnagram = (index, word, definition, category = 'General', difficulty = 'medium') => {
  const originalWord = word.toUpperCase();
  const scrambledWord = scrambleWord(originalWord);
  
  return {
    id: `anagram_${index.toString().padStart(2, '0')}`,
    date: new Date().toISOString().split('T')[0],
    originalWord,
    scrambledWord,
    definition,
    difficulty: difficulty.toLowerCase(),
    category,
    hint: '', // Can be filled in later
    wordLength: originalWord.length,
    estimated_time: getEstimatedTime(originalWord.length, difficulty),
    created_by: 'Daily Puzzle Post',
    version: '1.0'
  };
};

/**
 * Get estimated completion time based on word length and difficulty
 */
const getEstimatedTime = (wordLength, difficulty) => {
  const baseTime = {
    'easy': 1,
    'medium': 2,
    'hard': 3
  };
  
  const lengthMultiplier = Math.max(1, Math.floor(wordLength / 3));
  const totalMinutes = baseTime[difficulty.toLowerCase()] * lengthMultiplier;
  
  return `${totalMinutes}-${totalMinutes + 2} minutes`;
};

/**
 * Get anagram categories with examples
 */
export const getAnagramCategories = () => {
  return [
    {
      name: 'Animals',
      difficulty: 'easy',
      examples: ['CAT', 'DOG', 'BIRD', 'FISH', 'HORSE']
    },
    {
      name: 'Food',
      difficulty: 'easy', 
      examples: ['APPLE', 'BREAD', 'CHEESE', 'PIZZA', 'PASTA']
    },
    {
      name: 'Colors',
      difficulty: 'easy',
      examples: ['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE']
    },
    {
      name: 'Sports',
      difficulty: 'medium',
      examples: ['SOCCER', 'TENNIS', 'GOLF', 'SWIM', 'HOCKEY']
    },
    {
      name: 'Nature',
      difficulty: 'medium',
      examples: ['TREE', 'FLOWER', 'RIVER', 'MOUNTAIN', 'FOREST']
    },
    {
      name: 'Technology',
      difficulty: 'hard',
      examples: ['COMPUTER', 'INTERNET', 'SOFTWARE', 'DATABASE', 'NETWORK']
    },
    {
      name: 'Science',
      difficulty: 'hard',
      examples: ['CHEMISTRY', 'BIOLOGY', 'PHYSICS', 'ASTRONOMY', 'GEOLOGY']
    },
    {
      name: 'Geography',
      difficulty: 'medium',
      examples: ['COUNTRY', 'CITY', 'OCEAN', 'CONTINENT', 'ISLAND']
    }
  ];
};

/**
 * Analytics helper functions
 */
export const getAnagramAnalytics = (puzzleBank) => {
  const analytics = {
    totalPuzzles: puzzleBank.length,
    categories: {},
    difficulties: {},
    wordLengths: [],
    averageWordLength: 0
  };
  
  puzzleBank.forEach(puzzle => {
    // Count categories
    analytics.categories[puzzle.category] = (analytics.categories[puzzle.category] || 0) + 1;
    
    // Count difficulties
    analytics.difficulties[puzzle.difficulty] = (analytics.difficulties[puzzle.difficulty] || 0) + 1;
    
    // Collect word lengths
    analytics.wordLengths.push(puzzle.wordLength);
  });
  
  // Calculate average word length
  if (analytics.wordLengths.length > 0) {
    analytics.averageWordLength = analytics.wordLengths.reduce((sum, length) => sum + length, 0) / analytics.wordLengths.length;
  }
  
  return analytics;
};

export default {
  getTodaysAnagramIndex,
  getAnagramFilename,
  getTodaysAnagramFile,
  getRotationInfo,
  getAnagramForDate,
  validateAnagramData,
  scrambleWord,
  createDefaultAnagram,
  getAnagramCategories,
  getAnagramAnalytics
};

