import React, { useState, useEffect, useRef, useCallback } from 'react';
import './DailyCrossword.css';
import { crosswordPuzzles, getCrosswordByDate, getTodaysCrossword } from './crosswordData';
import { trackEvent } from './analytics';

const DailyCrossword = ({ isPremium = false, onPremiumClick }) => {
  // Game state
  const [currentPuzzle, setCurrentPuzzle] = useState(null);
  const [userGrid, setUserGrid] = useState([]);
  const [selectedCell, setSelectedCell] = useState({ row: -1, col: -1 });
  const [selectedDirection, setSelectedDirection] = useState('across'); // 'across' or 'down'
  const [selectedClue, setSelectedClue] = useState(null);
  const [completedWords, setCompletedWords] = useState(new Set());
  const [isComplete, setIsComplete] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showTimer, setShowTimer] = useState(true);
  const [revealMode, setRevealMode] = useState(null); // 'letter', 'word', 'puzzle'
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(false);

  // Refs for keyboard navigation
  const gridRef = useRef(null);
  const timerRef = useRef(null);

  // Load puzzle on component mount
  useEffect(() => {
    loadTodaysPuzzle();
  }, []);

  // Timer effect
  useEffect(() => {
    if (startTime && !isComplete) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [startTime, isComplete]);

  // Auto-save progress
  useEffect(() => {
    if (currentPuzzle && userGrid.length > 0) {
      saveProgress();
    }
  }, [userGrid, currentPuzzle]);

  const loadTodaysPuzzle = () => {
    const puzzle = getTodaysCrossword();
    if (puzzle) {
      setCurrentPuzzle(puzzle);
      initializeGrid(puzzle);
      loadProgress(puzzle.id);
      setStartTime(Date.now());
      
      trackEvent('crossword_started', {
        puzzle_id: puzzle.id,
        difficulty: puzzle.difficulty,
        theme: puzzle.theme
      });
    }
  };

  const initializeGrid = (puzzle) => {
    const grid = Array(puzzle.size).fill(null).map(() => 
      Array(puzzle.size).fill('')
    );
    setUserGrid(grid);
  };

  const saveProgress = () => {
    if (!currentPuzzle) return;
    
    const progressData = {
      puzzleId: currentPuzzle.id,
      userGrid,
      selectedCell,
      selectedDirection,
      completedWords: Array.from(completedWords),
      startTime,
      elapsedTime,
      isComplete
    };
    
    localStorage.setItem(`crossword_progress_${currentPuzzle.id}`, JSON.stringify(progressData));
  };

  const loadProgress = (puzzleId) => {
    const saved = localStorage.getItem(`crossword_progress_${puzzleId}`);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setUserGrid(data.userGrid || []);
        setSelectedCell(data.selectedCell || { row: -1, col: -1 });
        setSelectedDirection(data.selectedDirection || 'across');
        setCompletedWords(new Set(data.completedWords || []));
        setStartTime(data.startTime || Date.now());
        setElapsedTime(data.elapsedTime || 0);
        setIsComplete(data.isComplete || false);
      } catch (error) {
        console.error('Error loading progress:', error);
      }
    }
  };

  const handleCellClick = (row, col) => {
    if (!currentPuzzle || currentPuzzle.grid[row][col] === '.') return;

    // If clicking the same cell, toggle direction
    if (selectedCell.row === row && selectedCell.col === col) {
      setSelectedDirection(selectedDirection === 'across' ? 'down' : 'across');
    } else {
      setSelectedCell({ row, col });
    }

    updateSelectedClue(row, col, selectedDirection);
    
    trackEvent('crossword_cell_selected', {
      row,
      col,
      direction: selectedDirection
    });
  };

  const handleKeyPress = useCallback((event) => {
    if (!currentPuzzle || selectedCell.row === -1) return;

    const { key } = event;
    const { row, col } = selectedCell;

    if (key === 'Backspace' || key === 'Delete') {
      handleLetterInput(row, col, '');
      moveToPreviousCell();
    } else if (key === 'Tab') {
      event.preventDefault();
      setSelectedDirection(selectedDirection === 'across' ? 'down' : 'across');
    } else if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight') {
      event.preventDefault();
      handleArrowKey(key);
    } else if (/^[A-Za-z]$/.test(key)) {
      handleLetterInput(row, col, key.toUpperCase());
      moveToNextCell();
    }
  }, [currentPuzzle, selectedCell, selectedDirection]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const handleLetterInput = (row, col, letter) => {
    if (!currentPuzzle || currentPuzzle.grid[row][col] === '.') return;

    const newGrid = [...userGrid];
    newGrid[row][col] = letter;
    setUserGrid(newGrid);

    // Check for errors if enabled
    if (showErrors && letter && letter !== currentPuzzle.solution[row][col]) {
      const errorKey = `${row}-${col}`;
      setErrors(prev => new Set([...prev, errorKey]));
    } else {
      const errorKey = `${row}-${col}`;
      setErrors(prev => {
        const newErrors = new Set(prev);
        newErrors.delete(errorKey);
        return newErrors;
      });
    }

    // Check word completion
    checkWordCompletion(row, col);
    
    // Check puzzle completion
    checkPuzzleCompletion(newGrid);

    trackEvent('crossword_letter_entered', {
      row,
      col,
      letter,
      correct: letter === currentPuzzle.solution[row][col]
    });
  };

  const moveToNextCell = () => {
    if (!currentPuzzle) return;

    const { row, col } = selectedCell;
    let nextRow = row;
    let nextCol = col;

    if (selectedDirection === 'across') {
      nextCol++;
      while (nextCol < currentPuzzle.size && currentPuzzle.grid[nextRow][nextCol] === '.') {
        nextCol++;
      }
      if (nextCol >= currentPuzzle.size) {
        // Move to next row, first available cell
        nextRow++;
        nextCol = 0;
        while (nextRow < currentPuzzle.size && nextCol < currentPuzzle.size && currentPuzzle.grid[nextRow][nextCol] === '.') {
          nextCol++;
          if (nextCol >= currentPuzzle.size) {
            nextRow++;
            nextCol = 0;
          }
        }
      }
    } else {
      nextRow++;
      while (nextRow < currentPuzzle.size && currentPuzzle.grid[nextRow][nextCol] === '.') {
        nextRow++;
      }
      if (nextRow >= currentPuzzle.size) {
        // Move to next column, first available cell
        nextCol++;
        nextRow = 0;
        while (nextCol < currentPuzzle.size && nextRow < currentPuzzle.size && currentPuzzle.grid[nextRow][nextCol] === '.') {
          nextRow++;
          if (nextRow >= currentPuzzle.size) {
            nextCol++;
            nextRow = 0;
          }
        }
      }
    }

    if (nextRow < currentPuzzle.size && nextCol < currentPuzzle.size) {
      setSelectedCell({ row: nextRow, col: nextCol });
      updateSelectedClue(nextRow, nextCol, selectedDirection);
    }
  };

  const moveToPreviousCell = () => {
    if (!currentPuzzle) return;

    const { row, col } = selectedCell;
    let prevRow = row;
    let prevCol = col;

    if (selectedDirection === 'across') {
      prevCol--;
      while (prevCol >= 0 && currentPuzzle.grid[prevRow][prevCol] === '.') {
        prevCol--;
      }
      if (prevCol < 0) {
        // Move to previous row, last available cell
        prevRow--;
        prevCol = currentPuzzle.size - 1;
        while (prevRow >= 0 && prevCol >= 0 && currentPuzzle.grid[prevRow][prevCol] === '.') {
          prevCol--;
          if (prevCol < 0) {
            prevRow--;
            prevCol = currentPuzzle.size - 1;
          }
        }
      }
    } else {
      prevRow--;
      while (prevRow >= 0 && currentPuzzle.grid[prevRow][prevCol] === '.') {
        prevRow--;
      }
      if (prevRow < 0) {
        // Move to previous column, last available cell
        prevCol--;
        prevRow = currentPuzzle.size - 1;
        while (prevCol >= 0 && prevRow >= 0 && currentPuzzle.grid[prevRow][prevCol] === '.') {
          prevRow--;
          if (prevRow < 0) {
            prevCol--;
            prevRow = currentPuzzle.size - 1;
          }
        }
      }
    }

    if (prevRow >= 0 && prevCol >= 0) {
      setSelectedCell({ row: prevRow, col: prevCol });
      updateSelectedClue(prevRow, prevCol, selectedDirection);
    }
  };

  const handleArrowKey = (key) => {
    if (!currentPuzzle) return;

    const { row, col } = selectedCell;
    let newRow = row;
    let newCol = col;

    switch (key) {
      case 'ArrowUp':
        newRow = Math.max(0, row - 1);
        while (newRow >= 0 && currentPuzzle.grid[newRow][col] === '.') {
          newRow--;
        }
        if (newRow >= 0) setSelectedDirection('down');
        break;
      case 'ArrowDown':
        newRow = Math.min(currentPuzzle.size - 1, row + 1);
        while (newRow < currentPuzzle.size && currentPuzzle.grid[newRow][col] === '.') {
          newRow++;
        }
        if (newRow < currentPuzzle.size) setSelectedDirection('down');
        break;
      case 'ArrowLeft':
        newCol = Math.max(0, col - 1);
        while (newCol >= 0 && currentPuzzle.grid[row][newCol] === '.') {
          newCol--;
        }
        if (newCol >= 0) setSelectedDirection('across');
        break;
      case 'ArrowRight':
        newCol = Math.min(currentPuzzle.size - 1, col + 1);
        while (newCol < currentPuzzle.size && currentPuzzle.grid[row][newCol] === '.') {
          newCol++;
        }
        if (newCol < currentPuzzle.size) setSelectedDirection('across');
        break;
    }

    if (newRow !== row || newCol !== col) {
      setSelectedCell({ row: newRow, col: newCol });
      updateSelectedClue(newRow, newCol, selectedDirection);
    }
  };

  const updateSelectedClue = (row, col, direction) => {
    if (!currentPuzzle) return;

    // Find the clue number for this position and direction
    const clueNumber = findClueNumber(row, col, direction);
    if (clueNumber) {
      setSelectedClue({
        number: clueNumber,
        direction,
        clue: currentPuzzle.clues[direction][clueNumber]
      });
    }
  };

  const findClueNumber = (row, col, direction) => {
    if (!currentPuzzle) return null;

    // Find the starting position of the word
    let startRow = row;
    let startCol = col;

    if (direction === 'across') {
      while (startCol > 0 && currentPuzzle.grid[startRow][startCol - 1] !== '.') {
        startCol--;
      }
    } else {
      while (startRow > 0 && currentPuzzle.grid[startRow - 1][startCol] !== '.') {
        startRow--;
      }
    }

    // Return the number at the starting position
    return currentPuzzle.numbers[startRow][startCol];
  };

  const checkWordCompletion = (row, col) => {
    if (!currentPuzzle) return;

    // Check both directions for completion
    ['across', 'down'].forEach(direction => {
      const clueNumber = findClueNumber(row, col, direction);
      if (clueNumber && !completedWords.has(`${clueNumber}-${direction}`)) {
        if (isWordComplete(row, col, direction)) {
          setCompletedWords(prev => new Set([...prev, `${clueNumber}-${direction}`]));
          
          trackEvent('crossword_word_completed', {
            clue_number: clueNumber,
            direction,
            word_length: getWordLength(row, col, direction)
          });
        }
      }
    });
  };

  const isWordComplete = (row, col, direction) => {
    if (!currentPuzzle) return false;

    // Find word boundaries
    let startRow = row, startCol = col;
    let endRow = row, endCol = col;

    if (direction === 'across') {
      while (startCol > 0 && currentPuzzle.grid[startRow][startCol - 1] !== '.') {
        startCol--;
      }
      while (endCol < currentPuzzle.size - 1 && currentPuzzle.grid[endRow][endCol + 1] !== '.') {
        endCol++;
      }

      // Check if all letters are filled
      for (let c = startCol; c <= endCol; c++) {
        if (!userGrid[startRow] || !userGrid[startRow][c]) {
          return false;
        }
      }
    } else {
      while (startRow > 0 && currentPuzzle.grid[startRow - 1][startCol] !== '.') {
        startRow--;
      }
      while (endRow < currentPuzzle.size - 1 && currentPuzzle.grid[endRow + 1][endCol] !== '.') {
        endRow++;
      }

      // Check if all letters are filled
      for (let r = startRow; r <= endRow; r++) {
        if (!userGrid[r] || !userGrid[r][startCol]) {
          return false;
        }
      }
    }

    return true;
  };

  const getWordLength = (row, col, direction) => {
    if (!currentPuzzle) return 0;

    let length = 1;
    let checkRow = row, checkCol = col;

    if (direction === 'across') {
      // Count left
      while (checkCol > 0 && currentPuzzle.grid[checkRow][checkCol - 1] !== '.') {
        checkCol--;
        length++;
      }
      // Count right
      checkCol = col;
      while (checkCol < currentPuzzle.size - 1 && currentPuzzle.grid[checkRow][checkCol + 1] !== '.') {
        checkCol++;
        length++;
      }
    } else {
      // Count up
      while (checkRow > 0 && currentPuzzle.grid[checkRow - 1][checkCol] !== '.') {
        checkRow--;
        length++;
      }
      // Count down
      checkRow = row;
      while (checkRow < currentPuzzle.size - 1 && currentPuzzle.grid[checkRow + 1][checkCol] !== '.') {
        checkRow++;
        length++;
      }
    }

    return length;
  };

  const checkPuzzleCompletion = (grid) => {
    if (!currentPuzzle) return;

    // Check if all non-black squares are filled
    for (let row = 0; row < currentPuzzle.size; row++) {
      for (let col = 0; col < currentPuzzle.size; col++) {
        if (currentPuzzle.grid[row][col] !== '.' && !grid[row][col]) {
          return;
        }
      }
    }

    // Puzzle is complete
    setIsComplete(true);
    
    trackEvent('crossword_completed', {
      puzzle_id: currentPuzzle.id,
      time_taken: elapsedTime,
      difficulty: currentPuzzle.difficulty,
      theme: currentPuzzle.theme
    });
  };

  const handleRevealLetter = () => {
    if (!currentPuzzle || selectedCell.row === -1) return;

    const { row, col } = selectedCell;
    const correctLetter = currentPuzzle.solution[row][col];
    
    handleLetterInput(row, col, correctLetter);
    
    trackEvent('crossword_reveal_letter', {
      row,
      col,
      letter: correctLetter
    });
  };

  const handleRevealWord = () => {
    if (!currentPuzzle || selectedCell.row === -1 || !selectedClue) return;

    const { row, col } = selectedCell;
    const direction = selectedDirection;
    
    // Find word boundaries
    let startRow = row, startCol = col;
    let endRow = row, endCol = col;

    if (direction === 'across') {
      while (startCol > 0 && currentPuzzle.grid[startRow][startCol - 1] !== '.') {
        startCol--;
      }
      while (endCol < currentPuzzle.size - 1 && currentPuzzle.grid[endRow][endCol + 1] !== '.') {
        endCol++;
      }

      // Reveal all letters in the word
      for (let c = startCol; c <= endCol; c++) {
        handleLetterInput(startRow, c, currentPuzzle.solution[startRow][c]);
      }
    } else {
      while (startRow > 0 && currentPuzzle.grid[startRow - 1][startCol] !== '.') {
        startRow--;
      }
      while (endRow < currentPuzzle.size - 1 && currentPuzzle.grid[endRow + 1][endCol] !== '.') {
        endRow++;
      }

      // Reveal all letters in the word
      for (let r = startRow; r <= endRow; r++) {
        handleLetterInput(r, startCol, currentPuzzle.solution[r][startCol]);
      }
    }

    trackEvent('crossword_reveal_word', {
      clue_number: selectedClue.number,
      direction,
      word_length: getWordLength(row, col, direction)
    });
  };

  const handleRevealPuzzle = () => {
    if (!currentPuzzle) return;

    const newGrid = currentPuzzle.solution.map(row => [...row]);
    setUserGrid(newGrid);
    setIsComplete(true);

    trackEvent('crossword_reveal_puzzle', {
      puzzle_id: currentPuzzle.id
    });
  };

  const formatTime = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const handleClueClick = (number, direction) => {
    // Find the starting cell for this clue
    for (let row = 0; row < currentPuzzle.size; row++) {
      for (let col = 0; col < currentPuzzle.size; col++) {
        if (currentPuzzle.numbers[row][col] === number) {
          setSelectedCell({ row, col });
          setSelectedDirection(direction);
          updateSelectedClue(row, col, direction);
          return;
        }
      }
    }
  };

  const getCellClass = (row, col) => {
    const classes = ['crossword-cell'];
    
    if (currentPuzzle.grid[row][col] === '.') {
      classes.push('black-cell');
    } else {
      classes.push('white-cell');
      
      if (selectedCell.row === row && selectedCell.col === col) {
        classes.push('selected-cell');
      }
      
      // Highlight current word
      if (selectedClue && isPartOfSelectedWord(row, col)) {
        classes.push('highlighted-word');
      }
      
      // Show errors if enabled
      if (showErrors && errors.has(`${row}-${col}`)) {
        classes.push('error-cell');
      }
      
      // Show completed words
      if (isCellInCompletedWord(row, col)) {
        classes.push('completed-cell');
      }
    }
    
    return classes.join(' ');
  };

  const isPartOfSelectedWord = (row, col) => {
    if (!selectedClue || selectedCell.row === -1) return false;

    const clueNumber = findClueNumber(selectedCell.row, selectedCell.col, selectedDirection);
    const cellClueNumber = findClueNumber(row, col, selectedDirection);
    
    return clueNumber === cellClueNumber;
  };

  const isCellInCompletedWord = (row, col) => {
    ['across', 'down'].forEach(direction => {
      const clueNumber = findClueNumber(row, col, direction);
      if (clueNumber && completedWords.has(`${clueNumber}-${direction}`)) {
        return true;
      }
    });
    return false;
  };

  if (!currentPuzzle) {
    return (
      <div className="crossword-loading">
        <h2>Loading Today's Crossword...</h2>
        <p>Preparing your daily puzzle challenge.</p>
      </div>
    );
  }

  return (
    <div className="daily-crossword">
      {/* Header */}
      <div className="crossword-header">
        <div className="puzzle-info">
          <h1>Daily Crossword</h1>
          <div className="puzzle-meta">
            <span className="puzzle-date">{new Date(currentPuzzle.date).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
            <span className="puzzle-difficulty">{currentPuzzle.difficultyLabel}</span>
            <span className="puzzle-theme">{currentPuzzle.theme}</span>
          </div>
        </div>
        
        {showTimer && (
          <div className="timer-display">
            <span className="timer-label">Time:</span>
            <span className="timer-value">{formatTime(elapsedTime)}</span>
          </div>
        )}
      </div>

      {/* Main Game Area */}
      <div className="crossword-game">
        {/* Grid */}
        <div className="crossword-grid-container">
          <div 
            className="crossword-grid"
            ref={gridRef}
            tabIndex={0}
          >
            {currentPuzzle.grid.map((row, rowIndex) => (
              <div key={rowIndex} className="crossword-row">
                {row.map((cell, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={getCellClass(rowIndex, colIndex)}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                  >
                    {currentPuzzle.numbers[rowIndex][colIndex] && (
                      <span className="cell-number">
                        {currentPuzzle.numbers[rowIndex][colIndex]}
                      </span>
                    )}
                    {cell !== '.' && (
                      <input
                        type="text"
                        className="cell-input"
                        value={userGrid[rowIndex]?.[colIndex] || ''}
                        onChange={(e) => handleLetterInput(rowIndex, colIndex, e.target.value.toUpperCase())}
                        maxLength={1}
                        readOnly
                      />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Clues */}
        <div className="crossword-clues">
          <div className="clues-section">
            <h3>Across</h3>
            <div className="clues-list">
              {Object.entries(currentPuzzle.clues.across).map(([number, clue]) => (
                <div
                  key={`across-${number}`}
                  className={`clue-item ${selectedClue?.number === parseInt(number) && selectedClue?.direction === 'across' ? 'selected-clue' : ''}`}
                  onClick={() => handleClueClick(parseInt(number), 'across')}
                >
                  <span className="clue-number">{number}</span>
                  <span className="clue-text">{clue}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="clues-section">
            <h3>Down</h3>
            <div className="clues-list">
              {Object.entries(currentPuzzle.clues.down).map(([number, clue]) => (
                <div
                  key={`down-${number}`}
                  className={`clue-item ${selectedClue?.number === parseInt(number) && selectedClue?.direction === 'down' ? 'selected-clue' : ''}`}
                  onClick={() => handleClueClick(parseInt(number), 'down')}
                >
                  <span className="clue-number">{number}</span>
                  <span className="clue-text">{clue}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="crossword-controls">
        <div className="control-group">
          <button 
            className="control-button"
            onClick={handleRevealLetter}
            disabled={selectedCell.row === -1}
          >
            Reveal Letter
          </button>
          <button 
            className="control-button"
            onClick={handleRevealWord}
            disabled={selectedCell.row === -1 || !selectedClue}
          >
            Reveal Word
          </button>
          <button 
            className="control-button"
            onClick={handleRevealPuzzle}
          >
            Reveal Puzzle
          </button>
        </div>

        <div className="control-group">
          <button 
            className="control-button"
            onClick={() => setShowErrors(!showErrors)}
          >
            {showErrors ? 'Hide Errors' : 'Check Errors'}
          </button>
          <button 
            className="control-button"
            onClick={() => setShowTimer(!showTimer)}
          >
            {showTimer ? 'Hide Timer' : 'Show Timer'}
          </button>
        </div>

        {!isPremium && (
          <div className="premium-controls">
            <button 
              className="premium-button"
              onClick={() => onPremiumClick('crossword')}
            >
              Go Premium - Remove Ads
            </button>
          </div>
        )}
      </div>

      {/* Completion Message */}
      {isComplete && (
        <div className="completion-modal">
          <div className="completion-content">
            <h2>🎉 Congratulations!</h2>
            <p>You've completed today's crossword puzzle!</p>
            <div className="completion-stats">
              <div className="stat">
                <span className="stat-label">Time:</span>
                <span className="stat-value">{formatTime(elapsedTime)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Difficulty:</span>
                <span className="stat-value">{currentPuzzle.difficultyLabel}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Theme:</span>
                <span className="stat-value">{currentPuzzle.theme}</span>
              </div>
            </div>
            <button 
              className="completion-button"
              onClick={() => setIsComplete(false)}
            >
              Continue Exploring
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyCrossword;

