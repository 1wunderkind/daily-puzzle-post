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

  return (
    <div className="ab-testing-container">
      {testVariant === 'A' ? (
        <button 
          className="premium-button variant-a"
          onClick={() => handlePremiumClick('header')}
        >
          Remove Ads - $4.99
        </button>
      ) : (
        <button 
          className="premium-button variant-b"
          onClick={() => handlePremiumClick('header')}
        >
          Go Premium - $4.99
        </button>
      )}
      
      {/* Debug info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="ab-debug">
          <small>A/B Test: Variant {testVariant}</small>
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

