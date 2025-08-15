from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import json
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from services.content_generator import ContentGenerator
from services.meta_optimizer import MetaTagOptimizer

content_api = Blueprint('content_api', __name__)
content_generator = ContentGenerator()
meta_optimizer = MetaTagOptimizer()

@content_api.route('/api/content/blog/generate', methods=['POST'])
def generate_blog_post():
    """Generate SEO-optimized blog post"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['topic', 'target_keyword']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        # Generate blog post
        blog_post = content_generator.generate_blog_post(
            topic=data['topic'],
            target_keyword=data['target_keyword'],
            word_count=data.get('word_count', 1500)
        )
        
        # Optimize meta tags
        meta_optimization = meta_optimizer.optimize_title_tag(
            current_title=blog_post['title'],
            target_keyword=data['target_keyword'],
            page_type='blog'
        )
        
        description_optimization = meta_optimizer.optimize_meta_description(
            current_description=blog_post['meta_description'],
            target_keyword=data['target_keyword'],
            page_type='blog'
        )
        
        # Generate structured data
        structured_data = meta_optimizer.generate_structured_data({
            'type': 'blog',
            'title': blog_post['title'],
            'description': blog_post['meta_description'],
            'slug': blog_post['slug'],
            'published_date': blog_post['published_date'],
            'keywords': blog_post['keywords'],
            'word_count': blog_post['word_count']
        })
        
        # Combine results
        result = {
            'success': True,
            'blog_post': blog_post,
            'meta_optimization': {
                'title': meta_optimization,
                'description': description_optimization
            },
            'structured_data': structured_data,
            'seo_score': _calculate_content_seo_score(blog_post, data['target_keyword'])
        }
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@content_api.route('/api/content/faq/generate', methods=['POST'])
def generate_faq_section():
    """Generate comprehensive FAQ section"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if 'topic' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required field: topic'
            }), 400
        
        # Generate FAQ section
        faq_section = content_generator.generate_faq_section(
            topic=data['topic'],
            target_keywords=data.get('target_keywords', [data['topic']])
        )
        
        # Generate structured data
        structured_data = meta_optimizer.generate_structured_data({
            'type': 'faq',
            'title': faq_section['title'],
            'description': faq_section['meta_description'],
            'slug': faq_section['slug'],
            'faqs': faq_section['faq_items']
        })
        
        result = {
            'success': True,
            'faq_section': faq_section,
            'structured_data': structured_data,
            'seo_score': _calculate_faq_seo_score(faq_section)
        }
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@content_api.route('/api/content/daily-challenge/generate', methods=['POST'])
def generate_daily_challenge():
    """Generate daily challenge content"""
    try:
        data = request.get_json()
        
        # Parse date if provided, otherwise use today
        challenge_date = datetime.utcnow()
        if 'date' in data:
            try:
                challenge_date = datetime.fromisoformat(data['date'].replace('Z', '+00:00'))
            except ValueError:
                return jsonify({
                    'success': False,
                    'error': 'Invalid date format. Use ISO format (YYYY-MM-DD)'
                }), 400
        
        # Generate daily challenge
        daily_challenge = content_generator.generate_daily_challenge_content(challenge_date)
        
        # Generate structured data
        structured_data = meta_optimizer.generate_structured_data({
            'type': 'game',
            'title': daily_challenge['title'],
            'description': daily_challenge['meta_description'],
            'slug': daily_challenge['slug']
        })
        
        result = {
            'success': True,
            'daily_challenge': daily_challenge,
            'structured_data': structured_data,
            'api_endpoints': {
                'play_challenge': f"/api/games/daily-challenge/{challenge_date.strftime('%Y-%m-%d')}",
                'get_hint': f"/api/games/daily-challenge/{challenge_date.strftime('%Y-%m-%d')}/hint",
                'submit_guess': f"/api/games/daily-challenge/{challenge_date.strftime('%Y-%m-%d')}/guess"
            }
        }
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@content_api.route('/api/content/category/generate', methods=['POST'])
def generate_category_page():
    """Generate category landing page"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if 'category' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required field: category'
            }), 400
        
        # Generate category page
        category_page = content_generator.generate_category_landing_page(
            category=data['category'],
            target_keywords=data.get('target_keywords', [f"{data['category'].lower()} word games"])
        )
        
        # Generate structured data
        structured_data = meta_optimizer.generate_structured_data({
            'type': 'webpage',
            'title': category_page['title'],
            'description': category_page['meta_description'],
            'slug': category_page['slug']
        })
        
        result = {
            'success': True,
            'category_page': category_page,
            'structured_data': structured_data,
            'seo_score': _calculate_content_seo_score(category_page, data['category'])
        }
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@content_api.route('/api/content/optimize', methods=['POST'])
def optimize_existing_content():
    """Optimize existing content for SEO"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['content', 'target_keyword', 'content_type']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        content = data['content']
        target_keyword = data['target_keyword']
        content_type = data['content_type']
        
        # Optimize title if provided
        title_optimization = None
        if 'title' in data:
            title_optimization = meta_optimizer.optimize_title_tag(
                current_title=data['title'],
                target_keyword=target_keyword,
                page_type=content_type
            )
        
        # Optimize meta description if provided
        description_optimization = None
        if 'meta_description' in data:
            description_optimization = meta_optimizer.optimize_meta_description(
                current_description=data['meta_description'],
                target_keyword=target_keyword,
                page_type=content_type
            )
        
        # Generate Open Graph tags
        og_tags = meta_optimizer.generate_open_graph_tags({
            'title': data.get('title', ''),
            'description': data.get('meta_description', ''),
            'slug': data.get('slug', ''),
            'type': content_type
        })
        
        # Generate Twitter Card tags
        twitter_tags = meta_optimizer.generate_twitter_card_tags({
            'title': data.get('title', ''),
            'description': data.get('meta_description', ''),
            'slug': data.get('slug', '')
        })
        
        # Generate structured data
        structured_data = meta_optimizer.generate_structured_data({
            'type': content_type,
            'title': data.get('title', ''),
            'description': data.get('meta_description', ''),
            'slug': data.get('slug', ''),
            'published_date': data.get('published_date'),
            'keywords': data.get('keywords', [])
        })
        
        # Analyze content for SEO improvements
        content_analysis = _analyze_content_seo(content, target_keyword)
        
        result = {
            'success': True,
            'optimizations': {
                'title': title_optimization,
                'meta_description': description_optimization,
                'open_graph': og_tags,
                'twitter_card': twitter_tags,
                'structured_data': structured_data
            },
            'content_analysis': content_analysis,
            'recommendations': _generate_seo_recommendations(content_analysis, target_keyword)
        }
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@content_api.route('/api/content/sitemap/generate', methods=['POST'])
def generate_sitemap():
    """Generate XML sitemap for all content"""
    try:
        data = request.get_json()
        base_url = data.get('base_url', 'https://dailypuzzlepost.com')
        
        # Get all content from database (mock data for now)
        content_items = _get_all_content_items()
        
        # Generate XML sitemap
        sitemap_xml = _generate_sitemap_xml(content_items, base_url)
        
        # Generate sitemap index if needed
        sitemap_index = _generate_sitemap_index(base_url)
        
        result = {
            'success': True,
            'sitemap_xml': sitemap_xml,
            'sitemap_index': sitemap_index,
            'total_urls': len(content_items),
            'last_modified': datetime.utcnow().isoformat()
        }
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@content_api.route('/api/content/bulk-optimize', methods=['POST'])
def bulk_optimize_content():
    """Bulk optimize multiple content items"""
    try:
        data = request.get_json()
        
        if 'content_items' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required field: content_items'
            }), 400
        
        content_items = data['content_items']
        results = []
        
        for item in content_items:
            try:
                # Optimize each content item
                optimization_result = _optimize_single_content_item(item)
                results.append({
                    'id': item.get('id'),
                    'success': True,
                    'optimizations': optimization_result
                })
            except Exception as e:
                results.append({
                    'id': item.get('id'),
                    'success': False,
                    'error': str(e)
                })
        
        # Calculate summary statistics
        successful_optimizations = sum(1 for r in results if r['success'])
        failed_optimizations = len(results) - successful_optimizations
        
        result = {
            'success': True,
            'results': results,
            'summary': {
                'total_items': len(content_items),
                'successful_optimizations': successful_optimizations,
                'failed_optimizations': failed_optimizations,
                'success_rate': (successful_optimizations / len(content_items)) * 100
            }
        }
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@content_api.route('/api/content/analytics', methods=['GET'])
def get_content_analytics():
    """Get content performance analytics"""
    try:
        # Mock analytics data (in production, this would come from actual analytics)
        analytics_data = {
            'total_content_items': 156,
            'blog_posts': 45,
            'faq_sections': 12,
            'category_pages': 8,
            'daily_challenges': 91,
            'average_seo_score': 87.3,
            'top_performing_content': [
                {
                    'title': 'Hangman Strategy Guide: Master the Game',
                    'url': '/blog/hangman-strategy-guide',
                    'views': 15420,
                    'seo_score': 95,
                    'keywords_ranking': 23
                },
                {
                    'title': 'Word Games FAQ - Common Questions',
                    'url': '/faq/word-games',
                    'views': 8930,
                    'seo_score': 92,
                    'keywords_ranking': 18
                }
            ],
            'keyword_performance': {
                'total_keywords': 234,
                'ranking_keywords': 189,
                'top_10_rankings': 45,
                'average_position': 23.7
            },
            'content_gaps': [
                'Word game tutorials for beginners',
                'Advanced hangman strategies',
                'Educational benefits of word games',
                'Word games for different age groups'
            ],
            'optimization_opportunities': [
                {
                    'type': 'meta_description',
                    'count': 12,
                    'priority': 'high'
                },
                {
                    'type': 'title_optimization',
                    'count': 8,
                    'priority': 'medium'
                },
                {
                    'type': 'internal_linking',
                    'count': 23,
                    'priority': 'low'
                }
            ]
        }
        
        return jsonify({
            'success': True,
            'analytics': analytics_data
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Helper functions

def _calculate_content_seo_score(content_item: dict, target_keyword: str) -> int:
    """Calculate SEO score for content item"""
    score = 0
    
    # Title optimization (25 points)
    title = content_item.get('title', '')
    if target_keyword.lower() in title.lower():
        score += 15
    if 30 <= len(title) <= 60:
        score += 10
    
    # Meta description optimization (20 points)
    meta_desc = content_item.get('meta_description', '')
    if target_keyword.lower() in meta_desc.lower():
        score += 10
    if 120 <= len(meta_desc) <= 160:
        score += 10
    
    # Content quality (25 points)
    content = content_item.get('content', '')
    word_count = len(content.split())
    if word_count >= 300:
        score += 15
    if content.count(target_keyword.lower()) / word_count <= 0.03:  # Good keyword density
        score += 10
    
    # Structure and formatting (15 points)
    if '##' in content:  # Has headings
        score += 8
    if len(content_item.get('keywords', [])) >= 5:
        score += 7
    
    # Technical SEO (15 points)
    if content_item.get('slug'):
        score += 5
    if content_item.get('schema_markup'):
        score += 10
    
    return min(score, 100)

def _calculate_faq_seo_score(faq_section: dict) -> int:
    """Calculate SEO score for FAQ section"""
    score = 0
    
    # Number of FAQ items (30 points)
    faq_count = len(faq_section.get('faq_items', []))
    if faq_count >= 10:
        score += 30
    elif faq_count >= 5:
        score += 20
    else:
        score += 10
    
    # Question quality (25 points)
    questions = [item.get('question', '') for item in faq_section.get('faq_items', [])]
    if any('how' in q.lower() for q in questions):
        score += 10
    if any('what' in q.lower() for q in questions):
        score += 10
    if any('why' in q.lower() for q in questions):
        score += 5
    
    # Answer quality (25 points)
    answers = [item.get('answer', '') for item in faq_section.get('faq_items', [])]
    avg_answer_length = sum(len(a.split()) for a in answers) / len(answers) if answers else 0
    if avg_answer_length >= 30:
        score += 15
    if any(len(a.split()) >= 50 for a in answers):
        score += 10
    
    # SEO metadata (20 points)
    if faq_section.get('title'):
        score += 10
    if faq_section.get('meta_description'):
        score += 10
    
    return min(score, 100)

def _analyze_content_seo(content: str, target_keyword: str) -> dict:
    """Analyze content for SEO factors"""
    words = content.split()
    word_count = len(words)
    keyword_count = content.lower().count(target_keyword.lower())
    keyword_density = (keyword_count / word_count) * 100 if word_count > 0 else 0
    
    # Count headings
    heading_count = content.count('##') + content.count('#')
    
    # Check for lists
    has_lists = '- ' in content or '1. ' in content
    
    # Check for internal links (mock)
    internal_links = content.count('[')
    
    return {
        'word_count': word_count,
        'keyword_count': keyword_count,
        'keyword_density': round(keyword_density, 2),
        'heading_count': heading_count,
        'has_lists': has_lists,
        'internal_links': internal_links,
        'readability_score': _calculate_readability_score(content)
    }

def _calculate_readability_score(content: str) -> int:
    """Calculate basic readability score"""
    sentences = content.count('.') + content.count('!') + content.count('?')
    words = len(content.split())
    
    if sentences == 0:
        return 50
    
    avg_sentence_length = words / sentences
    
    # Simple readability score (higher is better)
    if avg_sentence_length <= 15:
        return 90
    elif avg_sentence_length <= 20:
        return 75
    elif avg_sentence_length <= 25:
        return 60
    else:
        return 40

def _generate_seo_recommendations(content_analysis: dict, target_keyword: str) -> list:
    """Generate SEO improvement recommendations"""
    recommendations = []
    
    if content_analysis['word_count'] < 300:
        recommendations.append({
            'type': 'content_length',
            'priority': 'high',
            'message': 'Content is too short. Aim for at least 300 words for better SEO.'
        })
    
    if content_analysis['keyword_density'] < 0.5:
        recommendations.append({
            'type': 'keyword_density',
            'priority': 'medium',
            'message': f'Keyword density is low. Consider adding "{target_keyword}" more naturally throughout the content.'
        })
    elif content_analysis['keyword_density'] > 3:
        recommendations.append({
            'type': 'keyword_density',
            'priority': 'high',
            'message': f'Keyword density is too high. Reduce usage of "{target_keyword}" to avoid keyword stuffing.'
        })
    
    if content_analysis['heading_count'] < 2:
        recommendations.append({
            'type': 'structure',
            'priority': 'medium',
            'message': 'Add more headings (H2, H3) to improve content structure and readability.'
        })
    
    if not content_analysis['has_lists']:
        recommendations.append({
            'type': 'formatting',
            'priority': 'low',
            'message': 'Consider adding bullet points or numbered lists to improve readability.'
        })
    
    if content_analysis['internal_links'] < 2:
        recommendations.append({
            'type': 'internal_linking',
            'priority': 'medium',
            'message': 'Add more internal links to related content to improve SEO and user experience.'
        })
    
    if content_analysis['readability_score'] < 60:
        recommendations.append({
            'type': 'readability',
            'priority': 'medium',
            'message': 'Improve readability by using shorter sentences and simpler language.'
        })
    
    return recommendations

def _get_all_content_items() -> list:
    """Get all content items for sitemap generation (mock data)"""
    return [
        {
            'url': '/',
            'lastmod': datetime.utcnow().isoformat(),
            'changefreq': 'daily',
            'priority': '1.0'
        },
        {
            'url': '/hangman',
            'lastmod': datetime.utcnow().isoformat(),
            'changefreq': 'weekly',
            'priority': '0.9'
        },
        {
            'url': '/categories/animals',
            'lastmod': datetime.utcnow().isoformat(),
            'changefreq': 'weekly',
            'priority': '0.8'
        },
        {
            'url': '/blog/hangman-strategy-guide',
            'lastmod': (datetime.utcnow() - timedelta(days=7)).isoformat(),
            'changefreq': 'monthly',
            'priority': '0.7'
        },
        {
            'url': '/faq',
            'lastmod': (datetime.utcnow() - timedelta(days=14)).isoformat(),
            'changefreq': 'monthly',
            'priority': '0.6'
        }
    ]

def _generate_sitemap_xml(content_items: list, base_url: str) -> str:
    """Generate XML sitemap"""
    xml_header = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml_header += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    
    xml_urls = []
    for item in content_items:
        xml_urls.append(f"""  <url>
    <loc>{base_url}{item['url']}</loc>
    <lastmod>{item['lastmod']}</lastmod>
    <changefreq>{item['changefreq']}</changefreq>
    <priority>{item['priority']}</priority>
  </url>""")
    
    xml_footer = '</urlset>'
    
    return xml_header + '\n'.join(xml_urls) + '\n' + xml_footer

def _generate_sitemap_index(base_url: str) -> str:
    """Generate sitemap index XML"""
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>{base_url}/sitemap.xml</loc>
    <lastmod>{datetime.utcnow().isoformat()}</lastmod>
  </sitemap>
</sitemapindex>"""

def _optimize_single_content_item(item: dict) -> dict:
    """Optimize a single content item"""
    target_keyword = item.get('target_keyword', '')
    content_type = item.get('type', 'webpage')
    
    # Optimize title
    title_optimization = meta_optimizer.optimize_title_tag(
        current_title=item.get('title', ''),
        target_keyword=target_keyword,
        page_type=content_type
    )
    
    # Optimize meta description
    description_optimization = meta_optimizer.optimize_meta_description(
        current_description=item.get('meta_description', ''),
        target_keyword=target_keyword,
        page_type=content_type
    )
    
    # Generate structured data
    structured_data = meta_optimizer.generate_structured_data({
        'type': content_type,
        'title': item.get('title', ''),
        'description': item.get('meta_description', ''),
        'slug': item.get('slug', '')
    })
    
    return {
        'title_optimization': title_optimization,
        'description_optimization': description_optimization,
        'structured_data': structured_data,
        'seo_score': _calculate_content_seo_score(item, target_keyword)
    }

