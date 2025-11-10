'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function TopProgressBar() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Reset and start progress when route changes
    setIsVisible(true);
    setProgress(0);

    // Clear any existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    // Simulate progress with realistic increments
    let currentProgress = 0;
    intervalRef.current = setInterval(() => {
      if (currentProgress >= 90) {
        clearInterval(intervalRef.current!);
        return;
      }
      
      // Increment progress with decreasing speed (faster at start, slower near end)
      const increment = currentProgress < 30 ? 15 : currentProgress < 60 ? 8 : 3;
      currentProgress = Math.min(currentProgress + increment, 90);
      setProgress(currentProgress);
    }, 100);

    // Complete progress after route transition
    timeoutRef.current = setTimeout(() => {
      setProgress(100);
      // Hide after completion animation
      setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, 300);
    }, 500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [pathname]);

  if (!isVisible && progress === 0) {
    return null;
  }

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-transparent pointer-events-none"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
      }}
    >
      <div
        className="h-full bg-gradient-to-r from-fil-blue via-fil-blue-light to-fil-blue shadow-lg"
        style={{
          width: `${progress}%`,
          transition: progress === 100 
            ? 'width 0.3s ease-out, opacity 0.3s ease-out' 
            : 'width 0.1s linear',
          opacity: isVisible ? 1 : 0,
          boxShadow: '0 2px 4px rgba(0, 123, 255, 0.3)',
        }}
      />
    </div>
  );
}

