from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import json
import os
import uuid
import asyncio
from ..services.lindy_moderation import lindy_moderator

community_bp = Blueprint('community', __name__)

# Community storage paths
COMMUNITY_DIR = '/home/ubuntu/daily-puzzle-post-github/community'
SUBMISSIONS_DIR = os.path.join(COMMUNITY_DIR, 'submissions')
APPROVED_DIR = os.path.join(COMMUNITY_DIR, 'approved')
REJECTED_DIR = os.path.join(COMMUNITY_DIR, 'rejected')
REVIEW_QUEUE_DIR = os.path.join(COMMUNITY_DIR, 'review_queue')

# Ensure directories exist
for directory in [COMMUNITY_DIR, SUBMISSIONS_DIR, APPROVED_DIR, REJECTED_DIR, REVIEW_QUEUE_DIR]:
    os.makedirs(directory, exist_ok=True)

@community_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for community system"""
    return jsonify({
        'status': 'healthy',
        'service': 'community_api',
        'timestamp': datetime.now().isoformat(),
        'moderation_enabled': True,
        'lindy_integration': True
    })

@community_bp.route('/submit', methods=['POST'])
def submit_puzzle():
    """
    Submit a user-created puzzle for community review
    Automatically processes through Lindy.ai moderation pipeline
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'author', 'puzzle_type', 'grid', 'clues']
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            return jsonify({
                'success': False,
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400
        
        # Generate unique submission ID
        submission_id = str(uuid.uuid4())
        submission_time = datetime.now().isoformat()
        
        # Prepare submission data
        submission_data = {
            'id': submission_id,
            'submission_time': submission_time,
            'title': data['title'],
            'author': data['author'],
            'email': data.get('email', ''),
            'puzzle_type': data['puzzle_type'],
            'difficulty': data.get('difficulty', 'medium'),
            'theme': data.get('theme', 'none'),
            'grid': data['grid'],
            'clues': data['clues'],
            'metadata': data.get('metadata', {}),
            'constructor_notes': data.get('constructor_notes', ''),
            'status': 'submitted',
            'moderation_result': None,
            'votes': {'thumbs_up': 0, 'total_votes': 0},
            'featured': False
        }
        
        # Save original submission
        submission_file = os.path.join(SUBMISSIONS_DIR, f'{submission_id}.json')
        with open(submission_file, 'w') as f:
            json.dump(submission_data, f, indent=2)
        
        # Process through Lindy.ai moderation
        try:
            # Run moderation asynchronously
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            moderation_result = loop.run_until_complete(
                lindy_moderator.moderate_puzzle(submission_data, data['puzzle_type'])
            )
            loop.close()
            
            # Update submission with moderation result
            submission_data['moderation_result'] = moderation_result
            submission_data['status'] = moderation_result['approval_status']
            submission_data['moderation_time'] = moderation_result['moderation_time']
            
            # Move to appropriate directory based on moderation result
            if moderation_result['approval_status'] == 'approved':
                # Auto-approve high quality puzzles
                approved_file = os.path.join(APPROVED_DIR, f'{submission_id}.json')
                with open(approved_file, 'w') as f:
                    json.dump(submission_data, f, indent=2)
                
                # Send approval email (simulated)
                send_approval_email(submission_data)
                
            elif moderation_result['approval_status'] == 'human_review':
                # Queue for human review
                review_file = os.path.join(REVIEW_QUEUE_DIR, f'{submission_id}.json')
                with open(review_file, 'w') as f:
                    json.dump(submission_data, f, indent=2)
                
                # Send review notification email (simulated)
                send_review_notification_email(submission_data)
                
            else:  # rejected
                # Auto-reject low quality puzzles
                rejected_file = os.path.join(REJECTED_DIR, f'{submission_id}.json')
                with open(rejected_file, 'w') as f:
                    json.dump(submission_data, f, indent=2)
                
                # Send rejection email with feedback (simulated)
                send_rejection_email(submission_data)
            
            # Update original submission file
            with open(submission_file, 'w') as f:
                json.dump(submission_data, f, indent=2)
            
            return jsonify({
                'success': True,
                'submission_id': submission_id,
                'status': submission_data['status'],
                'quality_score': moderation_result['quality_score'],
                'feedback': moderation_result['feedback'],
                'suggested_edits': moderation_result['suggested_edits'],
                'estimated_review_time': get_estimated_review_time(moderation_result['approval_status']),
                'message': get_status_message(moderation_result['approval_status'])
            })
            
        except Exception as moderation_error:
            # Fallback to human review if moderation fails
            submission_data['status'] = 'human_review'
            submission_data['moderation_error'] = str(moderation_error)
            
            review_file = os.path.join(REVIEW_QUEUE_DIR, f'{submission_id}.json')
            with open(review_file, 'w') as f:
                json.dump(submission_data, f, indent=2)
            
            with open(submission_file, 'w') as f:
                json.dump(submission_data, f, indent=2)
            
            return jsonify({
                'success': True,
                'submission_id': submission_id,
                'status': 'human_review',
                'message': 'Puzzle submitted for human review due to technical issue.',
                'estimated_review_time': '2-3 business days'
            })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Submission failed: {str(e)}'
        }), 500

@community_bp.route('/sunday-puzzle', methods=['GET'])
def get_sunday_readers_puzzle():
    """Get the current Sunday Reader's Puzzle (best of the week)"""
    try:
        # Get current week's date range
        today = datetime.now()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)
        
        # Find the best puzzle from this week
        best_puzzle = None
        best_score = 0
        
        if os.path.exists(APPROVED_DIR):
            for filename in os.listdir(APPROVED_DIR):
                if filename.endswith('.json'):
                    with open(os.path.join(APPROVED_DIR, filename), 'r') as f:
                        puzzle_data = json.load(f)
                        
                        # Check if puzzle was submitted this week
                        submission_date = datetime.fromisoformat(puzzle_data['submission_time'].replace('Z', '+00:00'))
                        if week_start <= submission_date <= week_end:
                            
                            # Calculate composite score (quality + votes)
                            quality_score = puzzle_data.get('moderation_result', {}).get('quality_score', 0)
                            vote_score = puzzle_data.get('votes', {}).get('thumbs_up', 0)
                            composite_score = quality_score + (vote_score * 0.5)  # Weight votes less than quality
                            
                            if composite_score > best_score:
                                best_score = composite_score
                                best_puzzle = puzzle_data
        
        if best_puzzle:
            return jsonify({
                'success': True,
                'sunday_puzzle': {
                    'id': best_puzzle['id'],
                    'title': best_puzzle['title'],
                    'author': best_puzzle['author'],
                    'puzzle_type': best_puzzle['puzzle_type'],
                    'difficulty': best_puzzle['difficulty'],
                    'theme': best_puzzle['theme'],
                    'grid': best_puzzle['grid'],
                    'clues': best_puzzle['clues'],
                    'quality_score': best_puzzle.get('moderation_result', {}).get('quality_score', 0),
                    'votes': best_puzzle.get('votes', {'thumbs_up': 0, 'total_votes': 0}),
                    'composite_score': best_score,
                    'week_start': week_start.isoformat(),
                    'week_end': week_end.isoformat()
                }
            })
        else:
            return jsonify({
                'success': True,
                'sunday_puzzle': None,
                'message': 'No qualifying puzzles for this week'
            })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to get Sunday puzzle: {str(e)}'
        }), 500

@community_bp.route('/weekly-digest', methods=['GET'])
def get_weekly_digest():
    """Generate weekly digest of community activity"""
    try:
        # Get current week's date range
        today = datetime.now()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)
        
        digest_data = {
            'week_start': week_start.isoformat(),
            'week_end': week_end.isoformat(),
            'new_submissions': 0,
            'approved_puzzles': [],
            'featured_puzzle': None,
            'top_voted_puzzles': [],
            'community_stats': {
                'total_approved': 0,
                'total_votes': 0,
                'active_constructors': set()
            }
        }
        
        # Collect weekly data
        for directory, status in [(SUBMISSIONS_DIR, 'submitted'), (APPROVED_DIR, 'approved'), (REJECTED_DIR, 'rejected')]:
            if os.path.exists(directory):
                for filename in os.listdir(directory):
                    if filename.endswith('.json'):
                        with open(os.path.join(directory, filename), 'r') as f:
                            puzzle_data = json.load(f)
                            
                            submission_date = datetime.fromisoformat(puzzle_data['submission_time'].replace('Z', '+00:00'))
                            if week_start <= submission_date <= week_end:
                                
                                if status == 'submitted':
                                    digest_data['new_submissions'] += 1
                                elif status == 'approved':
                                    puzzle_summary = {
                                        'id': puzzle_data['id'],
                                        'title': puzzle_data['title'],
                                        'author': puzzle_data['author'],
                                        'theme': puzzle_data.get('theme', 'none'),
                                        'quality_score': puzzle_data.get('moderation_result', {}).get('quality_score', 0),
                                        'votes': puzzle_data.get('votes', {'thumbs_up': 0, 'total_votes': 0})
                                    }
                                    digest_data['approved_puzzles'].append(puzzle_summary)
                                    digest_data['community_stats']['active_constructors'].add(puzzle_data['author'])
                                    digest_data['community_stats']['total_votes'] += puzzle_data.get('votes', {}).get('thumbs_up', 0)
        
        # Convert set to count
        digest_data['community_stats']['active_constructors'] = len(digest_data['community_stats']['active_constructors'])
        digest_data['community_stats']['total_approved'] = len(digest_data['approved_puzzles'])
        
        # Get top voted puzzles
        digest_data['top_voted_puzzles'] = sorted(
            digest_data['approved_puzzles'], 
            key=lambda x: x['votes']['thumbs_up'], 
            reverse=True
        )[:3]
        
        # Get featured puzzle (Sunday Reader's Puzzle)
        sunday_puzzle_response = get_sunday_readers_puzzle()
        if sunday_puzzle_response[1] == 200:  # Success
            sunday_data = sunday_puzzle_response[0].get_json()
            if sunday_data.get('sunday_puzzle'):
                digest_data['featured_puzzle'] = sunday_data['sunday_puzzle']
        
        return jsonify({
            'success': True,
            'weekly_digest': digest_data
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to generate weekly digest: {str(e)}'
        }), 500

@community_bp.route('/moderation/stats', methods=['GET'])
def get_moderation_stats():
    """Get moderation statistics for admin dashboard"""
    try:
        days = int(request.args.get('days', 7))
        stats = lindy_moderator.get_moderation_stats(days)
        
        return jsonify({
            'success': True,
            'stats': stats,
            'period_days': days
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to get moderation stats: {str(e)}'
        }), 500

# Email automation functions (simulated)
def send_approval_email(submission_data):
    """Send approval email to puzzle constructor (simulated)"""
    print(f"📧 APPROVAL EMAIL: {submission_data['title']} by {submission_data['author']} has been approved!")
    
    email_log = {
        'type': 'approval',
        'recipient': submission_data.get('email', 'unknown'),
        'puzzle_id': submission_data['id'],
        'puzzle_title': submission_data['title'],
        'author': submission_data['author'],
        'timestamp': datetime.now().isoformat(),
        'quality_score': submission_data.get('moderation_result', {}).get('quality_score', 0)
    }
    
    log_email(email_log)

def send_rejection_email(submission_data):
    """Send rejection email with feedback (simulated)"""
    print(f"📧 REJECTION EMAIL: {submission_data['title']} by {submission_data['author']} needs improvement")
    
    email_log = {
        'type': 'rejection',
        'recipient': submission_data.get('email', 'unknown'),
        'puzzle_id': submission_data['id'],
        'puzzle_title': submission_data['title'],
        'author': submission_data['author'],
        'timestamp': datetime.now().isoformat(),
        'feedback': submission_data.get('moderation_result', {}).get('feedback', ''),
        'suggested_edits': submission_data.get('moderation_result', {}).get('suggested_edits', [])
    }
    
    log_email(email_log)

def send_review_notification_email(submission_data):
    """Send review notification email (simulated)"""
    print(f"📧 REVIEW EMAIL: {submission_data['title']} by {submission_data['author']} is under review")
    
    email_log = {
        'type': 'review_notification',
        'recipient': submission_data.get('email', 'unknown'),
        'puzzle_id': submission_data['id'],
        'puzzle_title': submission_data['title'],
        'author': submission_data['author'],
        'timestamp': datetime.now().isoformat(),
        'estimated_review_time': '2-3 business days'
    }
    
    log_email(email_log)

def log_email(email_log):
    """Log email for analytics and automation"""
    log_dir = '/home/ubuntu/daily-puzzle-post-github/community/email_logs'
    os.makedirs(log_dir, exist_ok=True)
    
    log_file = os.path.join(log_dir, f"emails_{datetime.now().strftime('%Y%m%d')}.jsonl")
    with open(log_file, 'a') as f:
        f.write(json.dumps(email_log) + '\n')

def get_estimated_review_time(status):
    """Get estimated review time based on status"""
    if status == 'approved':
        return 'Approved immediately'
    elif status == 'rejected':
        return 'Reviewed immediately'
    else:  # human_review
        return '2-3 business days'

def get_status_message(status):
    """Get user-friendly status message"""
    if status == 'approved':
        return 'Congratulations! Your puzzle has been approved and will appear in our community section.'
    elif status == 'rejected':
        return 'Your puzzle needs some improvements before publication. Please review the feedback and try again.'
    else:  # human_review
        return 'Your puzzle is being reviewed by our editorial team. You will receive an email with the decision.'

