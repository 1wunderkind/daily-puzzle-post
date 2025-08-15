from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import json
import os
import shutil

sudoku_api = Blueprint('sudoku_api', __name__)

# Sudoku data paths
SUDOKU_BANK_PATH = '/home/ubuntu/daily-puzzle-post-github/sudoku/bank'
SUDOKU_DAILY_PATH = '/home/ubuntu/daily-puzzle-post-github/sudoku/daily'
SUDOKU_BACKUP_PATH = '/tmp/sudoku_backups'

# Launch date for rotation calculation
LAUNCH_DATE = datetime(2025, 8, 19)

def calculate_sudoku_rotation(target_date=None):
    """Calculate which Sudoku puzzle to show based on date"""
    try:
        today = target_date if target_date else datetime.now()
        time_diff = today - LAUNCH_DATE
        days_diff = time_diff.days
        
        # Use modulo 30 for 30-day rotation cycle
        puzzle_index = ((days_diff % 30) + 30) % 30
        puzzle_id = puzzle_index + 1
        
        return {
            'puzzle_id': f'sudoku_{puzzle_id:02d}',
            'puzzle_number': puzzle_id,
            'days_since_launch': days_diff,
            'rotation_cycle': days_diff // 30 + 1,
            'date': today.strftime('%Y-%m-%d'),
            'is_today': target_date is None or today.date() == datetime.now().date()
        }
    except Exception as e:
        return {
            'puzzle_id': 'sudoku_01',
            'puzzle_number': 1,
            'days_since_launch': 0,
            'rotation_cycle': 1,
            'date': datetime.now().strftime('%Y-%m-%d'),
            'is_today': True,
            'error': str(e)
        }

def load_sudoku_puzzle(puzzle_id):
    """Load Sudoku puzzle from file"""
    try:
        puzzle_file = os.path.join(SUDOKU_BANK_PATH, f'{puzzle_id}.json')
        if os.path.exists(puzzle_file):
            with open(puzzle_file, 'r') as f:
                return json.load(f)
    except Exception as e:
        print(f"Error loading Sudoku puzzle {puzzle_id}: {e}")
    return None

def save_sudoku_puzzle(puzzle_id, puzzle_data):
    """Save Sudoku puzzle to file"""
    try:
        os.makedirs(SUDOKU_BANK_PATH, exist_ok=True)
        puzzle_file = os.path.join(SUDOKU_BANK_PATH, f'{puzzle_id}.json')
        
        with open(puzzle_file, 'w') as f:
            json.dump(puzzle_data, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving Sudoku puzzle {puzzle_id}: {e}")
        return False

def validate_sudoku_solution(grid):
    """Validate Sudoku solution"""
    if not grid or len(grid) != 9:
        return False
    
    for row in grid:
        if not row or len(row) != 9:
            return False
    
    # Check rows
    for row in grid:
        if sorted(row) != list(range(1, 10)):
            return False
    
    # Check columns
    for col in range(9):
        column = [grid[row][col] for row in range(9)]
        if sorted(column) != list(range(1, 10)):
            return False
    
    # Check 3x3 boxes
    for box_row in range(3):
        for box_col in range(3):
            box = []
            for row in range(box_row * 3, box_row * 3 + 3):
                for col in range(box_col * 3, box_col * 3 + 3):
                    box.append(grid[row][col])
            if sorted(box) != list(range(1, 10)):
                return False
    
    return True

@sudoku_api.route('/api/sudoku/today', methods=['GET'])
def get_todays_sudoku():
    """Get today's Sudoku puzzle"""
    try:
        rotation = calculate_sudoku_rotation()
        puzzle_data = load_sudoku_puzzle(rotation['puzzle_id'])
        
        if puzzle_data:
            return jsonify({
                'success': True,
                'puzzle': puzzle_data,
                'rotation': rotation,
                'source': 'api'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Puzzle not found',
                'rotation': rotation
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@sudoku_api.route('/api/sudoku/date/<date>', methods=['GET'])
def get_sudoku_by_date(date):
    """Get Sudoku puzzle for specific date"""
    try:
        target_date = datetime.strptime(date, '%Y-%m-%d')
        rotation = calculate_sudoku_rotation(target_date)
        puzzle_data = load_sudoku_puzzle(rotation['puzzle_id'])
        
        if puzzle_data:
            return jsonify({
                'success': True,
                'puzzle': puzzle_data,
                'rotation': rotation,
                'source': 'api'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Puzzle not found',
                'rotation': rotation
            }), 404
            
    except ValueError:
        return jsonify({
            'success': False,
            'error': 'Invalid date format. Use YYYY-MM-DD'
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@sudoku_api.route('/api/sudoku/inject', methods=['POST'])
def inject_sudoku_puzzle():
    """Inject new Sudoku puzzle for Lindy.ai automation"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        # Validate required fields
        required_fields = ['id', 'difficulty', 'given', 'solution']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({
                'success': False,
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400
        
        # Validate grid format
        if not isinstance(data['given'], list) or len(data['given']) != 9:
            return jsonify({
                'success': False,
                'error': 'Given grid must be 9x9 array'
            }), 400
        
        if not isinstance(data['solution'], list) or len(data['solution']) != 9:
            return jsonify({
                'success': False,
                'error': 'Solution grid must be 9x9 array'
            }), 400
        
        # Validate solution
        if not validate_sudoku_solution(data['solution']):
            return jsonify({
                'success': False,
                'error': 'Invalid Sudoku solution'
            }), 400
        
        # Add metadata
        puzzle_data = {
            **data,
            'created_at': datetime.now().isoformat(),
            'injected_by': 'lindy_ai',
            'lindy_compatible': True,
            'print_friendly': True
        }
        
        # Save puzzle
        if save_sudoku_puzzle(data['id'], puzzle_data):
            return jsonify({
                'success': True,
                'message': f'Sudoku puzzle {data["id"]} injected successfully',
                'puzzle_id': data['id']
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to save puzzle'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@sudoku_api.route('/api/sudoku/bank', methods=['GET'])
def get_sudoku_bank():
    """Get all Sudoku puzzles in bank for Lindy.ai management"""
    try:
        puzzles = {}
        
        if os.path.exists(SUDOKU_BANK_PATH):
            for filename in os.listdir(SUDOKU_BANK_PATH):
                if filename.endswith('.json'):
                    puzzle_id = filename[:-5]  # Remove .json extension
                    puzzle_data = load_sudoku_puzzle(puzzle_id)
                    if puzzle_data:
                        # Remove solution for security
                        safe_data = {k: v for k, v in puzzle_data.items() if k != 'solution'}
                        puzzles[puzzle_id] = safe_data
        
        return jsonify({
            'success': True,
            'puzzles': puzzles,
            'total_count': len(puzzles),
            'bank_path': SUDOKU_BANK_PATH
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@sudoku_api.route('/api/sudoku/rotation/status', methods=['GET'])
def get_rotation_status():
    """Get Sudoku rotation system status for Lindy.ai monitoring"""
    try:
        rotation = calculate_sudoku_rotation()
        
        # Count available puzzles
        puzzle_count = 0
        if os.path.exists(SUDOKU_BANK_PATH):
            puzzle_count = len([f for f in os.listdir(SUDOKU_BANK_PATH) if f.endswith('.json')])
        
        return jsonify({
            'success': True,
            'rotation': rotation,
            'system_status': {
                'total_puzzles': puzzle_count,
                'bank_path': SUDOKU_BANK_PATH,
                'launch_date': LAUNCH_DATE.strftime('%Y-%m-%d'),
                'cycle_length': 30,
                'next_rotation': (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
            },
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@sudoku_api.route('/api/sudoku/validate', methods=['POST'])
def validate_sudoku_puzzle():
    """Validate Sudoku puzzle data for Lindy.ai quality control"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'valid': False,
                'errors': ['No data provided']
            }), 400
        
        errors = []
        
        # Check required fields
        required_fields = ['id', 'difficulty', 'given', 'solution']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            errors.append(f'Missing required fields: {", ".join(missing_fields)}')
        
        # Validate grid format
        if 'given' in data:
            if not isinstance(data['given'], list) or len(data['given']) != 9:
                errors.append('Given grid must be 9x9 array')
            else:
                for i, row in enumerate(data['given']):
                    if not isinstance(row, list) or len(row) != 9:
                        errors.append(f'Given grid row {i+1} must have 9 elements')
        
        if 'solution' in data:
            if not isinstance(data['solution'], list) or len(data['solution']) != 9:
                errors.append('Solution grid must be 9x9 array')
            else:
                for i, row in enumerate(data['solution']):
                    if not isinstance(row, list) or len(row) != 9:
                        errors.append(f'Solution grid row {i+1} must have 9 elements')
                
                # Validate solution correctness
                if not validate_sudoku_solution(data['solution']):
                    errors.append('Invalid Sudoku solution')
        
        # Validate difficulty
        if 'difficulty' in data and data['difficulty'] not in ['easy', 'medium', 'hard']:
            errors.append('Difficulty must be easy, medium, or hard')
        
        return jsonify({
            'valid': len(errors) == 0,
            'errors': errors,
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({
            'valid': False,
            'errors': [str(e)]
        }), 500

@sudoku_api.route('/api/sudoku/backup', methods=['POST'])
def backup_sudoku_bank():
    """Create backup of Sudoku puzzle bank for Lindy.ai automation"""
    try:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_dir = os.path.join(SUDOKU_BACKUP_PATH, f'sudoku_backup_{timestamp}')
        
        os.makedirs(backup_dir, exist_ok=True)
        
        if os.path.exists(SUDOKU_BANK_PATH):
            shutil.copytree(SUDOKU_BANK_PATH, os.path.join(backup_dir, 'bank'))
        
        if os.path.exists(SUDOKU_DAILY_PATH):
            shutil.copytree(SUDOKU_DAILY_PATH, os.path.join(backup_dir, 'daily'))
        
        return jsonify({
            'success': True,
            'backup_path': backup_dir,
            'timestamp': timestamp,
            'message': 'Sudoku bank backup created successfully'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@sudoku_api.route('/api/sudoku/health', methods=['GET'])
def sudoku_health():
    """Health check for Sudoku system"""
    try:
        rotation = calculate_sudoku_rotation()
        current_puzzle = load_sudoku_puzzle(rotation['puzzle_id'])
        
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'current_puzzle': rotation['puzzle_id'],
            'puzzle_available': current_puzzle is not None,
            'system': 'sudoku_rotation'
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

