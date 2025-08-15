// Crossword Game Logic and Validation Utilities
// Designed for automation-friendly content management and Lindy.ai integration

/**
 * Validates a crossword puzzle structure
 * @param {Object} puzzle - The crossword puzzle object
 * @returns {Object} - Validation result with isValid boolean and errors array
 */
export const validatePuzzleStructure = (puzzle) => {
  const errors = [];
  
  // Check required fields
  const requiredFields = ['id', 'date', 'grid', 'solution', 'numbers', 'clues', 'size'];
  requiredFields.forEach(field => {
    if (!puzzle.hasOwnProperty(field)) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // Validate grid dimensions
  if (puzzle.grid && puzzle.size) {
    if (puzzle.grid.length !== puzzle.size) {
      errors.push(`Grid height (${puzzle.grid.length}) doesn't match size (${puzzle.size})`);
    }
    
    puzzle.grid.forEach((row, index) => {
      if (row.length !== puzzle.size) {
        errors.push(`Grid row ${index} length (${row.length}) doesn't match size (${puzzle.size})`);
      }
    });
  }

  // Validate solution matches grid structure
  if (puzzle.grid && puzzle.solution) {
    for (let row = 0; row < puzzle.size; row++) {
      for (let col = 0; col < puzzle.size; col++) {
        const gridCell = puzzle.grid[row][col];
        const solutionCell = puzzle.solution[row][col];
        
        if (gridCell === '.' && solutionCell !== '.') {
          errors.push(`Mismatch at [${row}][${col}]: grid is black but solution has letter`);
        }
        if (gridCell !== '.' && solutionCell === '.') {
          errors.push(`Mismatch at [${row}][${col}]: grid has letter but solution is black`);
        }
      }
    }
  }

  // Validate clue numbers exist in grid
  if (puzzle.clues && puzzle.numbers) {
    ['across', 'down'].forEach(direction => {
      if (puzzle.clues[direction]) {
        Object.keys(puzzle.clues[direction]).forEach(clueNumber => {
          const number = parseInt(clueNumber);
          let found = false;
          
          for (let row = 0; row < puzzle.size && !found; row++) {
            for (let col = 0; col < puzzle.size && !found; col++) {
              if (puzzle.numbers[row][col] === number) {
                found = true;
              }
            }
          }
          
          if (!found) {
            errors.push(`Clue number ${number} (${direction}) not found in grid`);
          }
        });
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Finds all words in a crossword puzzle
 * @param {Object} puzzle - The crossword puzzle object
 * @returns {Array} - Array of word objects with position, direction, and letters
 */
export const findAllWords = (puzzle) => {
  const words = [];
  
  // Find across words
  for (let row = 0; row < puzzle.size; row++) {
    let wordStart = -1;
    let currentWord = '';
    
    for (let col = 0; col <= puzzle.size; col++) {
      const isBlack = col === puzzle.size || puzzle.grid[row][col] === '.';
      
      if (!isBlack) {
        if (wordStart === -1) {
          wordStart = col;
        }
        currentWord += puzzle.solution[row][col];
      } else {
        if (currentWord.length > 1) {
          const clueNumber = puzzle.numbers[row][wordStart];
          words.push({
            number: clueNumber,
            direction: 'across',
            row,
            col: wordStart,
            length: currentWord.length,
            answer: currentWord,
            clue: puzzle.clues.across[clueNumber] || ''
          });
        }
        wordStart = -1;
        currentWord = '';
      }
    }
  }
  
  // Find down words
  for (let col = 0; col < puzzle.size; col++) {
    let wordStart = -1;
    let currentWord = '';
    
    for (let row = 0; row <= puzzle.size; row++) {
      const isBlack = row === puzzle.size || puzzle.grid[row][col] === '.';
      
      if (!isBlack) {
        if (wordStart === -1) {
          wordStart = row;
        }
        currentWord += puzzle.solution[row][col];
      } else {
        if (currentWord.length > 1) {
          const clueNumber = puzzle.numbers[wordStart][col];
          words.push({
            number: clueNumber,
            direction: 'down',
            row: wordStart,
            col,
            length: currentWord.length,
            answer: currentWord,
            clue: puzzle.clues.down[clueNumber] || ''
          });
        }
        wordStart = -1;
        currentWord = '';
      }
    }
  }
  
  return words.sort((a, b) => a.number - b.number);
};

/**
 * Checks if a user's grid is correct
 * @param {Array} userGrid - The user's filled grid
 * @param {Array} solution - The correct solution grid
 * @returns {Object} - Result with isCorrect boolean and error positions
 */
export const validateUserSolution = (userGrid, solution) => {
  const errors = [];
  const size = solution.length;
  
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (solution[row][col] !== '.') {
        const userLetter = userGrid[row]?.[col] || '';
        const correctLetter = solution[row][col];
        
        if (userLetter !== correctLetter) {
          errors.push({ row, col, expected: correctLetter, actual: userLetter });
        }
      }
    }
  }
  
  return {
    isCorrect: errors.length === 0,
    errors,
    completionPercentage: calculateCompletionPercentage(userGrid, solution)
  };
};

/**
 * Calculates completion percentage of a puzzle
 * @param {Array} userGrid - The user's filled grid
 * @param {Array} solution - The correct solution grid
 * @returns {number} - Completion percentage (0-100)
 */
export const calculateCompletionPercentage = (userGrid, solution) => {
  let totalCells = 0;
  let filledCells = 0;
  
  for (let row = 0; row < solution.length; row++) {
    for (let col = 0; col < solution[row].length; col++) {
      if (solution[row][col] !== '.') {
        totalCells++;
        if (userGrid[row]?.[col]) {
          filledCells++;
        }
      }
    }
  }
  
  return totalCells > 0 ? Math.round((filledCells / totalCells) * 100) : 0;
};

/**
 * Finds the word that contains a specific cell
 * @param {number} row - Row index
 * @param {number} col - Column index
 * @param {string} direction - 'across' or 'down'
 * @param {Object} puzzle - The crossword puzzle object
 * @returns {Object|null} - Word object or null if not found
 */
export const findWordAtPosition = (row, col, direction, puzzle) => {
  const words = findAllWords(puzzle);
  
  return words.find(word => {
    if (word.direction !== direction) return false;
    
    if (direction === 'across') {
      return word.row === row && col >= word.col && col < word.col + word.length;
    } else {
      return word.col === col && row >= word.row && row < word.row + word.length;
    }
  }) || null;
};

/**
 * Gets all cells that are part of a specific word
 * @param {Object} word - Word object from findAllWords
 * @returns {Array} - Array of {row, col} objects
 */
export const getWordCells = (word) => {
  const cells = [];
  
  if (word.direction === 'across') {
    for (let i = 0; i < word.length; i++) {
      cells.push({ row: word.row, col: word.col + i });
    }
  } else {
    for (let i = 0; i < word.length; i++) {
      cells.push({ row: word.row + i, col: word.col });
    }
  }
  
  return cells;
};

/**
 * Checks if a word is completely filled by the user
 * @param {Object} word - Word object from findAllWords
 * @param {Array} userGrid - The user's filled grid
 * @returns {boolean} - True if word is completely filled
 */
export const isWordComplete = (word, userGrid) => {
  const cells = getWordCells(word);
  
  return cells.every(cell => {
    const userLetter = userGrid[cell.row]?.[cell.col];
    return userLetter && userLetter.trim() !== '';
  });
};

/**
 * Checks if a word is correctly filled by the user
 * @param {Object} word - Word object from findAllWords
 * @param {Array} userGrid - The user's filled grid
 * @param {Array} solution - The correct solution grid
 * @returns {boolean} - True if word is correctly filled
 */
export const isWordCorrect = (word, userGrid, solution) => {
  const cells = getWordCells(word);
  
  return cells.every(cell => {
    const userLetter = userGrid[cell.row]?.[cell.col];
    const correctLetter = solution[cell.row][cell.col];
    return userLetter === correctLetter;
  });
};

/**
 * Generates hints for a specific word
 * @param {Object} word - Word object from findAllWords
 * @param {Array} userGrid - The user's filled grid
 * @param {Array} solution - The correct solution grid
 * @returns {Object} - Hint information
 */
export const generateWordHint = (word, userGrid, solution) => {
  const cells = getWordCells(word);
  const unfilledCells = cells.filter(cell => !userGrid[cell.row]?.[cell.col]);
  const incorrectCells = cells.filter(cell => {
    const userLetter = userGrid[cell.row]?.[cell.col];
    const correctLetter = solution[cell.row][cell.col];
    return userLetter && userLetter !== correctLetter;
  });
  
  return {
    word,
    totalCells: cells.length,
    filledCells: cells.length - unfilledCells.length,
    correctCells: cells.length - unfilledCells.length - incorrectCells.length,
    unfilledCells,
    incorrectCells,
    isComplete: unfilledCells.length === 0,
    isCorrect: unfilledCells.length === 0 && incorrectCells.length === 0
  };
};

/**
 * Finds the next empty cell in a word
 * @param {Object} word - Word object from findAllWords
 * @param {Array} userGrid - The user's filled grid
 * @param {number} currentRow - Current row position
 * @param {number} currentCol - Current column position
 * @returns {Object|null} - Next empty cell {row, col} or null
 */
export const findNextEmptyCell = (word, userGrid, currentRow, currentCol) => {
  const cells = getWordCells(word);
  const currentIndex = cells.findIndex(cell => cell.row === currentRow && cell.col === currentCol);
  
  if (currentIndex === -1) return null;
  
  // Look forward from current position
  for (let i = currentIndex + 1; i < cells.length; i++) {
    const cell = cells[i];
    if (!userGrid[cell.row]?.[cell.col]) {
      return cell;
    }
  }
  
  // Look from beginning if nothing found forward
  for (let i = 0; i < currentIndex; i++) {
    const cell = cells[i];
    if (!userGrid[cell.row]?.[cell.col]) {
      return cell;
    }
  }
  
  return null;
};

/**
 * Generates puzzle statistics for analytics
 * @param {Object} puzzle - The crossword puzzle object
 * @param {Array} userGrid - The user's filled grid
 * @param {number} timeSpent - Time spent in milliseconds
 * @returns {Object} - Statistics object
 */
export const generatePuzzleStats = (puzzle, userGrid, timeSpent) => {
  const words = findAllWords(puzzle);
  const validation = validateUserSolution(userGrid, puzzle.solution);
  
  const completedWords = words.filter(word => isWordComplete(word, userGrid));
  const correctWords = words.filter(word => isWordCorrect(word, userGrid, puzzle.solution));
  
  return {
    puzzleId: puzzle.id,
    difficulty: puzzle.difficulty,
    theme: puzzle.theme,
    totalWords: words.length,
    completedWords: completedWords.length,
    correctWords: correctWords.length,
    completionPercentage: validation.completionPercentage,
    isFullyCorrect: validation.isCorrect,
    timeSpent,
    averageTimePerWord: words.length > 0 ? timeSpent / words.length : 0,
    errorCount: validation.errors.length,
    acrossWords: words.filter(w => w.direction === 'across').length,
    downWords: words.filter(w => w.direction === 'down').length
  };
};

/**
 * Exports puzzle data for AI automation
 * @param {Object} puzzle - The crossword puzzle object
 * @param {Object} userProgress - User's progress data
 * @returns {Object} - AI-friendly data structure
 */
export const exportForAIAutomation = (puzzle, userProgress = null) => {
  const words = findAllWords(puzzle);
  
  return {
    puzzle_metadata: {
      id: puzzle.id,
      date: puzzle.date,
      difficulty: puzzle.difficulty,
      theme: puzzle.theme,
      size: puzzle.size,
      estimated_time: puzzle.metadata?.estimatedTime
    },
    structure: {
      total_words: words.length,
      across_words: words.filter(w => w.direction === 'across').length,
      down_words: words.filter(w => w.direction === 'down').length,
      average_word_length: words.reduce((sum, w) => sum + w.length, 0) / words.length,
      black_squares: puzzle.grid.flat().filter(cell => cell === '.').length
    },
    content: {
      words: words.map(word => ({
        number: word.number,
        direction: word.direction,
        answer: word.answer,
        clue: word.clue,
        length: word.length,
        position: { row: word.row, col: word.col }
      }))
    },
    user_progress: userProgress ? {
      completion_percentage: calculateCompletionPercentage(userProgress.userGrid, puzzle.solution),
      time_spent: userProgress.timeSpent,
      completed_words: words.filter(word => isWordComplete(word, userProgress.userGrid)).length,
      last_updated: new Date().toISOString()
    } : null,
    automation_tags: [
      'crossword',
      'daily_puzzle',
      `difficulty_${puzzle.difficulty}`,
      `theme_${puzzle.theme.toLowerCase().replace(/\s+/g, '_')}`,
      puzzle.dayOfWeek?.toLowerCase()
    ].filter(Boolean)
  };
};

/**
 * Validates crossword symmetry (for puzzle creation)
 * @param {Array} grid - The crossword grid
 * @returns {boolean} - True if grid has rotational symmetry
 */
export const validateSymmetry = (grid) => {
  const size = grid.length;
  
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const cell = grid[row][col];
      const symmetricCell = grid[size - 1 - row][size - 1 - col];
      
      // Both should be black or both should be white
      if ((cell === '.') !== (symmetricCell === '.')) {
        return false;
      }
    }
  }
  
  return true;
};

/**
 * Generates a print-friendly version of the puzzle
 * @param {Object} puzzle - The crossword puzzle object
 * @param {boolean} includeAnswers - Whether to include answers
 * @returns {Object} - Print-ready data structure
 */
export const generatePrintVersion = (puzzle, includeAnswers = false) => {
  const words = findAllWords(puzzle);
  
  return {
    title: `Daily Crossword - ${puzzle.title}`,
    date: new Date(puzzle.date).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    difficulty: puzzle.difficultyLabel,
    theme: puzzle.theme,
    grid: includeAnswers ? puzzle.solution : puzzle.grid.map(row => 
      row.map(cell => cell === '.' ? '.' : '')
    ),
    numbers: puzzle.numbers,
    clues: {
      across: Object.entries(puzzle.clues.across).map(([num, clue]) => ({
        number: parseInt(num),
        clue
      })).sort((a, b) => a.number - b.number),
      down: Object.entries(puzzle.clues.down).map(([num, clue]) => ({
        number: parseInt(num),
        clue
      })).sort((a, b) => a.number - b.number)
    },
    answers: includeAnswers ? words.map(word => ({
      number: word.number,
      direction: word.direction,
      answer: word.answer
    })) : null,
    metadata: {
      constructor: puzzle.metadata?.constructor,
      copyright: puzzle.metadata?.copyright,
      estimated_time: puzzle.metadata?.estimatedTime
    }
  };
};

