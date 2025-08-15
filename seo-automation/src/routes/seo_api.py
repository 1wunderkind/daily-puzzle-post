from flask import Blueprint, request, jsonify
from src.models.seo import db, Keyword, KeywordRanking, ContentOptimization, SEOAudit, ContentPage
from datetime import datetime, timedelta
import json
import re
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from services.meta_optimizer import MetaTagOptimizer
from services.sitemap_generator import SitemapGenerator
from services.search_console import SearchConsoleIntegration

seo_api = Blueprint('seo_api', __name__)

# Keyword Management Endpoints
@seo_api.route('/keywords', methods=['GET'])
def get_keywords():
    """Get all keywords with optional filtering"""
    try:
        category = request.args.get('category')
        priority = request.args.get('priority')
        
        query = Keyword.query
        
        if category:
            query = query.filter(Keyword.category == category)
        if priority:
            query = query.filter(Keyword.priority == priority)
        
        keywords = query.order_by(Keyword.updated_at.desc()).all()
        
        return jsonify({
            'success': True,
            'keywords': [keyword.to_dict() for keyword in keywords],
            'total': len(keywords)
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@seo_api.route('/keywords', methods=['POST'])
def add_keyword():
    """Add a new keyword for tracking"""
    try:
        data = request.get_json()
        
        # Check if keyword already exists
        existing = Keyword.query.filter_by(keyword=data['keyword']).first()
        if existing:
            return jsonify({'success': False, 'error': 'Keyword already exists'}), 400
        
        keyword = Keyword(
            keyword=data['keyword'],
            search_volume=data.get('search_volume', 0),
            difficulty=data.get('difficulty', 0),
            target_rank=data.get('target_rank', 1),
            category=data.get('category', 'general'),
            priority=data.get('priority', 'medium')
        )
        
        db.session.add(keyword)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'keyword': keyword.to_dict(),
            'message': 'Keyword added successfully'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@seo_api.route('/keywords/<int:keyword_id>', methods=['PUT'])
def update_keyword(keyword_id):
    """Update keyword information"""
    try:
        keyword = Keyword.query.get_or_404(keyword_id)
        data = request.get_json()
        
        # Update fields
        for field in ['search_volume', 'difficulty', 'current_rank', 'target_rank', 'category', 'priority']:
            if field in data:
                setattr(keyword, field, data[field])
        
        keyword.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'keyword': keyword.to_dict(),
            'message': 'Keyword updated successfully'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@seo_api.route('/keywords/<int:keyword_id>/rankings', methods=['POST'])
def add_keyword_ranking(keyword_id):
    """Add a new ranking record for a keyword"""
    try:
        keyword = Keyword.query.get_or_404(keyword_id)
        data = request.get_json()
        
        ranking = KeywordRanking(
            keyword_id=keyword_id,
            rank_position=data['rank_position'],
            search_engine=data.get('search_engine', 'google'),
            location=data.get('location', 'global'),
            device=data.get('device', 'desktop'),
            url=data.get('url', '')
        )
        
        # Update keyword's current rank
        keyword.current_rank = data['rank_position']
        keyword.updated_at = datetime.utcnow()
        
        db.session.add(ranking)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'ranking': ranking.to_dict(),
            'message': 'Ranking added successfully'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

# Content Optimization Endpoints
@seo_api.route('/optimizations', methods=['GET'])
def get_optimizations():
    """Get content optimization recommendations"""
    try:
        status = request.args.get('status', 'pending')
        priority = request.args.get('priority')
        
        query = ContentOptimization.query
        
        if status:
            query = query.filter(ContentOptimization.implementation_status == status)
        if priority:
            query = query.filter(ContentOptimization.estimated_impact == priority)
        
        optimizations = query.order_by(ContentOptimization.priority_score.desc()).all()
        
        return jsonify({
            'success': True,
            'optimizations': [opt.to_dict() for opt in optimizations],
            'total': len(optimizations)
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@seo_api.route('/optimizations', methods=['POST'])
def create_optimization():
    """Create a new content optimization recommendation"""
    try:
        data = request.get_json()
        
        optimization = ContentOptimization(
            keyword_id=data['keyword_id'],
            page_url=data['page_url'],
            page_title=data.get('page_title', ''),
            meta_description=data.get('meta_description', ''),
            content_type=data.get('content_type', 'page'),
            optimization_type=data['optimization_type'],
            current_value=data.get('current_value', ''),
            recommended_value=data['recommended_value'],
            priority_score=data.get('priority_score', 50),
            estimated_impact=data.get('estimated_impact', 'medium')
        )
        
        db.session.add(optimization)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'optimization': optimization.to_dict(),
            'message': 'Optimization recommendation created'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@seo_api.route('/optimizations/<int:opt_id>/implement', methods=['POST'])
def implement_optimization(opt_id):
    """Mark an optimization as implemented"""
    try:
        optimization = ContentOptimization.query.get_or_404(opt_id)
        
        optimization.implementation_status = 'implemented'
        optimization.implemented_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'optimization': optimization.to_dict(),
            'message': 'Optimization marked as implemented'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

# SEO Audit Endpoints
@seo_api.route('/audits', methods=['GET'])
def get_audits():
    """Get SEO audit history"""
    try:
        page_url = request.args.get('page_url')
        audit_type = request.args.get('audit_type')
        
        query = SEOAudit.query
        
        if page_url:
            query = query.filter(SEOAudit.page_url == page_url)
        if audit_type:
            query = query.filter(SEOAudit.audit_type == audit_type)
        
        audits = query.order_by(SEOAudit.audit_date.desc()).all()
        
        return jsonify({
            'success': True,
            'audits': [audit.to_dict() for audit in audits],
            'total': len(audits)
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@seo_api.route('/audits', methods=['POST'])
def create_audit():
    """Create a new SEO audit"""
    try:
        data = request.get_json()
        
        audit = SEOAudit(
            page_url=data['page_url'],
            audit_type=data.get('audit_type', 'full'),
            overall_score=data.get('overall_score', 0),
            technical_score=data.get('technical_score', 0),
            content_score=data.get('content_score', 0),
            performance_score=data.get('performance_score', 0)
        )
        
        if 'audit_results' in data:
            audit.set_audit_results(data['audit_results'])
        if 'recommendations' in data:
            audit.set_recommendations(data['recommendations'])
        if 'issues_found' in data:
            audit.set_issues_found(data['issues_found'])
        
        # Set next audit date (30 days from now)
        audit.next_audit_date = datetime.utcnow() + timedelta(days=30)
        
        db.session.add(audit)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'audit': audit.to_dict(),
            'message': 'SEO audit created successfully'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

# Content Management Endpoints
@seo_api.route('/content', methods=['GET'])
def get_content_pages():
    """Get all content pages"""
    try:
        content_type = request.args.get('content_type')
        status = request.args.get('status')
        
        query = ContentPage.query
        
        if content_type:
            query = query.filter(ContentPage.content_type == content_type)
        if status:
            query = query.filter(ContentPage.status == status)
        
        pages = query.order_by(ContentPage.updated_at.desc()).all()
        
        return jsonify({
            'success': True,
            'pages': [page.to_dict() for page in pages],
            'total': len(pages)
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@seo_api.route('/content', methods=['POST'])
def create_content_page():
    """Create a new SEO-optimized content page"""
    try:
        data = request.get_json()
        
        # Generate slug from title if not provided
        slug = data.get('slug')
        if not slug:
            slug = re.sub(r'[^a-zA-Z0-9]+', '-', data['title'].lower()).strip('-')
        
        # Check if slug already exists
        existing = ContentPage.query.filter_by(slug=slug).first()
        if existing:
            return jsonify({'success': False, 'error': 'Slug already exists'}), 400
        
        page = ContentPage(
            slug=slug,
            title=data['title'],
            meta_title=data.get('meta_title', data['title']),
            meta_description=data.get('meta_description', ''),
            content=data.get('content', ''),
            content_type=data.get('content_type', 'blog'),
            canonical_url=data.get('canonical_url', ''),
            og_title=data.get('og_title', data['title']),
            og_description=data.get('og_description', data.get('meta_description', '')),
            og_image=data.get('og_image', '')
        )
        
        if 'target_keywords' in data:
            page.set_target_keywords(data['target_keywords'])
        if 'schema_markup' in data:
            page.set_schema_markup(data['schema_markup'])
        
        # Calculate word count
        if page.content:
            page.word_count = len(page.content.split())
        
        db.session.add(page)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'page': page.to_dict(),
            'message': 'Content page created successfully'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@seo_api.route('/content/<int:page_id>', methods=['PUT'])
def update_content_page(page_id):
    """Update a content page"""
    try:
        page = ContentPage.query.get_or_404(page_id)
        data = request.get_json()
        
        # Update fields
        for field in ['title', 'meta_title', 'meta_description', 'content', 'status', 
                     'canonical_url', 'og_title', 'og_description', 'og_image']:
            if field in data:
                setattr(page, field, data[field])
        
        if 'target_keywords' in data:
            page.set_target_keywords(data['target_keywords'])
        if 'schema_markup' in data:
            page.set_schema_markup(data['schema_markup'])
        
        # Recalculate word count
        if page.content:
            page.word_count = len(page.content.split())
        
        page.updated_at = datetime.utcnow()
        
        # Set published date if status changed to published
        if data.get('status') == 'published' and not page.published_at:
            page.published_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'page': page.to_dict(),
            'message': 'Content page updated successfully'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

# Analytics and Reporting Endpoints
@seo_api.route('/analytics/dashboard', methods=['GET'])
def get_seo_dashboard():
    """Get comprehensive SEO dashboard data"""
    try:
        # Get keyword statistics
        total_keywords = Keyword.query.count()
        high_priority_keywords = Keyword.query.filter_by(priority='high').count()
        top_10_rankings = Keyword.query.filter(Keyword.current_rank <= 10).count()
        
        # Get optimization statistics
        pending_optimizations = ContentOptimization.query.filter_by(implementation_status='pending').count()
        implemented_optimizations = ContentOptimization.query.filter_by(implementation_status='implemented').count()
        
        # Get content statistics
        published_pages = ContentPage.query.filter_by(status='published').count()
        draft_pages = ContentPage.query.filter_by(status='draft').count()
        
        # Get recent audits
        recent_audits = SEOAudit.query.order_by(SEOAudit.audit_date.desc()).limit(5).all()
        
        # Calculate average scores
        avg_audit_score = db.session.query(db.func.avg(SEOAudit.overall_score)).scalar() or 0
        
        dashboard_data = {
            'keyword_stats': {
                'total_keywords': total_keywords,
                'high_priority': high_priority_keywords,
                'top_10_rankings': top_10_rankings,
                'ranking_percentage': round((top_10_rankings / total_keywords * 100) if total_keywords > 0 else 0, 1)
            },
            'optimization_stats': {
                'pending': pending_optimizations,
                'implemented': implemented_optimizations,
                'completion_rate': round((implemented_optimizations / (pending_optimizations + implemented_optimizations) * 100) if (pending_optimizations + implemented_optimizations) > 0 else 0, 1)
            },
            'content_stats': {
                'published_pages': published_pages,
                'draft_pages': draft_pages,
                'total_pages': published_pages + draft_pages
            },
            'audit_stats': {
                'average_score': round(avg_audit_score, 1),
                'recent_audits': [audit.to_dict() for audit in recent_audits]
            }
        }
        
        return jsonify({
            'success': True,
            'dashboard': dashboard_data
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Automated SEO Analysis Endpoints
@seo_api.route('/analyze/page', methods=['POST'])
def analyze_page_seo():
    """Analyze a page for SEO opportunities"""
    try:
        data = request.get_json()
        page_url = data['page_url']
        target_keyword = data.get('target_keyword', '')
        
        # This would integrate with actual SEO analysis tools
        # For now, we'll return mock analysis data
        analysis = {
            'page_url': page_url,
            'target_keyword': target_keyword,
            'seo_score': 75,
            'issues': [
                {
                    'type': 'title_tag',
                    'severity': 'high',
                    'message': 'Title tag is missing target keyword',
                    'recommendation': f'Include "{target_keyword}" in the title tag'
                },
                {
                    'type': 'meta_description',
                    'severity': 'medium',
                    'message': 'Meta description is too short',
                    'recommendation': 'Expand meta description to 150-160 characters'
                },
                {
                    'type': 'content_length',
                    'severity': 'low',
                    'message': 'Content could be longer for better SEO',
                    'recommendation': 'Consider expanding content to 800+ words'
                }
            ],
            'opportunities': [
                {
                    'type': 'internal_linking',
                    'impact': 'medium',
                    'description': 'Add internal links to related content'
                },
                {
                    'type': 'schema_markup',
                    'impact': 'high',
                    'description': 'Add structured data markup'
                }
            ]
        }
        
        return jsonify({
            'success': True,
            'analysis': analysis
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Health check endpoint
@seo_api.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for monitoring"""
    try:
        # Test database connection
        db.session.execute('SELECT 1')
        
        return jsonify({
            'success': True,
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'database': 'connected'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'status': 'unhealthy',
            'error': str(e)
        }), 500

