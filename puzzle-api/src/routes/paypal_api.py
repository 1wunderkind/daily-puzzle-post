"""
PayPal API Routes for Daily Puzzle Post Premium Subscriptions
Handles PayPal subscription creation, webhooks, and magic link generation
"""

from flask import Blueprint, request, jsonify
import json
import os
import requests
import hashlib
import hmac
from datetime import datetime, timedelta
import uuid
import logging

# Create PayPal API blueprint
paypal_api = Blueprint('paypal_api', __name__)

# PayPal configuration
PAYPAL_CLIENT_ID = os.getenv('PAYPAL_CLIENT_ID', 'sb-test-client-id')
PAYPAL_CLIENT_SECRET = os.getenv('PAYPAL_CLIENT_SECRET', 'sb-test-secret')
PAYPAL_WEBHOOK_ID = os.getenv('PAYPAL_WEBHOOK_ID', 'test-webhook-id')
PAYPAL_ENVIRONMENT = os.getenv('PAYPAL_ENVIRONMENT', 'sandbox')  # 'sandbox' or 'live'

# PayPal API URLs
if PAYPAL_ENVIRONMENT == 'live':
    PAYPAL_API_BASE = 'https://api.paypal.com'
    PAYPAL_WEB_BASE = 'https://www.paypal.com'
else:
    PAYPAL_API_BASE = 'https://api.sandbox.paypal.com'
    PAYPAL_WEB_BASE = 'https://www.sandbox.paypal.com'

# Directories for data storage
PREMIUM_USERS_DIR = '/home/ubuntu/daily-puzzle-post-github/premium/users'
PAYPAL_LOGS_DIR = '/home/ubuntu/daily-puzzle-post-github/premium/paypal_logs'
MAGIC_LINKS_DIR = '/home/ubuntu/daily-puzzle-post-github/premium/magic_links'

# Ensure directories exist
for directory in [PREMIUM_USERS_DIR, PAYPAL_LOGS_DIR, MAGIC_LINKS_DIR]:
    os.makedirs(directory, exist_ok=True)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PayPalAPI:
    """PayPal API client for handling subscriptions and payments"""
    
    def __init__(self):
        self.access_token = None
        self.token_expires_at = None
    
    def get_access_token(self):
        """Get or refresh PayPal access token"""
        if self.access_token and self.token_expires_at and datetime.now() < self.token_expires_at:
            return self.access_token
        
        try:
            url = f"{PAYPAL_API_BASE}/v1/oauth2/token"
            headers = {
                'Accept': 'application/json',
                'Accept-Language': 'en_US',
            }
            data = 'grant_type=client_credentials'
            
            response = requests.post(
                url,
                headers=headers,
                data=data,
                auth=(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET)
            )
            
            if response.status_code == 200:
                token_data = response.json()
                self.access_token = token_data['access_token']
                expires_in = token_data.get('expires_in', 3600)
                self.token_expires_at = datetime.now() + timedelta(seconds=expires_in - 60)
                return self.access_token
            else:
                logger.error(f"Failed to get PayPal access token: {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Error getting PayPal access token: {str(e)}")
            return None
    
    def get_subscription_details(self, subscription_id):
        """Get subscription details from PayPal"""
        access_token = self.get_access_token()
        if not access_token:
            return None
        
        try:
            url = f"{PAYPAL_API_BASE}/v1/billing/subscriptions/{subscription_id}"
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {access_token}',
            }
            
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Failed to get subscription details: {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Error getting subscription details: {str(e)}")
            return None
    
    def cancel_subscription(self, subscription_id, reason="User requested cancellation"):
        """Cancel a PayPal subscription"""
        access_token = self.get_access_token()
        if not access_token:
            return False
        
        try:
            url = f"{PAYPAL_API_BASE}/v1/billing/subscriptions/{subscription_id}/cancel"
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {access_token}',
            }
            data = {
                'reason': reason
            }
            
            response = requests.post(url, headers=headers, json=data)
            
            if response.status_code == 204:
                return True
            else:
                logger.error(f"Failed to cancel subscription: {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Error canceling subscription: {str(e)}")
            return False

# Global PayPal API instance
paypal_client = PayPalAPI()

def generate_magic_link(email, subscription_id, payment_method='paypal'):
    """Generate magic link for premium access"""
    try:
        # Create unique token
        token_data = f"{email}:{subscription_id}:{datetime.now().isoformat()}"
        magic_token = hashlib.sha256(token_data.encode()).hexdigest()[:32]
        
        # Create magic link data
        link_data = {
            'token': magic_token,
            'email': email,
            'subscription_id': subscription_id,
            'payment_method': payment_method,
            'created_at': datetime.now().isoformat(),
            'expires_at': (datetime.now() + timedelta(days=30)).isoformat(),
            'used': False,
            'premium_features': {
                'ad_free': True,
                'archive_access': True,
                'bonus_puzzles': True,
                'priority_support': True
            }
        }
        
        # Save magic link
        link_file = os.path.join(MAGIC_LINKS_DIR, f'{magic_token}.json')
        with open(link_file, 'w') as f:
            json.dump(link_data, f, indent=2)
        
        # Generate magic link URL
        magic_link = f"https://dailypuzzlepost.com/premium/activate/{magic_token}"
        
        return magic_link, magic_token
        
    except Exception as e:
        logger.error(f"Error generating magic link: {str(e)}")
        return None, None

def save_premium_user(email, subscription_id, payment_method='paypal'):
    """Save premium user data"""
    try:
        user_data = {
            'email': email,
            'subscription_id': subscription_id,
            'payment_method': payment_method,
            'status': 'active',
            'created_at': datetime.now().isoformat(),
            'last_updated': datetime.now().isoformat(),
            'premium_features': {
                'ad_free': True,
                'archive_access': True,
                'bonus_puzzles': True,
                'priority_support': True
            },
            'subscription_details': {
                'plan': 'monthly',
                'amount': 4.99,
                'currency': 'USD',
                'next_billing_date': (datetime.now() + timedelta(days=30)).isoformat()
            }
        }
        
        # Save user data
        user_file = os.path.join(PREMIUM_USERS_DIR, f'{email.replace("@", "_at_")}.json')
        with open(user_file, 'w') as f:
            json.dump(user_data, f, indent=2)
        
        return True
        
    except Exception as e:
        logger.error(f"Error saving premium user: {str(e)}")
        return False

def log_paypal_event(event_type, data):
    """Log PayPal events for analytics and debugging"""
    try:
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'event_type': event_type,
            'data': data
        }
        
        log_file = os.path.join(PAYPAL_LOGS_DIR, f"paypal_{datetime.now().strftime('%Y%m%d')}.jsonl")
        with open(log_file, 'a') as f:
            f.write(json.dumps(log_entry) + '\n')
            
    except Exception as e:
        logger.error(f"Error logging PayPal event: {str(e)}")

@paypal_api.route('/subscription', methods=['POST'])
def create_subscription():
    """Handle PayPal subscription creation and generate magic link"""
    try:
        data = request.get_json()
        subscription_id = data.get('subscriptionID')
        email = data.get('email')
        
        if not subscription_id or not email:
            return jsonify({
                'success': False,
                'error': 'Missing subscription ID or email'
            }), 400
        
        # Verify subscription with PayPal
        subscription_details = paypal_client.get_subscription_details(subscription_id)
        
        if not subscription_details:
            return jsonify({
                'success': False,
                'error': 'Failed to verify subscription with PayPal'
            }), 400
        
        # Check subscription status
        subscription_status = subscription_details.get('status')
        if subscription_status not in ['ACTIVE', 'APPROVED']:
            return jsonify({
                'success': False,
                'error': f'Subscription status is {subscription_status}'
            }), 400
        
        # Generate magic link
        magic_link, magic_token = generate_magic_link(email, subscription_id, 'paypal')
        
        if not magic_link:
            return jsonify({
                'success': False,
                'error': 'Failed to generate magic link'
            }), 500
        
        # Save premium user
        if not save_premium_user(email, subscription_id, 'paypal'):
            return jsonify({
                'success': False,
                'error': 'Failed to save user data'
            }), 500
        
        # Log successful subscription
        log_paypal_event('subscription_created', {
            'subscription_id': subscription_id,
            'email': email,
            'status': subscription_status,
            'magic_token': magic_token
        })
        
        # In production, send email with magic link here
        # For now, return the magic link directly
        
        return jsonify({
            'success': True,
            'subscription_id': subscription_id,
            'magic_link': magic_link,
            'message': 'Subscription created successfully'
        })
        
    except Exception as e:
        logger.error(f"Error creating subscription: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@paypal_api.route('/webhook', methods=['POST'])
def handle_webhook():
    """Handle PayPal webhooks for subscription events"""
    try:
        # Get webhook data
        webhook_data = request.get_json()
        headers = dict(request.headers)
        
        # Verify webhook signature (in production)
        # webhook_signature = headers.get('PAYPAL-TRANSMISSION-SIG')
        # if not verify_webhook_signature(webhook_data, webhook_signature):
        #     return jsonify({'error': 'Invalid webhook signature'}), 401
        
        event_type = webhook_data.get('event_type')
        resource = webhook_data.get('resource', {})
        
        # Log webhook event
        log_paypal_event('webhook_received', {
            'event_type': event_type,
            'resource_id': resource.get('id'),
            'status': resource.get('status')
        })
        
        # Handle different webhook events
        if event_type == 'BILLING.SUBSCRIPTION.ACTIVATED':
            handle_subscription_activated(resource)
        elif event_type == 'BILLING.SUBSCRIPTION.CANCELLED':
            handle_subscription_cancelled(resource)
        elif event_type == 'BILLING.SUBSCRIPTION.SUSPENDED':
            handle_subscription_suspended(resource)
        elif event_type == 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
            handle_payment_failed(resource)
        elif event_type == 'PAYMENT.SALE.COMPLETED':
            handle_payment_completed(resource)
        
        return jsonify({'status': 'success'}), 200
        
    except Exception as e:
        logger.error(f"Error handling webhook: {str(e)}")
        return jsonify({'error': 'Webhook processing failed'}), 500

def handle_subscription_activated(resource):
    """Handle subscription activation webhook"""
    try:
        subscription_id = resource.get('id')
        subscriber_email = resource.get('subscriber', {}).get('email_address')
        
        if subscription_id and subscriber_email:
            # Update user status to active
            user_file = os.path.join(PREMIUM_USERS_DIR, f'{subscriber_email.replace("@", "_at_")}.json')
            if os.path.exists(user_file):
                with open(user_file, 'r') as f:
                    user_data = json.load(f)
                
                user_data['status'] = 'active'
                user_data['last_updated'] = datetime.now().isoformat()
                
                with open(user_file, 'w') as f:
                    json.dump(user_data, f, indent=2)
        
        log_paypal_event('subscription_activated', {
            'subscription_id': subscription_id,
            'email': subscriber_email
        })
        
    except Exception as e:
        logger.error(f"Error handling subscription activation: {str(e)}")

def handle_subscription_cancelled(resource):
    """Handle subscription cancellation webhook"""
    try:
        subscription_id = resource.get('id')
        
        # Find and update user status
        for filename in os.listdir(PREMIUM_USERS_DIR):
            if filename.endswith('.json'):
                user_file = os.path.join(PREMIUM_USERS_DIR, filename)
                with open(user_file, 'r') as f:
                    user_data = json.load(f)
                
                if user_data.get('subscription_id') == subscription_id:
                    user_data['status'] = 'cancelled'
                    user_data['cancelled_at'] = datetime.now().isoformat()
                    user_data['last_updated'] = datetime.now().isoformat()
                    
                    with open(user_file, 'w') as f:
                        json.dump(user_data, f, indent=2)
                    break
        
        log_paypal_event('subscription_cancelled', {
            'subscription_id': subscription_id
        })
        
    except Exception as e:
        logger.error(f"Error handling subscription cancellation: {str(e)}")

def handle_subscription_suspended(resource):
    """Handle subscription suspension webhook"""
    try:
        subscription_id = resource.get('id')
        
        # Find and update user status
        for filename in os.listdir(PREMIUM_USERS_DIR):
            if filename.endswith('.json'):
                user_file = os.path.join(PREMIUM_USERS_DIR, filename)
                with open(user_file, 'r') as f:
                    user_data = json.load(f)
                
                if user_data.get('subscription_id') == subscription_id:
                    user_data['status'] = 'suspended'
                    user_data['suspended_at'] = datetime.now().isoformat()
                    user_data['last_updated'] = datetime.now().isoformat()
                    
                    with open(user_file, 'w') as f:
                        json.dump(user_data, f, indent=2)
                    break
        
        log_paypal_event('subscription_suspended', {
            'subscription_id': subscription_id
        })
        
    except Exception as e:
        logger.error(f"Error handling subscription suspension: {str(e)}")

def handle_payment_failed(resource):
    """Handle payment failure webhook"""
    try:
        subscription_id = resource.get('billing_agreement_id')
        
        log_paypal_event('payment_failed', {
            'subscription_id': subscription_id,
            'failure_reason': resource.get('reason_code')
        })
        
        # In production, send email notification about payment failure
        
    except Exception as e:
        logger.error(f"Error handling payment failure: {str(e)}")

def handle_payment_completed(resource):
    """Handle successful payment webhook"""
    try:
        subscription_id = resource.get('billing_agreement_id')
        amount = resource.get('amount', {}).get('total')
        
        log_paypal_event('payment_completed', {
            'subscription_id': subscription_id,
            'amount': amount,
            'transaction_id': resource.get('id')
        })
        
    except Exception as e:
        logger.error(f"Error handling payment completion: {str(e)}")

@paypal_api.route('/cancel/<subscription_id>', methods=['POST'])
def cancel_subscription(subscription_id):
    """Cancel a PayPal subscription"""
    try:
        data = request.get_json() or {}
        reason = data.get('reason', 'User requested cancellation')
        
        # Cancel subscription with PayPal
        success = paypal_client.cancel_subscription(subscription_id, reason)
        
        if success:
            # Update local user data
            for filename in os.listdir(PREMIUM_USERS_DIR):
                if filename.endswith('.json'):
                    user_file = os.path.join(PREMIUM_USERS_DIR, filename)
                    with open(user_file, 'r') as f:
                        user_data = json.load(f)
                    
                    if user_data.get('subscription_id') == subscription_id:
                        user_data['status'] = 'cancelled'
                        user_data['cancelled_at'] = datetime.now().isoformat()
                        user_data['last_updated'] = datetime.now().isoformat()
                        
                        with open(user_file, 'w') as f:
                            json.dump(user_data, f, indent=2)
                        break
            
            log_paypal_event('subscription_cancelled_api', {
                'subscription_id': subscription_id,
                'reason': reason
            })
            
            return jsonify({
                'success': True,
                'message': 'Subscription cancelled successfully'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to cancel subscription'
            }), 400
            
    except Exception as e:
        logger.error(f"Error cancelling subscription: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@paypal_api.route('/status/<subscription_id>', methods=['GET'])
def get_subscription_status(subscription_id):
    """Get PayPal subscription status"""
    try:
        subscription_details = paypal_client.get_subscription_details(subscription_id)
        
        if subscription_details:
            return jsonify({
                'success': True,
                'subscription_id': subscription_id,
                'status': subscription_details.get('status'),
                'next_billing_time': subscription_details.get('billing_info', {}).get('next_billing_time'),
                'plan_id': subscription_details.get('plan_id')
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Subscription not found'
            }), 404
            
    except Exception as e:
        logger.error(f"Error getting subscription status: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@paypal_api.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for PayPal integration"""
    try:
        # Test PayPal API connection
        access_token = paypal_client.get_access_token()
        
        return jsonify({
            'status': 'healthy',
            'paypal_connection': 'connected' if access_token else 'failed',
            'environment': PAYPAL_ENVIRONMENT,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

# Export the blueprint
__all__ = ['paypal_api']

