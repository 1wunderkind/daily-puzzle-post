import React, { useState, useEffect } from 'react';

const ProgressBadges = ({ score, streak, gamesPlayed, onBadgeEarned }) => {
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [newBadge, setNewBadge] = useState(null);

  // Define all available badges
  const badges = [
    {
      id: 'first_win',
      name: 'First Victory',
      description: 'Solve your first puzzle',
      icon: '🎯',
      requirement: 'score >= 1',
      category: 'milestone'
    },
    {
      id: 'puzzle_solver_10',
      name: 'Puzzle Solver',
      description: 'Solve 10 puzzles',
      icon: '🧩',
      requirement: 'score >= 10',
      category: 'milestone'
    },
    {
      id: 'word_master_25',
      name: 'Word Master',
      description: 'Solve 25 puzzles',
      icon: '📚',
      requirement: 'score >= 25',
      category: 'milestone'
    },
    {
      id: 'puzzle_champion_50',
      name: 'Puzzle Champion',
      description: 'Solve 50 puzzles',
      icon: '🏆',
      requirement: 'score >= 50',
      category: 'milestone'
    },
    {
      id: 'word_genius_100',
      name: 'Word Genius',
      description: 'Solve 100 puzzles',
      icon: '🧠',
      requirement: 'score >= 100',
      category: 'milestone'
    },
    {
      id: 'streak_starter_3',
      name: 'Streak Starter',
      description: 'Win 3 games in a row',
      icon: '🔥',
      requirement: 'streak >= 3',
      category: 'streak'
    },
    {
      id: 'hot_streak_5',
      name: 'Hot Streak',
      description: 'Win 5 games in a row',
      icon: '⚡',
      requirement: 'streak >= 5',
      category: 'streak'
    },
    {
      id: 'unstoppable_10',
      name: 'Unstoppable',
      description: 'Win 10 games in a row',
      icon: '🚀',
      requirement: 'streak >= 10',
      category: 'streak'
    },
    {
      id: 'dedicated_player',
      name: 'Dedicated Player',
      description: 'Play 20 games total',
      icon: '⭐',
      requirement: 'gamesPlayed >= 20',
      category: 'engagement'
    },
    {
      id: 'daily_visitor',
      name: 'Daily Visitor',
      description: 'Visit 5 days in a row',
      icon: '📅',
      requirement: 'dailyVisits >= 5',
      category: 'engagement'
    },
    {
      id: 'perfectionist',
      name: 'Perfectionist',
      description: 'Solve a puzzle without wrong guesses',
      icon: '💎',
      requirement: 'perfectGame',
      category: 'skill'
    },
    {
      id: 'speed_demon',
      name: 'Speed Demon',
      description: 'Solve a puzzle in under 30 seconds',
      icon: '💨',
      requirement: 'fastGame',
      category: 'skill'
    }
  ];

  // Load earned badges from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dpp_earned_badges');
    if (saved) {
      setEarnedBadges(JSON.parse(saved));
    }
  }, []);

  // Check for new badges when stats change
  useEffect(() => {
    checkForNewBadges();
  }, [score, streak, gamesPlayed]);

  const checkForNewBadges = () => {
    const newlyEarned = [];
    
    badges.forEach(badge => {
      if (!earnedBadges.find(earned => earned.id === badge.id)) {
        let earned = false;
        
        switch (badge.requirement) {
          case 'score >= 1':
            earned = score >= 1;
            break;
          case 'score >= 10':
            earned = score >= 10;
            break;
          case 'score >= 25':
            earned = score >= 25;
            break;
          case 'score >= 50':
            earned = score >= 50;
            break;
          case 'score >= 100':
            earned = score >= 100;
            break;
          case 'streak >= 3':
            earned = streak >= 3;
            break;
          case 'streak >= 5':
            earned = streak >= 5;
            break;
          case 'streak >= 10':
            earned = streak >= 10;
            break;
          case 'gamesPlayed >= 20':
            earned = gamesPlayed >= 20;
            break;
          case 'dailyVisits >= 5':
            // Check daily visits from localStorage
            const visits = JSON.parse(localStorage.getItem('dpp_daily_visits') || '[]');
            earned = visits.length >= 5;
            break;
          case 'perfectGame':
            // This would be triggered from the game component
            earned = localStorage.getItem('dpp_perfect_game') === 'true';
            break;
          case 'fastGame':
            // This would be triggered from the game component
            earned = localStorage.getItem('dpp_fast_game') === 'true';
            break;
        }
        
        if (earned) {
          const earnedBadge = {
            ...badge,
            earnedAt: new Date().toISOString()
          };
          newlyEarned.push(earnedBadge);
        }
      }
    });

    if (newlyEarned.length > 0) {
      const updatedBadges = [...earnedBadges, ...newlyEarned];
      setEarnedBadges(updatedBadges);
      localStorage.setItem('dpp_earned_badges', JSON.stringify(updatedBadges));
      
      // Show modal for the first new badge
      setNewBadge(newlyEarned[0]);
      setShowBadgeModal(true);
      
      // Track badge earning
      if (typeof gtag !== 'undefined') {
        gtag('event', 'badge_earned', {
          event_category: 'engagement',
          event_label: newlyEarned[0].id,
          custom_parameter_1: newlyEarned[0].category
        });
      }
      
      onBadgeEarned && onBadgeEarned(newlyEarned[0]);
    }
  };

  const getProgressToNextBadge = () => {
    const nextMilestoneBadges = badges.filter(badge => 
      badge.category === 'milestone' && 
      !earnedBadges.find(earned => earned.id === badge.id)
    );
    
    if (nextMilestoneBadges.length === 0) return null;
    
    const nextBadge = nextMilestoneBadges[0];
    let progress = 0;
    let target = 0;
    
    if (nextBadge.requirement.includes('score')) {
      target = parseInt(nextBadge.requirement.match(/\d+/)[0]);
      progress = score;
    }
    
    return { badge: nextBadge, progress, target };
  };

  const nextBadgeProgress = getProgressToNextBadge();

  return (
    <div className="progress-badges-container">
      {/* Badge Display */}
      <div className="badges-section">
        <h4 className="badges-title">🏅 Achievements</h4>
        <div className="badges-grid">
          {badges.slice(0, 6).map(badge => {
            const earned = earnedBadges.find(e => e.id === badge.id);
            return (
              <div 
                key={badge.id} 
                className={`badge-item ${earned ? 'earned' : 'locked'}`}
                title={badge.description}
              >
                <span className="badge-icon">{badge.icon}</span>
                <span className="badge-name">{badge.name}</span>
                {earned && <span className="badge-checkmark">✓</span>}
              </div>
            );
          })}
        </div>
        
        {earnedBadges.length > 0 && (
          <div className="badges-summary">
            <span>{earnedBadges.length} of {badges.length} badges earned</span>
          </div>
        )}
      </div>

      {/* Progress to Next Badge */}
      {nextBadgeProgress && (
        <div className="next-badge-progress">
          <div className="progress-header">
            <span className="progress-icon">{nextBadgeProgress.badge.icon}</span>
            <div className="progress-text">
              <strong>Next: {nextBadgeProgress.badge.name}</strong>
              <p>{nextBadgeProgress.progress} / {nextBadgeProgress.target} puzzles</p>
            </div>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ 
                width: `${Math.min((nextBadgeProgress.progress / nextBadgeProgress.target) * 100, 100)}%` 
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Badge Earned Modal */}
      {showBadgeModal && newBadge && (
        <div className="badge-modal-overlay">
          <div className="badge-modal">
            <div className="badge-modal-content">
              <div className="badge-celebration">
                <span className="celebration-icon">🎉</span>
                <h3>Badge Earned!</h3>
              </div>
              
              <div className="earned-badge-display">
                <span className="earned-badge-icon">{newBadge.icon}</span>
                <h4>{newBadge.name}</h4>
                <p>{newBadge.description}</p>
              </div>
              
              <div className="badge-modal-actions">
                <button 
                  className="continue-btn"
                  onClick={() => setShowBadgeModal(false)}
                >
                  Continue Playing
                </button>
                <button 
                  className="share-badge-btn"
                  onClick={() => {
                    // Share badge achievement
                    const shareText = `I just earned the "${newBadge.name}" badge in Daily Puzzle Post! 🏅`;
                    if (navigator.share) {
                      navigator.share({ text: shareText, url: window.location.href });
                    } else {
                      navigator.clipboard.writeText(`${shareText} ${window.location.href}`);
                      alert('Achievement copied to clipboard!');
                    }
                    setShowBadgeModal(false);
                  }}
                >
                  Share Achievement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions to trigger special badges
export const triggerPerfectGame = () => {
  localStorage.setItem('dpp_perfect_game', 'true');
};

export const triggerFastGame = () => {
  localStorage.setItem('dpp_fast_game', 'true');
};

export const trackDailyVisit = () => {
  const today = new Date().toDateString();
  const visits = JSON.parse(localStorage.getItem('dpp_daily_visits') || '[]');
  
  if (!visits.includes(today)) {
    visits.push(today);
    // Keep only last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentVisits = visits.filter(visit => new Date(visit) > thirtyDaysAgo);
    localStorage.setItem('dpp_daily_visits', JSON.stringify(recentVisits));
  }
};

export default ProgressBadges;

