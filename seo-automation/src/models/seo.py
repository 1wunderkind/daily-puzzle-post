from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()

class Keyword(db.Model):
    """Model for tracking keywords and their performance metrics"""
    __tablename__ = 'keywords'
    
    id = db.Column(db.Integer, primary_key=True)
    keyword = db.Column(db.String(255), nullable=False, unique=True)
    search_volume = db.Column(db.Integer, default=0)
    difficulty = db.Column(db.Integer, default=0)  # 1-100 scale
    current_rank = db.Column(db.Integer, default=0)
    target_rank = db.Column(db.Integer, default=1)
    category = db.Column(db.String(100), default='general')
    priority = db.Column(db.String(20), default='medium')  # low, medium, high
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    rankings = db.relationship('KeywordRanking', backref='keyword', lazy=True, cascade='all, delete-orphan')
    content_optimizations = db.relationship('ContentOptimization', backref='keyword', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'keyword': self.keyword,
            'search_volume': self.search_volume,
            'difficulty': self.difficulty,
            'current_rank': self.current_rank,
            'target_rank': self.target_rank,
            'category': self.category,
            'priority': self.priority,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class KeywordRanking(db.Model):
    """Model for tracking keyword ranking history"""
    __tablename__ = 'keyword_rankings'
    
    id = db.Column(db.Integer, primary_key=True)
    keyword_id = db.Column(db.Integer, db.ForeignKey('keywords.id'), nullable=False)
    rank_position = db.Column(db.Integer, nullable=False)
    search_engine = db.Column(db.String(50), default='google')
    location = db.Column(db.String(100), default='global')
    device = db.Column(db.String(20), default='desktop')  # desktop, mobile
    url = db.Column(db.String(500))
    tracked_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'keyword_id': self.keyword_id,
            'rank_position': self.rank_position,
            'search_engine': self.search_engine,
            'location': self.location,
            'device': self.device,
            'url': self.url,
            'tracked_at': self.tracked_at.isoformat() if self.tracked_at else None
        }

class ContentOptimization(db.Model):
    """Model for tracking content optimization recommendations and implementations"""
    __tablename__ = 'content_optimizations'
    
    id = db.Column(db.Integer, primary_key=True)
    keyword_id = db.Column(db.Integer, db.ForeignKey('keywords.id'), nullable=False)
    page_url = db.Column(db.String(500), nullable=False)
    page_title = db.Column(db.String(255))
    meta_description = db.Column(db.Text)
    content_type = db.Column(db.String(50), default='page')  # page, blog, faq, etc.
    optimization_type = db.Column(db.String(100))  # title_tag, meta_description, content, etc.
    current_value = db.Column(db.Text)
    recommended_value = db.Column(db.Text)
    implementation_status = db.Column(db.String(20), default='pending')  # pending, implemented, rejected
    priority_score = db.Column(db.Integer, default=50)  # 1-100
    estimated_impact = db.Column(db.String(20), default='medium')  # low, medium, high
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    implemented_at = db.Column(db.DateTime)
    
    def to_dict(self):
        return {
            'id': self.id,
            'keyword_id': self.keyword_id,
            'page_url': self.page_url,
            'page_title': self.page_title,
            'meta_description': self.meta_description,
            'content_type': self.content_type,
            'optimization_type': self.optimization_type,
            'current_value': self.current_value,
            'recommended_value': self.recommended_value,
            'implementation_status': self.implementation_status,
            'priority_score': self.priority_score,
            'estimated_impact': self.estimated_impact,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'implemented_at': self.implemented_at.isoformat() if self.implemented_at else None
        }

class SEOAudit(db.Model):
    """Model for storing SEO audit results and recommendations"""
    __tablename__ = 'seo_audits'
    
    id = db.Column(db.Integer, primary_key=True)
    page_url = db.Column(db.String(500), nullable=False)
    audit_type = db.Column(db.String(50), default='full')  # full, technical, content, etc.
    overall_score = db.Column(db.Integer, default=0)  # 1-100
    technical_score = db.Column(db.Integer, default=0)
    content_score = db.Column(db.Integer, default=0)
    performance_score = db.Column(db.Integer, default=0)
    
    # Audit results stored as JSON
    audit_results = db.Column(db.Text)  # JSON string
    recommendations = db.Column(db.Text)  # JSON string
    issues_found = db.Column(db.Text)  # JSON string
    
    audit_date = db.Column(db.DateTime, default=datetime.utcnow)
    next_audit_date = db.Column(db.DateTime)
    
    def get_audit_results(self):
        return json.loads(self.audit_results) if self.audit_results else {}
    
    def set_audit_results(self, results):
        self.audit_results = json.dumps(results)
    
    def get_recommendations(self):
        return json.loads(self.recommendations) if self.recommendations else []
    
    def set_recommendations(self, recommendations):
        self.recommendations = json.dumps(recommendations)
    
    def get_issues_found(self):
        return json.loads(self.issues_found) if self.issues_found else []
    
    def set_issues_found(self, issues):
        self.issues_found = json.dumps(issues)
    
    def to_dict(self):
        return {
            'id': self.id,
            'page_url': self.page_url,
            'audit_type': self.audit_type,
            'overall_score': self.overall_score,
            'technical_score': self.technical_score,
            'content_score': self.content_score,
            'performance_score': self.performance_score,
            'audit_results': self.get_audit_results(),
            'recommendations': self.get_recommendations(),
            'issues_found': self.get_issues_found(),
            'audit_date': self.audit_date.isoformat() if self.audit_date else None,
            'next_audit_date': self.next_audit_date.isoformat() if self.next_audit_date else None
        }

class ContentPage(db.Model):
    """Model for managing SEO-optimized content pages"""
    __tablename__ = 'content_pages'
    
    id = db.Column(db.Integer, primary_key=True)
    slug = db.Column(db.String(255), nullable=False, unique=True)
    title = db.Column(db.String(255), nullable=False)
    meta_title = db.Column(db.String(255))
    meta_description = db.Column(db.Text)
    content = db.Column(db.Text)
    content_type = db.Column(db.String(50), default='blog')  # blog, faq, guide, etc.
    status = db.Column(db.String(20), default='draft')  # draft, published, archived
    target_keywords = db.Column(db.Text)  # JSON array of keywords
    word_count = db.Column(db.Integer, default=0)
    readability_score = db.Column(db.Integer, default=0)
    seo_score = db.Column(db.Integer, default=0)
    
    # SEO fields
    canonical_url = db.Column(db.String(500))
    og_title = db.Column(db.String(255))
    og_description = db.Column(db.Text)
    og_image = db.Column(db.String(500))
    schema_markup = db.Column(db.Text)  # JSON-LD schema
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    published_at = db.Column(db.DateTime)
    
    def get_target_keywords(self):
        return json.loads(self.target_keywords) if self.target_keywords else []
    
    def set_target_keywords(self, keywords):
        self.target_keywords = json.dumps(keywords)
    
    def get_schema_markup(self):
        return json.loads(self.schema_markup) if self.schema_markup else {}
    
    def set_schema_markup(self, schema):
        self.schema_markup = json.dumps(schema)
    
    def to_dict(self):
        return {
            'id': self.id,
            'slug': self.slug,
            'title': self.title,
            'meta_title': self.meta_title,
            'meta_description': self.meta_description,
            'content': self.content,
            'content_type': self.content_type,
            'status': self.status,
            'target_keywords': self.get_target_keywords(),
            'word_count': self.word_count,
            'readability_score': self.readability_score,
            'seo_score': self.seo_score,
            'canonical_url': self.canonical_url,
            'og_title': self.og_title,
            'og_description': self.og_description,
            'og_image': self.og_image,
            'schema_markup': self.get_schema_markup(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'published_at': self.published_at.isoformat() if self.published_at else None
        }

