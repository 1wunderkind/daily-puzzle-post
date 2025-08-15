// Daily Puzzle Post - JavaScript Game Logic

// Game Data - Word Database
const WORD_DATABASE = {
  ANIMALS: [
    { word: 'LION', hint: 'King of the jungle' },
    { word: 'TIGER', hint: 'Striped big cat' },
    { word: 'ELEPHANT', hint: 'Largest land mammal' },
    { word: 'GIRAFFE', hint: 'Tallest animal' },
    { word: 'ZEBRA', hint: 'Black and white striped horse' },
    { word: 'MONKEY', hint: 'Swings from trees' },
    { word: 'RABBIT', hint: 'Hops and eats carrots' },
    { word: 'TURTLE', hint: 'Slow reptile with shell' },
    { word: 'DOLPHIN', hint: 'Intelligent marine mammal' },
    { word: 'PENGUIN', hint: 'Flightless Antarctic bird' },
    { word: 'EAGLE', hint: 'Majestic bird of prey' },
    { word: 'SHARK', hint: 'Ocean predator with fins' },
    { word: 'WHALE', hint: 'Largest ocean creature' },
    { word: 'BEAR', hint: 'Large furry forest animal' },
    { word: 'WOLF', hint: 'Pack hunting canine' }
  ],
  FOOD: [
    { word: 'PIZZA', hint: 'Italian flatbread with toppings' },
    { word: 'BURGER', hint: 'Meat patty in a bun' },
    { word: 'PASTA', hint: 'Italian noodles' },
    { word: 'SALAD', hint: 'Mixed greens and vegetables' },
    { word: 'BREAD', hint: 'Baked flour staple' },
    { word: 'CHEESE', hint: 'Dairy product from milk' },
    { word: 'APPLE', hint: 'Red or green crunchy fruit' },
    { word: 'ORANGE', hint: 'Citrus fruit' },
    { word: 'BANANA', hint: 'Yellow curved fruit' },
    { word: 'GRAPE', hint: 'Small round fruit in bunches' },
    { word: 'CHICKEN', hint: 'Popular poultry meat' },
    { word: 'FISH', hint: 'Aquatic protein source' },
    { word: 'RICE', hint: 'Asian grain staple' },
    { word: 'SOUP', hint: 'Liquid meal in a bowl' },
    { word: 'CAKE', hint: 'Sweet baked dessert' }
  ],
  PLACES: [
    { word: 'BEACH', hint: 'Sandy shore by the ocean' },
    { word: 'FOREST', hint: 'Dense area of trees' },
    { word: 'MOUNTAIN', hint: 'High rocky peak' },
    { word: 'DESERT', hint: 'Hot sandy wasteland' },
    { word: 'CITY', hint: 'Large urban area' },
    { word: 'PARK', hint: 'Green recreational area' },
    { word: 'SCHOOL', hint: 'Place of learning' },
    { word: 'HOSPITAL', hint: 'Medical care facility' },
    { word: 'LIBRARY', hint: 'Building full of books' },
    { word: 'MUSEUM', hint: 'Place displaying artifacts' },
    { word: 'THEATER', hint: 'Building for performances' },
    { word: 'MARKET', hint: 'Place to buy goods' },
    { word: 'BRIDGE', hint: 'Structure crossing water' },
    { word: 'CASTLE', hint: 'Medieval fortress' },
    { word: 'ISLAND', hint: 'Land surrounded by water' }
  ],
  OBJECTS: [
    { word: 'CHAIR', hint: 'Furniture for sitting' },
    { word: 'TABLE', hint: 'Flat surface with legs' },
    { word: 'PHONE', hint: 'Device for communication' },
    { word: 'BOOK', hint: 'Bound pages with text' },
    { word: 'CLOCK', hint: 'Device showing time' },
    { word: 'LAMP', hint: 'Source of artificial light' },
    { word: 'MIRROR', hint: 'Reflective glass surface' },
    { word: 'WINDOW', hint: 'Glass opening in wall' },
    { word: 'DOOR', hint: 'Entrance to a room' },
    { word: 'KEY', hint: 'Metal tool for locks' },
    { word: 'PENCIL', hint: 'Writing instrument with graphite' },
    { word: 'PAPER', hint: 'Thin sheets for writing' },
    { word: 'BOTTLE', hint: 'Container for liquids' },
    { word: 'CAMERA', hint: 'Device for taking photos' },
    { word: 'GUITAR', hint: 'Six-stringed musical instrument' }
  ]
};

// Hangman ASCII Art Stages
const HANGMAN_STAGES = [
  'Ready to start...', // 0 wrong guesses
  `
   +---+
   |   |
       |
       |
       |
       |
=========`, // 1 wrong guess
  `
   +---+
   |   |
   O   |
       |
       |
       |
=========`, // 2 wrong guesses
  `
   +---+
   |   |
   O   |
   |   |
       |
       |
=========`, // 3 wrong guesses
  `
   +---+
   |   |
   O   |
  /|   |
       |
       |
=========`, // 4 wrong guesses
  `
   +---+
   |   |
   O   |
  /|\\  |
       |
       |
=========`, // 5 wrong guesses
  `
   +---+
   |   |
   O   |
  /|\\  |
  /    |
       |
=========`, // 6 wrong guesses - Game Over
  `
   +---+
   |   |
   O   |
  /|\\  |
  / \\  |
       |
=========` // 7 wrong guesses (not used, but complete hangman)
];

// Game State
let gameState = {
  currentWord: null,
  currentCategory: 'ALL',
  guessedLetters: new Set(),
  wrongGuesses: 0,
  maxWrongGuesses: 6,
  gameStatus: 'playing', // 'playing', 'won', 'lost'
  score: 0,
  streak: 0,
  hintUsed: false,
  revealedHintLetter: null,
  isPremium: false
};

// Analytics Tracking
const analytics = {
  track: function(event, data = {}) {
    console.log('Analytics Event:', event, data);
    
    // Google Analytics 4 tracking (when enabled)
    if (typeof gtag !== 'undefined') {
      gtag('event', event, {
        custom_parameter_1: data.category || '',
        custom_parameter_2: data.action || '',
        custom_parameter_3: data.label || '',
        value: data.value || 0
      });
    }
    
    // Custom analytics endpoint (if needed)
    // fetch('/api/analytics', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ event, data, timestamp: Date.now() })
    // });
  },
  
  trackGameStart: function(category, word) {
    this.track('game_start', {
      category: 'game',
      action: 'start',
      label: category,
      word: word
    });
  },
  
  trackGameComplete: function(result, timeElapsed, score, streak) {
    this.track('game_complete', {
      category: 'game',
      action: 'complete',
      label: result,
      value: timeElapsed,
      score: score,
      streak: streak
    });
  },
  
  trackLetterGuess: function(letter, correct, wrongGuesses) {
    this.track('letter_guess', {
      category: 'game',
      action: correct ? 'correct_guess' : 'wrong_guess',
      label: letter,
      value: wrongGuesses
    });
  },
  
  trackHintUsage: function(revealedLetter) {
    this.track('hint_used', {
      category: 'game',
      action: 'hint',
      label: revealedLetter
    });
  },
  
  trackCategoryChange: function(newCategory, oldCategory) {
    this.track('category_change', {
      category: 'game',
      action: 'category_change',
      label: `${oldCategory}_to_${newCategory}`
    });
  },
  
  trackPremiumClick: function(location) {
    this.track('premium_button_click', {
      category: 'monetization',
      action: 'premium_click',
      label: location
    });
  },
  
  trackPremiumModalOpen: function(source) {
    this.track('premium_modal_open', {
      category: 'monetization',
      action: 'modal_open',
      label: source
    });
  },
  
  trackPremiumModalClose: function(method) {
    this.track('premium_modal_close', {
      category: 'monetization',
      action: 'modal_close',
      label: method
    });
  },
  
  trackAdImpression: function(adUnit, size) {
    this.track('ad_impression', {
      category: 'monetization',
      action: 'ad_view',
      label: adUnit,
      size: size
    });
  }
};

// Utility Functions
function getRandomWord(category = 'ALL') {
  let wordPool = [];
  
  if (category === 'ALL') {
    // Combine all categories
    Object.values(WORD_DATABASE).forEach(categoryWords => {
      wordPool = wordPool.concat(categoryWords);
    });
  } else {
    wordPool = WORD_DATABASE[category] || [];
  }
  
  if (wordPool.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * wordPool.length);
  const selectedWord = wordPool[randomIndex];
  
  return {
    ...selectedWord,
    categoryName: category === 'ALL' ? 'Mixed' : category.charAt(0) + category.slice(1).toLowerCase()
  };
}

function updateDisplay() {
  // Update date
  const dateElement = document.getElementById('current-date');
  if (dateElement) {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateElement.textContent = today.toLocaleDateString('en-US', options);
  }
  
  // Update scores
  document.getElementById('puzzles-solved').textContent = gameState.score;
  document.getElementById('win-streak').textContent = gameState.streak;
  
  // Update category display
  const categoryDisplay = document.getElementById('category-display');
  if (gameState.currentWord) {
    categoryDisplay.textContent = `Category: ${gameState.currentWord.categoryName}`;
  }
  
  // Update hangman display
  document.getElementById('hangman-display').textContent = HANGMAN_STAGES[gameState.wrongGuesses];
  
  // Update word display
  if (gameState.currentWord) {
    const wordDisplay = gameState.currentWord.word
      .split('')
      .map(letter => gameState.guessedLetters.has(letter) ? letter : '_')
      .join(' ');
    document.getElementById('word-display').textContent = wordDisplay;
  }
  
  // Update status message
  const statusElement = document.getElementById('status-message');
  if (gameState.gameStatus === 'playing') {
    statusElement.textContent = `Wrong guesses: ${gameState.wrongGuesses}/${gameState.maxWrongGuesses}`;
    statusElement.className = 'status-message';
  } else if (gameState.gameStatus === 'won') {
    statusElement.textContent = 'PUZZLE SOLVED!';
    statusElement.className = 'status-message status-win';
  } else if (gameState.gameStatus === 'lost') {
    statusElement.textContent = `PUZZLE FAILED - The word was: ${gameState.currentWord.word}`;
    statusElement.className = 'status-message status-lose';
  }
  
  // Update hint button
  const hintButton = document.getElementById('hint-btn');
  if (gameState.hintUsed) {
    hintButton.textContent = 'Hint Used';
    hintButton.disabled = true;
  } else {
    hintButton.textContent = 'Use Hint (1 per puzzle)';
    hintButton.disabled = gameState.gameStatus !== 'playing';
  }
  
  // Update hint display
  const hintDisplay = document.getElementById('hint-display');
  const revealedLetterSpan = document.getElementById('revealed-letter');
  if (gameState.revealedHintLetter && gameState.gameStatus === 'playing') {
    revealedLetterSpan.textContent = gameState.revealedHintLetter;
    hintDisplay.style.display = 'block';
  } else {
    hintDisplay.style.display = 'none';
  }
}

function createAlphabetGrid() {
  const alphabetGrid = document.getElementById('alphabet-grid');
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  
  alphabetGrid.innerHTML = '';
  
  for (let letter of alphabet) {
    const button = document.createElement('button');
    button.textContent = letter;
    button.className = 'letter-button';
    button.onclick = () => guessLetter(letter);
    alphabetGrid.appendChild(button);
  }
}

function updateAlphabetGrid() {
  const buttons = document.querySelectorAll('.letter-button');
  
  buttons.forEach(button => {
    const letter = button.textContent;
    
    if (gameState.guessedLetters.has(letter)) {
      button.disabled = true;
      
      if (gameState.currentWord && gameState.currentWord.word.includes(letter)) {
        button.classList.add('correct');
      } else {
        button.classList.add('wrong');
      }
    } else {
      button.disabled = gameState.gameStatus !== 'playing';
      button.classList.remove('correct', 'wrong');
    }
  });
}

function guessLetter(letter) {
  if (gameState.guessedLetters.has(letter) || gameState.gameStatus !== 'playing') {
    return;
  }
  
  gameState.guessedLetters.add(letter);
  
  if (gameState.currentWord.word.includes(letter)) {
    // Correct guess
    analytics.trackLetterGuess(letter, true, gameState.wrongGuesses);
    
    // Check if word is complete
    const wordLetters = new Set(gameState.currentWord.word);
    const correctGuesses = [...gameState.guessedLetters].filter(l => wordLetters.has(l));
    
    if (correctGuesses.length === wordLetters.size) {
      gameState.gameStatus = 'won';
      gameState.score++;
      gameState.streak++;
      
      // Save to localStorage
      localStorage.setItem('dpp_score', gameState.score.toString());
      localStorage.setItem('dpp_streak', gameState.streak.toString());
      
      analytics.trackGameComplete('won', Date.now(), gameState.score, gameState.streak);
    }
  } else {
    // Wrong guess
    gameState.wrongGuesses++;
    analytics.trackLetterGuess(letter, false, gameState.wrongGuesses);
    
    if (gameState.wrongGuesses >= gameState.maxWrongGuesses) {
      gameState.gameStatus = 'lost';
      gameState.streak = 0;
      
      // Save to localStorage
      localStorage.setItem('dpp_streak', '0');
      
      analytics.trackGameComplete('lost', Date.now(), gameState.score, 0);
    }
  }
  
  updateDisplay();
  updateAlphabetGrid();
}

function useHint() {
  if (gameState.hintUsed || gameState.gameStatus !== 'playing' || !gameState.currentWord) {
    return;
  }
  
  const wordLetters = gameState.currentWord.word.split('');
  const unguessedLetters = wordLetters.filter(letter => !gameState.guessedLetters.has(letter));
  
  if (unguessedLetters.length > 0) {
    const randomLetter = unguessedLetters[Math.floor(Math.random() * unguessedLetters.length)];
    gameState.revealedHintLetter = randomLetter;
    gameState.hintUsed = true;
    
    // Automatically add the hint letter to guessed letters
    gameState.guessedLetters.add(randomLetter);
    
    analytics.trackHintUsage(randomLetter);
    
    // Check if this completes the word
    const wordLetters = new Set(gameState.currentWord.word);
    const correctGuesses = [...gameState.guessedLetters].filter(l => wordLetters.has(l));
    
    if (correctGuesses.length === wordLetters.size) {
      gameState.gameStatus = 'won';
      gameState.score++;
      gameState.streak++;
      
      localStorage.setItem('dpp_score', gameState.score.toString());
      localStorage.setItem('dpp_streak', gameState.streak.toString());
      
      analytics.trackGameComplete('won', Date.now(), gameState.score, gameState.streak);
    }
    
    updateDisplay();
    updateAlphabetGrid();
  }
}

function startNewGame() {
  const newWord = getRandomWord(gameState.currentCategory);
  
  if (!newWord) {
    console.error('No words available for category:', gameState.currentCategory);
    return;
  }
  
  gameState.currentWord = newWord;
  gameState.guessedLetters = new Set();
  gameState.wrongGuesses = 0;
  gameState.gameStatus = 'playing';
  gameState.hintUsed = false;
  gameState.revealedHintLetter = null;
  
  analytics.trackGameStart(gameState.currentCategory, newWord.word);
  
  updateDisplay();
  updateAlphabetGrid();
}

function changeCateogry(newCategory) {
  const oldCategory = gameState.currentCategory;
  gameState.currentCategory = newCategory;
  
  analytics.trackCategoryChange(newCategory, oldCategory);
  
  startNewGame();
}

// Premium Modal Functions
function openPremiumModal(source = 'header') {
  analytics.trackPremiumClick(source);
  analytics.trackPremiumModalOpen(source);
  
  document.getElementById('premium-modal').style.display = 'flex';
}

function closePremiumModal(method = 'close_button') {
  analytics.trackPremiumModalClose(method);
  document.getElementById('premium-modal').style.display = 'none';
}

function upgradeToPremium(paymentMethod = 'demo') {
  // Simulate premium upgrade
  gameState.isPremium = true;
  localStorage.setItem('dpp_premium_status', 'active');
  localStorage.setItem('dpp_premium_date', new Date().toISOString());
  
  // Hide ads
  document.body.classList.add('premium-active');
  
  // Update premium button
  const premiumBtn = document.getElementById('premium-btn');
  if (premiumBtn) {
    premiumBtn.textContent = '⭐ PREMIUM';
    premiumBtn.onclick = null;
    premiumBtn.style.cursor = 'default';
  }
  
  closePremiumModal('purchase_complete');
  
  // Track successful purchase
  analytics.track('premium_purchase_success', {
    category: 'monetization',
    action: 'purchase',
    label: paymentMethod,
    value: 4.99
  });
  
  alert('Welcome to Premium! Enjoy your ad-free experience!');
}

// Initialize Game
function initializeGame() {
  // Load saved data
  const savedScore = localStorage.getItem('dpp_score');
  const savedStreak = localStorage.getItem('dpp_streak');
  const premiumStatus = localStorage.getItem('dpp_premium_status');
  
  if (savedScore) gameState.score = parseInt(savedScore);
  if (savedStreak) gameState.streak = parseInt(savedStreak);
  if (premiumStatus === 'active') {
    gameState.isPremium = true;
    document.body.classList.add('premium-active');
    
    const premiumBtn = document.getElementById('premium-btn');
    if (premiumBtn) {
      premiumBtn.textContent = '⭐ PREMIUM';
      premiumBtn.onclick = null;
      premiumBtn.style.cursor = 'default';
    }
  }
  
  // Create alphabet grid
  createAlphabetGrid();
  
  // Set up event listeners
  document.getElementById('new-game-btn').onclick = startNewGame;
  document.getElementById('hint-btn').onclick = useHint;
  document.getElementById('premium-btn').onclick = () => openPremiumModal('header');
  document.getElementById('footer-premium-btn').onclick = () => openPremiumModal('footer');
  document.getElementById('modal-close').onclick = () => closePremiumModal('close_button');
  document.getElementById('stripe-btn').onclick = () => upgradeToPremium('stripe');
  document.getElementById('paypal-btn').onclick = () => upgradeToPremium('paypal');
  
  // Category selector
  const categorySelector = document.getElementById('category-selector');
  categorySelector.onchange = (e) => changeCateogry(e.target.value);
  
  // Close modal when clicking outside
  document.getElementById('premium-modal').onclick = (e) => {
    if (e.target.id === 'premium-modal') {
      closePremiumModal('outside_click');
    }
  };
  
  // Track initial ad impressions (for non-premium users)
  if (!gameState.isPremium) {
    setTimeout(() => {
      analytics.trackAdImpression('header_banner', '728x90');
      analytics.trackAdImpression('sidebar_left', '300x250');
      analytics.trackAdImpression('sidebar_right', '300x250');
    }, 1000);
  }
  
  // Start first game
  startNewGame();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeGame);

