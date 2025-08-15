import React, { useEffect, useState, useCallback } from 'react';

// Mobile optimization utilities and components
export const MobileOptimizer = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [orientation, setOrientation] = useState('portrait');

  useEffect(() => {
    // Detect mobile and touch devices
    const checkDevice = () => {
      const mobile = window.innerWidth <= 768;
      const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const orient = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
      
      setIsMobile(mobile);
      setIsTouch(touch);
      setOrientation(orient);
      
      // Add classes to body for CSS targeting
      document.body.classList.toggle('mobile', mobile);
      document.body.classList.toggle('touch', touch);
      document.body.classList.toggle('portrait', orient === 'portrait');
      document.body.classList.toggle('landscape', orient === 'landscape');
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);

  useEffect(() => {
    // Optimize touch events for mobile
    if (isTouch) {
      // Remove 300ms click delay on mobile
      const style = document.createElement('style');
      style.textContent = `
        * {
          touch-action: manipulation;
        }
        
        .game-button, .tab-button, .premium-button {
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }
        
        .crossword-cell, .sudoku-cell {
          touch-action: manipulation;
          -webkit-tap-highlight-color: rgba(0,0,0,0.1);
        }
      `;
      document.head.appendChild(style);

      // Prevent zoom on double tap for game elements
      let lastTouchEnd = 0;
      document.addEventListener('touchend', function (event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
          event.preventDefault();
        }
        lastTouchEnd = now;
      }, false);
    }
  }, [isTouch]);

  return null; // This is a utility component
};

// Touch-optimized button component
export const TouchButton = ({ 
  children, 
  onClick, 
  className = '', 
  disabled = false,
  size = 'medium',
  ...props 
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleTouchStart = useCallback(() => {
    setIsPressed(true);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsPressed(false);
  }, []);

  const handleClick = useCallback((e) => {
    // Prevent double-firing on touch devices
    e.preventDefault();
    if (!disabled && onClick) {
      onClick(e);
    }
  }, [onClick, disabled]);

  const sizeClasses = {
    small: 'min-h-[44px] min-w-[44px] px-3 py-2 text-sm',
    medium: 'min-h-[48px] min-w-[48px] px-4 py-3 text-base',
    large: 'min-h-[56px] min-w-[56px] px-6 py-4 text-lg'
  };

  return (
    <button
      className={`
        ${sizeClasses[size]}
        ${className}
        ${isPressed ? 'transform scale-95' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        transition-all duration-150 ease-out
        touch-manipulation
        select-none
        font-bold
        border-2 border-black
        bg-white
        hover:bg-gray-100
        active:bg-gray-200
        focus:outline-none
        focus:ring-2
        focus:ring-black
        focus:ring-offset-2
      `}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

// Mobile-optimized input component
export const TouchInput = ({ 
  value, 
  onChange, 
  onFocus,
  onBlur,
  className = '',
  placeholder = '',
  maxLength,
  type = 'text',
  ...props 
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = useCallback((e) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
    
    // Scroll into view on mobile to prevent keyboard overlap
    if (window.innerWidth <= 768) {
      setTimeout(() => {
        e.target.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 300);
    }
  }, [onFocus]);

  const handleBlur = useCallback((e) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  }, [onBlur]);

  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      maxLength={maxLength}
      className={`
        ${className}
        min-h-[48px]
        px-4 py-3
        text-lg
        border-2 border-black
        bg-white
        focus:outline-none
        focus:ring-2
        focus:ring-black
        focus:ring-offset-2
        ${isFocused ? 'border-blue-500' : ''}
        touch-manipulation
        font-mono
      `}
      {...props}
    />
  );
};

// Mobile-optimized game grid component
export const TouchGrid = ({ 
  children, 
  columns, 
  gap = 2,
  className = '',
  ...props 
}) => {
  return (
    <div
      className={`
        ${className}
        grid
        gap-${gap}
        touch-manipulation
        select-none
      `}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        // Ensure minimum touch target size
        minHeight: '44px'
      }}
      {...props}
    >
      {children}
    </div>
  );
};

// Performance-optimized scroll component
export const OptimizedScroll = ({ 
  children, 
  className = '',
  onScroll,
  ...props 
}) => {
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = React.useRef(null);

  const handleScroll = useCallback((e) => {
    setIsScrolling(true);
    
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Set new timeout
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
    
    if (onScroll) {
      onScroll(e);
    }
  }, [onScroll]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`
        ${className}
        ${isScrolling ? 'pointer-events-none' : ''}
        overflow-auto
        -webkit-overflow-scrolling: touch
      `}
      onScroll={handleScroll}
      {...props}
    >
      {children}
    </div>
  );
};

// Mobile navigation helper
export const MobileNavigation = ({ 
  tabs, 
  activeTab, 
  onTabChange,
  className = '' 
}) => {
  return (
    <div className={`
      ${className}
      flex
      overflow-x-auto
      -webkit-overflow-scrolling: touch
      scrollbar-hide
      bg-gray-100
      border-b-2 border-black
    `}>
      {tabs.map((tab, index) => (
        <TouchButton
          key={tab.id || index}
          onClick={() => onTabChange(tab.id || index)}
          className={`
            flex-shrink-0
            whitespace-nowrap
            border-b-4
            ${activeTab === (tab.id || index) 
              ? 'border-black bg-white' 
              : 'border-transparent bg-gray-100'
            }
          `}
          size="medium"
        >
          {tab.icon && <span className="mr-2">{tab.icon}</span>}
          {tab.label}
        </TouchButton>
      ))}
    </div>
  );
};

// Viewport height fix for mobile browsers
export const useViewportHeight = () => {
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);

    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
    };
  }, []);
};

// Touch gesture handler
export const useTouchGestures = (elementRef, options = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onPinch,
    threshold = 50
  } = options;

  useEffect(() => {
    if (!elementRef.current) return;

    let startX = 0;
    let startY = 0;
    let startDistance = 0;

    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      } else if (e.touches.length === 2 && onPinch) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        startDistance = Math.sqrt(dx * dx + dy * dy);
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 2 && onPinch) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const scale = distance / startDistance;
        onPinch(scale);
      }
    };

    const handleTouchEnd = (e) => {
      if (e.changedTouches.length === 1) {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const deltaX = endX - startX;
        const deltaY = endY - startY;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // Horizontal swipe
          if (Math.abs(deltaX) > threshold) {
            if (deltaX > 0 && onSwipeRight) {
              onSwipeRight();
            } else if (deltaX < 0 && onSwipeLeft) {
              onSwipeLeft();
            }
          }
        } else {
          // Vertical swipe
          if (Math.abs(deltaY) > threshold) {
            if (deltaY > 0 && onSwipeDown) {
              onSwipeDown();
            } else if (deltaY < 0 && onSwipeUp) {
              onSwipeUp();
            }
          }
        }
      }
    };

    const element = elementRef.current;
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onPinch, threshold]);
};

// Mobile performance monitor
export const useMobilePerformance = () => {
  useEffect(() => {
    // Monitor frame rate
    let frameCount = 0;
    let lastTime = performance.now();

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        
        // Track low FPS on mobile
        if (window.innerWidth <= 768 && fps < 30) {
          if (window.gtag) {
            window.gtag('event', 'mobile_low_fps', {
              event_category: 'performance',
              event_label: 'mobile_performance',
              value: fps
            });
          }
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);

    // Monitor touch responsiveness
    let touchStartTime = 0;
    
    const handleTouchStart = () => {
      touchStartTime = performance.now();
    };
    
    const handleTouchEnd = () => {
      const touchDuration = performance.now() - touchStartTime;
      
      // Track slow touch responses
      if (touchDuration > 100) {
        if (window.gtag) {
          window.gtag('event', 'slow_touch_response', {
            event_category: 'performance',
            event_label: 'touch_performance',
            value: Math.round(touchDuration)
          });
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);
};

export default MobileOptimizer;

