import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import './DailyAnagram.css';

const DailyAnagram = () => {
  const [anagramData, setAnagramData] = useState(null);
  const [userGuess, setUserGuess] = useState('');
  const [gameStatus, setGameStatus] = useState('playing'); // 'playing', 'won', 'lost'
  const [showHint, setShowHint] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [maxAttempts] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [completionTime, setCompletionTime] = useState(null);
  const [shuffledLetters, setShuffledLetters] = useState([]);
  const [selectedLetters, setSelectedLetters] = useState([]);

  useEffect(() => {
    loadTodaysAnagram();
    setStartTime(Date.now());
  }, []);

  const loadTodaysAnagram = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/anagram/today');
      if (!response.ok) {
        throw new Error('Failed to load today\'s anagram');
      }
      
      const data = await response.json();
      setAnagramData(data);
      
      // Shuffle the letters for the puzzle
      const letters = data.scrambledWord.split('');
      setShuffledLetters(shuffleArray([...letters]));
      
    } catch (err) {
      console.error('Error loading anagram:', err);
      setError('Failed to load today\'s anagram. Please try again later.');
      
      // Fallback to offline data if available
      loadOfflineAnagram();
    } finally {
      setLoading(false);
    }
  };

  const loadOfflineAnagram = () => {
    // Fallback anagram for offline mode
    const fallbackAnagram = {
      id: 'fallback_01',
      date: new Date().toISOString().split('T')[0],
      originalWord: 'PUZZLE',
      scrambledWord: 'LEZZUP',
      definition: 'A game, toy, or problem designed to test ingenuity or knowledge',
      difficulty: 'medium',
      category: 'Games',
      hint: 'Something you solve for fun',
      wordLength: 6,
      created_by: 'Daily Puzzle Post'
    };
    
    setAnagramData(fallbackAnagram);
    const letters = fallbackAnagram.scrambledWord.split('');
    setShuffledLetters(shuffleArray([...letters]));
  };

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const handleLetterClick = (letter, index) => {
    if (gameStatus !== 'playing') return;
    
    // Add letter to selected letters
    setSelectedLetters(prev => [...prev, { letter, originalIndex: index }]);
    
    // Remove letter from shuffled letters (visually)
    setShuffledLetters(prev => 
      prev.map((l, i) => i === index ? null : l)
    );
    
    // Update user guess
    setUserGuess(prev => prev + letter);
  };

  const handleRemoveLetter = (indexToRemove) => {
    if (gameStatus !== 'playing') return;
    
    const letterToRemove = selectedLetters[indexToRemove];
    
    // Remove from selected letters
    setSelectedLetters(prev => prev.filter((_, i) => i !== indexToRemove));
    
    // Add back to shuffled letters
    setShuffledLetters(prev => {
      const newShuffled = [...prev];
      newShuffled[letterToRemove.originalIndex] = letterToRemove.letter;
      return newShuffled;
    });
    
    // Update user guess
    setUserGuess(prev => {
      const letters = prev.split('');
      letters.splice(indexToRemove, 1);
      return letters.join('');
    });
  };

  const handleSubmitGuess = () => {
    if (!userGuess.trim() || gameStatus !== 'playing') return;
    
    const guess = userGuess.toUpperCase().trim();
    const correctAnswer = anagramData.originalWord.toUpperCase();
    
    setAttempts(prev => prev + 1);
    
    if (guess === correctAnswer) {
      setGameStatus('won');
      setCompletionTime(Date.now());
      
      // Track analytics
      if (window.analytics) {
        window.analytics.trackEvent('anagram_complete', {
          category: 'game',
          label: 'won',
          value: maxAttempts - attempts,
          time_elapsed: Date.now() - startTime,
          word: correctAnswer,
          attempts_used: attempts + 1,
          game_type: 'anagram',
          difficulty: anagramData.difficulty
        });
      }
    } else if (attempts + 1 >= maxAttempts) {
      setGameStatus('lost');
      setCompletionTime(Date.now());
      
      // Track analytics
      if (window.analytics) {
        window.analytics.trackEvent('anagram_complete', {
          category: 'game',
          label: 'lost',
          value: 0,
          time_elapsed: Date.now() - startTime,
          word: correctAnswer,
          attempts_used: attempts + 1,
          game_type: 'anagram',
          difficulty: anagramData.difficulty
        });
      }
    } else {
      // Wrong guess, reset the letters
      resetLetters();
      
      // Track wrong guess
      if (window.analytics) {
        window.analytics.trackEvent('anagram_wrong_guess', {
          category: 'game',
          label: guess,
          attempts_remaining: maxAttempts - attempts - 1,
          correct_word: correctAnswer,
          game_type: 'anagram'
        });
      }
    }
  };

  const resetLetters = () => {
    setSelectedLetters([]);
    setUserGuess('');
    setShuffledLetters(shuffleArray(anagramData.scrambledWord.split('')));
  };

  const handleShowHint = () => {
    setShowHint(true);
    
    // Track hint usage
    if (window.analytics) {
      window.analytics.trackEvent('anagram_hint_used', {
        category: 'game',
        word: anagramData.originalWord,
        attempts_used: attempts,
        game_type: 'anagram'
      });
    }
  };

  const handleNewGame = () => {
    loadTodaysAnagram();
    setUserGuess('');
    setSelectedLetters([]);
    setGameStatus('playing');
    setShowHint(false);
    setAttempts(0);
    setStartTime(Date.now());
    setCompletionTime(null);
  };

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="anagram-container">
        <Helmet>
          <title>Daily Anagram - Loading... | Daily Puzzle Post</title>
        </Helmet>
        <div className="newspaper-container">
          <header className="newspaper-header">
            <h1 className="masthead">DAILY PUZZLE POST</h1>
            <div className="date-line">Loading Today's Anagram...</div>
          </header>
          <div className="loading-message">
            <p>Preparing your daily word puzzle...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="anagram-container">
        <Helmet>
          <title>Daily Anagram - Error | Daily Puzzle Post</title>
        </Helmet>
        <div className="newspaper-container">
          <header className="newspaper-header">
            <h1 className="masthead">DAILY PUZZLE POST</h1>
            <div className="date-line">Error Loading Anagram</div>
          </header>
          <div className="error-message">
            <p>{error}</p>
            <button onClick={loadTodaysAnagram} className="retry-button">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="anagram-container">
      <Helmet>
        <title>Daily Anagram - {anagramData?.originalWord || 'Word Puzzle'} | Daily Puzzle Post</title>
        <meta name="description" content={`Solve today's anagram puzzle! Unscramble the letters to find the hidden word. ${anagramData?.difficulty || 'Medium'} difficulty word puzzle.`} />
        <meta name="keywords" content="anagram, word puzzle, daily puzzle, word game, brain teaser, vocabulary" />
        
        {/* Open Graph tags */}
        <meta property="og:title" content="Daily Anagram - Word Puzzle Challenge" />
        <meta property="og:description" content="Test your vocabulary with today's anagram puzzle. Unscramble the letters to reveal the hidden word!" />
        <meta property="og:type" content="game" />
        
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Daily Anagram - Word Puzzle" />
        <meta name="twitter:description" content="Challenge yourself with today's anagram puzzle!" />
      </Helmet>

      <div className="newspaper-container">
        <header className="newspaper-header">
          <h1 className="masthead">DAILY PUZZLE POST</h1>
          <div className="date-line">
            {anagramData?.date ? new Date(anagramData.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) : new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </header>

        <div className="anagram-content">
          <div className="section-header">
            <h2>Daily Anagram</h2>
            <div className="puzzle-info">
              <span className="difficulty">Difficulty: {anagramData?.difficulty || 'Medium'}</span>
              <span className="category">Category: {anagramData?.category || 'General'}</span>
              <span className="attempts">Attempts: {attempts}/{maxAttempts}</span>
            </div>
          </div>

          <div className="anagram-game">
            <div className="game-instructions">
              <p>Unscramble the letters below to form a word:</p>
            </div>

            {/* Scrambled Letters */}
            <div className="scrambled-letters">
              <h3>Available Letters:</h3>
              <div className="letter-bank">
                {shuffledLetters.map((letter, index) => (
                  letter ? (
                    <button
                      key={index}
                      className="letter-button available"
                      onClick={() => handleLetterClick(letter, index)}
                      disabled={gameStatus !== 'playing'}
                    >
                      {letter}
                    </button>
                  ) : (
                    <div key={index} className="letter-button empty"></div>
                  )
                ))}
              </div>
            </div>

            {/* User's Guess */}
            <div className="guess-area">
              <h3>Your Answer:</h3>
              <div className="guess-letters">
                {selectedLetters.map((letterObj, index) => (
                  <button
                    key={index}
                    className="letter-button selected"
                    onClick={() => handleRemoveLetter(index)}
                    disabled={gameStatus !== 'playing'}
                  >
                    {letterObj.letter}
                  </button>
                ))}
                {/* Empty slots */}
                {Array.from({ length: (anagramData?.wordLength || 6) - selectedLetters.length }).map((_, index) => (
                  <div key={`empty-${index}`} className="letter-button placeholder">_</div>
                ))}
              </div>
            </div>

            {/* Game Controls */}
            <div className="game-controls">
              <button
                onClick={handleSubmitGuess}
                className="submit-button"
                disabled={gameStatus !== 'playing' || selectedLetters.length !== (anagramData?.wordLength || 6)}
              >
                Submit Answer
              </button>
              
              <button
                onClick={resetLetters}
                className="reset-button"
                disabled={gameStatus !== 'playing'}
              >
                Clear Letters
              </button>

              {!showHint && gameStatus === 'playing' && (
                <button
                  onClick={handleShowHint}
                  className="hint-button"
                  disabled={attempts === 0}
                >
                  Show Hint
                </button>
              )}
            </div>

            {/* Hint Display */}
            {showHint && anagramData?.hint && (
              <div className="hint-section">
                <h4>Hint:</h4>
                <p className="hint-text">{anagramData.hint}</p>
              </div>
            )}

            {/* Game Status */}
            {gameStatus === 'won' && (
              <div className="game-result success">
                <h3>🎉 Congratulations!</h3>
                <p>You solved the anagram: <strong>{anagramData.originalWord}</strong></p>
                <p className="definition"><strong>Definition:</strong> {anagramData.definition}</p>
                <div className="stats">
                  <p>Attempts used: {attempts}/{maxAttempts}</p>
                  {completionTime && <p>Time: {formatTime(completionTime - startTime)}</p>}
                </div>
                <button onClick={handleNewGame} className="new-game-button">
                  Try Tomorrow's Puzzle
                </button>
              </div>
            )}

            {gameStatus === 'lost' && (
              <div className="game-result failure">
                <h3>Game Over</h3>
                <p>The correct answer was: <strong>{anagramData.originalWord}</strong></p>
                <p className="definition"><strong>Definition:</strong> {anagramData.definition}</p>
                <div className="stats">
                  <p>Attempts used: {attempts}/{maxAttempts}</p>
                  {completionTime && <p>Time: {formatTime(completionTime - startTime)}</p>}
                </div>
                <button onClick={handleNewGame} className="new-game-button">
                  Try Tomorrow's Puzzle
                </button>
              </div>
            )}
          </div>

          {/* Game Information */}
          <div className="game-info">
            <h3>How to Play</h3>
            <ul>
              <li>Click on the available letters to build your answer</li>
              <li>Click on selected letters to remove them</li>
              <li>You have {maxAttempts} attempts to find the correct word</li>
              <li>Use the hint button if you need help (available after first attempt)</li>
              <li>Try to solve it as quickly as possible!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyAnagram;

