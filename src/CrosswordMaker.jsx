import React, { useState, useEffect, useCallback, useRef } from 'react';
import './CrosswordMaker.css';
import { trackEvent } from './analytics';
import PuzzleSharing from './PuzzleSharing';

const CrosswordMaker = ({ isPremium, onPremiumClick }) => {
  // Grid state
  const [gridSize, setGridSize] = useState(15);
  const [grid, setGrid] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [currentDirection, setCurrentDirection] = useState('across');
  
  // Puzzle state
  const [words, setWords] = useState([]);
  const [clues, setClues] = useState({ across: {}, down: {} });
  const [puzzleTitle, setPuzzleTitle] = useState('');
  const [puzzleAuthor, setPuzzleAuthor] = useState('');
  const [puzzleDifficulty, setPuzzleDifficulty] = useState('medium');
  
  // UI state
  const [currentWord, setCurrentWord] = useState('');
  const [currentClue, setCurrentClue] = useState('');
  const [showClueForm, setShowClueForm] = useState(false);
  const [selectedWordInfo, setSelectedWordInfo] = useState(null);
  const [isGeneratingClues, setIsGeneratingClues] = useState(false);
  const [validationResults, setValidationResults] = useState(null);
  
  // Creation limits
  const [puzzlesCreatedThisWeek, setPuzzlesCreatedThisWeek] = useState(0);
  const weeklyLimit = isPremium ? Infinity : 1;
  
  // Refs
  const gridRef = useRef(null);
  
  // Initialize grid
  useEffect(() => {
    initializeGrid();
    loadCreationStats();
  }, [gridSize]);
  
  // Initialize empty grid
  const initializeGrid = () => {
    const newGrid = Array(gridSize).fill(null).map(() => 
      Array(gridSize).fill(null).map(() => ({
        letter: '',
        isBlack: false,
        number: null,
        isSelected: false,
        isHighlighted: false
      }))
    );
    setGrid(newGrid);
    setWords([]);
    setClues({ across: {}, down: {} });
  };
  
  // Load creation statistics
  const loadCreationStats = () => {
    const stats = JSON.parse(localStorage.getItem('dpp_crossword_creation_stats') || '{}');
    const thisWeek = getWeekKey();
    setPuzzlesCreatedThisWeek(stats[thisWeek] || 0);
  };
  
  // Get current week key for tracking
  const getWeekKey = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${weekNumber}`;
  };
  
  // Handle cell click
  const handleCellClick = useCallback((row, col) => {
    if (grid[row][col].isBlack) return;
    
    setSelectedCell({ row, col });
    highlightCurrentWord(row, col, currentDirection);
    
    // Check if there's a word starting at this position
    const wordInfo = findWordAtPosition(row, col, currentDirection);
    if (wordInfo) {
      setSelectedWordInfo(wordInfo);
    }
  }, [grid, currentDirection]);
  
  // Toggle cell black/white
  const toggleCellBlack = useCallback((row, col) => {
    const newGrid = [...grid];
    newGrid[row][col].isBlack = !newGrid[row][col].isBlack;
    
    if (newGrid[row][col].isBlack) {
      newGrid[row][col].letter = '';
      newGrid[row][col].number = null;
    }
    
    setGrid(newGrid);
    updateWordNumbers(newGrid);
  }, [grid]);
  
  // Handle letter input
  const handleLetterInput = useCallback((letter) => {
    if (!selectedCell || grid[selectedCell.row][selectedCell.col].isBlack) return;
    
    const newGrid = [...grid];
    newGrid[selectedCell.row][selectedCell.col].letter = letter.toUpperCase();
    setGrid(newGrid);
    
    // Move to next cell
    moveToNextCell();
  }, [selectedCell, grid, currentDirection]);
  
  // Move to next cell in current direction
  const moveToNextCell = () => {
    if (!selectedCell) return;
    
    let nextRow = selectedCell.row;
    let nextCol = selectedCell.col;
    
    if (currentDirection === 'across') {
      nextCol++;
    } else {
      nextRow++;
    }
    
    if (nextRow < gridSize && nextCol < gridSize && !grid[nextRow][nextCol].isBlack) {
      setSelectedCell({ row: nextRow, col: nextCol });
      highlightCurrentWord(nextRow, nextCol, currentDirection);
    }
  };
  
  // Highlight current word
  const highlightCurrentWord = (row, col, direction) => {
    const newGrid = [...grid];
    
    // Clear previous highlights
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        newGrid[r][c].isHighlighted = false;
        newGrid[r][c].isSelected = false;
      }
    }
    
    // Highlight current word
    const wordCells = getWordCells(row, col, direction);
    wordCells.forEach(cell => {
      newGrid[cell.row][cell.col].isHighlighted = true;
    });
    
    // Mark selected cell
    newGrid[row][col].isSelected = true;
    
    setGrid(newGrid);
  };
  
  // Get cells for current word
  const getWordCells = (startRow, startCol, direction) => {
    const cells = [];
    let row = startRow;
    let col = startCol;
    
    // Find start of word
    while (row >= 0 && col >= 0 && !grid[row][col].isBlack) {
      if (direction === 'across') {
        col--;
      } else {
        row--;
      }
    }
    
    // Move to first letter
    if (direction === 'across') {
      col++;
    } else {
      row++;
    }
    
    // Collect word cells
    while (row < gridSize && col < gridSize && !grid[row][col].isBlack) {
      cells.push({ row, col });
      if (direction === 'across') {
        col++;
      } else {
        row++;
      }
    }
    
    return cells.length > 1 ? cells : [];
  };
  
  // Find word at position
  const findWordAtPosition = (row, col, direction) => {
    const wordCells = getWordCells(row, col, direction);
    if (wordCells.length < 2) return null;
    
    const startCell = wordCells[0];
    const word = wordCells.map(cell => grid[cell.row][cell.col].letter).join('');
    const number = grid[startCell.row][startCell.col].number;
    
    return {
      word,
      number,
      direction,
      startRow: startCell.row,
      startCol: startCell.col,
      length: wordCells.length,
      cells: wordCells
    };
  };
  
  // Update word numbers
  const updateWordNumbers = (currentGrid) => {
    const newGrid = currentGrid || [...grid];
    let number = 1;
    
    // Clear existing numbers
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        newGrid[r][c].number = null;
      }
    }
    
    // Assign numbers
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (newGrid[r][c].isBlack) continue;
        
        const needsNumber = 
          (c === 0 || newGrid[r][c-1].isBlack) && c < gridSize - 1 && !newGrid[r][c+1].isBlack ||
          (r === 0 || newGrid[r-1][c].isBlack) && r < gridSize - 1 && !newGrid[r+1][c].isBlack;
        
        if (needsNumber) {
          newGrid[r][c].number = number++;
        }
      }
    }
    
    if (!currentGrid) {
      setGrid(newGrid);
    }
  };
  
  // Add clue for current word
  const addClue = () => {
    if (!selectedWordInfo || !currentClue.trim()) return;
    
    const newClues = { ...clues };
    const direction = selectedWordInfo.direction;
    const number = selectedWordInfo.number;
    
    newClues[direction][number] = {
      clue: currentClue.trim(),
      answer: selectedWordInfo.word,
      length: selectedWordInfo.length
    };
    
    setClues(newClues);
    setCurrentClue('');
    setShowClueForm(false);
    
    trackEvent('crossword_clue_added', {
      direction: direction,
      word_length: selectedWordInfo.length,
      has_answer: selectedWordInfo.word.length > 0
    });
  };
  
  // Generate clues using Lindy.ai
  const generateCluesWithLindy = async () => {
    if (!isPremium && puzzlesCreatedThisWeek >= weeklyLimit) {
      onPremiumClick('crossword_maker_clue_generation');
      return;
    }
    
    setIsGeneratingClues(true);
    
    try {
      // Extract all words from grid
      const allWords = extractAllWords();
      if (allWords.length === 0) {
        alert('Please add some words to the grid first.');
        return;
      }
      
      // Prepare word list for Lindy
      const wordList = allWords.map(w => w.word).filter(w => w.length > 1);
      
      // This would call Lindy.ai API in production
      const lindyPrompt = `Generate newspaper-style crossword clues for these words: ${wordList.join(', ')}. 
      Return in JSON format: {"word": "clue", ...}. 
      Make clues appropriate for a family newspaper, not too easy or too hard.`;
      
      // Simulate Lindy response (in production, this would be an API call)
      const simulatedResponse = await simulateLindyClueGeneration(wordList);
      
      // Apply generated clues
      const newClues = { ...clues };
      allWords.forEach(wordInfo => {
        if (simulatedResponse[wordInfo.word]) {
          const direction = wordInfo.direction;
          const number = wordInfo.number;
          
          newClues[direction][number] = {
            clue: simulatedResponse[wordInfo.word],
            answer: wordInfo.word,
            length: wordInfo.length
          };
        }
      });
      
      setClues(newClues);
      
      trackEvent('crossword_clues_generated', {
        word_count: wordList.length,
        method: 'lindy_ai'
      });
      
    } catch (error) {
      console.error('Error generating clues:', error);
      alert('Failed to generate clues. Please try again.');
    } finally {
      setIsGeneratingClues(false);
    }
  };
  
  // Extract all words from grid
  const extractAllWords = () => {
    const words = [];
    
    // Find across words
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (!grid[r][c].isBlack && grid[r][c].number) {
          const wordInfo = findWordAtPosition(r, c, 'across');
          if (wordInfo && wordInfo.length > 1) {
            words.push(wordInfo);
          }
        }
      }
    }
    
    // Find down words
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (!grid[r][c].isBlack && grid[r][c].number) {
          const wordInfo = findWordAtPosition(r, c, 'down');
          if (wordInfo && wordInfo.length > 1) {
            words.push(wordInfo);
          }
        }
      }
    }
    
    return words;
  };
  
  // Simulate Lindy clue generation
  const simulateLindyClueGeneration = async (wordList) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simple clue generation (in production, this would be Lindy.ai)
    const clueTemplates = {
      'CAT': 'Feline pet',
      'DOG': 'Man\'s best friend',
      'HOUSE': 'Place to live',
      'TREE': 'Woody plant',
      'BOOK': 'Reading material',
      'WATER': 'H2O',
      'FIRE': 'Hot flame',
      'LIGHT': 'Opposite of dark',
      'MUSIC': 'Sounds in harmony',
      'DANCE': 'Rhythmic movement'
    };
    
    const result = {};
    wordList.forEach(word => {
      result[word] = clueTemplates[word] || `Clue for ${word}`;
    });
    
    return result;
  };
  
  // Validate puzzle quality
  const validatePuzzle = () => {
    const words = extractAllWords();
    const results = {
      wordCount: words.length,
      hasClues: Object.keys(clues.across).length + Object.keys(clues.down).length,
      symmetry: checkSymmetry(),
      connectivity: checkConnectivity(),
      minWordLength: words.length > 0 ? Math.min(...words.map(w => w.length)) : 0,
      maxWordLength: words.length > 0 ? Math.max(...words.map(w => w.length)) : 0,
      errors: []
    };
    
    // Check for errors
    if (results.wordCount < 10) {
      results.errors.push('Puzzle should have at least 10 words');
    }
    
    if (results.hasClues < results.wordCount) {
      results.errors.push(`Missing ${results.wordCount - results.hasClues} clues`);
    }
    
    if (!results.symmetry) {
      results.errors.push('Puzzle lacks rotational symmetry');
    }
    
    if (!results.connectivity) {
      results.errors.push('All words should be connected');
    }
    
    if (results.minWordLength < 3) {
      results.errors.push('All words should be at least 3 letters long');
    }
    
    setValidationResults(results);
    
    trackEvent('crossword_validated', {
      word_count: results.wordCount,
      error_count: results.errors.length,
      has_symmetry: results.symmetry
    });
  };
  
  // Check rotational symmetry
  const checkSymmetry = () => {
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const oppositeR = gridSize - 1 - r;
        const oppositeC = gridSize - 1 - c;
        
        if (grid[r][c].isBlack !== grid[oppositeR][oppositeC].isBlack) {
          return false;
        }
      }
    }
    return true;
  };
  
  // Check if all words are connected
  const checkConnectivity = () => {
    // Simple connectivity check - all non-black cells should be reachable
    const visited = Array(gridSize).fill(null).map(() => Array(gridSize).fill(false));
    
    // Find first non-black cell
    let startR = -1, startC = -1;
    for (let r = 0; r < gridSize && startR === -1; r++) {
      for (let c = 0; c < gridSize && startC === -1; c++) {
        if (!grid[r][c].isBlack) {
          startR = r;
          startC = c;
        }
      }
    }
    
    if (startR === -1) return true; // No non-black cells
    
    // DFS to mark all reachable cells
    const dfs = (r, c) => {
      if (r < 0 || r >= gridSize || c < 0 || c >= gridSize || visited[r][c] || grid[r][c].isBlack) {
        return;
      }
      
      visited[r][c] = true;
      dfs(r + 1, c);
      dfs(r - 1, c);
      dfs(r, c + 1);
      dfs(r, c - 1);
    };
    
    dfs(startR, startC);
    
    // Check if all non-black cells are visited
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (!grid[r][c].isBlack && !visited[r][c]) {
          return false;
        }
      }
    }
    
    return true;
  };
  
  // Export puzzle to JSON
  const exportPuzzle = () => {
    const words = extractAllWords();
    const puzzleData = {
      id: `user_${Date.now()}`,
      title: puzzleTitle || 'Untitled Puzzle',
      author: puzzleAuthor || 'Anonymous',
      date: new Date().toISOString().split('T')[0],
      difficulty: puzzleDifficulty,
      size: `${gridSize}x${gridSize}`,
      grid: grid.map(row => row.map(cell => cell.isBlack ? '.' : cell.letter || ' ')),
      numbers: grid.map(row => row.map(cell => cell.number || 0)),
      clues: clues,
      words: words.length,
      created_with: 'Daily Puzzle Post Maker',
      created_at: new Date().toISOString()
    };
    
    // Download as JSON file
    const blob = new Blob([JSON.stringify(puzzleData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${puzzleTitle || 'crossword'}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    trackEvent('crossword_exported', {
      word_count: words.length,
      has_title: !!puzzleTitle,
      has_author: !!puzzleAuthor
    });
  };
  
  // Submit puzzle for community review
  const submitForReview = () => {
    if (!isPremium && puzzlesCreatedThisWeek >= weeklyLimit) {
      onPremiumClick('crossword_maker_submit');
      return;
    }
    
    const words = extractAllWords();
    if (words.length < 10) {
      alert('Please create a puzzle with at least 10 words before submitting.');
      return;
    }
    
    // Update creation stats
    const stats = JSON.parse(localStorage.getItem('dpp_crossword_creation_stats') || '{}');
    const thisWeek = getWeekKey();
    stats[thisWeek] = (stats[thisWeek] || 0) + 1;
    localStorage.setItem('dpp_crossword_creation_stats', JSON.stringify(stats));
    setPuzzlesCreatedThisWeek(stats[thisWeek]);
    
    // In production, this would submit to moderation queue
    alert('Puzzle submitted for review! You\'ll be notified when it\'s approved for the community section.');
    
    trackEvent('crossword_submitted', {
      word_count: words.length,
      has_title: !!puzzleTitle,
      has_author: !!puzzleAuthor,
      difficulty: puzzleDifficulty
    });
  };
  
  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!selectedCell) return;
      
      if (e.key.match(/[a-zA-Z]/)) {
        handleLetterInput(e.key);
      } else if (e.key === 'Backspace') {
        const newGrid = [...grid];
        newGrid[selectedCell.row][selectedCell.col].letter = '';
        setGrid(newGrid);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        setCurrentDirection(currentDirection === 'across' ? 'down' : 'across');
        if (selectedCell) {
          highlightCurrentWord(selectedCell.row, selectedCell.col, currentDirection === 'across' ? 'down' : 'across');
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedCell, grid, currentDirection]);
  
  // Check creation limits
  const canCreateMore = isPremium || puzzlesCreatedThisWeek < weeklyLimit;
  const remainingCreations = isPremium ? 'Unlimited' : Math.max(0, weeklyLimit - puzzlesCreatedThisWeek);
  
  return (
    <div className="crossword-maker-container">
      {/* Header */}
      <div className="maker-header">
        <div className="maker-info">
          <h2>Crossword Puzzle Maker</h2>
          <p>Create your own newspaper-style crossword puzzles</p>
        </div>
        
        <div className="creation-limits">
          <span className="limit-text">
            {isPremium ? (
              <span className="premium-badge">⭐ UNLIMITED</span>
            ) : (
              <span>This week: {remainingCreations} remaining</span>
            )}
          </span>
        </div>
      </div>
      
      {/* Creation limit warning */}
      {!canCreateMore && (
        <div className="limit-warning">
          <h3>Weekly Limit Reached</h3>
          <p>You've created your free puzzle this week. Upgrade to Premium for unlimited puzzle creation!</p>
          <button onClick={() => onPremiumClick('crossword_maker_limit')} className="upgrade-button">
            Upgrade to Premium
          </button>
        </div>
      )}
      
      {/* Main Creator Interface */}
      {canCreateMore && (
        <div className="maker-content">
          {/* Puzzle Info Form */}
          <div className="puzzle-info-form">
            <div className="form-row">
              <div className="form-group">
                <label>Puzzle Title:</label>
                <input
                  type="text"
                  value={puzzleTitle}
                  onChange={(e) => setPuzzleTitle(e.target.value)}
                  placeholder="Enter puzzle title"
                  maxLength={50}
                />
              </div>
              
              <div className="form-group">
                <label>Your Name (optional):</label>
                <input
                  type="text"
                  value={puzzleAuthor}
                  onChange={(e) => setPuzzleAuthor(e.target.value)}
                  placeholder="Your name for credit"
                  maxLength={30}
                />
              </div>
              
              <div className="form-group">
                <label>Difficulty:</label>
                <select
                  value={puzzleDifficulty}
                  onChange={(e) => setPuzzleDifficulty(e.target.value)}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Grid and Tools */}
          <div className="maker-workspace">
            {/* Left Panel - Grid */}
            <div className="grid-panel">
              <div className="grid-controls">
                <div className="direction-toggle">
                  <button
                    className={`direction-btn ${currentDirection === 'across' ? 'active' : ''}`}
                    onClick={() => setCurrentDirection('across')}
                  >
                    Across
                  </button>
                  <button
                    className={`direction-btn ${currentDirection === 'down' ? 'active' : ''}`}
                    onClick={() => setCurrentDirection('down')}
                  >
                    Down
                  </button>
                </div>
                
                <button onClick={initializeGrid} className="clear-btn">
                  Clear Grid
                </button>
              </div>
              
              {/* Crossword Grid */}
              <div className="crossword-grid" ref={gridRef}>
                {grid.map((row, rowIndex) => (
                  <div key={rowIndex} className="grid-row">
                    {row.map((cell, colIndex) => (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className={`grid-cell ${
                          cell.isBlack ? 'black' : ''
                        } ${
                          cell.isSelected ? 'selected' : ''
                        } ${
                          cell.isHighlighted ? 'highlighted' : ''
                        }`}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          toggleCellBlack(rowIndex, colIndex);
                        }}
                      >
                        {cell.number && (
                          <span className="cell-number">{cell.number}</span>
                        )}
                        {!cell.isBlack && (
                          <span className="cell-letter">{cell.letter}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              
              <div className="grid-instructions">
                <p><strong>Instructions:</strong></p>
                <ul>
                  <li>Click a cell to select it</li>
                  <li>Type letters to fill cells</li>
                  <li>Right-click to toggle black squares</li>
                  <li>Tab to switch between Across/Down</li>
                  <li>Use arrow keys to navigate</li>
                </ul>
              </div>
            </div>
            
            {/* Right Panel - Clues and Tools */}
            <div className="tools-panel">
              {/* AI Assistance */}
              <div className="ai-tools">
                <h3>AI Assistance</h3>
                <button
                  onClick={generateCluesWithLindy}
                  disabled={isGeneratingClues}
                  className="ai-button generate-clues-btn"
                >
                  {isGeneratingClues ? 'Generating...' : '🤖 Auto-Generate Clues'}
                </button>
                
                <button
                  onClick={validatePuzzle}
                  className="ai-button validate-btn"
                >
                  ✓ Check Puzzle Quality
                </button>
              </div>
              
              {/* Validation Results */}
              {validationResults && (
                <div className="validation-results">
                  <h4>Puzzle Quality Check</h4>
                  <div className="validation-stats">
                    <div>Words: {validationResults.wordCount}</div>
                    <div>Clues: {validationResults.hasClues}</div>
                    <div>Symmetry: {validationResults.symmetry ? '✓' : '✗'}</div>
                    <div>Connected: {validationResults.connectivity ? '✓' : '✗'}</div>
                  </div>
                  
                  {validationResults.errors.length > 0 && (
                    <div className="validation-errors">
                      <h5>Issues to Fix:</h5>
                      <ul>
                        {validationResults.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              {/* Current Word Info */}
              {selectedWordInfo && (
                <div className="current-word-info">
                  <h4>Current Word</h4>
                  <div className="word-details">
                    <div><strong>{selectedWordInfo.number} {selectedWordInfo.direction}</strong></div>
                    <div>Length: {selectedWordInfo.length}</div>
                    <div>Word: {selectedWordInfo.word || '(incomplete)'}</div>
                  </div>
                  
                  <div className="clue-input">
                    <label>Clue:</label>
                    <input
                      type="text"
                      value={currentClue}
                      onChange={(e) => setCurrentClue(e.target.value)}
                      placeholder="Enter clue for this word"
                      maxLength={100}
                    />
                    <button onClick={addClue} disabled={!currentClue.trim()}>
                      Add Clue
                    </button>
                  </div>
                </div>
              )}
              
              {/* Clues List */}
              <div className="clues-list">
                <h4>Clues</h4>
                
                <div className="clues-section">
                  <h5>Across</h5>
                  <div className="clues-items">
                    {Object.entries(clues.across).map(([number, clueData]) => (
                      <div key={number} className="clue-item">
                        <span className="clue-number">{number}.</span>
                        <span className="clue-text">{clueData.clue}</span>
                        <span className="clue-answer">({clueData.answer})</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="clues-section">
                  <h5>Down</h5>
                  <div className="clues-items">
                    {Object.entries(clues.down).map(([number, clueData]) => (
                      <div key={number} className="clue-item">
                        <span className="clue-number">{number}.</span>
                        <span className="clue-text">{clueData.clue}</span>
                        <span className="clue-answer">({clueData.answer})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="maker-actions">
            <button onClick={exportPuzzle} className="action-button export-btn">
              📥 Export Puzzle
            </button>
            
            <button onClick={submitForReview} className="action-button submit-btn">
              📤 Submit for Community
            </button>
            
            <button onClick={() => window.print()} className="action-button print-btn">
              🖨️ Print
            </button>
          </div>
          
          {/* Puzzle Sharing */}
          {puzzleTitle && puzzleAuthor && (
            <PuzzleSharing 
              puzzle={{
                id: `maker_${Date.now()}`,
                title: puzzleTitle,
                author: puzzleAuthor,
                difficulty: puzzleDifficulty,
                grid: grid,
                clues: clues,
                metadata: {
                  word_count: words.length,
                  grid_size: `${gridSize}x${gridSize}`,
                  has_theme: false,
                  clue_count: Object.keys(clues.across).length + Object.keys(clues.down).length
                }
              }}
              isPremium={isPremium}
              onPremiumClick={onPremiumClick}
            />
          )}
        </div>
      )}
      
      {/* Instructions */}
      <div className="maker-instructions">
        <h3>How to Create a Crossword</h3>
        <div className="instructions-grid">
          <div className="instruction-step">
            <h4>1. Plan Your Grid</h4>
            <p>Start by placing black squares to create your word pattern. Right-click cells to toggle black/white.</p>
          </div>
          
          <div className="instruction-step">
            <h4>2. Fill in Words</h4>
            <p>Click cells and type letters. Use Tab to switch between Across and Down directions.</p>
          </div>
          
          <div className="instruction-step">
            <h4>3. Add Clues</h4>
            <p>Select words and add clues, or use AI assistance to generate clues automatically.</p>
          </div>
          
          <div className="instruction-step">
            <h4>4. Validate & Share</h4>
            <p>Check puzzle quality, then export or submit to the community section.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrosswordMaker;

