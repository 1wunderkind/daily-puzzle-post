import React from 'react';
import './AdPlacement.css';

// Newspaper-style ad placement component
const AdPlacement = ({ 
  type = 'banner', // 'banner', 'sidebar', 'text'
  isPremium = false,
  className = '',
  style = {}
}) => {
  // Don't show ads for premium users
  if (isPremium) {
    return null;
  }

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
      className={`ad-placement ${adConfig.className} ${className}`}
      style={{
        width: adConfig.width,
        height: adConfig.height,
        ...style
      }}
      data-ad-type={type}
    >
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
    </div>
  );
};

// Google AdSense integration component
const GoogleAdSense = ({ 
  adSlot,
  adFormat = 'auto',
  fullWidthResponsive = true,
  isPremium = false,
  className = ''
}) => {
  // Don't show ads for premium users
  if (isPremium) {
    return null;
  }

  React.useEffect(() => {
    try {
      // Load AdSense ads when component mounts
      if (window.adsbygoogle) {
        window.adsbygoogle.push({});
      }
    } catch (error) {
      console.log('AdSense not loaded yet');
    }
  }, []);

  return (
    <div className={`adsense-container ${className}`}>
      <ins 
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-XXXXXXXXXX" // Replace with actual publisher ID
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive}
      />
    </div>
  );
};

// Newspaper-style ad sections
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

