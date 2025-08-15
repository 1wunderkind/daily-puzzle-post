"""
Anagram API Routes for Daily Puzzle Post
Provides endpoints for Lindy.ai automation and content management
"""

from flask import Blueprint, request, jsonify, current_app
import json
import os
from datetime import datetime, timedelta
import logging
import random
import re

# Create blueprint
anagram_api = Blueprint('anagram_api', __name__)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Base paths for Anagram data
ANAGRAM_BANK_PATH = '/home/ubuntu/daily-puzzle-post-github/anagrams/bank'
ANAGRAM_DAILY_PATH = '/home/ubuntu/daily-puzzle-post-github/anagrams/daily'

@anagram_api.route('/api/anagram/health', methods=['GET'])
def health_check():
    """Health check endpoint for Anagram API"""
    return jsonify({
        'status': 'healthy',
        'service': 'anagram_api',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0'
    })

@anagram_api.route('/api/anagram/today', methods=['GET'])
def get_todays_anagram():
    """Get today's Anagram puzzle"""
    try:
        # Calculate today's puzzle index
        launch_date = datetime(2025, 8, 19)
        today = datetime.now()
        days_since_launch = (today - launch_date).days
        puzzle_index = (days_since_launch % 30) + 1
        
        puzzle_id = f'anagram_{puzzle_index:02d}'
        puzzle_file = os.path.join(ANAGRAM_BANK_PATH, f'{puzzle_id}.json')
        
        if os.path.exists(puzzle_file):
            with open(puzzle_file, 'r') as f:
                puzzle = json.load(f)
            
            # Update date to today
            puzzle['date'] = today.strftime('%Y-%m-%d')
            puzzle['isToday'] = True
            
            # Store as current puzzle
            current_file = os.path.join(ANAGRAM_DAILY_PATH, 'current.json')
            current_data = {
                'puzzleId': puzzle_id,
                'date': puzzle['date'],
                'lastUpdated': datetime.now().isoformat(),
                'rotationCycle': (days_since_launch // 30) + 1,
                'dayInCycle': (days_since_launch % 30) + 1,
                'originalWord': puzzle['originalWord'],
                'difficulty': puzzle['difficulty'],
                'category': puzzle['category'],
                'source': 'bank',
                'version': '1.0'
            }
            
            with open(current_file, 'w') as f:
                json.dump(current_data, f, indent=2)
            
            logger.info(f"Served today's Anagram: {puzzle_id}")
            return jsonify(puzzle)
        else:
            logger.error(f"Puzzle file not found: {puzzle_file}")
            return jsonify({'error': 'Puzzle not found'}), 404
            
    except Exception as e:
        logger.error(f"Error getting today's Anagram: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@anagram_api.route('/api/anagram/date/<date_string>', methods=['GET'])
def get_anagram_for_date(date_string):
    """Get Anagram puzzle for a specific date"""
    try:
        # Parse the date
        target_date = datetime.strptime(date_string, '%Y-%m-%d')
        launch_date = datetime(2025, 8, 19)
        
        days_since_launch = (target_date - launch_date).days
        if days_since_launch < 0:
            return jsonify({'error': 'Date is before launch date'}), 400
        
        puzzle_index = (days_since_launch % 30) + 1
        puzzle_id = f'anagram_{puzzle_index:02d}'
        puzzle_file = os.path.join(ANAGRAM_BANK_PATH, f'{puzzle_id}.json')
        
        if os.path.exists(puzzle_file):
            with open(puzzle_file, 'r') as f:
                puzzle = json.load(f)
            
            puzzle['date'] = date_string
            puzzle['isToday'] = date_string == datetime.now().strftime('%Y-%m-%d')
            
            logger.info(f"Served Anagram for {date_string}: {puzzle_id}")
            return jsonify(puzzle)
        else:
            return jsonify({'error': 'Puzzle not found'}), 404
            
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    except Exception as e:
        logger.error(f"Error getting Anagram for date {date_string}: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@anagram_api.route('/api/anagram/inject', methods=['POST'])
def inject_anagram():
    """
    Inject new Anagram puzzle for Lindy.ai automation
    Replaces the oldest puzzle in the rotation
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['originalWord', 'scrambledWord', 'definition', 'category']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Validate puzzle structure
        validation_result = validate_anagram_data(data)
        if not validation_result['valid']:
            return jsonify({'error': validation_result['error']}), 400
        
        # Find the oldest puzzle to replace
        oldest_index = find_oldest_puzzle_index()
        
        # Generate new puzzle ID
        new_puzzle_id = f'anagram_{oldest_index:02d}'
        
        # Create puzzle data structure
        puzzle_data = {
            'id': new_puzzle_id,
            'date': datetime.now().strftime('%Y-%m-%d'),
            'originalWord': data['originalWord'].upper(),
            'scrambledWord': data['scrambledWord'].upper(),
            'definition': data['definition'],
            'difficulty': data.get('difficulty', 'medium'),
            'category': data['category'],
            'hint': data.get('hint', ''),
            'wordLength': len(data['originalWord']),
            'estimated_time': data.get('estimated_time', '2-5 minutes'),
            'created_by': 'Lindy.ai Automation',
            'version': '1.0',
            'injected_at': datetime.now().isoformat()
        }
        
        # Save to bank
        puzzle_file = os.path.join(ANAGRAM_BANK_PATH, f'{new_puzzle_id}.json')
        with open(puzzle_file, 'w') as f:
            json.dump(puzzle_data, f, indent=2)
        
        # Create backup of replaced puzzle
        backup_dir = os.path.join(ANAGRAM_BANK_PATH, 'backups')
        os.makedirs(backup_dir, exist_ok=True)
        backup_file = os.path.join(backup_dir, f'{new_puzzle_id}_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json')
        
        if os.path.exists(puzzle_file):
            import shutil
            shutil.copy2(puzzle_file, backup_file)
        
        logger.info(f"Injected new Anagram puzzle: {new_puzzle_id}")
        
        return jsonify({
            'success': True,
            'puzzle_id': new_puzzle_id,
            'replaced_index': oldest_index,
            'backup_created': backup_file,
            'message': f'Successfully injected Anagram puzzle {new_puzzle_id}'
        })
        
    except Exception as e:
        logger.error(f"Error injecting Anagram puzzle: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@anagram_api.route('/api/anagram/bank', methods=['GET'])
def get_anagram_bank():
    """Get all Anagram puzzles in the bank"""
    try:
        puzzles = []
        
        for i in range(1, 31):
            puzzle_id = f'anagram_{i:02d}'
            puzzle_file = os.path.join(ANAGRAM_BANK_PATH, f'{puzzle_id}.json')
            
            if os.path.exists(puzzle_file):
                with open(puzzle_file, 'r') as f:
                    puzzle = json.load(f)
                    
                # Include only metadata for bank listing
                puzzle_info = {
                    'id': puzzle['id'],
                    'originalWord': puzzle['originalWord'],
                    'difficulty': puzzle['difficulty'],
                    'category': puzzle['category'],
                    'wordLength': puzzle['wordLength'],
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
        logger.error(f"Error getting Anagram bank: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@anagram_api.route('/api/anagram/rotation/status', methods=['GET'])
def get_rotation_status():
    """Get Anagram rotation system status"""
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

@anagram_api.route('/api/anagram/validate', methods=['POST'])
def validate_anagram():
    """Validate Anagram puzzle data structure"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        validation_result = validate_anagram_data(data)
        
        return jsonify(validation_result)
        
    except Exception as e:
        logger.error(f"Error validating Anagram: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@anagram_api.route('/api/anagram/generate-scramble', methods=['POST'])
def generate_scramble():
    """Generate scrambled version of a word for Lindy.ai"""
    try:
        data = request.get_json()
        
        if not data or 'word' not in data:
            return jsonify({'error': 'Word is required'}), 400
        
        word = data['word'].upper().strip()
        
        if len(word) < 3:
            return jsonify({'error': 'Word must be at least 3 characters long'}), 400
        
        if not word.isalpha():
            return jsonify({'error': 'Word must contain only letters'}), 400
        
        # Generate multiple scramble options
        scrambles = []
        for i in range(5):
            scrambled = scramble_word(word)
            if scrambled != word and scrambled not in scrambles:
                scrambles.append(scrambled)
        
        # Remove duplicates and ensure we don't return the original word
        unique_scrambles = list(set(scrambles))
        valid_scrambles = [s for s in unique_scrambles if s != word]
        
        if not valid_scrambles:
            # Fallback scrambling method
            valid_scrambles = [fallback_scramble(word)]
        
        return jsonify({
            'original_word': word,
            'scrambled_options': valid_scrambles[:3],  # Return top 3 options
            'recommended': valid_scrambles[0] if valid_scrambles else fallback_scramble(word)
        })
        
    except Exception as e:
        logger.error(f"Error generating scramble: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@anagram_api.route('/api/anagram/categories', methods=['GET'])
def get_anagram_categories():
    """Get available anagram categories for Lindy.ai content generation"""
    try:
        categories = [
            {
                'name': 'Animals',
                'description': 'Wildlife and pets',
                'difficulty': 'Easy',
                'examples': ['CAT', 'DOG', 'BIRD', 'FISH']
            },
            {
                'name': 'Food',
                'description': 'Cuisine and ingredients',
                'difficulty': 'Easy',
                'examples': ['APPLE', 'BREAD', 'CHEESE', 'PIZZA']
            },
            {
                'name': 'Colors',
                'description': 'Rainbow and shades',
                'difficulty': 'Easy',
                'examples': ['RED', 'BLUE', 'GREEN', 'YELLOW']
            },
            {
                'name': 'Sports',
                'description': 'Athletic activities',
                'difficulty': 'Medium',
                'examples': ['SOCCER', 'TENNIS', 'GOLF', 'SWIM']
            },
            {
                'name': 'Nature',
                'description': 'Natural landscapes',
                'difficulty': 'Medium',
                'examples': ['TREE', 'FLOWER', 'RIVER', 'MOUNTAIN']
            },
            {
                'name': 'Technology',
                'description': 'Digital age terms',
                'difficulty': 'Hard',
                'examples': ['COMPUTER', 'INTERNET', 'SOFTWARE', 'DATABASE']
            },
            {
                'name': 'Science',
                'description': 'Scientific terms',
                'difficulty': 'Hard',
                'examples': ['CHEMISTRY', 'BIOLOGY', 'PHYSICS', 'ASTRONOMY']
            },
            {
                'name': 'Geography',
                'description': 'Places and locations',
                'difficulty': 'Medium',
                'examples': ['COUNTRY', 'CITY', 'OCEAN', 'CONTINENT']
            }
        ]
        
        return jsonify({
            'categories': categories,
            'total_categories': len(categories),
            'recommended_rotation': 'Daily category rotation for variety'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@anagram_api.route('/api/anagram/backup', methods=['POST'])
def create_backup():
    """Create backup of Anagram puzzle bank"""
    try:
        backup_dir = os.path.join(ANAGRAM_BANK_PATH, 'backups')
        os.makedirs(backup_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_file = os.path.join(backup_dir, f'anagram_bank_backup_{timestamp}.json')
        
        # Collect all puzzles
        all_puzzles = {}
        
        for i in range(1, 31):
            puzzle_id = f'anagram_{i:02d}'
            puzzle_file = os.path.join(ANAGRAM_BANK_PATH, f'{puzzle_id}.json')
            
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
        
        logger.info(f"Created Anagram backup: {backup_file}")
        
        return jsonify({
            'success': True,
            'backup_file': backup_file,
            'puzzles_backed_up': len(all_puzzles),
            'timestamp': timestamp
        })
        
    except Exception as e:
        logger.error(f"Error creating backup: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@anagram_api.route('/api/anagram/analytics', methods=['GET'])
def get_analytics():
    """Get Anagram analytics and statistics"""
    try:
        # Analyze puzzle bank
        categories = {}
        difficulties = {}
        word_lengths = []
        
        for i in range(1, 31):
            puzzle_id = f'anagram_{i:02d}'
            puzzle_file = os.path.join(ANAGRAM_BANK_PATH, f'{puzzle_id}.json')
            
            if os.path.exists(puzzle_file):
                with open(puzzle_file, 'r') as f:
                    puzzle = json.load(f)
                    
                # Count categories
                category = puzzle['category']
                categories[category] = categories.get(category, 0) + 1
                
                # Count difficulties
                difficulty = puzzle['difficulty']
                difficulties[difficulty] = difficulties.get(difficulty, 0) + 1
                
                # Collect word lengths
                word_lengths.append(puzzle['wordLength'])
        
        analytics = {
            'total_puzzles': len(word_lengths),
            'categories': categories,
            'difficulties': difficulties,
            'word_length_stats': {
                'average': sum(word_lengths) / len(word_lengths) if word_lengths else 0,
                'min': min(word_lengths) if word_lengths else 0,
                'max': max(word_lengths) if word_lengths else 0
            },
            'rotation_info': get_rotation_status().get_json()
        }
        
        return jsonify(analytics)
        
    except Exception as e:
        logger.error(f"Error getting analytics: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

# Helper functions

def validate_anagram_data(data):
    """Validate Anagram puzzle data structure"""
    try:
        # Check required fields
        required_fields = ['originalWord', 'scrambledWord', 'definition', 'category']
        for field in required_fields:
            if field not in data:
                return {'valid': False, 'error': f'Missing required field: {field}'}
        
        # Validate word format
        original = data['originalWord'].upper().strip()
        scrambled = data['scrambledWord'].upper().strip()
        
        if not original.isalpha():
            return {'valid': False, 'error': 'Original word must contain only letters'}
        
        if not scrambled.isalpha():
            return {'valid': False, 'error': 'Scrambled word must contain only letters'}
        
        if len(original) != len(scrambled):
            return {'valid': False, 'error': 'Original and scrambled words must have same length'}
        
        # Check if scrambled word contains same letters as original
        if sorted(original) != sorted(scrambled):
            return {'valid': False, 'error': 'Scrambled word must contain exactly the same letters as original word'}
        
        # Check if scrambled word is different from original
        if original == scrambled:
            return {'valid': False, 'error': 'Scrambled word must be different from original word'}
        
        # Validate word length
        if len(original) < 3:
            return {'valid': False, 'error': 'Word must be at least 3 characters long'}
        
        if len(original) > 15:
            return {'valid': False, 'error': 'Word must be no more than 15 characters long'}
        
        # Validate definition
        if len(data['definition'].strip()) < 10:
            return {'valid': False, 'error': 'Definition must be at least 10 characters long'}
        
        return {'valid': True}
        
    except Exception as e:
        return {'valid': False, 'error': f'Validation error: {str(e)}'}

def scramble_word(word):
    """Generate a scrambled version of a word"""
    letters = list(word)
    
    # Use Fisher-Yates shuffle
    for i in range(len(letters) - 1, 0, -1):
        j = random.randint(0, i)
        letters[i], letters[j] = letters[j], letters[i]
    
    return ''.join(letters)

def fallback_scramble(word):
    """Fallback scrambling method that ensures the word is different"""
    if len(word) < 2:
        return word
    
    # Simple method: reverse the word
    reversed_word = word[::-1]
    if reversed_word != word:
        return reversed_word
    
    # If reversing doesn't work, swap first two characters
    letters = list(word)
    letters[0], letters[1] = letters[1], letters[0]
    return ''.join(letters)

def find_oldest_puzzle_index():
    """Find the oldest puzzle index for replacement"""
    # For now, use a simple round-robin approach
    # In a real implementation, this could check file modification times
    # or use a more sophisticated algorithm
    
    current_time = datetime.now()
    # Use current day of month to determine which puzzle to replace
    return (current_time.day % 30) + 1

# Error handlers
@anagram_api.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@anagram_api.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

