/**
 * useFullscreen Hook
 * Manages fullscreen state and operations
 * @returns {object} Fullscreen state and control functions
 */

import { useState, useEffect, useCallback } from 'react';
import { fullscreenService } from '../services/fullscreen.service';

export const useFullscreen = () => {
  const [isFullscreen, setIsFullscreen] = useState(fullscreenService.isFullscreen());

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(fullscreenService.isFullscreen());
    };

    const cleanup = fullscreenService.addChangeListener(handleFullscreenChange);
    return cleanup;
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      await fullscreenService.toggle();
    } catch (err) {
      console.error('Failed to toggle fullscreen:', err);
    }
  }, []);

  const enterFullscreen = useCallback(async () => {
    try {
      await fullscreenService.enter();
    } catch (err) {
      console.error('Failed to enter fullscreen:', err);
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      await fullscreenService.exit();
    } catch (err) {
      console.error('Failed to exit fullscreen:', err);
    }
  }, []);

  // Listen for F11 and Escape keys
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'Escape' && isFullscreen) {
        exitFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, toggleFullscreen, exitFullscreen]);

  return {
    isFullscreen,
    toggleFullscreen,
    enterFullscreen,
    exitFullscreen,
  };
};

export default useFullscreen;
