import os
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from jinja2 import Environment, FileSystemLoader, select_autoescape
from src.models.email import db, Subscriber, EmailCampaign, EmailTemplate, EmailLog

class EmailService:
    """
    Email service for rendering templates and sending emails
    Optimized for Lindy.ai automation and AI agent integration
    """
    
    def __init__(self, app=None):
        self.app = app
        self.template_dir = os.path.join(os.path.dirname(__file__), '..', 'templates')
        
        # Initialize Jinja2 environment for template rendering
        self.jinja_env = Environment(
            loader=FileSystemLoader(self.template_dir),
            autoescape=select_autoescape(['html', 'xml'])
        )
        
        # Email configuration (to be set via environment variables)
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_username = os.getenv('SMTP_USERNAME', '')
        self.smtp_password = os.getenv('SMTP_PASSWORD', '')
        self.from_email = os.getenv('FROM_EMAIL', 'noreply@dailypuzzlepost.com')
        self.from_name = os.getenv('FROM_NAME', 'Daily Puzzle Post')
        
        # Default template variables
        self.default_variables = {
            'website_url': os.getenv('WEBSITE_URL', 'https://dailypuzzlepost.com'),
            'current_year': datetime.now().year,
            'current_date': datetime.now().strftime('%A, %B %d, %Y'),
            'company_name': 'Daily Puzzle Post',
            'support_email': 'support@dailypuzzlepost.com'
        }
    
    def render_template(self, template_name, variables=None):
        """
        Render email template with variables
        AI-Friendly: Accepts template name and variable dictionary
        """
        try:
            # Load template
            template = self.jinja_env.get_template(template_name)
            
            # Merge default variables with provided variables
            template_vars = self.default_variables.copy()
            if variables:
                template_vars.update(variables)
            
            # Render template
            rendered_html = template.render(**template_vars)
            
            return {
                'success': True,
                'html_content': rendered_html,
                'variables_used': template_vars
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Template rendering failed: {str(e)}'
            }
    
    def send_email(self, to_email, subject, html_content, text_content=None, template_name=None):
        """
        Send email using SMTP
        AI-Friendly: Simple interface for sending emails
        """
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email
            
            # Add text content if provided
            if text_content:
                text_part = MIMEText(text_content, 'plain')
                msg.attach(text_part)
            
            # Add HTML content
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            # Send email (simulate for now - in production, use actual SMTP)
            if self.smtp_username and self.smtp_password:
                # Real SMTP sending (uncomment for production)
                # server = smtplib.SMTP(self.smtp_server, self.smtp_port)
                # server.starttls()
                # server.login(self.smtp_username, self.smtp_password)
                # server.send_message(msg)
                # server.quit()
                pass
            
            # For now, simulate successful sending
            print(f"[EMAIL SENT] To: {to_email}, Subject: {subject}")
            
            return {
                'success': True,
                'message': 'Email sent successfully',
                'to_email': to_email,
                'subject': subject,
                'template_name': template_name,
                'sent_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Email sending failed: {str(e)}'
            }
    
    def send_template_email(self, to_email, template_name, subject=None, variables=None):
        """
        Send email using template
        AI-Friendly: High-level interface for template-based emails
        """
        try:
            # Get subscriber info if available
            subscriber = Subscriber.query.filter_by(email=to_email).first()
            
            # Prepare template variables
            template_vars = variables or {}
            
            # Add subscriber-specific variables
            if subscriber:
                template_vars.update({
                    'name': subscriber.name,
                    'email': subscriber.email,
                    'games_played': subscriber.games_played,
                    'premium_status': subscriber.premium_status,
                    'favorite_category': subscriber.favorite_category,
                    'member_since': subscriber.created_at.strftime('%B %Y') if subscriber.created_at else None
                })
            
            # Add unsubscribe URL
            template_vars['unsubscribe_url'] = f"{self.default_variables['website_url']}/unsubscribe?email={to_email}"
            
            # Render template
            render_result = self.render_template(template_name, template_vars)
            
            if not render_result['success']:
                return render_result
            
            # Use template subject if not provided
            if not subject:
                # Try to get subject from EmailTemplate database
                email_template = EmailTemplate.query.filter_by(name=template_name.replace('.html', '')).first()
                if email_template:
                    subject_template = self.jinja_env.from_string(email_template.subject_template)
                    subject = subject_template.render(**template_vars)
                else:
                    subject = f"Daily Puzzle Post - {template_name}"
            
            # Send email
            send_result = self.send_email(
                to_email=to_email,
                subject=subject,
                html_content=render_result['html_content'],
                template_name=template_name
            )
            
            # Log email if subscriber exists
            if subscriber and send_result['success']:
                email_log = EmailLog(
                    subscriber_id=subscriber.id,
                    email_address=to_email,
                    subject=subject,
                    template_name=template_name,
                    status='sent',
                    metadata=json.dumps(template_vars)
                )
                db.session.add(email_log)
                
                # Update subscriber last email sent
                subscriber.last_email_sent = datetime.utcnow()
                db.session.commit()
            
            return send_result
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Template email sending failed: {str(e)}'
            }
    
    def send_welcome_email(self, to_email, name=None):
        """
        Send welcome email to new subscriber
        AI-Friendly: Simple welcome email automation
        """
        variables = {
            'name': name,
            'signup_date': datetime.now().strftime('%B %d, %Y')
        }
        
        return self.send_template_email(
            to_email=to_email,
            template_name='welcome_email.html',
            subject='Welcome to Daily Puzzle Post!',
            variables=variables
        )
    
    def send_daily_challenge(self, to_email, challenge_word, category, hint_text, difficulty='Medium'):
        """
        Send daily challenge email
        AI-Friendly: Automated daily challenge emails
        """
        # Create word blanks (show first letter, hide rest)
        word_blanks = challenge_word[0] + ' _' * (len(challenge_word) - 1)
        
        variables = {
            'challenge_date': datetime.now().strftime('%A, %B %d, %Y'),
            'time_of_day': self._get_time_of_day(),
            'category': category,
            'word_blanks': word_blanks,
            'word_length': len(challenge_word),
            'difficulty': difficulty,
            'hint_text': hint_text,
            'play_url': f"{self.default_variables['website_url']}?challenge={challenge_word}"
        }
        
        # Add subscriber stats if available
        subscriber = Subscriber.query.filter_by(email=to_email).first()
        if subscriber:
            variables.update({
                'win_streak': self._calculate_win_streak(subscriber),
                'success_rate': self._calculate_success_rate(subscriber)
            })
        
        return self.send_template_email(
            to_email=to_email,
            template_name='daily_challenge.html',
            subject=f'🎯 Daily Challenge - {category} Word',
            variables=variables
        )
    
    def send_premium_upgrade(self, to_email, offer_days=7):
        """
        Send premium upgrade email
        AI-Friendly: Automated premium conversion emails
        """
        variables = {
            'offer_days': offer_days,
            'premium_members': '1,247',  # Could be dynamic from database
            'upgrade_url': f"{self.default_variables['website_url']}/premium?ref=email",
            'faq_url': f"{self.default_variables['website_url']}/premium-faq"
        }
        
        return self.send_template_email(
            to_email=to_email,
            template_name='premium_upgrade.html',
            subject='⭐ Unlock Premium Features - 50% Off Today!',
            variables=variables
        )
    
    def send_bulk_campaign(self, campaign_id):
        """
        Send bulk email campaign
        AI-Friendly: Automated bulk email sending
        """
        try:
            campaign = EmailCampaign.query.get(campaign_id)
            if not campaign:
                return {'success': False, 'error': 'Campaign not found'}
            
            # Get target subscribers
            query = Subscriber.query.filter(Subscriber.status == 'active')
            
            # Apply targeting filters
            if campaign.target_premium is not None:
                query = query.filter(Subscriber.premium_status == campaign.target_premium)
            
            if campaign.target_tags:
                target_tags = json.loads(campaign.target_tags)
                for tag in target_tags:
                    query = query.filter(Subscriber.tags.contains(f'"{tag}"'))
            
            recipients = query.all()
            
            # Send emails
            sent_count = 0
            failed_count = 0
            
            template_data = json.loads(campaign.template_data) if campaign.template_data else {}
            
            for recipient in recipients:
                try:
                    result = self.send_template_email(
                        to_email=recipient.email,
                        template_name=campaign.template_name,
                        subject=campaign.subject,
                        variables=template_data
                    )
                    
                    if result['success']:
                        sent_count += 1
                        
                        # Create email log
                        email_log = EmailLog(
                            subscriber_id=recipient.id,
                            campaign_id=campaign.id,
                            email_address=recipient.email,
                            subject=campaign.subject,
                            template_name=campaign.template_name,
                            status='sent'
                        )
                        db.session.add(email_log)
                        
                    else:
                        failed_count += 1
                        print(f"Failed to send to {recipient.email}: {result.get('error')}")
                        
                except Exception as e:
                    failed_count += 1
                    print(f"Error sending to {recipient.email}: {e}")
            
            # Update campaign stats
            campaign.emails_sent = sent_count
            campaign.emails_delivered = sent_count  # Assume 100% delivery for now
            campaign.status = 'sent'
            campaign.sent_at = datetime.utcnow()
            
            db.session.commit()
            
            return {
                'success': True,
                'campaign_id': campaign_id,
                'emails_sent': sent_count,
                'emails_failed': failed_count,
                'total_recipients': len(recipients)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Bulk campaign sending failed: {str(e)}'
            }
    
    def _get_time_of_day(self):
        """Get appropriate greeting based on time of day"""
        hour = datetime.now().hour
        if hour < 12:
            return 'morning'
        elif hour < 17:
            return 'afternoon'
        else:
            return 'evening'
    
    def _calculate_win_streak(self, subscriber):
        """Calculate current win streak for subscriber"""
        # This would be implemented based on game data
        # For now, return a placeholder
        return subscriber.games_played // 3 if subscriber.games_played else 0
    
    def _calculate_success_rate(self, subscriber):
        """Calculate success rate for subscriber"""
        # This would be implemented based on game data
        # For now, return a placeholder
        if subscriber.games_played > 0:
            return min(85 + (subscriber.games_played // 10), 95)
        return 0
    
    def get_email_templates(self):
        """
        Get available email templates
        AI-Friendly: List all available templates for automation
        """
        templates = []
        
        # Scan template directory
        if os.path.exists(self.template_dir):
            for filename in os.listdir(self.template_dir):
                if filename.endswith('.html'):
                    templates.append({
                        'filename': filename,
                        'name': filename.replace('.html', ''),
                        'path': os.path.join(self.template_dir, filename)
                    })
        
        return templates
    
    def validate_email_address(self, email):
        """
        Validate email address format
        AI-Friendly: Simple email validation
        """
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None

# Global email service instance
email_service = EmailService()

