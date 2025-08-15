from src.models.user import db
from datetime import datetime
import json

class HangmanWord(db.Model):
    """
    Model for storing Hangman words in the database
    """
    __tablename__ = 'hangman_words'
    
    id = db.Column(db.Integer, primary_key=True)
    word_id = db.Column(db.String(50), unique=True, nullable=False)  # e.g., 'word_01'
    date = db.Column(db.Date, nullable=False)
    day_of_week = db.Column(db.String(20), nullable=False)
    difficulty = db.Column(db.Integer, nullable=False)
    difficulty_label = db.Column(db.String(50), nullable=False)
    theme = db.Column(db.String(100), nullable=False)
    word = db.Column(db.String(50), nullable=False)
    hint = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(100), nullable=False)
    length = db.Column(db.Integer, nullable=False)
    alternative_words = db.Column(db.Text)  # JSON string of alternative words
    metadata = db.Column(db.Text)  # JSON string of metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    def to_dict(self):
        """Convert word to dictionary format"""
        return {
            'id': self.word_id,
            'date': self.date.isoformat() if self.date else None,
            'dayOfWeek': self.day_of_week,
            'difficulty': self.difficulty,
            'difficultyLabel': self.difficulty_label,
            'theme': self.theme,
            'word': self.word,
            'hint': self.hint,
            'category': self.category,
            'length': self.length,
            'alternativeWords': json.loads(self.alternative_words) if self.alternative_words else [],
            'metadata': json.loads(self.metadata) if self.metadata else {}
        }
    
    @classmethod
    def from_dict(cls, data):
        """Create word from dictionary data"""
        return cls(
            word_id=data.get('id'),
            date=datetime.fromisoformat(data.get('date')) if data.get('date') else None,
            day_of_week=data.get('dayOfWeek'),
            difficulty=data.get('difficulty'),
            difficulty_label=data.get('difficultyLabel'),
            theme=data.get('theme'),
            word=data.get('word'),
            hint=data.get('hint'),
            category=data.get('category'),
            length=data.get('length'),
            alternative_words=json.dumps(data.get('alternativeWords', [])),
            metadata=json.dumps(data.get('metadata', {}))
        )

class HangmanRotation(db.Model):
    """
    Model for tracking Hangman word rotation status
    """
    __tablename__ = 'hangman_rotation'
    
    id = db.Column(db.Integer, primary_key=True)
    current_word_index = db.Column(db.Integer, nullable=False)
    rotation_date = db.Column(db.Date, nullable=False)
    cycle_number = db.Column(db.Integer, default=1)
    days_since_launch = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)
    metadata = db.Column(db.Text)  # JSON string for additional data
    
    def to_dict(self):
        """Convert rotation to dictionary format"""
        return {
            'currentWordIndex': self.current_word_index,
            'rotationDate': self.rotation_date.isoformat() if self.rotation_date else None,
            'cycleNumber': self.cycle_number,
            'daysSinceLaunch': self.days_since_launch,
            'isActive': self.is_active,
            'lastUpdated': self.last_updated.isoformat() if self.last_updated else None,
            'metadata': json.loads(self.metadata) if self.metadata else {}
        }

class HangmanInjection(db.Model):
    """
    Model for tracking word injections from Lindy.ai
    """
    __tablename__ = 'hangman_injections'
    
    id = db.Column(db.Integer, primary_key=True)
    word_id = db.Column(db.String(50), nullable=False)
    injection_date = db.Column(db.DateTime, default=datetime.utcnow)
    replaced_word_id = db.Column(db.String(50))  # ID of word that was replaced
    injection_strategy = db.Column(db.String(50), default='replace_oldest')
    quality_score = db.Column(db.Float, default=4.0)
    source = db.Column(db.String(100), default='Lindy.ai')
    reason = db.Column(db.Text)
    word_data = db.Column(db.Text)  # JSON string of the injected word
    validation_result = db.Column(db.Text)  # JSON string of validation results
    is_successful = db.Column(db.Boolean, default=True)
    error_message = db.Column(db.Text)
    
    def to_dict(self):
        """Convert injection to dictionary format"""
        return {
            'id': self.id,
            'wordId': self.word_id,
            'injectionDate': self.injection_date.isoformat() if self.injection_date else None,
            'replacedWordId': self.replaced_word_id,
            'injectionStrategy': self.injection_strategy,
            'qualityScore': self.quality_score,
            'source': self.source,
            'reason': self.reason,
            'wordData': json.loads(self.word_data) if self.word_data else {},
            'validationResult': json.loads(self.validation_result) if self.validation_result else {},
            'isSuccessful': self.is_successful,
            'errorMessage': self.error_message
        }

class HangmanBackup(db.Model):
    """
    Model for storing word bank backups
    """
    __tablename__ = 'hangman_backups'
    
    id = db.Column(db.Integer, primary_key=True)
    backup_date = db.Column(db.DateTime, default=datetime.utcnow)
    backup_type = db.Column(db.String(50), default='automatic')  # automatic, manual, pre_injection
    word_count = db.Column(db.Integer, default=0)
    backup_data = db.Column(db.Text)  # JSON string of all words
    file_path = db.Column(db.String(255))  # Path to backup file
    created_by = db.Column(db.String(100), default='system')
    description = db.Column(db.Text)
    is_restorable = db.Column(db.Boolean, default=True)
    
    def to_dict(self):
        """Convert backup to dictionary format"""
        return {
            'id': self.id,
            'backupDate': self.backup_date.isoformat() if self.backup_date else None,
            'backupType': self.backup_type,
            'wordCount': self.word_count,
            'filePath': self.file_path,
            'createdBy': self.created_by,
            'description': self.description,
            'isRestorable': self.is_restorable
        }

class HangmanAnalytics(db.Model):
    """
    Model for storing Hangman game analytics
    """
    __tablename__ = 'hangman_analytics'
    
    id = db.Column(db.Integer, primary_key=True)
    word_id = db.Column(db.String(50), nullable=False)
    event_type = db.Column(db.String(50), nullable=False)  # game_started, game_completed, letter_guessed, etc.
    event_date = db.Column(db.DateTime, default=datetime.utcnow)
    user_session = db.Column(db.String(100))
    game_duration = db.Column(db.Integer)  # in seconds
    attempts_used = db.Column(db.Integer)
    letters_guessed = db.Column(db.String(26))  # String of guessed letters
    is_completed = db.Column(db.Boolean, default=False)
    is_won = db.Column(db.Boolean, default=False)
    difficulty_rating = db.Column(db.Integer)  # User's difficulty rating 1-5
    hint_used = db.Column(db.Boolean, default=False)
    metadata = db.Column(db.Text)  # JSON string for additional analytics data
    
    def to_dict(self):
        """Convert analytics to dictionary format"""
        return {
            'id': self.id,
            'wordId': self.word_id,
            'eventType': self.event_type,
            'eventDate': self.event_date.isoformat() if self.event_date else None,
            'userSession': self.user_session,
            'gameDuration': self.game_duration,
            'attemptsUsed': self.attempts_used,
            'lettersGuessed': self.letters_guessed,
            'isCompleted': self.is_completed,
            'isWon': self.is_won,
            'difficultyRating': self.difficulty_rating,
            'hintUsed': self.hint_used,
            'metadata': json.loads(self.metadata) if self.metadata else {}
        }

