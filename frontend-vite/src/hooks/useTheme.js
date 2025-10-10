/**
 * useTheme Hook
 * Manages application theme state
 * @returns {object} Theme state and control functions
 */

import { useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { THEMES, STORAGE_KEYS } from '../constants/app.constants';

export const useTheme = () => {
  const [theme, setTheme] = useLocalStorage(STORAGE_KEYS.APP_THEME, THEMES.DARK);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
    setTheme(newTheme);
  };

  const isDark = theme === THEMES.DARK;
  const isLight = theme === THEMES.LIGHT;

  return {
    theme,
    setTheme,
    toggleTheme,
    isDark,
    isLight,
  };
};

export default useTheme;
