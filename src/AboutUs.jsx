import React from 'react';

const AboutUs = ({ onBack }) => {
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
    <div className="about-us-container">
      {/* Newspaper Header */}
      <div className="about-header">
        <div className="about-date">{getCurrentDate()}</div>
        <h1 className="about-title">About Daily Puzzle Post</h1>
        <div className="about-subtitle">Your Trusted Source for Classic Word Puzzles and Brain Training</div>
      </div>

      {/* Main Content */}
      <div className="about-content">
        <div className="about-article">
          
          {/* Byline */}
          <div className="about-byline">
            <span className="byline-text">By the Daily Puzzle Post Editorial Team</span>
          </div>

          {/* Lead Section */}
          <section className="about-section about-lead">
            <p className="about-lead-text">
              Welcome to Daily Puzzle Post, where classic word games meet modern convenience. 
              We are the trusted home for traditional puzzles, brain teasers, and daily mental 
              challenges that puzzle enthusiasts enjoy every day—no downloads, no complicated 
              interfaces, just pure puzzle-solving satisfaction.
            </p>
          </section>

          {/* Mission Section */}
          <section className="about-section">
            <h2 className="about-section-title">Our Mission</h2>
            <div className="about-section-divider"></div>
            <p>
              At Daily Puzzle Post, we believe that playing word games should be simple, 
              enjoyable, and accessible to everyone. Our mission is to provide a clean, 
              thoughtfully designed experience where you can enjoy daily word puzzles, 
              crossword games, word searches, and brain training exercises without the 
              frustration of intrusive advertising or confusing interfaces.
            </p>
            <p>
              Whether you're looking to play Hangman, tackle today's daily crossword, 
              or explore our collection of classic word games, we've built a platform 
              that respects your time and intelligence. Every puzzle, from our Sudoku 
              to our word scrambles, is carefully curated to provide the perfect blend 
              of challenge and relaxation.
            </p>
          </section>

          {/* Why Choose Us Section */}
          <section className="about-section">
            <h2 className="about-section-title">Why Puzzle Enthusiasts Choose Daily Puzzle Post</h2>
            <div className="about-section-divider"></div>
            
            <h3 className="about-subsection-title">Classic Games, Modern Convenience</h3>
            <p>
              Our browser-based word games work instantly on any device—desktop, tablet, 
              or mobile. Simply visit Daily Puzzle Post and start playing your favorite 
              puzzles in seconds. No registration required, no downloads needed, just 
              instant access to quality brain games that challenge and entertain.
            </p>

            <h3 className="about-subsection-title">Daily Mental Exercise</h3>
            <p>
              Research suggests that regular puzzle-solving can help maintain cognitive 
              function and mental agility. That's why we offer fresh daily challenges 
              every single day, including:
            </p>
            <ul className="about-features-list">
              <li>Daily Word Search puzzles with themed categories</li>
              <li>Hangman games with varying difficulty levels</li>
              <li>Word scramble challenges to test your vocabulary</li>
              <li>Daily crossword puzzles for traditional puzzle lovers</li>
              <li>Brain teasers and word challenges for extra mental stimulation</li>
            </ul>

            <h3 className="about-subsection-title">Designed for Real Players</h3>
            <p>
              We understand that puzzle enthusiasts value clarity over flashy graphics. 
              Our thoughtfully designed platform features:
            </p>
            <ul className="about-features-list">
              <li>Large, readable fonts perfect for extended puzzle sessions</li>
              <li>Clear, responsive buttons designed for all devices</li>
              <li>Simple navigation that makes finding games effortless</li>
              <li>Minimal, respectful advertising that doesn't interrupt gameplay</li>
              <li>Classic puzzle aesthetics that feel familiar and trustworthy</li>
            </ul>
          </section>

          {/* Our Story Section */}
          <section className="about-section">
            <h2 className="about-section-title">Our Story</h2>
            <div className="about-section-divider"></div>
            <p>
              Daily Puzzle Post was born from a simple observation: the best word game 
              websites were either cluttered with intrusive advertising or hiding behind 
              paywalls. As puzzle enthusiasts who grew up with newspaper crosswords and 
              word search books, we knew there had to be a better way to bring classic 
              word puzzles to the digital age.
            </p>
            <p>
              Our team, with backgrounds in digital publishing and a shared love of 
              traditional word games, combined their expertise with modern web technology 
              to create something special: a puzzle platform that honors the timeless 
              appeal of pencil-and-paper puzzles while embracing the convenience of 
              digital play.
            </p>
            <p>
              Today, Daily Puzzle Post serves puzzle enthusiasts worldwide who seek 
              quality brain training games and mental exercise puzzles. From retirees 
              enjoying their morning crossword to professionals taking a mental break 
              during lunch, our community spans generations united by a love of words 
              and mental challenges.
            </p>
          </section>

          {/* What Makes Us Different */}
          <section className="about-section">
            <h2 className="about-section-title">What Makes Daily Puzzle Post Different</h2>
            <div className="about-section-divider"></div>
            
            <h3 className="about-subsection-title">Transparent and Honest</h3>
            <p>
              Unlike puzzle sites that lure players with free games only to demand 
              subscriptions, we believe in transparency. Play our word search games, 
              Hangman puzzles, and daily brain teasers without worrying about hidden 
              charges. Our optional ad-free experience is straightforward—no recurring 
              fees, no cancellation hassles.
            </p>

            <h3 className="about-subsection-title">Thoughtfully Designed Challenges</h3>
            <p>
              Our puzzles aren't just entertaining—they're designed to engage different 
              aspects of mental fitness. Whether you're using our word puzzle games to 
              maintain mental sharpness or our vocabulary challenges to expand your 
              lexicon, every puzzle serves a purpose beyond simple entertainment.
            </p>

            <h3 className="about-subsection-title">Accessible to Everyone</h3>
            <p>
              We're committed to creating puzzles that work for everyone, whether you're 
              looking for easy word games to start your day, challenging puzzles for 
              mental exercise, educational games for learning, or relaxing activities 
              for stress relief.
            </p>
          </section>

          {/* Our Commitment */}
          <section className="about-section">
            <h2 className="about-section-title">Our Commitment to You</h2>
            <div className="about-section-divider"></div>
            <p>At Daily Puzzle Post, we promise to:</p>
            <ol className="about-commitment-list">
              <li><strong>Keep our core games free</strong> - The essential Daily Puzzle Post experience will always be accessible</li>
              <li><strong>Respect your time</strong> - Quick-loading games with no unnecessary delays</li>
              <li><strong>Protect your privacy</strong> - No intrusive data collection or selling your information</li>
              <li><strong>Listen to our community</strong> - Regular improvements based on player feedback</li>
              <li><strong>Maintain quality</strong> - Every puzzle is tested for fairness and enjoyment</li>
            </ol>
          </section>

          {/* Team Section (Placeholder) */}
          <section className="about-section">
            <h2 className="about-section-title">Meet the Team</h2>
            <div className="about-section-divider"></div>
            <p>
              Daily Puzzle Post is created and maintained by a dedicated team of puzzle 
              enthusiasts, web developers, and content creators who share a passion for 
              quality word games and brain training. More team information will be 
              available soon.
            </p>
          </section>

          {/* Closing Section */}
          <section className="about-section about-closing">
            <h2 className="about-section-title">Start Your Daily Puzzle Journey</h2>
            <div className="about-section-divider"></div>
            <p>
              Ready to join puzzle enthusiasts who've made Daily Puzzle Post their 
              trusted destination for quality word games? Whether you're here to play 
              word search puzzles, challenge yourself with daily Hangman games, or 
              explore our growing collection of brain training puzzles, you're in 
              the right place.
            </p>
            <p className="about-closing-text">
              No downloads. No registrations. No surprises. Just quality word games, 
              ready whenever you are.
            </p>
          </section>

        </div>
      </div>

      {/* Back Button */}
      <div className="about-footer">
        <button className="about-back-button" onClick={onBack}>
          ← Return to Puzzles
        </button>
      </div>
    </div>
  );
};

export default AboutUs;

