/**
 * useCodeEditorFullscreen Hook
 * Manages fullscreen state specifically for the code editor component
 * @returns {object} Code editor fullscreen state and control functions
 */

import { useState, useCallback, useEffect } from 'react';

export const useCodeEditorFullscreen = () => {
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);

  const enterEditorFullscreen = useCallback(() => {
    setIsEditorFullscreen(true);
    // Prevent body scrolling when editor is fullscreen
    document.body.style.overflow = 'hidden';
  }, []);

  const exitEditorFullscreen = useCallback(() => {
    setIsEditorFullscreen(false);
    // Restore body scrolling
    document.body.style.overflow = '';
  }, []);

  const toggleEditorFullscreen = useCallback(() => {
    if (isEditorFullscreen) {
      exitEditorFullscreen();
    } else {
      enterEditorFullscreen();
    }
  }, [isEditorFullscreen, enterEditorFullscreen, exitEditorFullscreen]);

  // Listen for Escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isEditorFullscreen) {
        exitEditorFullscreen();
      }
    };

    if (isEditorFullscreen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isEditorFullscreen, exitEditorFullscreen]);

  return {
    isEditorFullscreen,
    toggleEditorFullscreen,
    enterEditorFullscreen,
    exitEditorFullscreen,
  };
};

export default useCodeEditorFullscreen;
