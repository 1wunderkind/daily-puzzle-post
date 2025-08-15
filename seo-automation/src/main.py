import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from src.models.user import db
from src.routes.user import user_bp

# Import SEO automation routes
from routes.seo_api import seo_api
from routes.content_api import content_api

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'

# Enable CORS for all routes
CORS(app)

# Register blueprints
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(seo_api)
app.register_blueprint(content_api)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# SEO automation specific routes
@app.route('/dashboard')
def seo_dashboard():
    """SEO automation dashboard"""
    return send_from_directory('static', 'seo_dashboard.html')

@app.route('/api/health')
def health_check():
    """Health check endpoint for monitoring"""
    return jsonify({
        'status': 'healthy',
        'service': 'SEO Automation API',
        'version': '1.0.0',
        'endpoints': [
            '/api/seo/keywords',
            '/api/seo/meta-optimize',
            '/api/seo/sitemap/generate',
            '/api/content/blog/generate',
            '/api/content/faq/generate',
            '/api/search-console/analytics'
        ]
    })

@app.route('/sitemap.xml')
def serve_sitemap():
    """Serve dynamically generated sitemap"""
    try:
        from services.sitemap_generator import SitemapGenerator
        
        generator = SitemapGenerator()
        sitemap_xml = generator.generate_main_sitemap()
        
        response = app.response_class(
            response=sitemap_xml,
            status=200,
            mimetype='application/xml'
        )
        return response
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/robots.txt')
def serve_robots():
    """Serve dynamically generated robots.txt"""
    try:
        from services.sitemap_generator import SitemapGenerator
        
        generator = SitemapGenerator()
        robots_content = generator.generate_robots_txt()
        
        response = app.response_class(
            response=robots_content,
            status=200,
            mimetype='text/plain'
        )
        return response
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Not Found',
        'message': 'The requested resource was not found',
        'status_code': 404
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'error': 'Internal Server Error',
        'message': 'An internal server error occurred',
        'status_code': 500
    }), 500

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404

if __name__ == '__main__':
    # Initialize database tables
    with app.app_context():
        db.create_all()
        
        # Initialize SEO database tables
        try:
            from models.seo import init_db
            init_db()
        except ImportError:
            print("SEO models not found, skipping SEO database initialization")
    
    # Start the application
    app.run(host='0.0.0.0', port=5000, debug=True)

