/**
 * EditorToolbar Component
 * Displays editor controls and information
 * @component
 */

import { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Sun, Moon, Settings, Maximize2, Minimize2, MoreVertical } from 'lucide-react';

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
 * @param {boolean} props.isEditorFullscreen - Editor fullscreen state
 * @param {Function} props.onToggleEditorFullscreen - Editor fullscreen toggle handler
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
  isEditorFullscreen,
  onToggleEditorFullscreen,
}) => {
  const isLightTheme = theme.includes('light') || theme.includes('github');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const mobileMenuRef = useRef(null);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setShowMobileMenu(false);
      }
    };

    if (showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMobileMenu]);

  const handleMobileMenuToggle = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  const handleMobileAction = (action) => {
    action();
    setShowMobileMenu(false);
  };

  return (
    <div className="editor-controls">
      {/* Desktop controls - visible on larger screens */}
      <div className="desktop-controls">
        <button 
          className="control-btn" 
          onClick={onToggleEditorFullscreen}
          title={isEditorFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          aria-label={isEditorFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isEditorFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
        
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

      {/* Mobile menu button - visible on small screens */}
      <div className="mobile-controls" ref={mobileMenuRef}>
        <button 
          className="control-btn mobile-menu-btn" 
          onClick={handleMobileMenuToggle}
          title="More options"
          aria-label="More options"
        >
          <MoreVertical size={16} />
        </button>

        {/* Mobile dropdown menu */}
        {showMobileMenu && (
          <div className="mobile-menu-dropdown">
            <button 
              className="mobile-menu-item" 
              onClick={() => handleMobileAction(onToggleEditorFullscreen)}
            >
              {isEditorFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              <span>{isEditorFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
            </button>
            
            <div className="mobile-menu-divider" />
            
            <button 
              className="mobile-menu-item" 
              onClick={() => handleMobileAction(onDecreaseFontSize)}
            >
              <ZoomOut size={16} />
              <span>Decrease Font</span>
            </button>
            
            <div className="mobile-menu-font-display">
              <span>Font Size: {fontSize}px</span>
            </div>
            
            <button 
              className="mobile-menu-item" 
              onClick={() => handleMobileAction(onIncreaseFontSize)}
            >
              <ZoomIn size={16} />
              <span>Increase Font</span>
            </button>
            
            <div className="mobile-menu-divider" />
            
            <button 
              className="mobile-menu-item" 
              onClick={() => handleMobileAction(onCycleTheme)}
            >
              {isLightTheme ? <Sun size={16} /> : <Moon size={16} />}
              <span>Change Theme</span>
            </button>
            
            <div className="mobile-menu-divider" />
            
            <button 
              className="mobile-menu-item" 
              onClick={() => handleMobileAction(onToggleSettings)}
            >
              <Settings size={16} />
              <span>Settings</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorToolbar;
