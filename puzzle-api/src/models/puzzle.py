from src.models.user import db
from datetime import datetime
import json

class Puzzle(db.Model):
    """
    Puzzle model for storing crossword puzzle data
    Designed for Lindy.ai automation and content management
    """
    __tablename__ = 'puzzles'
    
    id = db.Column(db.String(50), primary_key=True)
    puzzle_number = db.Column(db.Integer, nullable=False, unique=True)
    date = db.Column(db.Date, nullable=False)
    day_of_week = db.Column(db.String(20), nullable=False)
    difficulty = db.Column(db.Integer, nullable=False)
    difficulty_label = db.Column(db.String(20), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    theme = db.Column(db.String(100), nullable=False)
    size = db.Column(db.Integer, default=15)
    
    # JSON fields for complex data
    grid_data = db.Column(db.Text, nullable=False)  # JSON string of grid
    solution_data = db.Column(db.Text, nullable=False)  # JSON string of solution
    numbers_data = db.Column(db.Text, nullable=False)  # JSON string of numbers
    clues_data = db.Column(db.Text, nullable=False)  # JSON string of clues
    metadata_data = db.Column(db.Text, nullable=True)  # JSON string of metadata
    
    # Automation fields
    is_active = db.Column(db.Boolean, default=True)
    created_by = db.Column(db.String(50), default='system')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Lindy.ai integration fields
    lindy_compatible = db.Column(db.Boolean, default=True)
    automation_ready = db.Column(db.Boolean, default=True)
    last_modified_by = db.Column(db.String(50), default='system')
    
    def __init__(self, **kwargs):
        super(Puzzle, self).__init__(**kwargs)
        
    @property
    def grid(self):
        """Get grid as Python object"""
        return json.loads(self.grid_data) if self.grid_data else []
    
    @grid.setter
    def grid(self, value):
        """Set grid from Python object"""
        self.grid_data = json.dumps(value)
    
    @property
    def solution(self):
        """Get solution as Python object"""
        return json.loads(self.solution_data) if self.solution_data else []
    
    @solution.setter
    def solution(self, value):
        """Set solution from Python object"""
        self.solution_data = json.dumps(value)
    
    @property
    def numbers(self):
        """Get numbers as Python object"""
        return json.loads(self.numbers_data) if self.numbers_data else []
    
    @numbers.setter
    def numbers(self, value):
        """Set numbers from Python object"""
        self.numbers_data = json.dumps(value)
    
    @property
    def clues(self):
        """Get clues as Python object"""
        return json.loads(self.clues_data) if self.clues_data else {}
    
    @clues.setter
    def clues(self, value):
        """Set clues from Python object"""
        self.clues_data = json.dumps(value)
    
    @property
    def metadata(self):
        """Get metadata as Python object"""
        return json.loads(self.metadata_data) if self.metadata_data else {}
    
    @metadata.setter
    def metadata(self, value):
        """Set metadata from Python object"""
        self.metadata_data = json.dumps(value)
    
    def to_dict(self):
        """Convert puzzle to dictionary for API responses"""
        return {
            'id': self.id,
            'puzzleNumber': self.puzzle_number,
            'date': self.date.isoformat() if self.date else None,
            'dayOfWeek': self.day_of_week,
            'difficulty': self.difficulty,
            'difficultyLabel': self.difficulty_label,
            'title': self.title,
            'theme': self.theme,
            'size': self.size,
            'grid': self.grid,
            'solution': self.solution,
            'numbers': self.numbers,
            'clues': self.clues,
            'metadata': self.metadata,
            'isActive': self.is_active,
            'createdBy': self.created_by,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
            'lindyCompatible': self.lindy_compatible,
            'automationReady': self.automation_ready,
            'lastModifiedBy': self.last_modified_by
        }
    
    def to_json_file_format(self):
        """Convert puzzle to JSON file format for bank storage"""
        return {
            'id': self.id,
            'date': self.date.isoformat() if self.date else None,
            'dayOfWeek': self.day_of_week,
            'difficulty': self.difficulty,
            'difficultyLabel': self.difficulty_label,
            'title': self.title,
            'theme': self.theme,
            'size': self.size,
            'grid': self.grid,
            'solution': self.solution,
            'numbers': self.numbers,
            'clues': self.clues,
            'metadata': self.metadata
        }
    
    @classmethod
    def from_dict(cls, data):
        """Create puzzle from dictionary data"""
        puzzle = cls()
        puzzle.id = data.get('id')
        puzzle.puzzle_number = data.get('puzzleNumber', 0)
        puzzle.date = datetime.fromisoformat(data['date']).date() if data.get('date') else None
        puzzle.day_of_week = data.get('dayOfWeek', '')
        puzzle.difficulty = data.get('difficulty', 3)
        puzzle.difficulty_label = data.get('difficultyLabel', 'Medium')
        puzzle.title = data.get('title', '')
        puzzle.theme = data.get('theme', '')
        puzzle.size = data.get('size', 15)
        puzzle.grid = data.get('grid', [])
        puzzle.solution = data.get('solution', [])
        puzzle.numbers = data.get('numbers', [])
        puzzle.clues = data.get('clues', {})
        puzzle.metadata = data.get('metadata', {})
        puzzle.is_active = data.get('isActive', True)
        puzzle.created_by = data.get('createdBy', 'system')
        puzzle.lindy_compatible = data.get('lindyCompatible', True)
        puzzle.automation_ready = data.get('automationReady', True)
        puzzle.last_modified_by = data.get('lastModifiedBy', 'system')
        
        return puzzle
    
    def validate(self):
        """Validate puzzle data structure"""
        errors = []
        
        if not self.id:
            errors.append("Puzzle ID is required")
        
        if not self.title:
            errors.append("Puzzle title is required")
        
        if self.difficulty < 1 or self.difficulty > 5:
            errors.append("Difficulty must be between 1 and 5")
        
        if self.size != 15:
            errors.append("Only 15x15 puzzles are currently supported")
        
        # Validate grid structure
        grid = self.grid
        if not grid or len(grid) != self.size:
            errors.append(f"Grid must be {self.size}x{self.size}")
        else:
            for i, row in enumerate(grid):
                if len(row) != self.size:
                    errors.append(f"Grid row {i} has incorrect length")
        
        # Validate solution matches grid structure
        solution = self.solution
        if not solution or len(solution) != self.size:
            errors.append(f"Solution must be {self.size}x{self.size}")
        else:
            for i, row in enumerate(solution):
                if len(row) != self.size:
                    errors.append(f"Solution row {i} has incorrect length")
        
        # Validate clues structure
        clues = self.clues
        if not isinstance(clues, dict) or 'across' not in clues or 'down' not in clues:
            errors.append("Clues must have 'across' and 'down' sections")
        
        return {
            'isValid': len(errors) == 0,
            'errors': errors
        }
    
    def __repr__(self):
        return f'<Puzzle {self.id}: {self.title}>'


class PuzzleRotation(db.Model):
    """
    Model for tracking puzzle rotation state
    """
    __tablename__ = 'puzzle_rotation'
    
    id = db.Column(db.Integer, primary_key=True)
    current_puzzle_id = db.Column(db.String(50), nullable=False)
    current_puzzle_number = db.Column(db.Integer, nullable=False)
    rotation_date = db.Column(db.Date, nullable=False)
    cycle_day = db.Column(db.Integer, nullable=False)  # 1-30
    cycle_number = db.Column(db.Integer, nullable=False)  # Which 30-day cycle
    days_since_launch = db.Column(db.Integer, nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'currentPuzzleId': self.current_puzzle_id,
            'currentPuzzleNumber': self.current_puzzle_number,
            'rotationDate': self.rotation_date.isoformat() if self.rotation_date else None,
            'cycleDay': self.cycle_day,
            'cycleNumber': self.cycle_number,
            'daysSinceLaunch': self.days_since_launch,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }


class PuzzleInjection(db.Model):
    """
    Model for tracking puzzle injections from Lindy.ai
    """
    __tablename__ = 'puzzle_injections'
    
    id = db.Column(db.Integer, primary_key=True)
    puzzle_id = db.Column(db.String(50), nullable=False)
    replaced_puzzle_id = db.Column(db.String(50), nullable=True)  # Which puzzle was replaced
    injection_source = db.Column(db.String(50), default='lindy')  # 'lindy', 'manual', 'api'
    injection_reason = db.Column(db.String(200), nullable=True)
    
    # Injection metadata
    injected_at = db.Column(db.DateTime, default=datetime.utcnow)
    injected_by = db.Column(db.String(50), default='lindy')
    is_active = db.Column(db.Boolean, default=True)
    
    # Quality metrics
    quality_score = db.Column(db.Float, nullable=True)
    validation_passed = db.Column(db.Boolean, default=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'puzzleId': self.puzzle_id,
            'replacedPuzzleId': self.replaced_puzzle_id,
            'injectionSource': self.injection_source,
            'injectionReason': self.injection_reason,
            'injectedAt': self.injected_at.isoformat() if self.injected_at else None,
            'injectedBy': self.injected_by,
            'isActive': self.is_active,
            'qualityScore': self.quality_score,
            'validationPassed': self.validation_passed
        }

