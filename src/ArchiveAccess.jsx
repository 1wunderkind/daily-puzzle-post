import React, { useState, useEffect } from 'react';
import { checkPremiumStatus } from './StripeIntegration';
import './ArchiveAccess.css';

const ArchiveAccess = ({ onSelectPuzzle, currentPuzzleId }) => {
  const [isPremium, setIsPremium] = useState(false);
  const [archiveData, setArchiveData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    setIsPremium(checkPremiumStatus());
    loadArchiveData();
  }, []);

  const loadArchiveData = async () => {
    try {
      setLoading(true);
      
      // Generate 30 days of archive data
      const today = new Date();
      const archiveItems = [];
      
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        const dateStr = date.toISOString().split('T')[0];
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        const puzzleId = ((Math.floor((today - date) / (1000 * 60 * 60 * 24)) % 30) + 1);
        
        // Determine difficulty based on day of week
        let difficulty = 'Medium';
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 1) difficulty = 'Easy'; // Monday
        else if (dayOfWeek === 2) difficulty = 'Easy-Medium'; // Tuesday
        else if (dayOfWeek === 3) difficulty = 'Medium'; // Wednesday
        else if (dayOfWeek === 4) difficulty = 'Medium-Hard'; // Thursday
        else if (dayOfWeek === 5) difficulty = 'Hard'; // Friday
        else if (dayOfWeek === 6) difficulty = 'Expert'; // Saturday
        else difficulty = 'Special'; // Sunday
        
        archiveItems.push({
          date: dateStr,
          dayName,
          puzzleId: `puzzle_${puzzleId.toString().padStart(2, '0')}`,
          difficulty,
          isToday: i === 0,
          completed: Math.random() > 0.7 // Simulate completion status
        });
      }
      
      setArchiveData(archiveItems);
      
    } catch (error) {
      console.error('Error loading archive data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePuzzleSelect = (puzzleItem) => {
    if (!isPremium && !puzzleItem.isToday) {
      // Show premium upgrade prompt
      const premiumEvent = new CustomEvent('showPremiumModal');
      window.dispatchEvent(premiumEvent);
      return;
    }

    onSelectPuzzle(puzzleItem);
    
    // Track archive access
    if (window.gtag) {
      window.gtag('event', 'archive_puzzle_selected', {
        event_category: 'premium',
        event_label: puzzleItem.puzzleId,
        puzzle_date: puzzleItem.date
      });
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return '#22543d';
      case 'Easy-Medium': return '#2d5a3d';
      case 'Medium': return '#3d6b4d';
      case 'Medium-Hard': return '#4d7c5d';
      case 'Hard': return '#5d8d6d';
      case 'Expert': return '#6d9e7d';
      case 'Special': return '#1B4332';
      default: return '#333333';
    }
  };

  if (loading) {
    return (
      <div className="archive-loading">
        <div className="loading-spinner"></div>
        <p>Loading puzzle archive...</p>
      </div>
    );
  }

  return (
    <div className="archive-access">
      <div className="archive-header">
        <h2>📚 Puzzle Archive</h2>
        {!isPremium && (
          <div className="premium-notice">
            <p>🔒 Premium required for archive access</p>
            <button 
              className="upgrade-btn"
              onClick={() => {
                const premiumEvent = new CustomEvent('showPremiumModal');
                window.dispatchEvent(premiumEvent);
              }}
            >
              Upgrade to Premium
            </button>
          </div>
        )}
      </div>

      <div className="archive-grid">
        {archiveData.map((item, index) => (
          <div
            key={item.date}
            className={`archive-item ${item.isToday ? 'today' : ''} ${
              !isPremium && !item.isToday ? 'locked' : ''
            } ${item.completed ? 'completed' : ''}`}
            onClick={() => handlePuzzleSelect(item)}
          >
            <div className="archive-date">
              <div className="day-name">{item.dayName}</div>
              <div className="date-number">{formatDate(item.date)}</div>
            </div>
            
            <div className="archive-info">
              <div className="puzzle-id">{item.puzzleId}</div>
              <div 
                className="difficulty-badge"
                style={{ backgroundColor: getDifficultyColor(item.difficulty) }}
              >
                {item.difficulty}
              </div>
            </div>
            
            <div className="archive-status">
              {item.isToday && <span className="today-badge">TODAY</span>}
              {item.completed && <span className="completed-badge">✓</span>}
              {!isPremium && !item.isToday && <span className="locked-badge">🔒</span>}
            </div>
          </div>
        ))}
      </div>

      {isPremium && (
        <div className="archive-stats">
          <h3>Your Archive Stats</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number">{archiveData.filter(item => item.completed).length}</span>
              <span className="stat-label">Completed</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{archiveData.length}</span>
              <span className="stat-label">Available</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">
                {Math.round((archiveData.filter(item => item.completed).length / archiveData.length) * 100)}%
              </span>
              <span className="stat-label">Completion</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Cookie-based ad control utility
export const AdController = {
  isPremiumUser: () => {
    try {
      // Check premium cookie
      const cookies = document.cookie.split(';');
      const premiumCookie = cookies.find(cookie => 
        cookie.trim().startsWith('premium_user=')
      );
      
      if (premiumCookie && premiumCookie.includes('true')) {
        return true;
      }

      // Check localStorage as backup
      const premiumData = localStorage.getItem('premium_access');
      if (premiumData) {
        const data = JSON.parse(premiumData);
        const now = Date.now();
        return data.expires && now < data.expires;
      }

      return false;
    } catch (error) {
      console.error('Error checking premium status:', error);
      return false;
    }
  },

  hideAds: () => {
    if (AdController.isPremiumUser()) {
      // Hide all ad elements
      const adElements = document.querySelectorAll(
        '.ad-placement, .adsense-container, .header-ad-section, .sidebar-ad-section, .text-ad-section'
      );
      
      adElements.forEach(element => {
        element.style.display = 'none';
      });

      // Add premium class to body
      document.body.classList.add('premium-user');
      
      return true;
    }
    return false;
  },

  showAds: () => {
    // Show all ad elements
    const adElements = document.querySelectorAll(
      '.ad-placement, .adsense-container, .header-ad-section, .sidebar-ad-section, .text-ad-section'
    );
    
    adElements.forEach(element => {
      element.style.display = '';
    });

    // Remove premium class from body
    document.body.classList.remove('premium-user');
  },

  initializeAdControl: () => {
    // Initialize ad visibility based on premium status
    if (AdController.isPremiumUser()) {
      AdController.hideAds();
    } else {
      AdController.showAds();
    }

    // Listen for premium status changes
    window.addEventListener('premiumStatusChanged', () => {
      if (AdController.isPremiumUser()) {
        AdController.hideAds();
      } else {
        AdController.showAds();
      }
    });
  }
};

export default ArchiveAccess;

