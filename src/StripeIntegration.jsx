import React, { useState } from 'react';

// Simple Stripe integration for premium subscriptions
const StripeIntegration = ({ 
  email, 
  onPaymentSuccess, 
  onPaymentError, 
  isLoading, 
  setIsLoading 
}) => {

  // Stripe configuration
  const STRIPE_PUBLISHABLE_KEY = 'pk_test_XXXXXXXXXX'; // Replace with actual key
  const PREMIUM_PRICE_ID = 'price_XXXXXXXXXX'; // Replace with actual price ID
  const SUCCESS_URL = window.location.origin + '/premium-success';
  const CANCEL_URL = window.location.origin + '/premium-cancel';

  const handleStripeCheckout = async () => {
    if (!email || !email.includes('@')) {
      onPaymentError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      // Track premium attempt
      if (window.gtag) {
        window.gtag('event', 'premium_checkout_start', {
          event_category: 'monetization',
          event_label: 'stripe',
          value: 4.99
        });
      }

      // Create Stripe checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          priceId: PREMIUM_PRICE_ID,
          successUrl: SUCCESS_URL,
          cancelUrl: CANCEL_URL,
          metadata: {
            product: 'daily_puzzle_post_premium',
            version: '1.0'
          }
        }),
      });

      const session = await response.json();

      if (session.error) {
        throw new Error(session.error);
      }

      // Redirect to Stripe Checkout
      if (window.Stripe) {
        const stripe = window.Stripe(STRIPE_PUBLISHABLE_KEY);
        const { error } = await stripe.redirectToCheckout({
          sessionId: session.id,
        });

        if (error) {
          throw new Error(error.message);
        }
      } else {
        // Fallback: direct redirect to Stripe
        window.location.href = session.url;
      }

      // Call success callback
      onPaymentSuccess();

    } catch (error) {
      console.error('Stripe checkout error:', error);
      onPaymentError(error.message || 'Payment processing failed. Please try again.');
      
      // Track error
      if (window.gtag) {
        window.gtag('event', 'premium_checkout_error', {
          event_category: 'monetization',
          event_label: 'stripe_error',
          error_message: error.message
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="stripe-integration">
      <div className="premium-form">
        <button
          onClick={handleStripeCheckout}
          disabled={isLoading || !email}
          className="stripe-checkout-btn"
        >
          {isLoading ? (
            <>
              <span className="loading-spinner"></span>
              Processing...
            </>
          ) : (
            <>
              <span className="payment-icon">💳</span>
              Pay $4.99 with Stripe
            </>
          )}
        </button>

        <div className="payment-security">
          <div className="security-badges">
            <span className="security-badge">🔒 SSL Secured</span>
            <span className="security-badge">💳 Stripe Protected</span>
            <span className="security-badge">↩️ 30-Day Refund</span>
          </div>
          <p className="security-text">
            Your payment is processed securely by Stripe. 
            We never store your card details.
          </p>
        </div>
      </div>
    </div>
  );
};

// Magic link access component
const MagicLinkAccess = ({ email, accessToken }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);

  const verifyAccess = async () => {
    setIsVerifying(true);
    
    try {
      const response = await fetch('/api/verify-premium-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          token: accessToken
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Set premium status in localStorage
        localStorage.setItem('premium_access', JSON.stringify({
          email: email,
          token: accessToken,
          expires: result.expires,
          verified: Date.now()
        }));

        // Set premium cookie for ad hiding
        document.cookie = `premium_user=true; max-age=${30 * 24 * 60 * 60}; path=/; secure; samesite=strict`;

        setVerificationStatus('success');
        
        // Track successful verification
        if (window.gtag) {
          window.gtag('event', 'premium_access_verified', {
            event_category: 'monetization',
            event_label: 'magic_link'
          });
        }

        // Reload page to apply premium features
        setTimeout(() => {
          window.location.reload();
        }, 2000);

      } else {
        setVerificationStatus('error');
      }

    } catch (error) {
      console.error('Access verification error:', error);
      setVerificationStatus('error');
    } finally {
      setIsVerifying(false);
    }
  };

  React.useEffect(() => {
    if (email && accessToken) {
      verifyAccess();
    }
  }, [email, accessToken]);

  if (verificationStatus === 'success') {
    return (
      <div className="access-success">
        <h2>✅ Premium Access Activated!</h2>
        <p>Welcome to Daily Puzzle Post Premium. Enjoy your ad-free experience!</p>
      </div>
    );
  }

  if (verificationStatus === 'error') {
    return (
      <div className="access-error">
        <h2>❌ Access Verification Failed</h2>
        <p>Please check your email for a new access link or contact support.</p>
      </div>
    );
  }

  return (
    <div className="access-verifying">
      <h2>🔄 Verifying Premium Access...</h2>
      <p>Please wait while we activate your premium features.</p>
    </div>
  );
};

// Premium status checker
export const checkPremiumStatus = () => {
  try {
    // Check localStorage for premium access
    const premiumData = localStorage.getItem('premium_access');
    if (premiumData) {
      const data = JSON.parse(premiumData);
      const now = Date.now();
      
      // Check if access hasn't expired
      if (data.expires && now < data.expires) {
        return true;
      }
    }

    // Check cookie for premium status
    const cookies = document.cookie.split(';');
    const premiumCookie = cookies.find(cookie => 
      cookie.trim().startsWith('premium_user=')
    );
    
    return premiumCookie && premiumCookie.includes('true');
    
  } catch (error) {
    console.error('Error checking premium status:', error);
    return false;
  }
};

// Premium access utilities
export const setPremiumAccess = (email, token, expires) => {
  localStorage.setItem('premium_access', JSON.stringify({
    email,
    token,
    expires,
    verified: Date.now()
  }));

  document.cookie = `premium_user=true; max-age=${30 * 24 * 60 * 60}; path=/; secure; samesite=strict`;
};

export const removePremiumAccess = () => {
  localStorage.removeItem('premium_access');
  document.cookie = 'premium_user=; max-age=0; path=/';
};

export default StripeIntegration;
export { MagicLinkAccess };

