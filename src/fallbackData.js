// Fallback data for when API is not available (Vercel deployment without backend)

export const fallbackHangmanWord = {
  word: 'PUZZLE',
  hint: 'Something you solve for fun',
  category: 'Games',
  theme: 'Entertainment',
  difficulty: 'medium',
  isDaily: true
};

export const fallbackCrosswordPuzzle = {
  id: 'fallback_crossword',
  title: 'Daily Crossword',
  difficulty: 'medium',
  grid: [
    ['P', 'U', 'Z', 'Z', 'L', 'E'],
    ['', '', '', '', '', ''],
    ['G', 'A', 'M', 'E', 'S', ''],
    ['', '', '', '', '', ''],
    ['W', 'O', 'R', 'D', 'S', '']
  ],
  clues: {
    across: [
      { number: 1, clue: 'Something you solve for fun', answer: 'PUZZLE', startRow: 0, startCol: 0 },
      { number: 3, clue: 'Fun activities', answer: 'GAMES', startRow: 2, startCol: 0 },
      { number: 5, clue: 'Letters that form meaning', answer: 'WORDS', startRow: 4, startCol: 0 }
    ],
    down: [
      { number: 1, clue: 'Brain training activity', answer: 'PUZZLE', startRow: 0, startCol: 0 },
      { number: 2, clue: 'Daily challenge', answer: 'GAME', startRow: 2, startCol: 0 }
    ]
  }
};

export const fallbackSudokuPuzzle = {
  id: 'fallback_sudoku',
  difficulty: 'medium',
  puzzle: [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9]
  ],
  solution: [
    [5, 3, 4, 6, 7, 8, 9, 1, 2],
    [6, 7, 2, 1, 9, 5, 3, 4, 8],
    [1, 9, 8, 3, 4, 2, 5, 6, 7],
    [8, 5, 9, 7, 6, 1, 4, 2, 3],
    [4, 2, 6, 8, 5, 3, 7, 9, 1],
    [7, 1, 3, 9, 2, 4, 8, 5, 6],
    [9, 6, 1, 5, 3, 7, 2, 8, 4],
    [2, 8, 7, 4, 1, 9, 6, 3, 5],
    [3, 4, 5, 2, 8, 6, 1, 7, 9]
  ]
};

export const fallbackWordSearchPuzzle = {
  id: 'fallback_wordsearch',
  theme: 'Word Games',
  difficulty: 'medium',
  grid: [
    ['P', 'U', 'Z', 'Z', 'L', 'E', 'S', 'X'],
    ['W', 'O', 'R', 'D', 'S', 'A', 'M', 'Y'],
    ['G', 'A', 'M', 'E', 'S', 'N', 'E', 'Z'],
    ['H', 'I', 'N', 'T', 'S', 'A', 'M', 'Q'],
    ['B', 'R', 'A', 'I', 'N', 'G', 'O', 'W'],
    ['F', 'U', 'N', 'X', 'Y', 'R', 'A', 'E'],
    ['Q', 'W', 'E', 'R', 'T', 'A', 'M', 'R'],
    ['A', 'S', 'D', 'F', 'G', 'M', 'S', 'T']
  ],
  words: [
    { word: 'PUZZLES', found: false },
    { word: 'WORDS', found: false },
    { word: 'GAMES', found: false },
    { word: 'HINTS', found: false },
    { word: 'BRAIN', found: false },
    { word: 'FUN', found: false }
  ]
};

export const fallbackAnagramPuzzle = {
  id: 'fallback_anagram',
  word: 'PUZZLE',
  scrambled: 'LZEPUZ',
  category: 'Games',
  hint: 'Something you solve for fun',
  difficulty: 'medium'
};

// Check if we're in production without backend API
export const isProductionWithoutAPI = () => {
  return window.location.hostname.includes('vercel.app') || 
         window.location.hostname.includes('netlify.app') ||
         (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1');
};

// Fallback API responses
export const fallbackAPIResponses = {
  '/api/hangman/words/today': () => Promise.resolve({ ok: true, json: () => Promise.resolve(fallbackHangmanWord) }),
  '/api/puzzles/today': () => Promise.resolve({ ok: true, json: () => Promise.resolve(fallbackCrosswordPuzzle) }),
  '/api/sudoku/today': () => Promise.resolve({ ok: true, json: () => Promise.resolve(fallbackSudokuPuzzle) }),
  '/api/wordsearch/today': () => Promise.resolve({ ok: true, json: () => Promise.resolve(fallbackWordSearchPuzzle) }),
  '/api/anagram/today': () => Promise.resolve({ ok: true, json: () => Promise.resolve(fallbackAnagramPuzzle) }),
  '/api/analytics/track': () => Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'tracked' }) })
};

// Override fetch for production deployments without backend
if (isProductionWithoutAPI()) {
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    // Check if this is an API call
    if (typeof url === 'string' && url.startsWith('/api/')) {
      console.log('🔄 Using fallback data for:', url);
      
      // Return fallback response if available
      const fallbackResponse = fallbackAPIResponses[url];
      if (fallbackResponse) {
        return fallbackResponse();
      }
      
      // Default fallback for unknown API calls
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: 'fallback', message: 'API not available in production' })
      });
    }
    
    // Use original fetch for non-API calls
    return originalFetch.apply(this, arguments);
  };
  
  console.log('🎮 Daily Puzzle Post running in fallback mode - all games functional!');
}

