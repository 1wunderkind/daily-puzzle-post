import React, { useState } from 'react';

const FAQ = ({ onBack, onContactClick }) => {
  const [openSection, setOpenSection] = useState(null);

  // Get current date for newspaper header
  const getCurrentDate = () => {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date().toLocaleDateString('en-US', options);
  };

  const toggleSection = (sectionId) => {
    setOpenSection(openSection === sectionId ? null : sectionId);
  };

  const faqSections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      questions: [
        {
          q: "Do I need to create an account to play?",
          a: "No account required! Simply visit Daily Puzzle Post and start playing immediately. All games are accessible without registration, passwords, or personal information."
        },
        {
          q: "Is Daily Puzzle Post really free?",
          a: "Yes, absolutely! All our word games are completely free to play. We support the site through minimal, respectful advertising. An ad-free option will be available soon for those who prefer it."
        },
        {
          q: "What devices can I play on?",
          a: "Daily Puzzle Post works on desktop computers, laptops, tablets, and smartphones. Our games are designed to work seamlessly across all modern devices with internet access."
        },
        {
          q: "Do I need to download anything?",
          a: "No downloads necessary! Our games run directly in your web browser. Simply visit our website and start playing instantly - no apps, plugins, or software installations required."
        },
        {
          q: "Which browsers are supported?",
          a: "We support all modern browsers including Chrome, Firefox, Safari, and Edge. For the best experience, we recommend using an updated version of your preferred browser."
        },
        {
          q: "Can I play on my phone or tablet?",
          a: "Absolutely! Our games are optimized for touch screens and work perfectly on mobile devices. The interface automatically adjusts to your screen size for comfortable play."
        }
      ]
    },
    {
      id: 'gameplay-rules',
      title: 'Gameplay & Rules',
      questions: [
        {
          q: "How do I play Hangman?",
          a: "Click letters to guess the hidden word. You have 6 wrong guesses before the game ends. Correct guesses reveal letters in the word. Win by guessing the complete word before running out of attempts."
        },
        {
          q: "How do I play Word Search?",
          a: "Find hidden words in the letter grid. Words can be horizontal, vertical, or diagonal, forwards or backwards. Click and drag to select words. All words to find are listed beside the grid."
        },
        {
          q: "How do I play the Daily Crossword?",
          a: "Click on a numbered square to see the clue. Type your answer using the keyboard. Use the arrow keys or click to move between squares. Numbers indicate the start of across or down answers."
        },
        {
          q: "How do I play Sudoku?",
          a: "Fill the 9x9 grid so each row, column, and 3x3 box contains digits 1-9 exactly once. Click a square and type a number. Use logic to determine which numbers can go in each position."
        },
        {
          q: "How do I play the Daily Anagram?",
          a: "Unscramble the given letters to form the target word. Click letters to rearrange them, or type your answer directly. Each puzzle has one correct solution."
        },
        {
          q: "What are the difficulty levels?",
          a: "Each game offers appropriate challenge levels. Hangman varies by word length and category. Crosswords and Sudoku have daily difficulty that gradually increases through the week."
        },
        {
          q: "Can I skip a puzzle if it's too hard?",
          a: "Yes! Click 'New Game' to get a different puzzle of the same type. For daily puzzles, you can also check back tomorrow for a fresh challenge."
        }
      ]
    },
    {
      id: 'technical-issues',
      title: 'Technical Issues',
      questions: [
        {
          q: "Why won't the games load?",
          a: "First, try refreshing your browser page. If that doesn't work, check your internet connection and ensure JavaScript is enabled. Clearing your browser cache can also resolve loading issues."
        },
        {
          q: "The screen is frozen, what do I do?",
          a: "Refresh the page by pressing F5 or clicking the refresh button. If the problem persists, try closing other browser tabs to free up memory, or restart your browser completely."
        },
        {
          q: "How do I clear my browser cache?",
          a: "Press Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac) to open cache clearing options. Select 'Cached images and files' and click Clear. This often resolves display and loading issues."
        },
        {
          q: "Why is the game running slowly?",
          a: "Close unnecessary browser tabs and applications to free up memory. Ensure you have a stable internet connection. Older devices may benefit from using a simpler browser or reducing screen resolution."
        },
        {
          q: "The buttons aren't working, how do I fix this?",
          a: "Ensure JavaScript is enabled in your browser settings. Try refreshing the page or using a different browser. On mobile devices, make sure you're tapping directly on the buttons."
        },
        {
          q: "Can I play offline?",
          a: "Our games require an internet connection to load fresh puzzles and save progress. However, once a puzzle loads, you can complete it even if your connection becomes temporarily unstable."
        },
        {
          q: "Why did my progress disappear?",
          a: "Progress is saved locally in your browser. Clearing browser data, using private/incognito mode, or switching devices will reset progress. We're working on cloud save features for the future."
        }
      ]
    },
    {
      id: 'ads-premium',
      title: 'Ads & Premium Features',
      questions: [
        {
          q: "How do I remove ads?",
          a: "An ad-free version is coming soon! This will be a simple, one-time purchase with no recurring fees. Keep an eye on our site for the launch announcement in the coming days."
        },
        {
          q: "Will the ad-free version be a subscription?",
          a: "No! When available, our ad-free version will be a simple one-time purchase. We believe in transparent pricing with no hidden fees or recurring charges."
        },
        {
          q: "What payment methods will you accept?",
          a: "When our ad-free version launches, we'll accept major credit cards and PayPal for your convenience and security. All payments will be processed through secure, encrypted systems."
        },
        {
          q: "Why do you have ads?",
          a: "Minimal advertising helps us keep all games completely free for everyone. We carefully select respectful, non-intrusive ads that don't interfere with gameplay or puzzle-solving."
        }
      ]
    },
    {
      id: 'privacy-safety',
      title: 'Privacy & Safety',
      questions: [
        {
          q: "Is Daily Puzzle Post safe for children?",
          a: "Yes! All our content is family-friendly and appropriate for all ages. We don't collect personal information from children, and our ads are carefully screened for appropriate content."
        },
        {
          q: "Do you collect personal information?",
          a: "We collect minimal information necessary to operate the site. No registration is required, and we don't sell personal data. See our Privacy Policy for complete details about data handling."
        },
        {
          q: "Are the games appropriate for all ages?",
          a: "Absolutely! Our word games are designed to be educational and entertaining for players of all ages, from children learning vocabulary to adults seeking mental exercise."
        },
        {
          q: "How is my data used?",
          a: "We use data only to improve your gaming experience and site performance. Game progress is stored locally on your device. We don't share personal information with third parties."
        },
        {
          q: "Can I delete my game history?",
          a: "Since progress is stored locally in your browser, you can clear it anytime through your browser's settings. Clearing browser data will reset all game progress and preferences."
        }
      ]
    },
    {
      id: 'features-updates',
      title: 'Features & Updates',
      questions: [
        {
          q: "How often are new puzzles added?",
          a: "We add fresh puzzles daily! Each game type gets new content regularly - daily crosswords, new Hangman words, fresh Word Search themes, and rotating Sudoku challenges."
        },
        {
          q: "Can I suggest new games or features?",
          a: "We love hearing from our community! Send your suggestions to support@dailypuzzlepost.com. While we can't implement every idea, player feedback helps guide our development priorities."
        },
        {
          q: "Will you add multiplayer games?",
          a: "We're focused on perfecting our single-player experience first. Multiplayer features may be considered in the future based on community interest and technical feasibility."
        },
        {
          q: "Can I print puzzles?",
          a: "Currently, our games are designed for digital play. We're exploring print-friendly options for future updates, especially for crosswords and Sudoku puzzles."
        },
        {
          q: "Is there a daily challenge?",
          a: "Yes! Each game type offers daily challenges. Try to maintain winning streaks, solve puzzles quickly, or complete every daily puzzle for a full week."
        },
        {
          q: "Will you add more game types?",
          a: "We're always evaluating new puzzle types that fit our newspaper-style aesthetic. Future additions will focus on classic word and logic games that our community enjoys."
        }
      ]
    }
  ];

  return (
    <div className="faq-container">
      {/* Newspaper Header */}
      <div className="faq-header">
        <div className="faq-date">{getCurrentDate()}</div>
        <h1 className="faq-title">Frequently Asked Questions</h1>
        <div className="faq-subtitle">Free Online Word Games Help & Support</div>
      </div>

      {/* Main Content */}
      <div className="faq-content">
        <div className="faq-article">
          
          {/* Byline */}
          <div className="faq-byline">
            <span className="byline-text">Customer Support Knowledge Base</span>
          </div>

          {/* Introduction */}
          <section className="faq-intro">
            <p className="faq-intro-text">
              Find answers to common questions about Daily Puzzle Post. Our comprehensive 
              help guide covers everything from getting started to troubleshooting technical 
              issues. Can't find what you're looking for? Contact our support team for 
              personalized assistance.
            </p>
          </section>

          {/* FAQ Sections */}
          {faqSections.map((section) => (
            <section key={section.id} className="faq-section">
              <div 
                className="faq-section-header"
                onClick={() => toggleSection(section.id)}
              >
                <h2 className="faq-section-title">{section.title}</h2>
                <span className={`faq-toggle ${openSection === section.id ? 'open' : ''}`}>
                  {openSection === section.id ? '−' : '+'}
                </span>
              </div>
              
              {openSection === section.id && (
                <div className="faq-section-content">
                  <div className="faq-section-divider"></div>
                  {section.questions.map((item, index) => (
                    <div key={index} className="faq-item">
                      <h3 className="faq-question">{item.q}</h3>
                      <p className="faq-answer">{item.a}</p>
                    </div>
                  ))}
                  <div className="back-to-top">
                    <button 
                      className="back-to-top-button"
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    >
                      ↑ Back to Top
                    </button>
                  </div>
                </div>
              )}
            </section>
          ))}

          {/* Contact Section */}
          <section className="faq-contact-section">
            <h2 className="faq-contact-title">Still Have Questions?</h2>
            <div className="faq-section-divider"></div>
            <p className="faq-contact-text">
              Couldn't find what you're looking for? We're here to help! Our support 
              team responds to all inquiries within 2-3 business days.
            </p>
            <button className="faq-contact-button" onClick={onContactClick}>
              Contact Us →
            </button>
          </section>

        </div>
      </div>

      {/* Back Button */}
      <div className="faq-footer">
        <button className="faq-back-button" onClick={onBack}>
          ← Return to Puzzles
        </button>
      </div>
    </div>
  );
};

export default FAQ;

