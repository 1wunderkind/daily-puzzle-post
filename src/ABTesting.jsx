import React, { useState, useEffect } from 'react';

const ABTesting = ({ onPremiumClick, isPremium }) => {
  const [testVariant, setTestVariant] = useState('A');
  const [testingEnabled, setTestingEnabled] = useState(true);

  useEffect(() => {
    // Check if user already has a variant assigned
    let assignedVariant = localStorage.getItem('dpp_ab_variant');
    
    if (!assignedVariant) {
      // Randomly assign variant A or B (50/50 split)
      assignedVariant = Math.random() < 0.5 ? 'A' : 'B';
      localStorage.setItem('dpp_ab_variant', assignedVariant);
      localStorage.setItem('dpp_ab_assigned_date', new Date().toISOString());
    }
    
    setTestVariant(assignedVariant);

    // Track variant assignment
    if (typeof gtag !== 'undefined') {
      gtag('event', 'ab_test_assignment', {
        event_category: 'ab_testing',
        event_label: `variant_${assignedVariant}`,
        custom_parameter_1: assignedVariant
      });
    }
  }, []);

  const handlePremiumClick = (source = 'header') => {
    // Track A/B test click
    if (typeof gtag !== 'undefined') {
      gtag('event', 'ab_test_click', {
        event_category: 'ab_testing',
        event_label: `variant_${testVariant}_click`,
        custom_parameter_1: testVariant,
        custom_parameter_2: source
      });
    }

    // Store conversion data
    const conversionData = {
      variant: testVariant,
      timestamp: new Date().toISOString(),
      source: source,
      converted: false // Will be updated if purchase completes
    };
    
    localStorage.setItem('dpp_ab_conversion_attempt', JSON.stringify(conversionData));
    
    onPremiumClick(source);
  };

  // Track successful conversion (called when premium upgrade completes)
  const trackConversion = () => {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'ab_test_conversion', {
        event_category: 'ab_testing',
        event_label: `variant_${testVariant}_conversion`,
        custom_parameter_1: testVariant,
        value: 4.99
      });
    }

    const conversionData = {
      variant: testVariant,
      timestamp: new Date().toISOString(),
      converted: true,
      value: 4.99
    };
    
    localStorage.setItem('dpp_ab_conversion_success', JSON.stringify(conversionData));
  };

  if (isPremium) return null;

  // Coming Soon modal handler
  const handleComingSoonClick = () => {
    // Show coming soon modal
    const modal = document.createElement('div');
    modal.className = 'coming-soon-modal-overlay';
    modal.innerHTML = `
      <div class="coming-soon-modal">
        <div class="coming-soon-content">
          <h3>Ad-Free Mode</h3>
          <p>Ad-Free Mode launches soon! We're finalizing the details for this premium experience. Check back in a few days.</p>
          <button class="coming-soon-close" onclick="this.closest('.coming-soon-modal-overlay').remove()">
            Got it!
          </button>
        </div>
      </div>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .coming-soon-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      .coming-soon-modal {
        background: #FDFBF7;
        border: 2px solid #0A0A0A;
        border-radius: 4px;
        padding: 30px;
        max-width: 400px;
        margin: 20px;
        font-family: Georgia, 'Times New Roman', serif;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      }
      .coming-soon-content h3 {
        margin: 0 0 15px 0;
        font-size: 24px;
        color: #0A0A0A;
        text-align: center;
        border-bottom: 1px solid #5A5A5A;
        padding-bottom: 10px;
      }
      .coming-soon-content p {
        margin: 0 0 20px 0;
        font-size: 16px;
        line-height: 1.5;
        color: #333333;
        text-align: center;
      }
      .coming-soon-close {
        background: #0A0A0A;
        color: #FDFBF7;
        border: none;
        padding: 10px 20px;
        font-size: 16px;
        font-family: Georgia, 'Times New Roman', serif;
        border-radius: 3px;
        cursor: pointer;
        display: block;
        margin: 0 auto;
        transition: background-color 0.2s;
      }
      .coming-soon-close:hover {
        background: #333333;
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(modal);
    
    // Track coming soon click
    if (typeof gtag !== 'undefined') {
      gtag('event', 'coming_soon_click', {
        event_category: 'premium',
        event_label: 'ad_free_mode_interest'
      });
    }
  };

  return (
    <div className="ab-testing-container">
      <button 
        className="premium-button coming-soon-button"
        onClick={handleComingSoonClick}
      >
        <span className="premium-button-text">Ad-Free Mode</span>
        <span className="coming-soon-badge">Coming Soon</span>
      </button>
      
      {/* Debug info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="ab-debug">
          <small>Coming Soon Mode Active</small>
        </div>
      )}
    </div>
  );
};

// Hook to track conversions from other components
export const useABTestingConversion = () => {
  const trackConversion = () => {
    const variant = localStorage.getItem('dpp_ab_variant');
    
    if (variant && typeof gtag !== 'undefined') {
      gtag('event', 'ab_test_conversion', {
        event_category: 'ab_testing',
        event_label: `variant_${variant}_conversion`,
        custom_parameter_1: variant,
        value: 4.99
      });
    }

    const conversionData = {
      variant: variant,
      timestamp: new Date().toISOString(),
      converted: true,
      value: 4.99
    };
    
    localStorage.setItem('dpp_ab_conversion_success', JSON.stringify(conversionData));
  };

  return { trackConversion };
};

export default ABTesting;

