import React, { useState, useEffect } from 'react';
import './WordOfTheDay.css';
import { trackEvent } from './analytics';

const WordOfTheDay = ({ onWordSelect, currentWord, gameStatus }) => {
  const [todaysWord, setTodaysWord] = useState(null);
  const [isWordOfDayActive, setIsWordOfDayActive] = useState(false);
  const [hasPlayedToday, setHasPlayedToday] = useState(false);
  const [bonusEarned, setBonusEarned] = useState(false);

  // Curated Word of the Day database with definitions
  const wordOfDayDatabase = [
    { word: "SERENDIPITY", definition: "The occurrence of events by chance in a happy way", category: "Concepts", difficulty: "Hard", bonusPoints: 150 },
    { word: "EPHEMERAL", definition: "Lasting for a very short time", category: "Concepts", difficulty: "Hard", bonusPoints: 120 },
    { word: "WANDERLUST", definition: "A strong desire to travel", category: "Concepts", difficulty: "Medium", bonusPoints: 100 },
    { word: "NOSTALGIA", definition: "A sentimental longing for the past", category: "Concepts", difficulty: "Medium", bonusPoints: 90 },
    { word: "RESILIENCE", definition: "The ability to recover quickly from difficulties", category: "Concepts", difficulty: "Medium", bonusPoints: 100 },
    { word: "ELOQUENT", definition: "Fluent and persuasive in speaking or writing", category: "Concepts", difficulty: "Medium", bonusPoints: 80 },
    { word: "HARMONY", definition: "The combination of different elements forming a pleasing whole", category: "Concepts", difficulty: "Easy", bonusPoints: 70 },
    { word: "WISDOM", definition: "The quality of having experience and good judgment", category: "Concepts", difficulty: "Easy", bonusPoints: 60 },
    { word: "COURAGE", definition: "The ability to do something that frightens one", category: "Concepts", difficulty: "Easy", bonusPoints: 70 },
    { word: "GRATITUDE", definition: "The quality of being thankful", category: "Concepts", difficulty: "Medium", bonusPoints: 90 },
    { word: "INNOVATION", definition: "The action of making changes to something established", category: "Concepts", difficulty: "Medium", bonusPoints: 100 },
    { word: "PERSEVERANCE", definition: "Persistence in doing something despite difficulty", category: "Concepts", difficulty: "Hard", bonusPoints: 130 },
    { word: "TRANQUILITY", definition: "The quality or state of being tranquil; calm", category: "Concepts", difficulty: "Hard", bonusPoints: 120 },
    { word: "ADVENTURE", definition: "An unusual and exciting experience or activity", category: "Concepts", difficulty: "Medium", bonusPoints: 90 },
    { word: "CREATIVITY", definition: "The use of imagination to create something new", category: "Concepts", difficulty: "Medium", bonusPoints: 100 },
    { word: "FRIENDSHIP", definition: "The emotions or conduct of friends", category: "Concepts", difficulty: "Medium", bonusPoints: 100 },
    { word: "DISCOVERY", definition: "The action of finding something for the first time", category: "Concepts", difficulty: "Medium", bonusPoints: 90 },
    { word: "EXCELLENCE", definition: "The quality of being outstanding or extremely good", category: "Concepts", difficulty: "Medium", bonusPoints: 100 },
    { word: "INSPIRATION", definition: "The process of being mentally stimulated", category: "Concepts", difficulty: "Hard", bonusPoints: 110 },
    { word: "DEDICATION", definition: "The quality of being committed to a task", category: "Concepts", difficulty: "Medium", bonusPoints: 100 },
    { word: "COMPASSION", definition: "Sympathetic pity and concern for others", category: "Concepts", difficulty: "Medium", bonusPoints: 100 },
    { word: "INTEGRITY", definition: "The quality of being honest and having strong moral principles", category: "Concepts", difficulty: "Medium", bonusPoints: 90 },
    { word: "OPTIMISM", definition: "Hopefulness and confidence about the future", category: "Concepts", difficulty: "Medium", bonusPoints: 80 },
    { word: "PATIENCE", definition: "The capacity to accept delay without getting angry", category: "Concepts", difficulty: "Easy", bonusPoints: 70 },
    { word: "KINDNESS", definition: "The quality of being friendly and considerate", category: "Concepts", difficulty: "Easy", bonusPoints: 80 },
    { word: "BALANCE", definition: "An even distribution of weight enabling stability", category: "Concepts", difficulty: "Easy", bonusPoints: 70 },
    { word: "FREEDOM", definition: "The power to act, speak, or think without restraint", category: "Concepts", difficulty: "Easy", bonusPoints: 70 },
    { word: "JUSTICE", definition: "Just behavior or treatment", category: "Concepts", difficulty: "Easy", bonusPoints: 70 },
    { word: "BEAUTY", definition: "A combination of qualities that pleases the senses", category: "Concepts", difficulty: "Easy", bonusPoints: 60 },
    { word: "TRUTH", definition: "The quality or state of being true", category: "Concepts", difficulty: "Easy", bonusPoints: 50 },
    { word: "PEACE", definition: "Freedom from disturbance; tranquility", category: "Concepts", difficulty: "Easy", bonusPoints: 50 }
  ];

  // Get today's word based on date
  const getTodaysWord = () => {
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    const wordIndex = dayOfYear % wordOfDayDatabase.length;
    return wordOfDayDatabase[wordIndex];
  };

  // Check if user has played today's word
  const checkIfPlayedToday = () => {
    const today = new Date().toDateString();
    const lastPlayed = localStorage.getItem('dpp_wotd_last_played');
    return lastPlayed === today;
  };

  // Check if bonus was earned today
  const checkBonusEarned = () => {
    const today = new Date().toDateString();
    const bonusDate = localStorage.getItem('dpp_wotd_bonus_date');
    return bonusDate === today;
  };

  useEffect(() => {
    const word = getTodaysWord();
    setTodaysWord(word);
    setHasPlayedToday(checkIfPlayedToday());
    setBonusEarned(checkBonusEarned());
    
    // Check if current game is Word of the Day
    if (currentWord === word.word) {
      setIsWordOfDayActive(true);
    } else {
      setIsWordOfDayActive(false);
    }
  }, [currentWord]);

  // Handle Word of the Day selection
  const handlePlayWordOfDay = () => {
    if (todaysWord && !hasPlayedToday) {
      onWordSelect(todaysWord.word, todaysWord.definition, todaysWord.category, true);
      setIsWordOfDayActive(true);
      
      // Mark as played today
      const today = new Date().toDateString();
      localStorage.setItem('dpp_wotd_last_played', today);
      setHasPlayedToday(true);
      
      trackEvent('word_of_day_started', {
        word: todaysWord.word,
        difficulty: todaysWord.difficulty,
        bonus_points: todaysWord.bonusPoints
      });
    }
  };

  // Handle bonus points when Word of the Day is completed
  useEffect(() => {
    if (isWordOfDayActive && gameStatus === 'won' && !bonusEarned) {
      const today = new Date().toDateString();
      localStorage.setItem('dpp_wotd_bonus_date', today);
      setBonusEarned(true);
      
      // Add bonus points to score
      const currentScore = parseInt(localStorage.getItem('dpp_score') || '0');
      const newScore = currentScore + todaysWord.bonusPoints;
      localStorage.setItem('dpp_score', newScore.toString());
      
      trackEvent('word_of_day_bonus_earned', {
        word: todaysWord.word,
        bonus_points: todaysWord.bonusPoints,
        total_score: newScore
      });
    }
  }, [gameStatus, isWordOfDayActive, bonusEarned, todaysWord]);

  if (!todaysWord) return null;

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return '#1B4332';
      case 'Medium': return '#800020';
      case 'Hard': return '#0A0A0A';
      default: return '#333333';
    }
  };

  const formatDate = () => {
    const today = new Date();
    return today.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="word-of-day-section">
      <div className="wotd-header">
        <h3>WORD OF THE DAY</h3>
        <p className="wotd-date">{formatDate()}</p>
      </div>
      
      <div className="wotd-content">
        <div className="wotd-word-display">
          <div className="wotd-word">{todaysWord.word}</div>
          <div className="wotd-pronunciation">/{todaysWord.word.toLowerCase()}/</div>
        </div>
        
        <div className="wotd-definition">
          <p>"{todaysWord.definition}"</p>
        </div>
        
        <div className="wotd-details">
          <div className="wotd-category">
            <span className="label">Category:</span>
            <span className="value">{todaysWord.category}</span>
          </div>
          <div className="wotd-difficulty">
            <span className="label">Difficulty:</span>
            <span 
              className="value difficulty-badge" 
              style={{ color: getDifficultyColor(todaysWord.difficulty) }}
            >
              {todaysWord.difficulty}
            </span>
          </div>
          <div className="wotd-bonus">
            <span className="label">Bonus Points:</span>
            <span className="value bonus-points">+{todaysWord.bonusPoints}</span>
          </div>
        </div>
        
        <div className="wotd-actions">
          {!hasPlayedToday ? (
            <button 
              className="wotd-play-button"
              onClick={handlePlayWordOfDay}
              disabled={isWordOfDayActive}
            >
              {isWordOfDayActive ? 'Playing Now!' : 'Play Word of the Day'}
            </button>
          ) : (
            <div className="wotd-completed">
              <span className="completed-text">
                ✓ Completed Today
                {bonusEarned && <span className="bonus-earned"> (+{todaysWord.bonusPoints} bonus!)</span>}
              </span>
              {!isWordOfDayActive && (
                <button 
                  className="wotd-replay-button"
                  onClick={handlePlayWordOfDay}
                >
                  Play Again
                </button>
              )}
            </div>
          )}
        </div>
        
        {isWordOfDayActive && (
          <div className="wotd-active-indicator">
            <span>🌟 Currently playing Word of the Day! Complete for bonus points!</span>
          </div>
        )}
      </div>
      
      <div className="wotd-footer">
        <p>New word every day at midnight! Come back tomorrow for another challenge.</p>
      </div>
    </div>
  );
};

export default WordOfTheDay;

