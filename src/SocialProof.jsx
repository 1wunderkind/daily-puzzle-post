import React, { useState, useEffect } from 'react';

const SocialProof = ({ currentWord, gameStatus, onShare }) => {
  const [todayGamesCount, setTodayGamesCount] = useState(2847);
  const [recentActivity, setRecentActivity] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);

  // Simulate real-time activity updates
  useEffect(() => {
    const updateActivity = () => {
      const locations = [
        'California', 'New York', 'Texas', 'Florida', 'Illinois', 'Pennsylvania',
        'Ohio', 'Georgia', 'North Carolina', 'Michigan', 'New Jersey', 'Virginia',
        'Washington', 'Arizona', 'Massachusetts', 'Tennessee', 'Indiana', 'Missouri',
        'Maryland', 'Wisconsin', 'Colorado', 'Minnesota', 'South Carolina', 'Alabama'
      ];
      
      const words = [
        'ELEPHANT', 'GIRAFFE', 'BUTTERFLY', 'MOUNTAIN', 'OCEAN', 'RAINBOW',
        'THUNDER', 'CRYSTAL', 'GARDEN', 'CASTLE', 'BRIDGE', 'FOREST',
        'SUNSET', 'DIAMOND', 'RIVER', 'EAGLE', 'TIGER', 'DOLPHIN'
      ];

      const randomLocation = locations[Math.floor(Math.random() * locations.length)];
      const randomWord = words[Math.floor(Math.random() * words.length)];
      
      const newActivity = {
        id: Date.now(),
        location: randomLocation,
        word: randomWord,
        timestamp: new Date()
      };

      setRecentActivity(prev => [newActivity, ...prev.slice(0, 4)]); // Keep last 5 activities
    };

    // Initial activities
    updateActivity();
    updateActivity();
    updateActivity();

    // Update every 15-30 seconds
    const interval = setInterval(() => {
      updateActivity();
    }, Math.random() * 15000 + 15000);

    return () => clearInterval(interval);
  }, []);

  // Update games count periodically
  useEffect(() => {
    const updateGamesCount = () => {
      setTodayGamesCount(prev => prev + Math.floor(Math.random() * 3) + 1);
    };

    const interval = setInterval(updateGamesCount, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleShare = (platform) => {
    const shareText = currentWord 
      ? `I just solved "${currentWord}" in Daily Puzzle Post! Can you beat my time? 🧩`
      : `I'm playing Daily Puzzle Post - the best word puzzle game! 🧩`;
    
    const shareUrl = window.location.origin;
    
    let url = '';
    
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        alert('Link copied to clipboard!');
        setShowShareModal(false);
        return;
    }
    
    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
    
    // Track sharing
    if (typeof gtag !== 'undefined') {
      gtag('event', 'share', {
        event_category: 'social_proof',
        event_label: platform,
        custom_parameter_1: platform
      });
    }
    
    setShowShareModal(false);
    onShare && onShare(platform);
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return 'yesterday';
  };

  return (
    <div className="social-proof-container">
      {/* Games Counter */}
      <div className="games-counter">
        <div className="counter-content">
          <span className="counter-icon">🎯</span>
          <div className="counter-text">
            <strong>{todayGamesCount.toLocaleString()}</strong>
            <span>games played today</span>
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="activity-feed">
        <h4 className="activity-title">🔥 Recent Activity</h4>
        <div className="activity-list">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="activity-item">
              <span className="activity-text">
                Player from <strong>{activity.location}</strong> just solved <strong>{activity.word}</strong>
              </span>
              <span className="activity-time">{formatTimeAgo(activity.timestamp)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Share Button */}
      {gameStatus === 'won' && currentWord && (
        <div className="share-success">
          <button 
            className="share-btn"
            onClick={() => setShowShareModal(true)}
          >
            📢 Share Your Success!
          </button>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="share-modal-overlay">
          <div className="share-modal">
            <div className="share-modal-header">
              <h3>🎉 Share Your Success!</h3>
              <button 
                className="share-modal-close"
                onClick={() => setShowShareModal(false)}
              >
                ×
              </button>
            </div>
            <div className="share-modal-body">
              <p>Tell your friends about solving <strong>{currentWord}</strong>!</p>
              
              <div className="share-buttons">
                <button 
                  className="share-button twitter"
                  onClick={() => handleShare('twitter')}
                >
                  🐦 Twitter
                </button>
                <button 
                  className="share-button facebook"
                  onClick={() => handleShare('facebook')}
                >
                  📘 Facebook
                </button>
                <button 
                  className="share-button linkedin"
                  onClick={() => handleShare('linkedin')}
                >
                  💼 LinkedIn
                </button>
                <button 
                  className="share-button copy"
                  onClick={() => handleShare('copy')}
                >
                  📋 Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Testimonial Rotation */}
      <div className="testimonial-ticker">
        <div className="testimonial-content">
          <span className="testimonial-quote">
            "Best word game I've ever played!" - Jennifer K.
          </span>
        </div>
      </div>
    </div>
  );
};

export default SocialProof;

