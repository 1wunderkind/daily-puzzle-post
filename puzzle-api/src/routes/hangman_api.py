from flask import Blueprint, request, jsonify
from datetime import datetime, date, timedelta
import json
import os
import shutil
from src.models.hangman import HangmanWord, HangmanRotation, HangmanInjection, HangmanBackup, HangmanAnalytics
from src.models.user import db

hangman_bp = Blueprint('hangman', __name__)

# Configuration
HANGMAN_BANK_PATH = '/home/ubuntu/daily-puzzle-post-github/words/bank/'
HANGMAN_BACKUP_PATH = '/home/ubuntu/daily-puzzle-post-github/words/backups/'
LAUNCH_DATE = date(2025, 8, 19)
CYCLE_LENGTH = 30

def calculate_days_since_launch(target_date=None):
    """Calculate days since launch"""
    if target_date is None:
        target_date = date.today()
    elif isinstance(target_date, str):
        target_date = datetime.fromisoformat(target_date).date()
    
    delta = target_date - LAUNCH_DATE
    return max(0, delta.days)

def get_word_index_for_date(target_date=None):
    """Get word index for a specific date"""
    days_since_launch = calculate_days_since_launch(target_date)
    return (days_since_launch % CYCLE_LENGTH) + 1

def load_word_from_file(word_index):
    """Load word from JSON file"""
    try:
        filename = f'word_{word_index:02d}.json'
        filepath = os.path.join(HANGMAN_BANK_PATH, filename)
        
        if not os.path.exists(filepath):
            raise FileNotFoundError(f'Word file not found: {filename}')
        
        with open(filepath, 'r') as f:
            word_data = json.load(f)
        
        return word_data
    except Exception as e:
        raise Exception(f'Error loading word {word_index}: {str(e)}')

def save_word_to_file(word_index, word_data):
    """Save word to JSON file"""
    try:
        filename = f'word_{word_index:02d}.json'
        filepath = os.path.join(HANGMAN_BANK_PATH, filename)
        
        # Ensure directory exists
        os.makedirs(HANGMAN_BANK_PATH, exist_ok=True)
        
        with open(filepath, 'w') as f:
            json.dump(word_data, f, indent=2)
        
        return filepath
    except Exception as e:
        raise Exception(f'Error saving word {word_index}: {str(e)}')

def validate_word_data(word_data):
    """Validate word data structure"""
    errors = []
    required_fields = ['id', 'word', 'hint', 'category', 'length', 'difficulty']
    
    for field in required_fields:
        if field not in word_data:
            errors.append(f'Missing required field: {field}')
    
    if 'word' in word_data:
        word = word_data['word']
        if not isinstance(word, str) or len(word) == 0:
            errors.append('Word must be a non-empty string')
        elif not word.isupper() or not word.isalpha():
            errors.append('Word must contain only uppercase letters')
        
        if 'length' in word_data and len(word) != word_data['length']:
            errors.append(f'Word length mismatch: expected {word_data["length"]}, got {len(word)}')
    
    if 'difficulty' in word_data:
        difficulty = word_data['difficulty']
        if not isinstance(difficulty, int) or difficulty < 1 or difficulty > 5:
            errors.append('Difficulty must be an integer between 1 and 5')
    
    return {
        'isValid': len(errors) == 0,
        'errors': errors
    }

@hangman_bp.route('/words/health', methods=['GET'])
def get_health():
    """Get system health status"""
    try:
        # Check file system
        bank_exists = os.path.exists(HANGMAN_BANK_PATH)
        word_count = len([f for f in os.listdir(HANGMAN_BANK_PATH) if f.endswith('.json')]) if bank_exists else 0
        
        # Check database connection
        try:
            db.session.execute('SELECT 1')
            db_status = 'connected'
        except Exception:
            db_status = 'disconnected'
        
        # Get current rotation info
        current_index = get_word_index_for_date()
        days_since_launch = calculate_days_since_launch()
        current_cycle = (days_since_launch // CYCLE_LENGTH) + 1
        
        health_data = {
            'status': 'healthy' if bank_exists and word_count >= 30 else 'degraded',
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'system': {
                'bankPath': HANGMAN_BANK_PATH,
                'bankExists': bank_exists,
                'wordCount': word_count,
                'databaseStatus': db_status,
                'cycleLength': CYCLE_LENGTH,
                'launchDate': LAUNCH_DATE.isoformat()
            },
            'rotation': {
                'currentIndex': current_index,
                'daysSinceLaunch': days_since_launch,
                'currentCycle': current_cycle,
                'dayInCycle': (days_since_launch % CYCLE_LENGTH) + 1
            }
        }
        
        return jsonify({'health': health_data})
    
    except Exception as e:
        return jsonify({'error': f'Health check failed: {str(e)}'}), 500

@hangman_bp.route('/words/today', methods=['GET'])
def get_todays_word():
    """Get today's word"""
    try:
        word_index = get_word_index_for_date()
        word_data = load_word_from_file(word_index)
        
        # Update word with today's info
        today = date.today()
        word_data['displayDate'] = today.isoformat()
        word_data['todaysInfo'] = {
            'wordIndex': word_index,
            'daysSinceLaunch': calculate_days_since_launch(),
            'rotationCycle': (calculate_days_since_launch() // CYCLE_LENGTH) + 1,
            'isToday': True
        }
        
        return jsonify({'word': word_data})
    
    except Exception as e:
        return jsonify({'error': f'Failed to get today\'s word: {str(e)}'}), 500

@hangman_bp.route('/words/date/<date_string>', methods=['GET'])
def get_word_for_date(date_string):
    """Get word for specific date"""
    try:
        target_date = datetime.fromisoformat(date_string).date()
        word_index = get_word_index_for_date(target_date)
        word_data = load_word_from_file(word_index)
        
        # Update word with date info
        word_data['displayDate'] = date_string
        word_data['dateInfo'] = {
            'wordIndex': word_index,
            'daysSinceLaunch': calculate_days_since_launch(target_date),
            'rotationCycle': (calculate_days_since_launch(target_date) // CYCLE_LENGTH) + 1,
            'requestedDate': date_string
        }
        
        return jsonify({'word': word_data})
    
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    except Exception as e:
        return jsonify({'error': f'Failed to get word for date: {str(e)}'}), 500

@hangman_bp.route('/words/bank', methods=['GET'])
def get_word_bank():
    """Get all words in the bank"""
    try:
        words = []
        for i in range(1, CYCLE_LENGTH + 1):
            try:
                word_data = load_word_from_file(i)
                words.append(word_data)
            except Exception as e:
                print(f'Warning: Could not load word {i}: {e}')
        
        return jsonify({
            'words': words,
            'totalCount': len(words),
            'cycleLength': CYCLE_LENGTH
        })
    
    except Exception as e:
        return jsonify({'error': f'Failed to get word bank: {str(e)}'}), 500

@hangman_bp.route('/words/rotation/status', methods=['GET'])
def get_rotation_status():
    """Get rotation system status"""
    try:
        current_index = get_word_index_for_date()
        days_since_launch = calculate_days_since_launch()
        current_cycle = (days_since_launch // CYCLE_LENGTH) + 1
        day_in_cycle = (days_since_launch % CYCLE_LENGTH) + 1
        
        # Calculate next rotation date
        days_until_next_cycle = CYCLE_LENGTH - (days_since_launch % CYCLE_LENGTH)
        next_rotation_date = date.today() + timedelta(days=days_until_next_cycle)
        
        rotation_data = {
            'currentWordIndex': current_index,
            'daysSinceLaunch': days_since_launch,
            'currentCycle': current_cycle,
            'dayInCycle': day_in_cycle,
            'cycleLength': CYCLE_LENGTH,
            'nextRotationDate': next_rotation_date.isoformat(),
            'launchDate': LAUNCH_DATE.isoformat(),
            'isActive': True,
            'lastUpdated': datetime.utcnow().isoformat() + 'Z'
        }
        
        return jsonify({'rotation': rotation_data})
    
    except Exception as e:
        return jsonify({'error': f'Failed to get rotation status: {str(e)}'}), 500

@hangman_bp.route('/words/validate', methods=['POST'])
def validate_word():
    """Validate word data"""
    try:
        word_data = request.get_json()
        if not word_data:
            return jsonify({'error': 'No word data provided'}), 400
        
        validation_result = validate_word_data(word_data)
        return jsonify({'validation': validation_result})
    
    except Exception as e:
        return jsonify({'error': f'Validation failed: {str(e)}'}), 500

@hangman_bp.route('/words/inject', methods=['POST'])
def inject_word():
    """Inject new word (for Lindy.ai automation)"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        word_data = data.get('wordData') or data
        strategy = data.get('strategy', 'replace_oldest')
        reason = data.get('reason', 'Automated injection by Lindy.ai')
        quality_score = data.get('qualityScore', 4.0)
        
        # Validate word data
        validation = validate_word_data(word_data)
        if not validation['isValid']:
            return jsonify({
                'error': 'Word validation failed',
                'validation': validation
            }), 400
        
        # Create backup before injection
        backup_result = create_backup('pre_injection', f'Backup before injecting word: {word_data.get("word", "unknown")}')
        
        # Determine which word to replace based on strategy
        if strategy == 'replace_oldest':
            # Find oldest word by creation date
            oldest_index = 1
            oldest_date = None
            
            for i in range(1, CYCLE_LENGTH + 1):
                try:
                    existing_word = load_word_from_file(i)
                    created_date = existing_word.get('metadata', {}).get('created')
                    if created_date:
                        if oldest_date is None or created_date < oldest_date:
                            oldest_date = created_date
                            oldest_index = i
                except Exception:
                    continue
            
            replace_index = oldest_index
        
        elif strategy == 'replace_specific':
            replace_index = data.get('replaceIndex', 1)
            if replace_index < 1 or replace_index > CYCLE_LENGTH:
                return jsonify({'error': f'Invalid replace index: {replace_index}'}), 400
        
        else:
            return jsonify({'error': f'Unknown injection strategy: {strategy}'}), 400
        
        # Get the word being replaced
        try:
            replaced_word = load_word_from_file(replace_index)
            replaced_word_id = replaced_word.get('id', f'word_{replace_index:02d}')
        except Exception:
            replaced_word_id = f'word_{replace_index:02d}'
        
        # Update word data with proper ID and metadata
        word_data['id'] = f'word_{replace_index:02d}'
        if 'metadata' not in word_data:
            word_data['metadata'] = {}
        
        word_data['metadata'].update({
            'injectedAt': datetime.utcnow().isoformat() + 'Z',
            'injectedBy': 'Lindy.ai',
            'injectionReason': reason,
            'qualityScore': quality_score,
            'replacedWordId': replaced_word_id,
            'injectionStrategy': strategy
        })
        
        # Save the new word
        filepath = save_word_to_file(replace_index, word_data)
        
        # Record injection in database
        try:
            injection = HangmanInjection(
                word_id=word_data['id'],
                replaced_word_id=replaced_word_id,
                injection_strategy=strategy,
                quality_score=quality_score,
                reason=reason,
                word_data=json.dumps(word_data),
                validation_result=json.dumps(validation),
                is_successful=True
            )
            db.session.add(injection)
            db.session.commit()
        except Exception as e:
            print(f'Warning: Could not record injection in database: {e}')
        
        return jsonify({
            'success': True,
            'message': f'Word injected successfully at index {replace_index}',
            'wordId': word_data['id'],
            'replacedWordId': replaced_word_id,
            'strategy': strategy,
            'filePath': filepath,
            'backupId': backup_result.get('backupId'),
            'validation': validation
        })
    
    except Exception as e:
        # Record failed injection
        try:
            injection = HangmanInjection(
                word_id=data.get('wordData', {}).get('id', 'unknown') if data else 'unknown',
                injection_strategy=data.get('strategy', 'unknown') if data else 'unknown',
                reason=data.get('reason', 'unknown') if data else 'unknown',
                word_data=json.dumps(data) if data else '{}',
                is_successful=False,
                error_message=str(e)
            )
            db.session.add(injection)
            db.session.commit()
        except Exception:
            pass
        
        return jsonify({'error': f'Word injection failed: {str(e)}'}), 500

def create_backup(backup_type='manual', description=''):
    """Create backup of word bank"""
    try:
        # Ensure backup directory exists
        os.makedirs(HANGMAN_BACKUP_PATH, exist_ok=True)
        
        # Create backup filename
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        backup_filename = f'hangman_backup_{timestamp}.json'
        backup_filepath = os.path.join(HANGMAN_BACKUP_PATH, backup_filename)
        
        # Collect all words
        words = []
        for i in range(1, CYCLE_LENGTH + 1):
            try:
                word_data = load_word_from_file(i)
                words.append(word_data)
            except Exception as e:
                print(f'Warning: Could not backup word {i}: {e}')
        
        # Create backup data
        backup_data = {
            'backupDate': datetime.utcnow().isoformat() + 'Z',
            'backupType': backup_type,
            'description': description,
            'wordCount': len(words),
            'cycleLength': CYCLE_LENGTH,
            'words': words
        }
        
        # Save backup file
        with open(backup_filepath, 'w') as f:
            json.dump(backup_data, f, indent=2)
        
        # Record backup in database
        try:
            backup = HangmanBackup(
                backup_type=backup_type,
                word_count=len(words),
                backup_data=json.dumps(backup_data),
                file_path=backup_filepath,
                description=description
            )
            db.session.add(backup)
            db.session.commit()
            backup_id = backup.id
        except Exception as e:
            print(f'Warning: Could not record backup in database: {e}')
            backup_id = None
        
        return {
            'success': True,
            'backupId': backup_id,
            'filePath': backup_filepath,
            'wordCount': len(words)
        }
    
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

@hangman_bp.route('/words/backup', methods=['POST'])
def create_backup_endpoint():
    """Create backup of word bank"""
    try:
        data = request.get_json() or {}
        backup_type = data.get('type', 'manual')
        description = data.get('description', 'Manual backup via API')
        
        result = create_backup(backup_type, description)
        
        if result['success']:
            return jsonify({'backup': result})
        else:
            return jsonify({'error': result['error']}), 500
    
    except Exception as e:
        return jsonify({'error': f'Backup creation failed: {str(e)}'}), 500

@hangman_bp.route('/words/analytics', methods=['POST'])
def record_analytics():
    """Record game analytics"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No analytics data provided'}), 400
        
        analytics = HangmanAnalytics(
            word_id=data.get('wordId'),
            event_type=data.get('eventType'),
            user_session=data.get('userSession'),
            game_duration=data.get('gameDuration'),
            attempts_used=data.get('attemptsUsed'),
            letters_guessed=data.get('lettersGuessed'),
            is_completed=data.get('isCompleted', False),
            is_won=data.get('isWon', False),
            difficulty_rating=data.get('difficultyRating'),
            hint_used=data.get('hintUsed', False),
            metadata=json.dumps(data.get('metadata', {}))
        )
        
        db.session.add(analytics)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Analytics recorded successfully',
            'analyticsId': analytics.id
        })
    
    except Exception as e:
        return jsonify({'error': f'Failed to record analytics: {str(e)}'}), 500

@hangman_bp.route('/words/analytics', methods=['GET'])
def get_analytics():
    """Get game analytics"""
    try:
        # Get query parameters
        word_id = request.args.get('wordId')
        event_type = request.args.get('eventType')
        limit = int(request.args.get('limit', 100))
        
        # Build query
        query = HangmanAnalytics.query
        
        if word_id:
            query = query.filter(HangmanAnalytics.word_id == word_id)
        if event_type:
            query = query.filter(HangmanAnalytics.event_type == event_type)
        
        analytics = query.order_by(HangmanAnalytics.event_date.desc()).limit(limit).all()
        
        return jsonify({
            'analytics': [a.to_dict() for a in analytics],
            'count': len(analytics)
        })
    
    except Exception as e:
        return jsonify({'error': f'Failed to get analytics: {str(e)}'}), 500

