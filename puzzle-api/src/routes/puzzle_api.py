from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, date, timedelta
import json
import os
import shutil
from src.models.puzzle import db, Puzzle, PuzzleRotation, PuzzleInjection

puzzle_bp = Blueprint('puzzle', __name__)

# Configuration
PUZZLE_BANK_PATH = '/home/ubuntu/daily-puzzle-post-github/puzzles/bank/'
CURRENT_PUZZLE_PATH = '/home/ubuntu/daily-puzzle-post-github/puzzles/daily/current.json'
LAUNCH_DATE = date(2025, 8, 19)
CYCLE_LENGTH = 30

def calculate_puzzle_index(target_date=None):
    """Calculate puzzle index for given date"""
    if target_date is None:
        target_date = date.today()
    
    if isinstance(target_date, str):
        target_date = datetime.fromisoformat(target_date).date()
    
    days_since_launch = (target_date - LAUNCH_DATE).days
    if days_since_launch < 0:
        days_since_launch = 0
    
    puzzle_index = (days_since_launch % CYCLE_LENGTH) + 1
    return puzzle_index, days_since_launch

def get_puzzle_filename(puzzle_index):
    """Get puzzle filename for given index"""
    return f"puzzle_{puzzle_index:02d}.json"

def load_puzzle_from_file(puzzle_index):
    """Load puzzle from JSON file"""
    filename = get_puzzle_filename(puzzle_index)
    filepath = os.path.join(PUZZLE_BANK_PATH, filename)
    
    try:
        with open(filepath, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return None
    except json.JSONDecodeError:
        return None

def save_puzzle_to_file(puzzle_data, puzzle_index):
    """Save puzzle to JSON file"""
    filename = get_puzzle_filename(puzzle_index)
    filepath = os.path.join(PUZZLE_BANK_PATH, filename)
    
    # Create backup
    if os.path.exists(filepath):
        backup_path = f"{filepath}.backup.{int(datetime.now().timestamp())}"
        shutil.copy2(filepath, backup_path)
    
    with open(filepath, 'w') as f:
        json.dump(puzzle_data, f, indent=2)
    
    return filepath

def update_current_puzzle_pointer(puzzle_index, puzzle_data):
    """Update the current puzzle pointer file"""
    current_data = {
        "currentPuzzle": {
            "puzzleIndex": puzzle_index,
            "filename": get_puzzle_filename(puzzle_index),
            "date": puzzle_data.get('date', date.today().isoformat()),
            "lastUpdated": datetime.now().isoformat() + 'Z',
            "rotationInfo": {
                "daysSinceLaunch": calculate_puzzle_index()[1],
                "cyclePosition": puzzle_index,
                "totalCycles": (calculate_puzzle_index()[1] // CYCLE_LENGTH) + 1
            }
        },
        "rotationConfig": {
            "cycleLength": CYCLE_LENGTH,
            "launchDate": LAUNCH_DATE.isoformat(),
            "timezone": "America/New_York",
            "refreshTime": "00:00"
        },
        "metadata": {
            "version": "1.0.0",
            "lastRotation": datetime.now().isoformat() + 'Z',
            "nextRotation": (datetime.now() + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0).isoformat() + 'Z',
            "automationReady": True,
            "lindyCompatible": True
        }
    }
    
    with open(CURRENT_PUZZLE_PATH, 'w') as f:
        json.dump(current_data, f, indent=2)

@puzzle_bp.route('/puzzles/today', methods=['GET'])
def get_todays_puzzle():
    """Get today's puzzle using rotation logic"""
    try:
        puzzle_index, days_since_launch = calculate_puzzle_index()
        puzzle_data = load_puzzle_from_file(puzzle_index)
        
        if not puzzle_data:
            return jsonify({
                'error': 'Puzzle not found',
                'puzzleIndex': puzzle_index
            }), 404
        
        # Add rotation metadata
        puzzle_data['rotation'] = {
            'puzzleIndex': puzzle_index,
            'daysSinceLaunch': days_since_launch,
            'cycleDay': puzzle_index,
            'cycleNumber': (days_since_launch // CYCLE_LENGTH) + 1,
            'isToday': True,
            'loadedAt': datetime.now().isoformat() + 'Z'
        }
        
        # Update display date to today
        puzzle_data['displayDate'] = date.today().isoformat()
        
        return jsonify({
            'success': True,
            'puzzle': puzzle_data,
            'rotation': puzzle_data['rotation']
        })
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to get today\'s puzzle',
            'details': str(e)
        }), 500

@puzzle_bp.route('/puzzles/date/<date_str>', methods=['GET'])
def get_puzzle_for_date(date_str):
    """Get puzzle for specific date"""
    try:
        target_date = datetime.fromisoformat(date_str).date()
        puzzle_index, days_since_launch = calculate_puzzle_index(target_date)
        puzzle_data = load_puzzle_from_file(puzzle_index)
        
        if not puzzle_data:
            return jsonify({
                'error': 'Puzzle not found',
                'date': date_str,
                'puzzleIndex': puzzle_index
            }), 404
        
        # Add date-specific metadata
        puzzle_data['rotation'] = {
            'puzzleIndex': puzzle_index,
            'daysSinceLaunch': days_since_launch,
            'cycleDay': puzzle_index,
            'cycleNumber': (days_since_launch // CYCLE_LENGTH) + 1,
            'requestedDate': date_str,
            'loadedAt': datetime.now().isoformat() + 'Z'
        }
        
        puzzle_data['displayDate'] = date_str
        
        return jsonify({
            'success': True,
            'puzzle': puzzle_data,
            'rotation': puzzle_data['rotation']
        })
        
    except ValueError:
        return jsonify({
            'error': 'Invalid date format',
            'expected': 'YYYY-MM-DD'
        }), 400
    except Exception as e:
        return jsonify({
            'error': 'Failed to get puzzle for date',
            'details': str(e)
        }), 500

@puzzle_bp.route('/puzzles/inject', methods=['POST'])
def inject_puzzle():
    """
    Inject new puzzle from Lindy.ai
    This endpoint allows Lindy to add new puzzles and replace oldest ones
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': 'No puzzle data provided'
            }), 400
        
        # Validate required fields
        required_fields = ['id', 'title', 'grid', 'solution', 'clues']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({
                'error': 'Missing required fields',
                'missingFields': missing_fields
            }), 400
        
        # Set defaults for optional fields
        puzzle_data = {
            'id': data['id'],
            'date': data.get('date', date.today().isoformat()),
            'dayOfWeek': data.get('dayOfWeek', date.today().strftime('%A')),
            'difficulty': data.get('difficulty', 3),
            'difficultyLabel': data.get('difficultyLabel', 'Medium'),
            'title': data['title'],
            'theme': data.get('theme', 'General Knowledge'),
            'size': data.get('size', 15),
            'grid': data['grid'],
            'solution': data['solution'],
            'numbers': data.get('numbers', []),
            'clues': data['clues'],
            'metadata': data.get('metadata', {})
        }
        
        # Add automation metadata
        puzzle_data['metadata'].update({
            'constructor': 'Lindy.ai',
            'editor': 'AI Assistant',
            'copyright': '2025 Daily Puzzle Post',
            'created': datetime.now().isoformat() + 'Z',
            'lastModified': datetime.now().isoformat() + 'Z',
            'automationReady': True,
            'lindyCompatible': True,
            'injectedBy': 'lindy',
            'injectionDate': datetime.now().isoformat() + 'Z'
        })
        
        # Determine which puzzle to replace (oldest in cycle)
        injection_strategy = data.get('strategy', 'replace_oldest')
        
        if injection_strategy == 'replace_oldest':
            # Find oldest puzzle in current cycle
            current_puzzle_index = calculate_puzzle_index()[0]
            # Replace the puzzle that's furthest from current in the cycle
            replace_index = ((current_puzzle_index + CYCLE_LENGTH // 2 - 1) % CYCLE_LENGTH) + 1
        elif injection_strategy == 'replace_specific':
            replace_index = data.get('replaceIndex', 1)
        else:
            replace_index = data.get('targetIndex', 1)
        
        # Validate replace_index
        if replace_index < 1 or replace_index > CYCLE_LENGTH:
            return jsonify({
                'error': 'Invalid replacement index',
                'validRange': f'1-{CYCLE_LENGTH}'
            }), 400
        
        # Load existing puzzle for backup
        existing_puzzle = load_puzzle_from_file(replace_index)
        
        # Save new puzzle to file
        filepath = save_puzzle_to_file(puzzle_data, replace_index)
        
        # Update current puzzle pointer if replacing today's puzzle
        current_index = calculate_puzzle_index()[0]
        if replace_index == current_index:
            update_current_puzzle_pointer(replace_index, puzzle_data)
        
        # Log injection to database
        try:
            injection = PuzzleInjection(
                puzzle_id=puzzle_data['id'],
                replaced_puzzle_id=existing_puzzle.get('id') if existing_puzzle else None,
                injection_source='lindy',
                injection_reason=data.get('reason', 'Content refresh'),
                injected_by='lindy',
                quality_score=data.get('qualityScore'),
                validation_passed=True
            )
            db.session.add(injection)
            db.session.commit()
        except Exception as db_error:
            current_app.logger.warning(f"Failed to log injection to database: {db_error}")
        
        return jsonify({
            'success': True,
            'message': 'Puzzle injected successfully',
            'injectedPuzzle': {
                'id': puzzle_data['id'],
                'title': puzzle_data['title'],
                'index': replace_index,
                'filename': get_puzzle_filename(replace_index),
                'filepath': filepath
            },
            'replacedPuzzle': {
                'id': existing_puzzle.get('id') if existing_puzzle else None,
                'title': existing_puzzle.get('title') if existing_puzzle else None
            },
            'injection': {
                'strategy': injection_strategy,
                'timestamp': datetime.now().isoformat() + 'Z',
                'source': 'lindy'
            }
        })
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to inject puzzle',
            'details': str(e)
        }), 500

@puzzle_bp.route('/puzzles/bank', methods=['GET'])
def get_puzzle_bank():
    """Get all puzzles in the bank"""
    try:
        puzzles = []
        
        for i in range(1, CYCLE_LENGTH + 1):
            puzzle_data = load_puzzle_from_file(i)
            if puzzle_data:
                puzzle_data['bankIndex'] = i
                puzzle_data['filename'] = get_puzzle_filename(i)
                puzzles.append(puzzle_data)
        
        return jsonify({
            'success': True,
            'puzzles': puzzles,
            'totalPuzzles': len(puzzles),
            'cycleLength': CYCLE_LENGTH
        })
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to get puzzle bank',
            'details': str(e)
        }), 500

@puzzle_bp.route('/puzzles/rotation/status', methods=['GET'])
def get_rotation_status():
    """Get current rotation status"""
    try:
        puzzle_index, days_since_launch = calculate_puzzle_index()
        current_cycle = (days_since_launch // CYCLE_LENGTH) + 1
        day_in_cycle = puzzle_index
        
        # Get current puzzle info
        current_puzzle = load_puzzle_from_file(puzzle_index)
        
        # Calculate next rotation
        next_rotation = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
        
        return jsonify({
            'success': True,
            'rotation': {
                'currentPuzzleIndex': puzzle_index,
                'daysSinceLaunch': days_since_launch,
                'currentCycle': current_cycle,
                'dayInCycle': day_in_cycle,
                'cycleLength': CYCLE_LENGTH,
                'launchDate': LAUNCH_DATE.isoformat(),
                'nextRotation': next_rotation.isoformat() + 'Z',
                'currentPuzzle': {
                    'id': current_puzzle.get('id') if current_puzzle else None,
                    'title': current_puzzle.get('title') if current_puzzle else None,
                    'theme': current_puzzle.get('theme') if current_puzzle else None,
                    'difficulty': current_puzzle.get('difficulty') if current_puzzle else None
                }
            }
        })
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to get rotation status',
            'details': str(e)
        }), 500

@puzzle_bp.route('/puzzles/validate', methods=['POST'])
def validate_puzzle():
    """Validate puzzle data structure"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': 'No puzzle data provided'
            }), 400
        
        errors = []
        warnings = []
        
        # Required fields validation
        required_fields = ['id', 'title', 'grid', 'solution', 'clues', 'size']
        for field in required_fields:
            if field not in data:
                errors.append(f"Missing required field: {field}")
        
        # Grid validation
        if 'grid' in data and 'size' in data:
            grid = data['grid']
            size = data['size']
            
            if len(grid) != size:
                errors.append(f"Grid height {len(grid)} doesn't match size {size}")
            
            for i, row in enumerate(grid):
                if len(row) != size:
                    errors.append(f"Grid row {i} has length {len(row)}, expected {size}")
        
        # Solution validation
        if 'solution' in data and 'size' in data:
            solution = data['solution']
            size = data['size']
            
            if len(solution) != size:
                errors.append(f"Solution height {len(solution)} doesn't match size {size}")
            
            for i, row in enumerate(solution):
                if len(row) != size:
                    errors.append(f"Solution row {i} has length {len(row)}, expected {size}")
        
        # Clues validation
        if 'clues' in data:
            clues = data['clues']
            if not isinstance(clues, dict):
                errors.append("Clues must be an object")
            elif 'across' not in clues or 'down' not in clues:
                errors.append("Clues must have 'across' and 'down' sections")
        
        # Difficulty validation
        if 'difficulty' in data:
            difficulty = data['difficulty']
            if not isinstance(difficulty, int) or difficulty < 1 or difficulty > 5:
                errors.append("Difficulty must be an integer between 1 and 5")
        
        # Size validation
        if 'size' in data:
            size = data['size']
            if size != 15:
                warnings.append("Only 15x15 puzzles are fully supported")
        
        is_valid = len(errors) == 0
        
        return jsonify({
            'success': True,
            'validation': {
                'isValid': is_valid,
                'errors': errors,
                'warnings': warnings,
                'score': max(0, 100 - len(errors) * 20 - len(warnings) * 5)
            }
        })
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to validate puzzle',
            'details': str(e)
        }), 500

@puzzle_bp.route('/puzzles/backup', methods=['POST'])
def backup_puzzle_bank():
    """Create backup of entire puzzle bank"""
    try:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_dir = f"/home/ubuntu/daily-puzzle-post-github/puzzles/backups/backup_{timestamp}"
        
        os.makedirs(backup_dir, exist_ok=True)
        
        # Copy all puzzle files
        backup_count = 0
        for i in range(1, CYCLE_LENGTH + 1):
            source_file = os.path.join(PUZZLE_BANK_PATH, get_puzzle_filename(i))
            if os.path.exists(source_file):
                dest_file = os.path.join(backup_dir, get_puzzle_filename(i))
                shutil.copy2(source_file, dest_file)
                backup_count += 1
        
        # Copy current puzzle pointer
        if os.path.exists(CURRENT_PUZZLE_PATH):
            shutil.copy2(CURRENT_PUZZLE_PATH, os.path.join(backup_dir, 'current.json'))
        
        return jsonify({
            'success': True,
            'backup': {
                'timestamp': timestamp,
                'directory': backup_dir,
                'filesBackedUp': backup_count,
                'totalFiles': CYCLE_LENGTH
            }
        })
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to create backup',
            'details': str(e)
        }), 500

@puzzle_bp.route('/puzzles/health', methods=['GET'])
def health_check():
    """Health check for puzzle system"""
    try:
        # Check if puzzle bank directory exists
        bank_exists = os.path.exists(PUZZLE_BANK_PATH)
        
        # Count available puzzles
        available_puzzles = 0
        missing_puzzles = []
        
        for i in range(1, CYCLE_LENGTH + 1):
            filepath = os.path.join(PUZZLE_BANK_PATH, get_puzzle_filename(i))
            if os.path.exists(filepath):
                available_puzzles += 1
            else:
                missing_puzzles.append(i)
        
        # Check current puzzle
        current_puzzle_exists = os.path.exists(CURRENT_PUZZLE_PATH)
        current_puzzle_index = calculate_puzzle_index()[0]
        current_puzzle_available = load_puzzle_from_file(current_puzzle_index) is not None
        
        # Overall health status
        is_healthy = (
            bank_exists and 
            available_puzzles >= CYCLE_LENGTH * 0.8 and  # At least 80% of puzzles available
            current_puzzle_exists and 
            current_puzzle_available
        )
        
        return jsonify({
            'success': True,
            'health': {
                'status': 'healthy' if is_healthy else 'degraded',
                'bankExists': bank_exists,
                'availablePuzzles': available_puzzles,
                'totalPuzzles': CYCLE_LENGTH,
                'missingPuzzles': missing_puzzles,
                'currentPuzzleExists': current_puzzle_exists,
                'currentPuzzleAvailable': current_puzzle_available,
                'currentPuzzleIndex': current_puzzle_index,
                'timestamp': datetime.now().isoformat() + 'Z'
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'health': {
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now().isoformat() + 'Z'
            }
        }), 500

# Error handlers
@puzzle_bp.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Endpoint not found',
        'availableEndpoints': [
            '/api/puzzles/today',
            '/api/puzzles/date/<date>',
            '/api/puzzles/inject',
            '/api/puzzles/bank',
            '/api/puzzles/rotation/status',
            '/api/puzzles/validate',
            '/api/puzzles/backup',
            '/api/puzzles/health'
        ]
    }), 404

@puzzle_bp.errorhandler(500)
def internal_error(error):
    return jsonify({
        'error': 'Internal server error',
        'message': 'Please try again later'
    }), 500

