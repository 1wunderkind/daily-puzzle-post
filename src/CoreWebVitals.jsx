import React, { useEffect, useCallback, useRef } from 'react';

// Core Web Vitals optimization and monitoring
export const CoreWebVitalsOptimizer = () => {
  const observerRef = useRef(null);
  const metricsRef = useRef({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null
  });

  useEffect(() => {
    // Initialize Core Web Vitals monitoring
    initializeCoreWebVitals();
    
    // Optimize for LCP (Largest Contentful Paint)
    optimizeLCP();
    
    // Optimize for FID (First Input Delay)
    optimizeFID();
    
    // Optimize for CLS (Cumulative Layout Shift)
    optimizeCLS();

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const initializeCoreWebVitals = () => {
    // Load web-vitals library dynamically
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      // Measure and report Core Web Vitals
      getCLS(onCLS);
      getFID(onFID);
      getFCP(onFCP);
      getLCP(onLCP);
      getTTFB(onTTFB);
    }).catch(() => {
      // Fallback if web-vitals library is not available
      console.log('Web Vitals library not available, using fallback monitoring');
      initializeFallbackMonitoring();
    });
  };

  const onLCP = useCallback((metric) => {
    metricsRef.current.lcp = metric;
    reportMetric('LCP', metric);
    
    // Alert if LCP is poor (> 2.5s)
    if (metric.value > 2500) {
      console.warn('Poor LCP detected:', metric.value);
      optimizeLCPFurther();
    }
  }, []);

  const onFID = useCallback((metric) => {
    metricsRef.current.fid = metric;
    reportMetric('FID', metric);
    
    // Alert if FID is poor (> 100ms)
    if (metric.value > 100) {
      console.warn('Poor FID detected:', metric.value);
      optimizeFIDFurther();
    }
  }, []);

  const onCLS = useCallback((metric) => {
    metricsRef.current.cls = metric;
    reportMetric('CLS', metric);
    
    // Alert if CLS is poor (> 0.1)
    if (metric.value > 0.1) {
      console.warn('Poor CLS detected:', metric.value);
      optimizeCLSFurther();
    }
  }, []);

  const onFCP = useCallback((metric) => {
    metricsRef.current.fcp = metric;
    reportMetric('FCP', metric);
  }, []);

  const onTTFB = useCallback((metric) => {
    metricsRef.current.ttfb = metric;
    reportMetric('TTFB', metric);
  }, []);

  const reportMetric = (name, metric) => {
    // Send to Google Analytics
    if (window.gtag) {
      window.gtag('event', name, {
        event_category: 'Web Vitals',
        value: Math.round(name === 'CLS' ? metric.value * 1000 : metric.value),
        event_label: metric.id,
        non_interaction: true
      });
    }

    // Store in localStorage for local analytics
    try {
      const vitals = JSON.parse(localStorage.getItem('dpp_web_vitals') || '[]');
      vitals.push({
        name,
        value: metric.value,
        id: metric.id,
        timestamp: Date.now()
      });
      
      // Keep only last 50 measurements
      localStorage.setItem('dpp_web_vitals', JSON.stringify(vitals.slice(-50)));
    } catch (error) {
      console.warn('Failed to store web vitals:', error);
    }
  };

  const optimizeLCP = () => {
    // Preload critical resources
    const criticalResources = [
      '/fonts/times-new-roman.woff2',
      '/api/puzzles/today',
      '/api/hangman/words/today'
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      link.as = resource.includes('font') ? 'font' : 'fetch';
      if (resource.includes('font')) {
        link.crossOrigin = 'anonymous';
      }
      document.head.appendChild(link);
    });

    // Optimize images for LCP
    const images = document.querySelectorAll('img[data-lcp]');
    images.forEach(img => {
      img.loading = 'eager';
      img.fetchPriority = 'high';
    });

    // Remove render-blocking resources
    const nonCriticalCSS = document.querySelectorAll('link[rel="stylesheet"]:not([data-critical])');
    nonCriticalCSS.forEach(link => {
      link.media = 'print';
      link.onload = function() {
        this.media = 'all';
      };
    });
  };

  const optimizeFID = () => {
    // Defer non-critical JavaScript
    const scripts = document.querySelectorAll('script[data-defer]');
    scripts.forEach(script => {
      script.defer = true;
    });

    // Break up long tasks
    if ('scheduler' in window && 'postTask' in window.scheduler) {
      // Use Scheduler API if available
      window.scheduler.postTask(() => {
        // Defer heavy computations
        deferHeavyTasks();
      }, { priority: 'background' });
    } else {
      // Fallback to setTimeout
      setTimeout(deferHeavyTasks, 0);
    }

    // Optimize event listeners
    optimizeEventListeners();
  };

  const optimizeCLS = () => {
    // Set explicit dimensions for images and ads
    const images = document.querySelectorAll('img:not([width]):not([height])');
    images.forEach(img => {
      // Set aspect ratio to prevent layout shift
      img.style.aspectRatio = '16/9'; // Default aspect ratio
    });

    // Reserve space for ads
    const adContainers = document.querySelectorAll('.ad-placement');
    adContainers.forEach(container => {
      if (!container.style.minHeight) {
        container.style.minHeight = container.dataset.height || '250px';
      }
    });

    // Observe layout shifts
    if ('LayoutShiftAttribution' in window) {
      observerRef.current = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.hadRecentInput) continue;
          
          // Log layout shift sources
          console.log('Layout shift detected:', {
            value: entry.value,
            sources: entry.sources?.map(source => ({
              node: source.node,
              previousRect: source.previousRect,
              currentRect: source.currentRect
            }))
          });
        }
      });
      
      observerRef.current.observe({ type: 'layout-shift', buffered: true });
    }
  };

  const optimizeLCPFurther = () => {
    // Additional LCP optimizations for poor scores
    
    // Inline critical CSS
    const criticalCSS = `
      .site-header { background: #FDFBF7; border-bottom: 2px solid #0A0A0A; }
      .main-content { max-width: 1200px; margin: 0 auto; padding: 20px; }
      .game-container { min-height: 400px; }
    `;
    
    const style = document.createElement('style');
    style.textContent = criticalCSS;
    document.head.insertBefore(style, document.head.firstChild);

    // Prioritize above-the-fold content
    const aboveFold = document.querySelector('.main-content');
    if (aboveFold) {
      aboveFold.style.willChange = 'contents';
    }
  };

  const optimizeFIDFurther = () => {
    // Additional FID optimizations for poor scores
    
    // Reduce JavaScript execution time
    const heavyTasks = [
      () => initializeAnalytics(),
      () => loadNonCriticalFeatures(),
      () => preloadNextPuzzle()
    ];

    heavyTasks.forEach((task, index) => {
      setTimeout(task, index * 100);
    });

    // Use web workers for heavy computations
    if ('Worker' in window) {
      const worker = new Worker('/js/puzzle-worker.js');
      worker.postMessage({ type: 'PRECOMPUTE_PUZZLES' });
    }
  };

  const optimizeCLSFurther = () => {
    // Additional CLS optimizations for poor scores
    
    // Fix font loading shifts
    const fontDisplay = document.createElement('style');
    fontDisplay.textContent = `
      @font-face {
        font-family: 'Times New Roman';
        font-display: swap;
        src: local('Times New Roman');
      }
    `;
    document.head.appendChild(fontDisplay);

    // Stabilize dynamic content
    const dynamicElements = document.querySelectorAll('[data-dynamic]');
    dynamicElements.forEach(element => {
      element.style.minHeight = element.offsetHeight + 'px';
    });
  };

  const deferHeavyTasks = () => {
    // Defer heavy initialization tasks
    const tasks = [
      () => initializeGameAnalytics(),
      () => loadUserPreferences(),
      () => setupServiceWorker(),
      () => preloadAssets()
    ];

    tasks.forEach((task, index) => {
      requestIdleCallback ? 
        requestIdleCallback(task, { timeout: 1000 + index * 500 }) :
        setTimeout(task, index * 100);
    });
  };

  const optimizeEventListeners = () => {
    // Use passive event listeners where possible
    const passiveEvents = ['scroll', 'touchstart', 'touchmove', 'wheel'];
    
    passiveEvents.forEach(eventType => {
      const elements = document.querySelectorAll(`[data-${eventType}]`);
      elements.forEach(element => {
        const handler = element.dataset[eventType];
        if (handler && window[handler]) {
          element.addEventListener(eventType, window[handler], { passive: true });
        }
      });
    });

    // Debounce resize events
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        window.dispatchEvent(new Event('debouncedResize'));
      }, 250);
    }, { passive: true });
  };

  const initializeFallbackMonitoring = () => {
    // Fallback monitoring when web-vitals library is not available
    
    // Monitor LCP manually
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        const metric = {
          name: 'LCP',
          value: lastEntry.startTime,
          id: 'fallback-lcp'
        };
        
        onLCP(metric);
      });
      
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    }

    // Monitor FID manually
    let firstInputDelay = null;
    const measureFID = (event) => {
      if (firstInputDelay === null) {
        firstInputDelay = performance.now() - event.timeStamp;
        
        const metric = {
          name: 'FID',
          value: firstInputDelay,
          id: 'fallback-fid'
        };
        
        onFID(metric);
        
        // Remove listeners after first input
        ['click', 'keydown', 'touchstart'].forEach(type => {
          document.removeEventListener(type, measureFID, true);
        });
      }
    };

    ['click', 'keydown', 'touchstart'].forEach(type => {
      document.addEventListener(type, measureFID, true);
    });
  };

  const initializeGameAnalytics = () => {
    // Initialize game-specific analytics
    window.gameAnalytics = {
      trackGameStart: (gameType) => {
        if (window.gtag) {
          window.gtag('event', 'game_start', {
            event_category: 'games',
            event_label: gameType
          });
        }
      },
      trackGameComplete: (gameType, duration) => {
        if (window.gtag) {
          window.gtag('event', 'game_complete', {
            event_category: 'games',
            event_label: gameType,
            value: Math.round(duration)
          });
        }
      }
    };
  };

  const loadUserPreferences = () => {
    // Load user preferences from cache
    try {
      const prefs = localStorage.getItem('dpp_user_preferences');
      if (prefs) {
        const preferences = JSON.parse(prefs);
        document.body.classList.toggle('dark-mode', preferences.darkMode);
        document.body.classList.toggle('reduced-motion', preferences.reducedMotion);
      }
    } catch (error) {
      console.warn('Failed to load user preferences:', error);
    }
  };

  const setupServiceWorker = () => {
    // Register service worker for caching
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered:', registration);
        })
        .catch(error => {
          console.log('SW registration failed:', error);
        });
    }
  };

  const preloadAssets = () => {
    // Preload next puzzle assets
    const nextPuzzleTypes = ['crossword', 'sudoku', 'hangman'];
    
    nextPuzzleTypes.forEach(type => {
      fetch(`/api/${type}/tomorrow`, { 
        method: 'HEAD',
        priority: 'low' 
      }).catch(() => {
        // Ignore errors for preloading
      });
    });
  };

  const loadNonCriticalFeatures = () => {
    // Load non-critical features
    import('./SocialIntegration').catch(() => {});
    import('./ArchiveAccess').catch(() => {});
    import('./PremiumModal').catch(() => {});
  };

  const preloadNextPuzzle = () => {
    // Preload tomorrow's puzzle data
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    fetch(`/api/puzzles/date/${tomorrowStr}`, {
      priority: 'low'
    }).catch(() => {
      // Ignore errors for preloading
    });
  };

  return null; // This is a utility component
};

// Performance monitoring hook
export const usePerformanceMonitoring = () => {
  useEffect(() => {
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn('Long task detected:', entry.duration);
            
            if (window.gtag) {
              window.gtag('event', 'long_task', {
                event_category: 'performance',
                value: Math.round(entry.duration),
                event_label: entry.name
              });
            }
          }
        }
      });
      
      longTaskObserver.observe({ type: 'longtask', buffered: true });
      
      return () => longTaskObserver.disconnect();
    }
  }, []);
};

// Resource loading optimization hook
export const useResourceOptimization = () => {
  useEffect(() => {
    // Optimize resource loading based on connection
    if ('connection' in navigator) {
      const connection = navigator.connection;
      
      // Adjust quality based on connection speed
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        document.body.classList.add('low-bandwidth');
        
        // Disable non-essential features
        const nonEssential = document.querySelectorAll('[data-non-essential]');
        nonEssential.forEach(element => {
          element.style.display = 'none';
        });
      }
      
      // Monitor connection changes
      connection.addEventListener('change', () => {
        console.log('Connection changed:', connection.effectiveType);
      });
    }
  }, []);
};

export default CoreWebVitalsOptimizer;

