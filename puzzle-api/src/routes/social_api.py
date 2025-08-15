from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import json
import os
import sqlite3
import hashlib
import hmac

social_api = Blueprint('social_api', __name__, url_prefix='/api/social')

# Database path for social media data
SOCIAL_DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'database', 'social.db')

def init_social_db():
    """Initialize social media database with required tables"""
    conn = sqlite3.connect(SOCIAL_DB_PATH)
    cursor = conn.cursor()
    
    # Social posts table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS social_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            platform TEXT NOT NULL,
            content TEXT NOT NULL,
            media_url TEXT,
            scheduled_time TEXT,
            posted_time TEXT,
            status TEXT DEFAULT 'scheduled',
            post_id TEXT,
            engagement_data TEXT,
            hashtags TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Social accounts table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS social_accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            platform TEXT NOT NULL UNIQUE,
            account_id TEXT,
            access_token TEXT,
            refresh_token TEXT,
            token_expires TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            account_info TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Social analytics table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS social_analytics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id INTEGER,
            platform TEXT NOT NULL,
            metric_name TEXT NOT NULL,
            metric_value INTEGER DEFAULT 0,
            recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (post_id) REFERENCES social_posts (id)
        )
    ''')
    
    # Content templates table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS content_templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            platform TEXT NOT NULL,
            template_text TEXT NOT NULL,
            variables TEXT,
            category TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            usage_count INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

# Initialize database on import
init_social_db()

@social_api.route('/post', methods=['POST'])
def create_social_post():
    """Create and optionally schedule a social media post (for Lindy.ai)"""
    try:
        data = request.get_json()
        
        if not data or 'platform' not in data or 'content' not in data:
            return jsonify({'error': 'Missing required fields: platform, content'}), 400
        
        platform = data['platform'].lower()
        content = data['content']
        media_url = data.get('media_url')
        scheduled_time = data.get('scheduled_time')
        hashtags = ','.join(data.get('hashtags', []))
        
        # Validate platform
        supported_platforms = ['twitter', 'facebook', 'instagram', 'linkedin']
        if platform not in supported_platforms:
            return jsonify({'error': f'Unsupported platform. Supported: {supported_platforms}'}), 400
        
        # Validate content length based on platform
        max_lengths = {
            'twitter': 280,
            'facebook': 63206,
            'instagram': 2200,
            'linkedin': 3000
        }
        
        if len(content) > max_lengths[platform]:
            return jsonify({
                'error': f'Content too long for {platform}. Max: {max_lengths[platform]} characters'
            }), 400
        
        conn = sqlite3.connect(SOCIAL_DB_PATH)
        cursor = conn.cursor()
        
        # Determine status
        status = 'scheduled' if scheduled_time else 'ready'
        posted_time = None if scheduled_time else datetime.now().isoformat()
        
        cursor.execute('''
            INSERT INTO social_posts (platform, content, media_url, scheduled_time, 
                                    posted_time, status, hashtags)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (platform, content, media_url, scheduled_time, posted_time, status, hashtags))
        
        post_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        # If not scheduled, simulate immediate posting
        if not scheduled_time:
            # In a real implementation, this would call the actual social media APIs
            result = simulate_post_to_platform(platform, content, media_url, hashtags)
            
            # Update post with result
            conn = sqlite3.connect(SOCIAL_DB_PATH)
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE social_posts 
                SET status = ?, post_id = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (result['status'], result.get('external_post_id'), post_id))
            conn.commit()
            conn.close()
        
        return jsonify({
            'id': post_id,
            'platform': platform,
            'status': status,
            'scheduled_for': scheduled_time,
            'character_count': len(content),
            'hashtag_count': len(data.get('hashtags', []))
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def simulate_post_to_platform(platform, content, media_url, hashtags):
    """Simulate posting to social media platform (replace with real API calls)"""
    # This is a simulation - in production, integrate with actual APIs
    import random
    
    success_rate = 0.95  # 95% success rate simulation
    
    if random.random() < success_rate:
        return {
            'status': 'posted',
            'external_post_id': f'{platform}_{datetime.now().strftime("%Y%m%d_%H%M%S")}_{random.randint(1000, 9999)}'
        }
    else:
        return {
            'status': 'failed',
            'error': 'Simulated API error'
        }

@social_api.route('/schedule', methods=['POST'])
def schedule_posts():
    """Schedule multiple posts for optimal timing (for Lindy.ai automation)"""
    try:
        data = request.get_json()
        posts = data.get('posts', [])
        
        if not posts:
            return jsonify({'error': 'No posts provided'}), 400
        
        # Optimal posting times by platform (can be customized)
        optimal_times = {
            'twitter': ['09:00', '15:00', '21:00'],
            'facebook': ['13:00', '15:00', '19:00'],
            'instagram': ['11:00', '14:00', '17:00'],
            'linkedin': ['08:00', '12:00', '17:00']
        }
        
        scheduled_posts = []
        base_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        for i, post_data in enumerate(posts):
            platform = post_data['platform'].lower()
            
            # Calculate optimal posting time
            day_offset = i // len(optimal_times.get(platform, ['12:00']))
            time_index = i % len(optimal_times.get(platform, ['12:00']))
            optimal_time = optimal_times.get(platform, ['12:00'])[time_index]
            
            hour, minute = map(int, optimal_time.split(':'))
            scheduled_datetime = base_date + timedelta(days=day_offset, hours=hour, minutes=minute)
            
            # Create scheduled post
            post_result = create_scheduled_post(
                platform=platform,
                content=post_data['content'],
                media_url=post_data.get('media_url'),
                hashtags=post_data.get('hashtags', []),
                scheduled_time=scheduled_datetime.isoformat()
            )
            
            scheduled_posts.append({
                'platform': platform,
                'scheduled_time': scheduled_datetime.isoformat(),
                'post_id': post_result['id'],
                'optimal_slot': optimal_time
            })
        
        return jsonify({
            'scheduled_posts': len(scheduled_posts),
            'posts': scheduled_posts,
            'next_post_time': min(post['scheduled_time'] for post in scheduled_posts)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def create_scheduled_post(platform, content, media_url, hashtags, scheduled_time):
    """Helper function to create a scheduled post"""
    conn = sqlite3.connect(SOCIAL_DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO social_posts (platform, content, media_url, scheduled_time, 
                                status, hashtags)
        VALUES (?, ?, ?, ?, 'scheduled', ?)
    ''', (platform, content, media_url, scheduled_time, ','.join(hashtags)))
    
    post_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return {'id': post_id}

@social_api.route('/posts', methods=['GET'])
def get_social_posts():
    """Get social media posts with filtering"""
    try:
        platform = request.args.get('platform')
        status = request.args.get('status')
        limit = request.args.get('limit', 50, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        conn = sqlite3.connect(SOCIAL_DB_PATH)
        cursor = conn.cursor()
        
        # Build query with filters
        where_conditions = []
        params = []
        
        if platform:
            where_conditions.append('platform = ?')
            params.append(platform.lower())
        
        if status:
            where_conditions.append('status = ?')
            params.append(status)
        
        where_clause = 'WHERE ' + ' AND '.join(where_conditions) if where_conditions else ''
        
        cursor.execute(f'''
            SELECT id, platform, content, media_url, scheduled_time, posted_time, 
                   status, post_id, hashtags, created_at
            FROM social_posts 
            {where_clause}
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        ''', params + [limit, offset])
        
        posts = []
        for row in cursor.fetchall():
            posts.append({
                'id': row[0],
                'platform': row[1],
                'content': row[2],
                'media_url': row[3],
                'scheduled_time': row[4],
                'posted_time': row[5],
                'status': row[6],
                'external_post_id': row[7],
                'hashtags': row[8].split(',') if row[8] else [],
                'created_at': row[9]
            })
        
        conn.close()
        
        return jsonify({
            'posts': posts,
            'count': len(posts),
            'limit': limit,
            'offset': offset
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@social_api.route('/analytics', methods=['GET'])
def get_social_analytics():
    """Get social media analytics for Lindy.ai optimization"""
    try:
        days = request.args.get('days', 7, type=int)
        platform = request.args.get('platform')
        
        conn = sqlite3.connect(SOCIAL_DB_PATH)
        cursor = conn.cursor()
        
        # Build platform filter
        platform_filter = 'AND platform = ?' if platform else ''
        platform_params = [platform] if platform else []
        
        # Get post performance
        cursor.execute(f'''
            SELECT platform, COUNT(*) as post_count,
                   COUNT(CASE WHEN status = 'posted' THEN 1 END) as successful_posts,
                   COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_posts
            FROM social_posts 
            WHERE datetime(created_at) >= datetime('now', '-{days} days')
            {platform_filter}
            GROUP BY platform
        ''', platform_params)
        
        platform_stats = []
        for row in cursor.fetchall():
            success_rate = (row[2] / row[1] * 100) if row[1] > 0 else 0
            platform_stats.append({
                'platform': row[0],
                'total_posts': row[1],
                'successful_posts': row[2],
                'failed_posts': row[3],
                'success_rate': round(success_rate, 2)
            })
        
        # Get engagement metrics (simulated data - replace with real API data)
        cursor.execute(f'''
            SELECT s.platform, AVG(a.metric_value) as avg_engagement
            FROM social_posts s
            LEFT JOIN social_analytics a ON s.id = a.post_id
            WHERE datetime(s.created_at) >= datetime('now', '-{days} days')
            {platform_filter}
            AND a.metric_name = 'engagement'
            GROUP BY s.platform
        ''', platform_params)
        
        engagement_data = {row[0]: row[1] for row in cursor.fetchall()}
        
        # Get top performing content
        cursor.execute(f'''
            SELECT content, platform, hashtags, 
                   COALESCE(AVG(a.metric_value), 0) as avg_engagement
            FROM social_posts s
            LEFT JOIN social_analytics a ON s.id = a.post_id
            WHERE datetime(s.created_at) >= datetime('now', '-{days} days')
            {platform_filter}
            AND s.status = 'posted'
            GROUP BY s.id
            ORDER BY avg_engagement DESC
            LIMIT 5
        ''', platform_params)
        
        top_content = []
        for row in cursor.fetchall():
            top_content.append({
                'content_preview': row[0][:100] + '...' if len(row[0]) > 100 else row[0],
                'platform': row[1],
                'hashtags': row[2].split(',') if row[2] else [],
                'engagement': row[3]
            })
        
        # Generate recommendations for Lindy.ai
        recommendations = []
        
        for stat in platform_stats:
            if stat['success_rate'] < 90:
                recommendations.append({
                    'type': 'posting_reliability',
                    'platform': stat['platform'],
                    'message': f"Low success rate on {stat['platform']} ({stat['success_rate']}%)",
                    'action': 'check_api_credentials_and_content_guidelines'
                })
            
            if stat['total_posts'] < 3:
                recommendations.append({
                    'type': 'posting_frequency',
                    'platform': stat['platform'],
                    'message': f"Low posting frequency on {stat['platform']}",
                    'action': 'increase_content_creation_for_platform'
                })
        
        conn.close()
        
        return jsonify({
            'period_days': days,
            'platform_stats': platform_stats,
            'engagement_data': engagement_data,
            'top_content': top_content,
            'recommendations': recommendations,
            'summary': {
                'total_posts': sum(stat['total_posts'] for stat in platform_stats),
                'avg_success_rate': sum(stat['success_rate'] for stat in platform_stats) / len(platform_stats) if platform_stats else 0,
                'active_platforms': len(platform_stats)
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@social_api.route('/templates', methods=['GET'])
def get_content_templates():
    """Get content templates for automated posting"""
    try:
        platform = request.args.get('platform')
        category = request.args.get('category')
        
        conn = sqlite3.connect(SOCIAL_DB_PATH)
        cursor = conn.cursor()
        
        # Build query with filters
        where_conditions = ['is_active = 1']
        params = []
        
        if platform:
            where_conditions.append('platform = ?')
            params.append(platform.lower())
        
        if category:
            where_conditions.append('category = ?')
            params.append(category)
        
        where_clause = 'WHERE ' + ' AND '.join(where_conditions)
        
        cursor.execute(f'''
            SELECT id, name, platform, template_text, variables, category, usage_count
            FROM content_templates 
            {where_clause}
            ORDER BY usage_count DESC
        ''', params)
        
        templates = []
        for row in cursor.fetchall():
            templates.append({
                'id': row[0],
                'name': row[1],
                'platform': row[2],
                'template': row[3],
                'variables': row[4].split(',') if row[4] else [],
                'category': row[5],
                'usage_count': row[6]
            })
        
        conn.close()
        
        return jsonify({
            'templates': templates,
            'count': len(templates)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@social_api.route('/templates', methods=['POST'])
def create_content_template():
    """Create new content template for Lindy.ai automation"""
    try:
        data = request.get_json()
        
        required_fields = ['name', 'platform', 'template_text']
        if not all(field in data for field in required_fields):
            return jsonify({'error': f'Missing required fields: {required_fields}'}), 400
        
        conn = sqlite3.connect(SOCIAL_DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO content_templates (name, platform, template_text, variables, category)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            data['name'],
            data['platform'].lower(),
            data['template_text'],
            ','.join(data.get('variables', [])),
            data.get('category', 'general')
        ))
        
        template_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'id': template_id,
            'status': 'created'
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@social_api.route('/generate-content', methods=['POST'])
def generate_content():
    """Generate social media content using templates (for Lindy.ai)"""
    try:
        data = request.get_json()
        template_id = data.get('template_id')
        variables = data.get('variables', {})
        
        if not template_id:
            return jsonify({'error': 'Missing template_id'}), 400
        
        conn = sqlite3.connect(SOCIAL_DB_PATH)
        cursor = conn.cursor()
        
        # Get template
        cursor.execute('''
            SELECT template_text, platform, variables, usage_count
            FROM content_templates 
            WHERE id = ? AND is_active = 1
        ''', (template_id,))
        
        template_data = cursor.fetchone()
        if not template_data:
            return jsonify({'error': 'Template not found or inactive'}), 404
        
        template_text, platform, template_vars, usage_count = template_data
        
        # Replace variables in template
        content = template_text
        for var_name, var_value in variables.items():
            content = content.replace(f'{{{var_name}}}', str(var_value))
        
        # Update usage count
        cursor.execute('''
            UPDATE content_templates 
            SET usage_count = usage_count + 1, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (template_id,))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'content': content,
            'platform': platform,
            'character_count': len(content),
            'template_id': template_id,
            'variables_used': list(variables.keys())
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@social_api.route('/optimal-times', methods=['GET'])
def get_optimal_posting_times():
    """Get optimal posting times by platform for Lindy.ai scheduling"""
    try:
        platform = request.args.get('platform')
        
        # Default optimal times (can be enhanced with real analytics)
        optimal_times = {
            'twitter': {
                'weekdays': ['09:00', '15:00', '21:00'],
                'weekends': ['10:00', '14:00', '20:00'],
                'timezone': 'UTC'
            },
            'facebook': {
                'weekdays': ['13:00', '15:00', '19:00'],
                'weekends': ['12:00', '14:00', '18:00'],
                'timezone': 'UTC'
            },
            'instagram': {
                'weekdays': ['11:00', '14:00', '17:00'],
                'weekends': ['10:00', '13:00', '16:00'],
                'timezone': 'UTC'
            },
            'linkedin': {
                'weekdays': ['08:00', '12:00', '17:00'],
                'weekends': ['09:00', '14:00'],
                'timezone': 'UTC'
            }
        }
        
        if platform:
            platform = platform.lower()
            if platform in optimal_times:
                return jsonify({
                    'platform': platform,
                    'optimal_times': optimal_times[platform]
                }), 200
            else:
                return jsonify({'error': 'Platform not supported'}), 400
        else:
            return jsonify({
                'all_platforms': optimal_times
            }), 200
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

