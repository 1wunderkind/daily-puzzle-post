from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from src.models.email import db, Subscriber, EmailCampaign, EmailTemplate, EmailLog
import json
import re

email_api = Blueprint('email', __name__)

# Email validation regex
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')

def validate_email(email):
    """Validate email address format"""
    return EMAIL_REGEX.match(email) is not None

# ============================================================================
# SUBSCRIBER MANAGEMENT ENDPOINTS (Lindy.ai Accessible)
# ============================================================================

@email_api.route('/subscribers', methods=['GET'])
def get_subscribers():
    """
    Get all subscribers with filtering options
    AI-Friendly: GET /api/subscribers?status=active&premium=true&limit=100
    """
    try:
        # Query parameters for filtering
        status = request.args.get('status', 'active')
        premium = request.args.get('premium')
        tag = request.args.get('tag')
        limit = int(request.args.get('limit', 100))
        offset = int(request.args.get('offset', 0))
        
        # Build query
        query = Subscriber.query
        
        if status != 'all':
            query = query.filter(Subscriber.status == status)
        
        if premium is not None:
            premium_bool = premium.lower() == 'true'
            query = query.filter(Subscriber.premium_status == premium_bool)
        
        if tag:
            query = query.filter(Subscriber.tags.contains(f'"{tag}"'))
        
        # Execute query with pagination
        subscribers = query.offset(offset).limit(limit).all()
        total_count = query.count()
        
        return jsonify({
            'success': True,
            'data': [sub.to_dict() for sub in subscribers],
            'pagination': {
                'total': total_count,
                'limit': limit,
                'offset': offset,
                'has_more': offset + limit < total_count
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@email_api.route('/subscribers', methods=['POST'])
def add_subscriber():
    """
    Add new subscriber
    AI-Friendly: POST /api/subscribers with JSON body
    """
    try:
        data = request.get_json()
        
        if not data or 'email' not in data:
            return jsonify({'success': False, 'error': 'Email is required'}), 400
        
        email = data['email'].lower().strip()
        
        if not validate_email(email):
            return jsonify({'success': False, 'error': 'Invalid email format'}), 400
        
        # Check if subscriber already exists
        existing = Subscriber.query.filter_by(email=email).first()
        if existing:
            return jsonify({
                'success': False, 
                'error': 'Subscriber already exists',
                'existing_subscriber': existing.to_dict()
            }), 409
        
        # Create new subscriber
        subscriber = Subscriber(
            email=email,
            name=data.get('name'),
            source=data.get('source', 'api'),
            tags=json.dumps(data.get('tags', [])),
            metadata=json.dumps(data.get('metadata', {})),
            premium_status=data.get('premium_status', False),
            games_played=data.get('games_played', 0),
            favorite_category=data.get('favorite_category')
        )
        
        db.session.add(subscriber)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Subscriber added successfully',
            'data': subscriber.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@email_api.route('/subscribers/<int:subscriber_id>', methods=['PUT'])
def update_subscriber(subscriber_id):
    """
    Update subscriber information
    AI-Friendly: PUT /api/subscribers/123 with JSON body
    """
    try:
        subscriber = Subscriber.query.get(subscriber_id)
        if not subscriber:
            return jsonify({'success': False, 'error': 'Subscriber not found'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        # Update fields
        if 'name' in data:
            subscriber.name = data['name']
        if 'status' in data:
            subscriber.status = data['status']
        if 'premium_status' in data:
            subscriber.premium_status = data['premium_status']
        if 'games_played' in data:
            subscriber.games_played = data['games_played']
        if 'favorite_category' in data:
            subscriber.favorite_category = data['favorite_category']
        if 'tags' in data:
            subscriber.tags = json.dumps(data['tags'])
        if 'metadata' in data:
            subscriber.metadata = json.dumps(data['metadata'])
        
        subscriber.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Subscriber updated successfully',
            'data': subscriber.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@email_api.route('/subscribers/<int:subscriber_id>/tags', methods=['POST'])
def add_subscriber_tag(subscriber_id):
    """
    Add tag to subscriber
    AI-Friendly: POST /api/subscribers/123/tags with {"tag": "premium_user"}
    """
    try:
        subscriber = Subscriber.query.get(subscriber_id)
        if not subscriber:
            return jsonify({'success': False, 'error': 'Subscriber not found'}), 404
        
        data = request.get_json()
        if not data or 'tag' not in data:
            return jsonify({'success': False, 'error': 'Tag is required'}), 400
        
        subscriber.add_tag(data['tag'])
        subscriber.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Tag added successfully',
            'data': subscriber.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================================================
# EMAIL CAMPAIGN ENDPOINTS (Lindy.ai Accessible)
# ============================================================================

@email_api.route('/campaigns', methods=['GET'])
def get_campaigns():
    """
    Get all email campaigns
    AI-Friendly: GET /api/campaigns?status=sent&limit=50
    """
    try:
        status = request.args.get('status')
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))
        
        query = EmailCampaign.query
        
        if status:
            query = query.filter(EmailCampaign.status == status)
        
        campaigns = query.order_by(EmailCampaign.created_at.desc()).offset(offset).limit(limit).all()
        total_count = query.count()
        
        return jsonify({
            'success': True,
            'data': [campaign.to_dict() for campaign in campaigns],
            'pagination': {
                'total': total_count,
                'limit': limit,
                'offset': offset,
                'has_more': offset + limit < total_count
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@email_api.route('/campaigns', methods=['POST'])
def create_campaign():
    """
    Create new email campaign
    AI-Friendly: POST /api/campaigns with comprehensive JSON body
    """
    try:
        data = request.get_json()
        
        required_fields = ['name', 'subject', 'template_name']
        for field in required_fields:
            if not data or field not in data:
                return jsonify({'success': False, 'error': f'{field} is required'}), 400
        
        # Create new campaign
        campaign = EmailCampaign(
            name=data['name'],
            subject=data['subject'],
            template_name=data['template_name'],
            status=data.get('status', 'draft'),
            send_time=datetime.fromisoformat(data['send_time']) if data.get('send_time') else None,
            timezone=data.get('timezone', 'UTC'),
            target_tags=json.dumps(data.get('target_tags', [])),
            target_premium=data.get('target_premium'),
            target_active_days=data.get('target_active_days'),
            template_data=json.dumps(data.get('template_data', {})),
            personalization=json.dumps(data.get('personalization', {})),
            automation_trigger=data.get('automation_trigger'),
            automation_rules=json.dumps(data.get('automation_rules', {})),
            created_by_ai=data.get('created_by_ai', False)
        )
        
        db.session.add(campaign)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Campaign created successfully',
            'data': campaign.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@email_api.route('/campaigns/<int:campaign_id>/send', methods=['POST'])
def send_campaign(campaign_id):
    """
    Send email campaign immediately
    AI-Friendly: POST /api/campaigns/123/send
    """
    try:
        campaign = EmailCampaign.query.get(campaign_id)
        if not campaign:
            return jsonify({'success': False, 'error': 'Campaign not found'}), 404
        
        if campaign.status not in ['draft', 'scheduled']:
            return jsonify({'success': False, 'error': 'Campaign cannot be sent in current status'}), 400
        
        # Get target subscribers
        query = Subscriber.query.filter(Subscriber.status == 'active')
        
        # Apply targeting filters
        if campaign.target_premium is not None:
            query = query.filter(Subscriber.premium_status == campaign.target_premium)
        
        if campaign.target_active_days:
            cutoff_date = datetime.utcnow() - timedelta(days=campaign.target_active_days)
            query = query.filter(Subscriber.last_game_date >= cutoff_date)
        
        if campaign.target_tags:
            target_tags = json.loads(campaign.target_tags)
            for tag in target_tags:
                query = query.filter(Subscriber.tags.contains(f'"{tag}"'))
        
        recipients = query.all()
        
        # Update campaign status
        campaign.status = 'sending'
        campaign.total_recipients = len(recipients)
        campaign.sent_at = datetime.utcnow()
        
        # Simulate sending emails (in production, integrate with actual email service)
        emails_sent = 0
        for recipient in recipients:
            try:
                # Create email log entry
                email_log = EmailLog(
                    subscriber_id=recipient.id,
                    campaign_id=campaign.id,
                    email_address=recipient.email,
                    subject=campaign.subject,
                    template_name=campaign.template_name,
                    status='sent'
                )
                db.session.add(email_log)
                
                # Update subscriber last email sent
                recipient.last_email_sent = datetime.utcnow()
                emails_sent += 1
                
            except Exception as e:
                print(f"Error sending to {recipient.email}: {e}")
        
        # Update campaign stats
        campaign.emails_sent = emails_sent
        campaign.emails_delivered = emails_sent  # Simulate 100% delivery for now
        campaign.status = 'sent'
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Campaign sent to {emails_sent} recipients',
            'data': campaign.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================================================
# EMAIL TEMPLATE ENDPOINTS (Lindy.ai Accessible)
# ============================================================================

@email_api.route('/templates', methods=['GET'])
def get_templates():
    """
    Get all email templates
    AI-Friendly: GET /api/templates?category=welcome&active=true
    """
    try:
        category = request.args.get('category')
        active_only = request.args.get('active', 'true').lower() == 'true'
        
        query = EmailTemplate.query
        
        if category:
            query = query.filter(EmailTemplate.category == category)
        
        if active_only:
            query = query.filter(EmailTemplate.is_active == True)
        
        templates = query.order_by(EmailTemplate.name).all()
        
        return jsonify({
            'success': True,
            'data': [template.to_dict() for template in templates]
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@email_api.route('/templates', methods=['POST'])
def create_template():
    """
    Create new email template
    AI-Friendly: POST /api/templates with template content
    """
    try:
        data = request.get_json()
        
        required_fields = ['name', 'subject_template', 'html_content']
        for field in required_fields:
            if not data or field not in data:
                return jsonify({'success': False, 'error': f'{field} is required'}), 400
        
        # Check if template name already exists
        existing = EmailTemplate.query.filter_by(name=data['name']).first()
        if existing:
            return jsonify({'success': False, 'error': 'Template name already exists'}), 409
        
        template = EmailTemplate(
            name=data['name'],
            description=data.get('description'),
            category=data.get('category', 'general'),
            subject_template=data['subject_template'],
            html_content=data['html_content'],
            text_content=data.get('text_content'),
            variables=json.dumps(data.get('variables', [])),
            sample_data=json.dumps(data.get('sample_data', {})),
            is_ai_generated=data.get('is_ai_generated', False)
        )
        
        db.session.add(template)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Template created successfully',
            'data': template.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================================================
# ANALYTICS AND REPORTING ENDPOINTS (Lindy.ai Accessible)
# ============================================================================

@email_api.route('/analytics/overview', methods=['GET'])
def get_analytics_overview():
    """
    Get email analytics overview
    AI-Friendly: GET /api/analytics/overview?days=30
    """
    try:
        days = int(request.args.get('days', 30))
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Subscriber stats
        total_subscribers = Subscriber.query.count()
        active_subscribers = Subscriber.query.filter(Subscriber.status == 'active').count()
        premium_subscribers = Subscriber.query.filter(Subscriber.premium_status == True).count()
        new_subscribers = Subscriber.query.filter(Subscriber.created_at >= cutoff_date).count()
        
        # Campaign stats
        total_campaigns = EmailCampaign.query.count()
        recent_campaigns = EmailCampaign.query.filter(EmailCampaign.created_at >= cutoff_date).count()
        sent_campaigns = EmailCampaign.query.filter(EmailCampaign.status == 'sent').count()
        
        # Email stats
        total_emails_sent = db.session.query(db.func.sum(EmailCampaign.emails_sent)).scalar() or 0
        total_emails_opened = db.session.query(db.func.sum(EmailCampaign.emails_opened)).scalar() or 0
        total_emails_clicked = db.session.query(db.func.sum(EmailCampaign.emails_clicked)).scalar() or 0
        
        # Calculate rates
        open_rate = round((total_emails_opened / max(total_emails_sent, 1)) * 100, 2)
        click_rate = round((total_emails_clicked / max(total_emails_sent, 1)) * 100, 2)
        
        return jsonify({
            'success': True,
            'data': {
                'period_days': days,
                'subscribers': {
                    'total': total_subscribers,
                    'active': active_subscribers,
                    'premium': premium_subscribers,
                    'new_in_period': new_subscribers,
                    'active_rate': round((active_subscribers / max(total_subscribers, 1)) * 100, 2)
                },
                'campaigns': {
                    'total': total_campaigns,
                    'recent': recent_campaigns,
                    'sent': sent_campaigns,
                    'success_rate': round((sent_campaigns / max(total_campaigns, 1)) * 100, 2)
                },
                'performance': {
                    'emails_sent': total_emails_sent,
                    'emails_opened': total_emails_opened,
                    'emails_clicked': total_emails_clicked,
                    'open_rate': open_rate,
                    'click_rate': click_rate
                },
                'generated_at': datetime.utcnow().isoformat()
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@email_api.route('/analytics/subscribers/growth', methods=['GET'])
def get_subscriber_growth():
    """
    Get subscriber growth data
    AI-Friendly: GET /api/analytics/subscribers/growth?days=90
    """
    try:
        days = int(request.args.get('days', 90))
        
        # Get daily subscriber counts for the period
        growth_data = []
        for i in range(days, 0, -1):
            date = datetime.utcnow() - timedelta(days=i)
            count = Subscriber.query.filter(Subscriber.created_at <= date).count()
            growth_data.append({
                'date': date.strftime('%Y-%m-%d'),
                'total_subscribers': count
            })
        
        return jsonify({
            'success': True,
            'data': {
                'period_days': days,
                'growth_data': growth_data
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================================================
# WEBHOOK ENDPOINTS (For External Integrations)
# ============================================================================

@email_api.route('/webhooks/user_signup', methods=['POST'])
def webhook_user_signup():
    """
    Webhook for new user signups from Daily Puzzle Post
    AI-Friendly: POST /api/webhooks/user_signup
    """
    try:
        data = request.get_json()
        
        if not data or 'email' not in data:
            return jsonify({'success': False, 'error': 'Email is required'}), 400
        
        email = data['email'].lower().strip()
        
        if not validate_email(email):
            return jsonify({'success': False, 'error': 'Invalid email format'}), 400
        
        # Check if subscriber already exists
        existing = Subscriber.query.filter_by(email=email).first()
        if existing:
            # Update existing subscriber with new data
            existing.name = data.get('name', existing.name)
            existing.games_played = data.get('games_played', existing.games_played)
            existing.premium_status = data.get('premium_status', existing.premium_status)
            existing.last_game_date = datetime.utcnow()
            existing.updated_at = datetime.utcnow()
            
            # Add signup tag if not present
            existing.add_tag('website_user')
            
        else:
            # Create new subscriber
            subscriber = Subscriber(
                email=email,
                name=data.get('name'),
                source='website_signup',
                tags=json.dumps(['website_user', 'new_user']),
                premium_status=data.get('premium_status', False),
                games_played=data.get('games_played', 0),
                last_game_date=datetime.utcnow(),
                favorite_category=data.get('favorite_category')
            )
            db.session.add(subscriber)
        
        db.session.commit()
        
        # Trigger welcome email campaign (if exists)
        welcome_campaign = EmailCampaign.query.filter_by(
            automation_trigger='user_signup',
            status='active'
        ).first()
        
        response_data = {
            'success': True,
            'message': 'User signup processed successfully',
            'subscriber_id': existing.id if existing else subscriber.id
        }
        
        if welcome_campaign:
            response_data['welcome_campaign_triggered'] = welcome_campaign.id
        
        return jsonify(response_data)
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================================================
# AUTOMATION ENDPOINTS (Lindy.ai Specific)
# ============================================================================

@email_api.route('/automation/triggers', methods=['GET'])
def get_automation_triggers():
    """
    Get available automation triggers for Lindy.ai
    AI-Friendly: GET /api/automation/triggers
    """
    triggers = [
        {
            'name': 'user_signup',
            'description': 'Triggered when a new user signs up',
            'variables': ['email', 'name', 'signup_date']
        },
        {
            'name': 'premium_upgrade',
            'description': 'Triggered when user upgrades to premium',
            'variables': ['email', 'name', 'upgrade_date', 'plan']
        },
        {
            'name': 'game_milestone',
            'description': 'Triggered when user reaches game milestones',
            'variables': ['email', 'name', 'milestone', 'games_played', 'category']
        },
        {
            'name': 'inactive_user',
            'description': 'Triggered for users inactive for X days',
            'variables': ['email', 'name', 'last_active', 'days_inactive']
        },
        {
            'name': 'daily_challenge',
            'description': 'Daily challenge email trigger',
            'variables': ['email', 'name', 'challenge_word', 'category', 'difficulty']
        }
    ]
    
    return jsonify({
        'success': True,
        'data': triggers
    })

@email_api.route('/automation/schedule', methods=['POST'])
def schedule_automation():
    """
    Schedule automated email campaign
    AI-Friendly: POST /api/automation/schedule
    """
    try:
        data = request.get_json()
        
        required_fields = ['trigger', 'template_name', 'name']
        for field in required_fields:
            if not data or field not in data:
                return jsonify({'success': False, 'error': f'{field} is required'}), 400
        
        # Create automated campaign
        campaign = EmailCampaign(
            name=data['name'],
            subject=data.get('subject', 'Automated Email'),
            template_name=data['template_name'],
            status='active',  # Active automation
            automation_trigger=data['trigger'],
            automation_rules=json.dumps(data.get('rules', {})),
            target_tags=json.dumps(data.get('target_tags', [])),
            target_premium=data.get('target_premium'),
            template_data=json.dumps(data.get('template_data', {})),
            created_by_ai=True
        )
        
        db.session.add(campaign)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Automation scheduled successfully',
            'data': campaign.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================================================
# HEALTH CHECK ENDPOINT
# ============================================================================

@email_api.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint for monitoring
    AI-Friendly: GET /api/health
    """
    try:
        # Test database connection
        db.session.execute('SELECT 1')
        
        # Get basic stats
        subscriber_count = Subscriber.query.count()
        campaign_count = EmailCampaign.query.count()
        template_count = EmailTemplate.query.count()
        
        return jsonify({
            'success': True,
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'database': 'connected',
            'stats': {
                'subscribers': subscriber_count,
                'campaigns': campaign_count,
                'templates': template_count
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'status': 'unhealthy',
            'error': str(e)
        }), 500

