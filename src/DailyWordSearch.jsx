import React, { useState, useEffect, useCallback, useRef } from 'react';
import './DailyWordSearch.css';
import { getTodaysWordSearch, getWordSearchForDate, validateWordSearchPuzzle } from './wordsearchRotation';
import { wordsearchAPI } from './wordsearchAPI';
import { trackEvent } from './analytics';

const DailyWordSearch = () => {
  // Game state
  const [puzzle, setPuzzle] = useState(null);
  const [foundWords, setFoundWords] = useState([]);
  const [selectedCells, setSelectedCells] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [gameStatus, setGameStatus] = useState('playing'); // 'playing', 'completed'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Selection state
  const [startCell, setStartCell] = useState(null);
  const [currentCell, setCurrentCell] = useState(null);
  const [selectionPath, setSelectionPath] = useState([]);
  
  // UI state
  const [showSolution, setShowSolution] = useState(false);
  const [revealedWords, setRevealedWords] = useState([]);
  const [gameStartTime, setGameStartTime] = useState(null);
  
  // Refs
  const gridRef = useRef(null);
  
  // Load today's puzzle
  useEffect(() => {
    loadTodaysPuzzle();
  }, []);
  
  // Initialize game timer
  useEffect(() => {
    if (puzzle && !gameStartTime) {
      setGameStartTime(Date.now());
    }
  }, [puzzle, gameStartTime]);
  
  // Check for game completion
  useEffect(() => {
    if (puzzle && foundWords.length === puzzle.words.length) {
      setGameStatus('completed');
      const completionTime = Date.now() - gameStartTime;
      
      // Track completion analytics
      trackEvent('wordsearch_completed', {
        theme: puzzle.theme,
        difficulty: puzzle.difficulty,
        word_count: puzzle.words.length,
        completion_time: completionTime,
        hints_used: revealedWords.length
      });
    }
  }, [foundWords, puzzle, gameStartTime, revealedWords.length]);
  
  const loadTodaysPuzzle = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to load from API first, then fallback to local
      let puzzleData;
      try {
        puzzleData = await wordsearchAPI.getTodaysPuzzle();
      } catch (apiError) {
        console.warn('API failed, using local rotation:', apiError);
        puzzleData = await getTodaysWordSearch();
      }
      
      if (puzzleData) {
        setPuzzle(puzzleData);
        setFoundWords([]);
        setRevealedWords([]);
        setSelectedCells([]);
        setGameStatus('playing');
        setShowSolution(false);
        setGameStartTime(null);
        
        // Track puzzle load
        trackEvent('wordsearch_loaded', {
          puzzle_id: puzzleData.id,
          theme: puzzleData.theme,
          difficulty: puzzleData.difficulty,
          word_count: puzzleData.words.length
        });
      } else {
        setError('Failed to load today\'s Word Search puzzle');
      }
    } catch (err) {
      console.error('Error loading Word Search puzzle:', err);
      setError('Failed to load puzzle. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle mouse down on grid cell
  const handleMouseDown = useCallback((row, col) => {
    if (gameStatus !== 'playing' || showSolution) return;
    
    setIsSelecting(true);
    setStartCell({ row, col });
    setCurrentCell({ row, col });
    setSelectionPath([{ row, col }]);
    setSelectedCells([`${row}-${col}`]);
  }, [gameStatus, showSolution]);
  
  // Handle mouse enter on grid cell
  const handleMouseEnter = useCallback((row, col) => {
    if (!isSelecting || !startCell) return;
    
    setCurrentCell({ row, col });
    
    // Calculate selection path
    const path = calculateSelectionPath(startCell, { row, col });
    setSelectionPath(path);
    setSelectedCells(path.map(cell => `${cell.row}-${cell.col}`));
  }, [isSelecting, startCell]);
  
  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (!isSelecting || !startCell || !currentCell) {
      setIsSelecting(false);
      setSelectedCells([]);
      setSelectionPath([]);
      return;
    }
    
    // Check if selection matches a word
    const selectedWord = getSelectedWord();
    if (selectedWord && puzzle.words.includes(selectedWord) && !foundWords.includes(selectedWord)) {
      setFoundWords(prev => [...prev, selectedWord]);
      
      // Track word found
      trackEvent('wordsearch_word_found', {
        word: selectedWord,
        theme: puzzle.theme,
        word_length: selectedWord.length,
        total_found: foundWords.length + 1
      });
    }
    
    setIsSelecting(false);
    setSelectedCells([]);
    setSelectionPath([]);
    setStartCell(null);
    setCurrentCell(null);
  }, [isSelecting, startCell, currentCell, puzzle, foundWords]);
  
  // Calculate selection path between two points
  const calculateSelectionPath = (start, end) => {
    const path = [];
    const deltaRow = end.row - start.row;
    const deltaCol = end.col - start.col;
    
    // Determine direction
    const stepRow = deltaRow === 0 ? 0 : deltaRow > 0 ? 1 : -1;
    const stepCol = deltaCol === 0 ? 0 : deltaCol > 0 ? 1 : -1;
    
    // Only allow straight lines (horizontal, vertical, diagonal)
    if (deltaRow !== 0 && deltaCol !== 0 && Math.abs(deltaRow) !== Math.abs(deltaCol)) {
      return [start]; // Invalid selection
    }
    
    let currentRow = start.row;
    let currentCol = start.col;
    
    while (true) {
      path.push({ row: currentRow, col: currentCol });
      
      if (currentRow === end.row && currentCol === end.col) break;
      
      currentRow += stepRow;
      currentCol += stepCol;
      
      // Safety check
      if (currentRow < 0 || currentRow >= 15 || currentCol < 0 || currentCol >= 15) break;
    }
    
    return path;
  };
  
  // Get selected word from current path
  const getSelectedWord = () => {
    if (!selectionPath.length || !puzzle) return '';
    
    return selectionPath
      .map(cell => puzzle.grid[cell.row][cell.col])
      .join('');
  };
  
  // Reveal a random unfound word
  const revealWord = () => {
    const unfoundWords = puzzle.words.filter(word => 
      !foundWords.includes(word) && !revealedWords.includes(word)
    );
    
    if (unfoundWords.length > 0) {
      const randomWord = unfoundWords[Math.floor(Math.random() * unfoundWords.length)];
      setRevealedWords(prev => [...prev, randomWord]);
      
      // Track hint usage
      trackEvent('wordsearch_hint_used', {
        word: randomWord,
        theme: puzzle.theme,
        hints_used: revealedWords.length + 1
      });
    }
  };
  
  // Show complete solution
  const showCompleteSolution = () => {
    setShowSolution(true);
    setRevealedWords([...puzzle.words]);
    
    // Track solution reveal
    trackEvent('wordsearch_solution_revealed', {
      theme: puzzle.theme,
      words_found: foundWords.length,
      total_words: puzzle.words.length
    });
  };
  
  // Check if a cell is part of a found word
  const isCellInFoundWord = (row, col) => {
    if (!puzzle) return false;
    
    for (const word of foundWords) {
      const position = puzzle.positions.find(pos => pos.word === word);
      if (position && position.positions.some(pos => pos[0] === row && pos[1] === col)) {
        return true;
      }
    }
    return false;
  };
  
  // Check if a cell is part of a revealed word
  const isCellInRevealedWord = (row, col) => {
    if (!puzzle || !showSolution) return false;
    
    for (const word of revealedWords) {
      const position = puzzle.positions.find(pos => pos.word === word);
      if (position && position.positions.some(pos => pos[0] === row && pos[1] === col)) {
        return true;
      }
    }
    return false;
  };
  
  // Get cell CSS classes
  const getCellClasses = (row, col) => {
    const classes = ['wordsearch-cell'];
    
    if (selectedCells.includes(`${row}-${col}`)) {
      classes.push('selected');
    }
    
    if (isCellInFoundWord(row, col)) {
      classes.push('found');
    } else if (isCellInRevealedWord(row, col)) {
      classes.push('revealed');
    }
    
    return classes.join(' ');
  };
  
  // Print puzzle
  const printPuzzle = () => {
    window.print();
  };
  
  if (loading) {
    return (
      <div className="wordsearch-container">
        <div className="wordsearch-loading">
          <div className="loading-spinner"></div>
          <p>Loading today's Word Search...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="wordsearch-container">
        <div className="wordsearch-error">
          <h3>Error Loading Puzzle</h3>
          <p>{error}</p>
          <button onClick={loadTodaysPuzzle} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  if (!puzzle) {
    return (
      <div className="wordsearch-container">
        <div className="wordsearch-error">
          <h3>No Puzzle Available</h3>
          <p>Unable to load today's Word Search puzzle.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="wordsearch-container">
      {/* Header */}
      <div className="wordsearch-header">
        <div className="puzzle-info">
          <h2>Daily Word Search</h2>
          <div className="puzzle-meta">
            <span className="theme">Theme: {puzzle.theme}</span>
            <span className="difficulty">Difficulty: {puzzle.difficulty}</span>
            <span className="word-count">{foundWords.length}/{puzzle.words.length} words found</span>
          </div>
        </div>
        
        <div className="puzzle-date">
          {new Date(puzzle.date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      </div>
      
      {/* Game completion message */}
      {gameStatus === 'completed' && (
        <div className="completion-message">
          <h3>🎉 Congratulations!</h3>
          <p>You found all {puzzle.words.length} words!</p>
          <p>Time: {Math.floor((Date.now() - gameStartTime) / 1000)} seconds</p>
        </div>
      )}
      
      {/* Main game area */}
      <div className="wordsearch-game">
        {/* Word Search Grid */}
        <div className="wordsearch-grid-container">
          <div 
            className="wordsearch-grid"
            ref={gridRef}
            onMouseLeave={() => {
              if (isSelecting) {
                handleMouseUp();
              }
            }}
          >
            {puzzle.grid.map((row, rowIndex) => (
              <div key={rowIndex} className="grid-row">
                {row.map((letter, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={getCellClasses(rowIndex, colIndex)}
                    onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                    onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                    onMouseUp={handleMouseUp}
                  >
                    {letter}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        
        {/* Word List */}
        <div className="wordsearch-wordlist">
          <h3>Find These Words:</h3>
          <div className="word-list">
            {puzzle.words.map((word, index) => (
              <div
                key={index}
                className={`word-item ${
                  foundWords.includes(word) ? 'found' : 
                  revealedWords.includes(word) ? 'revealed' : ''
                }`}
              >
                {word}
                {foundWords.includes(word) && <span className="checkmark">✓</span>}
                {revealedWords.includes(word) && !foundWords.includes(word) && <span className="hint-mark">💡</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Game Controls */}
      <div className="wordsearch-controls">
        <button 
          onClick={revealWord}
          disabled={gameStatus === 'completed' || revealedWords.length >= puzzle.words.length}
          className="control-button hint-button"
        >
          💡 Reveal Word
        </button>
        
        <button 
          onClick={showCompleteSolution}
          disabled={gameStatus === 'completed'}
          className="control-button solution-button"
        >
          🔍 Show Solution
        </button>
        
        <button 
          onClick={printPuzzle}
          className="control-button print-button"
        >
          🖨️ Print
        </button>
        
        <button 
          onClick={loadTodaysPuzzle}
          className="control-button refresh-button"
        >
          🔄 New Puzzle
        </button>
      </div>
      
      {/* Instructions */}
      <div className="wordsearch-instructions">
        <h4>How to Play:</h4>
        <ul>
          <li>Click and drag to select words in the grid</li>
          <li>Words can be horizontal, vertical, or diagonal</li>
          <li>Found words will be crossed out in the list</li>
          <li>Use "Reveal Word" for hints</li>
          <li>Find all words to complete the puzzle</li>
        </ul>
      </div>
      
      {/* Puzzle Statistics */}
      <div className="wordsearch-stats">
        <div className="stat-item">
          <span className="stat-label">Theme:</span>
          <span className="stat-value">{puzzle.theme}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Difficulty:</span>
          <span className="stat-value">{puzzle.difficulty}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Words:</span>
          <span className="stat-value">{puzzle.words.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Est. Time:</span>
          <span className="stat-value">{puzzle.estimated_time}</span>
        </div>
      </div>
    </div>
  );
};

export default DailyWordSearch;

