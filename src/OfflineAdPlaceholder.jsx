import React, { useState, useEffect } from 'react';
import offlineContentManager from './OfflineContentManager.js';
import './OfflineAdPlaceholder.css';

const OfflineAdPlaceholder = ({ 
  size = 'medium', // 'small', 'medium', 'large', 'leaderboard'
  position = 'sidebar', // 'header', 'sidebar', 'content'
  onUpgrade 
}) => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOffline(!navigator.onLine);
    };

    const updatePremiumStatus = () => {
      setIsPremium(offlineContentManager.isPremiumUser());
    };

    // Initial check
    updatePremiumStatus();

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    window.addEventListener('storage', updatePremiumStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      window.removeEventListener('storage', updatePremiumStatus);
    };
  }, []);

  // Don't show anything if premium user
  if (isPremium) {
    return null;
  }

  // Show regular ad space if online
  if (!isOffline) {
    return (
      <div className={`ad-placeholder ad-${size} ad-${position}`}>
        <div className="ad-label">ADVERTISEMENT</div>
        <div className="ad-content">
          <p>Your ad content here</p>
          <small>Connect your AdSense account</small>
        </div>
      </div>
    );
  }

  // Show offline upgrade message
  const getOfflineMessage = () => {
    const usage = offlineContentManager.getOfflineUsage();
    const remaining = 5 - usage.puzzlesPlayed;

    switch (size) {
      case 'leaderboard':
        return {
          title: '📱 Offline Mode',
          message: remaining > 0 
            ? `${remaining} free offline puzzles remaining today`
            : 'Daily offline limit reached',
          cta: 'Upgrade for Unlimited Offline Access'
        };
      case 'large':
        return {
          title: '🔌 You\'re Offline',
          message: remaining > 0 
            ? `Enjoying offline puzzles? You have ${remaining} remaining today.`
            : 'You\'ve used all 5 daily offline puzzles.',
          cta: 'Go Premium for Unlimited'
        };
      case 'medium':
        return {
          title: '📱 Offline',
          message: remaining > 0 
            ? `${remaining} puzzles left today`
            : 'Daily limit reached',
          cta: 'Upgrade to Premium'
        };
      case 'small':
        return {
          title: '📱',
          message: remaining > 0 ? `${remaining} left` : 'Limit reached',
          cta: 'Upgrade'
        };
      default:
        return {
          title: '📱 Offline Mode',
          message: remaining > 0 
            ? `${remaining} free puzzles remaining`
            : 'Daily offline limit reached',
          cta: 'Upgrade to Premium'
        };
    }
  };

  const offlineMessage = getOfflineMessage();

  const handleUpgradeClick = () => {
    if (onUpgrade) {
      onUpgrade();
    }
  };

  return (
    <div className={`offline-ad-placeholder ad-${size} ad-${position}`}>
      <div className="offline-ad-header">
        <span className="offline-status-dot"></span>
        <span className="offline-ad-title">{offlineMessage.title}</span>
      </div>
      
      <div className="offline-ad-content">
        <p className="offline-ad-message">{offlineMessage.message}</p>
        
        {size !== 'small' && (
          <div className="offline-ad-benefits">
            <div className="benefit-item">✓ Unlimited offline puzzles</div>
            {size === 'large' && (
              <>
                <div className="benefit-item">✓ 30-day puzzle archive</div>
                <div className="benefit-item">✓ Ad-free experience</div>
              </>
            )}
          </div>
        )}
        
        <button 
          className="offline-ad-cta"
          onClick={handleUpgradeClick}
        >
          {offlineMessage.cta}
        </button>
        
        {size === 'large' && (
          <div className="offline-ad-price">
            <span className="price">$4.99/month</span>
            <span className="guarantee">30-day guarantee</span>
          </div>
        )}
      </div>
      
      <div className="offline-ad-footer">
        <small>Connect to internet for more free puzzles</small>
      </div>
    </div>
  );
};

export default OfflineAdPlaceholder;

