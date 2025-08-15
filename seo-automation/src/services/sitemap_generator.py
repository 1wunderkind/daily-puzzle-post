from datetime import datetime, timedelta
import xml.etree.ElementTree as ET
from xml.dom import minidom
import json
import os
from typing import List, Dict, Optional

class SitemapGenerator:
    """Automated sitemap generation service for SEO optimization"""
    
    def __init__(self):
        self.base_url = "https://dailypuzzlepost.com"
        self.sitemap_namespace = "http://www.sitemaps.org/schemas/sitemap/0.9"
        
    def generate_main_sitemap(self, base_url: Optional[str] = None) -> str:
        """Generate main XML sitemap with all pages"""
        if base_url:
            self.base_url = base_url
            
        # Create root element
        urlset = ET.Element("urlset")
        urlset.set("xmlns", self.sitemap_namespace)
        
        # Get all content items
        content_items = self._get_all_content_items()
        
        # Add each URL to sitemap
        for item in content_items:
            url_element = ET.SubElement(urlset, "url")
            
            # Location (required)
            loc = ET.SubElement(url_element, "loc")
            loc.text = f"{self.base_url}{item['url']}"
            
            # Last modified (optional)
            if item.get('lastmod'):
                lastmod = ET.SubElement(url_element, "lastmod")
                lastmod.text = item['lastmod']
            
            # Change frequency (optional)
            if item.get('changefreq'):
                changefreq = ET.SubElement(url_element, "changefreq")
                changefreq.text = item['changefreq']
            
            # Priority (optional)
            if item.get('priority'):
                priority = ET.SubElement(url_element, "priority")
                priority.text = str(item['priority'])
        
        # Convert to pretty XML string
        return self._prettify_xml(urlset)
    
    def generate_sitemap_index(self, base_url: Optional[str] = None) -> str:
        """Generate sitemap index XML for multiple sitemaps"""
        if base_url:
            self.base_url = base_url
            
        # Create root element
        sitemapindex = ET.Element("sitemapindex")
        sitemapindex.set("xmlns", self.sitemap_namespace)
        
        # Define different sitemap categories
        sitemap_categories = [
            {
                'filename': 'sitemap-main.xml',
                'lastmod': datetime.utcnow().isoformat()
            },
            {
                'filename': 'sitemap-blog.xml',
                'lastmod': datetime.utcnow().isoformat()
            },
            {
                'filename': 'sitemap-categories.xml',
                'lastmod': datetime.utcnow().isoformat()
            },
            {
                'filename': 'sitemap-games.xml',
                'lastmod': datetime.utcnow().isoformat()
            }
        ]
        
        # Add each sitemap to index
        for sitemap_info in sitemap_categories:
            sitemap_element = ET.SubElement(sitemapindex, "sitemap")
            
            # Location
            loc = ET.SubElement(sitemap_element, "loc")
            loc.text = f"{self.base_url}/{sitemap_info['filename']}"
            
            # Last modified
            lastmod = ET.SubElement(sitemap_element, "lastmod")
            lastmod.text = sitemap_info['lastmod']
        
        return self._prettify_xml(sitemapindex)
    
    def generate_blog_sitemap(self, base_url: Optional[str] = None) -> str:
        """Generate sitemap specifically for blog posts"""
        if base_url:
            self.base_url = base_url
            
        urlset = ET.Element("urlset")
        urlset.set("xmlns", self.sitemap_namespace)
        
        # Get blog posts
        blog_posts = self._get_blog_posts()
        
        for post in blog_posts:
            url_element = ET.SubElement(urlset, "url")
            
            loc = ET.SubElement(url_element, "loc")
            loc.text = f"{self.base_url}/blog/{post['slug']}"
            
            lastmod = ET.SubElement(url_element, "lastmod")
            lastmod.text = post['published_date']
            
            changefreq = ET.SubElement(url_element, "changefreq")
            changefreq.text = "monthly"
            
            priority = ET.SubElement(url_element, "priority")
            priority.text = "0.7"
        
        return self._prettify_xml(urlset)
    
    def generate_category_sitemap(self, base_url: Optional[str] = None) -> str:
        """Generate sitemap for category pages"""
        if base_url:
            self.base_url = base_url
            
        urlset = ET.Element("urlset")
        urlset.set("xmlns", self.sitemap_namespace)
        
        # Get category pages
        categories = self._get_category_pages()
        
        for category in categories:
            url_element = ET.SubElement(urlset, "url")
            
            loc = ET.SubElement(url_element, "loc")
            loc.text = f"{self.base_url}/categories/{category['slug']}"
            
            lastmod = ET.SubElement(url_element, "lastmod")
            lastmod.text = category.get('lastmod', datetime.utcnow().isoformat())
            
            changefreq = ET.SubElement(url_element, "changefreq")
            changefreq.text = "weekly"
            
            priority = ET.SubElement(url_element, "priority")
            priority.text = "0.8"
        
        return self._prettify_xml(urlset)
    
    def generate_games_sitemap(self, base_url: Optional[str] = None) -> str:
        """Generate sitemap for game-related pages"""
        if base_url:
            self.base_url = base_url
            
        urlset = ET.Element("urlset")
        urlset.set("xmlns", self.sitemap_namespace)
        
        # Get game pages
        game_pages = self._get_game_pages()
        
        for game in game_pages:
            url_element = ET.SubElement(urlset, "url")
            
            loc = ET.SubElement(url_element, "loc")
            loc.text = f"{self.base_url}{game['url']}"
            
            lastmod = ET.SubElement(url_element, "lastmod")
            lastmod.text = game.get('lastmod', datetime.utcnow().isoformat())
            
            changefreq = ET.SubElement(url_element, "changefreq")
            changefreq.text = game.get('changefreq', 'daily')
            
            priority = ET.SubElement(url_element, "priority")
            priority.text = str(game.get('priority', '0.9'))
        
        return self._prettify_xml(urlset)
    
    def generate_robots_txt(self, base_url: Optional[str] = None) -> str:
        """Generate robots.txt file"""
        if base_url:
            self.base_url = base_url
            
        robots_content = f"""User-agent: *
Allow: /

# Sitemap location
Sitemap: {self.base_url}/sitemap.xml
Sitemap: {self.base_url}/sitemap-index.xml

# Disallow admin and API endpoints
Disallow: /admin/
Disallow: /api/
Disallow: /email-automation/
Disallow: /seo-automation/

# Allow important directories
Allow: /css/
Allow: /js/
Allow: /images/
Allow: /static/

# Crawl delay (optional)
Crawl-delay: 1

# Specific bot instructions
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

# Block problematic bots (optional)
User-agent: AhrefsBot
Disallow: /

User-agent: SemrushBot
Disallow: /
"""
        return robots_content
    
    def validate_sitemap(self, sitemap_xml: str) -> Dict[str, any]:
        """Validate sitemap XML structure and content"""
        try:
            # Parse XML
            root = ET.fromstring(sitemap_xml)
            
            # Check namespace
            expected_namespace = self.sitemap_namespace
            if root.tag != f"{{{expected_namespace}}}urlset" and root.tag != f"{{{expected_namespace}}}sitemapindex":
                return {
                    'valid': False,
                    'error': 'Invalid namespace or root element'
                }
            
            # Count URLs
            url_count = len(root.findall(f".//{{{expected_namespace}}}url"))
            sitemap_count = len(root.findall(f".//{{{expected_namespace}}}sitemap"))
            
            # Check URL limits (50,000 URLs per sitemap)
            if url_count > 50000:
                return {
                    'valid': False,
                    'error': f'Too many URLs ({url_count}). Maximum is 50,000 per sitemap.'
                }
            
            # Validate individual URLs
            validation_errors = []
            urls = root.findall(f".//{{{expected_namespace}}}url")
            
            for i, url_element in enumerate(urls):
                loc_element = url_element.find(f"{{{expected_namespace}}}loc")
                if loc_element is None or not loc_element.text:
                    validation_errors.append(f"URL {i+1}: Missing or empty <loc> element")
                elif not loc_element.text.startswith(('http://', 'https://')):
                    validation_errors.append(f"URL {i+1}: Invalid URL format")
            
            return {
                'valid': len(validation_errors) == 0,
                'url_count': url_count,
                'sitemap_count': sitemap_count,
                'errors': validation_errors,
                'size_bytes': len(sitemap_xml.encode('utf-8'))
            }
            
        except ET.ParseError as e:
            return {
                'valid': False,
                'error': f'XML parsing error: {str(e)}'
            }
    
    def _get_all_content_items(self) -> List[Dict]:
        """Get all content items for main sitemap"""
        return [
            # Main pages
            {
                'url': '/',
                'lastmod': datetime.utcnow().isoformat(),
                'changefreq': 'daily',
                'priority': 1.0
            },
            {
                'url': '/hangman',
                'lastmod': datetime.utcnow().isoformat(),
                'changefreq': 'daily',
                'priority': 0.9
            },
            {
                'url': '/admin',
                'lastmod': datetime.utcnow().isoformat(),
                'changefreq': 'weekly',
                'priority': 0.3
            },
            {
                'url': '/analytics',
                'lastmod': datetime.utcnow().isoformat(),
                'changefreq': 'weekly',
                'priority': 0.3
            },
            
            # Static pages
            {
                'url': '/about',
                'lastmod': (datetime.utcnow() - timedelta(days=30)).isoformat(),
                'changefreq': 'monthly',
                'priority': 0.5
            },
            {
                'url': '/privacy-policy',
                'lastmod': (datetime.utcnow() - timedelta(days=60)).isoformat(),
                'changefreq': 'yearly',
                'priority': 0.3
            },
            {
                'url': '/terms-of-service',
                'lastmod': (datetime.utcnow() - timedelta(days=60)).isoformat(),
                'changefreq': 'yearly',
                'priority': 0.3
            },
            {
                'url': '/faq',
                'lastmod': (datetime.utcnow() - timedelta(days=14)).isoformat(),
                'changefreq': 'monthly',
                'priority': 0.6
            },
            {
                'url': '/contact',
                'lastmod': (datetime.utcnow() - timedelta(days=30)).isoformat(),
                'changefreq': 'monthly',
                'priority': 0.4
            }
        ]
    
    def _get_blog_posts(self) -> List[Dict]:
        """Get blog posts for blog sitemap"""
        # In production, this would query the database
        return [
            {
                'slug': 'hangman-strategy-guide',
                'published_date': (datetime.utcnow() - timedelta(days=7)).isoformat(),
                'title': 'Ultimate Hangman Strategy Guide'
            },
            {
                'slug': 'word-games-brain-benefits',
                'published_date': (datetime.utcnow() - timedelta(days=14)).isoformat(),
                'title': 'The Brain Benefits of Playing Word Games'
            },
            {
                'slug': 'history-of-hangman-game',
                'published_date': (datetime.utcnow() - timedelta(days=21)).isoformat(),
                'title': 'The Fascinating History of the Hangman Game'
            },
            {
                'slug': 'improve-vocabulary-word-games',
                'published_date': (datetime.utcnow() - timedelta(days=28)).isoformat(),
                'title': 'How Word Games Can Improve Your Vocabulary'
            },
            {
                'slug': 'word-games-for-kids',
                'published_date': (datetime.utcnow() - timedelta(days=35)).isoformat(),
                'title': 'Best Word Games for Kids: Educational and Fun'
            }
        ]
    
    def _get_category_pages(self) -> List[Dict]:
        """Get category pages for category sitemap"""
        return [
            {
                'slug': 'animals',
                'lastmod': (datetime.utcnow() - timedelta(days=3)).isoformat(),
                'name': 'Animal Words'
            },
            {
                'slug': 'food',
                'lastmod': (datetime.utcnow() - timedelta(days=5)).isoformat(),
                'name': 'Food Words'
            },
            {
                'slug': 'places',
                'lastmod': (datetime.utcnow() - timedelta(days=7)).isoformat(),
                'name': 'Places and Locations'
            },
            {
                'slug': 'objects',
                'lastmod': (datetime.utcnow() - timedelta(days=4)).isoformat(),
                'name': 'Common Objects'
            },
            {
                'slug': 'technology',
                'lastmod': (datetime.utcnow() - timedelta(days=2)).isoformat(),
                'name': 'Technology Terms'
            },
            {
                'slug': 'nature',
                'lastmod': (datetime.utcnow() - timedelta(days=6)).isoformat(),
                'name': 'Nature Words'
            },
            {
                'slug': 'sports',
                'lastmod': (datetime.utcnow() - timedelta(days=8)).isoformat(),
                'name': 'Sports and Activities'
            },
            {
                'slug': 'science',
                'lastmod': (datetime.utcnow() - timedelta(days=10)).isoformat(),
                'name': 'Science Terms'
            }
        ]
    
    def _get_game_pages(self) -> List[Dict]:
        """Get game-related pages for games sitemap"""
        return [
            {
                'url': '/hangman',
                'lastmod': datetime.utcnow().isoformat(),
                'changefreq': 'daily',
                'priority': 0.9
            },
            {
                'url': '/daily-challenge',
                'lastmod': datetime.utcnow().isoformat(),
                'changefreq': 'daily',
                'priority': 0.8
            },
            {
                'url': '/leaderboard',
                'lastmod': datetime.utcnow().isoformat(),
                'changefreq': 'hourly',
                'priority': 0.7
            },
            {
                'url': '/achievements',
                'lastmod': (datetime.utcnow() - timedelta(days=1)).isoformat(),
                'changefreq': 'daily',
                'priority': 0.6
            },
            {
                'url': '/statistics',
                'lastmod': datetime.utcnow().isoformat(),
                'changefreq': 'daily',
                'priority': 0.5
            }
        ]
    
    def _prettify_xml(self, element: ET.Element) -> str:
        """Return a pretty-printed XML string"""
        rough_string = ET.tostring(element, encoding='unicode')
        reparsed = minidom.parseString(rough_string)
        pretty_xml = reparsed.toprettyxml(indent="  ")
        
        # Remove empty lines and fix formatting
        lines = [line for line in pretty_xml.split('\n') if line.strip()]
        return '\n'.join(lines)
    
    def save_sitemap_to_file(self, sitemap_xml: str, filename: str, directory: str = "/tmp") -> str:
        """Save sitemap XML to file"""
        filepath = os.path.join(directory, filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(sitemap_xml)
        
        return filepath
    
    def get_sitemap_stats(self) -> Dict[str, any]:
        """Get statistics about sitemaps"""
        return {
            'total_pages': len(self._get_all_content_items()),
            'blog_posts': len(self._get_blog_posts()),
            'category_pages': len(self._get_category_pages()),
            'game_pages': len(self._get_game_pages()),
            'last_generated': datetime.utcnow().isoformat(),
            'estimated_size_kb': 15.7,  # Estimated based on content
            'sitemaps_available': [
                'sitemap.xml',
                'sitemap-index.xml',
                'sitemap-blog.xml',
                'sitemap-categories.xml',
                'sitemap-games.xml'
            ]
        }

