import React, { useState } from 'react';
import './GameVariations.css';
import { trackEvent } from './analytics';

const GameVariations = ({ currentGame, onGameSelect }) => {
  const [hoveredGame, setHoveredGame] = useState(null);

  const gameVariations = [
    {
      id: 'hangman',
      name: 'Hangman',
      description: 'Classic word guessing game with strategic letter selection',
      status: 'active',
      difficulty: 'Medium',
      estimatedTime: '3-5 minutes',
      features: ['150+ words', '4 categories', 'Hint system', 'Score tracking'],
      icon: '🎯',
      comingSoon: false
    },
    {
      id: 'word-scramble',
      name: 'Word Scramble',
      description: 'Unscramble letters to form the correct word',
      status: 'coming-soon',
      difficulty: 'Easy',
      estimatedTime: '2-4 minutes',
      features: ['Timed challenges', 'Multiple difficulty levels', 'Daily puzzles', 'Bonus rounds'],
      icon: '🔤',
      comingSoon: true,
      launchDate: 'September 2025'
    },
    {
      id: 'word-search',
      name: 'Word Search',
      description: 'Find hidden words in a grid of letters',
      status: 'coming-soon',
      difficulty: 'Easy',
      estimatedTime: '5-10 minutes',
      features: ['Multiple grid sizes', 'Themed puzzles', 'Highlight system', 'Progress tracking'],
      icon: '🔍',
      comingSoon: true,
      launchDate: 'October 2025'
    },
    {
      id: 'daily-crossword',
      name: 'Daily Crossword',
      description: 'Traditional crossword puzzles with varying difficulty',
      status: 'coming-soon',
      difficulty: 'Hard',
      estimatedTime: '10-20 minutes',
      features: ['Daily puzzles', 'Multiple difficulty levels', 'Clue hints', 'Progress saving'],
      icon: '📝',
      comingSoon: true,
      launchDate: 'November 2025'
    },
    {
      id: 'anagram-solver',
      name: 'Anagram Challenge',
      description: 'Create new words from given letters',
      status: 'coming-soon',
      difficulty: 'Medium',
      estimatedTime: '3-7 minutes',
      features: ['Multiple solutions', 'Scoring system', 'Time challenges', 'Word definitions'],
      icon: '🔀',
      comingSoon: true,
      launchDate: 'December 2025'
    },
    {
      id: 'rhyme-time',
      name: 'Rhyme Time',
      description: 'Find words that rhyme with the given word',
      status: 'coming-soon',
      difficulty: 'Easy',
      estimatedTime: '2-5 minutes',
      features: ['Poetry mode', 'Educational content', 'Sound pronunciation', 'Creative challenges'],
      icon: '🎵',
      comingSoon: true,
      launchDate: 'January 2026'
    }
  ];

  const handleGameClick = (game) => {
    if (game.comingSoon) {
      trackEvent('coming_soon_game_clicked', {
        game_name: game.name,
        game_id: game.id,
        launch_date: game.launchDate
      });
    } else if (game.id === 'hangman') {
      onGameSelect('hangman');
      trackEvent('game_selected', {
        game_name: game.name,
        game_id: game.id
      });
    }
  };

  const handleNotifyMe = (game) => {
    // Store interest in localStorage for future email notifications
    const interestedGames = JSON.parse(localStorage.getItem('dpp_interested_games') || '[]');
    if (!interestedGames.includes(game.id)) {
      interestedGames.push(game.id);
      localStorage.setItem('dpp_interested_games', JSON.stringify(interestedGames));
    }
    
    trackEvent('notify_me_clicked', {
      game_name: game.name,
      game_id: game.id,
      launch_date: game.launchDate
    });
    
    alert(`Thanks for your interest! We'll notify you when ${game.name} launches in ${game.launchDate}.`);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return '#1B4332';
      case 'Medium': return '#800020';
      case 'Hard': return '#0A0A0A';
      default: return '#333333';
    }
  };

  return (
    <div className="game-variations-section">
      <div className="variations-header">
        <h2>WORD GAME COLLECTION</h2>
        <p className="variations-subtitle">Challenge your mind with our growing collection of word puzzles</p>
      </div>
      
      <div className="games-grid">
        {gameVariations.map((game) => (
          <div 
            key={game.id}
            className={`game-card ${game.comingSoon ? 'coming-soon' : 'available'} ${currentGame === game.id ? 'active' : ''}`}
            onMouseEnter={() => setHoveredGame(game.id)}
            onMouseLeave={() => setHoveredGame(null)}
            onClick={() => handleGameClick(game)}
          >
            <div className="game-card-header">
              <div className="game-icon">{game.icon}</div>
              <div className="game-status">
                {game.comingSoon ? (
                  <span className="status-badge coming-soon-badge">Coming Soon</span>
                ) : (
                  <span className="status-badge available-badge">Available Now</span>
                )}
              </div>
            </div>
            
            <div className="game-card-content">
              <h3 className="game-title">{game.name}</h3>
              <p className="game-description">{game.description}</p>
              
              <div className="game-details">
                <div className="detail-item">
                  <span className="detail-label">Difficulty:</span>
                  <span 
                    className="detail-value difficulty-value"
                    style={{ color: getDifficultyColor(game.difficulty) }}
                  >
                    {game.difficulty}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Time:</span>
                  <span className="detail-value">{game.estimatedTime}</span>
                </div>
                {game.launchDate && (
                  <div className="detail-item">
                    <span className="detail-label">Launch:</span>
                    <span className="detail-value launch-date">{game.launchDate}</span>
                  </div>
                )}
              </div>
              
              <div className="game-features">
                <h4>Features:</h4>
                <ul>
                  {game.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="game-card-footer">
              {game.comingSoon ? (
                <div className="coming-soon-actions">
                  <button 
                    className="notify-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNotifyMe(game);
                    }}
                  >
                    Notify Me
                  </button>
                  <span className="launch-info">Launching {game.launchDate}</span>
                </div>
              ) : (
                <div className="available-actions">
                  <button 
                    className={`play-button ${currentGame === game.id ? 'playing' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGameClick(game);
                    }}
                  >
                    {currentGame === game.id ? 'Currently Playing' : 'Play Now'}
                  </button>
                </div>
              )}
            </div>
            
            {hoveredGame === game.id && game.comingSoon && (
              <div className="hover-overlay">
                <div className="hover-content">
                  <h4>Coming Soon!</h4>
                  <p>We're working hard to bring you {game.name}. Click "Notify Me" to be the first to know when it launches!</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="variations-footer">
        <div className="development-roadmap">
          <h3>Development Roadmap</h3>
          <p>We're continuously expanding our word game collection. Each new game is carefully designed to provide unique challenges while maintaining our classic newspaper aesthetic and accessibility standards.</p>
          
          <div className="roadmap-timeline">
            <div className="timeline-item completed">
              <div className="timeline-marker"></div>
              <div className="timeline-content">
                <h4>August 2025</h4>
                <p>Hangman with 150+ words and premium features</p>
              </div>
            </div>
            <div className="timeline-item upcoming">
              <div className="timeline-marker"></div>
              <div className="timeline-content">
                <h4>September 2025</h4>
                <p>Word Scramble with timed challenges</p>
              </div>
            </div>
            <div className="timeline-item upcoming">
              <div className="timeline-marker"></div>
              <div className="timeline-content">
                <h4>October 2025</h4>
                <p>Word Search with themed puzzles</p>
              </div>
            </div>
            <div className="timeline-item upcoming">
              <div className="timeline-marker"></div>
              <div className="timeline-content">
                <h4>November 2025</h4>
                <p>Daily Crossword puzzles</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="feedback-section">
          <h3>Have a Game Suggestion?</h3>
          <p>We'd love to hear your ideas for new word games! Your feedback helps us prioritize which games to develop next.</p>
          <button className="feedback-button">
            Share Your Ideas
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameVariations;

