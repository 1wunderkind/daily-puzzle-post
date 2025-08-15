import json
import os
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import re

class LindyModerationService:
    """
    Automated puzzle moderation service using Lindy.ai
    Handles quality assessment, content filtering, and approval pipeline
    """
    
    def __init__(self):
        self.moderation_prompts = {
            'crossword': self._get_crossword_moderation_prompt(),
            'general': self._get_general_moderation_prompt()
        }
        
        # Quality thresholds
        self.auto_approve_threshold = 7
        self.human_review_threshold = 5
        self.auto_reject_threshold = 5
        
        # Content filters
        self.inappropriate_words = [
            'damn', 'hell', 'hate', 'kill', 'death', 'murder', 'violence',
            'racist', 'sexist', 'offensive', 'inappropriate', 'vulgar',
            'stupid', 'idiot', 'moron', 'dumb', 'retard'
        ]
        
        # Quality metrics
        self.min_word_count = 8
        self.max_word_count = 50
        self.min_grid_fill = 0.6  # 60% of grid should be filled
        
    def _get_crossword_moderation_prompt(self) -> str:
        """Get the Lindy.ai prompt for crossword puzzle moderation"""
        return """
Review this user-submitted crossword puzzle for publication in Daily Puzzle Post newspaper section.

EVALUATION CRITERIA:
1. CONTENT APPROPRIATENESS (family-friendly):
   - No profanity, violence, or inappropriate themes
   - Suitable for all ages including children
   - No controversial political or religious content
   - No offensive stereotypes or discriminatory language

2. PUZZLE VALIDITY:
   - All clues are answerable and accurate
   - Grid pattern is symmetric and follows crossword conventions
   - No isolated letters or invalid word patterns
   - Clues match their corresponding answers
   - Proper numbering system

3. QUALITY ASSESSMENT (1-10 scale):
   - Clue creativity and cleverness (2 points)
   - Grid design and symmetry (2 points)
   - Answer variety and interest (2 points)
   - Difficulty appropriateness (2 points)
   - Overall construction quality (2 points)

4. TECHNICAL REQUIREMENTS:
   - Minimum 8 words, maximum 50 words
   - Grid fill ratio above 60%
   - No duplicate answers
   - Standard crossword grid size (15x15 preferred)

RESPONSE FORMAT:
{
  "approval_status": "approved|human_review|rejected",
  "quality_score": 1-10,
  "content_appropriate": true/false,
  "puzzle_valid": true/false,
  "feedback": "Detailed feedback for constructor",
  "suggested_edits": ["List of specific improvements"],
  "rejection_reason": "Reason if rejected",
  "estimated_difficulty": "easy|medium|hard",
  "theme_detected": "Theme description or 'none'",
  "constructor_notes": "Encouragement and tips for constructor"
}

PUZZLE DATA:
Title: {title}
Author: {author}
Grid Size: {grid_size}
Word Count: {word_count}
Clues: {clue_sample}
Grid Pattern: {grid_pattern}

Provide thorough but constructive feedback that helps constructors improve while maintaining newspaper quality standards.
"""

    def _get_general_moderation_prompt(self) -> str:
        """Get general moderation prompt for other puzzle types"""
        return """
Review this user-submitted puzzle for publication in Daily Puzzle Post.

Evaluate for:
1. Family-friendly content
2. Puzzle validity and solvability
3. Quality score (1-10)
4. Technical correctness

Return approval status and constructive feedback.
"""

    async def moderate_puzzle(self, puzzle_data: Dict, puzzle_type: str = 'crossword') -> Dict:
        """
        Main moderation function - processes puzzle through Lindy.ai
        
        Args:
            puzzle_data: Complete puzzle submission data
            puzzle_type: Type of puzzle (crossword, sudoku, etc.)
            
        Returns:
            Moderation result with approval status and feedback
        """
        try:
            # Pre-screening checks
            pre_screen_result = self._pre_screen_puzzle(puzzle_data)
            if not pre_screen_result['passed']:
                return {
                    'approval_status': 'rejected',
                    'quality_score': 1,
                    'content_appropriate': False,
                    'puzzle_valid': False,
                    'feedback': pre_screen_result['reason'],
                    'suggested_edits': [],
                    'rejection_reason': pre_screen_result['reason'],
                    'automated_decision': True,
                    'moderation_time': datetime.now().isoformat()
                }
            
            # Prepare puzzle for Lindy.ai analysis
            formatted_puzzle = self._format_puzzle_for_analysis(puzzle_data, puzzle_type)
            
            # Get moderation prompt
            prompt = self.moderation_prompts.get(puzzle_type, self.moderation_prompts['general'])
            
            # Format prompt with puzzle data
            formatted_prompt = prompt.format(**formatted_puzzle)
            
            # Send to Lindy.ai for analysis (simulated for now)
            lindy_response = await self._call_lindy_api(formatted_prompt, puzzle_data)
            
            # Process Lindy response
            moderation_result = self._process_lindy_response(lindy_response, puzzle_data)
            
            # Apply business rules
            final_result = self._apply_approval_rules(moderation_result)
            
            # Log moderation decision
            self._log_moderation_decision(puzzle_data, final_result)
            
            return final_result
            
        except Exception as e:
            # Fallback to conservative rejection on error
            return {
                'approval_status': 'human_review',
                'quality_score': 5,
                'content_appropriate': True,
                'puzzle_valid': True,
                'feedback': 'Automatic moderation failed, forwarded for human review.',
                'suggested_edits': [],
                'rejection_reason': '',
                'error': str(e),
                'automated_decision': False,
                'moderation_time': datetime.now().isoformat()
            }

    def _pre_screen_puzzle(self, puzzle_data: Dict) -> Dict:
        """
        Quick pre-screening checks before sending to Lindy.ai
        Catches obvious issues to save API calls
        """
        issues = []
        
        # Check for inappropriate content
        all_text = json.dumps(puzzle_data).lower()
        for word in self.inappropriate_words:
            if word in all_text:
                issues.append(f'Contains inappropriate content: {word}')
        
        # Check basic structure
        if not puzzle_data.get('title') or len(puzzle_data['title']) < 3:
            issues.append('Title too short or missing')
        
        if not puzzle_data.get('author') or len(puzzle_data['author']) < 2:
            issues.append('Author name too short or missing')
        
        # Check puzzle-specific requirements
        if puzzle_data.get('metadata', {}).get('word_count', 0) < self.min_word_count:
            issues.append(f'Too few words (minimum {self.min_word_count})')
        
        if puzzle_data.get('metadata', {}).get('word_count', 0) > self.max_word_count:
            issues.append(f'Too many words (maximum {self.max_word_count})')
        
        # Check grid structure for crosswords
        if 'grid' in puzzle_data:
            grid_issues = self._validate_grid_structure(puzzle_data['grid'])
            issues.extend(grid_issues)
        
        return {
            'passed': len(issues) == 0,
            'reason': '; '.join(issues) if issues else '',
            'issues': issues
        }

    def _validate_grid_structure(self, grid: List[List]) -> List[str]:
        """Validate crossword grid structure"""
        issues = []
        
        if not grid or len(grid) == 0:
            issues.append('Empty grid')
            return issues
        
        # Check grid dimensions
        rows = len(grid)
        cols = len(grid[0]) if grid else 0
        
        if rows != cols:
            issues.append('Grid must be square')
        
        if rows < 5 or rows > 21:
            issues.append('Grid size must be between 5x5 and 21x21')
        
        # Check fill ratio
        total_cells = rows * cols
        filled_cells = 0
        
        for row in grid:
            for cell in row:
                if isinstance(cell, dict) and not cell.get('isBlack', False):
                    filled_cells += 1
                elif isinstance(cell, str) and cell != '#':
                    filled_cells += 1
        
        fill_ratio = filled_cells / total_cells if total_cells > 0 else 0
        if fill_ratio < self.min_grid_fill:
            issues.append(f'Grid fill ratio too low ({fill_ratio:.1%}, minimum {self.min_grid_fill:.1%})')
        
        return issues

    def _format_puzzle_for_analysis(self, puzzle_data: Dict, puzzle_type: str) -> Dict:
        """Format puzzle data for Lindy.ai analysis"""
        
        # Extract key information
        title = puzzle_data.get('title', 'Untitled')
        author = puzzle_data.get('author', 'Anonymous')
        grid = puzzle_data.get('grid', [])
        clues = puzzle_data.get('clues', {})
        metadata = puzzle_data.get('metadata', {})
        
        # Calculate grid size
        grid_size = f"{len(grid)}x{len(grid[0])}" if grid and len(grid) > 0 else "Unknown"
        
        # Get word count
        word_count = metadata.get('word_count', 0)
        
        # Sample clues for analysis
        clue_sample = self._get_clue_sample(clues)
        
        # Analyze grid pattern
        grid_pattern = self._analyze_grid_pattern(grid)
        
        return {
            'title': title,
            'author': author,
            'grid_size': grid_size,
            'word_count': word_count,
            'clue_sample': clue_sample,
            'grid_pattern': grid_pattern,
            'difficulty': puzzle_data.get('difficulty', 'medium'),
            'theme': puzzle_data.get('theme', 'none')
        }

    def _get_clue_sample(self, clues: Dict) -> str:
        """Get a sample of clues for analysis"""
        sample_clues = []
        
        # Get first 3 across clues
        across_clues = clues.get('across', {})
        for i, (number, clue_data) in enumerate(list(across_clues.items())[:3]):
            if isinstance(clue_data, dict):
                clue_text = clue_data.get('clue', str(clue_data))
                answer = clue_data.get('answer', '')
            else:
                clue_text = str(clue_data)
                answer = ''
            
            sample_clues.append(f"{number}A: {clue_text} ({answer})")
        
        # Get first 3 down clues
        down_clues = clues.get('down', {})
        for i, (number, clue_data) in enumerate(list(down_clues.items())[:3]):
            if isinstance(clue_data, dict):
                clue_text = clue_data.get('clue', str(clue_data))
                answer = clue_data.get('answer', '')
            else:
                clue_text = str(clue_data)
                answer = ''
            
            sample_clues.append(f"{number}D: {clue_text} ({answer})")
        
        return '\n'.join(sample_clues)

    def _analyze_grid_pattern(self, grid: List[List]) -> str:
        """Analyze grid pattern for symmetry and structure"""
        if not grid:
            return "No grid provided"
        
        rows = len(grid)
        cols = len(grid[0]) if grid else 0
        
        # Check for rotational symmetry
        is_symmetric = self._check_rotational_symmetry(grid)
        
        # Count black squares
        black_squares = 0
        for row in grid:
            for cell in row:
                if isinstance(cell, dict) and cell.get('isBlack', False):
                    black_squares += 1
                elif cell == '#':
                    black_squares += 1
        
        total_squares = rows * cols
        black_percentage = (black_squares / total_squares * 100) if total_squares > 0 else 0
        
        return f"Size: {rows}x{cols}, Black squares: {black_squares} ({black_percentage:.1f}%), Symmetric: {is_symmetric}"

    def _check_rotational_symmetry(self, grid: List[List]) -> bool:
        """Check if grid has 180-degree rotational symmetry"""
        if not grid:
            return False
        
        rows = len(grid)
        cols = len(grid[0]) if grid else 0
        
        for i in range(rows):
            for j in range(cols):
                # Check if cell at (i,j) matches cell at (rows-1-i, cols-1-j)
                cell1 = grid[i][j]
                cell2 = grid[rows-1-i][cols-1-j]
                
                # Extract black status
                is_black1 = (isinstance(cell1, dict) and cell1.get('isBlack', False)) or cell1 == '#'
                is_black2 = (isinstance(cell2, dict) and cell2.get('isBlack', False)) or cell2 == '#'
                
                if is_black1 != is_black2:
                    return False
        
        return True

    async def _call_lindy_api(self, prompt: str, puzzle_data: Dict) -> Dict:
        """
        Call Lindy.ai API for puzzle moderation
        (Simulated for now - replace with actual API call)
        """
        # Simulate Lindy.ai response based on puzzle quality
        # In production, this would make an actual API call to Lindy.ai
        
        # Simulate analysis delay
        import asyncio
        await asyncio.sleep(1)
        
        # Generate simulated response based on puzzle characteristics
        simulated_response = self._generate_simulated_response(puzzle_data)
        
        return simulated_response

    def _generate_simulated_response(self, puzzle_data: Dict) -> Dict:
        """Generate simulated Lindy.ai response for testing"""
        
        # Calculate quality score based on puzzle characteristics
        quality_score = 5  # Base score
        
        # Adjust based on word count
        word_count = puzzle_data.get('metadata', {}).get('word_count', 0)
        if word_count >= 15:
            quality_score += 1
        if word_count >= 20:
            quality_score += 1
        
        # Adjust based on title quality
        title = puzzle_data.get('title', '')
        if len(title) > 10 and not any(word in title.lower() for word in ['test', 'untitled', 'puzzle']):
            quality_score += 1
        
        # Adjust based on clue quality (simulated)
        clues = puzzle_data.get('clues', {})
        total_clues = len(clues.get('across', {})) + len(clues.get('down', {}))
        if total_clues >= word_count:  # All words have clues
            quality_score += 1
        
        # Adjust based on grid structure
        grid = puzzle_data.get('grid', [])
        if grid and len(grid) == 15 and len(grid[0]) == 15:  # Standard size
            quality_score += 1
        
        # Cap at 10
        quality_score = min(quality_score, 10)
        
        # Determine approval status
        if quality_score >= self.auto_approve_threshold:
            approval_status = 'approved'
        elif quality_score >= self.human_review_threshold:
            approval_status = 'human_review'
        else:
            approval_status = 'rejected'
        
        # Generate feedback
        feedback_parts = []
        if quality_score >= 7:
            feedback_parts.append("Excellent puzzle construction!")
        elif quality_score >= 5:
            feedback_parts.append("Good puzzle with room for improvement.")
        else:
            feedback_parts.append("Puzzle needs significant improvements.")
        
        suggested_edits = []
        if word_count < 15:
            suggested_edits.append("Consider adding more words for better fill")
        if total_clues < word_count:
            suggested_edits.append("Ensure all words have clues")
        
        return {
            'approval_status': approval_status,
            'quality_score': quality_score,
            'content_appropriate': True,
            'puzzle_valid': True,
            'feedback': ' '.join(feedback_parts),
            'suggested_edits': suggested_edits,
            'rejection_reason': 'Quality below publication standards' if approval_status == 'rejected' else '',
            'estimated_difficulty': puzzle_data.get('difficulty', 'medium'),
            'theme_detected': puzzle_data.get('theme', 'none'),
            'constructor_notes': 'Keep constructing! Practice makes perfect.'
        }

    def _process_lindy_response(self, lindy_response: Dict, puzzle_data: Dict) -> Dict:
        """Process and validate Lindy.ai response"""
        
        # Ensure required fields are present
        processed_response = {
            'approval_status': lindy_response.get('approval_status', 'human_review'),
            'quality_score': max(1, min(10, lindy_response.get('quality_score', 5))),
            'content_appropriate': lindy_response.get('content_appropriate', True),
            'puzzle_valid': lindy_response.get('puzzle_valid', True),
            'feedback': lindy_response.get('feedback', 'No feedback provided'),
            'suggested_edits': lindy_response.get('suggested_edits', []),
            'rejection_reason': lindy_response.get('rejection_reason', ''),
            'estimated_difficulty': lindy_response.get('estimated_difficulty', 'medium'),
            'theme_detected': lindy_response.get('theme_detected', 'none'),
            'constructor_notes': lindy_response.get('constructor_notes', ''),
            'moderation_time': datetime.now().isoformat(),
            'automated_decision': True
        }
        
        return processed_response

    def _apply_approval_rules(self, moderation_result: Dict) -> Dict:
        """Apply business rules to determine final approval status"""
        
        quality_score = moderation_result['quality_score']
        content_appropriate = moderation_result['content_appropriate']
        puzzle_valid = moderation_result['puzzle_valid']
        
        # Override approval if content is inappropriate or puzzle is invalid
        if not content_appropriate or not puzzle_valid:
            moderation_result['approval_status'] = 'rejected'
            if not content_appropriate:
                moderation_result['rejection_reason'] = 'Content not appropriate for family newspaper'
            elif not puzzle_valid:
                moderation_result['rejection_reason'] = 'Puzzle structure or clues are invalid'
        
        # Apply quality thresholds
        elif quality_score >= self.auto_approve_threshold:
            moderation_result['approval_status'] = 'approved'
        elif quality_score >= self.human_review_threshold:
            moderation_result['approval_status'] = 'human_review'
        else:
            moderation_result['approval_status'] = 'rejected'
            moderation_result['rejection_reason'] = 'Quality below publication standards'
        
        return moderation_result

    def _log_moderation_decision(self, puzzle_data: Dict, moderation_result: Dict):
        """Log moderation decision for analytics and auditing"""
        
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'puzzle_id': puzzle_data.get('id', 'unknown'),
            'puzzle_title': puzzle_data.get('title', 'Untitled'),
            'author': puzzle_data.get('author', 'Anonymous'),
            'approval_status': moderation_result['approval_status'],
            'quality_score': moderation_result['quality_score'],
            'content_appropriate': moderation_result['content_appropriate'],
            'puzzle_valid': moderation_result['puzzle_valid'],
            'word_count': puzzle_data.get('metadata', {}).get('word_count', 0),
            'automated_decision': moderation_result.get('automated_decision', True)
        }
        
        # In production, this would write to a proper logging system
        log_dir = '/home/ubuntu/daily-puzzle-post-github/community/logs'
        os.makedirs(log_dir, exist_ok=True)
        
        log_file = os.path.join(log_dir, f"moderation_{datetime.now().strftime('%Y%m%d')}.jsonl")
        with open(log_file, 'a') as f:
            f.write(json.dumps(log_entry) + '\n')

    def get_moderation_stats(self, days: int = 7) -> Dict:
        """Get moderation statistics for the past N days"""
        
        stats = {
            'total_submissions': 0,
            'approved': 0,
            'rejected': 0,
            'human_review': 0,
            'average_quality_score': 0,
            'top_rejection_reasons': {},
            'daily_breakdown': {}
        }
        
        # Read log files for the past N days
        log_dir = '/home/ubuntu/daily-puzzle-post-github/community/logs'
        if not os.path.exists(log_dir):
            return stats
        
        quality_scores = []
        rejection_reasons = {}
        
        for i in range(days):
            date = (datetime.now() - timedelta(days=i)).strftime('%Y%m%d')
            log_file = os.path.join(log_dir, f"moderation_{date}.jsonl")
            
            daily_stats = {'approved': 0, 'rejected': 0, 'human_review': 0}
            
            if os.path.exists(log_file):
                with open(log_file, 'r') as f:
                    for line in f:
                        try:
                            entry = json.loads(line.strip())
                            stats['total_submissions'] += 1
                            
                            status = entry['approval_status']
                            daily_stats[status] = daily_stats.get(status, 0) + 1
                            stats[status] += 1
                            
                            quality_scores.append(entry['quality_score'])
                            
                            if status == 'rejected' and entry.get('rejection_reason'):
                                reason = entry['rejection_reason']
                                rejection_reasons[reason] = rejection_reasons.get(reason, 0) + 1
                            
                        except json.JSONDecodeError:
                            continue
            
            stats['daily_breakdown'][date] = daily_stats
        
        # Calculate average quality score
        if quality_scores:
            stats['average_quality_score'] = sum(quality_scores) / len(quality_scores)
        
        # Get top rejection reasons
        stats['top_rejection_reasons'] = dict(sorted(rejection_reasons.items(), key=lambda x: x[1], reverse=True)[:5])
        
        return stats

# Global instance
lindy_moderator = LindyModerationService()

