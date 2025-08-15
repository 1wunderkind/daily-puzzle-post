from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import json
import logging
from src.models.email import db, Subscriber, EmailCampaign, EmailLog, EmailTemplate
from src.services.email_service import email_service

# Create webhooks blueprint
webhooks = Blueprint('webhooks', __name__)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@webhooks.route('/user_signup', methods=['POST'])
def handle_user_signup():
    """
    Webhook for new user signups
    Automatically triggers welcome email and sets up automation sequences
    
    Lindy.ai Integration: Call this webhook when a new user signs up
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or 'email' not in data:
            return jsonify({
                'success': False,
                'error': 'Email is required'
            }), 400
        
        email = data['email']
        name = data.get('name', '')
        source = data.get('source', 'api')
        premium_status = data.get('premium_status', False)
        
        # Check if subscriber already exists
        existing_subscriber = Subscriber.query.filter_by(email=email).first()
        
        if existing_subscriber:
            logger.info(f"Subscriber {email} already exists, updating info")
            
            # Update existing subscriber
            if name and not existing_subscriber.name:
                existing_subscriber.name = name
            existing_subscriber.last_activity = datetime.utcnow()
            
            subscriber = existing_subscriber
        else:
            # Create new subscriber
            subscriber = Subscriber(
                email=email,
                name=name,
                status='active',
                premium_status=premium_status,
                source=source,
                tags=json.dumps(['new_user', source]),
                created_at=datetime.utcnow(),
                last_activity=datetime.utcnow()
            )
            
            db.session.add(subscriber)
            logger.info(f"Created new subscriber: {email}")
        
        db.session.commit()
        
        # Send welcome email
        welcome_result = email_service.send_welcome_email(
            to_email=email,
            name=name
        )
        
        # Schedule follow-up emails (day 3, 7, 14)
        follow_up_campaigns = []
        
        # Day 3: Tips email
        tips_campaign = EmailCampaign(
            name=f"Tips Email - {email}",
            subject="3 Pro Tips for Hangman Success",
            template_name="tips_email.html",
            status='scheduled',
            scheduled_at=datetime.utcnow() + timedelta(days=3),
            target_premium=False,
            created_by_ai=True,
            automation_trigger='user_signup_day3'
        )
        follow_up_campaigns.append(tips_campaign)
        
        # Day 7: Premium upgrade
        premium_campaign = EmailCampaign(
            name=f"Premium Upgrade - {email}",
            subject="Ready to Go Premium?",
            template_name="premium_upgrade.html",
            status='scheduled',
            scheduled_at=datetime.utcnow() + timedelta(days=7),
            target_premium=False,
            created_by_ai=True,
            automation_trigger='user_signup_day7'
        )
        follow_up_campaigns.append(premium_campaign)
        
        # Add campaigns to database
        for campaign in follow_up_campaigns:
            db.session.add(campaign)
        
        db.session.commit()
        
        # Log the webhook event
        logger.info(f"User signup webhook processed: {email}, welcome_sent: {welcome_result['success']}")
        
        return jsonify({
            'success': True,
            'message': 'User signup processed successfully',
            'data': {
                'subscriber_id': subscriber.id,
                'email': email,
                'welcome_email_sent': welcome_result['success'],
                'follow_up_campaigns_scheduled': len(follow_up_campaigns),
                'automation_sequence': 'welcome_series_activated'
            }
        })
        
    except Exception as e:
        logger.error(f"User signup webhook error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Webhook processing failed: {str(e)}'
        }), 500

@webhooks.route('/game_completed', methods=['POST'])
def handle_game_completed():
    """
    Webhook for game completion events
    Triggers milestone-based emails and premium upgrade sequences
    
    Lindy.ai Integration: Call this when a user completes a game
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or 'user_email' not in data:
            return jsonify({
                'success': False,
                'error': 'User email is required'
            }), 400
        
        email = data['user_email']
        word = data.get('word', '')
        category = data.get('category', '')
        success = data.get('success', False)
        games_played = data.get('games_played', 0)
        
        # Get subscriber
        subscriber = Subscriber.query.filter_by(email=email).first()
        if not subscriber:
            return jsonify({
                'success': False,
                'error': 'Subscriber not found'
            }), 404
        
        # Update subscriber stats
        subscriber.games_played = games_played
        subscriber.last_activity = datetime.utcnow()
        
        # Update tags based on performance
        current_tags = json.loads(subscriber.tags) if subscriber.tags else []
        
        if success:
            if 'successful_player' not in current_tags:
                current_tags.append('successful_player')
        
        if games_played >= 5 and 'regular_player' not in current_tags:
            current_tags.append('regular_player')
        
        if games_played >= 20 and 'dedicated_player' not in current_tags:
            current_tags.append('dedicated_player')
        
        subscriber.tags = json.dumps(current_tags)
        
        triggered_campaigns = []
        
        # Milestone-based email triggers
        if games_played == 5 and not subscriber.premium_status:
            # First premium upgrade prompt
            result = email_service.send_premium_upgrade(
                to_email=email,
                offer_days=7
            )
            
            if result['success']:
                triggered_campaigns.append({
                    'type': 'premium_upgrade_5_games',
                    'sent': True,
                    'reason': 'Reached 5 games milestone'
                })
        
        elif games_played == 10 and not subscriber.premium_status:
            # Second premium upgrade prompt with better offer
            result = email_service.send_premium_upgrade(
                to_email=email,
                offer_days=3  # More urgent offer
            )
            
            if result['success']:
                triggered_campaigns.append({
                    'type': 'premium_upgrade_10_games',
                    'sent': True,
                    'reason': 'Reached 10 games milestone'
                })
        
        elif games_played == 25:
            # Achievement email for dedicated players
            achievement_result = email_service.send_template_email(
                to_email=email,
                template_name='achievement_email.html',
                subject='🏆 Achievement Unlocked: Dedicated Player!',
                variables={
                    'achievement_name': 'Dedicated Player',
                    'games_completed': games_played,
                    'achievement_description': 'You\'ve completed 25 games! You\'re officially a word puzzle master.'
                }
            )
            
            if achievement_result['success']:
                triggered_campaigns.append({
                    'type': 'achievement_25_games',
                    'sent': True,
                    'reason': 'Reached 25 games achievement'
                })
        
        # Category-specific engagement
        if category and success:
            # Update favorite category
            subscriber.favorite_category = category
            
            # If they're good at this category, suggest similar challenges
            category_result = email_service.send_template_email(
                to_email=email,
                template_name='daily_challenge.html',
                subject=f'More {category} Challenges Await!',
                variables={
                    'category': category,
                    'challenge_word': 'SPECIAL',  # Would be dynamically generated
                    'hint_text': f'Another exciting {category.lower()} word for you to solve!'
                }
            )
        
        db.session.commit()
        
        logger.info(f"Game completion webhook processed: {email}, games: {games_played}, triggered: {len(triggered_campaigns)}")
        
        return jsonify({
            'success': True,
            'message': 'Game completion processed successfully',
            'data': {
                'subscriber_id': subscriber.id,
                'games_played': games_played,
                'triggered_campaigns': triggered_campaigns,
                'updated_tags': current_tags
            }
        })
        
    except Exception as e:
        logger.error(f"Game completion webhook error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Webhook processing failed: {str(e)}'
        }), 500

@webhooks.route('/premium_upgrade', methods=['POST'])
def handle_premium_upgrade():
    """
    Webhook for premium upgrade events
    Sends welcome to premium email and updates subscriber status
    
    Lindy.ai Integration: Call this when a user upgrades to premium
    """
    try:
        data = request.get_json()
        
        if not data or 'user_email' not in data:
            return jsonify({
                'success': False,
                'error': 'User email is required'
            }), 400
        
        email = data['user_email']
        payment_amount = data.get('payment_amount', 4.99)
        payment_method = data.get('payment_method', 'unknown')
        
        # Get subscriber
        subscriber = Subscriber.query.filter_by(email=email).first()
        if not subscriber:
            return jsonify({
                'success': False,
                'error': 'Subscriber not found'
            }), 404
        
        # Update subscriber to premium
        subscriber.premium_status = True
        subscriber.premium_since = datetime.utcnow()
        subscriber.last_activity = datetime.utcnow()
        
        # Update tags
        current_tags = json.loads(subscriber.tags) if subscriber.tags else []
        if 'premium_user' not in current_tags:
            current_tags.append('premium_user')
        subscriber.tags = json.dumps(current_tags)
        
        # Send premium welcome email
        premium_welcome_result = email_service.send_template_email(
            to_email=email,
            template_name='premium_welcome.html',
            subject='🌟 Welcome to Premium! Your Benefits Await',
            variables={
                'payment_amount': payment_amount,
                'premium_features': [
                    'Ad-free gaming experience',
                    'Unlimited hints',
                    'Exclusive premium categories',
                    'Advanced performance analytics',
                    'Priority customer support'
                ],
                'activation_date': datetime.utcnow().strftime('%B %d, %Y')
            }
        )
        
        # Cancel any pending premium upgrade campaigns for this user
        pending_campaigns = EmailCampaign.query.filter(
            EmailCampaign.template_name == 'premium_upgrade.html',
            EmailCampaign.status == 'scheduled'
        ).all()
        
        cancelled_campaigns = 0
        for campaign in pending_campaigns:
            # Check if this campaign targets this user (simplified check)
            if email in campaign.name:  # Assuming email is in campaign name
                campaign.status = 'cancelled'
                cancelled_campaigns += 1
        
        db.session.commit()
        
        logger.info(f"Premium upgrade webhook processed: {email}, amount: ${payment_amount}")
        
        return jsonify({
            'success': True,
            'message': 'Premium upgrade processed successfully',
            'data': {
                'subscriber_id': subscriber.id,
                'premium_status': True,
                'welcome_email_sent': premium_welcome_result['success'],
                'cancelled_campaigns': cancelled_campaigns,
                'premium_since': subscriber.premium_since.isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Premium upgrade webhook error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Webhook processing failed: {str(e)}'
        }), 500

@webhooks.route('/daily_challenge', methods=['POST'])
def handle_daily_challenge():
    """
    Webhook for daily challenge automation
    Sends daily challenge emails to active subscribers
    
    Lindy.ai Integration: Schedule this to run daily at optimal times
    """
    try:
        data = request.get_json()
        
        challenge_word = data.get('challenge_word', 'PUZZLE')
        category = data.get('category', 'General')
        hint_text = data.get('hint_text', 'A word game challenge')
        difficulty = data.get('difficulty', 'Medium')
        target_segment = data.get('target_segment', 'active')
        
        # Get target subscribers
        query = Subscriber.query.filter(Subscriber.status == 'active')
        
        if target_segment == 'premium':
            query = query.filter(Subscriber.premium_status == True)
        elif target_segment == 'free':
            query = query.filter(Subscriber.premium_status == False)
        
        subscribers = query.all()
        
        sent_count = 0
        failed_count = 0
        
        # Send daily challenge to each subscriber
        for subscriber in subscribers:
            try:
                result = email_service.send_daily_challenge(
                    to_email=subscriber.email,
                    challenge_word=challenge_word,
                    category=category,
                    hint_text=hint_text,
                    difficulty=difficulty
                )
                
                if result['success']:
                    sent_count += 1
                    
                    # Update subscriber last email sent
                    subscriber.last_email_sent = datetime.utcnow()
                else:
                    failed_count += 1
                    logger.warning(f"Failed to send daily challenge to {subscriber.email}: {result.get('error')}")
                    
            except Exception as e:
                failed_count += 1
                logger.error(f"Error sending daily challenge to {subscriber.email}: {e}")
        
        # Create campaign record
        campaign = EmailCampaign(
            name=f"Daily Challenge - {datetime.utcnow().strftime('%Y-%m-%d')}",
            subject=f"🎯 Daily Challenge - {category} Word",
            template_name="daily_challenge.html",
            status='sent',
            emails_sent=sent_count,
            emails_delivered=sent_count,  # Assume 100% delivery for now
            total_recipients=len(subscribers),
            sent_at=datetime.utcnow(),
            created_by_ai=True,
            automation_trigger='daily_challenge',
            template_data=json.dumps({
                'challenge_word': challenge_word,
                'category': category,
                'hint_text': hint_text,
                'difficulty': difficulty
            })
        )
        
        db.session.add(campaign)
        db.session.commit()
        
        logger.info(f"Daily challenge webhook processed: sent to {sent_count} subscribers, {failed_count} failed")
        
        return jsonify({
            'success': True,
            'message': 'Daily challenge sent successfully',
            'data': {
                'campaign_id': campaign.id,
                'challenge_word': challenge_word,
                'category': category,
                'emails_sent': sent_count,
                'emails_failed': failed_count,
                'total_recipients': len(subscribers),
                'delivery_rate': round((sent_count / len(subscribers)) * 100, 2) if subscribers else 0
            }
        })
        
    except Exception as e:
        logger.error(f"Daily challenge webhook error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Webhook processing failed: {str(e)}'
        }), 500

@webhooks.route('/user_inactive', methods=['POST'])
def handle_user_inactive():
    """
    Webhook for inactive user re-engagement
    Sends win-back emails to users who haven't played recently
    
    Lindy.ai Integration: Schedule this weekly to re-engage inactive users
    """
    try:
        data = request.get_json()
        
        inactive_days = data.get('inactive_days', 7)  # Default 7 days
        
        # Find inactive subscribers
        cutoff_date = datetime.utcnow() - timedelta(days=inactive_days)
        
        inactive_subscribers = Subscriber.query.filter(
            Subscriber.status == 'active',
            Subscriber.last_activity < cutoff_date,
            Subscriber.premium_status == False  # Focus on free users for now
        ).limit(100).all()  # Limit to prevent overwhelming
        
        sent_count = 0
        
        for subscriber in inactive_subscribers:
            try:
                # Calculate how long they've been inactive
                days_inactive = (datetime.utcnow() - subscriber.last_activity).days
                
                # Send personalized win-back email
                result = email_service.send_template_email(
                    to_email=subscriber.email,
                    template_name='winback_email.html',
                    subject='We Miss You! Come Back for a Quick Game',
                    variables={
                        'days_inactive': days_inactive,
                        'games_played': subscriber.games_played,
                        'favorite_category': subscriber.favorite_category or 'General',
                        'special_offer': 'Play 3 games and get a bonus hint pack!',
                        'return_url': f"{email_service.default_variables['website_url']}?welcome_back=true"
                    }
                )
                
                if result['success']:
                    sent_count += 1
                    
                    # Update last email sent
                    subscriber.last_email_sent = datetime.utcnow()
                    
                    # Add win-back tag
                    current_tags = json.loads(subscriber.tags) if subscriber.tags else []
                    if 'winback_sent' not in current_tags:
                        current_tags.append('winback_sent')
                    subscriber.tags = json.dumps(current_tags)
                    
            except Exception as e:
                logger.error(f"Error sending win-back email to {subscriber.email}: {e}")
        
        db.session.commit()
        
        logger.info(f"Inactive user webhook processed: sent to {sent_count} inactive subscribers")
        
        return jsonify({
            'success': True,
            'message': 'Win-back campaign sent successfully',
            'data': {
                'inactive_days_threshold': inactive_days,
                'inactive_users_found': len(inactive_subscribers),
                'emails_sent': sent_count,
                'campaign_type': 'winback_automation'
            }
        })
        
    except Exception as e:
        logger.error(f"Inactive user webhook error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Webhook processing failed: {str(e)}'
        }), 500

@webhooks.route('/test_automation', methods=['POST'])
def test_automation():
    """
    Test webhook for Lindy.ai integration testing
    Allows testing of automation workflows without affecting real users
    """
    try:
        data = request.get_json()
        
        test_type = data.get('test_type', 'welcome')
        test_email = data.get('test_email', 'test@example.com')
        
        if test_type == 'welcome':
            result = email_service.send_welcome_email(
                to_email=test_email,
                name='Test User'
            )
        elif test_type == 'premium':
            result = email_service.send_premium_upgrade(
                to_email=test_email,
                offer_days=7
            )
        elif test_type == 'daily_challenge':
            result = email_service.send_daily_challenge(
                to_email=test_email,
                challenge_word='TESTING',
                category='Technology',
                hint_text='What we are doing right now!'
            )
        else:
            return jsonify({
                'success': False,
                'error': 'Invalid test_type. Use: welcome, premium, or daily_challenge'
            }), 400
        
        return jsonify({
            'success': True,
            'message': f'Test {test_type} automation completed',
            'data': {
                'test_type': test_type,
                'test_email': test_email,
                'email_sent': result['success'],
                'result': result
            }
        })
        
    except Exception as e:
        logger.error(f"Test automation webhook error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Test automation failed: {str(e)}'
        }), 500

# Health check for webhooks
@webhooks.route('/health', methods=['GET'])
def webhook_health():
    """
    Health check endpoint for webhook system
    Lindy.ai can use this to verify webhook system is operational
    """
    try:
        # Check database connection
        subscriber_count = Subscriber.query.count()
        
        # Check recent webhook activity
        recent_logs = EmailLog.query.filter(
            EmailLog.created_at > datetime.utcnow() - timedelta(hours=24)
        ).count()
        
        return jsonify({
            'success': True,
            'status': 'healthy',
            'webhook_system': 'operational',
            'database': 'connected',
            'stats': {
                'total_subscribers': subscriber_count,
                'emails_last_24h': recent_logs,
                'last_check': datetime.utcnow().isoformat()
            },
            'available_webhooks': [
                'user_signup',
                'game_completed',
                'premium_upgrade',
                'daily_challenge',
                'user_inactive',
                'test_automation'
            ]
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'status': 'unhealthy',
            'error': str(e)
        }), 500

