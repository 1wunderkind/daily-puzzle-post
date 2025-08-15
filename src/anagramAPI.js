/**
 * Anagram API Client for Daily Puzzle Post
 * Handles communication with the anagram API endpoints
 * Follows the same pattern as other game APIs for consistency
 */

import { getTodaysAnagramIndex, validateAnagramData } from './anagramRotation';

// API base URL - will be set based on environment
const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://your-api-domain.com' 
  : 'http://localhost:5000';

/**
 * Fetch today's anagram puzzle
 */
export const getTodaysAnagram = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/anagram/today`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const anagramData = await response.json();
    
    // Validate the received data
    const validation = validateAnagramData(anagramData);
    if (!validation.valid) {
      console.warn('Invalid anagram data received:', validation.errors);
    }
    
    return anagramData;
    
  } catch (error) {
    console.error('Error fetching today\'s anagram:', error);
    
    // Return fallback data for offline mode
    return getFallbackAnagram();
  }
};

/**
 * Fetch anagram puzzle for a specific date
 */
export const getAnagramForDate = async (dateString) => {
  try {
    const response = await fetch(`${API_BASE}/api/anagram/date/${dateString}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
    
  } catch (error) {
    console.error(`Error fetching anagram for date ${dateString}:`, error);
    throw error;
  }
};

/**
 * Submit new anagram puzzle (for Lindy.ai automation)
 */
export const injectAnagram = async (anagramData) => {
  try {
    // Validate data before sending
    const validation = validateAnagramData(anagramData);
    if (!validation.valid) {
      throw new Error(`Invalid anagram data: ${validation.errors.join(', ')}`);
    }
    
    const response = await fetch(`${API_BASE}/api/anagram/inject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(anagramData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('Error injecting anagram:', error);
    throw error;
  }
};

/**
 * Get all anagrams in the puzzle bank
 */
export const getAnagramBank = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/anagram/bank`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('Error fetching anagram bank:', error);
    throw error;
  }
};

/**
 * Get rotation system status
 */
export const getRotationStatus = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/anagram/rotation/status`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('Error fetching rotation status:', error);
    throw error;
  }
};

/**
 * Validate anagram puzzle data via API
 */
export const validateAnagramViaAPI = async (anagramData) => {
  try {
    const response = await fetch(`${API_BASE}/api/anagram/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(anagramData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('Error validating anagram:', error);
    throw error;
  }
};

/**
 * Generate scrambled word via API
 */
export const generateScramble = async (word) => {
  try {
    const response = await fetch(`${API_BASE}/api/anagram/generate-scramble`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ word })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('Error generating scramble:', error);
    throw error;
  }
};

/**
 * Get available anagram categories
 */
export const getAnagramCategories = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/anagram/categories`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('Error fetching anagram categories:', error);
    throw error;
  }
};

/**
 * Get anagram analytics
 */
export const getAnagramAnalytics = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/anagram/analytics`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('Error fetching anagram analytics:', error);
    throw error;
  }
};

/**
 * Create backup of anagram puzzle bank
 */
export const createAnagramBackup = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/anagram/backup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('Error creating anagram backup:', error);
    throw error;
  }
};

/**
 * Check API health
 */
export const checkAnagramAPIHealth = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/anagram/health`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('Error checking anagram API health:', error);
    return { status: 'unhealthy', error: error.message };
  }
};

/**
 * Fallback anagram data for offline mode
 */
const getFallbackAnagram = () => {
  const fallbackPuzzles = [
    {
      id: 'fallback_01',
      date: new Date().toISOString().split('T')[0],
      originalWord: 'PUZZLE',
      scrambledWord: 'LEZZUP',
      definition: 'A game, toy, or problem designed to test ingenuity or knowledge',
      difficulty: 'medium',
      category: 'Games',
      hint: 'Something you solve for fun',
      wordLength: 6,
      estimated_time: '2-4 minutes',
      created_by: 'Daily Puzzle Post',
      version: '1.0'
    },
    {
      id: 'fallback_02',
      date: new Date().toISOString().split('T')[0],
      originalWord: 'BRAIN',
      scrambledWord: 'NIARB',
      definition: 'The organ of thought and neural coordination',
      difficulty: 'easy',
      category: 'Science',
      hint: 'Think with this',
      wordLength: 5,
      estimated_time: '1-3 minutes',
      created_by: 'Daily Puzzle Post',
      version: '1.0'
    },
    {
      id: 'fallback_03',
      date: new Date().toISOString().split('T')[0],
      originalWord: 'CHALLENGE',
      scrambledWord: 'GELLANCHE',
      definition: 'A call to someone to participate in a competitive situation',
      difficulty: 'hard',
      category: 'General',
      hint: 'A test of ability',
      wordLength: 9,
      estimated_time: '3-6 minutes',
      created_by: 'Daily Puzzle Post',
      version: '1.0'
    }
  ];
  
  // Return a random fallback puzzle
  const randomIndex = Math.floor(Math.random() * fallbackPuzzles.length);
  return fallbackPuzzles[randomIndex];
};

/**
 * Hybrid anagram loader with offline support
 */
export const hybridAnagramLoader = async () => {
  try {
    // Try to load from API first
    const anagramData = await getTodaysAnagram();
    
    // Cache the data for offline use
    localStorage.setItem('dpp_last_anagram', JSON.stringify(anagramData));
    localStorage.setItem('dpp_anagram_cache_date', new Date().toISOString().split('T')[0]);
    
    return anagramData;
    
  } catch (error) {
    console.warn('API unavailable, checking cache:', error);
    
    // Try to load from cache
    const cachedData = localStorage.getItem('dpp_last_anagram');
    const cacheDate = localStorage.getItem('dpp_anagram_cache_date');
    const today = new Date().toISOString().split('T')[0];
    
    if (cachedData && cacheDate === today) {
      console.log('Using cached anagram data');
      return JSON.parse(cachedData);
    }
    
    // Fall back to default puzzle
    console.log('Using fallback anagram data');
    return getFallbackAnagram();
  }
};

/**
 * Anagram Lindy.ai helper functions
 */
export const anagramLindyHelpers = {
  /**
   * Generate anagram puzzle from word and definition
   */
  generatePuzzle: async (word, definition, category = 'General', difficulty = 'medium') => {
    try {
      const scrambleResult = await generateScramble(word);
      
      return {
        originalWord: word.toUpperCase(),
        scrambledWord: scrambleResult.recommended,
        definition,
        category,
        difficulty: difficulty.toLowerCase(),
        hint: '', // Can be filled by Lindy
        wordLength: word.length,
        estimated_time: getEstimatedTime(word.length, difficulty)
      };
      
    } catch (error) {
      console.error('Error generating anagram puzzle:', error);
      throw error;
    }
  },
  
  /**
   * Batch inject multiple anagrams
   */
  batchInject: async (anagrams) => {
    const results = [];
    
    for (const anagram of anagrams) {
      try {
        const result = await injectAnagram(anagram);
        results.push({ success: true, data: result });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }
    
    return results;
  },
  
  /**
   * Get content suggestions for Lindy
   */
  getContentSuggestions: async () => {
    try {
      const categories = await getAnagramCategories();
      const analytics = await getAnagramAnalytics();
      
      return {
        categories: categories.categories,
        analytics,
        suggestions: generateContentSuggestions(analytics)
      };
      
    } catch (error) {
      console.error('Error getting content suggestions:', error);
      throw error;
    }
  }
};

/**
 * Generate content suggestions based on analytics
 */
const generateContentSuggestions = (analytics) => {
  const suggestions = [];
  
  // Suggest categories that are underrepresented
  const totalPuzzles = analytics.total_puzzles || 0;
  const avgPerCategory = totalPuzzles / Object.keys(analytics.categories || {}).length;
  
  Object.entries(analytics.categories || {}).forEach(([category, count]) => {
    if (count < avgPerCategory * 0.8) {
      suggestions.push({
        type: 'category_boost',
        message: `Consider adding more ${category} anagrams`,
        priority: 'medium'
      });
    }
  });
  
  // Suggest difficulty balance
  const difficulties = analytics.difficulties || {};
  const easyCount = difficulties.easy || 0;
  const mediumCount = difficulties.medium || 0;
  const hardCount = difficulties.hard || 0;
  
  if (easyCount < totalPuzzles * 0.3) {
    suggestions.push({
      type: 'difficulty_balance',
      message: 'Add more easy anagrams for beginners',
      priority: 'high'
    });
  }
  
  if (hardCount < totalPuzzles * 0.2) {
    suggestions.push({
      type: 'difficulty_balance',
      message: 'Add more challenging anagrams for experts',
      priority: 'medium'
    });
  }
  
  return suggestions;
};

/**
 * Get estimated completion time
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

export default {
  getTodaysAnagram,
  getAnagramForDate,
  injectAnagram,
  getAnagramBank,
  getRotationStatus,
  validateAnagramViaAPI,
  generateScramble,
  getAnagramCategories,
  getAnagramAnalytics,
  createAnagramBackup,
  checkAnagramAPIHealth,
  hybridAnagramLoader,
  anagramLindyHelpers
};

