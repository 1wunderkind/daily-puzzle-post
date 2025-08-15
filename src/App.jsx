import React, { useState, useEffect } from 'react';
import './App.css';
import { gameData } from './gameData';
import PremiumModal from './PremiumModal';
import SmartPrompts from './SmartPrompts';
import RetentionFeatures, { trackDailyVisit } from './RetentionFeatures';
import ABTesting, { useABTestingConversion } from './ABTesting';
import SocialProof from './SocialProof';
import ProgressBadges, { triggerPerfectGame, triggerFastGame } from './ProgressBadges';
import WordOfTheDay from './WordOfTheDay';
import BlogSection from './BlogSection';
import GameVariations from './GameVariations';
import SocialIntegration from './SocialIntegration';
import DailyCrossword from './DailyCrossword';
import { hybridHangmanLoader, hangmanLindyHelpers } from './hangmanAPI';
import { trackEvent } from './analytics';

function App() {
  // Game state
  const [currentWord, setCurrentWord] = useState('');
  const [currentHint, setCurrentHint] = useState('');
  const [currentCategory, setCurrentCategory] = useState('');
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [gameStatus, setGameStatus] = useState('playing'); // 'playing', 'won', 'lost'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [hintUsed, setHintUsed] = useState(false);
  const [hintRevealed, setHintRevealed] = useState('');
  
  // Score tracking
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  
  // Premium and monetization
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  
  // Game timing for achievements
  const [gameStartTime, setGameStartTime] = useState(null);
  const [perfectGame, setPerfectGame] = useState(true);

  // New features state
  const [currentView, setCurrentView] = useState('game'); // 'game', 'blog', 'variations'
  const [wordOfTheDay, setWordOfTheDay] = useState(null);
  const [isWordOfDayGame, setIsWordOfDayGame] = useState(false);
  const [isDailyWordMode, setIsDailyWordMode] = useState(false);
  const [dailyWordData, setDailyWordData] = useState(null);
  const [rotationInfo, setRotationInfo] = useState(null);

  const { trackConversion } = useABTestingConversion();

  // Load saved data on component mount
  useEffect(() => {
    const savedScore = localStorage.getItem('dpp_score');
    const savedStreak = localStorage.getItem('dpp_streak');
    const savedGamesPlayed = localStorage.getItem('dpp_games_played');
    const savedPremium = localStorage.getItem('dpp_premium_status');
    
    if (savedScore) setScore(parseInt(savedScore));
    if (savedStreak) setStreak(parseInt(savedStreak));
    if (savedGamesPlayed) setGamesPlayed(parseInt(savedGamesPlayed));
    if (savedPremium === 'true') setIsPremium(true);
    
    // Track daily visit for retention
    trackDailyVisit();
    
    // Start first game
    startNewGame();
  }, []);

  // Save data when state changes
  useEffect(() => {
    localStorage.setItem('dpp_score', score.toString());
    localStorage.setItem('dpp_streak', streak.toString());
    localStorage.setItem('dpp_games_played', gamesPlayed.toString());
  }, [score, streak, gamesPlayed]);

  const getRandomWord = async () => {
    // If daily word mode is enabled, get today's word from rotation
    if (isDailyWordMode) {
      try {
        const todaysWord = await hybridHangmanLoader.getTodaysWord();
        return {
          word: todaysWord.word,
          hint: todaysWord.hint,
          category: todaysWord.category,
          theme: todaysWord.theme,
          difficulty: todaysWord.difficulty,
          isDaily: true,
          wordData: todaysWord
        };
      } catch (error) {
        console.error('Failed to load daily word, falling back to random:', error);
        // Fall through to random word selection
      }
    }
    
    // Original random word logic
    let availableWords = [];
    
    if (selectedCategory === 'all') {
      // Get all words from all categories
      availableWords = Object.values(gameData).flatMap(category => 
        category.words.map(wordObj => ({
          ...wordObj,
          category: category.name
        }))
      );
    } else {
      // Get words from specific category
      const categoryKey = selectedCategory.toUpperCase();
      const categoryData = gameData[categoryKey];
      if (categoryData && categoryData.words) {
        availableWords = categoryData.words.map(wordObj => ({
          ...wordObj,
          category: categoryData.name
        }));
      }
    }
    
    if (availableWords.length === 0) {
      // Fallback to animals
      availableWords = gameData.ANIMALS.words.map(wordObj => ({
        ...wordObj,
        category: gameData.ANIMALS.name
      }));
    }
    
    const randomIndex = Math.floor(Math.random() * availableWords.length);
    return {
      ...availableWords[randomIndex],
      isDaily: false
    };
  };

  const startNewGame = async () => {
    try {
      const wordData = await getRandomWord();
      setCurrentWord(wordData.word);
      setCurrentHint(wordData.hint);
      setCurrentCategory(wordData.category);
      setGuessedLetters([]);
      setWrongGuesses(0);
      setGameStatus('playing');
      setHintUsed(false);
      setHintRevealed('');
      setGameStartTime(Date.now());
      setPerfectGame(true);
      
      // Store daily word data if applicable
      if (wordData.isDaily) {
        setDailyWordData(wordData.wordData);
      } else {
        setDailyWordData(null);
      }
      
      // Track game start with enhanced data
      trackEvent('game_start', {
        category: wordData.category,
        word_length: wordData.word.length,
        is_daily: wordData.isDaily || false,
        theme: wordData.theme || 'random',
        difficulty: wordData.difficulty || 3
      });
    } catch (error) {
      console.error('Error starting new game:', error);
      // Fallback to a simple word if everything fails
      setCurrentWord('PUZZLE');
      setCurrentHint('A challenging problem to solve');
      setCurrentCategory('General');
      setGuessedLetters([]);
      setWrongGuesses(0);
      setGameStatus('playing');
      setHintUsed(false);
      setHintRevealed('');
      setGameStartTime(Date.now());
      setPerfectGame(true);
      setDailyWordData(null);
    }
  };

  const handleLetterGuess = (letter) => {
    if (guessedLetters.includes(letter) || gameStatus !== 'playing') {
      return;
    }

    const newGuessedLetters = [...guessedLetters, letter];
    setGuessedLetters(newGuessedLetters);

    if (currentWord.includes(letter)) {
      // Correct guess
      const wordLetters = currentWord.split('');
      const allLettersGuessed = wordLetters.every(
        wordLetter => newGuessedLetters.includes(wordLetter)
      );

      if (allLettersGuessed) {
        // Game won
        setGameStatus('won');
        const newScore = score + 1;
        const newStreak = streak + 1;
        const newGamesPlayed = gamesPlayed + 1;
        
        setScore(newScore);
        setStreak(newStreak);
        setGamesPlayed(newGamesPlayed);
        
        // Check for achievements
        const gameTime = Date.now() - gameStartTime;
        if (gameTime < 30000) { // Under 30 seconds
          triggerFastGame();
        }
        if (perfectGame && wrongGuesses === 0) {
          triggerPerfectGame();
        }
        
        // Track win
        trackEvent('game_win', {
          category: currentCategory,
          word: currentWord,
          time_taken: gameTime,
          wrong_guesses: wrongGuesses,
          hint_used: hintUsed,
          perfect_game: perfectGame && wrongGuesses === 0,
          is_daily: isDailyWordMode,
          word_id: dailyWordData?.id
        });
        
        // Record analytics for Lindy.ai if daily word
        if (isDailyWordMode && dailyWordData) {
          hangmanLindyHelpers.recordGameCompletion(dailyWordData.id, {
            sessionId: 'anonymous',
            duration: Math.floor(gameTime / 1000),
            wrongGuesses: wrongGuesses,
            guessedLetters: newGuessedLetters,
            isWon: true,
            hintUsed: hintUsed,
            difficulty: dailyWordData.difficulty,
            wordLength: currentWord.length,
            theme: dailyWordData.theme
          }).catch(err => console.warn('Analytics recording failed:', err));
        }
      }
      
      // Track correct guess
      trackEvent('letter_guess', {
        letter: letter,
        correct: true,
        word: currentWord
      });
    } else {
      // Wrong guess
      const newWrongGuesses = wrongGuesses + 1;
      setWrongGuesses(newWrongGuesses);
      setPerfectGame(false);

      if (newWrongGuesses >= 6) {
        // Game lost
        setGameStatus('lost');
        setStreak(0); // Reset streak on loss
        setGamesPlayed(gamesPlayed + 1);
        
        // Track loss
        trackEvent('game_loss', {
          category: currentCategory,
          word: currentWord,
          wrong_guesses: newWrongGuesses,
          hint_used: hintUsed,
          is_daily: isDailyWordMode,
          word_id: dailyWordData?.id
        });
        
        // Record analytics for Lindy.ai if daily word
        if (isDailyWordMode && dailyWordData) {
          hangmanLindyHelpers.recordGameCompletion(dailyWordData.id, {
            sessionId: 'anonymous',
            duration: Math.floor((Date.now() - gameStartTime) / 1000),
            wrongGuesses: newWrongGuesses,
            guessedLetters: newGuessedLetters,
            isWon: false,
            hintUsed: hintUsed,
            difficulty: dailyWordData.difficulty,
            wordLength: currentWord.length,
            theme: dailyWordData.theme
          }).catch(err => console.warn('Analytics recording failed:', err));
        }
      }
      
      // Track wrong guess
      trackEvent('letter_guess', {
        letter: letter,
        correct: false,
        word: currentWord
      });
    }
  };

  const handleHint = () => {
    if (hintUsed || gameStatus !== 'playing') return;
    
    // Find an unguessed letter from the word
    const unguessedLetters = currentWord.split('').filter(
      letter => !guessedLetters.includes(letter)
    );
    
    if (unguessedLetters.length > 0) {
      const randomLetter = unguessedLetters[Math.floor(Math.random() * unguessedLetters.length)];
      setHintRevealed(randomLetter);
      setHintUsed(true);
      
      // Track hint usage
      trackEvent('hint_used', {
        category: currentCategory,
        word: currentWord,
        revealed_letter: randomLetter
      });
    }
  };

  const handleCategoryChange = (event) => {
    const newCategory = event.target.value;
    setSelectedCategory(newCategory);
    
    // Track category change
    trackEvent('category_change', {
      from_category: selectedCategory,
      to_category: newCategory
    });
    
    // Start new game with new category
    setTimeout(() => {
      startNewGame();
    }, 100);
  };

  const handlePremiumClick = (source = 'header') => {
    setShowPremiumModal(true);
    
    // Track premium button click
    trackEvent('premium_click', {
      source: source,
      games_played: gamesPlayed,
      current_score: score
    });
  };

  const handlePremiumUpgrade = () => {
    setIsPremium(true);
    localStorage.setItem('dpp_premium_status', 'true');
    setShowPremiumModal(false);
    
    // Track conversion
    trackConversion();
    trackEvent('premium_upgrade', {
      games_played: gamesPlayed,
      score: score,
      streak: streak
    });
    
    // Add premium class to body
    document.body.classList.add('premium-active');
  };

  const handleEmailCapture = (email) => {
    // Track email capture
    trackEvent('email_capture', {
      email: email,
      games_played: gamesPlayed,
      score: score
    });
  };

  const handleShare = (platform) => {
    // Track sharing
    trackEvent('share', {
      platform: platform,
      word: currentWord,
      score: score
    });
  };

  const handleBadgeEarned = (badge) => {
    // Track badge earning
    trackEvent('badge_earned', {
      badge_id: badge.id,
      badge_name: badge.name,
      score: score,
      games_played: gamesPlayed
    });
  };

  // New feature handlers
  const handleWordOfDaySelect = (word, hint, category, isWordOfDay = false) => {
    setCurrentWord(word);
    setCurrentHint(hint);
    setCurrentCategory(category);
    setGuessedLetters([]);
    setWrongGuesses(0);
    setGameStatus('playing');
    setHintUsed(false);
    setHintRevealed('');
    setGameStartTime(Date.now());
    setPerfectGame(true);
    setIsWordOfDayGame(isWordOfDay);
    setCurrentView('game');
    
    trackEvent('word_of_day_selected', {
      word: word,
      category: category,
      is_word_of_day: isWordOfDay
    });
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
    trackEvent('view_change', {
      from_view: currentView,
      to_view: view
    });
  };

  const handleGameSelect = (gameType) => {
    if (gameType === 'hangman') {
      setCurrentView('game');
      startNewGame();
    }
    trackEvent('game_select', {
      game_type: gameType
    });
  };

  const displayWord = () => {
    return currentWord
      .split('')
      .map(letter => {
        if (guessedLetters.includes(letter) || (hintRevealed && letter === hintRevealed)) {
          return letter;
        }
        return '_';
      })
      .join(' ');
  };

  const getHangmanDrawing = () => {
    const drawings = [
      '', // 0 wrong guesses
      '  |\n  |\n  |\n  |\n__|', // 1
      '  +---+\n  |   |\n      |\n      |\n      |\n  ____|', // 2
      '  +---+\n  |   |\n  O   |\n      |\n      |\n  ____|', // 3
      '  +---+\n  |   |\n  O   |\n  |   |\n      |\n  ____|', // 4
      '  +---+\n  |   |\n  O   |\n /|   |\n      |\n  ____|', // 5
      '  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n  ____|', // 6 (final)
      '  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n  ____|', // 7 (game over)
    ];
    return drawings[Math.min(wrongGuesses, drawings.length - 1)];
  };

  const getStatusMessage = () => {
    if (gameStatus === 'won') {
      const messages = ['🎉 Great job!', '🌟 Excellent work!', '🏆 Well done!', '✨ Fantastic!'];
      return messages[Math.floor(Math.random() * messages.length)];
    } else if (gameStatus === 'lost') {
      return `💪 Try again! The word was: ${currentWord}`;
    } else {
      return `Wrong guesses: ${wrongGuesses}/6`;
    }
  };

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // Get current date for newspaper header
  const getCurrentDate = () => {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date().toLocaleDateString('en-US', options);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="site-header">
        <div className="header-container">
          <div className="site-logo">
            Daily Puzzle Post
          </div>
          <div className="premium-section">
            {isPremium ? (
              <div className="premium-badge">⭐ PREMIUM</div>
            ) : (
              <ABTesting onPremiumClick={handlePremiumClick} isPremium={isPremium} />
            )}
          </div>
        </div>
      </header>

      {/* Date Header */}
      <div className="date-header">
        {getCurrentDate()}
      </div>

      {/* Game Tabs */}
      <nav className="game-tabs">
        <div className="tabs-container">
          <button 
            className={`tab-button ${currentView === 'game' ? 'active' : ''}`}
            onClick={() => handleViewChange('game')}
          >
            🎯 Hangman
          </button>
          <button 
            className={`tab-button ${currentView === 'crossword' ? 'active' : ''}`}
            onClick={() => handleViewChange('crossword')}
          >
            📝 Daily Crossword
          </button>
          <button 
            className={`tab-button ${currentView === 'variations' ? 'active' : ''}`}
            onClick={() => handleViewChange('variations')}
          >
            🎮 All Games
          </button>
          <button 
            className={`tab-button ${currentView === 'blog' ? 'active' : ''}`}
            onClick={() => handleViewChange('blog')}
          >
            📰 Strategy Tips
          </button>
          <button className="tab-button coming-soon">
            🔤 Word Scramble
            <span className="coming-soon-badge">Coming Soon</span>
          </button>
          <button className="tab-button coming-soon">
            🔍 Word Search
            <span className="coming-soon-badge">Coming Soon</span>
          </button>
        </div>
      </nav>

      {/* Retention Features */}
      <RetentionFeatures 
        isPremium={isPremium} 
        onEmailCapture={handleEmailCapture}
      />

      {/* Word of the Day */}
      {currentView === 'game' && (
        <WordOfTheDay 
          onWordSelect={handleWordOfDaySelect}
          currentWord={currentWord}
          gameStatus={gameStatus}
        />
      )}

      {/* Main Content */}
      <main className="main-content">
        {currentView === 'game' && (
          <div className="content-container">
            {/* Left Sidebar - Ads */}
            <aside className="sidebar-left">
              {!isPremium && (
                <>
                  <div className="adsense-container adsense-sidebar-rectangle">
                    <div className="ad-label-container">
                      <span className="ad-label">Advertisement</span>
                    </div>
                    <div className="adsense-placeholder">
                      <div>300 x 250</div>
                      <div>Sidebar Ad</div>
                      <div style={{ fontSize: '10px', marginTop: '10px' }}>
                        {/* Replace with actual AdSense code */}
                        {/* <ins className="adsbygoogle" style={{display:'block'}} data-ad-client="ca-pub-XXXXXXXXX" data-ad-slot="XXXXXXXXX" data-ad-format="auto"></ins> */}
                      </div>
                    </div>
                  </div>
                  
                  <SocialProof 
                    currentWord={gameStatus === 'won' ? currentWord : null}
                    gameStatus={gameStatus}
                    onShare={handleShare}
                  />
                </>
              )}
            </aside>

            {/* Game Area */}
            <section className="game-area">
            {/* Header Ad */}
            {!isPremium && (
              <div className="adsense-container adsense-header-banner">
                <div className="ad-label-container">
                  <span className="ad-label">Paid Advertisement</span>
                </div>
                <div className="adsense-placeholder">
                  <div>728 x 90 (Desktop) / 320 x 50 (Mobile)</div>
                  <div>Header Leaderboard</div>
                  <div style={{ fontSize: '10px', marginTop: '5px' }}>
                    {/* Replace with actual AdSense code */}
                    {/* <ins className="adsbygoogle" style={{display:'block'}} data-ad-client="ca-pub-XXXXXXXXX" data-ad-slot="XXXXXXXXX" data-ad-format="auto" data-full-width-responsive="true"></ins> */}
                  </div>
                </div>
              </div>
            )}

            <div className="game-container">
              <h2>Hangman Puzzle</h2>
              <p>Guess the word one letter at a time. You have 6 wrong guesses!</p>

              {/* Score Display */}
              <div className="score-container">
                <div className="score-display">
                  <span className="score-number">{score}</span>
                  <span className="score-label">Words Solved</span>
                </div>
                <div className="streak-display">
                  <span className="streak-number">{streak}</span>
                  <span className="streak-label">Win Streak</span>
                </div>
              </div>

              {/* Category Selector */}
              <div className="category-selector-container">
                <select 
                  value={selectedCategory} 
                  onChange={handleCategoryChange}
                  className="category-selector"
                  disabled={gameStatus === 'playing'}
                >
                  <option value="all">All Categories</option>
                  <option value="animals">Animals</option>
                  <option value="food">Food</option>
                  <option value="places">Places</option>
                  <option value="objects">Objects</option>
                </select>
              </div>

              {/* Category Display */}
              <div className="category-display">
                Category: {currentCategory}
              </div>

              {/* Hangman Drawing */}
              <div className="hangman-display">
                {getHangmanDrawing()}
              </div>

              {/* Word Display */}
              <div className="word-display">
                {displayWord()}
              </div>

              {/* Status Message */}
              <div className={`status-message ${gameStatus === 'won' ? 'status-win' : gameStatus === 'lost' ? 'status-lose' : ''}`}>
                {getStatusMessage()}
              </div>

              {/* Alphabet Grid */}
              <div className="alphabet-grid">
                {alphabet.map(letter => (
                  <button
                    key={letter}
                    className={`letter-button ${
                      guessedLetters.includes(letter)
                        ? currentWord.includes(letter)
                          ? 'correct'
                          : 'wrong'
                        : ''
                    }`}
                    onClick={() => handleLetterGuess(letter)}
                    disabled={guessedLetters.includes(letter) || gameStatus !== 'playing'}
                  >
                    {letter}
                  </button>
                ))}
              </div>

              {/* Game Controls */}
              <div className="game-controls">
                <button className="game-button" onClick={startNewGame}>
                  New Game
                </button>
                <button 
                  className="hint-button" 
                  onClick={handleHint}
                  disabled={hintUsed || gameStatus !== 'playing'}
                >
                  {hintUsed ? 'Hint Used' : 'Show Hint'}
                </button>
                <button 
                  className={`daily-word-toggle ${isDailyWordMode ? 'active' : ''}`}
                  onClick={() => {
                    setIsDailyWordMode(!isDailyWordMode);
                    trackEvent('daily_word_mode_toggle', {
                      enabled: !isDailyWordMode
                    });
                  }}
                  title={isDailyWordMode ? 'Switch to Random Words' : 'Switch to Daily Word'}
                >
                  {isDailyWordMode ? '📅 Daily Word' : '🎲 Random'}
                </button>
              </div>

              {/* Daily Word Info */}
              {isDailyWordMode && dailyWordData && (
                <div className="daily-word-info">
                  <div className="daily-word-header">
                    📅 Today's Daily Word
                  </div>
                  <div className="daily-word-details">
                    <span className="word-theme">Theme: {dailyWordData.theme}</span>
                    <span className="word-difficulty">
                      Difficulty: {dailyWordData.difficultyLabel} 
                      ({Array(dailyWordData.difficulty).fill('⭐').join('')})
                    </span>
                    {dailyWordData.todaysInfo && (
                      <span className="rotation-info">
                        Day {dailyWordData.todaysInfo.dayInCycle || dailyWordData.todaysInfo.wordIndex} of 30
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Hint Display */}
              {hintUsed && (
                <div className="hint-display">
                  💡 Hint: {currentHint}
                  {hintRevealed && (
                    <div style={{ marginTop: '10px', fontWeight: 'bold' }}>
                      Revealed letter: {hintRevealed}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Progress Badges */}
            <ProgressBadges 
              score={score}
              streak={streak}
              gamesPlayed={gamesPlayed}
              onBadgeEarned={handleBadgeEarned}
            />

            {/* Between Games Ad */}
            {!isPremium && gameStatus !== 'playing' && (
              <div className="adsense-container adsense-between-games">
                <div className="ad-label-container">
                  <span className="ad-label">Advertisement</span>
                </div>
                <div className="adsense-placeholder">
                  <div>336 x 280</div>
                  <div>Between Games</div>
                  <div style={{ fontSize: '10px', marginTop: '10px' }}>
                    {/* Replace with actual AdSense code */}
                    {/* <ins className="adsbygoogle" style={{display:'block'}} data-ad-client="ca-pub-XXXXXXXXX" data-ad-slot="XXXXXXXXX" data-ad-format="auto"></ins> */}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Right Sidebar - Ads */}
          <aside className="sidebar-right">
            {!isPremium && (
              <div className="adsense-container adsense-sidebar-rectangle">
                <div className="ad-label-container">
                  <span className="ad-label">Sponsored Content</span>
                </div>
                <div className="adsense-placeholder">
                  <div>300 x 250</div>
                  <div>Sidebar Ad</div>
                  <div style={{ fontSize: '10px', marginTop: '10px' }}>
                    {/* Replace with actual AdSense code */}
                    {/* <ins className="adsbygoogle" style={{display:'block'}} data-ad-client="ca-pub-XXXXXXXXX" data-ad-slot="XXXXXXXXX" data-ad-format="auto"></ins> */}
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
        )}

        {/* Blog View */}
        {currentView === 'blog' && (
          <BlogSection />
        )}

        {/* Daily Crossword View */}
        {currentView === 'crossword' && (
          <DailyCrossword 
            isPremium={isPremium}
            onPremiumClick={handlePremiumClick}
          />
        )}

        {/* Game Variations View */}
        {currentView === 'variations' && (
          <GameVariations 
            currentGame="hangman"
            onGameSelect={handleGameSelect}
          />
        )}

        {/* Social Integration - Always visible */}
        <SocialIntegration 
          currentScore={score}
          currentStreak={streak}
          gamesPlayed={gamesPlayed}
          currentWord={currentWord}
          gameStatus={gameStatus}
          wordOfTheDay={wordOfTheDay}
        />
      </main>

      {/* Footer */}
      <footer className="site-footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>Daily Puzzle Post</h3>
              <p>Your trusted source for daily brain training and word puzzles. Challenge yourself with our growing collection of games designed for puzzle enthusiasts of all ages.</p>
            </div>
            <div className="footer-section">
              <h4>Games</h4>
              <ul>
                <li><a href="#hangman">Hangman</a></li>
                <li><a href="#crossword">Daily Crossword</a></li>
                <li className="coming-soon">Word Scramble (Coming Soon)</li>
                <li className="coming-soon">Word Search (Coming Soon)</li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Account</h4>
              <ul>
                <li>
                  <button 
                    className="footer-premium-link"
                    onClick={() => handlePremiumClick('footer')}
                  >
                    {isPremium ? 'Premium Account' : 'Upgrade to Premium'}
                  </button>
                </li>
                <li><a href="#privacy">Privacy Policy</a></li>
                <li><a href="#terms">Terms of Service</a></li>
                <li><a href="#contact">Contact Us</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 Daily Puzzle Post. All rights reserved. | Designed for puzzle enthusiasts worldwide.</p>
          </div>
        </div>
      </footer>

      {/* Footer Leaderboard Ad */}
      {!isPremium && (
        <div className="adsense-container adsense-footer-leaderboard">
          <div className="ad-label-container">
            <span className="ad-label">Classified Advertisements</span>
          </div>
          <div className="adsense-placeholder">
            <div>728 x 90</div>
            <div>Footer Leaderboard</div>
            <div style={{ fontSize: '10px', marginTop: '5px' }}>
              {/* Replace with actual AdSense code */}
              {/* <ins className="adsbygoogle" style={{display:'block'}} data-ad-client="ca-pub-XXXXXXXXX" data-ad-slot="XXXXXXXXX" data-ad-format="auto" data-full-width-responsive="true"></ins> */}
            </div>
          </div>
        </div>
      )}

      {/* Modals and Prompts */}
      {showPremiumModal && (
        <PremiumModal 
          onClose={() => setShowPremiumModal(false)}
          onUpgrade={handlePremiumUpgrade}
        />
      )}

      <SmartPrompts 
        gamesPlayed={gamesPlayed}
        onPremiumClick={handlePremiumClick}
        isPremium={isPremium}
        gameStatus={gameStatus}
        showBetweenGames={gameStatus !== 'playing'}
      />
    </div>
  );
}

export default App;

