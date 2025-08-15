import React, { useState, useEffect, useRef } from 'react';
import OfflineAdPlaceholder from './OfflineAdPlaceholder.jsx';
import './AdPlacement.css';

// Performance-optimized ad placement component
const AdPlacement = ({ 
  type = 'banner', // 'banner', 'sidebar', 'text'
  isPremium = false,
  className = '',
  style = {},
  onUpgrade
}) => {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const adRef = useRef(null);

  // Don't show ads for premium users
  if (isPremium) {
    return null;
  }

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

  // Show offline ad placeholder when offline
  if (isOffline) {
    const sizeMap = {
      'banner': 'leaderboard',
      'sidebar': 'medium',
      'text': 'small'
    };
    
    const positionMap = {
      'banner': 'header',
      'sidebar': 'sidebar',
      'text': 'content'
    };

    return (
      <OfflineAdPlaceholder 
        size={sizeMap[type] || 'medium'}
        position={positionMap[type] || 'sidebar'}
        onUpgrade={onUpgrade}
      />
    );
  }

  useEffect(() => {
    // Intersection Observer for lazy loading
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Delay ad loading to improve Core Web Vitals
          setTimeout(() => setShouldLoad(true), 500);
          observer.disconnect();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '50px' // Start loading 50px before visible
      }
    );

    if (adRef.current) {
      observer.observe(adRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const getAdContent = () => {
    switch (type) {
      case 'banner':
        return {
          width: '728px',
          height: '90px',
          content: 'ADVERTISEMENT',
          subtitle: 'Support Daily Puzzle Post',
          className: 'ad-banner'
        };
      case 'sidebar':
        return {
          width: '300px',
          height: '250px',
          content: 'CLASSIFIED',
          subtitle: 'Premium Word Games',
          className: 'ad-sidebar'
        };
      case 'text':
        return {
          width: '100%',
          height: '60px',
          content: 'SPONSORED',
          subtitle: 'Brain Training Games',
          className: 'ad-text'
        };
      default:
        return {
          width: '300px',
          height: '250px',
          content: 'ADVERTISEMENT',
          subtitle: 'Support Our Site',
          className: 'ad-default'
        };
    }
  };

  const adConfig = getAdContent();

  return (
    <div 
      ref={adRef}
      className={`ad-placement ${adConfig.className} ${className}`}
      style={{
        width: adConfig.width,
        height: adConfig.height,
        ...style
      }}
      data-ad-type={type}
      loading="lazy"
    >
      {shouldLoad ? (
        <div className="ad-content">
          <div className="ad-header">
            <span className="ad-label">{adConfig.content}</span>
          </div>
          <div className="ad-body">
            <div className="ad-placeholder">
              <div className="ad-title">{adConfig.subtitle}</div>
              <div className="ad-description">
                {type === 'banner' && 'Premium ad space available'}
                {type === 'sidebar' && 'Upgrade to Premium\nRemove all ads'}
                {type === 'text' && 'Ad-free experience with Premium'}
              </div>
              <div className="ad-cta">
                <button 
                  className="ad-upgrade-btn"
                  onClick={() => {
                    // Track ad click for analytics
                    if (window.gtag) {
                      window.gtag('event', 'ad_upgrade_click', {
                        event_category: 'monetization',
                        event_label: type,
                        ad_position: type
                      });
                    }
                    
                    // Trigger premium modal
                    const premiumEvent = new CustomEvent('showPremiumModal');
                    window.dispatchEvent(premiumEvent);
                  }}
                >
                  Go Premium - $4.99
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="ad-loading-placeholder">
          {isVisible && (
            <div className="ad-loading-spinner">
              <div className="spinner"></div>
              <span>Loading advertisement...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Optimized Google AdSense integration component
const GoogleAdSense = ({ 
  adSlot,
  adFormat = 'auto',
  fullWidthResponsive = true,
  isPremium = false,
  className = ''
}) => {
  const [shouldLoad, setShouldLoad] = useState(false);
  const adRef = useRef(null);

  // Don't show ads for premium users
  if (isPremium) {
    return null;
  }

  useEffect(() => {
    // Intersection Observer for lazy loading
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (adRef.current) {
      observer.observe(adRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (shouldLoad) {
      try {
        // Load AdSense ads when component mounts and is visible
        if (window.adsbygoogle) {
          window.adsbygoogle.push({});
        }
      } catch (error) {
        console.log('AdSense not loaded yet');
      }
    }
  }, [shouldLoad]);

  return (
    <div ref={adRef} className={`adsense-container ${className}`}>
      {shouldLoad && (
        <ins 
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-XXXXXXXXXX" // Replace with actual publisher ID
          data-ad-slot={adSlot}
          data-ad-format={adFormat}
          data-full-width-responsive={fullWidthResponsive}
          loading="lazy"
        />
      )}
    </div>
  );
};

// Performance-optimized newspaper-style ad sections
export const HeaderAd = ({ isPremium }) => (
  <div className="header-ad-section">
    <AdPlacement type="banner" isPremium={isPremium} />
  </div>
);

export const SidebarAd = ({ isPremium }) => (
  <div className="sidebar-ad-section">
    <AdPlacement type="sidebar" isPremium={isPremium} />
  </div>
);

export const TextAd = ({ isPremium }) => (
  <div className="text-ad-section">
    <AdPlacement type="text" isPremium={isPremium} />
  </div>
);

// Main export
export default AdPlacement;
export { GoogleAdSense };

