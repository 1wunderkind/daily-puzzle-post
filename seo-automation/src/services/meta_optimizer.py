import re
import json
from datetime import datetime
from typing import Dict, List, Optional, Tuple

class MetaTagOptimizer:
    """Service for automated meta tag optimization and structured data generation"""
    
    def __init__(self):
        self.title_length_min = 30
        self.title_length_max = 60
        self.description_length_min = 120
        self.description_length_max = 160
        
        # Daily Puzzle Post specific keywords
        self.primary_keywords = [
            'hangman online', 'free word games', 'daily puzzle', 'brain training',
            'word puzzles', 'online games', 'vocabulary games', 'spelling games'
        ]
        
        self.secondary_keywords = [
            'crossword', 'word search', 'anagram', 'vocabulary builder',
            'educational games', 'mind games', 'puzzle games', 'word challenge'
        ]
    
    def optimize_title_tag(self, current_title: str, target_keyword: str, page_type: str = 'game') -> Dict:
        """Generate optimized title tag with SEO best practices"""
        
        # Title templates based on page type
        templates = {
            'game': [
                f"{target_keyword} - Free Online Word Game | Daily Puzzle Post",
                f"Play {target_keyword} Online Free | Daily Puzzle Post",
                f"{target_keyword} Game - Brain Training | Daily Puzzle Post",
                f"Free {target_keyword} - No Download Required | Daily Puzzle Post"
            ],
            'blog': [
                f"{target_keyword} - Complete Guide | Daily Puzzle Post",
                f"How to Master {target_keyword} | Daily Puzzle Post Blog",
                f"{target_keyword} Tips and Strategies | Daily Puzzle Post",
                f"Ultimate {target_keyword} Guide | Daily Puzzle Post"
            ],
            'faq': [
                f"{target_keyword} FAQ - Common Questions | Daily Puzzle Post",
                f"{target_keyword} Help and Support | Daily Puzzle Post",
                f"Frequently Asked Questions - {target_keyword} | Daily Puzzle Post"
            ]
        }
        
        suggestions = templates.get(page_type, templates['game'])
        
        # Analyze current title
        analysis = {
            'current_title': current_title,
            'current_length': len(current_title),
            'has_target_keyword': target_keyword.lower() in current_title.lower(),
            'has_brand': 'Daily Puzzle Post' in current_title,
            'length_status': self._get_length_status(len(current_title), self.title_length_min, self.title_length_max)
        }
        
        # Generate optimized suggestions
        optimized_suggestions = []
        for template in suggestions:
            if len(template) <= self.title_length_max:
                optimized_suggestions.append({
                    'title': template,
                    'length': len(template),
                    'score': self._calculate_title_score(template, target_keyword)
                })
        
        # Sort by score
        optimized_suggestions.sort(key=lambda x: x['score'], reverse=True)
        
        return {
            'analysis': analysis,
            'recommendations': optimized_suggestions[:3],
            'best_title': optimized_suggestions[0]['title'] if optimized_suggestions else current_title
        }
    
    def optimize_meta_description(self, current_description: str, target_keyword: str, page_type: str = 'game') -> Dict:
        """Generate optimized meta description with SEO best practices"""
        
        # Description templates based on page type
        templates = {
            'game': [
                f"Play {target_keyword} online free! No download required. Perfect for brain training and vocabulary building. Join thousands of players on Daily Puzzle Post.",
                f"Free {target_keyword} game with unlimited plays. Improve your vocabulary and spelling skills. Mobile-friendly and ad-free option available.",
                f"Challenge yourself with {target_keyword} on Daily Puzzle Post. Free online word game with hints, categories, and progress tracking. Start playing now!",
                f"Master {target_keyword} with our free online game. Features multiple difficulty levels, daily challenges, and brain training exercises."
            ],
            'blog': [
                f"Learn everything about {target_keyword} in this comprehensive guide. Tips, strategies, and expert advice to improve your word game skills.",
                f"Discover the best {target_keyword} strategies and techniques. Complete guide with examples, tips, and practice exercises for all skill levels.",
                f"Ultimate {target_keyword} guide with proven strategies, common mistakes to avoid, and expert tips to master word games quickly."
            ],
            'faq': [
                f"Find answers to common {target_keyword} questions. Complete FAQ covering rules, strategies, tips, and troubleshooting for Daily Puzzle Post.",
                f"Get help with {target_keyword} gameplay, rules, and features. Comprehensive FAQ and support guide for Daily Puzzle Post players."
            ]
        }
        
        suggestions = templates.get(page_type, templates['game'])
        
        # Analyze current description
        analysis = {
            'current_description': current_description,
            'current_length': len(current_description),
            'has_target_keyword': target_keyword.lower() in current_description.lower(),
            'has_call_to_action': any(cta in current_description.lower() for cta in ['play', 'start', 'try', 'join', 'discover', 'learn']),
            'length_status': self._get_length_status(len(current_description), self.description_length_min, self.description_length_max)
        }
        
        # Generate optimized suggestions
        optimized_suggestions = []
        for template in suggestions:
            if self.description_length_min <= len(template) <= self.description_length_max:
                optimized_suggestions.append({
                    'description': template,
                    'length': len(template),
                    'score': self._calculate_description_score(template, target_keyword)
                })
        
        # Sort by score
        optimized_suggestions.sort(key=lambda x: x['score'], reverse=True)
        
        return {
            'analysis': analysis,
            'recommendations': optimized_suggestions[:3],
            'best_description': optimized_suggestions[0]['description'] if optimized_suggestions else current_description
        }
    
    def generate_structured_data(self, page_data: Dict) -> Dict:
        """Generate JSON-LD structured data for different page types"""
        
        page_type = page_data.get('type', 'game')
        base_url = page_data.get('base_url', 'https://dailypuzzlepost.com')
        
        if page_type == 'game':
            return self._generate_game_schema(page_data, base_url)
        elif page_type == 'blog':
            return self._generate_article_schema(page_data, base_url)
        elif page_type == 'faq':
            return self._generate_faq_schema(page_data, base_url)
        else:
            return self._generate_webpage_schema(page_data, base_url)
    
    def _generate_game_schema(self, page_data: Dict, base_url: str) -> Dict:
        """Generate structured data for game pages"""
        return {
            "@context": "https://schema.org",
            "@type": "Game",
            "name": page_data.get('title', 'Daily Puzzle Post - Free Word Games'),
            "description": page_data.get('description', 'Play free word games online including Hangman, Word Search, and more.'),
            "url": f"{base_url}/{page_data.get('slug', '')}",
            "genre": "Word Game",
            "gamePlatform": ["Web Browser", "Mobile", "Desktop"],
            "operatingSystem": "Any",
            "applicationCategory": "Game",
            "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock"
            },
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "1247",
                "bestRating": "5",
                "worstRating": "1"
            },
            "publisher": {
                "@type": "Organization",
                "name": "Daily Puzzle Post",
                "url": base_url,
                "logo": {
                    "@type": "ImageObject",
                    "url": f"{base_url}/logo.png"
                }
            }
        }
    
    def _generate_article_schema(self, page_data: Dict, base_url: str) -> Dict:
        """Generate structured data for blog articles"""
        return {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": page_data.get('title', ''),
            "description": page_data.get('description', ''),
            "url": f"{base_url}/blog/{page_data.get('slug', '')}",
            "datePublished": page_data.get('published_date', datetime.utcnow().isoformat()),
            "dateModified": page_data.get('modified_date', datetime.utcnow().isoformat()),
            "author": {
                "@type": "Organization",
                "name": "Daily Puzzle Post",
                "url": base_url
            },
            "publisher": {
                "@type": "Organization",
                "name": "Daily Puzzle Post",
                "url": base_url,
                "logo": {
                    "@type": "ImageObject",
                    "url": f"{base_url}/logo.png"
                }
            },
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": f"{base_url}/blog/{page_data.get('slug', '')}"
            },
            "articleSection": "Gaming",
            "keywords": page_data.get('keywords', []),
            "wordCount": page_data.get('word_count', 0)
        }
    
    def _generate_faq_schema(self, page_data: Dict, base_url: str) -> Dict:
        """Generate structured data for FAQ pages"""
        faq_items = []
        
        # Default FAQ items for Daily Puzzle Post
        default_faqs = [
            {
                "question": "Is Daily Puzzle Post really free?",
                "answer": "Yes! Daily Puzzle Post is completely free to play. We offer an optional premium upgrade to remove ads and unlock bonus features."
            },
            {
                "question": "Do I need to download anything?",
                "answer": "No downloads required! All games play directly in your web browser on any device - desktop, tablet, or mobile."
            },
            {
                "question": "Does it work on mobile phones?",
                "answer": "Absolutely! Daily Puzzle Post is fully optimized for mobile devices with large, touch-friendly buttons and responsive design."
            },
            {
                "question": "How do I remove ads?",
                "answer": "Click the 'Remove Ads' button for a one-time $4.99 payment to enjoy an ad-free experience with bonus features."
            },
            {
                "question": "Are there different difficulty levels?",
                "answer": "Yes! We offer multiple categories and difficulty levels to match your skill level, from beginner to expert."
            }
        ]
        
        faqs = page_data.get('faqs', default_faqs)
        
        for faq in faqs:
            faq_items.append({
                "@type": "Question",
                "name": faq.get('question', ''),
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": faq.get('answer', '')
                }
            })
        
        return {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faq_items
        }
    
    def _generate_webpage_schema(self, page_data: Dict, base_url: str) -> Dict:
        """Generate basic webpage structured data"""
        return {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": page_data.get('title', ''),
            "description": page_data.get('description', ''),
            "url": f"{base_url}/{page_data.get('slug', '')}",
            "publisher": {
                "@type": "Organization",
                "name": "Daily Puzzle Post",
                "url": base_url
            },
            "primaryImageOfPage": {
                "@type": "ImageObject",
                "url": page_data.get('image', f"{base_url}/og-image.png")
            }
        }
    
    def generate_open_graph_tags(self, page_data: Dict) -> Dict:
        """Generate Open Graph meta tags for social media"""
        base_url = page_data.get('base_url', 'https://dailypuzzlepost.com')
        
        og_tags = {
            'og:type': 'website',
            'og:site_name': 'Daily Puzzle Post',
            'og:title': page_data.get('title', 'Daily Puzzle Post - Free Word Games Online'),
            'og:description': page_data.get('description', 'Play free word games online including Hangman, Word Search, and more. No download required!'),
            'og:url': f"{base_url}/{page_data.get('slug', '')}",
            'og:image': page_data.get('image', f"{base_url}/og-image.png"),
            'og:image:width': '1200',
            'og:image:height': '630',
            'og:image:alt': page_data.get('title', 'Daily Puzzle Post'),
            'og:locale': 'en_US'
        }
        
        # Add game-specific Open Graph tags
        if page_data.get('type') == 'game':
            og_tags.update({
                'og:type': 'game',
                'game:points_scoring_system': 'Cumulative',
                'game:rating': '4.8'
            })
        
        return og_tags
    
    def generate_twitter_card_tags(self, page_data: Dict) -> Dict:
        """Generate Twitter Card meta tags"""
        base_url = page_data.get('base_url', 'https://dailypuzzlepost.com')
        
        return {
            'twitter:card': 'summary_large_image',
            'twitter:site': '@DailyPuzzlePost',
            'twitter:creator': '@DailyPuzzlePost',
            'twitter:title': page_data.get('title', 'Daily Puzzle Post - Free Word Games Online'),
            'twitter:description': page_data.get('description', 'Play free word games online including Hangman, Word Search, and more. No download required!'),
            'twitter:image': page_data.get('image', f"{base_url}/twitter-card.png"),
            'twitter:image:alt': page_data.get('title', 'Daily Puzzle Post')
        }
    
    def _calculate_title_score(self, title: str, target_keyword: str) -> int:
        """Calculate SEO score for title tag"""
        score = 0
        
        # Length score (optimal 50-60 characters)
        length = len(title)
        if 50 <= length <= 60:
            score += 30
        elif 30 <= length < 50 or 60 < length <= 70:
            score += 20
        else:
            score += 10
        
        # Keyword placement score
        if target_keyword.lower() in title.lower():
            score += 25
            # Bonus for keyword at the beginning
            if title.lower().startswith(target_keyword.lower()):
                score += 10
        
        # Brand presence
        if 'Daily Puzzle Post' in title:
            score += 15
        
        # Readability and appeal
        if any(word in title.lower() for word in ['free', 'online', 'play', 'game']):
            score += 10
        
        # Avoid keyword stuffing
        keyword_count = title.lower().count(target_keyword.lower())
        if keyword_count > 2:
            score -= 15
        
        return min(score, 100)
    
    def _calculate_description_score(self, description: str, target_keyword: str) -> int:
        """Calculate SEO score for meta description"""
        score = 0
        
        # Length score (optimal 120-160 characters)
        length = len(description)
        if 120 <= length <= 160:
            score += 25
        elif 100 <= length < 120 or 160 < length <= 180:
            score += 15
        else:
            score += 5
        
        # Keyword presence
        if target_keyword.lower() in description.lower():
            score += 20
        
        # Call-to-action presence
        cta_words = ['play', 'start', 'try', 'join', 'discover', 'learn', 'master', 'challenge']
        if any(cta in description.lower() for cta in cta_words):
            score += 15
        
        # Benefit/value proposition
        value_words = ['free', 'unlimited', 'no download', 'mobile-friendly', 'brain training']
        value_count = sum(1 for word in value_words if word in description.lower())
        score += min(value_count * 5, 20)
        
        # Emotional appeal
        emotion_words = ['challenge', 'master', 'improve', 'perfect', 'ultimate', 'expert']
        if any(word in description.lower() for word in emotion_words):
            score += 10
        
        # Avoid keyword stuffing
        keyword_count = description.lower().count(target_keyword.lower())
        if keyword_count > 3:
            score -= 10
        
        return min(score, 100)
    
    def _get_length_status(self, current_length: int, min_length: int, max_length: int) -> str:
        """Get status of text length"""
        if current_length < min_length:
            return 'too_short'
        elif current_length > max_length:
            return 'too_long'
        else:
            return 'optimal'
    
    def analyze_competitor_tags(self, competitor_data: List[Dict]) -> Dict:
        """Analyze competitor meta tags for insights"""
        analysis = {
            'title_patterns': [],
            'description_patterns': [],
            'common_keywords': [],
            'average_lengths': {
                'title': 0,
                'description': 0
            },
            'recommendations': []
        }
        
        if not competitor_data:
            return analysis
        
        # Analyze titles
        titles = [comp.get('title', '') for comp in competitor_data if comp.get('title')]
        if titles:
            analysis['average_lengths']['title'] = sum(len(title) for title in titles) / len(titles)
            
            # Find common patterns
            common_words = {}
            for title in titles:
                words = re.findall(r'\b\w+\b', title.lower())
                for word in words:
                    common_words[word] = common_words.get(word, 0) + 1
            
            # Get most common words (excluding stop words)
            stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were'}
            analysis['common_keywords'] = [
                word for word, count in sorted(common_words.items(), key=lambda x: x[1], reverse=True)
                if word not in stop_words and count > 1
            ][:10]
        
        # Analyze descriptions
        descriptions = [comp.get('description', '') for comp in competitor_data if comp.get('description')]
        if descriptions:
            analysis['average_lengths']['description'] = sum(len(desc) for desc in descriptions) / len(descriptions)
        
        # Generate recommendations
        analysis['recommendations'] = [
            f"Consider using common keywords: {', '.join(analysis['common_keywords'][:5])}",
            f"Optimal title length based on competitors: {int(analysis['average_lengths']['title'])} characters",
            f"Optimal description length based on competitors: {int(analysis['average_lengths']['description'])} characters"
        ]
        
        return analysis

