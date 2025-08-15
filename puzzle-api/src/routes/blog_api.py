from flask import Blueprint, request, jsonify
from datetime import datetime
import json
import os
import sqlite3
import re
from urllib.parse import quote

blog_api = Blueprint('blog_api', __name__, url_prefix='/api/blog')

# Database path for blog data
BLOG_DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'database', 'blog.db')

def init_blog_db():
    """Initialize blog database with required tables"""
    conn = sqlite3.connect(BLOG_DB_PATH)
    cursor = conn.cursor()
    
    # Articles table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS articles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            excerpt TEXT,
            content TEXT NOT NULL,
            author TEXT DEFAULT 'Daily Puzzle Post Team',
            publish_date TEXT NOT NULL,
            status TEXT DEFAULT 'draft',
            read_time TEXT,
            tags TEXT,
            seo_keywords TEXT,
            meta_description TEXT,
            view_count INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # SEO tracking table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS seo_tracking (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            article_id INTEGER,
            keyword TEXT,
            target_density REAL DEFAULT 2.0,
            current_density REAL DEFAULT 0.0,
            rank_position INTEGER,
            search_volume INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (article_id) REFERENCES articles (id)
        )
    ''')
    
    conn.commit()
    conn.close()

# Initialize database on import
init_blog_db()

def generate_slug(title):
    """Generate URL-friendly slug from title"""
    slug = re.sub(r'[^\w\s-]', '', title.lower())
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug.strip('-')

def calculate_read_time(content):
    """Calculate estimated reading time"""
    words = len(content.split())
    minutes = max(1, round(words / 200))  # Average 200 words per minute
    return f"{minutes} min read"

def extract_keywords(content, title):
    """Extract potential SEO keywords from content"""
    # Simple keyword extraction - could be enhanced with NLP
    text = (title + " " + content).lower()
    words = re.findall(r'\b[a-z]{4,}\b', text)
    word_freq = {}
    for word in words:
        if word not in ['this', 'that', 'with', 'have', 'will', 'from', 'they', 'been', 'said', 'each', 'which', 'their']:
            word_freq[word] = word_freq.get(word, 0) + 1
    
    # Return top keywords
    return sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:10]

@blog_api.route('/articles', methods=['GET'])
def get_articles():
    """Get all blog articles with filtering options"""
    try:
        status = request.args.get('status', 'published')
        limit = request.args.get('limit', 50, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        conn = sqlite3.connect(BLOG_DB_PATH)
        cursor = conn.cursor()
        
        if status == 'all':
            cursor.execute('''
                SELECT id, title, slug, excerpt, author, publish_date, status, 
                       read_time, tags, view_count, created_at, updated_at
                FROM articles 
                ORDER BY publish_date DESC 
                LIMIT ? OFFSET ?
            ''', (limit, offset))
        else:
            cursor.execute('''
                SELECT id, title, slug, excerpt, author, publish_date, status, 
                       read_time, tags, view_count, created_at, updated_at
                FROM articles 
                WHERE status = ?
                ORDER BY publish_date DESC 
                LIMIT ? OFFSET ?
            ''', (status, limit, offset))
        
        articles = []
        for row in cursor.fetchall():
            articles.append({
                'id': row[0],
                'title': row[1],
                'slug': row[2],
                'excerpt': row[3],
                'author': row[4],
                'publish_date': row[5],
                'status': row[6],
                'read_time': row[7],
                'tags': row[8].split(',') if row[8] else [],
                'view_count': row[9],
                'created_at': row[10],
                'updated_at': row[11]
            })
        
        # Get total count
        cursor.execute('SELECT COUNT(*) FROM articles WHERE status = ? OR ? = "all"', (status, status))
        total_count = cursor.fetchone()[0]
        
        conn.close()
        
        return jsonify({
            'articles': articles,
            'total': total_count,
            'limit': limit,
            'offset': offset
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@blog_api.route('/articles/<slug>', methods=['GET'])
def get_article(slug):
    """Get specific article by slug"""
    try:
        conn = sqlite3.connect(BLOG_DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, title, slug, excerpt, content, author, publish_date, status,
                   read_time, tags, seo_keywords, meta_description, view_count
            FROM articles 
            WHERE slug = ?
        ''', (slug,))
        
        row = cursor.fetchone()
        if not row:
            return jsonify({'error': 'Article not found'}), 404
        
        # Increment view count
        cursor.execute('UPDATE articles SET view_count = view_count + 1 WHERE slug = ?', (slug,))
        conn.commit()
        
        article = {
            'id': row[0],
            'title': row[1],
            'slug': row[2],
            'excerpt': row[3],
            'content': row[4],
            'author': row[5],
            'publish_date': row[6],
            'status': row[7],
            'read_time': row[8],
            'tags': row[9].split(',') if row[9] else [],
            'seo_keywords': row[10].split(',') if row[10] else [],
            'meta_description': row[11],
            'view_count': row[12] + 1  # Include the increment
        }
        
        conn.close()
        return jsonify(article), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@blog_api.route('/articles', methods=['POST'])
def create_article():
    """Create new blog article (for Lindy.ai automation)"""
    try:
        data = request.get_json()
        
        if not data or 'title' not in data or 'content' not in data:
            return jsonify({'error': 'Missing required fields: title, content'}), 400
        
        # Generate article metadata
        title = data['title']
        content = data['content']
        slug = data.get('slug', generate_slug(title))
        excerpt = data.get('excerpt', content[:200] + '...' if len(content) > 200 else content)
        author = data.get('author', 'Daily Puzzle Post Team')
        publish_date = data.get('publish_date', datetime.now().isoformat())
        status = data.get('status', 'draft')
        read_time = calculate_read_time(content)
        tags = ','.join(data.get('tags', []))
        
        # SEO optimization
        keywords = extract_keywords(content, title)
        seo_keywords = ','.join([kw[0] for kw in keywords[:5]])
        meta_description = data.get('meta_description', excerpt[:160])
        
        conn = sqlite3.connect(BLOG_DB_PATH)
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                INSERT INTO articles (title, slug, excerpt, content, author, publish_date, 
                                    status, read_time, tags, seo_keywords, meta_description)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (title, slug, excerpt, content, author, publish_date, status, 
                  read_time, tags, seo_keywords, meta_description))
            
            article_id = cursor.lastrowid
            
            # Add SEO tracking for keywords
            for keyword, frequency in keywords[:5]:
                cursor.execute('''
                    INSERT INTO seo_tracking (article_id, keyword, current_density)
                    VALUES (?, ?, ?)
                ''', (article_id, keyword, (frequency / len(content.split())) * 100))
            
            conn.commit()
            
            return jsonify({
                'id': article_id,
                'slug': slug,
                'status': 'created',
                'seo_keywords': seo_keywords.split(','),
                'read_time': read_time
            }), 201
            
        except sqlite3.IntegrityError:
            return jsonify({'error': 'Article with this slug already exists'}), 409
        
        finally:
            conn.close()
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@blog_api.route('/articles/<int:article_id>', methods=['PUT'])
def update_article(article_id):
    """Update existing article"""
    try:
        data = request.get_json()
        
        conn = sqlite3.connect(BLOG_DB_PATH)
        cursor = conn.cursor()
        
        # Check if article exists
        cursor.execute('SELECT id FROM articles WHERE id = ?', (article_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Article not found'}), 404
        
        # Build update query dynamically
        update_fields = []
        update_values = []
        
        if 'title' in data:
            update_fields.append('title = ?')
            update_values.append(data['title'])
            
        if 'content' in data:
            update_fields.append('content = ?')
            update_values.append(data['content'])
            # Recalculate read time
            update_fields.append('read_time = ?')
            update_values.append(calculate_read_time(data['content']))
            
        if 'excerpt' in data:
            update_fields.append('excerpt = ?')
            update_values.append(data['excerpt'])
            
        if 'status' in data:
            update_fields.append('status = ?')
            update_values.append(data['status'])
            
        if 'tags' in data:
            update_fields.append('tags = ?')
            update_values.append(','.join(data['tags']))
            
        if 'meta_description' in data:
            update_fields.append('meta_description = ?')
            update_values.append(data['meta_description'])
        
        update_fields.append('updated_at = CURRENT_TIMESTAMP')
        update_values.append(article_id)
        
        cursor.execute(f'''
            UPDATE articles 
            SET {', '.join(update_fields)}
            WHERE id = ?
        ''', update_values)
        
        conn.commit()
        conn.close()
        
        return jsonify({'status': 'updated'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@blog_api.route('/articles/<int:article_id>', methods=['DELETE'])
def delete_article(article_id):
    """Delete article"""
    try:
        conn = sqlite3.connect(BLOG_DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM articles WHERE id = ?', (article_id,))
        cursor.execute('DELETE FROM seo_tracking WHERE article_id = ?', (article_id,))
        
        if cursor.rowcount == 0:
            return jsonify({'error': 'Article not found'}), 404
        
        conn.commit()
        conn.close()
        
        return jsonify({'status': 'deleted'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@blog_api.route('/publish', methods=['POST'])
def publish_article():
    """Publish article (for Lindy.ai automation)"""
    try:
        data = request.get_json()
        article_id = data.get('article_id')
        
        if not article_id:
            return jsonify({'error': 'Missing article_id'}), 400
        
        conn = sqlite3.connect(BLOG_DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE articles 
            SET status = 'published', publish_date = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (datetime.now().isoformat(), article_id))
        
        if cursor.rowcount == 0:
            return jsonify({'error': 'Article not found'}), 404
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'status': 'published',
            'publish_date': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@blog_api.route('/seo/optimize', methods=['POST'])
def optimize_seo():
    """SEO optimization suggestions for Lindy.ai"""
    try:
        data = request.get_json()
        article_id = data.get('article_id')
        target_keywords = data.get('keywords', [])
        
        if not article_id:
            return jsonify({'error': 'Missing article_id'}), 400
        
        conn = sqlite3.connect(BLOG_DB_PATH)
        cursor = conn.cursor()
        
        # Get article content
        cursor.execute('SELECT title, content, meta_description FROM articles WHERE id = ?', (article_id,))
        article = cursor.fetchone()
        
        if not article:
            return jsonify({'error': 'Article not found'}), 404
        
        title, content, meta_description = article
        word_count = len(content.split())
        
        # Analyze current keyword density
        keyword_analysis = []
        for keyword in target_keywords:
            count = content.lower().count(keyword.lower())
            density = (count / word_count) * 100 if word_count > 0 else 0
            
            keyword_analysis.append({
                'keyword': keyword,
                'count': count,
                'density': round(density, 2),
                'target_density': 2.0,
                'status': 'good' if 1.0 <= density <= 3.0 else 'needs_improvement',
                'recommendation': self.get_keyword_recommendation(density, keyword)
            })
        
        # SEO recommendations
        recommendations = []
        
        # Title optimization
        if len(title) < 30:
            recommendations.append({
                'type': 'title',
                'priority': 'high',
                'message': 'Title is too short. Aim for 30-60 characters.',
                'suggestion': f'Expand title to include primary keywords: {target_keywords[0] if target_keywords else "main topic"}'
            })
        elif len(title) > 60:
            recommendations.append({
                'type': 'title',
                'priority': 'medium',
                'message': 'Title is too long. Keep it under 60 characters.',
                'suggestion': 'Shorten title while keeping primary keyword'
            })
        
        # Meta description optimization
        if not meta_description or len(meta_description) < 120:
            recommendations.append({
                'type': 'meta_description',
                'priority': 'high',
                'message': 'Meta description is too short or missing.',
                'suggestion': 'Write compelling 120-160 character description with primary keyword'
            })
        elif len(meta_description) > 160:
            recommendations.append({
                'type': 'meta_description',
                'priority': 'medium',
                'message': 'Meta description is too long.',
                'suggestion': 'Trim to 160 characters or less'
            })
        
        # Content length
        if word_count < 300:
            recommendations.append({
                'type': 'content_length',
                'priority': 'high',
                'message': 'Content is too short for good SEO.',
                'suggestion': 'Expand to at least 300 words with valuable information'
            })
        
        # Keyword density issues
        for kw_analysis in keyword_analysis:
            if kw_analysis['status'] == 'needs_improvement':
                recommendations.append({
                    'type': 'keyword_density',
                    'priority': 'medium',
                    'message': f'Keyword "{kw_analysis["keyword"]}" density is {kw_analysis["density"]}%',
                    'suggestion': kw_analysis['recommendation']
                })
        
        conn.close()
        
        return jsonify({
            'article_id': article_id,
            'seo_score': self.calculate_seo_score(keyword_analysis, recommendations),
            'keyword_analysis': keyword_analysis,
            'recommendations': recommendations,
            'content_stats': {
                'word_count': word_count,
                'title_length': len(title),
                'meta_description_length': len(meta_description) if meta_description else 0
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_keyword_recommendation(self, density, keyword):
    """Get keyword optimization recommendation"""
    if density < 1.0:
        return f'Increase usage of "{keyword}" - aim for 1-3% density'
    elif density > 3.0:
        return f'Reduce usage of "{keyword}" - avoid keyword stuffing'
    else:
        return f'Good keyword density for "{keyword}"'

def calculate_seo_score(self, keyword_analysis, recommendations):
    """Calculate overall SEO score"""
    base_score = 100
    
    # Deduct points for recommendations
    for rec in recommendations:
        if rec['priority'] == 'high':
            base_score -= 15
        elif rec['priority'] == 'medium':
            base_score -= 10
        else:
            base_score -= 5
    
    # Deduct points for poor keyword density
    for kw in keyword_analysis:
        if kw['status'] == 'needs_improvement':
            base_score -= 10
    
    return max(0, base_score)

@blog_api.route('/analytics', methods=['GET'])
def get_blog_analytics():
    """Get blog performance analytics for Lindy.ai"""
    try:
        days = request.args.get('days', 30, type=int)
        
        conn = sqlite3.connect(BLOG_DB_PATH)
        cursor = conn.cursor()
        
        # Get article performance
        cursor.execute('''
            SELECT id, title, slug, view_count, publish_date, status
            FROM articles 
            WHERE datetime(publish_date) >= datetime('now', '-{} days')
            ORDER BY view_count DESC
        '''.format(days))
        
        articles = []
        total_views = 0
        for row in cursor.fetchall():
            article_data = {
                'id': row[0],
                'title': row[1],
                'slug': row[2],
                'views': row[3],
                'publish_date': row[4],
                'status': row[5]
            }
            articles.append(article_data)
            total_views += row[3]
        
        # Get top keywords
        cursor.execute('''
            SELECT s.keyword, COUNT(s.article_id) as article_count, AVG(a.view_count) as avg_views
            FROM seo_tracking s
            JOIN articles a ON s.article_id = a.id
            WHERE datetime(a.publish_date) >= datetime('now', '-{} days')
            GROUP BY s.keyword
            ORDER BY avg_views DESC
            LIMIT 10
        '''.format(days))
        
        top_keywords = [
            {'keyword': row[0], 'articles': row[1], 'avg_views': row[2]}
            for row in cursor.fetchall()
        ]
        
        conn.close()
        
        return jsonify({
            'period_days': days,
            'total_articles': len(articles),
            'total_views': total_views,
            'avg_views_per_article': total_views / len(articles) if articles else 0,
            'top_articles': articles[:10],
            'top_keywords': top_keywords,
            'content_recommendations': [
                'Focus on high-performing keywords' if top_keywords else 'Add more keyword-optimized content',
                'Create more content similar to top-performing articles',
                'Optimize low-performing articles for better SEO'
            ]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Add method binding fix
blog_api.get_keyword_recommendation = get_keyword_recommendation
blog_api.calculate_seo_score = calculate_seo_score

