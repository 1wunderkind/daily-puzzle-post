# Daily Puzzle Post

A classic newspaper-style word games website featuring Hangman and other engaging puzzles designed for casual players aged 35-55.

## Overview

Daily Puzzle Post combines the timeless appeal of newspaper puzzle sections with modern web technology. The site features an authentic 1990s newspaper aesthetic while providing a smooth, responsive gaming experience across all devices.

## Features

### Current Games
- **Hangman**: Classic word guessing game with 150+ words across 4 categories
  - Animals, Food, Places, Objects
  - Visual hangman drawing progression
  - Hint system (1 per game)
  - Score tracking and win streaks

### Design Philosophy
- Authentic newspaper puzzle section aesthetic
- Black, white, and gray color palette with Times New Roman typography
- Mobile-first responsive design
- Large, touch-friendly buttons for mature audience
- Clean, trustworthy appearance

### Monetization Features
- Google AdSense integration ready
- Premium upgrade system ($4.99 one-time payment)
- Ad-free experience for premium users
- Analytics tracking for user behavior and conversions

## Technical Stack

- **Frontend**: React 18 with Vite
- **Styling**: Custom CSS with newspaper-inspired design system
- **Analytics**: Google Analytics 4 integration ready
- **Monetization**: AdSense placeholders and premium upgrade modal
- **Storage**: localStorage for game progress and premium status

## Development History

This repository tracks the complete development journey from initial concept to full monetization implementation:

1. **Foundation**: Basic newspaper-style design and Hangman game
2. **Enhancement**: Advanced game features, categories, and scoring
3. **Monetization**: AdSense integration and premium upgrade system
4. **Optimization**: Performance improvements and mobile responsiveness

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
git clone https://github.com/1wunderkind/daily-puzzle-post.git
cd daily-puzzle-post
npm install
npm run dev
```

### Building for Production
```bash
npm run build
```

## Configuration

### Google AdSense Setup
1. Replace `ca-pub-XXXXXXXXXX` in `index.html` with your Publisher ID
2. Update ad unit IDs in the AdSense placeholder components
3. Uncomment the AdSense script tags

### Google Analytics Setup
1. Replace `GA_MEASUREMENT_ID` in `index.html` with your GA4 Measurement ID
2. Uncomment the Google Analytics script tags

### Payment Integration
- Update Stripe/PayPal API keys in the premium modal component
- Configure webhook endpoints for payment processing

## Project Structure

```
daily-puzzle-post/
├── public/
│   └── favicon.ico
├── src/
│   ├── components/
│   │   └── PremiumModal.jsx
│   ├── gameData.js          # Word database and game logic
│   ├── analytics.js         # Analytics tracking utility
│   ├── App.jsx             # Main application component
│   ├── App.css             # Newspaper-style CSS
│   └── main.jsx            # React entry point
├── index.html              # HTML template with meta tags
├── package.json
└── README.md
```

## Contributing

This project follows a structured development approach with clear commit history for each major feature addition. When contributing:

1. Create feature branches for new functionality
2. Maintain the newspaper aesthetic design principles
3. Ensure mobile responsiveness
4. Add appropriate analytics tracking for new features
5. Update documentation for any new configuration requirements

## License

MIT License - see LICENSE file for details

## Contact

For questions about this project or collaboration opportunities, please reach out through GitHub issues.

---

*Built with ❤️ for puzzle enthusiasts who appreciate classic newspaper games*

