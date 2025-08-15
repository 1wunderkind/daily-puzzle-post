import { useState, useEffect } from 'react'
import './App.css'
import StripeIntegration from './StripeIntegration'
import PayPalIntegration from './PayPalIntegration'

function PremiumModal({ isOpen, onClose, onUpgrade }) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('stripe') // 'stripe' or 'paypal'

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

  const handleStripeSuccess = () => {
    onUpgrade()
    onClose()
  }

  const handleStripeError = (errorMessage) => {
    setError(errorMessage)
    setIsProcessing(false)
  }

  const handlePayPalSuccess = () => {
    onUpgrade()
    onClose()
  }

  const handlePayPalError = (errorMessage) => {
    setError(errorMessage)
    setIsProcessing(false)
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
            <span className="price-period">Monthly - Cancel Anytime</span>
          </div>

          <div className="premium-benefits">
            <h3>Premium Benefits Include:</h3>
            <ul>
              <li>
                <span className="benefit-icon">🚫</span>
                <strong>No advertisements ever</strong> - Clean, distraction-free gameplay
              </li>
              <li>
                <span className="benefit-icon">📚</span>
                <strong>30-day puzzle archive</strong> - Access to all previous puzzles
              </li>
              <li>
                <span className="benefit-icon">🎯</span>
                <strong>Bonus daily challenges</strong> - Exclusive puzzles updated daily
              </li>
              <li>
                <span className="benefit-icon">⭐</span>
                <strong>Priority support</strong> - Direct access to our support team
              </li>
            </ul>
          </div>

          {error && (
            <div className="error-message">
              <p>❌ {error}</p>
            </div>
          )}

          <div className="payment-section">
            <div className="email-input-section">
              <label htmlFor="premium-email">Email Address (for magic link access):</label>
              <input
                id="premium-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="email-input"
                required
              />
            </div>

            <div className="payment-method-selector">
              <h3>Choose Payment Method:</h3>
              <div className="payment-method-tabs">
                <button
                  className={`payment-tab ${paymentMethod === 'stripe' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('stripe')}
                >
                  💳 Credit Card
                </button>
                <button
                  className={`payment-tab ${paymentMethod === 'paypal' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('paypal')}
                >
                  🅿️ PayPal
                </button>
              </div>
            </div>

            {paymentMethod === 'stripe' && (
              <div className="stripe-payment">
                <StripeIntegration 
                  email={email}
                  onPaymentSuccess={handleStripeSuccess}
                  onPaymentError={handleStripeError}
                  isLoading={isProcessing}
                  setIsLoading={setIsProcessing}
                />
              </div>
            )}

            {paymentMethod === 'paypal' && (
              <div className="paypal-payment">
                <PayPalIntegration 
                  email={email}
                  onPaymentSuccess={handlePayPalSuccess}
                  onPaymentError={handlePayPalError}
                  isLoading={isProcessing}
                  setIsLoading={setIsProcessing}
                />
              </div>
            )}
          </div>

          <div className="premium-guarantee">
            <p>✅ 30-day money-back guarantee</p>
            <p>🔒 Secure payment processing via Stripe & PayPal</p>
            <p>📱 Works on all your devices</p>
            <p>📧 Magic link access - no passwords needed</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PremiumModal

