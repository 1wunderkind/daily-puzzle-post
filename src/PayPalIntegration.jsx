import React, { useState, useEffect } from 'react';

/**
 * PayPal Integration Component for Daily Puzzle Post
 * Handles PayPal subscription payments with magic link authentication
 * Maintains same UX as Stripe integration
 */
const PayPalIntegration = ({ 
  email, 
  onPaymentSuccess, 
  onPaymentError, 
  isLoading, 
  setIsLoading 
}) => {
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [paypalError, setPaypalError] = useState(null);

  // PayPal configuration
  const PAYPAL_CLIENT_ID = process.env.REACT_APP_PAYPAL_CLIENT_ID || 'sb-test-client-id'; // Sandbox for testing
  const SUBSCRIPTION_PLAN_ID = process.env.REACT_APP_PAYPAL_PLAN_ID || 'P-test-plan-id';
  const PAYPAL_ENVIRONMENT = process.env.NODE_ENV === 'production' ? 'production' : 'sandbox';

  useEffect(() => {
    // Load PayPal SDK
    if (!window.paypal && !document.querySelector('#paypal-sdk')) {
      const script = document.createElement('script');
      script.id = 'paypal-sdk';
      script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&vault=true&intent=subscription&components=buttons`;
      script.async = true;
      
      script.onload = () => {
        setPaypalLoaded(true);
        initializePayPalButtons();
      };
      
      script.onerror = () => {
        setPaypalError('Failed to load PayPal SDK');
      };
      
      document.head.appendChild(script);
    } else if (window.paypal) {
      setPaypalLoaded(true);
      initializePayPalButtons();
    }

    return () => {
      // Cleanup PayPal buttons on unmount
      const paypalContainer = document.getElementById('paypal-button-container');
      if (paypalContainer) {
        paypalContainer.innerHTML = '';
      }
    };
  }, [email]);

  const initializePayPalButtons = () => {
    if (!window.paypal || !email) return;

    // Clear existing buttons
    const container = document.getElementById('paypal-button-container');
    if (container) {
      container.innerHTML = '';
    }

    window.paypal.Buttons({
      style: {
        layout: 'horizontal',
        color: 'blue',
        shape: 'rect',
        label: 'subscribe',
        height: 48,
        tagline: false
      },

      createSubscription: function(data, actions) {
        setIsLoading(true);
        
        return actions.subscription.create({
          'plan_id': SUBSCRIPTION_PLAN_ID,
          'subscriber': {
            'email_address': email
          },
          'application_context': {
            'brand_name': 'Daily Puzzle Post',
            'locale': 'en-US',
            'shipping_preference': 'NO_SHIPPING',
            'user_action': 'SUBSCRIBE_NOW',
            'payment_method': {
              'payer_selected': 'PAYPAL',
              'payee_preferred': 'IMMEDIATE_PAYMENT_REQUIRED'
            },
            'return_url': `${window.location.origin}/premium/success`,
            'cancel_url': `${window.location.origin}/premium/cancel`
          }
        });
      },

      onApprove: async function(data, actions) {
        try {
          // Call backend to process subscription and generate magic link
          const response = await fetch('/api/premium/paypal/subscription', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              subscriptionID: data.subscriptionID,
              email: email,
              payment_method: 'paypal'
            }),
          });

          const result = await response.json();

          if (result.success) {
            // Track successful PayPal subscription
            if (window.gtag) {
              window.gtag('event', 'purchase', {
                transaction_id: data.subscriptionID,
                value: 4.99,
                currency: 'USD',
                payment_method: 'paypal'
              });
            }

            onPaymentSuccess({
              subscriptionId: data.subscriptionID,
              email: email,
              paymentMethod: 'paypal',
              magicLink: result.magic_link,
              message: 'PayPal subscription successful! Check your email for access link.'
            });
          } else {
            throw new Error(result.error || 'PayPal subscription failed');
          }
        } catch (error) {
          console.error('PayPal subscription error:', error);
          onPaymentError(error.message || 'PayPal payment failed');
        } finally {
          setIsLoading(false);
        }
      },

      onError: function(err) {
        console.error('PayPal error:', err);
        setPaypalError('PayPal payment failed. Please try again.');
        onPaymentError('PayPal payment failed. Please try again.');
        setIsLoading(false);
      },

      onCancel: function(data) {
        console.log('PayPal payment cancelled:', data);
        setIsLoading(false);
        // Don't show error for cancellation, just reset state
      }
    }).render('#paypal-button-container');
  };

  if (paypalError) {
    return (
      <div className="paypal-error">
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>{paypalError}</span>
        </div>
        <button 
          className="retry-button"
          onClick={() => {
            setPaypalError(null);
            setPaypalLoaded(false);
            // Reload PayPal SDK
            const existingScript = document.getElementById('paypal-sdk');
            if (existingScript) {
              existingScript.remove();
            }
            // Re-trigger useEffect
            window.location.reload();
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="paypal-integration">
      <div className="payment-option-header">
        <div className="paypal-logo">
          <svg width="100" height="26" viewBox="0 0 100 26" fill="none">
            <path d="M12.017 0L8.835 19.777H4.909L8.091 0H12.017Z" fill="#253B80"/>
            <path d="M19.777 0C21.890 0 23.456 0.481 24.475 1.443C25.494 2.405 25.494 3.848 24.962 5.772L23.456 12.532C22.924 14.456 21.890 15.899 20.354 16.861C18.818 17.823 16.780 18.304 14.241 18.304H11.220C10.688 18.304 10.259 18.671 10.156 19.203L9.624 22.224C9.521 22.756 9.092 23.123 8.560 23.123H5.539C4.975 23.123 4.598 22.591 4.701 22.059L7.883 2.282C7.986 1.750 8.415 1.383 8.947 1.383H19.777V0Z" fill="#253B80"/>
            <path d="M35.443 0C37.556 0 39.122 0.481 40.141 1.443C41.160 2.405 41.160 3.848 40.628 5.772L39.122 12.532C38.590 14.456 37.556 15.899 36.020 16.861C34.484 17.823 32.446 18.304 29.907 18.304H26.886C26.354 18.304 25.925 18.671 25.822 19.203L25.290 22.224C25.187 22.756 24.758 23.123 24.226 23.123H21.205C20.641 23.123 20.264 22.591 20.367 22.059L23.549 2.282C23.652 1.750 24.081 1.383 24.613 1.383H35.443V0Z" fill="#179BD7"/>
          </svg>
        </div>
        <div className="payment-description">
          <p>Pay securely with your PayPal account</p>
          <p className="payment-details">$4.99/month • Cancel anytime</p>
        </div>
      </div>

      <div 
        id="paypal-button-container" 
        className={`paypal-button-container ${isLoading ? 'loading' : ''}`}
      >
        {!paypalLoaded && (
          <div className="paypal-loading">
            <div className="loading-spinner"></div>
            <span>Loading PayPal...</span>
          </div>
        )}
      </div>

      <div className="payment-security">
        <div className="security-badges">
          <span className="security-badge">🔒 Secure Payment</span>
          <span className="security-badge">✅ No Registration Required</span>
          <span className="security-badge">📧 Magic Link Access</span>
        </div>
        <p className="security-note">
          Your payment is processed securely by PayPal. 
          We'll send you a magic link for instant premium access.
        </p>
      </div>

      <style jsx>{`
        .paypal-integration {
          width: 100%;
          max-width: 400px;
          margin: 0 auto;
        }

        .payment-option-header {
          display: flex;
          align-items: center;
          margin-bottom: 20px;
          padding: 15px;
          background-color: #fdf6e3;
          border: 1px solid #e5e5e5;
          border-radius: 4px;
        }

        .paypal-logo {
          margin-right: 15px;
        }

        .payment-description p {
          margin: 0;
          font-family: 'Times New Roman', serif;
          color: #333;
        }

        .payment-description p:first-child {
          font-weight: bold;
          font-size: 16px;
        }

        .payment-details {
          font-size: 14px;
          color: #666;
          margin-top: 4px;
        }

        .paypal-button-container {
          margin: 20px 0;
          min-height: 48px;
        }

        .paypal-button-container.loading {
          opacity: 0.7;
          pointer-events: none;
        }

        .paypal-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 15px;
          background-color: #f5f5f5;
          border-radius: 4px;
          font-family: 'Times New Roman', serif;
          color: #666;
        }

        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #e5e5e5;
          border-top: 2px solid #0070ba;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 10px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .payment-security {
          margin-top: 20px;
          padding: 15px;
          background-color: #f0f9ff;
          border-radius: 4px;
          border: 1px solid #e0f2fe;
        }

        .security-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 10px;
        }

        .security-badge {
          font-size: 12px;
          padding: 4px 8px;
          background-color: white;
          border: 1px solid #22543d;
          border-radius: 12px;
          color: #22543d;
          font-family: 'Times New Roman', serif;
        }

        .security-note {
          font-size: 12px;
          color: #666;
          margin: 0;
          line-height: 1.4;
          font-family: 'Times New Roman', serif;
        }

        .paypal-error {
          padding: 20px;
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 4px;
          text-align: center;
        }

        .error-message {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 15px;
          font-family: 'Times New Roman', serif;
          color: #dc2626;
        }

        .error-icon {
          margin-right: 8px;
          font-size: 18px;
        }

        .retry-button {
          background-color: #1e3a8a;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-family: 'Times New Roman', serif;
          font-size: 14px;
          transition: background-color 0.2s;
        }

        .retry-button:hover {
          background-color: #1e40af;
        }

        /* Mobile responsiveness */
        @media (max-width: 480px) {
          .payment-option-header {
            flex-direction: column;
            text-align: center;
          }

          .paypal-logo {
            margin-right: 0;
            margin-bottom: 10px;
          }

          .security-badges {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default PayPalIntegration;

