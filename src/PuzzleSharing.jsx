import React, { useState, useEffect } from 'react';
import './PuzzleSharing.css';
import { trackEvent } from './analytics';

const PuzzleSharing = ({ puzzle, isPremium, onPremiumClick }) => {
  const [shareUrl, setShareUrl] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [submissionFee, setSubmissionFee] = useState(1.00);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shareStats, setShareStats] = useState({
    views: 0,
    solves: 0,
    shares: 0
  });

  useEffect(() => {
    if (puzzle) {
      generateShareUrl();
      loadShareStats();
    }
  }, [puzzle]);

  // Generate shareable URL for puzzle
  const generateShareUrl = () => {
    const puzzleId = puzzle.id || `temp_${Date.now()}`;
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/puzzle/${puzzleId}`;
    setShareUrl(url);
  };

  // Load sharing statistics
  const loadShareStats = () => {
    const stats = JSON.parse(localStorage.getItem(`dpp_share_stats_${puzzle.id}`) || '{}');
    setShareStats({
      views: stats.views || 0,
      solves: stats.solves || 0,
      shares: stats.shares || 0
    });
  };

  // Share puzzle via different methods
  const sharePuzzle = async (method) => {
    const shareData = {
      title: `${puzzle.title} - Daily Puzzle Post`,
      text: `Check out this crossword puzzle: "${puzzle.title}" by ${puzzle.author}`,
      url: shareUrl
    };

    try {
      switch (method) {
        case 'native':
          if (navigator.share) {
            await navigator.share(shareData);
          } else {
            copyToClipboard(shareUrl);
          }
          break;
        
        case 'copy':
          copyToClipboard(shareUrl);
          break;
        
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
          break;
        
        case 'twitter':
          const twitterText = `Check out this crossword puzzle: "${puzzle.title}" by ${puzzle.author} ${shareUrl}`;
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}`, '_blank');
          break;
        
        case 'email':
          const emailSubject = `Crossword Puzzle: ${puzzle.title}`;
          const emailBody = `Hi!\n\nI thought you might enjoy this crossword puzzle:\n\n"${puzzle.title}" by ${puzzle.author}\n\n${shareUrl}\n\nHappy solving!`;
          window.open(`mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`);
          break;
        
        case 'print':
          printPuzzle();
          break;
      }

      // Update share stats
      updateShareStats('shares');
      
      trackEvent('puzzle_shared', {
        method: method,
        puzzle_id: puzzle.id,
        puzzle_title: puzzle.title,
        has_author: !!puzzle.author
      });

    } catch (error) {
      console.error('Error sharing puzzle:', error);
    }
  };

  // Copy URL to clipboard
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showNotification('Link copied to clipboard!');
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showNotification('Link copied to clipboard!');
    }
  };

  // Print puzzle
  const printPuzzle = () => {
    const printWindow = window.open('', '_blank');
    const printContent = generatePrintHTML();
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();

    updateShareStats('prints');
    
    trackEvent('puzzle_printed', {
      puzzle_id: puzzle.id,
      puzzle_title: puzzle.title
    });
  };

  // Generate print-friendly HTML
  const generatePrintHTML = () => {
    const grid = puzzle.grid || [];
    const clues = puzzle.clues || { across: {}, down: {} };
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${puzzle.title} - Daily Puzzle Post</title>
        <style>
          body {
            font-family: 'Times New Roman', serif;
            margin: 20px;
            background: white;
            color: black;
          }
          .puzzle-header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid black;
            padding-bottom: 15px;
          }
          .puzzle-title {
            font-size: 24px;
            font-weight: bold;
            margin: 0 0 5px 0;
          }
          .puzzle-author {
            font-size: 14px;
            font-style: italic;
          }
          .puzzle-content {
            display: flex;
            gap: 30px;
          }
          .grid-section {
            flex: 1;
          }
          .crossword-grid {
            border: 2px solid black;
            display: inline-block;
          }
          .grid-row {
            display: flex;
          }
          .grid-cell {
            width: 25px;
            height: 25px;
            border: 1px solid black;
            position: relative;
            background: white;
          }
          .grid-cell.black {
            background: black;
          }
          .cell-number {
            position: absolute;
            top: 1px;
            left: 2px;
            font-size: 8px;
            font-weight: bold;
          }
          .clues-section {
            flex: 1;
          }
          .clues-column {
            margin-bottom: 20px;
          }
          .clues-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
            border-bottom: 1px solid black;
            padding-bottom: 3px;
          }
          .clue-item {
            margin-bottom: 5px;
            font-size: 12px;
          }
          .clue-number {
            font-weight: bold;
            margin-right: 5px;
          }
          .puzzle-footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            border-top: 1px solid black;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="puzzle-header">
          <div class="puzzle-title">${puzzle.title}</div>
          <div class="puzzle-author">by ${puzzle.author}</div>
        </div>
        
        <div class="puzzle-content">
          <div class="grid-section">
            <div class="crossword-grid">
              ${grid.map((row, rowIndex) => `
                <div class="grid-row">
                  ${row.map((cell, colIndex) => `
                    <div class="grid-cell ${cell.isBlack ? 'black' : ''}">
                      ${cell.number ? `<span class="cell-number">${cell.number}</span>` : ''}
                    </div>
                  `).join('')}
                </div>
              `).join('')}
            </div>
          </div>
          
          <div class="clues-section">
            <div class="clues-column">
              <div class="clues-title">ACROSS</div>
              ${Object.entries(clues.across || {}).map(([number, clueData]) => `
                <div class="clue-item">
                  <span class="clue-number">${number}.</span>
                  ${clueData.clue}
                </div>
              `).join('')}
            </div>
            
            <div class="clues-column">
              <div class="clues-title">DOWN</div>
              ${Object.entries(clues.down || {}).map(([number, clueData]) => `
                <div class="clue-item">
                  <span class="clue-number">${number}.</span>
                  ${clueData.clue}
                </div>
              `).join('')}
            </div>
          </div>
        </div>
        
        <div class="puzzle-footer">
          Created with Daily Puzzle Post - ${window.location.origin}
        </div>
      </body>
      </html>
    `;
  };

  // Submit puzzle to community section
  const submitToNewspaper = async () => {
    if (!isPremium && !window.confirm(`Submit "${puzzle.title}" to the newspaper section for $${submissionFee}?`)) {
      return;
    }

    setIsSubmitting(true);

    try {
      // In production, this would process payment and submit to moderation
      const submissionData = {
        puzzle: puzzle,
        submission_fee: isPremium ? 0 : submissionFee,
        submission_type: 'newspaper_section',
        submitted_at: new Date().toISOString()
      };

      // Simulate submission process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Show success message
      showNotification(
        isPremium 
          ? 'Puzzle submitted for editorial review!' 
          : 'Payment processed! Puzzle submitted for editorial review!'
      );

      setShowSubmissionModal(false);

      trackEvent('puzzle_submitted_newspaper', {
        puzzle_id: puzzle.id,
        puzzle_title: puzzle.title,
        submission_fee: isPremium ? 0 : submissionFee,
        is_premium: isPremium
      });

    } catch (error) {
      console.error('Error submitting puzzle:', error);
      showNotification('Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update sharing statistics
  const updateShareStats = (type) => {
    const currentStats = { ...shareStats };
    currentStats[type] = (currentStats[type] || 0) + 1;
    
    setShareStats(currentStats);
    localStorage.setItem(`dpp_share_stats_${puzzle.id}`, JSON.stringify(currentStats));
  };

  // Show notification
  const showNotification = (message) => {
    // Simple notification - in production, use a proper notification system
    alert(message);
  };

  // Generate puzzle link for sharing
  const generatePuzzleLink = () => {
    const puzzleData = {
      title: puzzle.title,
      author: puzzle.author,
      grid: puzzle.grid,
      clues: puzzle.clues,
      difficulty: puzzle.difficulty,
      created_at: new Date().toISOString()
    };

    // Encode puzzle data for URL (simplified)
    const encodedData = btoa(JSON.stringify(puzzleData));
    return `${window.location.origin}/shared/${encodedData}`;
  };

  if (!puzzle) {
    return null;
  }

  return (
    <div className="puzzle-sharing-container">
      {/* Sharing Options */}
      <div className="sharing-section">
        <h3>Share Your Puzzle</h3>
        
        <div className="share-buttons">
          <button 
            onClick={() => sharePuzzle('copy')}
            className="share-btn copy-btn"
            title="Copy link to clipboard"
          >
            📋 Copy Link
          </button>
          
          <button 
            onClick={() => sharePuzzle('print')}
            className="share-btn print-btn"
            title="Print puzzle"
          >
            🖨️ Print
          </button>
          
          <button 
            onClick={() => sharePuzzle('email')}
            className="share-btn email-btn"
            title="Share via email"
          >
            📧 Email
          </button>
          
          <button 
            onClick={() => sharePuzzle('facebook')}
            className="share-btn facebook-btn"
            title="Share on Facebook"
          >
            📘 Facebook
          </button>
          
          <button 
            onClick={() => sharePuzzle('twitter')}
            className="share-btn twitter-btn"
            title="Share on Twitter"
          >
            🐦 Twitter
          </button>
          
          {navigator.share && (
            <button 
              onClick={() => sharePuzzle('native')}
              className="share-btn native-btn"
              title="Share using device options"
            >
              📤 Share
            </button>
          )}
        </div>

        {/* Share URL Display */}
        <div className="share-url-section">
          <label>Shareable Link:</label>
          <div className="url-input-group">
            <input 
              type="text" 
              value={shareUrl} 
              readOnly 
              className="share-url-input"
            />
            <button 
              onClick={() => copyToClipboard(shareUrl)}
              className="copy-url-btn"
            >
              Copy
            </button>
          </div>
        </div>
      </div>

      {/* Submission to Newspaper */}
      <div className="submission-section">
        <h3>Submit to Newspaper Section</h3>
        <p>Share your puzzle with the Daily Puzzle Post community!</p>
        
        <div className="submission-info">
          <div className="submission-benefits">
            <h4>Benefits:</h4>
            <ul>
              <li>Featured in "Reader's Puzzles" section</li>
              <li>Author credit and recognition</li>
              <li>Potential for "Puzzle of the Week"</li>
              <li>Community feedback and ratings</li>
            </ul>
          </div>
          
          <div className="submission-pricing">
            {isPremium ? (
              <div className="premium-submission">
                <span className="premium-badge">⭐ PREMIUM</span>
                <p>Free submissions for Premium members!</p>
              </div>
            ) : (
              <div className="paid-submission">
                <p><strong>Submission Fee: ${submissionFee.toFixed(2)}</strong></p>
                <p>One-time fee to cover editorial review</p>
              </div>
            )}
          </div>
        </div>
        
        <button 
          onClick={() => setShowSubmissionModal(true)}
          className="submit-newspaper-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit to Newspaper'}
        </button>
      </div>

      {/* Sharing Statistics */}
      <div className="stats-section">
        <h3>Puzzle Statistics</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-number">{shareStats.views}</span>
            <span className="stat-label">Views</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{shareStats.solves}</span>
            <span className="stat-label">Solves</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{shareStats.shares}</span>
            <span className="stat-label">Shares</span>
          </div>
        </div>
      </div>

      {/* Submission Modal */}
      {showSubmissionModal && (
        <div className="modal-overlay">
          <div className="submission-modal">
            <div className="modal-header">
              <h3>Submit to Newspaper Section</h3>
              <button 
                onClick={() => setShowSubmissionModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="puzzle-preview">
                <h4>"{puzzle.title}"</h4>
                <p>by {puzzle.author}</p>
                <p>Difficulty: {puzzle.difficulty}</p>
                <p>Words: {puzzle.metadata?.word_count || 'Unknown'}</p>
              </div>
              
              <div className="submission-terms">
                <h4>Submission Guidelines:</h4>
                <ul>
                  <li>Puzzle will be reviewed within 24-48 hours</li>
                  <li>Must be family-friendly and appropriate</li>
                  <li>Original content only (no copyrighted material)</li>
                  <li>Quality standards apply (minimum 10 words)</li>
                  <li>Author credit will be displayed if approved</li>
                </ul>
              </div>
              
              {!isPremium && (
                <div className="payment-info">
                  <p><strong>Submission Fee: ${submissionFee.toFixed(2)}</strong></p>
                  <p>This fee covers editorial review and processing.</p>
                  <p>
                    <button 
                      onClick={() => onPremiumClick('puzzle_submission')}
                      className="upgrade-link"
                    >
                      Upgrade to Premium for free submissions!
                    </button>
                  </p>
                </div>
              )}
            </div>
            
            <div className="modal-actions">
              <button 
                onClick={() => setShowSubmissionModal(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button 
                onClick={submitToNewspaper}
                className="confirm-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : (isPremium ? 'Submit Free' : `Pay $${submissionFee} & Submit`)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PuzzleSharing;

