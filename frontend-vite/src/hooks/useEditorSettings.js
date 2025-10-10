/**
 * useEditorSettings Hook
 * Manages editor-specific settings (font size, theme)
 * @returns {object} Editor settings and control functions
 */

import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { 
  FONT_SIZE, 
  EDITOR_THEMES, 
  STORAGE_KEYS 
} from '../constants/app.constants';

export const useEditorSettings = () => {
  const [fontSize, setFontSize] = useLocalStorage(
    STORAGE_KEYS.EDITOR_FONT_SIZE,
    FONT_SIZE.DEFAULT
  );

  const [theme, setTheme] = useLocalStorage(
    STORAGE_KEYS.EDITOR_THEME,
    EDITOR_THEMES.DARK
  );

  const increaseFontSize = useCallback(() => {
    setFontSize(prev => {
      const current = parseInt(prev) || FONT_SIZE.DEFAULT;
      return Math.min(current + FONT_SIZE.STEP, FONT_SIZE.MAX).toString();
    });
  }, [setFontSize]);

  const decreaseFontSize = useCallback(() => {
    setFontSize(prev => {
      const current = parseInt(prev) || FONT_SIZE.DEFAULT;
      return Math.max(current - FONT_SIZE.STEP, FONT_SIZE.MIN).toString();
    });
  }, [setFontSize]);

  const cycleTheme = useCallback(() => {
    const themes = Object.values(EDITOR_THEMES);
    setTheme(prev => {
      const currentIndex = themes.indexOf(prev);
      return themes[(currentIndex + 1) % themes.length];
    });
  }, [setTheme]);

  return {
    fontSize: parseInt(fontSize) || FONT_SIZE.DEFAULT,
    setFontSize,
    increaseFontSize,
    decreaseFontSize,
    theme,
    setTheme,
    cycleTheme,
  };
};

export default useEditorSettings;
