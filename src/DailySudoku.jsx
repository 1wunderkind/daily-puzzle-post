import React, { useState, useEffect, useCallback } from 'react';
import { loadTodaysSudoku, loadSudokuByDate, validateSudoku, sudokuLindyHelpers } from './sudokuRotation';
import { trackEvent } from './analytics';
import './DailySudoku.css';

const DailySudoku = ({ onPremiumClick }) => {
  // Game state
  const [puzzle, setPuzzle] = useState(null);
  const [userGrid, setUserGrid] = useState(Array(9).fill().map(() => Array(9).fill('')));
  const [selectedCell, setSelectedCell] = useState({ row: -1, col: -1 });
  const [pencilMarks, setPencilMarks] = useState(Array(9).fill().map(() => Array(9).fill([])));
  const [isPencilMode, setIsPencilMode] = useState(false);
  const [errors, setErrors] = useState(Array(9).fill().map(() => Array(9).fill(false)));
  const [showErrors, setShowErrors] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [rotationInfo, setRotationInfo] = useState(null);

  // Load today's puzzle on component mount
  useEffect(() => {
    loadPuzzle();
  }, []);

  // Timer effect
  useEffect(() => {
    let interval;
    if (startTime && !isComplete && !showSolution) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [startTime, isComplete, showSolution]);

  const loadPuzzle = async (date = null) => {
    try {
      setLoading(true);
      const puzzleData = date ? await loadSudokuByDate(date) : await loadTodaysSudoku();
      
      setPuzzle(puzzleData);
      setRotationInfo(puzzleData.rotation);
      
      // Initialize user grid with given numbers
      const newUserGrid = Array(9).fill().map(() => Array(9).fill(''));
      const newPencilMarks = Array(9).fill().map(() => Array(9).fill([]));
      
      if (puzzleData.given) {
        for (let row = 0; row < 9; row++) {
          for (let col = 0; col < 9; col++) {
            if (puzzleData.given[row][col] !== 0) {
              newUserGrid[row][col] = puzzleData.given[row][col].toString();
            }
          }
        }
      }
      
      setUserGrid(newUserGrid);
      setPencilMarks(newPencilMarks);
      setErrors(Array(9).fill().map(() => Array(9).fill(false)));
      setSelectedCell({ row: -1, col: -1 });
      setIsComplete(false);
      setShowSolution(false);
      setShowErrors(false);
      setStartTime(Date.now());
      setElapsedTime(0);
      
      // Track puzzle start
      trackEvent('sudoku_puzzle_started', {
        puzzle_id: puzzleData.id,
        difficulty: puzzleData.difficulty,
        source: puzzleData.source
      });
      
    } catch (error) {
      console.error('Error loading Sudoku puzzle:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCellClick = (row, col) => {
    // Don't allow editing given numbers
    if (puzzle && puzzle.given && puzzle.given[row][col] !== 0) {
      return;
    }
    
    setSelectedCell({ row, col });
  };

  const handleNumberInput = (number) => {
    if (selectedCell.row === -1 || selectedCell.col === -1) return;
    if (isComplete || showSolution) return;
    
    const { row, col } = selectedCell;
    
    // Don't allow editing given numbers
    if (puzzle && puzzle.given && puzzle.given[row][col] !== 0) {
      return;
    }
    
    if (isPencilMode) {
      // Handle pencil marks
      const newPencilMarks = [...pencilMarks];
      const currentMarks = [...newPencilMarks[row][col]];
      
      if (currentMarks.includes(number)) {
        // Remove the number
        newPencilMarks[row][col] = currentMarks.filter(n => n !== number);
      } else {
        // Add the number
        newPencilMarks[row][col] = [...currentMarks, number].sort();
      }
      
      setPencilMarks(newPencilMarks);
      
      // Clear the main number if pencil marks are added
      if (newPencilMarks[row][col].length > 0) {
        const newUserGrid = [...userGrid];
        newUserGrid[row][col] = '';
        setUserGrid(newUserGrid);
      }
    } else {
      // Handle main number input
      const newUserGrid = [...userGrid];
      newUserGrid[row][col] = number.toString();
      setUserGrid(newUserGrid);
      
      // Clear pencil marks when main number is entered
      const newPencilMarks = [...pencilMarks];
      newPencilMarks[row][col] = [];
      setPencilMarks(newPencilMarks);
      
      // Check for completion
      checkCompletion(newUserGrid);
    }
  };

  const handleClearCell = () => {
    if (selectedCell.row === -1 || selectedCell.col === -1) return;
    if (isComplete || showSolution) return;
    
    const { row, col } = selectedCell;
    
    // Don't allow editing given numbers
    if (puzzle && puzzle.given && puzzle.given[row][col] !== 0) {
      return;
    }
    
    const newUserGrid = [...userGrid];
    const newPencilMarks = [...pencilMarks];
    
    newUserGrid[row][col] = '';
    newPencilMarks[row][col] = [];
    
    setUserGrid(newUserGrid);
    setPencilMarks(newPencilMarks);
  };

  const checkCompletion = (grid) => {
    // Check if grid is completely filled
    const isFilled = grid.every(row => row.every(cell => cell !== ''));
    
    if (isFilled) {
      // Convert to numbers for validation
      const numberGrid = grid.map(row => row.map(cell => parseInt(cell)));
      const validation = validateSudoku(numberGrid);
      
      if (validation.valid) {
        setIsComplete(true);
        const completionTime = Date.now() - startTime;
        
        // Track completion
        trackEvent('sudoku_puzzle_completed', {
          puzzle_id: puzzle.id,
          difficulty: puzzle.difficulty,
          completion_time: completionTime,
          time_formatted: formatTime(completionTime)
        });
        
        // Send analytics to Lindy
        if (window.gtag) {
          window.gtag('event', 'sudoku_completed', {
            event_category: 'game',
            event_label: puzzle.difficulty,
            value: Math.round(completionTime / 1000)
          });
        }
      }
    }
  };

  const handleCheck = () => {
    if (!puzzle || !puzzle.solution) return;
    
    const newErrors = Array(9).fill().map(() => Array(9).fill(false));
    let hasErrors = false;
    
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (userGrid[row][col] !== '' && 
            parseInt(userGrid[row][col]) !== puzzle.solution[row][col]) {
          newErrors[row][col] = true;
          hasErrors = true;
        }
      }
    }
    
    setErrors(newErrors);
    setShowErrors(true);
    
    // Track error check
    trackEvent('sudoku_check_errors', {
      puzzle_id: puzzle.id,
      has_errors: hasErrors,
      error_count: newErrors.flat().filter(Boolean).length
    });
    
    // Hide errors after 3 seconds
    setTimeout(() => {
      setShowErrors(false);
    }, 3000);
  };

  const handleRevealSolution = () => {
    if (!puzzle || !puzzle.solution) return;
    
    const solutionGrid = puzzle.solution.map(row => row.map(cell => cell.toString()));
    setUserGrid(solutionGrid);
    setShowSolution(true);
    setIsComplete(false);
    
    // Track solution reveal
    trackEvent('sudoku_solution_revealed', {
      puzzle_id: puzzle.id,
      difficulty: puzzle.difficulty,
      time_before_reveal: elapsedTime
    });
  };

  const handlePrint = () => {
    window.print();
    
    // Track print
    trackEvent('sudoku_printed', {
      puzzle_id: puzzle.id,
      difficulty: puzzle.difficulty
    });
  };

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getCellClass = (row, col) => {
    let classes = ['sudoku-cell'];
    
    // Given number styling
    if (puzzle && puzzle.given && puzzle.given[row][col] !== 0) {
      classes.push('given-number');
    }
    
    // Selected cell
    if (selectedCell.row === row && selectedCell.col === col) {
      classes.push('selected');
    }
    
    // Highlight same number
    if (userGrid[row][col] !== '' && selectedCell.row !== -1 && selectedCell.col !== -1) {
      const selectedValue = userGrid[selectedCell.row][selectedCell.col];
      if (selectedValue !== '' && userGrid[row][col] === selectedValue) {
        classes.push('same-number');
      }
    }
    
    // Error highlighting
    if (showErrors && errors[row][col]) {
      classes.push('error');
    }
    
    // Box borders
    if (row % 3 === 0) classes.push('top-border');
    if (col % 3 === 0) classes.push('left-border');
    if (row % 3 === 2) classes.push('bottom-border');
    if (col % 3 === 2) classes.push('right-border');
    
    return classes.join(' ');
  };

  const renderPencilMarks = (row, col) => {
    const marks = pencilMarks[row][col];
    if (marks.length === 0) return null;
    
    return (
      <div className="pencil-marks">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <span key={num} className={marks.includes(num) ? 'visible' : 'hidden'}>
            {num}
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="sudoku-loading">
        <div className="loading-spinner"></div>
        <p>Loading today's Sudoku...</p>
      </div>
    );
  }

  if (!puzzle) {
    return (
      <div className="sudoku-error">
        <h3>Unable to load Sudoku puzzle</h3>
        <button onClick={() => loadPuzzle()} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="daily-sudoku">
      <div className="sudoku-header">
        <div className="puzzle-info">
          <h2>📊 Daily Sudoku</h2>
          <div className="puzzle-meta">
            <span className="difficulty">{puzzle.difficulty}</span>
            <span className="separator">•</span>
            <span className="given-count">{puzzle.given_count || 0} given</span>
            <span className="separator">•</span>
            <span className="timer">{formatTime(elapsedTime)}</span>
          </div>
        </div>
        
        {rotationInfo && (
          <div className="rotation-info">
            <span>Puzzle #{rotationInfo.puzzleNumber}</span>
            <span className="date">{rotationInfo.date}</span>
          </div>
        )}
      </div>

      <div className="sudoku-game">
        <div className="sudoku-grid">
          {Array(9).fill().map((_, row) => (
            <div key={row} className="sudoku-row">
              {Array(9).fill().map((_, col) => (
                <div
                  key={`${row}-${col}`}
                  className={getCellClass(row, col)}
                  onClick={() => handleCellClick(row, col)}
                >
                  {userGrid[row][col] && (
                    <span className="cell-number">{userGrid[row][col]}</span>
                  )}
                  {!userGrid[row][col] && renderPencilMarks(row, col)}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="sudoku-controls">
          <div className="number-pad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                className="number-btn"
                onClick={() => handleNumberInput(num)}
                disabled={isComplete || showSolution}
              >
                {num}
              </button>
            ))}
          </div>

          <div className="action-buttons">
            <button
              className={`mode-btn ${isPencilMode ? 'active' : ''}`}
              onClick={() => setIsPencilMode(!isPencilMode)}
              disabled={isComplete || showSolution}
            >
              ✏️ Pencil
            </button>
            
            <button
              className="clear-btn"
              onClick={handleClearCell}
              disabled={isComplete || showSolution}
            >
              🗑️ Clear
            </button>
            
            <button
              className="check-btn"
              onClick={handleCheck}
              disabled={isComplete || showSolution}
            >
              ✓ Check
            </button>
          </div>

          <div className="utility-buttons">
            <button
              className="solution-btn"
              onClick={handleRevealSolution}
              disabled={isComplete || showSolution}
            >
              💡 Solution
            </button>
            
            <button
              className="print-btn"
              onClick={handlePrint}
            >
              🖨️ Print
            </button>
            
            <button
              className="new-puzzle-btn"
              onClick={() => loadPuzzle()}
            >
              🔄 New Puzzle
            </button>
          </div>
        </div>
      </div>

      {isComplete && (
        <div className="completion-message">
          <h3>🎉 Congratulations!</h3>
          <p>You completed today's Sudoku in {formatTime(elapsedTime)}!</p>
          <div className="completion-actions">
            <button onClick={() => loadPuzzle()} className="play-again-btn">
              Play Again
            </button>
            {onPremiumClick && (
              <button onClick={onPremiumClick} className="premium-btn">
                Access Archive
              </button>
            )}
          </div>
        </div>
      )}

      {showSolution && (
        <div className="solution-message">
          <p>📖 Solution revealed. Better luck next time!</p>
        </div>
      )}

      <div className="sudoku-instructions">
        <h4>How to Play:</h4>
        <ul>
          <li>Fill each row, column, and 3×3 box with numbers 1-9</li>
          <li>Each number can appear only once in each row, column, and box</li>
          <li>Click a cell and use the number pad to enter values</li>
          <li>Use pencil mode for notes and possibilities</li>
          <li>Check your work with the Check button</li>
        </ul>
      </div>
    </div>
  );
};

export default DailySudoku;

