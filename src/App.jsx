import { useState, useEffect } from 'react'
import PremiumModal from './PremiumModal.jsx'
import analytics from './analytics.js'
import { 
  getRandomWord, 
  getRandomWordFromCategory, 
  getAllCategories, 
  getCategoryInfo,
  HANGMAN_STAGES 
} from './gameData.js'
import './App.css'

function HangmanGame({ isPremium, onPremiumClick }) {
  // Game state
  const [currentWord, setCurrentWord] = useState(null)
  const [guessedLetters, setGuessedLetters] = useState(new Set())
  const [wrongGuesses, setWrongGuesses] = useState(0)
  const [gameStatus, setGameStatus] = useState('playing') // 'playing', 'won', 'lost'
  
  // Enhanced features
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [previousCategory, setPreviousCategory] = useState('ALL')
  const [score, setScore] = useState(() => {
    const saved = localStorage.getItem('dpp_score')
    return saved ? parseInt(saved) : 0
  })
  const [streak, setStreak] = useState(() => {
    const saved = localStorage.getItem('dpp_streak')
    return saved ? parseInt(saved) : 0
  })
  const [hintUsed, setHintUsed] = useState(false)
  const [revealedHintLetter, setRevealedHintLetter] = useState(null)
  const [letterStates, setLetterStates] = useState({}) // 'correct', 'wrong', 'unused'
  const [gameStartTime, setGameStartTime] = useState(null)
  const [showBetweenGamesAd, setShowBetweenGamesAd] = useState(false)

  // Initialize new game
  const startNewGame = () => {
    let newWord;
    if (selectedCategory === 'ALL') {
      newWord = getRandomWord()
    } else {
      newWord = getRandomWordFromCategory(selectedCategory)
    }
    
    if (newWord) {
      setCurrentWord(newWord)
      setGuessedLetters(new Set())
      setWrongGuesses(0)
      setGameStatus('playing')
      setHintUsed(false)
      setRevealedHintLetter(null)
      setLetterStates({})
      setGameStartTime(Date.now())
      setShowBetweenGamesAd(false)
      
      // Analytics: Track game start
      analytics.trackGameStart(selectedCategory, newWord.word)
    }
  }

  // Start game on component mount and category change
  useEffect(() => {
    startNewGame()
  }, [selectedCategory])

  // Save score and streak to localStorage
  useEffect(() => {
    localStorage.setItem('dpp_score', score.toString())
    localStorage.setItem('dpp_streak', streak.toString())
  }, [score, streak])

  // Check game status when guesses change
  useEffect(() => {
    if (currentWord && gameStatus === 'playing') {
      const wordLetters = new Set(currentWord.word)
      const correctGuesses = [...guessedLetters].filter(letter => wordLetters.has(letter))
      
      if (correctGuesses.length === wordLetters.size) {
        setGameStatus('won')
        setScore(prev => prev + 1)
        setStreak(prev => prev + 1)
        
        // Analytics: Track game completion
        const timeElapsed = Date.now() - gameStartTime
        analytics.trackGameComplete('won', timeElapsed, score + 1, streak + 1)
        
        // Show between-games ad for non-premium users
        if (!isPremium) {
          setTimeout(() => setShowBetweenGamesAd(true), 2000)
        }
      } else if (wrongGuesses >= 6) {
        setGameStatus('lost')
        setStreak(0)
        
        // Analytics: Track game completion
        const timeElapsed = Date.now() - gameStartTime
        analytics.trackGameComplete('lost', timeElapsed, score, 0)
        
        // Show between-games ad for non-premium users
        if (!isPremium) {
          setTimeout(() => setShowBetweenGamesAd(true), 2000)
        }
      }
    }
  }, [currentWord, guessedLetters, wrongGuesses, gameStatus, gameStartTime, score, streak, isPremium])

  // Handle letter guess
  const guessLetter = (letter) => {
    if (guessedLetters.has(letter) || gameStatus !== 'playing') return

    const newGuessedLetters = new Set([...guessedLetters, letter])
    setGuessedLetters(newGuessedLetters)

    if (currentWord.word.includes(letter)) {
      setLetterStates(prev => ({ ...prev, [letter]: 'correct' }))
      analytics.trackLetterGuess(letter, true, wrongGuesses)
    } else {
      setLetterStates(prev => ({ ...prev, [letter]: 'wrong' }))
      const newWrongGuesses = wrongGuesses + 1
      setWrongGuesses(newWrongGuesses)
      analytics.trackLetterGuess(letter, false, newWrongGuesses)
    }
  }

  // Use hint - reveals one random unguessed letter
  const useHint = () => {
    if (hintUsed || gameStatus !== 'playing' || !currentWord) return

    const wordLetters = currentWord.word.split('')
    const unguessedLetters = wordLetters.filter(letter => !guessedLetters.has(letter))
    
    if (unguessedLetters.length > 0) {
      const randomLetter = unguessedLetters[Math.floor(Math.random() * unguessedLetters.length)]
      setRevealedHintLetter(randomLetter)
      setHintUsed(true)
      
      // Automatically add the hint letter to guessed letters
      const newGuessedLetters = new Set([...guessedLetters, randomLetter])
      setGuessedLetters(newGuessedLetters)
      setLetterStates(prev => ({ ...prev, [randomLetter]: 'correct' }))
      
      // Analytics: Track hint usage
      analytics.trackHintUsage(randomLetter)
    }
  }

  // Handle category change
  const handleCategoryChange = (newCategory) => {
    setPreviousCategory(selectedCategory)
    setSelectedCategory(newCategory)
    
    // Analytics: Track category change
    analytics.trackCategoryChange(newCategory, selectedCategory)
  }

  // Display word with guessed letters
  const displayWord = () => {
    if (!currentWord) return ''
    
    return currentWord.word
      .split('')
      .map(letter => guessedLetters.has(letter) ? letter : '_')
      .join(' ')
  }

  // Get button class based on letter state
  const getLetterButtonClass = (letter) => {
    const baseClass = 'letter-button'
    const state = letterStates[letter]
    
    if (state === 'correct') return `${baseClass} correct used`
    if (state === 'wrong') return `${baseClass} wrong used`
    if (guessedLetters.has(letter)) return `${baseClass} used`
    return `${baseClass} unused`
  }

  // Generate alphabet buttons
  const renderAlphabet = () => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
    return (
      <div className="alphabet-grid">
        {alphabet.map(letter => (
          <button
            key={letter}
            onClick={() => guessLetter(letter)}
            disabled={guessedLetters.has(letter) || gameStatus !== 'playing'}
            className={getLetterButtonClass(letter)}
          >
            {letter}
          </button>
        ))}
      </div>
    )
  }

  // Get encouraging message
  const getStatusMessage = () => {
    if (gameStatus === 'won') {
      return "PUZZLE SOLVED!"
    }
    
    if (gameStatus === 'lost') {
      return `PUZZLE FAILED - The word was: ${currentWord?.word}`
    }
    
    return `Wrong guesses: ${wrongGuesses}/6`
  }

  // Get current date for newspaper header
  const getCurrentDate = () => {
    const today = new Date()
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }
    return today.toLocaleDateString('en-US', options)
  }

  if (!currentWord) {
    return <div className="game-container">Loading puzzle...</div>
  }

  return (
    <div className="game-container">
      <div className="corner-decoration top-left">╔</div>
      <div className="corner-decoration top-right">╗</div>
      <div className="corner-decoration bottom-left">╚</div>
      <div className="corner-decoration bottom-right">╝</div>

      {/* Date Header - Enhanced Newspaper Style */}
      <div className="date-header">
        {getCurrentDate()}
      </div>

      {/* Game Header with Enhanced Typography */}
      <div style={{ textAlign: 'center', marginBottom: '35px' }}>
        <h2>Hangman Puzzle</h2>
        <p>
          Guess the word by selecting letters. You have 6 wrong guesses before the puzzle is failed.
        </p>
      </div>

      {/* Enhanced Score and Streak Display */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '30px', maxWidth: '450px', margin: '0 auto 30px auto' }}>
        <div className="score-display">
          <span className="score-number">{score}</span>
          <span className="score-label">Puzzles Solved</span>
        </div>
        <div className="streak-display">
          <span className="streak-number">{streak}</span>
          <span className="streak-label">Win Streak</span>
        </div>
      </div>

      {/* Enhanced Category Display */}
      <div className="category-display">
        Category: {currentWord.categoryName}
      </div>

      {/* Enhanced Category Selector */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <select
          value={selectedCategory}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="category-selector"
          disabled={gameStatus === 'playing'}
        >
          <option value="ALL">All Categories</option>
          {getAllCategories().map(category => {
            const categoryInfo = getCategoryInfo(category)
            return (
              <option key={category} value={category}>
                {categoryInfo.name}
              </option>
            )
          })}
        </select>
        {gameStatus === 'playing' && (
          <p style={{ fontSize: '12px', color: 'var(--secondary-text)', marginTop: '10px', fontFamily: 'Arial, sans-serif', letterSpacing: '1px' }}>
            Finish current puzzle to change category
          </p>
        )}
      </div>

      {/* Enhanced Hangman Display */}
      <div className="hangman-display">
        {HANGMAN_STAGES[wrongGuesses] || 'Ready to start...'}
      </div>

      {/* Enhanced Word Display */}
      <div className="word-display">
        {displayWord()}
      </div>

      {/* Enhanced Game Status */}
      <div style={{ marginBottom: '30px' }}>
        {gameStatus === 'playing' && (
          <div className="status-message status-playing">
            {getStatusMessage()}
          </div>
        )}
        {gameStatus === 'won' && (
          <div className="status-message status-win">
            {getStatusMessage()}
          </div>
        )}
        {gameStatus === 'lost' && (
          <div className="status-message status-lose">
            {getStatusMessage()}
          </div>
        )}
      </div>

      {/* Between Games Ad (Non-Premium Only) */}
      {showBetweenGamesAd && !isPremium && gameStatus !== 'playing' && (
        <div className={`adsense-container adsense-between-games ${isPremium ? 'hidden' : ''}`}>
          <div className="ad-label-container">
            <span className="ad-label">Advertisement</span>
          </div>
          <div className="adsense-placeholder">
            <div>GOOGLE ADSENSE</div>
            <div>336x280 Rectangle</div>
            <div style={{ fontSize: '10px', marginTop: '5px' }}>
              Between Games Ad
            </div>
          </div>
          {/* 
            ADSENSE INTEGRATION: Replace above placeholder with:
            <ins class="adsbygoogle"
                 style="display:block"
                 data-ad-client="ca-pub-XXXXXXXXXX"
                 data-ad-slot="XXXXXXXXXX"
                 data-ad-format="rectangle"></ins>
            <script>
                 (adsbygoogle = window.adsbygoogle || []).push({});
            </script>
          */}
        </div>
      )}

      {/* Enhanced Alphabet */}
      {gameStatus === 'playing' && (
        <div style={{ marginBottom: '30px' }}>
          {renderAlphabet()}
        </div>
      )}

      {/* Enhanced Game Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', justifyContent: 'center', alignItems: 'center' }}>
        <button 
          onClick={startNewGame}
          className="game-button"
        >
          New Puzzle
        </button>
        
        {gameStatus === 'playing' && (
          <button 
            onClick={useHint}
            disabled={hintUsed}
            className="hint-button"
          >
            {hintUsed ? 'Hint Used' : 'Use Hint (1 per puzzle)'}
          </button>
        )}

        {/* Premium Upgrade Prompt (Non-Premium Only) */}
        {!isPremium && gameStatus !== 'playing' && score > 0 && score % 5 === 0 && (
          <div className="premium-prompt">
            <p>🎉 Enjoying Daily Puzzle Post?</p>
            <button 
              onClick={() => onPremiumClick('between_games')}
              className="premium-button"
            >
              Go Ad-Free for $4.99!
            </button>
          </div>
        )}
      </div>

      {/* Enhanced Hint Display */}
      {revealedHintLetter && gameStatus === 'playing' && (
        <div className="hint-display">
          <strong>Hint revealed letter:</strong> {revealedHintLetter}
        </div>
      )}

      {/* Enhanced Word Hint */}
      {currentWord.hint && gameStatus !== 'playing' && (
        <div style={{ 
          marginTop: '25px', 
          padding: '20px', 
          backgroundColor: 'var(--pure-white)', 
          border: '2px solid var(--accent-lines)', 
          textAlign: 'center',
          position: 'relative'
        }}>
          <div style={{ 
            position: 'absolute',
            top: '-10px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--pure-white)',
            padding: '0 12px',
            fontSize: '10px',
            fontFamily: 'Arial, sans-serif',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            color: 'var(--secondary-text)',
            fontWeight: 'bold'
          }}>
            Definition
          </div>
          <p style={{ 
            fontFamily: 'Georgia, "Times New Roman", serif', 
            fontSize: '16px', 
            color: 'var(--secondary-text)', 
            margin: '0',
            lineHeight: '1.5'
          }}>
            {currentWord.hint}
          </p>
        </div>
      )}
    </div>
  )
}

function App() {
  const [activeTab, setActiveTab] = useState('hangman')
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false)
  const [isPremium, setIsPremium] = useState(() => {
    return localStorage.getItem('dpp_premium_status') === 'active'
  })

  // Handle premium upgrade
  const handlePremiumUpgrade = () => {
    setIsPremium(true)
    localStorage.setItem('dpp_premium_status', 'active')
    localStorage.setItem('dpp_premium_date', new Date().toISOString())
    
    // Analytics: Track successful premium upgrade
    analytics.trackPremiumPurchaseSuccess('demo', 'demo_' + Date.now())
  }

  // Handle premium button click
  const handlePremiumClick = (location = 'header') => {
    analytics.trackPremiumButtonClick(location)
    analytics.trackPremiumModalOpen(location)
    setIsPremiumModalOpen(true)
  }

  // Handle modal close
  const handleModalClose = () => {
    analytics.trackPremiumModalClose('close_button')
    setIsPremiumModalOpen(false)
  }

  // Track ad impressions when components mount
  useEffect(() => {
    if (!isPremium) {
      // Track header ad impression
      analytics.trackAdImpression('header_banner', '728x90')
      
      // Track sidebar ad impressions
      analytics.trackAdImpression('sidebar_left', '300x250')
      analytics.trackAdImpression('sidebar_right', '300x250')
    }
  }, [isPremium])

  return (
    <div className={`min-h-screen ${isPremium ? 'premium-active' : ''}`}>
      {/* Enhanced Header with Premium Button */}
      <header className="site-header">
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 25px' }}>
          <h1 className="site-logo">Daily Puzzle Post</h1>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {isPremium ? (
              <div className="premium-badge">Premium</div>
            ) : (
              <button
                onClick={() => handlePremiumClick('header')}
                className="premium-button"
              >
                Remove Ads - $4.99
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Enhanced Game Tabs */}
      <div className="game-tabs">
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 25px' }}>
          <div style={{ display: 'flex' }}>
            <button
              onClick={() => setActiveTab('hangman')}
              className={`tab-button ${activeTab === 'hangman' ? 'active' : ''}`}
            >
              Hangman
            </button>
            <button className="tab-button coming-soon">
              Word Search
              <span style={{ marginLeft: '10px', fontSize: '9px', backgroundColor: 'var(--disabled-state)', color: 'white', padding: '2px 8px', borderRadius: '2px', letterSpacing: '1px' }}>
                Coming Soon
              </span>
            </button>
            <button className="tab-button coming-soon">
              Crossword
              <span style={{ marginLeft: '10px', fontSize: '9px', backgroundColor: 'var(--disabled-state)', color: 'white', padding: '2px 8px', borderRadius: '2px', letterSpacing: '1px' }}>
                Coming Soon
              </span>
            </button>
            <button className="tab-button coming-soon">
              Anagram
              <span style={{ marginLeft: '10px', fontSize: '9px', backgroundColor: 'var(--disabled-state)', color: 'white', padding: '2px 8px', borderRadius: '2px', letterSpacing: '1px' }}>
                Coming Soon
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Header Ad Zone (Non-Premium Only) */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 25px' }}>
        <div className={`adsense-container adsense-header-banner ${isPremium ? 'hidden' : ''}`}>
          <div className="ad-label-container">
            <span className="ad-label">Advertisement</span>
          </div>
          <div className="adsense-placeholder">
            <div>GOOGLE ADSENSE</div>
            <div>728x90 Desktop / 320x50 Mobile</div>
            <div style={{ fontSize: '10px', marginTop: '5px' }}>
              Header Leaderboard
            </div>
          </div>
          {/* 
            ADSENSE INTEGRATION: Replace above placeholder with:
            <ins class="adsbygoogle"
                 style="display:block"
                 data-ad-client="ca-pub-XXXXXXXXXX"
                 data-ad-slot="XXXXXXXXXX"
                 data-ad-format="auto"
                 data-full-width-responsive="true"></ins>
            <script>
                 (adsbygoogle = window.adsbygoogle || []).push({});
            </script>
          */}
        </div>
      </div>

      {/* Enhanced Main Content */}
      <main style={{ flex: '1', padding: '25px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 25px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '35px' }}>
            {/* Enhanced Left Sidebar with Ad */}
            <div className="sidebar-ad-wrapper">
              <div className={`adsense-container adsense-sidebar-rectangle ${isPremium ? 'hidden' : ''}`}>
                <div className="ad-label-container">
                  <span className="ad-label">Advertisement</span>
                </div>
                <div className="adsense-placeholder">
                  <div>GOOGLE ADSENSE</div>
                  <div>300x250 Rectangle</div>
                  <div style={{ fontSize: '10px', marginTop: '5px' }}>
                    Sidebar Left
                  </div>
                </div>
                {/* 
                  ADSENSE INTEGRATION: Replace above placeholder with:
                  <ins class="adsbygoogle"
                       style="display:block"
                       data-ad-client="ca-pub-XXXXXXXXXX"
                       data-ad-slot="XXXXXXXXXX"
                       data-ad-format="rectangle"></ins>
                  <script>
                       (adsbygoogle = window.adsbygoogle || []).push({});
                  </script>
                */}
              </div>
            </div>

            {/* Game Content */}
            <div>
              {activeTab === 'hangman' && (
                <HangmanGame 
                  isPremium={isPremium} 
                  onPremiumClick={handlePremiumClick}
                />
              )}
            </div>

            {/* Enhanced Right Sidebar with Ads */}
            <div className="sidebar-ad-wrapper">
              <div className={`adsense-container adsense-sidebar-rectangle ${isPremium ? 'hidden' : ''}`}>
                <div className="ad-label-container">
                  <span className="ad-label">Advertisement</span>
                </div>
                <div className="adsense-placeholder">
                  <div>GOOGLE ADSENSE</div>
                  <div>300x250 Rectangle</div>
                  <div style={{ fontSize: '10px', marginTop: '5px' }}>
                    Sidebar Right
                  </div>
                </div>
                {/* 
                  ADSENSE INTEGRATION: Replace above placeholder with:
                  <ins class="adsbygoogle"
                       style="display:block"
                       data-ad-client="ca-pub-XXXXXXXXXX"
                       data-ad-slot="XXXXXXXXXX"
                       data-ad-format="rectangle"></ins>
                  <script>
                       (adsbygoogle = window.adsbygoogle || []).push({});
                  </script>
                */}
              </div>
              
              {/* Additional Mobile Banner Ad */}
              <div className={`adsense-container adsense-mobile-banner ${isPremium ? 'hidden' : ''}`}>
                <div className="ad-label-container">
                  <span className="ad-label">Advertisement</span>
                </div>
                <div className="adsense-placeholder">
                  <div>MOBILE BANNER</div>
                  <div>320x50</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Enhanced Footer */}
      <footer className="site-footer">
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 25px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '35px', marginBottom: '35px' }}>
            <div>
              <h3 style={{ marginBottom: '18px' }}>Daily Puzzle Post</h3>
              <p style={{ fontSize: '14px', lineHeight: '1.6', letterSpacing: '0.3px' }}>
                Classic word puzzles for discerning solvers. Challenge your mind with our collection of traditional newspaper-style games.
              </p>
              {isPremium && (
                <div className="premium-badge" style={{ marginTop: '15px' }}>
                  Premium Member
                </div>
              )}
            </div>
            <div>
              <h4 style={{ marginBottom: '18px' }}>Puzzles</h4>
              <ul style={{ listStyle: 'none', padding: '0' }}>
                <li style={{ marginBottom: '10px' }}><a href="#">Hangman</a></li>
                <li style={{ marginBottom: '10px', color: 'var(--disabled-state)' }}>Word Search (Coming Soon)</li>
                <li style={{ marginBottom: '10px', color: 'var(--disabled-state)' }}>Crossword (Coming Soon)</li>
                <li style={{ marginBottom: '10px', color: 'var(--disabled-state)' }}>Anagram (Coming Soon)</li>
              </ul>
            </div>
            <div>
              <h4 style={{ marginBottom: '18px' }}>Information</h4>
              <ul style={{ listStyle: 'none', padding: '0' }}>
                <li style={{ marginBottom: '10px' }}><a href="#">Privacy Policy</a></li>
                <li style={{ marginBottom: '10px' }}><a href="#">Terms of Service</a></li>
                <li style={{ marginBottom: '10px' }}><a href="#">Contact Us</a></li>
                {!isPremium && (
                  <li style={{ marginBottom: '10px' }}>
                    <button 
                      onClick={() => handlePremiumClick('footer')}
                      style={{ background: 'none', border: 'none', color: 'var(--pure-white)', textDecoration: 'underline', cursor: 'pointer', padding: '0', fontSize: '14px' }}
                    >
                      Remove Ads
                    </button>
                  </li>
                )}
              </ul>
            </div>
          </div>
          <div style={{ borderTop: '2px solid var(--accent-lines)', paddingTop: '25px', textAlign: 'center' }}>
            <p style={{ fontSize: '12px', letterSpacing: '1px' }}>
              &copy; 2024 Daily Puzzle Post. All rights reserved.
              {isPremium && <span style={{ marginLeft: '15px', color: 'var(--correct-answer)' }}>✓ Premium Member</span>}
            </p>
          </div>
        </div>
      </footer>

      {/* Premium Modal */}
      <PremiumModal
        isOpen={isPremiumModalOpen}
        onClose={handleModalClose}
        onUpgrade={handlePremiumUpgrade}
      />
    </div>
  )
}

export default App

