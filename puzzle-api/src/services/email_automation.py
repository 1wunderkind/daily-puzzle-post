"""
Email Automation Service for Daily Puzzle Post Community
Handles automated email notifications for puzzle submissions, approvals, and weekly digests
"""

import json
import os
import smtplib
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import asyncio
from typing import Dict, List, Optional

class EmailAutomationService:
    """
    Automated email service for community puzzle management
    Designed for Lindy.ai integration and hands-off operation
    """
    
    def __init__(self):
        self.email_logs_dir = '/home/ubuntu/daily-puzzle-post-github/community/email_logs'
        self.templates_dir = '/home/ubuntu/daily-puzzle-post-github/community/email_templates'
        self.queue_dir = '/home/ubuntu/daily-puzzle-post-github/community/email_queue'
        
        # Ensure directories exist
        for directory in [self.email_logs_dir, self.templates_dir, self.queue_dir]:
            os.makedirs(directory, exist_ok=True)
        
        # Email configuration (would be environment variables in production)
        self.smtp_config = {
            'host': 'smtp.gmail.com',  # Example - would be configured per deployment
            'port': 587,
            'username': 'noreply@dailypuzzlepost.com',  # Example
            'password': 'app_password',  # Would be secure in production
            'use_tls': True
        }
        
        # Initialize email templates
        self._create_email_templates()
    
    def _create_email_templates(self):
        """Create email templates for different notification types"""
        
        # Approval email template
        approval_template = """
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Times New Roman', serif; line-height: 1.6; color: #333; }
        .header { background-color: #1e3a8a; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #fdf6e3; }
        .footer { background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; }
        .puzzle-info { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #22543d; }
        .button { background-color: #22543d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Daily Puzzle Post</h1>
        <h2>🎉 Your Puzzle Has Been Approved!</h2>
    </div>
    
    <div class="content">
        <p>Dear {author_name},</p>
        
        <p>Congratulations! Your crossword puzzle "<strong>{puzzle_title}</strong>" has been approved for publication in our community section.</p>
        
        <div class="puzzle-info">
            <h3>Puzzle Details:</h3>
            <ul>
                <li><strong>Title:</strong> {puzzle_title}</li>
                <li><strong>Theme:</strong> {puzzle_theme}</li>
                <li><strong>Difficulty:</strong> {puzzle_difficulty}</li>
                <li><strong>Quality Score:</strong> {quality_score}/10</li>
                <li><strong>Word Count:</strong> {word_count} words</li>
            </ul>
        </div>
        
        <p>Your puzzle will appear in our community section and may be featured in our weekly digest. Readers can now solve and vote on your creation!</p>
        
        <p><a href="https://dailypuzzlepost.com/community/puzzle/{puzzle_id}" class="button">View Your Published Puzzle</a></p>
        
        <p>Thank you for contributing to our puzzle community. We encourage you to submit more puzzles!</p>
        
        <p>Best regards,<br>
        The Daily Puzzle Post Editorial Team</p>
    </div>
    
    <div class="footer">
        <p>Daily Puzzle Post | Classic Newspaper Puzzles Online</p>
        <p>This is an automated message. Please do not reply to this email.</p>
    </div>
</body>
</html>
        """
        
        # Rejection email template
        rejection_template = """
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Times New Roman', serif; line-height: 1.6; color: #333; }
        .header { background-color: #1e3a8a; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #fdf6e3; }
        .footer { background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; }
        .feedback-box { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #dc2626; }
        .suggestions { background-color: #f0f9ff; padding: 15px; margin: 15px 0; border-radius: 4px; }
        .button { background-color: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Daily Puzzle Post</h1>
        <h2>📝 Puzzle Feedback & Suggestions</h2>
    </div>
    
    <div class="content">
        <p>Dear {author_name},</p>
        
        <p>Thank you for submitting your crossword puzzle "<strong>{puzzle_title}</strong>" to Daily Puzzle Post. While we appreciate your effort, we need some improvements before we can publish it.</p>
        
        <div class="feedback-box">
            <h3>Editorial Feedback:</h3>
            <p>{feedback_message}</p>
            <p><strong>Quality Score:</strong> {quality_score}/10</p>
        </div>
        
        <div class="suggestions">
            <h3>Suggested Improvements:</h3>
            <ul>
                {suggested_edits_list}
            </ul>
        </div>
        
        <p>We encourage you to revise your puzzle based on this feedback and resubmit. Our goal is to maintain the high quality that our readers expect from newspaper-style crosswords.</p>
        
        <p><a href="https://dailypuzzlepost.com/create" class="button">Create New Puzzle</a></p>
        
        <p>Don't be discouraged! Many of our best constructors needed several attempts to get their first puzzle published. Keep practicing and studying quality crosswords.</p>
        
        <p>Best regards,<br>
        The Daily Puzzle Post Editorial Team</p>
    </div>
    
    <div class="footer">
        <p>Daily Puzzle Post | Classic Newspaper Puzzles Online</p>
        <p>This is an automated message. Please do not reply to this email.</p>
    </div>
</body>
</html>
        """
        
        # Review notification template
        review_template = """
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Times New Roman', serif; line-height: 1.6; color: #333; }
        .header { background-color: #1e3a8a; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #fdf6e3; }
        .footer { background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; }
        .status-box { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #f59e0b; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Daily Puzzle Post</h1>
        <h2>⏳ Your Puzzle is Under Review</h2>
    </div>
    
    <div class="content">
        <p>Dear {author_name},</p>
        
        <p>Thank you for submitting your crossword puzzle "<strong>{puzzle_title}</strong>" to Daily Puzzle Post.</p>
        
        <div class="status-box">
            <h3>Submission Status: Under Editorial Review</h3>
            <p>Your puzzle is currently being reviewed by our editorial team. This process typically takes 2-3 business days.</p>
            <p><strong>Estimated Review Completion:</strong> {estimated_completion_date}</p>
        </div>
        
        <p>We'll send you another email as soon as our review is complete with either approval or constructive feedback for improvements.</p>
        
        <p>In the meantime, feel free to create additional puzzles or explore our community section.</p>
        
        <p>Thank you for your patience and for contributing to our puzzle community.</p>
        
        <p>Best regards,<br>
        The Daily Puzzle Post Editorial Team</p>
    </div>
    
    <div class="footer">
        <p>Daily Puzzle Post | Classic Newspaper Puzzles Online</p>
        <p>This is an automated message. Please do not reply to this email.</p>
    </div>
</body>
</html>
        """
        
        # Weekly digest template
        weekly_digest_template = """
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Times New Roman', serif; line-height: 1.6; color: #333; }
        .header { background-color: #1e3a8a; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #fdf6e3; }
        .footer { background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; }
        .featured-puzzle { background-color: white; padding: 20px; margin: 20px 0; border: 2px solid #22543d; border-radius: 8px; }
        .puzzle-list { background-color: white; padding: 15px; margin: 15px 0; border-radius: 4px; }
        .stats-box { background-color: #f0f9ff; padding: 15px; margin: 15px 0; border-radius: 4px; }
        .button { background-color: #22543d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 0; }
        .puzzle-item { border-bottom: 1px solid #e5e5e5; padding: 10px 0; }
        .puzzle-item:last-child { border-bottom: none; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Daily Puzzle Post</h1>
        <h2>📰 Weekly Community Digest</h2>
        <p>Week of {week_start} - {week_end}</p>
    </div>
    
    <div class="content">
        <p>Dear Puzzle Enthusiasts,</p>
        
        <p>Here's your weekly roundup of community puzzle activity and featured content from Daily Puzzle Post.</p>
        
        <div class="featured-puzzle">
            <h2>🏆 Sunday Reader's Puzzle of the Week</h2>
            <h3>"{featured_puzzle_title}" by {featured_puzzle_author}</h3>
            <p><strong>Theme:</strong> {featured_puzzle_theme}</p>
            <p><strong>Difficulty:</strong> {featured_puzzle_difficulty}</p>
            <p><strong>Quality Score:</strong> {featured_quality_score}/10</p>
            <p><strong>Community Votes:</strong> {featured_votes} thumbs up</p>
            <p><a href="https://dailypuzzlepost.com/community/puzzle/{featured_puzzle_id}" class="button">Solve This Week's Featured Puzzle</a></p>
        </div>
        
        <div class="stats-box">
            <h3>📊 This Week's Community Stats</h3>
            <ul>
                <li><strong>{new_submissions}</strong> new puzzle submissions</li>
                <li><strong>{approved_count}</strong> puzzles approved and published</li>
                <li><strong>{total_votes}</strong> community votes cast</li>
                <li><strong>{active_constructors}</strong> active puzzle constructors</li>
            </ul>
        </div>
        
        <div class="puzzle-list">
            <h3>🆕 New Community Puzzles This Week</h3>
            {new_puzzles_list}
        </div>
        
        <div class="puzzle-list">
            <h3>👍 Most Popular Puzzles This Week</h3>
            {popular_puzzles_list}
        </div>
        
        <p><a href="https://dailypuzzlepost.com/community" class="button">Explore All Community Puzzles</a></p>
        
        <p><a href="https://dailypuzzlepost.com/create" class="button">Create Your Own Puzzle</a></p>
        
        <p>Thank you for being part of our growing puzzle community!</p>
        
        <p>Happy puzzling,<br>
        The Daily Puzzle Post Team</p>
    </div>
    
    <div class="footer">
        <p>Daily Puzzle Post | Classic Newspaper Puzzles Online</p>
        <p><a href="https://dailypuzzlepost.com/unsubscribe">Unsubscribe from weekly digest</a></p>
    </div>
</body>
</html>
        """
        
        # Save templates
        templates = {
            'approval': approval_template,
            'rejection': rejection_template,
            'review': review_template,
            'weekly_digest': weekly_digest_template
        }
        
        for template_name, template_content in templates.items():
            template_file = os.path.join(self.templates_dir, f'{template_name}.html')
            with open(template_file, 'w') as f:
                f.write(template_content)
    
    async def send_approval_email(self, puzzle_data: Dict) -> bool:
        """Send approval email to puzzle constructor"""
        try:
            template_data = {
                'author_name': puzzle_data['author'],
                'puzzle_title': puzzle_data['title'],
                'puzzle_theme': puzzle_data.get('theme', 'General'),
                'puzzle_difficulty': puzzle_data.get('difficulty', 'Medium'),
                'quality_score': puzzle_data.get('moderation_result', {}).get('quality_score', 0),
                'word_count': puzzle_data.get('metadata', {}).get('word_count', 0),
                'puzzle_id': puzzle_data['id']
            }
            
            email_data = {
                'recipient': puzzle_data.get('email', ''),
                'subject': f'🎉 Your puzzle "{puzzle_data["title"]}" has been approved!',
                'template': 'approval',
                'template_data': template_data,
                'priority': 'normal'
            }
            
            return await self._queue_email(email_data)
            
        except Exception as e:
            self._log_email_error('approval', puzzle_data.get('id', 'unknown'), str(e))
            return False
    
    async def send_rejection_email(self, puzzle_data: Dict) -> bool:
        """Send rejection email with feedback"""
        try:
            moderation_result = puzzle_data.get('moderation_result', {})
            suggested_edits = moderation_result.get('suggested_edits', [])
            
            # Format suggested edits as HTML list
            edits_html = ''.join([f'<li>{edit}</li>' for edit in suggested_edits])
            
            template_data = {
                'author_name': puzzle_data['author'],
                'puzzle_title': puzzle_data['title'],
                'feedback_message': moderation_result.get('feedback', 'Please review and improve your puzzle.'),
                'quality_score': moderation_result.get('quality_score', 0),
                'suggested_edits_list': edits_html
            }
            
            email_data = {
                'recipient': puzzle_data.get('email', ''),
                'subject': f'📝 Feedback on your puzzle "{puzzle_data["title"]}"',
                'template': 'rejection',
                'template_data': template_data,
                'priority': 'normal'
            }
            
            return await self._queue_email(email_data)
            
        except Exception as e:
            self._log_email_error('rejection', puzzle_data.get('id', 'unknown'), str(e))
            return False
    
    async def send_review_notification_email(self, puzzle_data: Dict) -> bool:
        """Send review notification email"""
        try:
            # Calculate estimated completion date (3 business days)
            estimated_date = datetime.now() + timedelta(days=3)
            
            template_data = {
                'author_name': puzzle_data['author'],
                'puzzle_title': puzzle_data['title'],
                'estimated_completion_date': estimated_date.strftime('%B %d, %Y')
            }
            
            email_data = {
                'recipient': puzzle_data.get('email', ''),
                'subject': f'⏳ Your puzzle "{puzzle_data["title"]}" is under review',
                'template': 'review',
                'template_data': template_data,
                'priority': 'low'
            }
            
            return await self._queue_email(email_data)
            
        except Exception as e:
            self._log_email_error('review', puzzle_data.get('id', 'unknown'), str(e))
            return False
    
    async def send_weekly_digest_email(self, digest_data: Dict, recipient_list: List[str]) -> bool:
        """Send weekly digest email to subscribers"""
        try:
            # Format featured puzzle data
            featured_puzzle = digest_data.get('featured_puzzle')
            if featured_puzzle:
                featured_data = {
                    'featured_puzzle_title': featured_puzzle['title'],
                    'featured_puzzle_author': featured_puzzle['author'],
                    'featured_puzzle_theme': featured_puzzle.get('theme', 'General'),
                    'featured_puzzle_difficulty': featured_puzzle.get('difficulty', 'Medium'),
                    'featured_quality_score': featured_puzzle.get('quality_score', 0),
                    'featured_votes': featured_puzzle.get('votes', {}).get('thumbs_up', 0),
                    'featured_puzzle_id': featured_puzzle['id']
                }
            else:
                featured_data = {
                    'featured_puzzle_title': 'No featured puzzle this week',
                    'featured_puzzle_author': '',
                    'featured_puzzle_theme': '',
                    'featured_puzzle_difficulty': '',
                    'featured_quality_score': 0,
                    'featured_votes': 0,
                    'featured_puzzle_id': ''
                }
            
            # Format new puzzles list
            new_puzzles_html = ''
            for puzzle in digest_data.get('approved_puzzles', [])[:5]:  # Top 5
                new_puzzles_html += f'''
                <div class="puzzle-item">
                    <strong>"{puzzle['title']}"</strong> by {puzzle['author']}<br>
                    <small>Theme: {puzzle.get('theme', 'General')} | Votes: {puzzle.get('votes', {}).get('thumbs_up', 0)} 👍</small>
                </div>
                '''
            
            # Format popular puzzles list
            popular_puzzles = sorted(
                digest_data.get('approved_puzzles', []), 
                key=lambda x: x.get('votes', {}).get('thumbs_up', 0), 
                reverse=True
            )[:3]
            
            popular_puzzles_html = ''
            for puzzle in popular_puzzles:
                popular_puzzles_html += f'''
                <div class="puzzle-item">
                    <strong>"{puzzle['title']}"</strong> by {puzzle['author']}<br>
                    <small>{puzzle.get('votes', {}).get('thumbs_up', 0)} votes | Quality: {puzzle.get('quality_score', 0)}/10</small>
                </div>
                '''
            
            template_data = {
                'week_start': digest_data['week_start'][:10],  # Just date part
                'week_end': digest_data['week_end'][:10],
                'new_submissions': digest_data['new_submissions'],
                'approved_count': digest_data['community_stats']['total_approved'],
                'total_votes': digest_data['community_stats']['total_votes'],
                'active_constructors': digest_data['community_stats']['active_constructors'],
                'new_puzzles_list': new_puzzles_html or '<p>No new puzzles this week.</p>',
                'popular_puzzles_list': popular_puzzles_html or '<p>No voted puzzles this week.</p>',
                **featured_data
            }
            
            # Send to all subscribers
            success_count = 0
            for recipient in recipient_list:
                email_data = {
                    'recipient': recipient,
                    'subject': f'📰 Weekly Puzzle Digest - {digest_data["week_start"][:10]}',
                    'template': 'weekly_digest',
                    'template_data': template_data,
                    'priority': 'low'
                }
                
                if await self._queue_email(email_data):
                    success_count += 1
            
            return success_count > 0
            
        except Exception as e:
            self._log_email_error('weekly_digest', 'batch', str(e))
            return False
    
    async def _queue_email(self, email_data: Dict) -> bool:
        """Queue email for sending (simulated for now)"""
        try:
            # Generate unique email ID
            email_id = f"email_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{hash(email_data['recipient']) % 10000}"
            
            # Add metadata
            email_data.update({
                'id': email_id,
                'queued_at': datetime.now().isoformat(),
                'status': 'queued',
                'attempts': 0,
                'max_attempts': 3
            })
            
            # Save to queue
            queue_file = os.path.join(self.queue_dir, f'{email_id}.json')
            with open(queue_file, 'w') as f:
                json.dump(email_data, f, indent=2)
            
            # Log email queuing
            self._log_email_activity('queued', email_data)
            
            # In production, this would trigger actual email sending
            # For now, simulate immediate sending
            await self._simulate_email_send(email_data)
            
            return True
            
        except Exception as e:
            self._log_email_error('queue', email_data.get('recipient', 'unknown'), str(e))
            return False
    
    async def _simulate_email_send(self, email_data: Dict):
        """Simulate email sending (replace with actual SMTP in production)"""
        try:
            # Load template
            template_file = os.path.join(self.templates_dir, f"{email_data['template']}.html")
            with open(template_file, 'r') as f:
                template_content = f.read()
            
            # Replace template variables
            email_html = template_content
            for key, value in email_data['template_data'].items():
                email_html = email_html.replace(f'{{{key}}}', str(value))
            
            # Simulate sending delay
            await asyncio.sleep(0.1)
            
            # Update email status
            email_data['status'] = 'sent'
            email_data['sent_at'] = datetime.now().isoformat()
            
            # Save updated status
            queue_file = os.path.join(self.queue_dir, f"{email_data['id']}.json")
            with open(queue_file, 'w') as f:
                json.dump(email_data, f, indent=2)
            
            # Log successful send
            self._log_email_activity('sent', email_data)
            
            # Print simulation message
            print(f"📧 EMAIL SENT: {email_data['subject']} → {email_data['recipient']}")
            
        except Exception as e:
            email_data['status'] = 'failed'
            email_data['error'] = str(e)
            self._log_email_error('send', email_data.get('recipient', 'unknown'), str(e))
    
    def _log_email_activity(self, activity_type: str, email_data: Dict):
        """Log email activity for analytics"""
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'activity': activity_type,
            'email_id': email_data.get('id'),
            'recipient': email_data.get('recipient'),
            'subject': email_data.get('subject'),
            'template': email_data.get('template'),
            'priority': email_data.get('priority', 'normal')
        }
        
        log_file = os.path.join(self.email_logs_dir, f"activity_{datetime.now().strftime('%Y%m%d')}.jsonl")
        with open(log_file, 'a') as f:
            f.write(json.dumps(log_entry) + '\n')
    
    def _log_email_error(self, operation: str, identifier: str, error_message: str):
        """Log email errors for debugging"""
        error_entry = {
            'timestamp': datetime.now().isoformat(),
            'operation': operation,
            'identifier': identifier,
            'error': error_message
        }
        
        error_file = os.path.join(self.email_logs_dir, f"errors_{datetime.now().strftime('%Y%m%d')}.jsonl")
        with open(error_file, 'a') as f:
            f.write(json.dumps(error_entry) + '\n')
    
    def get_email_stats(self, days: int = 7) -> Dict:
        """Get email statistics for the specified number of days"""
        try:
            stats = {
                'total_sent': 0,
                'total_queued': 0,
                'total_failed': 0,
                'by_template': {},
                'by_day': {},
                'recent_activity': []
            }
            
            # Calculate date range
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)
            
            # Read activity logs
            for i in range(days):
                check_date = start_date + timedelta(days=i)
                log_file = os.path.join(self.email_logs_dir, f"activity_{check_date.strftime('%Y%m%d')}.jsonl")
                
                if os.path.exists(log_file):
                    with open(log_file, 'r') as f:
                        for line in f:
                            try:
                                log_entry = json.loads(line.strip())
                                activity = log_entry['activity']
                                template = log_entry.get('template', 'unknown')
                                day_key = log_entry['timestamp'][:10]
                                
                                # Count by activity type
                                if activity == 'sent':
                                    stats['total_sent'] += 1
                                elif activity == 'queued':
                                    stats['total_queued'] += 1
                                elif activity == 'failed':
                                    stats['total_failed'] += 1
                                
                                # Count by template
                                if template not in stats['by_template']:
                                    stats['by_template'][template] = 0
                                stats['by_template'][template] += 1
                                
                                # Count by day
                                if day_key not in stats['by_day']:
                                    stats['by_day'][day_key] = 0
                                stats['by_day'][day_key] += 1
                                
                                # Add to recent activity
                                stats['recent_activity'].append(log_entry)
                                
                            except json.JSONDecodeError:
                                continue
            
            # Sort recent activity by timestamp (most recent first)
            stats['recent_activity'].sort(key=lambda x: x['timestamp'], reverse=True)
            stats['recent_activity'] = stats['recent_activity'][:20]  # Keep only last 20
            
            return stats
            
        except Exception as e:
            return {'error': f'Failed to get email stats: {str(e)}'}
    
    async def process_email_queue(self, batch_size: int = 10) -> Dict:
        """Process queued emails (for scheduled execution)"""
        try:
            processed = 0
            failed = 0
            
            # Get queued emails
            queue_files = [f for f in os.listdir(self.queue_dir) if f.endswith('.json')][:batch_size]
            
            for filename in queue_files:
                queue_file = os.path.join(self.queue_dir, filename)
                
                try:
                    with open(queue_file, 'r') as f:
                        email_data = json.load(f)
                    
                    if email_data['status'] == 'queued' and email_data['attempts'] < email_data['max_attempts']:
                        email_data['attempts'] += 1
                        await self._simulate_email_send(email_data)
                        processed += 1
                    elif email_data['attempts'] >= email_data['max_attempts']:
                        email_data['status'] = 'failed'
                        failed += 1
                        
                except Exception as e:
                    failed += 1
                    self._log_email_error('process_queue', filename, str(e))
            
            return {
                'processed': processed,
                'failed': failed,
                'remaining_in_queue': len(os.listdir(self.queue_dir)) - processed - failed
            }
            
        except Exception as e:
            return {'error': f'Failed to process email queue: {str(e)}'}

# Global email service instance
email_service = EmailAutomationService()

# Convenience functions for easy import
async def send_approval_email(puzzle_data: Dict) -> bool:
    return await email_service.send_approval_email(puzzle_data)

async def send_rejection_email(puzzle_data: Dict) -> bool:
    return await email_service.send_rejection_email(puzzle_data)

async def send_review_notification_email(puzzle_data: Dict) -> bool:
    return await email_service.send_review_notification_email(puzzle_data)

async def send_weekly_digest_email(digest_data: Dict, recipient_list: List[str]) -> bool:
    return await email_service.send_weekly_digest_email(digest_data, recipient_list)

def get_email_stats(days: int = 7) -> Dict:
    return email_service.get_email_stats(days)

async def process_email_queue(batch_size: int = 10) -> Dict:
    return await email_service.process_email_queue(batch_size)

