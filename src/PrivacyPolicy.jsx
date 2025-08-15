import React, { useEffect } from 'react';
import './PrivacyPolicy.css';

const PrivacyPolicy = ({ onBack }) => {
  useEffect(() => {
    // SEO optimization - update page title and meta tags
    const originalTitle = document.title;
    document.title = 'Privacy Policy - Daily Puzzle Post | Data Protection & Cookie Policy';
    
    // Add meta description for SEO
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Daily Puzzle Post Privacy Policy: Learn how we protect your data, use cookies, and comply with GDPR. Transparent data practices for our puzzle games and premium services.');
    }

    // Add structured data for SEO
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Privacy Policy - Daily Puzzle Post",
      "description": "Comprehensive privacy policy covering data collection, usage, and protection for Daily Puzzle Post puzzle games",
      "url": "https://dailypuzzlepost.com/privacy",
      "publisher": {
        "@type": "Organization",
        "name": "Daily Puzzle Post",
        "url": "https://dailypuzzlepost.com"
      },
      "dateModified": new Date().toISOString().split('T')[0],
      "inLanguage": "en-US"
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    // Cleanup on unmount
    return () => {
      document.title = originalTitle;
      document.head.removeChild(script);
    };
  }, []);

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="privacy-policy-container">
      {/* Header with navigation */}
      <header className="privacy-header">
        <div className="privacy-nav">
          <button 
            className="back-button"
            onClick={onBack}
            aria-label="Back to games"
          >
            ← Back to Daily Puzzle Post
          </button>
          <h1 className="privacy-title">Privacy Policy</h1>
        </div>
      </header>

      {/* Main content */}
      <main className="privacy-content">
        <div className="privacy-document">
          
          {/* Document header */}
          <div className="document-header">
            <h1>Daily Puzzle Post - Privacy Policy</h1>
            <div className="document-meta">
              <p><strong>Effective Date:</strong> {getCurrentDate()}</p>
              <p><strong>Last Updated:</strong> {getCurrentDate()}</p>
            </div>
          </div>

          {/* Table of Contents */}
          <nav className="table-of-contents">
            <h2>Table of Contents</h2>
            <ol>
              <li><a href="#introduction">Introduction</a></li>
              <li><a href="#information-collected">Information We Collect</a></li>
              <li><a href="#information-usage">How We Use Your Information</a></li>
              <li><a href="#third-party-services">Third-Party Services</a></li>
              <li><a href="#cookies">Cookies</a></li>
              <li><a href="#data-security">Data Storage and Security</a></li>
              <li><a href="#childrens-privacy">Children's Privacy</a></li>
              <li><a href="#user-rights">Your Rights</a></li>
              <li><a href="#california-rights">California Privacy Rights</a></li>
              <li><a href="#policy-changes">Changes to This Policy</a></li>
              <li><a href="#contact">Contact Us</a></li>
              <li><a href="#gdpr-compliance">GDPR Compliance Notice</a></li>
            </ol>
          </nav>

          {/* Section 1: Introduction */}
          <section id="introduction" className="privacy-section">
            <h2>1. Introduction</h2>
            <p>
              Welcome to Daily Puzzle Post ("we," "us," or "our"). We respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website at dailypuzzlepost.com (the "Service").
            </p>
            <p>
              Daily Puzzle Post is a newspaper-style puzzle platform offering classic word games including Hangman, Daily Crossword, Sudoku, and Word Search. We are committed to maintaining the trust and confidence of our users, particularly our core demographic of puzzle enthusiasts aged 35-65.
            </p>
          </section>

          {/* Section 2: Information We Collect */}
          <section id="information-collected" className="privacy-section">
            <h2>2. Information We Collect</h2>
            
            <h3>Information You Provide</h3>
            <ul>
              <li><strong>Email Address</strong> (optional): Only if you subscribe to our daily puzzle newsletter or upgrade to premium</li>
              <li><strong>Payment Information</strong>: Processed securely through third-party providers (Stripe/PayPal) for premium purchases - we never store credit card information</li>
              <li><strong>User-Generated Content</strong>: If you create and submit crossword puzzles through our Puzzle Maker tool</li>
            </ul>

            <h3>Information Automatically Collected</h3>
            <ul>
              <li><strong>Game Data</strong>: Your scores, streaks, game preferences, and puzzle completion statistics (stored locally in your browser)</li>
              <li><strong>Usage Data</strong>: Pages visited, time spent on games, puzzle types played, feature usage (via Google Analytics)</li>
              <li><strong>Device Information</strong>: Browser type, device type, screen resolution, operating system</li>
              <li><strong>IP Address</strong>: For general location data, security purposes, and fraud prevention</li>
              <li><strong>Cookies and Local Storage</strong>: For game state persistence, premium status, and user preferences</li>
            </ul>
          </section>

          {/* Section 3: How We Use Your Information */}
          <section id="information-usage" className="privacy-section">
            <h2>3. How We Use Your Information</h2>
            <p>We use the collected information to:</p>
            <ul>
              <li>Provide and maintain our puzzle gaming Service</li>
              <li>Send daily puzzle emails and notifications (only if you subscribed)</li>
              <li>Process premium upgrade payments and manage subscriptions</li>
              <li>Improve game experience and develop new puzzle types</li>
              <li>Display relevant advertisements through Google AdSense (free version only)</li>
              <li>Analyze usage patterns to enhance user experience and game difficulty</li>
              <li>Moderate user-submitted crossword puzzles for quality and appropriateness</li>
              <li>Provide customer support and respond to inquiries</li>
              <li>Comply with legal obligations and prevent fraudulent activity</li>
              <li>Send important service announcements and policy updates</li>
            </ul>
          </section>

          {/* Section 4: Third-Party Services */}
          <section id="third-party-services" className="privacy-section">
            <h2>4. Third-Party Services</h2>
            <p>We use the following third-party services that may collect information:</p>

            <div className="service-details">
              <h3>Google AdSense</h3>
              <ul>
                <li>Displays advertisements on our free version</li>
                <li>Uses cookies to show relevant ads based on your interests</li>
                <li>Has its own privacy policy: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a></li>
                <li>You can opt-out of personalized ads: <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google Ad Settings</a></li>
              </ul>

              <h3>Google Analytics</h3>
              <ul>
                <li>Helps us understand how users interact with our Service</li>
                <li>Collects anonymous usage data and demographics</li>
                <li>You can opt-out: <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">Google Analytics Opt-out</a></li>
              </ul>

              <h3>Payment Processors</h3>
              <ul>
                <li><strong>Stripe</strong> and <strong>PayPal</strong> handle all payment transactions</li>
                <li>We never store credit card information on our servers</li>
                <li>See their privacy policies for payment data handling:
                  <ul>
                    <li><a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">Stripe Privacy Policy</a></li>
                    <li><a href="https://www.paypal.com/us/webapps/mpp/ua/privacy-full" target="_blank" rel="noopener noreferrer">PayPal Privacy Policy</a></li>
                  </ul>
                </li>
              </ul>
            </div>
          </section>

          {/* Section 5: Cookies */}
          <section id="cookies" className="privacy-section">
            <h2>5. Cookies</h2>
            <p>We use cookies and similar technologies to enhance your experience:</p>

            <div className="cookie-types">
              <h3>Essential Cookies</h3>
              <ul>
                <li>Remember your game preferences and settings</li>
                <li>Store your premium subscription status</li>
                <li>Maintain your puzzle progress and statistics</li>
                <li>Enable core website functionality</li>
              </ul>

              <h3>Analytics Cookies</h3>
              <ul>
                <li>Google Analytics to understand usage patterns</li>
                <li>Help us improve the Service and develop new features</li>
                <li>Track popular puzzle types and difficulty preferences</li>
              </ul>

              <h3>Advertising Cookies</h3>
              <ul>
                <li>Google AdSense to display relevant advertisements</li>
                <li>Only used in the free version of our Service</li>
                <li>Help show ads that may interest you</li>
              </ul>
            </div>

            <p>
              You can control cookies through your browser settings, but disabling them may affect game functionality, including loss of saved progress and preferences.
            </p>
          </section>

          {/* Section 6: Data Storage and Security */}
          <section id="data-security" className="privacy-section">
            <h2>6. Data Storage and Security</h2>
            <ul>
              <li>Game progress and preferences are stored locally in your browser (localStorage)</li>
              <li>We implement reasonable security measures to protect your information</li>
              <li>All data transmission is encrypted using SSL/TLS protocols</li>
              <li>Premium status is encrypted and stored securely</li>
              <li>We regularly update our security practices and systems</li>
              <li>No method of transmission over the internet is 100% secure</li>
              <li>We retain personal information only as long as necessary for the purposes outlined in this policy</li>
            </ul>
          </section>

          {/* Section 7: Children's Privacy */}
          <section id="childrens-privacy" className="privacy-section">
            <h2>7. Children's Privacy</h2>
            <p>
              Daily Puzzle Post is intended for users aged 13 and older. We do not knowingly collect personal information from children under 13. If we discover such information has been collected, we will delete it immediately.
            </p>
            <p>
              Parents who believe their child under 13 has provided personal information to us should contact us immediately at privacy@dailypuzzlepost.com.
            </p>
          </section>

          {/* Section 8: Your Rights */}
          <section id="user-rights" className="privacy-section">
            <h2>8. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access the personal information we have about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Opt-out of marketing emails at any time</li>
              <li>Disable cookies through your browser settings</li>
              <li>Cancel your premium subscription at any time</li>
              <li>Export your game data and statistics</li>
              <li>Object to processing of your personal information</li>
            </ul>
          </section>

          {/* Section 9: California Privacy Rights */}
          <section id="california-rights" className="privacy-section">
            <h2>9. California Privacy Rights</h2>
            <p>
              California residents have additional rights under the California Consumer Privacy Act (CCPA), including:
            </p>
            <ul>
              <li>The right to know what personal information is collected about you</li>
              <li>The right to know whether your personal information is sold or disclosed</li>
              <li>The right to say no to the sale of personal information</li>
              <li>The right to access your personal information</li>
              <li>The right to equal service and price, even if you exercise your privacy rights</li>
            </ul>
            <p>
              <strong>Note:</strong> We do not sell personal information to third parties.
            </p>
          </section>

          {/* Section 10: Changes to This Policy */}
          <section id="policy-changes" className="privacy-section">
            <h2>10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically to reflect changes in our practices or for legal, operational, or regulatory reasons. We will notify you of any material changes by:
            </p>
            <ul>
              <li>Posting the new policy on this page</li>
              <li>Updating the "Last Updated" date</li>
              <li>Sending an email notification if you have subscribed to our newsletter</li>
              <li>Displaying a prominent notice on our website</li>
            </ul>
            <p>
              Your continued use of the Service after changes become effective constitutes acceptance of the revised Privacy Policy.
            </p>
          </section>

          {/* Section 11: Contact Us */}
          <section id="contact" className="privacy-section">
            <h2>11. Contact Us</h2>
            <p>If you have questions about this Privacy Policy or our privacy practices, please contact us:</p>
            <div className="contact-info">
              <ul>
                <li><strong>Email:</strong> privacy@dailypuzzlepost.com</li>
                <li><strong>Website:</strong> dailypuzzlepost.com/contact</li>
                <li><strong>Response Time:</strong> We aim to respond within 48 hours</li>
              </ul>
            </div>
          </section>

          {/* Section 12: GDPR Compliance */}
          <section id="gdpr-compliance" className="privacy-section">
            <h2>12. GDPR Compliance Notice (For EU Users)</h2>
            
            <h3>Legal Basis for Processing</h3>
            <p>We process your data based on:</p>
            <ul>
              <li><strong>Legitimate Interests:</strong> To provide and improve our puzzle gaming Service</li>
              <li><strong>Consent:</strong> For marketing emails, analytics, and personalized advertising</li>
              <li><strong>Contract:</strong> For premium service delivery and payment processing</li>
              <li><strong>Legal Obligation:</strong> For compliance with applicable laws</li>
            </ul>

            <h3>Your Rights Under GDPR</h3>
            <p>EU residents have the right to:</p>
            <ul>
              <li>Access your personal data and receive a copy</li>
              <li>Rectify inaccurate data</li>
              <li>Erase your data ("right to be forgotten")</li>
              <li>Restrict processing</li>
              <li>Data portability</li>
              <li>Object to processing</li>
              <li>Withdraw consent at any time</li>
              <li>Lodge a complaint with a supervisory authority</li>
            </ul>

            <h3>Data Protection Officer</h3>
            <p>For GDPR-related inquiries, contact our Data Protection Officer:</p>
            <ul>
              <li><strong>Email:</strong> dpo@dailypuzzlepost.com</li>
            </ul>

            <h3>International Transfers</h3>
            <p>
              Your data may be transferred to servers in the United States. We ensure appropriate safeguards are in place for such transfers, including standard contractual clauses and adequacy decisions.
            </p>
          </section>

          {/* Document footer */}
          <footer className="document-footer">
            <div className="footer-meta">
              <p><strong>Document Version:</strong> 1.0</p>
              <p><strong>Effective Date:</strong> {getCurrentDate()}</p>
              <p><strong>Next Review Date:</strong> {new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div className="print-info">
              <p>This document is available in print-friendly format. Use your browser's print function to save or print this policy.</p>
            </div>
          </footer>

        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;

