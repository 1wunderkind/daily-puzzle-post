import React, { useState, useEffect } from 'react';

const SmartPrompts = ({ 
  gamesPlayed, 
  onPremiumClick, 
  isPremium, 
  gameStatus,
  showBetweenGames = false 
}) => {
  const [showGameCountPrompt, setShowGameCountPrompt] = useState(false);
  const [showBetweenGamePrompt, setShowBetweenGamePrompt] = useState(false);
  const [promptDismissed, setPromptDismissed] = useState(false);

  // Check if user has dismissed prompts recently
  useEffect(() => {
    const dismissed = localStorage.getItem('dpp_prompt_dismissed');
    const dismissTime = localStorage.getItem('dpp_prompt_dismiss_time');
    
    if (dismissed && dismissTime) {
      const timeSinceDismiss = Date.now() - parseInt(dismissTime);
      // Show prompts again after 24 hours
      if (timeSinceDismiss < 24 * 60 * 60 * 1000) {
        setPromptDismissed(true);
      }
    }
  }, []);

  // Show prompt after 5 games
  useEffect(() => {
    if (!isPremium && !promptDismissed && gamesPlayed >= 5 && gamesPlayed % 5 === 0) {
      setShowGameCountPrompt(true);
    }
  }, [gamesPlayed, isPremium, promptDismissed]);

  // Show between games prompt
  useEffect(() => {
    if (!isPremium && !promptDismissed && showBetweenGames && gameStatus !== 'playing') {
      const timer = setTimeout(() => {
        setShowBetweenGamePrompt(true);
      }, 2000); // Show 2 seconds after game ends

      return () => clearTimeout(timer);
    }
  }, [showBetweenGames, gameStatus, isPremium, promptDismissed]);

  const handleDismiss = (promptType) => {
    localStorage.setItem('dpp_prompt_dismissed', 'true');
    localStorage.setItem('dpp_prompt_dismiss_time', Date.now().toString());
    setPromptDismissed(true);
    setShowGameCountPrompt(false);
    setShowBetweenGamePrompt(false);
  };

  const handlePremiumClick = (source) => {
    onPremiumClick(source);
    setShowGameCountPrompt(false);
    setShowBetweenGamePrompt(false);
  };

  if (isPremium || promptDismissed) return null;

  return (
    <>
      {/* Game Count Prompt */}
      {showGameCountPrompt && (
        <div className="smart-prompt-overlay">
          <div className="smart-prompt-modal">
            <div className="smart-prompt-header">
              <h3>🎉 Enjoying Daily Puzzle Post?</h3>
              <button 
                className="smart-prompt-close"
                onClick={() => handleDismiss('game-count')}
              >
                ×
              </button>
            </div>
            <div className="smart-prompt-body">
              <p>You've solved <strong>{gamesPlayed} puzzles</strong> - that's fantastic!</p>
              <p>Go ad-free and unlock bonus features for just <strong>$4.99</strong></p>
              
              <div className="testimonial-mini">
                <p>"Best word game experience I've had!" - Sarah M.</p>
              </div>
              
              <div className="smart-prompt-actions">
                <button 
                  className="premium-upgrade-btn"
                  onClick={() => handlePremiumClick('smart-prompt-games')}
                >
                  Go Premium - $4.99
                </button>
                <button 
                  className="maybe-later-btn"
                  onClick={() => handleDismiss('game-count')}
                >
                  Maybe Later
                </button>
              </div>
              
              <div className="social-proof-mini">
                <span>⭐ Join 1,000+ premium players</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Between Games Prompt */}
      {showBetweenGamePrompt && (
        <div className="between-games-prompt">
          <div className="between-games-content">
            <span className="prompt-icon">🚀</span>
            <div className="prompt-text">
              <strong>Remove ads and get bonus features</strong>
              <p>Unlimited hints, daily challenges, and more!</p>
            </div>
            <button 
              className="quick-premium-btn"
              onClick={() => handlePremiumClick('between-games')}
            >
              Go Premium
            </button>
            <button 
              className="dismiss-btn"
              onClick={() => handleDismiss('between-games')}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SmartPrompts;

