from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import json
import os
import hashlib
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

premium_api = Blueprint('premium_api', __name__)

# Premium data storage (in production, use a proper database)
PREMIUM_DATA_FILE = '/tmp/premium_users.json'
STRIPE_WEBHOOK_SECRET = 'whsec_XXXXXXXXXX'  # Replace with actual webhook secret

def load_premium_data():
    """Load premium users data from file"""
    try:
        if os.path.exists(PREMIUM_DATA_FILE):
            with open(PREMIUM_DATA_FILE, 'r') as f:
                return json.load(f)
    except Exception as e:
        print(f"Error loading premium data: {e}")
    return {}

def save_premium_data(data):
    """Save premium users data to file"""
    try:
        with open(PREMIUM_DATA_FILE, 'w') as f:
            json.dump(data, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving premium data: {e}")
        return False

def generate_access_token(email):
    """Generate secure access token for magic link"""
    timestamp = str(int(datetime.now().timestamp()))
    random_part = secrets.token_urlsafe(32)
    combined = f"{email}:{timestamp}:{random_part}"
    return hashlib.sha256(combined.encode()).hexdigest()

def send_magic_link_email(email, access_token):
    """Send magic link email to user"""
    try:
        # Email configuration (replace with actual SMTP settings)
        smtp_server = "smtp.gmail.com"
        smtp_port = 587
        smtp_username = "noreply@dailypuzzlepost.com"  # Replace with actual email
        smtp_password = "your_app_password"  # Replace with actual password
        
        # Create magic link
        magic_link = f"https://dailypuzzlepost.com/premium-access?email={email}&token={access_token}"
        
        # Email content
        subject = "Your Daily Puzzle Post Premium Access"
        
        html_content = f"""
        <html>
        <body style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="border: 2px solid #0A0A0A; background-color: #FDFBF7; padding: 20px;">
                <h1 style="color: #0A0A0A; text-align: center; border-bottom: 2px solid #0A0A0A; padding-bottom: 10px;">
                    DAILY PUZZLE POST
                </h1>
                
                <h2 style="color: #1B4332;">Welcome to Premium!</h2>
                
                <p>Thank you for upgrading to Daily Puzzle Post Premium. Your payment has been processed successfully.</p>
                
                <div style="background-color: #E5E5E5; padding: 15px; margin: 20px 0; border: 1px solid #0A0A0A;">
                    <h3 style="margin-top: 0;">Your Premium Benefits:</h3>
                    <ul>
                        <li>🚫 <strong>No advertisements</strong> - Clean, distraction-free gameplay</li>
                        <li>📚 <strong>30-day puzzle archive</strong> - Access to all previous puzzles</li>
                        <li>🎯 <strong>Bonus daily challenges</strong> - Exclusive content</li>
                        <li>⭐ <strong>Priority support</strong> - Direct access to our team</li>
                    </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{magic_link}" 
                       style="background-color: #0A0A0A; color: #FDFBF7; padding: 15px 30px; 
                              text-decoration: none; font-weight: bold; border: none; 
                              display: inline-block; font-size: 16px;">
                        🔗 ACTIVATE PREMIUM ACCESS
                    </a>
                </div>
                
                <p><strong>Important:</strong> This link will activate premium features on the device you click it from. 
                   Bookmark this email to access premium features on other devices.</p>
                
                <hr style="border: 1px solid #CCCCCC; margin: 20px 0;">
                
                <p style="font-size: 12px; color: #333333;">
                    If you have any questions, reply to this email or contact us at support@dailypuzzlepost.com
                </p>
                
                <p style="font-size: 12px; color: #333333;">
                    This link expires in 30 days. If you need a new link, visit our website and use the "Restore Premium" option.
                </p>
            </div>
        </body>
        </html>
        """
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = smtp_username
        msg['To'] = email
        
        # Add HTML content
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)
        
        # Send email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.send_message(msg)
        
        return True
        
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

@premium_api.route('/api/premium/webhook', methods=['POST'])
def stripe_webhook():
    """Handle Stripe webhook events for Lindy.ai automation"""
    try:
        payload = request.get_data()
        sig_header = request.headers.get('Stripe-Signature')
        
        # Verify webhook signature (simplified for demo)
        # In production, use proper Stripe webhook verification
        
        event = json.loads(payload)
        
        # Handle successful payment
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            email = session['customer_details']['email']
            
            # Generate access token
            access_token = generate_access_token(email)
            
            # Store premium user data
            premium_data = load_premium_data()
            premium_data[email] = {
                'access_token': access_token,
                'created_at': datetime.now().isoformat(),
                'expires_at': (datetime.now() + timedelta(days=30)).isoformat(),
                'stripe_session_id': session['id'],
                'status': 'active'
            }
            
            if save_premium_data(premium_data):
                # Send magic link email
                if send_magic_link_email(email, access_token):
                    # Notify Lindy.ai of successful subscription
                    lindy_notification = {
                        'event': 'premium_subscription_created',
                        'email': email,
                        'timestamp': datetime.now().isoformat(),
                        'access_token': access_token
                    }
                    
                    # Log for Lindy.ai monitoring
                    print(f"LINDY_EVENT: {json.dumps(lindy_notification)}")
                    
                    return jsonify({'status': 'success'}), 200
                else:
                    return jsonify({'error': 'Failed to send email'}), 500
            else:
                return jsonify({'error': 'Failed to save user data'}), 500
        
        # Handle subscription cancellation
        elif event['type'] == 'customer.subscription.deleted':
            subscription = event['data']['object']
            # Handle cancellation logic here
            
            return jsonify({'status': 'success'}), 200
        
        return jsonify({'status': 'ignored'}), 200
        
    except Exception as e:
        print(f"Webhook error: {e}")
        return jsonify({'error': str(e)}), 400

@premium_api.route('/api/premium/verify', methods=['POST'])
def verify_premium_access():
    """Verify premium access token"""
    try:
        data = request.get_json()
        email = data.get('email')
        token = data.get('token')
        
        if not email or not token:
            return jsonify({'success': False, 'error': 'Missing email or token'}), 400
        
        premium_data = load_premium_data()
        user_data = premium_data.get(email)
        
        if not user_data:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        if user_data['access_token'] != token:
            return jsonify({'success': False, 'error': 'Invalid token'}), 401
        
        # Check if access has expired
        expires_at = datetime.fromisoformat(user_data['expires_at'])
        if datetime.now() > expires_at:
            return jsonify({'success': False, 'error': 'Access expired'}), 401
        
        return jsonify({
            'success': True,
            'expires': int(expires_at.timestamp() * 1000),
            'status': user_data['status']
        }), 200
        
    except Exception as e:
        print(f"Verification error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@premium_api.route('/api/premium/status/<email>', methods=['GET'])
def get_premium_status(email):
    """Get premium status for Lindy.ai monitoring"""
    try:
        premium_data = load_premium_data()
        user_data = premium_data.get(email)
        
        if not user_data:
            return jsonify({'premium': False, 'status': 'not_found'}), 404
        
        expires_at = datetime.fromisoformat(user_data['expires_at'])
        is_active = datetime.now() <= expires_at
        
        return jsonify({
            'premium': is_active,
            'status': user_data['status'],
            'expires_at': user_data['expires_at'],
            'created_at': user_data['created_at']
        }), 200
        
    except Exception as e:
        print(f"Status check error: {e}")
        return jsonify({'error': str(e)}), 500

@premium_api.route('/api/premium/users', methods=['GET'])
def list_premium_users():
    """List all premium users for Lindy.ai management"""
    try:
        premium_data = load_premium_data()
        
        # Filter out sensitive data
        safe_data = {}
        for email, data in premium_data.items():
            safe_data[email] = {
                'status': data['status'],
                'created_at': data['created_at'],
                'expires_at': data['expires_at'],
                'is_active': datetime.now() <= datetime.fromisoformat(data['expires_at'])
            }
        
        return jsonify({
            'users': safe_data,
            'total_count': len(safe_data),
            'active_count': sum(1 for user in safe_data.values() if user['is_active'])
        }), 200
        
    except Exception as e:
        print(f"List users error: {e}")
        return jsonify({'error': str(e)}), 500

@premium_api.route('/api/premium/extend', methods=['POST'])
def extend_premium_access():
    """Extend premium access for Lindy.ai automation"""
    try:
        data = request.get_json()
        email = data.get('email')
        days = data.get('days', 30)
        
        if not email:
            return jsonify({'error': 'Missing email'}), 400
        
        premium_data = load_premium_data()
        
        if email in premium_data:
            # Extend existing access
            current_expires = datetime.fromisoformat(premium_data[email]['expires_at'])
            new_expires = max(current_expires, datetime.now()) + timedelta(days=days)
            premium_data[email]['expires_at'] = new_expires.isoformat()
            premium_data[email]['status'] = 'active'
        else:
            # Create new premium access
            access_token = generate_access_token(email)
            premium_data[email] = {
                'access_token': access_token,
                'created_at': datetime.now().isoformat(),
                'expires_at': (datetime.now() + timedelta(days=days)).isoformat(),
                'status': 'active'
            }
        
        if save_premium_data(premium_data):
            return jsonify({
                'success': True,
                'expires_at': premium_data[email]['expires_at']
            }), 200
        else:
            return jsonify({'error': 'Failed to save data'}), 500
        
    except Exception as e:
        print(f"Extend access error: {e}")
        return jsonify({'error': str(e)}), 500

@premium_api.route('/api/premium/health', methods=['GET'])
def premium_health():
    """Health check for premium system"""
    try:
        premium_data = load_premium_data()
        
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'total_users': len(premium_data),
            'system': 'premium_management'
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

