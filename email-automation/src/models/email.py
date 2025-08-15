from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()

class Subscriber(db.Model):
    """Email subscriber model for managing email list"""
    __tablename__ = 'subscribers'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    name = db.Column(db.String(100), nullable=True)
    status = db.Column(db.String(20), default='active')  # active, unsubscribed, bounced
    source = db.Column(db.String(50), nullable=True)  # website, api, import
    tags = db.Column(db.Text, nullable=True)  # JSON array of tags
    custom_data = db.Column(db.Text, nullable=True)  # JSON object for custom data
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_email_sent = db.Column(db.DateTime, nullable=True)
    
    # Game-specific data
    premium_status = db.Column(db.Boolean, default=False)
    games_played = db.Column(db.Integer, default=0)
    last_game_date = db.Column(db.DateTime, nullable=True)
    favorite_category = db.Column(db.String(50), nullable=True)
    
    def to_dict(self):
        """Convert subscriber to dictionary for API responses"""
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'status': self.status,
            'source': self.source,
            'tags': json.loads(self.tags) if self.tags else [],
            'custom_data': json.loads(self.custom_data) if self.custom_data else {},
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'last_email_sent': self.last_email_sent.isoformat() if self.last_email_sent else None,
            'premium_status': self.premium_status,
            'games_played': self.games_played,
            'last_game_date': self.last_game_date.isoformat() if self.last_game_date else None,
            'favorite_category': self.favorite_category
        }

class EmailCampaign(db.Model):
    """Email campaign model for managing email campaigns"""
    __tablename__ = 'email_campaigns'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    subject = db.Column(db.String(500), nullable=False)
    template_name = db.Column(db.String(255), nullable=False)
    template_data = db.Column(db.Text, nullable=True)  # JSON string of template variables
    status = db.Column(db.String(50), default='draft')  # draft, scheduled, sending, sent, cancelled
    target_premium = db.Column(db.Boolean, nullable=True)  # None=all, True=premium only, False=free only
    target_tags = db.Column(db.Text, nullable=True)  # JSON string of target tags
    scheduled_at = db.Column(db.DateTime, nullable=True)
    sent_at = db.Column(db.DateTime, nullable=True)
    total_recipients = db.Column(db.Integer, default=0)
    emails_sent = db.Column(db.Integer, default=0)
    emails_delivered = db.Column(db.Integer, default=0)
    emails_opened = db.Column(db.Integer, default=0)
    emails_clicked = db.Column(db.Integer, default=0)
    created_by_ai = db.Column(db.Boolean, default=False)
    automation_trigger = db.Column(db.String(255), nullable=True)
    campaign_data = db.Column(db.Text, nullable=True)  # JSON string for additional campaign data
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'subject': self.subject,
            'template_name': self.template_name,
            'template_data': self.template_data,
            'status': self.status,
            'target_premium': self.target_premium,
            'target_tags': self.target_tags,
            'scheduled_at': self.scheduled_at.isoformat() if self.scheduled_at else None,
            'sent_at': self.sent_at.isoformat() if self.sent_at else None,
            'total_recipients': self.total_recipients,
            'emails_sent': self.emails_sent,
            'emails_delivered': self.emails_delivered,
            'emails_opened': self.emails_opened,
            'emails_clicked': self.emails_clicked,
            'created_by_ai': self.created_by_ai,
            'automation_trigger': self.automation_trigger,
            'campaign_data': self.campaign_data,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class EmailLog(db.Model):
    """Email log model for tracking sent emails"""
    __tablename__ = 'email_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    subscriber_id = db.Column(db.Integer, db.ForeignKey('subscribers.id'), nullable=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('email_campaigns.id'), nullable=True)
    email_address = db.Column(db.String(255), nullable=False)
    subject = db.Column(db.String(500), nullable=False)
    template_name = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(50), default='sent')  # sent, delivered, opened, clicked, bounced, failed
    email_provider_id = db.Column(db.String(255), nullable=True)  # External email service ID
    error_message = db.Column(db.Text, nullable=True)
    log_data = db.Column(db.Text, nullable=True)  # JSON string for additional log data
    sent_via_api = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    subscriber = db.relationship('Subscriber', backref='email_logs')
    campaign = db.relationship('EmailCampaign', backref='email_logs')
    
    def to_dict(self):
        return {
            'id': self.id,
            'subscriber_id': self.subscriber_id,
            'campaign_id': self.campaign_id,
            'email_address': self.email_address,
            'subject': self.subject,
            'template_name': self.template_name,
            'status': self.status,
            'email_provider_id': self.email_provider_id,
            'error_message': self.error_message,
            'log_data': self.log_data,
            'sent_via_api': self.sent_via_api,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class EmailTemplate(db.Model):
    """Email template model for managing email templates"""
    __tablename__ = 'email_templates'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), unique=True, nullable=False)
    display_name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    subject_template = db.Column(db.String(500), nullable=False)
    html_content = db.Column(db.Text, nullable=False)
    text_content = db.Column(db.Text, nullable=True)
    required_variables = db.Column(db.Text, nullable=True)  # JSON string of required variable names
    optional_variables = db.Column(db.Text, nullable=True)  # JSON string of optional variable names
    category = db.Column(db.String(100), nullable=True)  # welcome, promotional, transactional, etc.
    is_active = db.Column(db.Boolean, default=True)
    template_data = db.Column(db.Text, nullable=True)  # JSON string for additional template data
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'display_name': self.display_name,
            'description': self.description,
            'subject_template': self.subject_template,
            'html_content': self.html_content,
            'text_content': self.text_content,
            'required_variables': self.required_variables,
            'optional_variables': self.optional_variables,
            'category': self.category,
            'is_active': self.is_active,
            'template_data': self.template_data,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

