/**
 * useOutputFullscreen Hook
 * Manages fullscreen state specifically for the output panel component
 * @returns {object} Output panel fullscreen state and control functions
 */

import { useState, useCallback, useEffect } from 'react';

export const useOutputFullscreen = () => {
  const [isOutputFullscreen, setIsOutputFullscreen] = useState(false);

  const enterOutputFullscreen = useCallback(() => {
    setIsOutputFullscreen(true);
    // Prevent body scrolling when output is fullscreen
    document.body.style.overflow = 'hidden';
  }, []);

  const exitOutputFullscreen = useCallback(() => {
    setIsOutputFullscreen(false);
    // Restore body scrolling
    document.body.style.overflow = '';
  }, []);

  const toggleOutputFullscreen = useCallback(() => {
    if (isOutputFullscreen) {
      exitOutputFullscreen();
    } else {
      enterOutputFullscreen();
    }
  }, [isOutputFullscreen, enterOutputFullscreen, exitOutputFullscreen]);

  // Listen for Escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOutputFullscreen) {
        exitOutputFullscreen();
      }
    };

    if (isOutputFullscreen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOutputFullscreen, exitOutputFullscreen]);

  return {
    isOutputFullscreen,
    toggleOutputFullscreen,
    enterOutputFullscreen,
    exitOutputFullscreen,
  };
};

export default useOutputFullscreen;
