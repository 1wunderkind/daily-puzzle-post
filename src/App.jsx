import React, { useState, useEffect } from 'react';
import './App.css';
import { gameData } from './gameData';
import './fallbackData'; // Initialize fallback mode for production
import PremiumModal from './PremiumModal';
import SmartPrompts from './SmartPrompts';
import RetentionFeatures, { trackDailyVisit } from './RetentionFeatures';
import ABTesting, { useABTestingConversion } from './ABTesting';
import ProgressBadges, { triggerPerfectGame, triggerFastGame } from './ProgressBadges';
import GameVariations from './GameVariations';
import SocialIntegration from './SocialIntegration';
import DailyCrossword from './DailyCrossword';
import DailySudoku from './DailySudoku';
import DailyWordSearch from './DailyWordSearch';
import DailyAnagram from './DailyAnagram';
import CrosswordMaker from './CrosswordMaker';
import AboutUs from './AboutUs';
import ContactUs from './ContactUs';
import FAQ from './FAQ';
import { hybridHangmanLoader, hangmanLindyHelpers } from './hangmanAPI';
import { trackEvent } from './analytics';
import { HeaderAd, SidebarAd, TextAd } from './AdPlacement';
import ArchiveAccess, { AdController } from './ArchiveAccess';
import { checkPremiumStatus } from './StripeIntegration';
import OfflineUpgradePrompt from './OfflineUpgradePrompt';
import offlineContentManager from './OfflineContentManager';
import PrivacyPolicy from './PrivacyPolicy';
import TermsOfService from './TermsOfService';

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
  const [isPremium, setIsPremium] = useState(checkPremiumStatus());
  
  // Game timing for achievements
  const [gameStartTime, setGameStartTime] = useState(null);
  const [perfectGame, setPerfectGame] = useState(true);

  // New features state
  const [currentView, setCurrentView] = useState('game'); // 'game', 'blog', 'variations', 'privacy', 'terms'
  const [wordOfTheDay, setWordOfTheDay] = useState(null);
  const [isWordOfDayGame, setIsWordOfDayGame] = useState(false);
  const [rotationInfo, setRotationInfo] = useState(null);

  const { trackConversion } = useABTestingConversion();

  // Load saved data on component mount
  useEffect(() => {
    const savedScore = localStorage.getItem('dpp_score');
    const savedStreak = localStorage.getItem('dpp_streak');
    const savedGamesPlayed = localStorage.getItem('dpp_games_played');
    
    if (savedScore) setScore(parseInt(savedScore));
    if (savedStreak) setStreak(parseInt(savedStreak));
    if (savedGamesPlayed) setGamesPlayed(parseInt(savedGamesPlayed));
    
    // Initialize ad control based on premium status
    AdController.initializeAdControl();
    
    // Listen for premium modal trigger
    const handleShowPremiumModal = () => setShowPremiumModal(true);
    window.addEventListener('showPremiumModal', handleShowPremiumModal);
    
    // Remove loading screen now that React has mounted
    if (window.removeLoadingScreen) {
      window.removeLoadingScreen();
    }
    
    // Track daily visit for retention
    trackDailyVisit();
    
    // Start first game
    startNewGame();
    
    return () => {
      window.removeEventListener('showPremiumModal', handleShowPremiumModal);
    };
  }, []);

  // Save data when state changes
  useEffect(() => {
    localStorage.setItem('dpp_score', score.toString());
    localStorage.setItem('dpp_streak', streak.toString());
    localStorage.setItem('dpp_games_played', gamesPlayed.toString());
  }, [score, streak, gamesPlayed]);

  const getRandomWord = async () => {
    // Random word logic
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
      // Check offline content access before starting game
      const accessCheck = offlineContentManager.canAccessOfflineContent('hangman');
      
      if (!accessCheck.allowed) {
        // Show upgrade prompt for offline limit reached
        setShowPremiumModal(true);
        return;
      }
      
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
      
      // Record offline play if applicable
      if (!navigator.onLine && !offlineContentManager.isPremiumUser()) {
        offlineContentManager.recordOfflinePlay('hangman');
      }
      
      // Track game start with enhanced data
      trackEvent('game_start', {
        category: wordData.category,
        word_length: wordData.word.length,
        is_daily: wordData.isDaily || false,
        theme: wordData.theme || 'random',
        difficulty: wordData.difficulty || 3,
        offline: !navigator.onLine,
        access_type: accessCheck.reason
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
        trackEvent('game_won', {
          category: currentCategory,
          word: currentWord,
          time_taken: gameTime,
          wrong_guesses: wrongGuesses,
          hint_used: hintUsed,
          perfect_game: perfectGame && wrongGuesses === 0
        });
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
        trackEvent('game_lost', {
          category: currentCategory,
          word: currentWord,
          wrong_guesses: newWrongGuesses,
          hint_used: hintUsed
        });
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
          <div className="header-tagline">
            Your trusted source for daily brain training since 2024
          </div>
        </div>
      </header>

      {/* Date Header */}
      <div className="date-header">
        {getCurrentDate()}
      </div>

      {/* Prominent Ad-Free Mode Button */}
      <div className="prominent-premium-section">
        <button 
          className="prominent-premium-button"
          onClick={() => {
            // Show coming soon modal
            const modal = document.createElement('div');
            modal.className = 'coming-soon-modal-overlay';
            modal.innerHTML = `
              <div class="coming-soon-modal">
                <div class="coming-soon-content">
                  <h3>Ad-Free Mode</h3>
                  <p>Ad-Free Mode launches soon! We're finalizing the details for this premium experience. Check back in a few days.</p>
                  <button class="coming-soon-close" onclick="this.closest('.coming-soon-modal-overlay').remove()">
                    Got it!
                  </button>
                </div>
              </div>
            `;
            document.body.appendChild(modal);
            
            trackEvent('coming_soon_clicked', {
              location: 'prominent',
              feature: 'ad_free_mode'
            });
          }}
        >
          <span className="premium-button-text">🚀 Upgrade to Ad-Free Mode</span>
          <span className="premium-coming-soon-badge">Coming Soon</span>
        </button>
      </div>

      {/* Newspaper Section Navigation */}
      <nav className="newspaper-sections">
        {/* Daily Games Section */}
        <div className="section-group">
          <h2 className="section-header">DAILY GAMES</h2>
          <div className="section-divider"></div>
          <div className="games-row">
            <button 
              className={`game-button ${currentView === 'game' ? 'active' : ''}`}
              onClick={() => handleViewChange('game')}
            >
              Hangman
            </button>
            <button 
              className={`game-button ${currentView === 'crossword' ? 'active' : ''}`}
              onClick={() => handleViewChange('crossword')}
            >
              Crossword
            </button>
            <button 
              className={`game-button ${currentView === 'sudoku' ? 'active' : ''}`}
              onClick={() => handleViewChange('sudoku')}
            >
              Sudoku
            </button>
            <button 
              className={`game-button ${currentView === 'wordsearch' ? 'active' : ''}`}
              onClick={() => handleViewChange('wordsearch')}
            >
              Word Search
            </button>
            <button 
              className={`game-button ${currentView === 'anagram' ? 'active' : ''}`}
              onClick={() => handleViewChange('anagram')}
            >
              Anagram
            </button>
          </div>
        </div>

        {/* Special Features Section */}
        <div className="section-group">
          <h2 className="section-header">SPECIAL FEATURES</h2>
          <div className="section-divider"></div>
          <div className="features-row">
            <button 
              className={`feature-button ${currentView === 'maker' ? 'active' : ''}`}
              onClick={() => handleViewChange('maker')}
            >
              Puzzle Maker
            </button>
            <button 
              className={`feature-button ${currentView === 'variations' ? 'active' : ''}`}
              onClick={() => handleViewChange('variations')}
            >
              Coming Soon
            </button>
          </div>
        </div>
      </nav>

      {/* Retention Features */}
      <RetentionFeatures 
        isPremium={isPremium} 
        onEmailCapture={handleEmailCapture}
      />

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
              </div>

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

        {/* Daily Crossword View */}
        {currentView === 'crossword' && (
          <DailyCrossword 
            isPremium={isPremium}
            onPremiumClick={handlePremiumClick}
          />
        )}

        {/* Daily Sudoku View */}
        {currentView === 'sudoku' && (
          <DailySudoku 
            isPremium={isPremium}
            onPremiumClick={handlePremiumClick}
          />
        )}

        {/* Daily Word Search View */}
        {currentView === 'wordsearch' && (
          <DailyWordSearch 
            isPremium={isPremium}
            onPremiumClick={handlePremiumClick}
          />
        )}

        {/* Daily Anagram View */}
        {currentView === 'anagram' && (
          <DailyAnagram 
            isPremium={isPremium}
            onPremiumClick={handlePremiumClick}
          />
        )}

        {/* Crossword Maker View */}
        {currentView === 'maker' && (
          <CrosswordMaker 
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

        {/* Privacy Policy View */}
        {currentView === 'privacy' && (
          <PrivacyPolicy 
            onBack={() => handleViewChange('game')}
          />
        )}

        {/* Terms of Service View */}
        {currentView === 'terms' && (
          <TermsOfService 
            onBack={() => handleViewChange('game')}
          />
        )}

        {/* About Us View */}
        {currentView === 'about' && (
          <AboutUs 
            onBack={() => handleViewChange('game')}
          />
        )}

        {/* Contact Us View */}
        {currentView === 'contact' && (
          <ContactUs 
            onBack={() => handleViewChange('game')}
            onFAQClick={() => handleViewChange('faq')}
          />
        )}

        {/* FAQ View */}
        {currentView === 'faq' && (
          <FAQ 
            onBack={() => handleViewChange('game')}
            onContactClick={() => handleViewChange('contact')}
          />
        )}

        {/* Social Integration - Always visible except for privacy/terms/about/contact/faq */}
        {currentView !== 'privacy' && currentView !== 'terms' && currentView !== 'about' && currentView !== 'contact' && currentView !== 'faq' && (
          <SocialIntegration 
            currentScore={score}
            currentStreak={streak}
            gamesPlayed={gamesPlayed}
            currentWord={currentWord}
            gameStatus={gameStatus}
            wordOfTheDay={wordOfTheDay}
          />
        )}
      </main>

      {/* Footer - Hidden for privacy/terms/about/contact/faq views */}
      {currentView !== 'privacy' && currentView !== 'terms' && currentView !== 'about' && currentView !== 'contact' && currentView !== 'faq' && (
        <footer className="newspaper-footer">
          <div className="footer-container">
            {/* Newspaper-style masthead */}
            <div className="footer-masthead">
              <h2 className="footer-title">Daily Puzzle Post</h2>
              <p className="footer-tagline">Your trusted source for daily brain training since 2024</p>
            </div>

            {/* Two-column newspaper layout */}
            <div className="footer-columns">
              <div className="footer-column">
                <h3 className="column-header">Games</h3>
                <div className="column-divider"></div>
                <ul className="footer-links">
                  <li>
                    <button 
                      className="newspaper-link"
                      onClick={() => handleViewChange('game')}
                    >
                      Hangman
                    </button>
                  </li>
                  <li>
                    <button 
                      className="newspaper-link"
                      onClick={() => handleViewChange('crossword')}
                    >
                      Daily Crossword
                    </button>
                  </li>
                  <li>
                    <button 
                      className="newspaper-link"
                      onClick={() => handleViewChange('sudoku')}
                    >
                      Daily Sudoku
                    </button>
                  </li>
                  <li>
                    <button 
                      className="newspaper-link"
                      onClick={() => handleViewChange('wordsearch')}
                    >
                      Daily Word Search
                    </button>
                  </li>
                  <li>
                    <button 
                      className="newspaper-link"
                      onClick={() => handleViewChange('anagram')}
                    >
                      Daily Anagram
                    </button>
                  </li>
                  <li>
                    <button 
                      className="newspaper-link"
                      onClick={() => handleViewChange('maker')}
                    >
                      Puzzle Maker
                    </button>
                  </li>
                </ul>
              </div>

              <div className="footer-column">
                <h3 className="column-header">Account</h3>
                <div className="column-divider"></div>
                <ul className="footer-links">
                  <li>
                    <span className="newspaper-link coming-soon-item">
                      Ad-Free Mode
                      <span className="newspaper-classified-badge">Coming Soon</span>
                    </span>
                  </li>
                  <li>
                    <button 
                      className="newspaper-link"
                      onClick={() => handleViewChange('about')}
                    >
                      About Us
                    </button>
                  </li>
                  <li>
                    <button 
                      className="newspaper-link"
                      onClick={() => handleViewChange('privacy')}
                    >
                      Privacy Policy
                    </button>
                  </li>
                  <li>
                    <button 
                      className="newspaper-link"
                      onClick={() => handleViewChange('terms')}
                    >
                      Terms of Service
                    </button>
                  </li>
                  <li>
                    <button 
                      className="newspaper-link"
                      onClick={() => handleViewChange('contact')}
                    >
                      Contact Us
                    </button>
                  </li>
                  <li>
                    <button 
                      className="newspaper-link"
                      onClick={() => handleViewChange('faq')}
                    >
                      FAQ
                    </button>
                  </li>
                </ul>
              </div>
            </div>

            {/* Newspaper-style bottom section */}
            <div className="footer-bottom">
              <div className="footer-divider"></div>
              <div className="copyright-section">
                <p className="copyright-main">&copy; 2024 Daily Puzzle Post. All rights reserved.</p>
                <p className="copyright-tagline">Designed for puzzle enthusiasts worldwide</p>
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* Footer Leaderboard Ad - Hidden for privacy/terms/about/contact/faq views */}
      {!isPremium && currentView !== 'privacy' && currentView !== 'terms' && currentView !== 'about' && currentView !== 'contact' && currentView !== 'faq' && (
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

/* Force Vercel sync Sat Aug 16 18:14:31 EDT 2025 */
