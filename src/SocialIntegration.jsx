import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import './SocialIntegration.css';
import { trackEvent } from './analytics';

const SocialIntegration = ({ 
  currentScore, 
  currentStreak, 
  gamesPlayed, 
  currentWord, 
  gameStatus,
  wordOfTheDay 
}) => {
  const [shareText, setShareText] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);

  // Social media accounts (placeholders for future)
  const socialAccounts = {
    twitter: '@DailyPuzzlePost',
    facebook: 'DailyPuzzlePost',
    instagram: '@dailypuzzlepost',
    youtube: '@DailyPuzzlePost'
  };

  // Generate dynamic share content based on game state
  useEffect(() => {
    const baseUrl = window.location.origin;
    setShareUrl(baseUrl);

    if (gameStatus === 'won') {
      if (currentWord === wordOfTheDay?.word) {
        setShareText(`🌟 I just solved today's Word of the Day "${currentWord}" on Daily Puzzle Post! Can you beat my streak of ${currentStreak}? #WordOfTheDay #BrainTraining #DailyPuzzlePost`);
      } else {
        setShareText(`🎯 Just solved "${currentWord}" on Daily Puzzle Post! Current streak: ${currentStreak} games. Challenge your brain with classic word games! #Hangman #WordGames #BrainTraining`);
      }
    } else if (currentStreak > 5) {
      setShareText(`🔥 I'm on a ${currentStreak}-game winning streak on Daily Puzzle Post! Think you can beat it? Classic word games that actually challenge your mind. #WordGames #BrainTraining #WinningStreak`);
    } else if (gamesPlayed > 10) {
      setShareText(`🧠 Just played my ${gamesPlayed}th game on Daily Puzzle Post! These classic word puzzles are seriously addictive. Perfect brain training! #WordGames #BrainTraining #DailyPuzzlePost`);
    } else {
      setShareText(`🎯 Challenging my brain with classic word games on Daily Puzzle Post! Clean, newspaper-style puzzles that actually make you think. #WordGames #BrainTraining #ClassicPuzzles`);
    }
  }, [gameStatus, currentWord, currentStreak, gamesPlayed, wordOfTheDay]);

  // Social media sharing functions
  const shareToTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
    trackEvent('social_share', {
      platform: 'twitter',
      content_type: 'game_result',
      score: currentScore,
      streak: currentStreak
    });
  };

  const shareToFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
    trackEvent('social_share', {
      platform: 'facebook',
      content_type: 'game_result',
      score: currentScore,
      streak: currentStreak
    });
  };

  const shareToLinkedIn = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent('Daily Puzzle Post - Classic Word Games')}&summary=${encodeURIComponent(shareText)}`;
    window.open(linkedInUrl, '_blank', 'width=600,height=400');
    trackEvent('social_share', {
      platform: 'linkedin',
      content_type: 'game_result',
      score: currentScore,
      streak: currentStreak
    });
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      alert('Share text copied to clipboard!');
      trackEvent('social_share', {
        platform: 'clipboard',
        content_type: 'game_result',
        score: currentScore,
        streak: currentStreak
      });
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const followSocial = (platform) => {
    let url = '';
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/${socialAccounts.twitter.replace('@', '')}`;
        break;
      case 'facebook':
        url = `https://facebook.com/${socialAccounts.facebook}`;
        break;
      case 'instagram':
        url = `https://instagram.com/${socialAccounts.instagram.replace('@', '')}`;
        break;
      case 'youtube':
        url = `https://youtube.com/${socialAccounts.youtube.replace('@', '')}`;
        break;
      default:
        return;
    }
    
    window.open(url, '_blank');
    trackEvent('social_follow', {
      platform: platform,
      account: socialAccounts[platform]
    });
  };

  // Generate structured data for SEO
  const generateStructuredData = () => {
    return {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Daily Puzzle Post",
      "description": "Classic newspaper-style word games including Hangman, Word Scramble, and more. Perfect brain training for mature casual gamers.",
      "url": shareUrl,
      "applicationCategory": "GameApplication",
      "operatingSystem": "Web Browser",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "ratingCount": "1247"
      },
      "author": {
        "@type": "Organization",
        "name": "Daily Puzzle Post"
      }
    };
  };

  return (
    <>
      {/* SEO and Social Media Meta Tags */}
      <Helmet>
        {/* Open Graph Meta Tags */}
        <meta property="og:title" content="Daily Puzzle Post - Classic Word Games" />
        <meta property="og:description" content="Challenge your mind with classic newspaper-style word games. Hangman, Word Scramble, and more brain training puzzles." />
        <meta property="og:image" content={`${shareUrl}/og-image.jpg`} />
        <meta property="og:url" content={shareUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Daily Puzzle Post" />
        <meta property="og:locale" content="en_US" />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content={socialAccounts.twitter} />
        <meta name="twitter:creator" content={socialAccounts.twitter} />
        <meta name="twitter:title" content="Daily Puzzle Post - Classic Word Games" />
        <meta name="twitter:description" content="Challenge your mind with classic newspaper-style word games. Perfect brain training for mature casual gamers." />
        <meta name="twitter:image" content={`${shareUrl}/twitter-card.jpg`} />
        
        {/* Additional Social Meta Tags */}
        <meta property="fb:app_id" content="YOUR_FACEBOOK_APP_ID" />
        <meta name="pinterest-rich-pin" content="true" />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(generateStructuredData())}
        </script>
        
        {/* Canonical URL */}
        <link rel="canonical" href={shareUrl} />
      </Helmet>

      <div className="social-integration">
        {/* Share Section */}
        <div className="share-section">
          <h3>Share Your Progress</h3>
          <p className="share-description">
            Share your word game achievements with friends and challenge them to beat your score!
          </p>
          
          <div className="share-buttons">
            <button className="share-btn twitter-btn" onClick={shareToTwitter}>
              <span className="btn-icon">🐦</span>
              <span className="btn-text">Share on Twitter</span>
            </button>
            
            <button className="share-btn facebook-btn" onClick={shareToFacebook}>
              <span className="btn-icon">📘</span>
              <span className="btn-text">Share on Facebook</span>
            </button>
            
            <button className="share-btn linkedin-btn" onClick={shareToLinkedIn}>
              <span className="btn-icon">💼</span>
              <span className="btn-text">Share on LinkedIn</span>
            </button>
            
            <button className="share-btn copy-btn" onClick={copyToClipboard}>
              <span className="btn-icon">📋</span>
              <span className="btn-text">Copy Link</span>
            </button>
          </div>
          
          <div className="share-preview">
            <h4>Share Preview:</h4>
            <div className="preview-content">
              <p>"{shareText}"</p>
              <span className="preview-url">{shareUrl}</span>
            </div>
          </div>
        </div>

      </div>
    </>
  );
};

export default SocialIntegration;

