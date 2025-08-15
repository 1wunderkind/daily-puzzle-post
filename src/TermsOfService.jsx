import React, { useEffect } from 'react';
import './TermsOfService.css';

const TermsOfService = ({ onBack }) => {
  useEffect(() => {
    // SEO optimization - update page title and meta tags
    const originalTitle = document.title;
    document.title = 'Terms of Service - Daily Puzzle Post | User Agreement & Service Terms';
    
    // Add meta description for SEO
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Daily Puzzle Post Terms of Service: User agreement, service terms, premium subscription details, and usage guidelines for our newspaper-style puzzle games.');
    }

    // Add structured data for SEO
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Terms of Service - Daily Puzzle Post",
      "description": "Comprehensive terms of service covering user agreement, service usage, and premium subscription terms for Daily Puzzle Post puzzle games",
      "url": "https://dailypuzzlepost.com/terms",
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
    <div className="terms-container">
      {/* Header with navigation */}
      <header className="terms-header">
        <div className="terms-nav">
          <button 
            className="back-button"
            onClick={onBack}
            aria-label="Back to games"
          >
            ← Back to Daily Puzzle Post
          </button>
          <h1 className="terms-title">Terms of Service</h1>
        </div>
      </header>

      {/* Main content */}
      <main className="terms-content">
        <div className="terms-document">
          
          {/* Document header */}
          <div className="document-header">
            <h1>Daily Puzzle Post - Terms of Service</h1>
            <div className="document-meta">
              <p><strong>Effective Date:</strong> {getCurrentDate()}</p>
              <p><strong>Last Updated:</strong> {getCurrentDate()}</p>
            </div>
          </div>

          {/* Table of Contents */}
          <nav className="table-of-contents">
            <h2>Table of Contents</h2>
            <ol>
              <li><a href="#acceptance">Acceptance of Terms</a></li>
              <li><a href="#service-description">Description of Service</a></li>
              <li><a href="#user-conduct">User Conduct</a></li>
              <li><a href="#intellectual-property">Intellectual Property</a></li>
              <li><a href="#premium-service">Premium Service</a></li>
              <li><a href="#advertisements">Advertisements</a></li>
              <li><a href="#user-content">User-Generated Content</a></li>
              <li><a href="#disclaimers">Disclaimer of Warranties</a></li>
              <li><a href="#liability">Limitation of Liability</a></li>
              <li><a href="#indemnification">Indemnification</a></li>
              <li><a href="#termination">Termination</a></li>
              <li><a href="#governing-law">Governing Law</a></li>
              <li><a href="#changes">Changes to Terms</a></li>
              <li><a href="#contact-terms">Contact Information</a></li>
            </ol>
          </nav>

          {/* Section 1: Acceptance of Terms */}
          <section id="acceptance" className="terms-section">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using Daily Puzzle Post ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.
            </p>
            <p>
              These Terms constitute a legally binding agreement between you and Daily Puzzle Post. Your use of our Service indicates your acceptance of these Terms and our Privacy Policy, which is incorporated herein by reference.
            </p>
            <p>
              If you are using the Service on behalf of an organization, you represent and warrant that you have the authority to bind that organization to these Terms.
            </p>
          </section>

          {/* Section 2: Description of Service */}
          <section id="service-description" className="terms-section">
            <h2>2. Description of Service</h2>
            <p>
              Daily Puzzle Post provides free online word puzzle games including Hangman, Daily Crossword, Sudoku, Word Search, and a Crossword Puzzle Maker. We offer both free (ad-supported) and premium (ad-free) versions of our Service.
            </p>
            <p>
              Our Service features:
            </p>
            <ul>
              <li>Daily puzzle games with rotating content</li>
              <li>Classic newspaper-style puzzle interface</li>
              <li>User-generated crossword puzzle creation tools</li>
              <li>Progress tracking and statistics</li>
              <li>Premium subscription for enhanced features</li>
              <li>Community features for puzzle sharing</li>
              <li>Mobile-responsive design and Progressive Web App functionality</li>
            </ul>
            <p>
              We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time, with or without notice.
            </p>
          </section>

          {/* Section 3: User Conduct */}
          <section id="user-conduct" className="terms-section">
            <h2>3. User Conduct</h2>
            <p>You agree to use the Service responsibly and in accordance with these Terms. Specifically, you agree to:</p>
            <ul>
              <li>Use the Service for lawful purposes only</li>
              <li>Not attempt to hack, disrupt, or misuse the Service</li>
              <li>Not use automated systems, bots, or scripts to play games or manipulate scores</li>
              <li>Not copy, reproduce, or distribute our content without permission</li>
              <li>Respect other users in community features and interactions</li>
              <li>Not submit inappropriate, offensive, or copyrighted content</li>
              <li>Not attempt to circumvent premium features or payment systems</li>
              <li>Not engage in any activity that could harm the Service or other users</li>
            </ul>
            
            <h3>Prohibited Activities</h3>
            <p>The following activities are strictly prohibited:</p>
            <ul>
              <li>Reverse engineering or attempting to extract source code</li>
              <li>Creating multiple accounts to circumvent limitations</li>
              <li>Sharing premium access credentials with others</li>
              <li>Submitting malicious content or code</li>
              <li>Violating any applicable laws or regulations</li>
              <li>Impersonating other users or entities</li>
              <li>Spamming or sending unsolicited communications</li>
            </ul>
          </section>

          {/* Section 4: Intellectual Property */}
          <section id="intellectual-property" className="terms-section">
            <h2>4. Intellectual Property</h2>
            <p>
              All game content, design, code, graphics, text, and other materials on the Service are owned by Daily Puzzle Post or our licensors and are protected by copyright, trademark, and other intellectual property laws.
            </p>
            
            <h3>Our Content</h3>
            <ul>
              <li>You may not copy, modify, distribute, or create derivative works from our content</li>
              <li>"Daily Puzzle Post" and our logo are our trademarks</li>
              <li>All puzzle designs, game mechanics, and user interface elements are our property</li>
              <li>You may not use our trademarks without written permission</li>
            </ul>

            <h3>User-Generated Content</h3>
            <ul>
              <li>You retain ownership of crossword puzzles you create using our Puzzle Maker</li>
              <li>By submitting content, you grant us a license to use, display, and distribute it</li>
              <li>You represent that your content is original and does not infringe third-party rights</li>
              <li>We may remove user content that violates these Terms</li>
            </ul>

            <h3>Fair Use</h3>
            <p>
              You may use our Service for personal, non-commercial purposes. Educational use is permitted with proper attribution. Commercial use requires written permission.
            </p>
          </section>

          {/* Section 5: Premium Service */}
          <section id="premium-service" className="terms-section">
            <h2>5. Premium Service</h2>
            
            <h3>Premium Features</h3>
            <p>Our premium subscription ($4.99/month) includes:</p>
            <ul>
              <li>Ad-free puzzle gaming experience</li>
              <li>Access to 30-day puzzle archive</li>
              <li>Unlimited offline puzzle access</li>
              <li>Unlimited crossword puzzle creation</li>
              <li>Priority customer support</li>
              <li>Early access to new puzzle types</li>
            </ul>

            <h3>Payment Terms</h3>
            <ul>
              <li>Premium subscription is billed monthly at $4.99 USD</li>
              <li>Payment is processed through Stripe or PayPal</li>
              <li>Subscription automatically renews unless cancelled</li>
              <li>You may cancel at any time through your account settings</li>
              <li>Refunds are provided in accordance with our refund policy</li>
              <li>Premium access is tied to your email address and device</li>
            </ul>

            <h3>Cancellation and Refunds</h3>
            <ul>
              <li>You may cancel your subscription at any time</li>
              <li>Cancellation takes effect at the end of the current billing period</li>
              <li>Refunds are available within 30 days of purchase</li>
              <li>We reserve the right to modify premium features with reasonable notice</li>
              <li>No refunds for partial months or unused features</li>
            </ul>
          </section>

          {/* Section 6: Advertisements */}
          <section id="advertisements" className="terms-section">
            <h2>6. Advertisements</h2>
            <p>
              The free version of our Service includes advertisements provided by Google AdSense and other advertising partners.
            </p>
            <ul>
              <li>We are not responsible for the content of third-party advertisements</li>
              <li>Ad-blockers may interfere with game functionality</li>
              <li>Advertisements are displayed in newspaper-style placements</li>
              <li>Premium subscription removes all advertisements</li>
              <li>We do not endorse products or services advertised on our Service</li>
              <li>Clicking on ads may redirect you to third-party websites</li>
            </ul>
          </section>

          {/* Section 7: User-Generated Content */}
          <section id="user-content" className="terms-section">
            <h2>7. User-Generated Content</h2>
            <p>
              Our Crossword Puzzle Maker allows users to create and submit original crossword puzzles.
            </p>

            <h3>Content Guidelines</h3>
            <ul>
              <li>All submitted content must be family-friendly and appropriate</li>
              <li>No offensive, discriminatory, or inappropriate language</li>
              <li>No copyrighted material without permission</li>
              <li>Puzzles must be solvable and of reasonable quality</li>
              <li>No promotional or commercial content without permission</li>
            </ul>

            <h3>Moderation</h3>
            <ul>
              <li>All submitted puzzles are subject to moderation</li>
              <li>We reserve the right to reject or remove content</li>
              <li>Automated and manual review processes are used</li>
              <li>Appeals can be submitted for rejected content</li>
            </ul>

            <h3>Community Features</h3>
            <ul>
              <li>Featured puzzles may be selected for weekly highlights</li>
              <li>User voting and feedback systems may be implemented</li>
              <li>Creator attribution is provided for published puzzles</li>
              <li>Community guidelines apply to all interactions</li>
            </ul>
          </section>

          {/* Section 8: Disclaimer of Warranties */}
          <section id="disclaimers" className="terms-section">
            <h2>8. Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p>
              We do not warrant that:
            </p>
            <ul>
              <li>The Service will be uninterrupted or error-free</li>
              <li>Defects will be corrected</li>
              <li>The Service is free of viruses or harmful components</li>
              <li>The results of using the Service will meet your requirements</li>
              <li>The accuracy or reliability of any information obtained through the Service</li>
            </ul>
            <p>
              Your use of the Service is at your sole risk. Some jurisdictions do not allow the exclusion of implied warranties, so some of the above exclusions may not apply to you.
            </p>
          </section>

          {/* Section 9: Limitation of Liability */}
          <section id="liability" className="terms-section">
            <h2>9. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, DAILY PUZZLE POST SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul>
              <li>Loss of profits, data, or use</li>
              <li>Business interruption</li>
              <li>Personal injury or property damage</li>
              <li>Loss of privacy or security breaches</li>
              <li>Failure to meet any duty or obligation</li>
            </ul>
            <p>
              Our total liability for any claim arising from these Terms or your use of the Service shall not exceed the amount you paid us in the twelve months preceding the claim, or $100, whichever is greater.
            </p>
            <p>
              Some jurisdictions do not allow the limitation of liability for incidental or consequential damages, so some of the above limitations may not apply to you.
            </p>
          </section>

          {/* Section 10: Indemnification */}
          <section id="indemnification" className="terms-section">
            <h2>10. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless Daily Puzzle Post, its officers, directors, employees, and agents from and against any claims, damages, losses, costs, and expenses (including reasonable attorneys' fees) arising from:
            </p>
            <ul>
              <li>Your violation of these Terms</li>
              <li>Your use of the Service</li>
              <li>Your violation of any rights of another party</li>
              <li>Content you submit or create using our Service</li>
              <li>Your violation of any applicable laws or regulations</li>
            </ul>
          </section>

          {/* Section 11: Termination */}
          <section id="termination" className="terms-section">
            <h2>11. Termination</h2>
            <p>
              We reserve the right to terminate or suspend your access to the Service immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
            </p>

            <h3>Grounds for Termination</h3>
            <ul>
              <li>Violation of these Terms of Service</li>
              <li>Fraudulent or illegal activity</li>
              <li>Abuse of the Service or other users</li>
              <li>Non-payment of premium subscription fees</li>
              <li>Technical or security concerns</li>
            </ul>

            <h3>Effect of Termination</h3>
            <ul>
              <li>Your right to use the Service will cease immediately</li>
              <li>We may delete your account and associated data</li>
              <li>Premium subscriptions will be cancelled</li>
              <li>Provisions that should survive termination will remain in effect</li>
            </ul>

            <h3>Your Right to Terminate</h3>
            <p>
              You may stop using the Service at any time. If you have a premium subscription, you may cancel it through your account settings or by contacting us.
            </p>
          </section>

          {/* Section 12: Governing Law */}
          <section id="governing-law" className="terms-section">
            <h2>12. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.
            </p>
            <p>
              Any disputes arising from these Terms or your use of the Service shall be resolved in the courts of competent jurisdiction. You agree to submit to the personal jurisdiction of such courts.
            </p>

            <h3>Dispute Resolution</h3>
            <p>
              Before filing any legal action, you agree to attempt to resolve disputes through:
            </p>
            <ul>
              <li>Direct communication with our support team</li>
              <li>Good faith negotiation</li>
              <li>Mediation if necessary</li>
            </ul>
          </section>

          {/* Section 13: Changes to Terms */}
          <section id="changes" className="terms-section">
            <h2>13. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will provide notice of significant changes by:
            </p>
            <ul>
              <li>Posting the updated Terms on our website</li>
              <li>Updating the "Last Updated" date</li>
              <li>Sending email notifications to premium subscribers</li>
              <li>Displaying prominent notices on our Service</li>
            </ul>
            <p>
              Your continued use of the Service after changes become effective constitutes acceptance of the new Terms. If you do not agree to the modified Terms, you must stop using the Service.
            </p>

            <h3>Material Changes</h3>
            <p>
              For material changes affecting premium subscriptions or user rights, we will provide at least 30 days' notice before the changes take effect.
            </p>
          </section>

          {/* Section 14: Miscellaneous */}
          <section className="terms-section">
            <h2>14. Miscellaneous</h2>
            
            <h3>Severability</h3>
            <p>
              If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that the remaining Terms will remain in full force and effect.
            </p>

            <h3>Entire Agreement</h3>
            <p>
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and Daily Puzzle Post regarding the use of the Service and supersede all prior agreements.
            </p>

            <h3>Assignment</h3>
            <p>
              You may not assign or transfer these Terms or your rights under these Terms without our written consent. We may assign these Terms without restriction.
            </p>

            <h3>Waiver</h3>
            <p>
              Our failure to enforce any provision of these Terms will not be deemed a waiver of such provision or our right to enforce it in the future.
            </p>
          </section>

          {/* Section 15: Contact Information */}
          <section id="contact-terms" className="terms-section">
            <h2>15. Contact Information</h2>
            <p>For questions about these Terms of Service, please contact us:</p>
            <div className="contact-info">
              <ul>
                <li><strong>Email:</strong> support@dailypuzzlepost.com</li>
                <li><strong>Legal Inquiries:</strong> legal@dailypuzzlepost.com</li>
                <li><strong>Website:</strong> dailypuzzlepost.com/contact</li>
                <li><strong>Response Time:</strong> We aim to respond within 48 hours</li>
              </ul>
            </div>
            <p>
              For urgent matters or legal notices, please use certified mail or email with read receipt requested.
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
              <p>This document is available in print-friendly format. Use your browser's print function to save or print these terms.</p>
            </div>
          </footer>

        </div>
      </main>
    </div>
  );
};

export default TermsOfService;

