import React, { useState, useEffect } from 'react';
import offlineContentManager from './OfflineContentManager.js';
import './OfflineUpgradePrompt.css';

const OfflineUpgradePrompt = ({ onUpgrade, onDismiss }) => {
  const [upgradeMessage, setUpgradeMessage] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOffline(!navigator.onLine);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  useEffect(() => {
    if (isOffline && !offlineContentManager.isPremiumUser()) {
      const message = offlineContentManager.getUpgradeMessage();
      setUpgradeMessage(message);
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isOffline]);

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    }
    setIsVisible(false);
  };

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    }
    setIsVisible(false);
  };

  if (!isVisible || !upgradeMessage || !isOffline) {
    return null;
  }

  return (
    <div className="offline-upgrade-overlay">
      <div className="offline-upgrade-modal">
        <div className="offline-upgrade-header">
          <h3 className="offline-upgrade-title">
            📱 {upgradeMessage.title}
          </h3>
          <button 
            className="offline-upgrade-close"
            onClick={handleDismiss}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        
        <div className="offline-upgrade-content">
          <div className="offline-status-indicator">
            <span className="offline-dot"></span>
            <span>You're currently offline</span>
          </div>
          
          <p className="offline-upgrade-message">
            {upgradeMessage.message}
          </p>
          
          <div className="offline-upgrade-benefits">
            <h4>Premium Offline Benefits:</h4>
            <ul>
              <li>✓ Unlimited offline puzzles</li>
              <li>✓ 30-day puzzle archive</li>
              <li>✓ Ad-free experience</li>
              <li>✓ Priority customer support</li>
            </ul>
          </div>
          
          <div className="offline-upgrade-pricing">
            <div className="price-display">
              <span className="price-amount">$4.99</span>
              <span className="price-period">/month</span>
            </div>
            <p className="price-note">Cancel anytime • 30-day money-back guarantee</p>
          </div>
        </div>
        
        <div className="offline-upgrade-actions">
          <button 
            className="btn-upgrade-premium"
            onClick={handleUpgrade}
          >
            🚀 Upgrade to Premium
          </button>
          <button 
            className="btn-upgrade-later"
            onClick={handleDismiss}
          >
            Maybe Later
          </button>
        </div>
        
        <div className="offline-upgrade-footer">
          <p>Connect to internet for more free puzzles</p>
        </div>
      </div>
    </div>
  );
};

export default OfflineUpgradePrompt;

