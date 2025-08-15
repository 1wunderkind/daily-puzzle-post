// Sudoku rotation logic for Daily Puzzle Post
// Matches the same pattern as crossword and hangman rotation systems

// Launch date for rotation calculation (August 19, 2025)
const LAUNCH_DATE = new Date('2025-08-19');

/**
 * Calculate which Sudoku puzzle to show based on current date
 * Uses same rotation logic as crossword and hangman
 */
export const calculateSudokuRotation = (targetDate = null) => {
  try {
    const today = targetDate ? new Date(targetDate) : new Date();
    const timeDiff = today.getTime() - LAUNCH_DATE.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
    
    // Use modulo 30 for 30-day rotation cycle
    const puzzleIndex = ((daysDiff % 30) + 30) % 30; // Handle negative numbers
    const puzzleId = puzzleIndex + 1; // 1-based indexing
    
    return {
      puzzleId: `sudoku_${puzzleId.toString().padStart(2, '0')}`,
      puzzleNumber: puzzleId,
      daysSinceLaunch: daysDiff,
      rotationCycle: Math.floor(daysDiff / 30) + 1,
      date: today.toISOString().split('T')[0],
      isToday: !targetDate || today.toDateString() === new Date().toDateString()
    };
  } catch (error) {
    console.error('Error calculating Sudoku rotation:', error);
    // Fallback to puzzle 1
    return {
      puzzleId: 'sudoku_01',
      puzzleNumber: 1,
      daysSinceLaunch: 0,
      rotationCycle: 1,
      date: new Date().toISOString().split('T')[0],
      isToday: true,
      error: error.message
    };
  }
};

/**
 * Load today's Sudoku puzzle with hybrid API/local approach
 */
export const loadTodaysSudoku = async () => {
  try {
    const rotation = calculateSudokuRotation();
    
    // Try API first (for Lindy.ai integration)
    try {
      const response = await fetch('/api/sudoku/today');
      if (response.ok) {
        const apiData = await response.json();
        return {
          ...apiData,
          source: 'api',
          rotation: rotation
        };
      }
    } catch (apiError) {
      console.log('API not available, using local rotation');
    }
    
    // Fallback to local file system
    const puzzleFile = `/sudoku/bank/${rotation.puzzleId}.json`;
    
    try {
      const response = await fetch(puzzleFile);
      if (response.ok) {
        const puzzleData = await response.json();
        return {
          ...puzzleData,
          source: 'local',
          rotation: rotation
        };
      }
    } catch (localError) {
      console.log('Local file not found, using embedded puzzle');
    }
    
    // Final fallback to embedded puzzle
    return getEmbeddedSudoku(rotation.puzzleNumber);
    
  } catch (error) {
    console.error('Error loading today\'s Sudoku:', error);
    return getEmbeddedSudoku(1);
  }
};

/**
 * Load specific Sudoku puzzle by date
 */
export const loadSudokuByDate = async (date) => {
  try {
    const rotation = calculateSudokuRotation(date);
    
    // Try API first
    try {
      const response = await fetch(`/api/sudoku/date/${date}`);
      if (response.ok) {
        const apiData = await response.json();
        return {
          ...apiData,
          source: 'api',
          rotation: rotation
        };
      }
    } catch (apiError) {
      console.log('API not available for date lookup');
    }
    
    // Fallback to local file
    const puzzleFile = `/sudoku/bank/${rotation.puzzleId}.json`;
    
    try {
      const response = await fetch(puzzleFile);
      if (response.ok) {
        const puzzleData = await response.json();
        return {
          ...puzzleData,
          source: 'local',
          rotation: rotation
        };
      }
    } catch (localError) {
      console.log('Local file not found for date');
    }
    
    // Final fallback
    return getEmbeddedSudoku(rotation.puzzleNumber);
    
  } catch (error) {
    console.error('Error loading Sudoku by date:', error);
    return getEmbeddedSudoku(1);
  }
};

/**
 * Embedded Sudoku puzzles as fallback
 */
const getEmbeddedSudoku = (puzzleNumber) => {
  const puzzles = [
    {
      id: 'sudoku_01',
      difficulty: 'easy',
      given: [
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
    },
    {
      id: 'sudoku_02',
      difficulty: 'medium',
      given: [
        [0, 0, 0, 6, 0, 0, 4, 0, 0],
        [7, 0, 0, 0, 0, 3, 6, 0, 0],
        [0, 0, 0, 0, 9, 1, 0, 8, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 5, 0, 1, 8, 0, 0, 0, 3],
        [0, 0, 0, 3, 0, 6, 0, 4, 5],
        [0, 4, 0, 2, 0, 0, 0, 6, 0],
        [9, 0, 3, 0, 0, 0, 0, 0, 0],
        [0, 2, 0, 0, 0, 0, 1, 0, 0]
      ],
      solution: [
        [1, 3, 8, 6, 7, 2, 4, 5, 9],
        [7, 9, 2, 8, 4, 3, 6, 1, 5],
        [4, 6, 5, 5, 9, 1, 3, 8, 2],
        [3, 1, 4, 9, 2, 8, 5, 7, 6],
        [6, 5, 9, 1, 8, 7, 2, 9, 3],
        [2, 8, 7, 3, 1, 6, 9, 4, 5],
        [8, 4, 1, 2, 3, 9, 7, 6, 4],
        [9, 7, 3, 4, 6, 5, 8, 2, 1],
        [5, 2, 6, 7, 5, 4, 1, 3, 8]
      ]
    }
  ];
  
  const index = ((puzzleNumber - 1) % puzzles.length);
  const puzzle = puzzles[index];
  
  return {
    ...puzzle,
    source: 'embedded',
    theme: `Daily Sudoku #${puzzleNumber}`,
    estimated_time: puzzle.difficulty === 'easy' ? '15-25 minutes' : 
                   puzzle.difficulty === 'medium' ? '25-35 minutes' : '35-50 minutes',
    given_count: puzzle.given.flat().filter(cell => cell !== 0).length,
    created_at: new Date().toISOString(),
    lindy_compatible: true,
    print_friendly: true
  };
};

/**
 * Validate Sudoku solution
 */
export const validateSudoku = (grid) => {
  // Check if grid is complete
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (!grid[row][col] || grid[row][col] < 1 || grid[row][col] > 9) {
        return { valid: false, complete: false };
      }
    }
  }
  
  // Check rows
  for (let row = 0; row < 9; row++) {
    const seen = new Set();
    for (let col = 0; col < 9; col++) {
      const num = grid[row][col];
      if (seen.has(num)) {
        return { valid: false, complete: true, error: `Row ${row + 1} has duplicate ${num}` };
      }
      seen.add(num);
    }
  }
  
  // Check columns
  for (let col = 0; col < 9; col++) {
    const seen = new Set();
    for (let row = 0; row < 9; row++) {
      const num = grid[row][col];
      if (seen.has(num)) {
        return { valid: false, complete: true, error: `Column ${col + 1} has duplicate ${num}` };
      }
      seen.add(num);
    }
  }
  
  // Check 3x3 boxes
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const seen = new Set();
      for (let row = boxRow * 3; row < boxRow * 3 + 3; row++) {
        for (let col = boxCol * 3; col < boxCol * 3 + 3; col++) {
          const num = grid[row][col];
          if (seen.has(num)) {
            return { valid: false, complete: true, error: `Box ${boxRow * 3 + boxCol + 1} has duplicate ${num}` };
          }
          seen.add(num);
        }
      }
    }
  }
  
  return { valid: true, complete: true };
};

/**
 * Get rotation statistics for analytics
 */
export const getSudokuRotationStats = () => {
  const rotation = calculateSudokuRotation();
  
  return {
    currentPuzzle: rotation.puzzleId,
    daysSinceLaunch: rotation.daysSinceLaunch,
    rotationCycle: rotation.rotationCycle,
    totalPuzzlesInBank: 30,
    nextRotationDate: new Date(Date.now() + (30 - (rotation.daysSinceLaunch % 30)) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    systemStatus: 'active'
  };
};

/**
 * Lindy.ai helper functions for automation
 */
export const sudokuLindyHelpers = {
  // Get current rotation info for Lindy monitoring
  getCurrentRotation: () => calculateSudokuRotation(),
  
  // Validate puzzle format for Lindy injection
  validatePuzzleFormat: (puzzleData) => {
    const required = ['id', 'difficulty', 'given', 'solution'];
    const missing = required.filter(field => !puzzleData[field]);
    
    if (missing.length > 0) {
      return { valid: false, errors: [`Missing required fields: ${missing.join(', ')}`] };
    }
    
    // Validate grid format
    if (!Array.isArray(puzzleData.given) || puzzleData.given.length !== 9) {
      return { valid: false, errors: ['Given grid must be 9x9 array'] };
    }
    
    if (!Array.isArray(puzzleData.solution) || puzzleData.solution.length !== 9) {
      return { valid: false, errors: ['Solution grid must be 9x9 array'] };
    }
    
    // Validate solution
    const validation = validateSudoku(puzzleData.solution);
    if (!validation.valid) {
      return { valid: false, errors: [`Invalid solution: ${validation.error}`] };
    }
    
    return { valid: true, errors: [] };
  },
  
  // Generate analytics data for Lindy
  getAnalyticsData: () => ({
    rotation: getSudokuRotationStats(),
    timestamp: new Date().toISOString(),
    system: 'sudoku_rotation'
  })
};

