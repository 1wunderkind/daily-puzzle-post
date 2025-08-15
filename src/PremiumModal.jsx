import { useState, useEffect } from 'react'
import './App.css'

function PremiumModal({ isOpen, onClose, onUpgrade }) {
  const [isProcessing, setIsProcessing] = useState(false)

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden' // Prevent background scrolling
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const handleUpgrade = async (method) => {
    setIsProcessing(true)
    
    // Track premium button click for analytics
    if (window.gtag) {
      window.gtag('event', 'premium_button_click', {
        event_category: 'monetization',
        event_label: method,
        value: 4.99
      })
    }

    // Simulate payment processing (replace with actual Stripe/PayPal integration)
    setTimeout(() => {
      onUpgrade()
      setIsProcessing(false)
      onClose()
    }, 2000)
  }

  if (!isOpen) return null

  return (
    <div className="premium-modal-overlay" onClick={onClose}>
      <div className="premium-modal" onClick={(e) => e.stopPropagation()}>
        <div className="premium-modal-header">
          <h2>Go Premium - Remove Ads Forever</h2>
          <button className="modal-close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="premium-modal-content">
          <div className="premium-price">
            <span className="price-amount">$4.99</span>
            <span className="price-period">One-time payment</span>
          </div>

          <div className="premium-benefits">
            <h3>Premium Benefits Include:</h3>
            <ul>
              <li>
                <span className="benefit-icon">🚫</span>
                <strong>No advertisements ever</strong> - Clean, distraction-free gameplay
              </li>
              <li>
                <span className="benefit-icon">🎯</span>
                <strong>Bonus daily challenges</strong> - Exclusive puzzles updated daily
              </li>
              <li>
                <span className="benefit-icon">⭐</span>
                <strong>Priority support</strong> - Direct access to our support team
              </li>
              <li>
                <span className="benefit-icon">🏆</span>
                <strong>Premium badge</strong> - Show your support for quality games
              </li>
            </ul>
          </div>

          <div className="premium-testimonial">
            <p>"Best $5 I've spent on mobile games. Clean interface, no ads, perfect for daily brain training!"</p>
            <span>- Sarah M., Premium Player</span>
          </div>

          <div className="payment-buttons">
            <button 
              className="payment-button stripe-button"
              onClick={() => handleUpgrade('stripe')}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Pay with Card'}
              <span className="payment-logo">💳</span>
            </button>
            
            <button 
              className="payment-button paypal-button"
              onClick={() => handleUpgrade('paypal')}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Pay with PayPal'}
              <span className="payment-logo">🅿️</span>
            </button>
          </div>

          <div className="premium-guarantee">
            <p>✅ 30-day money-back guarantee</p>
            <p>🔒 Secure payment processing</p>
            <p>📱 Works on all your devices</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PremiumModal

