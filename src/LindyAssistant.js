// Lindy.ai Assistant for Crossword Puzzle Creation
// Provides AI assistance for clue generation, puzzle validation, and content moderation

const LINDY_API_BASE = 'http://localhost:5000'; // Flask API base URL

// Lindy.ai Assistant API
export const lindyAssistant = {
  // Generate crossword clues using Lindy.ai
  generateClues: async (wordList, difficulty = 'medium', theme = null) => {
    try {
      const prompt = createClueGenerationPrompt(wordList, difficulty, theme);
      
      const response = await fetch(`${LINDY_API_BASE}/api/lindy/generate-clues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          words: wordList,
          difficulty: difficulty,
          theme: theme,
          prompt: prompt,
          format: 'newspaper_style'
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.clues;
      
    } catch (error) {
      console.error('Error generating clues with Lindy:', error);
      
      // Fallback to local clue generation
      return await generateCluesLocally(wordList, difficulty);
    }
  },
  
  // Validate puzzle quality using Lindy.ai
  validatePuzzle: async (puzzleData) => {
    try {
      const response = await fetch(`${LINDY_API_BASE}/api/lindy/validate-puzzle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          puzzle: puzzleData,
          validation_type: 'crossword',
          check_difficulty: true,
          check_appropriateness: true
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.error('Error validating puzzle with Lindy:', error);
      
      // Fallback to local validation
      return validatePuzzleLocally(puzzleData);
    }
  },
  
  // Fill remaining squares using Lindy.ai
  fillRemainingSquares: async (gridData, existingWords) => {
    try {
      const response = await fetch(`${LINDY_API_BASE}/api/lindy/fill-grid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grid: gridData,
          existing_words: existingWords,
          fill_strategy: 'common_words',
          maintain_difficulty: true
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.error('Error filling grid with Lindy:', error);
      
      // Fallback to local grid filling
      return fillGridLocally(gridData, existingWords);
    }
  },
  
  // Moderate user-submitted content
  moderateContent: async (puzzleData) => {
    try {
      const response = await fetch(`${LINDY_API_BASE}/api/lindy/moderate-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          puzzle: puzzleData,
          check_inappropriate: true,
          check_offensive: true,
          check_copyright: true,
          family_friendly: true
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.error('Error moderating content with Lindy:', error);
      
      // Fallback to basic local moderation
      return moderateContentLocally(puzzleData);
    }
  },
  
  // Get puzzle suggestions based on current trends
  getPuzzleSuggestions: async (userPreferences = {}) => {
    try {
      const response = await fetch(`${LINDY_API_BASE}/api/lindy/puzzle-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferences: userPreferences,
          suggestion_type: 'crossword',
          include_themes: true,
          include_words: true
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.error('Error getting puzzle suggestions from Lindy:', error);
      
      // Fallback to local suggestions
      return getLocalPuzzleSuggestions(userPreferences);
    }
  }
};

// Create clue generation prompt for Lindy.ai
const createClueGenerationPrompt = (wordList, difficulty, theme) => {
  const difficultyInstructions = {
    easy: 'Use simple, direct clues that most people would know. Avoid wordplay or obscure references.',
    medium: 'Use moderately challenging clues with some wordplay. Include common knowledge and mild cultural references.',
    hard: 'Use challenging clues with wordplay, puns, and cultural references. Can include more obscure knowledge.'
  };
  
  const basePrompt = `Generate newspaper-style crossword clues for these words: ${wordList.join(', ')}.

REQUIREMENTS:
- Difficulty level: ${difficulty} (${difficultyInstructions[difficulty]})
- Style: Classic newspaper crossword (like NY Times or local paper)
- Family-friendly content only
- No offensive, inappropriate, or copyrighted material
- Clues should be 2-8 words long
- Return in JSON format: {"WORD": "clue", ...}

${theme ? `THEME: ${theme} - Try to relate clues to this theme when possible.` : ''}

EXAMPLES:
- CAT: "Feline pet"
- HOUSE: "Place to call home"
- MUSIC: "Sounds in harmony"

Generate clues now:`;

  return basePrompt;
};

// Local fallback clue generation
const generateCluesLocally = async (wordList, difficulty) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const clueDatabase = {
    // Common words with difficulty-appropriate clues
    'CAT': {
      easy: 'Pet that meows',
      medium: 'Feline companion',
      hard: 'Whiskers and purrs'
    },
    'DOG': {
      easy: 'Pet that barks',
      medium: 'Man\'s best friend',
      hard: 'Canine companion'
    },
    'HOUSE': {
      easy: 'Place to live',
      medium: 'Home dwelling',
      hard: 'Domestic structure'
    },
    'TREE': {
      easy: 'Tall plant',
      medium: 'Woody plant',
      hard: 'Photosynthetic giant'
    },
    'BOOK': {
      easy: 'Thing to read',
      medium: 'Reading material',
      hard: 'Bound pages of text'
    },
    'WATER': {
      easy: 'Clear liquid',
      medium: 'H2O',
      hard: 'Life-sustaining liquid'
    },
    'FIRE': {
      easy: 'Hot flame',
      medium: 'Burning element',
      hard: 'Combustion phenomenon'
    },
    'LIGHT': {
      easy: 'Not dark',
      medium: 'Illumination',
      hard: 'Electromagnetic radiation'
    },
    'MUSIC': {
      easy: 'Nice sounds',
      medium: 'Sounds in harmony',
      hard: 'Melodic composition'
    },
    'DANCE': {
      easy: 'Move to music',
      medium: 'Rhythmic movement',
      hard: 'Choreographed motion'
    }
  };
  
  const result = {};
  
  wordList.forEach(word => {
    const upperWord = word.toUpperCase();
    if (clueDatabase[upperWord]) {
      result[upperWord] = clueDatabase[upperWord][difficulty] || clueDatabase[upperWord].medium;
    } else {
      // Generate generic clue
      result[upperWord] = generateGenericClue(upperWord, difficulty);
    }
  });
  
  return result;
};

// Generate generic clue for unknown words
const generateGenericClue = (word, difficulty) => {
  const length = word.length;
  
  const templates = {
    easy: [
      `${length}-letter word`,
      `Word with ${length} letters`,
      `${length} letters long`
    ],
    medium: [
      `${length}-letter answer`,
      `Word of ${length} letters`,
      `${length}-character solution`
    ],
    hard: [
      `${length}-letter puzzle`,
      `${length}-character enigma`,
      `Solution with ${length} letters`
    ]
  };
  
  const templateList = templates[difficulty] || templates.medium;
  return templateList[Math.floor(Math.random() * templateList.length)];
};

// Local puzzle validation
const validatePuzzleLocally = async (puzzleData) => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const validation = {
    isValid: true,
    score: 0,
    issues: [],
    suggestions: [],
    difficulty_assessment: 'medium'
  };
  
  // Check word count
  const wordCount = puzzleData.words || 0;
  if (wordCount < 10) {
    validation.issues.push('Puzzle should have at least 10 words');
    validation.score -= 20;
  } else if (wordCount > 30) {
    validation.suggestions.push('Consider reducing word count for better solving experience');
  }
  
  // Check grid symmetry
  if (!puzzleData.hasSymmetry) {
    validation.issues.push('Puzzle lacks rotational symmetry');
    validation.score -= 15;
  }
  
  // Check connectivity
  if (!puzzleData.isConnected) {
    validation.issues.push('All words should be connected');
    validation.score -= 25;
  }
  
  // Check clue quality
  const clueCount = (puzzleData.clues?.across ? Object.keys(puzzleData.clues.across).length : 0) +
                   (puzzleData.clues?.down ? Object.keys(puzzleData.clues.down).length : 0);
  
  if (clueCount < wordCount) {
    validation.issues.push(`Missing ${wordCount - clueCount} clues`);
    validation.score -= 10;
  }
  
  // Calculate final score
  validation.score = Math.max(0, 100 + validation.score);
  validation.isValid = validation.score >= 70;
  
  // Assess difficulty
  if (validation.score >= 90) {
    validation.difficulty_assessment = 'excellent';
  } else if (validation.score >= 80) {
    validation.difficulty_assessment = 'good';
  } else if (validation.score >= 70) {
    validation.difficulty_assessment = 'acceptable';
  } else {
    validation.difficulty_assessment = 'needs_improvement';
  }
  
  return validation;
};

// Local grid filling
const fillGridLocally = async (gridData, existingWords) => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Simple word list for filling
  const commonWords = [
    'THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER', 'WAS', 'ONE',
    'OUR', 'HAD', 'BY', 'HOT', 'WORD', 'WHAT', 'SOME', 'WE', 'IT', 'DO', 'CAN', 'OUT',
    'OTHER', 'WERE', 'WHICH', 'THEIR', 'TIME', 'WILL', 'HOW', 'SAID', 'EACH', 'SHE',
    'TWO', 'MORE', 'VERY', 'WHAT', 'KNOW', 'JUST', 'FIRST', 'GET', 'OVER', 'THINK',
    'ALSO', 'YOUR', 'WORK', 'LIFE', 'ONLY', 'CAN', 'STILL', 'SHOULD', 'AFTER', 'BEING'
  ];
  
  return {
    success: true,
    filled_words: commonWords.slice(0, 5), // Return first 5 as example
    suggestions: [
      'Consider using common 3-4 letter words for better flow',
      'Avoid proper nouns unless theme-appropriate',
      'Balance vowels and consonants for better solving'
    ]
  };
};

// Local content moderation
const moderateContentLocally = async (puzzleData) => {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Basic inappropriate word list (simplified)
  const inappropriateWords = ['DAMN', 'HELL', 'HATE', 'KILL', 'DEATH'];
  
  const moderation = {
    approved: true,
    confidence: 0.95,
    issues: [],
    warnings: [],
    family_friendly: true
  };
  
  // Check words and clues for inappropriate content
  const allText = JSON.stringify(puzzleData).toUpperCase();
  
  inappropriateWords.forEach(word => {
    if (allText.includes(word)) {
      moderation.issues.push(`Contains potentially inappropriate word: ${word}`);
      moderation.approved = false;
      moderation.family_friendly = false;
    }
  });
  
  // Check for excessive difficulty
  if (puzzleData.difficulty === 'expert') {
    moderation.warnings.push('Very difficult puzzle - may not be suitable for general audience');
  }
  
  return moderation;
};

// Local puzzle suggestions
const getLocalPuzzleSuggestions = async (userPreferences) => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const themes = [
    'Animals', 'Food & Cooking', 'Travel', 'Sports', 'Movies', 'Books',
    'Science', 'History', 'Geography', 'Music', 'Art', 'Nature',
    'Technology', 'Holidays', 'Family', 'Weather', 'Transportation'
  ];
  
  const wordSuggestions = {
    'Animals': ['CAT', 'DOG', 'BIRD', 'FISH', 'LION', 'BEAR', 'WOLF', 'DEER'],
    'Food': ['CAKE', 'BREAD', 'SOUP', 'RICE', 'MEAT', 'FRUIT', 'MILK', 'EGGS'],
    'Travel': ['PLANE', 'TRAIN', 'HOTEL', 'BEACH', 'CITY', 'ROAD', 'MAP', 'TRIP'],
    'Sports': ['BALL', 'GAME', 'TEAM', 'WIN', 'PLAY', 'GOAL', 'RACE', 'SWIM']
  };
  
  const randomTheme = themes[Math.floor(Math.random() * themes.length)];
  
  return {
    suggested_themes: themes.slice(0, 5),
    featured_theme: randomTheme,
    suggested_words: wordSuggestions[randomTheme] || wordSuggestions['Animals'],
    difficulty_recommendation: userPreferences.skill_level || 'medium',
    trending_topics: ['Current Events', 'Pop Culture', 'Science News']
  };
};

// Lindy.ai integration helpers
export const lindyIntegrationHelpers = {
  // Create Lindy prompt for clue generation
  createCluePrompt: (words, difficulty, theme) => {
    return createClueGenerationPrompt(words, difficulty, theme);
  },
  
  // Format puzzle data for Lindy processing
  formatPuzzleForLindy: (puzzleData) => {
    return {
      grid: puzzleData.grid,
      clues: puzzleData.clues,
      words: puzzleData.words,
      difficulty: puzzleData.difficulty,
      theme: puzzleData.theme,
      metadata: {
        created_at: new Date().toISOString(),
        format: 'crossword',
        size: `${puzzleData.grid?.length || 15}x${puzzleData.grid?.[0]?.length || 15}`
      }
    };
  },
  
  // Process Lindy response for clues
  processLindyClues: (lindyResponse) => {
    try {
      // Handle different response formats
      if (typeof lindyResponse === 'string') {
        return JSON.parse(lindyResponse);
      }
      
      if (lindyResponse.clues) {
        return lindyResponse.clues;
      }
      
      return lindyResponse;
    } catch (error) {
      console.error('Error processing Lindy clues:', error);
      return {};
    }
  },
  
  // Track Lindy usage for analytics
  trackLindyUsage: (feature, success, metadata = {}) => {
    const usage = {
      feature: feature,
      success: success,
      timestamp: new Date().toISOString(),
      metadata: metadata
    };
    
    // Store in localStorage for analytics
    const usageHistory = JSON.parse(localStorage.getItem('dpp_lindy_usage') || '[]');
    usageHistory.push(usage);
    
    // Keep only last 100 entries
    if (usageHistory.length > 100) {
      usageHistory.splice(0, usageHistory.length - 100);
    }
    
    localStorage.setItem('dpp_lindy_usage', JSON.stringify(usageHistory));
    
    // Also track with main analytics if available
    if (window.trackEvent) {
      window.trackEvent('lindy_usage', {
        feature: feature,
        success: success,
        ...metadata
      });
    }
  }
};

// Export default assistant
export default lindyAssistant;

