'use client';

import { useEffect } from 'react';

/**
 * Hook to pause animations when browser tab is hidden
 * Purpose: Reduce battery drain and CPU/GPU load when tab is not visible
 * 
 * Usage:
 * export default function Home() {
 *   useAnimationPause();
 *   return <div>Content with animations</div>;
 * }
 */
export function useAnimationPause() {
  useEffect(() => {
    const root = document.documentElement;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        root.classList.add('tab-hidden');
      } else {
        root.classList.remove('tab-hidden');
      }
    };

    if (document.hidden) {
      root.classList.add('tab-hidden');
    } else {
      root.classList.remove('tab-hidden');
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      root.classList.remove('tab-hidden');
    };
  }, []);
}

/**
 * Advanced version with specific animation selectors
 */
interface UseAnimationPauseOptions {
  animationSelectors?: string[];
  debug?: boolean;
}

export function useAnimationPauseAdvanced(
  options: UseAnimationPauseOptions = {}
) {
  const {
    animationSelectors = [
      '.constellation-edge',
      '.constellation-node',
      '.blob',
      '.edge-dash-animate',
      '.conflict-pulse',
      '.conflict-wiggle-continuous',
    ],
    debug = false,
  } = options;

  useEffect(() => {
    const handleVisibilityChange = () => {
      animationSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const htmlEl = el as HTMLElement;
          if (document.hidden) {
            htmlEl.style.animationPlayState = 'paused';
            if (debug) console.log('Paused:', selector);
          } else {
            htmlEl.style.animationPlayState = 'running';
            if (debug) console.log('Resumed:', selector);
          }
        });
      });
    };

    if (document.hidden) {
      animationSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          (el as HTMLElement).style.animationPlayState = 'paused';
        });
      });
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [animationSelectors, debug]);
}
