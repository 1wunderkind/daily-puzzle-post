import React, { useState, useEffect } from 'react';

// Utility function to track daily visits
export function trackDailyVisit() {
  const today = new Date().toDateString();
  const lastVisit = localStorage.getItem('dpp_last_visit_date');
  
  if (lastVisit !== today) {
    localStorage.setItem('dpp_last_visit_date', today);
    
    // Increment visit count
    const visitCount = parseInt(localStorage.getItem('dpp_visit_count') || '0') + 1;
    localStorage.setItem('dpp_visit_count', visitCount.toString());
    
    // Track consecutive days
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toDateString();
    
    if (lastVisit === yesterdayString) {
      // Consecutive day
      const streak = parseInt(localStorage.getItem('dpp_daily_streak') || '0') + 1;
      localStorage.setItem('dpp_daily_streak', streak.toString());
    } else if (lastVisit && lastVisit !== today) {
      // Streak broken
      localStorage.setItem('dpp_daily_streak', '1');
    } else if (!lastVisit) {
      // First visit
      localStorage.setItem('dpp_daily_streak', '1');
    }
    
    console.log('📅 Daily visit tracked:', {
      visitCount,
      streak: localStorage.getItem('dpp_daily_streak')
    });
  }
}

const RetentionFeatures = ({ isPremium, onEmailCapture }) => {
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [showPWAPrompt, setShowPWAPrompt] = useState(false);
  const [visitCount, setVisitCount] = useState(0);

  // Track visits for PWA prompt
  useEffect(() => {
    const visits = parseInt(localStorage.getItem('dpp_visit_count') || '0');
    const newVisitCount = visits + 1;
    setVisitCount(newVisitCount);
    localStorage.setItem('dpp_visit_count', newVisitCount.toString());

    // Show PWA prompt after 3 visits on mobile
    if (newVisitCount >= 3 && !localStorage.getItem('dpp_pwa_prompted')) {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile) {
        setTimeout(() => setShowPWAPrompt(true), 3000);
      }
    }

    // Check if email capture should be shown
    const emailCaptured = localStorage.getItem('dpp_email_captured');
    const emailDismissed = localStorage.getItem('dpp_email_dismissed');
    if (!emailCaptured && !emailDismissed && newVisitCount >= 2) {
      setTimeout(() => setShowEmailCapture(true), 5000);
    }
  }, []);

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (email && email.includes('@')) {
      localStorage.setItem('dpp_email_captured', email);
      localStorage.setItem('dpp_email_capture_date', new Date().toISOString());
      setEmailSubmitted(true);
      onEmailCapture && onEmailCapture(email);
      
      // Track email capture
      if (typeof gtag !== 'undefined') {
        gtag('event', 'email_capture', {
          event_category: 'retention',
          event_label: 'newsletter_signup'
        });
      }
      
      setTimeout(() => setShowEmailCapture(false), 2000);
    }
  };

  const dismissEmailCapture = () => {
    localStorage.setItem('dpp_email_dismissed', 'true');
    setShowEmailCapture(false);
  };

  const dismissPWAPrompt = () => {
    localStorage.setItem('dpp_pwa_prompted', 'true');
    setShowPWAPrompt(false);
  };

  const handleAddToHomeScreen = () => {
    // This would trigger the PWA install prompt in a real implementation
    alert('To add Daily Puzzle Post to your home screen:\n\n1. Tap the Share button\n2. Select "Add to Home Screen"\n3. Tap "Add"');
    dismissPWAPrompt();
  };

  return (
    <>
      {/* Email Capture Modal */}
      {showEmailCapture && !emailSubmitted && (
        <div className="email-capture-overlay">
          <div className="email-capture-modal">
            <div className="email-capture-header">
              <h3>📧 Get Daily Word Puzzles</h3>
              <button 
                className="email-capture-close"
                onClick={dismissEmailCapture}
              >
                ×
              </button>
            </div>
            <div className="email-capture-body">
              <p>Join thousands of word puzzle enthusiasts!</p>
              <p>Get a new challenging word delivered to your inbox every day.</p>
              
              <form onSubmit={handleEmailSubmit} className="email-form">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="email-input"
                  required
                />
                <button type="submit" className="email-submit-btn">
                  Get Daily Puzzles
                </button>
              </form>
              
              <p className="email-disclaimer">
                Optional • No spam • Unsubscribe anytime
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Email Success Message */}
      {emailSubmitted && showEmailCapture && (
        <div className="email-success-overlay">
          <div className="email-success-modal">
            <div className="success-content">
              <span className="success-icon">✅</span>
              <h3>Welcome to Daily Puzzles!</h3>
              <p>You'll receive your first puzzle tomorrow morning.</p>
            </div>
          </div>
        </div>
      )}

      {/* PWA Install Prompt */}
      {showPWAPrompt && (
        <div className="pwa-prompt">
          <div className="pwa-content">
            <span className="pwa-icon">📱</span>
            <div className="pwa-text">
              <strong>Add to Home Screen</strong>
              <p>Get quick access to Daily Puzzle Post!</p>
            </div>
            <button 
              className="pwa-install-btn"
              onClick={handleAddToHomeScreen}
            >
              Add Now
            </button>
            <button 
              className="pwa-dismiss-btn"
              onClick={dismissPWAPrompt}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default RetentionFeatures;

