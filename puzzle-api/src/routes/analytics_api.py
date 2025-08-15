from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import json
import os
import sqlite3
from collections import defaultdict, Counter

analytics_api = Blueprint('analytics_api', __name__, url_prefix='/api/analytics')

# Database path for analytics data
ANALYTICS_DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'database', 'analytics.db')

def init_analytics_db():
    """Initialize analytics database with required tables"""
    conn = sqlite3.connect(ANALYTICS_DB_PATH)
    cursor = conn.cursor()
    
    # Events table for tracking all user interactions
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_name TEXT NOT NULL,
            session_id TEXT,
            user_id TEXT,
            timestamp TEXT NOT NULL,
            is_premium BOOLEAN DEFAULT FALSE,
            event_data TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Daily metrics table for aggregated data
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS daily_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL UNIQUE,
            total_users INTEGER DEFAULT 0,
            total_sessions INTEGER DEFAULT 0,
            total_games_played INTEGER DEFAULT 0,
            total_games_won INTEGER DEFAULT 0,
            premium_conversions INTEGER DEFAULT 0,
            ad_impressions INTEGER DEFAULT 0,
            ad_clicks INTEGER DEFAULT 0,
            avg_session_duration REAL DEFAULT 0,
            bounce_rate REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # User retention table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_retention (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            first_visit TEXT NOT NULL,
            last_visit TEXT NOT NULL,
            total_sessions INTEGER DEFAULT 1,
            total_games_played INTEGER DEFAULT 0,
            is_premium BOOLEAN DEFAULT FALSE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

# Initialize database on import
init_analytics_db()

@analytics_api.route('/track', methods=['POST'])
def track_event():
    """Track analytics events from frontend"""
    try:
        data = request.get_json()
        
        if not data or 'event_name' not in data:
            return jsonify({'error': 'Missing event_name'}), 400
        
        # Store event in database
        conn = sqlite3.connect(ANALYTICS_DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO events (event_name, session_id, user_id, timestamp, is_premium, event_data)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            data['event_name'],
            data.get('session_id'),
            data.get('user_id'),
            data.get('timestamp', datetime.now().isoformat()),
            data.get('is_premium', False),
            json.dumps(data)
        ))
        
        # Update user retention data
        if data.get('user_id'):
            update_user_retention(cursor, data)
        
        conn.commit()
        conn.close()
        
        return jsonify({'status': 'success'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def update_user_retention(cursor, data):
    """Update user retention tracking"""
    user_id = data['user_id']
    current_time = data.get('timestamp', datetime.now().isoformat())
    is_premium = data.get('is_premium', False)
    
    # Check if user exists
    cursor.execute('SELECT * FROM user_retention WHERE user_id = ?', (user_id,))
    user = cursor.fetchone()
    
    if user:
        # Update existing user
        cursor.execute('''
            UPDATE user_retention 
            SET last_visit = ?, total_sessions = total_sessions + 1, 
                is_premium = ?, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
        ''', (current_time, is_premium, user_id))
        
        # Increment games played if it's a game event
        if data['event_name'] in ['game_start', 'game_complete']:
            cursor.execute('''
                UPDATE user_retention 
                SET total_games_played = total_games_played + 1
                WHERE user_id = ?
            ''', (user_id,))
    else:
        # Create new user record
        cursor.execute('''
            INSERT INTO user_retention (user_id, first_visit, last_visit, is_premium)
            VALUES (?, ?, ?, ?)
        ''', (user_id, current_time, current_time, is_premium))

@analytics_api.route('/data', methods=['GET'])
def get_analytics_data():
    """Get analytics data for Lindy.ai automation"""
    try:
        days = request.args.get('days', 30, type=int)
        start_date = datetime.now() - timedelta(days=days)
        
        conn = sqlite3.connect(ANALYTICS_DB_PATH)
        cursor = conn.cursor()
        
        # Get events data
        cursor.execute('''
            SELECT event_name, COUNT(*) as count, 
                   AVG(CASE WHEN is_premium THEN 1 ELSE 0 END) as premium_ratio
            FROM events 
            WHERE datetime(timestamp) >= datetime(?)
            GROUP BY event_name
            ORDER BY count DESC
        ''', (start_date.isoformat(),))
        
        events_data = [
            {'event': row[0], 'count': row[1], 'premium_ratio': row[2]}
            for row in cursor.fetchall()
        ]
        
        # Get daily metrics
        cursor.execute('''
            SELECT date, total_users, total_sessions, total_games_played, 
                   total_games_won, premium_conversions, ad_impressions, ad_clicks
            FROM daily_metrics 
            WHERE date >= date(?)
            ORDER BY date DESC
        ''', (start_date.date().isoformat(),))
        
        daily_metrics = [
            {
                'date': row[0],
                'users': row[1],
                'sessions': row[2],
                'games_played': row[3],
                'games_won': row[4],
                'conversions': row[5],
                'ad_impressions': row[6],
                'ad_clicks': row[7]
            }
            for row in cursor.fetchall()
        ]
        
        # Get user retention data
        cursor.execute('''
            SELECT COUNT(DISTINCT user_id) as total_users,
                   COUNT(DISTINCT CASE WHEN is_premium THEN user_id END) as premium_users,
                   AVG(total_sessions) as avg_sessions_per_user,
                   AVG(total_games_played) as avg_games_per_user
            FROM user_retention
            WHERE datetime(first_visit) >= datetime(?)
        ''', (start_date.isoformat(),))
        
        retention_data = cursor.fetchone()
        
        conn.close()
        
        return jsonify({
            'period_days': days,
            'events': events_data,
            'daily_metrics': daily_metrics,
            'retention': {
                'total_users': retention_data[0] or 0,
                'premium_users': retention_data[1] or 0,
                'avg_sessions_per_user': retention_data[2] or 0,
                'avg_games_per_user': retention_data[3] or 0,
                'conversion_rate': (retention_data[1] / retention_data[0] * 100) if retention_data[0] else 0
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_api.route('/insights', methods=['GET'])
def get_analytics_insights():
    """Get AI-ready analytics insights for Lindy.ai optimization"""
    try:
        conn = sqlite3.connect(ANALYTICS_DB_PATH)
        cursor = conn.cursor()
        
        # Get recent performance trends
        cursor.execute('''
            SELECT 
                COUNT(DISTINCT user_id) as daily_active_users,
                COUNT(DISTINCT session_id) as daily_sessions,
                COUNT(CASE WHEN event_name = 'game_complete' THEN 1 END) as games_completed,
                COUNT(CASE WHEN event_name = 'premium_purchase_success' THEN 1 END) as conversions,
                COUNT(CASE WHEN event_name = 'ad_click' THEN 1 END) as ad_clicks
            FROM events 
            WHERE date(timestamp) = date('now')
        ''')
        
        today_stats = cursor.fetchone()
        
        # Get yesterday's stats for comparison
        cursor.execute('''
            SELECT 
                COUNT(DISTINCT user_id) as daily_active_users,
                COUNT(DISTINCT session_id) as daily_sessions,
                COUNT(CASE WHEN event_name = 'game_complete' THEN 1 END) as games_completed,
                COUNT(CASE WHEN event_name = 'premium_purchase_success' THEN 1 END) as conversions,
                COUNT(CASE WHEN event_name = 'ad_click' THEN 1 END) as ad_clicks
            FROM events 
            WHERE date(timestamp) = date('now', '-1 day')
        ''')
        
        yesterday_stats = cursor.fetchone()
        
        # Calculate trends
        def calculate_trend(today, yesterday):
            if yesterday == 0:
                return 100 if today > 0 else 0
            return ((today - yesterday) / yesterday) * 100
        
        trends = {
            'users': calculate_trend(today_stats[0], yesterday_stats[0]),
            'sessions': calculate_trend(today_stats[1], yesterday_stats[1]),
            'games': calculate_trend(today_stats[2], yesterday_stats[2]),
            'conversions': calculate_trend(today_stats[3], yesterday_stats[3]),
            'ad_performance': calculate_trend(today_stats[4], yesterday_stats[4])
        }
        
        # Get top performing content
        cursor.execute('''
            SELECT json_extract(event_data, '$.game_category') as category,
                   COUNT(*) as plays,
                   AVG(CASE WHEN event_name = 'game_complete' AND 
                           json_extract(event_data, '$.label') = 'won' THEN 1 ELSE 0 END) as win_rate
            FROM events 
            WHERE event_name IN ('game_start', 'game_complete')
            AND json_extract(event_data, '$.game_category') IS NOT NULL
            AND date(timestamp) >= date('now', '-7 days')
            GROUP BY category
            ORDER BY plays DESC
            LIMIT 5
        ''')
        
        top_categories = [
            {'category': row[0], 'plays': row[1], 'win_rate': row[2]}
            for row in cursor.fetchall()
        ]
        
        # Get conversion funnel data
        cursor.execute('''
            SELECT 
                COUNT(CASE WHEN event_name = 'premium_button_click' THEN 1 END) as button_clicks,
                COUNT(CASE WHEN event_name = 'premium_modal_open' THEN 1 END) as modal_opens,
                COUNT(CASE WHEN event_name = 'premium_purchase_attempt' THEN 1 END) as purchase_attempts,
                COUNT(CASE WHEN event_name = 'premium_purchase_success' THEN 1 END) as purchases
            FROM events 
            WHERE date(timestamp) >= date('now', '-7 days')
        ''')
        
        funnel_data = cursor.fetchone()
        
        # Calculate conversion rates
        conversion_funnel = {
            'button_to_modal': (funnel_data[1] / funnel_data[0] * 100) if funnel_data[0] else 0,
            'modal_to_attempt': (funnel_data[2] / funnel_data[1] * 100) if funnel_data[1] else 0,
            'attempt_to_purchase': (funnel_data[3] / funnel_data[2] * 100) if funnel_data[2] else 0,
            'overall_conversion': (funnel_data[3] / funnel_data[0] * 100) if funnel_data[0] else 0
        }
        
        # Generate AI-ready recommendations
        recommendations = []
        
        if trends['conversions'] < -10:
            recommendations.append({
                'type': 'conversion_optimization',
                'priority': 'high',
                'message': 'Premium conversion rate declining. Consider A/B testing new pricing or features.',
                'action': 'test_premium_modal_variants'
            })
        
        if trends['users'] < -5:
            recommendations.append({
                'type': 'user_acquisition',
                'priority': 'medium',
                'message': 'Daily active users decreasing. Focus on retention and re-engagement.',
                'action': 'create_retention_campaign'
            })
        
        if conversion_funnel['button_to_modal'] < 50:
            recommendations.append({
                'type': 'ui_optimization',
                'priority': 'medium',
                'message': 'Low premium button click-through rate. Consider repositioning or rewording.',
                'action': 'optimize_premium_cta'
            })
        
        conn.close()
        
        return jsonify({
            'date': datetime.now().isoformat(),
            'performance_trends': trends,
            'top_content': top_categories,
            'conversion_funnel': conversion_funnel,
            'recommendations': recommendations,
            'summary': {
                'status': 'good' if all(t >= -5 for t in trends.values()) else 'needs_attention',
                'key_metric': max(trends.items(), key=lambda x: abs(x[1])),
                'total_recommendations': len(recommendations)
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_api.route('/performance', methods=['GET'])
def get_performance_metrics():
    """Get performance metrics for Lindy.ai monitoring"""
    try:
        conn = sqlite3.connect(ANALYTICS_DB_PATH)
        cursor = conn.cursor()
        
        # Get page load times
        cursor.execute('''
            SELECT AVG(CAST(json_extract(event_data, '$.value') AS REAL)) as avg_load_time,
                   COUNT(*) as samples
            FROM events 
            WHERE event_name = 'page_load_time'
            AND date(timestamp) >= date('now', '-7 days')
        ''')
        
        load_time_data = cursor.fetchone()
        
        # Get error rates
        cursor.execute('''
            SELECT COUNT(*) as error_count,
                   json_extract(event_data, '$.error_type') as error_type
            FROM events 
            WHERE event_name = 'error'
            AND date(timestamp) >= date('now', '-7 days')
            GROUP BY error_type
            ORDER BY error_count DESC
        ''')
        
        error_data = [
            {'type': row[1], 'count': row[0]}
            for row in cursor.fetchall()
        ]
        
        # Get user engagement metrics
        cursor.execute('''
            SELECT AVG(CAST(json_extract(event_data, '$.value') AS REAL)) as avg_session_time
            FROM events 
            WHERE event_name = 'time_spent'
            AND date(timestamp) >= date('now', '-7 days')
        ''')
        
        engagement_data = cursor.fetchone()
        
        conn.close()
        
        # Performance scoring
        performance_score = 100
        issues = []
        
        if load_time_data[0] and load_time_data[0] > 3000:  # 3 seconds
            performance_score -= 20
            issues.append('Slow page load times')
        
        if len(error_data) > 10:
            performance_score -= 15
            issues.append('High error rate')
        
        if engagement_data[0] and engagement_data[0] < 60:  # Less than 1 minute
            performance_score -= 10
            issues.append('Low user engagement')
        
        return jsonify({
            'performance_score': max(0, performance_score),
            'load_time': {
                'average_ms': load_time_data[0] or 0,
                'samples': load_time_data[1] or 0,
                'status': 'good' if (load_time_data[0] or 0) < 3000 else 'needs_improvement'
            },
            'errors': error_data,
            'engagement': {
                'avg_session_seconds': engagement_data[0] or 0,
                'status': 'good' if (engagement_data[0] or 0) > 60 else 'needs_improvement'
            },
            'issues': issues,
            'recommendations': [
                'Optimize image loading' if load_time_data[0] and load_time_data[0] > 3000 else None,
                'Investigate error sources' if len(error_data) > 10 else None,
                'Improve content engagement' if engagement_data[0] and engagement_data[0] < 60 else None
            ]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_api.route('/export', methods=['GET'])
def export_analytics_data():
    """Export analytics data for external analysis"""
    try:
        format_type = request.args.get('format', 'json')
        days = request.args.get('days', 30, type=int)
        start_date = datetime.now() - timedelta(days=days)
        
        conn = sqlite3.connect(ANALYTICS_DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT event_name, session_id, user_id, timestamp, is_premium, event_data
            FROM events 
            WHERE datetime(timestamp) >= datetime(?)
            ORDER BY timestamp DESC
        ''', (start_date.isoformat(),))
        
        events = cursor.fetchall()
        conn.close()
        
        if format_type == 'csv':
            import csv
            import io
            
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(['event_name', 'session_id', 'user_id', 'timestamp', 'is_premium', 'event_data'])
            writer.writerows(events)
            
            return output.getvalue(), 200, {
                'Content-Type': 'text/csv',
                'Content-Disposition': f'attachment; filename=analytics_export_{datetime.now().strftime("%Y%m%d")}.csv'
            }
        else:
            # JSON format
            return jsonify({
                'export_date': datetime.now().isoformat(),
                'period_days': days,
                'total_events': len(events),
                'events': [
                    {
                        'event_name': event[0],
                        'session_id': event[1],
                        'user_id': event[2],
                        'timestamp': event[3],
                        'is_premium': bool(event[4]),
                        'event_data': json.loads(event[5]) if event[5] else {}
                    }
                    for event in events
                ]
            }), 200
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Register the blueprint in main.py by adding this import and registration

