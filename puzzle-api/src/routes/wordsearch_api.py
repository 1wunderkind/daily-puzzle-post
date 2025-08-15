"""
Word Search API Routes for Daily Puzzle Post
Provides endpoints for Lindy.ai automation and content management
"""

from flask import Blueprint, request, jsonify, current_app
import json
import os
from datetime import datetime, timedelta
import logging

# Create blueprint
wordsearch_api = Blueprint('wordsearch_api', __name__)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Base paths for Word Search data
WORDSEARCH_BANK_PATH = '/home/ubuntu/daily-puzzle-post-github/wordsearch/bank'
WORDSEARCH_DAILY_PATH = '/home/ubuntu/daily-puzzle-post-github/wordsearch/daily'

@wordsearch_api.route('/api/wordsearch/health', methods=['GET'])
def health_check():
    """Health check endpoint for Word Search API"""
    return jsonify({
        'status': 'healthy',
        'service': 'wordsearch_api',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0'
    })

@wordsearch_api.route('/api/wordsearch/today', methods=['GET'])
def get_todays_wordsearch():
    """Get today's Word Search puzzle"""
    try:
        # Calculate today's puzzle index
        launch_date = datetime(2025, 8, 19)
        today = datetime.now()
        days_since_launch = (today - launch_date).days
        puzzle_index = (days_since_launch % 30) + 1
        
        puzzle_id = f'wordsearch_{puzzle_index:02d}'
        puzzle_file = os.path.join(WORDSEARCH_BANK_PATH, f'{puzzle_id}.json')
        
        if os.path.exists(puzzle_file):
            with open(puzzle_file, 'r') as f:
                puzzle = json.load(f)
            
            # Update date to today
            puzzle['date'] = today.strftime('%Y-%m-%d')
            puzzle['isToday'] = True
            
            # Store as current puzzle
            current_file = os.path.join(WORDSEARCH_DAILY_PATH, 'current.json')
            current_data = {
                'puzzleId': puzzle_id,
                'date': puzzle['date'],
                'lastUpdated': datetime.now().isoformat(),
                'rotationCycle': (days_since_launch // 30) + 1,
                'dayInCycle': (days_since_launch % 30) + 1,
                'theme': puzzle['theme'],
                'difficulty': puzzle['difficulty'],
                'source': 'bank',
                'version': '1.0'
            }
            
            with open(current_file, 'w') as f:
                json.dump(current_data, f, indent=2)
            
            logger.info(f"Served today's Word Search: {puzzle_id}")
            return jsonify(puzzle)
        else:
            logger.error(f"Puzzle file not found: {puzzle_file}")
            return jsonify({'error': 'Puzzle not found'}), 404
            
    except Exception as e:
        logger.error(f"Error getting today's Word Search: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@wordsearch_api.route('/api/wordsearch/date/<date_string>', methods=['GET'])
def get_wordsearch_for_date(date_string):
    """Get Word Search puzzle for a specific date"""
    try:
        # Parse the date
        target_date = datetime.strptime(date_string, '%Y-%m-%d')
        launch_date = datetime(2025, 8, 19)
        
        days_since_launch = (target_date - launch_date).days
        if days_since_launch < 0:
            return jsonify({'error': 'Date is before launch date'}), 400
        
        puzzle_index = (days_since_launch % 30) + 1
        puzzle_id = f'wordsearch_{puzzle_index:02d}'
        puzzle_file = os.path.join(WORDSEARCH_BANK_PATH, f'{puzzle_id}.json')
        
        if os.path.exists(puzzle_file):
            with open(puzzle_file, 'r') as f:
                puzzle = json.load(f)
            
            puzzle['date'] = date_string
            puzzle['isToday'] = date_string == datetime.now().strftime('%Y-%m-%d')
            
            logger.info(f"Served Word Search for {date_string}: {puzzle_id}")
            return jsonify(puzzle)
        else:
            return jsonify({'error': 'Puzzle not found'}), 404
            
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    except Exception as e:
        logger.error(f"Error getting Word Search for date {date_string}: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@wordsearch_api.route('/api/wordsearch/inject', methods=['POST'])
def inject_wordsearch():
    """
    Inject new Word Search puzzle for Lindy.ai automation
    Replaces the oldest puzzle in the rotation
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['theme', 'words', 'grid', 'positions']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Validate puzzle structure
        validation_result = validate_wordsearch_data(data)
        if not validation_result['valid']:
            return jsonify({'error': validation_result['error']}), 400
        
        # Find the oldest puzzle to replace
        oldest_index = find_oldest_puzzle_index()
        
        # Generate new puzzle ID
        new_puzzle_id = f'wordsearch_{oldest_index:02d}'
        
        # Create puzzle data structure
        puzzle_data = {
            'id': new_puzzle_id,
            'date': datetime.now().strftime('%Y-%m-%d'),
            'theme': data['theme'],
            'difficulty': data.get('difficulty', 'medium'),
            'size': data.get('size', '15x15'),
            'words': data['words'],
            'grid': data['grid'],
            'positions': data['positions'],
            'estimated_time': data.get('estimated_time', '8-15 minutes'),
            'word_count': len(data['words']),
            'created_by': 'Lindy.ai Automation',
            'version': '1.0',
            'injected_at': datetime.now().isoformat()
        }
        
        # Save to bank
        puzzle_file = os.path.join(WORDSEARCH_BANK_PATH, f'{new_puzzle_id}.json')
        with open(puzzle_file, 'w') as f:
            json.dump(puzzle_data, f, indent=2)
        
        # Create backup of replaced puzzle
        backup_dir = os.path.join(WORDSEARCH_BANK_PATH, 'backups')
        os.makedirs(backup_dir, exist_ok=True)
        backup_file = os.path.join(backup_dir, f'{new_puzzle_id}_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json')
        
        if os.path.exists(puzzle_file):
            import shutil
            shutil.copy2(puzzle_file, backup_file)
        
        logger.info(f"Injected new Word Search puzzle: {new_puzzle_id}")
        
        return jsonify({
            'success': True,
            'puzzle_id': new_puzzle_id,
            'replaced_index': oldest_index,
            'backup_created': backup_file,
            'message': f'Successfully injected Word Search puzzle {new_puzzle_id}'
        })
        
    except Exception as e:
        logger.error(f"Error injecting Word Search puzzle: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@wordsearch_api.route('/api/wordsearch/bank', methods=['GET'])
def get_wordsearch_bank():
    """Get all Word Search puzzles in the bank"""
    try:
        puzzles = []
        
        for i in range(1, 31):
            puzzle_id = f'wordsearch_{i:02d}'
            puzzle_file = os.path.join(WORDSEARCH_BANK_PATH, f'{puzzle_id}.json')
            
            if os.path.exists(puzzle_file):
                with open(puzzle_file, 'r') as f:
                    puzzle = json.load(f)
                    
                # Include only metadata for bank listing
                puzzle_info = {
                    'id': puzzle['id'],
                    'theme': puzzle['theme'],
                    'difficulty': puzzle['difficulty'],
                    'word_count': puzzle['word_count'],
                    'estimated_time': puzzle['estimated_time'],
                    'created_by': puzzle.get('created_by', 'Unknown'),
                    'version': puzzle.get('version', '1.0')
                }
                puzzles.append(puzzle_info)
        
        return jsonify({
            'total_puzzles': len(puzzles),
            'puzzles': puzzles
        })
        
    except Exception as e:
        logger.error(f"Error getting Word Search bank: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@wordsearch_api.route('/api/wordsearch/rotation/status', methods=['GET'])
def get_rotation_status():
    """Get Word Search rotation system status"""
    try:
        launch_date = datetime(2025, 8, 19)
        today = datetime.now()
        days_since_launch = (today - launch_date).days
        
        current_index = (days_since_launch % 30) + 1
        cycle_number = (days_since_launch // 30) + 1
        day_in_cycle = (days_since_launch % 30) + 1
        
        # Calculate next rotation date
        days_until_reset = 30 - (days_since_launch % 30)
        next_rotation = today + timedelta(days=days_until_reset)
        
        status = {
            'launch_date': launch_date.strftime('%Y-%m-%d'),
            'current_date': today.strftime('%Y-%m-%d'),
            'days_since_launch': days_since_launch,
            'current_puzzle_index': current_index,
            'cycle_number': cycle_number,
            'day_in_cycle': day_in_cycle,
            'next_rotation_date': next_rotation.strftime('%Y-%m-%d'),
            'puzzle_bank': {
                'total_puzzles': 30,
                'current_puzzle': current_index,
                'remaining_in_cycle': 30 - day_in_cycle
            },
            'system_health': 'operational'
        }
        
        return jsonify(status)
        
    except Exception as e:
        logger.error(f"Error getting rotation status: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@wordsearch_api.route('/api/wordsearch/validate', methods=['POST'])
def validate_wordsearch():
    """Validate Word Search puzzle data structure"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        validation_result = validate_wordsearch_data(data)
        
        return jsonify(validation_result)
        
    except Exception as e:
        logger.error(f"Error validating Word Search: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@wordsearch_api.route('/api/wordsearch/backup', methods=['POST'])
def create_backup():
    """Create backup of Word Search puzzle bank"""
    try:
        backup_dir = os.path.join(WORDSEARCH_BANK_PATH, 'backups')
        os.makedirs(backup_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_file = os.path.join(backup_dir, f'wordsearch_bank_backup_{timestamp}.json')
        
        # Collect all puzzles
        all_puzzles = {}
        
        for i in range(1, 31):
            puzzle_id = f'wordsearch_{i:02d}'
            puzzle_file = os.path.join(WORDSEARCH_BANK_PATH, f'{puzzle_id}.json')
            
            if os.path.exists(puzzle_file):
                with open(puzzle_file, 'r') as f:
                    all_puzzles[puzzle_id] = json.load(f)
        
        # Save backup
        backup_data = {
            'backup_timestamp': datetime.now().isoformat(),
            'total_puzzles': len(all_puzzles),
            'puzzles': all_puzzles
        }
        
        with open(backup_file, 'w') as f:
            json.dump(backup_data, f, indent=2)
        
        logger.info(f"Created Word Search backup: {backup_file}")
        
        return jsonify({
            'success': True,
            'backup_file': backup_file,
            'puzzles_backed_up': len(all_puzzles),
            'timestamp': timestamp
        })
        
    except Exception as e:
        logger.error(f"Error creating backup: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@wordsearch_api.route('/api/wordsearch/analytics', methods=['GET'])
def get_analytics():
    """Get Word Search analytics and statistics"""
    try:
        # Analyze puzzle bank
        themes = {}
        difficulties = {}
        word_counts = []
        
        for i in range(1, 31):
            puzzle_id = f'wordsearch_{i:02d}'
            puzzle_file = os.path.join(WORDSEARCH_BANK_PATH, f'{puzzle_id}.json')
            
            if os.path.exists(puzzle_file):
                with open(puzzle_file, 'r') as f:
                    puzzle = json.load(f)
                    
                # Count themes
                theme = puzzle['theme']
                themes[theme] = themes.get(theme, 0) + 1
                
                # Count difficulties
                difficulty = puzzle['difficulty']
                difficulties[difficulty] = difficulties.get(difficulty, 0) + 1
                
                # Collect word counts
                word_counts.append(puzzle['word_count'])
        
        analytics = {
            'total_puzzles': len(word_counts),
            'themes': themes,
            'difficulties': difficulties,
            'word_count_stats': {
                'average': sum(word_counts) / len(word_counts) if word_counts else 0,
                'min': min(word_counts) if word_counts else 0,
                'max': max(word_counts) if word_counts else 0
            },
            'rotation_info': get_rotation_status().get_json()
        }
        
        return jsonify(analytics)
        
    except Exception as e:
        logger.error(f"Error getting analytics: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

# Helper functions

def validate_wordsearch_data(data):
    """Validate Word Search puzzle data structure"""
    try:
        # Check required fields
        required_fields = ['theme', 'words', 'grid', 'positions']
        for field in required_fields:
            if field not in data:
                return {'valid': False, 'error': f'Missing required field: {field}'}
        
        # Validate grid
        grid = data['grid']
        if not isinstance(grid, list) or len(grid) != 15:
            return {'valid': False, 'error': 'Grid must be 15x15 array'}
        
        for row in grid:
            if not isinstance(row, list) or len(row) != 15:
                return {'valid': False, 'error': 'Each grid row must have 15 columns'}
        
        # Validate words
        words = data['words']
        if not isinstance(words, list) or len(words) == 0:
            return {'valid': False, 'error': 'Words must be non-empty array'}
        
        # Validate positions
        positions = data['positions']
        if not isinstance(positions, list) or len(positions) != len(words):
            return {'valid': False, 'error': 'Positions array must match words array length'}
        
        # Validate each position
        for position in positions:
            if not all(key in position for key in ['word', 'start', 'end', 'positions']):
                return {'valid': False, 'error': 'Invalid position data structure'}
            
            if position['word'] not in words:
                return {'valid': False, 'error': f'Position word "{position["word"]}" not in words array'}
        
        return {'valid': True}
        
    except Exception as e:
        return {'valid': False, 'error': f'Validation error: {str(e)}'}

def find_oldest_puzzle_index():
    """Find the oldest puzzle index for replacement"""
    # For now, use a simple round-robin approach
    # In a real implementation, this could check file modification times
    # or use a more sophisticated algorithm
    
    current_time = datetime.now()
    # Use current day of month to determine which puzzle to replace
    return (current_time.day % 30) + 1

# Error handlers
@wordsearch_api.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@wordsearch_api.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

