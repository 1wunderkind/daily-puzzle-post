import React, { Suspense, lazy, useEffect, useState } from 'react';

// Lazy load non-critical components
const BlogSection = lazy(() => import('./BlogSection'));
const GameVariations = lazy(() => import('./GameVariations'));
const SocialIntegration = lazy(() => import('./SocialIntegration'));
const ArchiveAccess = lazy(() => import('./ArchiveAccess'));
const PremiumModal = lazy(() => import('./PremiumModal'));

// Critical CSS inlined in head
const criticalCSS = `
/* Critical above-the-fold styles */
.site-header {
  background-color: #FDFBF7;
  border-bottom: 2px solid #0A0A0A;
  padding: 15px 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.site-logo {
  font-family: 'Times New Roman', Georgia, serif;
  font-size: 28px;
  font-weight: bold;
  color: #0A0A0A;
  text-decoration: none;
}

.game-tabs {
  background-color: #F5F5F5;
  border-bottom: 1px solid #CCCCCC;
  padding: 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.tabs-container {
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.tab-button {
  background: none;
  border: none;
  padding: 15px 20px;
  font-size: 14px;
  font-weight: bold;
  color: #333333;
  cursor: pointer;
  white-space: nowrap;
  border-bottom: 3px solid transparent;
  transition: all 0.2s ease;
}

.tab-button.active {
  color: #0A0A0A;
  border-bottom-color: #0A0A0A;
  background-color: #FDFBF7;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: 60vh;
}

/* Loading spinner for lazy components */
.lazy-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #0A0A0A;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

// Performance monitoring hook
export const usePerformanceMonitoring = () => {
  useEffect(() => {
    // Monitor Core Web Vitals
    if ('web-vital' in window) {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(console.log);
        getFID(console.log);
        getFCP(console.log);
        getLCP(console.log);
        getTTFB(console.log);
      });
    }

    // Monitor performance metrics
    if ('performance' in window && 'getEntriesByType' in performance) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0];
          const paint = performance.getEntriesByType('paint');
          
          // Track performance metrics
          if (window.gtag) {
            window.gtag('event', 'page_performance', {
              event_category: 'performance',
              dom_content_loaded: Math.round(navigation.domContentLoadedEventEnd),
              load_complete: Math.round(navigation.loadEventEnd),
              first_paint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
              first_contentful_paint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0
            });
          }
        }, 0);
      });
    }
  }, []);
};

// Lazy loading wrapper with error boundary
export const LazyWrapper = ({ children, fallback = null }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="lazy-error">
        <p>Something went wrong loading this section.</p>
        <button onClick={() => setHasError(false)}>Try Again</button>
      </div>
    );
  }

  return (
    <Suspense 
      fallback={fallback || (
        <div className="lazy-loading">
          <div className="spinner"></div>
        </div>
      )}
    >
      {children}
    </Suspense>
  );
};

// Critical CSS injector
export const CriticalCSSInjector = () => {
  useEffect(() => {
    // Inject critical CSS if not already present
    if (!document.querySelector('#critical-css')) {
      const style = document.createElement('style');
      style.id = 'critical-css';
      style.textContent = criticalCSS;
      document.head.insertBefore(style, document.head.firstChild);
    }
  }, []);

  return null;
};

// Preload critical resources
export const ResourcePreloader = () => {
  useEffect(() => {
    // Preload critical fonts
    const fontPreload = document.createElement('link');
    fontPreload.rel = 'preload';
    fontPreload.href = 'https://fonts.googleapis.com/css2?family=Times+New+Roman:wght@400;700&display=swap';
    fontPreload.as = 'style';
    fontPreload.onload = function() { this.rel = 'stylesheet'; };
    document.head.appendChild(fontPreload);

    // Preload critical game data
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        // Preload game data during idle time
        import('./gameData').catch(() => {});
        import('./crosswordData').catch(() => {});
      });
    }
  }, []);

  return null;
};

// Image lazy loading component
export const LazyImage = ({ src, alt, className, ...props }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    const element = document.querySelector(`[data-src="${src}"]`);
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [src]);

  return (
    <img
      data-src={src}
      src={isInView ? src : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNGNUY1RjUiLz48L3N2Zz4='}
      alt={alt}
      className={`${className} ${isLoaded ? 'loaded' : 'loading'}`}
      loading="lazy"
      onLoad={() => setIsLoaded(true)}
      {...props}
    />
  );
};

// Performance-optimized ad component
export const OptimizedAd = ({ type, className }) => {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // Load ads only when they're about to be visible
    const timer = setTimeout(() => {
      setShouldLoad(true);
    }, 1000); // Delay ad loading by 1 second

    return () => clearTimeout(timer);
  }, []);

  if (!shouldLoad) {
    return (
      <div className={`ad-placeholder ${className}`} style={{ minHeight: '250px' }}>
        <div className="ad-loading">Advertisement Loading...</div>
      </div>
    );
  }

  return (
    <div className={`adsense-container ${className}`} loading="lazy">
      <div className="ad-label-container">
        <span className="ad-label">Advertisement</span>
      </div>
      <div className="adsense-placeholder">
        <div>{type === 'sidebar' ? '300 x 250' : '728 x 90'}</div>
        <div>{type === 'sidebar' ? 'Sidebar Ad' : 'Header Ad'}</div>
      </div>
    </div>
  );
};

// Service Worker registration for caching
export const ServiceWorkerRegistration = () => {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
  }, []);

  return null;
};

export {
  BlogSection,
  GameVariations,
  SocialIntegration,
  ArchiveAccess,
  PremiumModal
};

