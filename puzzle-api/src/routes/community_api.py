from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import json
import os
import uuid
import re
from werkzeug.utils import secure_filename

# Create blueprint
community_bp = Blueprint('community', __name__)

# Configuration
COMMUNITY_DATA_DIR = '/home/ubuntu/daily-puzzle-post-github/community'
MODERATION_QUEUE_DIR = os.path.join(COMMUNITY_DATA_DIR, 'moderation_queue')
APPROVED_PUZZLES_DIR = os.path.join(COMMUNITY_DATA_DIR, 'approved')
REJECTED_PUZZLES_DIR = os.path.join(COMMUNITY_DATA_DIR, 'rejected')
FEATURED_PUZZLES_DIR = os.path.join(COMMUNITY_DATA_DIR, 'featured')

# Ensure directories exist
for directory in [COMMUNITY_DATA_DIR, MODERATION_QUEUE_DIR, APPROVED_PUZZLES_DIR, REJECTED_PUZZLES_DIR, FEATURED_PUZZLES_DIR]:
    os.makedirs(directory, exist_ok=True)

# Inappropriate content filter (basic)
INAPPROPRIATE_WORDS = [
    'damn', 'hell', 'hate', 'kill', 'death', 'murder', 'violence',
    'racist', 'sexist', 'offensive', 'inappropriate', 'vulgar'
]

@community_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for community system"""
    return jsonify({
        'status': 'healthy',
        'service': 'community_content',
        'timestamp': datetime.now().isoformat(),
        'moderation_queue_size': len(os.listdir(MODERATION_QUEUE_DIR)),
        'approved_puzzles': len(os.listdir(APPROVED_PUZZLES_DIR))
    })

@community_bp.route('/submit-puzzle', methods=['POST'])
def submit_puzzle():
    """Submit a user-created puzzle for moderation"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'grid', 'clues', 'author']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Generate unique puzzle ID
        puzzle_id = str(uuid.uuid4())
        
        # Create puzzle submission
        submission = {
            'id': puzzle_id,
            'title': data['title'],
            'author': data['author'],
            'grid': data['grid'],
            'clues': data['clues'],
            'difficulty': data.get('difficulty', 'medium'),
            'theme': data.get('theme', ''),
            'description': data.get('description', ''),
            'submitted_at': datetime.now().isoformat(),
            'status': 'pending_moderation',
            'moderation_notes': [],
            'submission_ip': request.remote_addr,
            'user_agent': request.headers.get('User-Agent', ''),
            'metadata': {
                'word_count': count_words_in_puzzle(data['grid'], data['clues']),
                'grid_size': f"{len(data['grid'])}x{len(data['grid'][0])}",
                'has_theme': bool(data.get('theme', '')),
                'clue_count': count_clues(data['clues'])
            }
        }
        
        # Basic content validation
        validation_result = validate_puzzle_content(submission)
        if not validation_result['is_valid']:
            return jsonify({
                'error': 'Puzzle content validation failed',
                'issues': validation_result['issues']
            }), 400
        
        # Save to moderation queue
        queue_file = os.path.join(MODERATION_QUEUE_DIR, f'{puzzle_id}.json')
        with open(queue_file, 'w') as f:
            json.dump(submission, f, indent=2)
        
        # Log submission for analytics
        log_puzzle_submission(submission)
        
        return jsonify({
            'success': True,
            'puzzle_id': puzzle_id,
            'message': 'Puzzle submitted successfully for moderation',
            'estimated_review_time': '24-48 hours'
        })
        
    except Exception as e:
        return jsonify({'error': f'Submission failed: {str(e)}'}), 500

@community_bp.route('/moderation-queue', methods=['GET'])
def get_moderation_queue():
    """Get puzzles in moderation queue (for admin/Lindy.ai)"""
    try:
        queue_files = os.listdir(MODERATION_QUEUE_DIR)
        puzzles = []
        
        for filename in queue_files:
            if filename.endswith('.json'):
                file_path = os.path.join(MODERATION_QUEUE_DIR, filename)
                with open(file_path, 'r') as f:
                    puzzle = json.load(f)
                    # Add summary info only
                    puzzles.append({
                        'id': puzzle['id'],
                        'title': puzzle['title'],
                        'author': puzzle['author'],
                        'submitted_at': puzzle['submitted_at'],
                        'word_count': puzzle['metadata']['word_count'],
                        'difficulty': puzzle['difficulty'],
                        'theme': puzzle.get('theme', ''),
                        'status': puzzle['status']
                    })
        
        # Sort by submission date (newest first)
        puzzles.sort(key=lambda x: x['submitted_at'], reverse=True)
        
        return jsonify({
            'success': True,
            'queue_size': len(puzzles),
            'puzzles': puzzles
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to get moderation queue: {str(e)}'}), 500

@community_bp.route('/moderate-puzzle/<puzzle_id>', methods=['POST'])
def moderate_puzzle(puzzle_id):
    """Moderate a puzzle (approve/reject) - for Lindy.ai automation"""
    try:
        data = request.get_json()
        action = data.get('action')  # 'approve' or 'reject'
        notes = data.get('notes', '')
        moderator = data.get('moderator', 'lindy_ai')
        
        if action not in ['approve', 'reject']:
            return jsonify({'error': 'Action must be "approve" or "reject"'}), 400
        
        # Load puzzle from moderation queue
        queue_file = os.path.join(MODERATION_QUEUE_DIR, f'{puzzle_id}.json')
        if not os.path.exists(queue_file):
            return jsonify({'error': 'Puzzle not found in moderation queue'}), 404
        
        with open(queue_file, 'r') as f:
            puzzle = json.load(f)
        
        # Update puzzle with moderation decision
        puzzle['status'] = 'approved' if action == 'approve' else 'rejected'
        puzzle['moderated_at'] = datetime.now().isoformat()
        puzzle['moderator'] = moderator
        puzzle['moderation_notes'].append({
            'action': action,
            'notes': notes,
            'timestamp': datetime.now().isoformat(),
            'moderator': moderator
        })
        
        # Move to appropriate directory
        if action == 'approve':
            target_dir = APPROVED_PUZZLES_DIR
            # Add to community rotation if approved
            add_to_community_rotation(puzzle)
        else:
            target_dir = REJECTED_PUZZLES_DIR
        
        target_file = os.path.join(target_dir, f'{puzzle_id}.json')
        with open(target_file, 'w') as f:
            json.dump(puzzle, f, indent=2)
        
        # Remove from moderation queue
        os.remove(queue_file)
        
        # Log moderation decision
        log_moderation_decision(puzzle, action, moderator)
        
        return jsonify({
            'success': True,
            'puzzle_id': puzzle_id,
            'action': action,
            'message': f'Puzzle {action}d successfully'
        })
        
    except Exception as e:
        return jsonify({'error': f'Moderation failed: {str(e)}'}), 500

@community_bp.route('/approved-puzzles', methods=['GET'])
def get_approved_puzzles():
    """Get approved community puzzles"""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        theme_filter = request.args.get('theme', '')
        difficulty_filter = request.args.get('difficulty', '')
        
        approved_files = os.listdir(APPROVED_PUZZLES_DIR)
        puzzles = []
        
        for filename in approved_files:
            if filename.endswith('.json'):
                file_path = os.path.join(APPROVED_PUZZLES_DIR, filename)
                with open(file_path, 'r') as f:
                    puzzle = json.load(f)
                    
                    # Apply filters
                    if theme_filter and puzzle.get('theme', '').lower() != theme_filter.lower():
                        continue
                    if difficulty_filter and puzzle.get('difficulty', '') != difficulty_filter:
                        continue
                    
                    # Add public info only
                    puzzles.append({
                        'id': puzzle['id'],
                        'title': puzzle['title'],
                        'author': puzzle['author'],
                        'difficulty': puzzle['difficulty'],
                        'theme': puzzle.get('theme', ''),
                        'description': puzzle.get('description', ''),
                        'word_count': puzzle['metadata']['word_count'],
                        'grid_size': puzzle['metadata']['grid_size'],
                        'approved_at': puzzle.get('moderated_at', ''),
                        'play_count': puzzle.get('play_count', 0),
                        'rating': puzzle.get('average_rating', 0)
                    })
        
        # Sort by approval date (newest first)
        puzzles.sort(key=lambda x: x['approved_at'], reverse=True)
        
        # Pagination
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        paginated_puzzles = puzzles[start_idx:end_idx]
        
        return jsonify({
            'success': True,
            'puzzles': paginated_puzzles,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': len(puzzles),
                'pages': (len(puzzles) + per_page - 1) // per_page
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to get approved puzzles: {str(e)}'}), 500

@community_bp.route('/puzzle/<puzzle_id>', methods=['GET'])
def get_puzzle_details(puzzle_id):
    """Get full puzzle details for playing"""
    try:
        # Check approved puzzles first
        approved_file = os.path.join(APPROVED_PUZZLES_DIR, f'{puzzle_id}.json')
        featured_file = os.path.join(FEATURED_PUZZLES_DIR, f'{puzzle_id}.json')
        
        puzzle_file = None
        if os.path.exists(approved_file):
            puzzle_file = approved_file
        elif os.path.exists(featured_file):
            puzzle_file = featured_file
        
        if not puzzle_file:
            return jsonify({'error': 'Puzzle not found'}), 404
        
        with open(puzzle_file, 'r') as f:
            puzzle = json.load(f)
        
        # Increment play count
        puzzle['play_count'] = puzzle.get('play_count', 0) + 1
        puzzle['last_played'] = datetime.now().isoformat()
        
        # Save updated play count
        with open(puzzle_file, 'w') as f:
            json.dump(puzzle, f, indent=2)
        
        # Return puzzle data for playing
        return jsonify({
            'success': True,
            'puzzle': {
                'id': puzzle['id'],
                'title': puzzle['title'],
                'author': puzzle['author'],
                'difficulty': puzzle['difficulty'],
                'theme': puzzle.get('theme', ''),
                'description': puzzle.get('description', ''),
                'grid': puzzle['grid'],
                'clues': puzzle['clues'],
                'metadata': puzzle['metadata'],
                'play_count': puzzle['play_count']
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to get puzzle: {str(e)}'}), 500

@community_bp.route('/featured-puzzle', methods=['GET'])
def get_featured_puzzle():
    """Get current featured puzzle (Reader's Puzzle of the Week)"""
    try:
        # Get current week's featured puzzle
        week_key = get_week_key()
        featured_file = os.path.join(FEATURED_PUZZLES_DIR, f'week_{week_key}.json')
        
        if os.path.exists(featured_file):
            with open(featured_file, 'r') as f:
                featured_data = json.load(f)
            
            # Get full puzzle details
            puzzle_file = os.path.join(APPROVED_PUZZLES_DIR, f"{featured_data['puzzle_id']}.json")
            if os.path.exists(puzzle_file):
                with open(puzzle_file, 'r') as f:
                    puzzle = json.load(f)
                
                return jsonify({
                    'success': True,
                    'featured_puzzle': {
                        'id': puzzle['id'],
                        'title': puzzle['title'],
                        'author': puzzle['author'],
                        'difficulty': puzzle['difficulty'],
                        'theme': puzzle.get('theme', ''),
                        'description': puzzle.get('description', ''),
                        'grid': puzzle['grid'],
                        'clues': puzzle['clues'],
                        'featured_week': week_key,
                        'featured_reason': featured_data.get('reason', 'Selected by our editorial team')
                    }
                })
        
        # No featured puzzle for this week
        return jsonify({
            'success': True,
            'featured_puzzle': None,
            'message': 'No featured puzzle for this week'
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to get featured puzzle: {str(e)}'}), 500

@community_bp.route('/lindy/auto-moderate', methods=['POST'])
def lindy_auto_moderate():
    """Lindy.ai automated moderation endpoint"""
    try:
        data = request.get_json()
        batch_size = data.get('batch_size', 5)
        
        # Get puzzles from moderation queue
        queue_files = os.listdir(MODERATION_QUEUE_DIR)[:batch_size]
        results = []
        
        for filename in queue_files:
            if filename.endswith('.json'):
                file_path = os.path.join(MODERATION_QUEUE_DIR, filename)
                with open(file_path, 'r') as f:
                    puzzle = json.load(f)
                
                # Automated moderation logic
                moderation_result = auto_moderate_puzzle(puzzle)
                
                # Apply moderation decision
                if moderation_result['action'] in ['approve', 'reject']:
                    moderate_result = moderate_puzzle_internal(
                        puzzle['id'], 
                        moderation_result['action'],
                        moderation_result['notes'],
                        'lindy_ai_auto'
                    )
                    results.append({
                        'puzzle_id': puzzle['id'],
                        'title': puzzle['title'],
                        'action': moderation_result['action'],
                        'confidence': moderation_result['confidence'],
                        'notes': moderation_result['notes']
                    })
        
        return jsonify({
            'success': True,
            'processed': len(results),
            'results': results
        })
        
    except Exception as e:
        return jsonify({'error': f'Auto-moderation failed: {str(e)}'}), 500

# Helper functions
def count_words_in_puzzle(grid, clues):
    """Count total words in puzzle"""
    across_count = len(clues.get('across', {}))
    down_count = len(clues.get('down', {}))
    return across_count + down_count

def count_clues(clues):
    """Count total clues"""
    return count_words_in_puzzle([], clues)

def validate_puzzle_content(puzzle):
    """Basic content validation"""
    issues = []
    
    # Check for inappropriate content
    all_text = json.dumps(puzzle).lower()
    for word in INAPPROPRIATE_WORDS:
        if word in all_text:
            issues.append(f'Contains potentially inappropriate content: {word}')
    
    # Check puzzle structure
    if not puzzle.get('grid') or not puzzle.get('clues'):
        issues.append('Missing grid or clues')
    
    # Check minimum word count
    word_count = puzzle['metadata']['word_count']
    if word_count < 5:
        issues.append('Puzzle must have at least 5 words')
    
    # Check title length
    if len(puzzle.get('title', '')) < 3:
        issues.append('Title must be at least 3 characters')
    
    return {
        'is_valid': len(issues) == 0,
        'issues': issues
    }

def add_to_community_rotation(puzzle):
    """Add approved puzzle to community rotation"""
    rotation_file = os.path.join(COMMUNITY_DATA_DIR, 'rotation.json')
    
    if os.path.exists(rotation_file):
        with open(rotation_file, 'r') as f:
            rotation = json.load(f)
    else:
        rotation = {'puzzles': []}
    
    # Add puzzle to rotation
    rotation['puzzles'].append({
        'id': puzzle['id'],
        'title': puzzle['title'],
        'author': puzzle['author'],
        'difficulty': puzzle['difficulty'],
        'added_at': datetime.now().isoformat()
    })
    
    with open(rotation_file, 'w') as f:
        json.dump(rotation, f, indent=2)

def log_puzzle_submission(puzzle):
    """Log puzzle submission for analytics"""
    log_entry = {
        'event': 'puzzle_submitted',
        'puzzle_id': puzzle['id'],
        'author': puzzle['author'],
        'word_count': puzzle['metadata']['word_count'],
        'difficulty': puzzle['difficulty'],
        'has_theme': puzzle['metadata']['has_theme'],
        'timestamp': datetime.now().isoformat()
    }
    
    log_file = os.path.join(COMMUNITY_DATA_DIR, 'submission_log.jsonl')
    with open(log_file, 'a') as f:
        f.write(json.dumps(log_entry) + '\n')

def log_moderation_decision(puzzle, action, moderator):
    """Log moderation decision for analytics"""
    log_entry = {
        'event': 'puzzle_moderated',
        'puzzle_id': puzzle['id'],
        'action': action,
        'moderator': moderator,
        'word_count': puzzle['metadata']['word_count'],
        'difficulty': puzzle['difficulty'],
        'timestamp': datetime.now().isoformat()
    }
    
    log_file = os.path.join(COMMUNITY_DATA_DIR, 'moderation_log.jsonl')
    with open(log_file, 'a') as f:
        f.write(json.dumps(log_entry) + '\n')

def get_week_key():
    """Get current week key for featured puzzles"""
    now = datetime.now()
    year = now.year
    week = now.isocalendar()[1]
    return f'{year}W{week:02d}'

def auto_moderate_puzzle(puzzle):
    """Automated moderation logic for Lindy.ai"""
    confidence = 0.8
    issues = []
    
    # Check content appropriateness
    all_text = json.dumps(puzzle).lower()
    inappropriate_found = False
    for word in INAPPROPRIATE_WORDS:
        if word in all_text:
            issues.append(f'Contains inappropriate content: {word}')
            inappropriate_found = True
    
    # Check puzzle quality
    word_count = puzzle['metadata']['word_count']
    if word_count < 8:
        issues.append('Too few words for quality puzzle')
        confidence -= 0.2
    
    # Check clue quality (basic)
    clues = puzzle.get('clues', {})
    total_clues = len(clues.get('across', {})) + len(clues.get('down', {}))
    if total_clues < word_count:
        issues.append('Missing clues for some words')
        confidence -= 0.3
    
    # Make decision
    if inappropriate_found:
        action = 'reject'
        notes = 'Rejected due to inappropriate content'
    elif confidence < 0.5:
        action = 'reject'
        notes = f'Rejected due to quality issues: {"; ".join(issues)}'
    else:
        action = 'approve'
        notes = 'Approved by automated moderation'
    
    return {
        'action': action,
        'confidence': confidence,
        'notes': notes,
        'issues': issues
    }

def moderate_puzzle_internal(puzzle_id, action, notes, moderator):
    """Internal moderation function"""
    queue_file = os.path.join(MODERATION_QUEUE_DIR, f'{puzzle_id}.json')
    if not os.path.exists(queue_file):
        return False
    
    with open(queue_file, 'r') as f:
        puzzle = json.load(f)
    
    # Update puzzle
    puzzle['status'] = 'approved' if action == 'approve' else 'rejected'
    puzzle['moderated_at'] = datetime.now().isoformat()
    puzzle['moderator'] = moderator
    puzzle['moderation_notes'].append({
        'action': action,
        'notes': notes,
        'timestamp': datetime.now().isoformat(),
        'moderator': moderator
    })
    
    # Move to appropriate directory
    target_dir = APPROVED_PUZZLES_DIR if action == 'approve' else REJECTED_PUZZLES_DIR
    target_file = os.path.join(target_dir, f'{puzzle_id}.json')
    
    with open(target_file, 'w') as f:
        json.dump(puzzle, f, indent=2)
    
    # Remove from queue
    os.remove(queue_file)
    
    # Add to rotation if approved
    if action == 'approve':
        add_to_community_rotation(puzzle)
    
    return True

