/**
 * EditorToolbar Component
 * Displays editor controls and information
 * @component
 */

import { ZoomIn, ZoomOut, Sun, Moon, Settings } from 'lucide-react';

/**
 * @param {Object} props
 * @param {number} props.lineCount - Number of lines in the editor
 * @param {number} props.fontSize - Current font size
 * @param {string} props.theme - Current theme name
 * @param {Function} props.onIncreaseFontSize - Font size increase handler
 * @param {Function} props.onDecreaseFontSize - Font size decrease handler
 * @param {Function} props.onCycleTheme - Theme cycle handler
 * @param {boolean} props.showSettings - Settings panel visibility
 * @param {Function} props.onToggleSettings - Settings toggle handler
 */
const EditorToolbar = ({
  lineCount,
  fontSize,
  theme,
  onIncreaseFontSize,
  onDecreaseFontSize,
  onCycleTheme,
  showSettings,
  onToggleSettings,
}) => {
  const isLightTheme = theme.includes('light') || theme.includes('github');

  return (
    <div className="editor-controls">
      <button 
        className="control-btn" 
        onClick={onDecreaseFontSize}
        title="Decrease font size"
        aria-label="Decrease font size"
      >
        <ZoomOut size={16} />
      </button>
      
      <span className="font-size-display">{fontSize}px</span>
      
      <button 
        className="control-btn" 
        onClick={onIncreaseFontSize}
        title="Increase font size"
        aria-label="Increase font size"
      >
        <ZoomIn size={16} />
      </button>
      
      <button 
        className="control-btn" 
        onClick={onCycleTheme}
        title={`Current theme: ${theme.replace('ballerina-', '')}`}
        aria-label="Cycle editor theme"
      >
        {isLightTheme ? <Sun size={16} /> : <Moon size={16} />}
      </button>
      
      <button 
        className="control-btn" 
        onClick={onToggleSettings}
        title="Editor settings"
        aria-label="Toggle settings panel"
      >
        <Settings size={16} />
      </button>
    </div>
  );
};

export default EditorToolbar;
