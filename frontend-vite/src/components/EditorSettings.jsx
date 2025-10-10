/**
 * EditorSettings Component
 * Settings panel for editor customization
 * @component
 */

import { Sun, Moon, Palette } from 'lucide-react';
import { FONT_SIZE, EDITOR_THEMES } from '../constants/app.constants';

/**
 * @param {Object} props
 * @param {string} props.theme - Current theme
 * @param {number} props.fontSize - Current font size
 * @param {Function} props.onThemeChange - Theme change handler
 * @param {Function} props.onFontSizeChange - Font size change handler
 */
const EditorSettings = ({ theme, fontSize, onThemeChange, onFontSizeChange }) => {
  const themeButtons = [
    { id: EDITOR_THEMES.DARK, label: 'Dark', icon: Moon },
    { id: EDITOR_THEMES.LIGHT, label: 'Light', icon: Sun },
    { id: EDITOR_THEMES.MONOKAI, label: 'Monokai', icon: Palette },
    { id: EDITOR_THEMES.GITHUB, label: 'GitHub', icon: Palette },
  ];

  return (
    <div className="settings-panel">
      <div className="settings-group">
        <label>Theme</label>
        <div className="theme-buttons">
          {themeButtons.map(({ id, label, icon: Icon }) => (
            <button 
              key={id}
              className={`theme-btn ${theme === id ? 'active' : ''}`}
              onClick={() => onThemeChange(id)}
              aria-label={`Switch to ${label} theme`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="settings-group">
        <label>Font Size: {fontSize}px</label>
        <input 
          type="range" 
          min={FONT_SIZE.MIN}
          max={FONT_SIZE.MAX}
          value={fontSize} 
          onChange={(e) => onFontSizeChange(e.target.value)}
          className="font-size-slider"
          aria-label="Font size slider"
        />
      </div>
    </div>
  );
};

export default EditorSettings;
