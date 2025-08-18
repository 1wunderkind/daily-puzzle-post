import React from 'react';

const ContactUs = ({ onBack, onFAQClick }) => {
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

  return (
    <div className="contact-us-container">
      {/* Newspaper Header */}
      <div className="contact-header">
        <div className="contact-date">{getCurrentDate()}</div>
        <h1 className="contact-title">Contact Daily Puzzle Post</h1>
        <div className="contact-subtitle">Get Help with Free Online Word Games</div>
      </div>

      {/* Main Content */}
      <div className="contact-content">
        <div className="contact-article">
          
          {/* Byline */}
          <div className="contact-byline">
            <span className="byline-text">Customer Support Department</span>
          </div>

          {/* Main Contact Section */}
          <section className="contact-section">
            <h2 className="contact-section-title">Get in Touch</h2>
            <div className="contact-section-divider"></div>
            
            <div className="contact-info-box">
              <h3 className="contact-info-title">General Inquiries</h3>
              <div className="contact-email">
                <a href="mailto:support@dailypuzzlepost.com" className="email-link">
                  support@dailypuzzlepost.com
                </a>
              </div>
              
              <div className="contact-purposes">
                <p><strong>For questions about:</strong></p>
                <ul className="contact-purposes-list">
                  <li>Puzzle suggestions or feedback</li>
                  <li>Technical issues or bug reports</li>
                  <li>Partnership opportunities</li>
                  <li>Press and media inquiries</li>
                  <li>Accessibility concerns</li>
                </ul>
              </div>
              
              <div className="response-time">
                <p><strong>Response time:</strong> 2-3 business days</p>
              </div>
            </div>

            <div className="autoresponder-notice">
              <p className="notice-text">
                You'll receive an automatic confirmation email within minutes. We 
                personally respond to all inquiries within 2-3 business days during 
                business hours.
              </p>
            </div>
          </section>

          {/* Quick Help Section */}
          <section className="contact-section">
            <h2 className="contact-section-title">Quick Help</h2>
            <div className="contact-section-divider"></div>
            
            <div className="quick-help-box">
              <h3 className="quick-help-title">Before You Email - Quick Answers:</h3>
              <ul className="quick-help-list">
                <li>All games are completely free to play</li>
                <li>No account or registration required</li>
                <li>Works on all modern browsers</li>
                <li>Ad-free version available (coming soon)</li>
                <li>Compatible with desktop, tablet, and mobile devices</li>
              </ul>
              
              <div className="faq-prompt">
                <p className="faq-prompt-text">
                  <strong>Quick Tip:</strong> Many questions are already answered in our FAQ section!
                </p>
                <button className="faq-button" onClick={onFAQClick}>
                  View Complete FAQ →
                </button>
              </div>
            </div>
          </section>

          {/* Business Information */}
          <section className="contact-section">
            <h2 className="contact-section-title">Business Information</h2>
            <div className="contact-section-divider"></div>
            
            <div className="business-info">
              <p><strong>Daily Puzzle Post</strong></p>
              <p>Online Word Games Platform</p>
              <p>Serving puzzle enthusiasts worldwide</p>
              <p className="business-hours">
                <strong>Support Hours:</strong> Monday - Friday, 9:00 AM - 5:00 PM EST
              </p>
            </div>
          </section>

          {/* Alternative Support */}
          <section className="contact-section">
            <h2 className="contact-section-title">Need Immediate Help?</h2>
            <div className="contact-section-divider"></div>
            
            <div className="immediate-help">
              <p>For immediate assistance with common issues:</p>
              <ul className="immediate-help-list">
                <li><strong>Game won't load:</strong> Try refreshing your browser or clearing cache</li>
                <li><strong>Buttons not working:</strong> Ensure JavaScript is enabled</li>
                <li><strong>Mobile issues:</strong> Try rotating your device or using landscape mode</li>
                <li><strong>Slow performance:</strong> Close other browser tabs and try again</li>
              </ul>
              
              <div className="faq-redirect">
                <p>For more detailed troubleshooting steps:</p>
                <button className="faq-button-large" onClick={onFAQClick}>
                  See All FAQs →
                </button>
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* Back Button */}
      <div className="contact-footer">
        <button className="contact-back-button" onClick={onBack}>
          ← Return to Puzzles
        </button>
      </div>
    </div>
  );
};

export default ContactUs;

