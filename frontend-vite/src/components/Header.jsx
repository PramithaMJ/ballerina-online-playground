/**
 * Header Component
 * Application header with controls
 * @component
 */

import { useState } from 'react';
import { 
  Play, 
  Square,
  Eraser, 
  RotateCcw, 
  Github, 
  Sun, 
  Moon, 
  Columns, 
  Rows, 
  Maximize2, 
  Maximize, 
  Minimize,
  BookOpen,
  Bug,
  Sparkles,
  Menu,
  X
} from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import VersionSelector from './VersionSelector';
import './Header.css';

/**
 * @param {Object} props
 * @param {Function} props.onRun - Run code handler
 * @param {Function} props.onStop - Stop execution handler
 * @param {Function} props.onClear - Clear code handler
 * @param {Function} props.onReset - Reset code handler
 * @param {boolean} props.isRunning - Running state
 * @param {number} props.progress - Execution progress (0-100)
 * @param {string} props.elapsedTime - Formatted elapsed time
 * @param {string} props.theme - Current theme
 * @param {Function} props.onToggleTheme - Theme toggle handler
 * @param {string} props.layout - Current layout
 * @param {Function} props.onToggleLayout - Layout toggle handler
 * @param {Function} props.onResetSplit - Reset split handler
 * @param {boolean} props.isFullscreen - Fullscreen state
 * @param {Function} props.onToggleFullscreen - Fullscreen toggle handler
 * @param {Function} props.onOpenUserGuide - User guide handler
 * @param {string} props.ballerinaVersion - Selected Ballerina version
 * @param {Function} props.onVersionChange - Version change handler
 * @param {Function} props.onDebug - Debug handler
 * @param {boolean} props.isDebugging - Debugging state
 * @param {boolean} props.isInitializing - Debug initializing state
 * @param {Function} props.onStopDebug - Stop debug handler
 * @param {boolean} props.showAIChat - AI chat visibility state
 * @param {Function} props.onToggleAIChat - AI chat toggle handler
 */
const Header = ({ 
  onRun, 
  onStop,
  onClear, 
  onReset, 
  isRunning,
  progress = 0,
  elapsedTime = '0s',
  theme, 
  onToggleTheme,
  layout,
  onToggleLayout,
  onResetSplit,
  isFullscreen,
  onToggleFullscreen,
  onOpenUserGuide,
  ballerinaVersion = '2201.12.0',
  onVersionChange,
  onDebug,
  isDebugging = false,
  isInitializing = false,
  onStopDebug,
  showAIChat = false,
  onToggleAIChat
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isHorizontal = layout === 'horizontal';
  const isDark = theme === 'dark';

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="header">
      <div className="header-left">
        {/* Full logo for desktop */}
        <img 
          src="https://ballerina.io/img/branding/ballerina_logo_dgrey_svg.svg" 
          alt="Ballerina Logo" 
          className="logo logo-full"
        />
        {/* Icon logo for mobile */}
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 128 128" 
          className="logo logo-icon"
          aria-label="Ballerina Logo"
        >
          <path fill="#46C0BC" d="M29 35.9255V0H59.0817V47.4297L29 35.9255ZM29 62.9204L49.5892 55.0465L29 47.1725V62.9204ZM29 74.1674V128H44.4579L59.0817 80.0637V62.6632L29 74.1674ZM99.5874 35.9255V0H69.5057V47.4297L99.5874 35.9255ZM99.5874 47.1725L78.9982 55.0465L99.5874 62.9204V47.1725ZM69.5057 62.6632V80.0637L84.1295 128H99.5874V74.1674L69.5057 62.6632Z"/>
        </svg>
        <div className="title-section">
          <h1>Ballerina Playground</h1>
          <p className="subtitle">Write, Run & Debug Ballerina Code Online</p>
        </div>
      </div>

      {/* Mobile Menu Toggle */}
      <button 
        className="mobile-menu-toggle"
        onClick={toggleMobileMenu}
        aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      
      <div className={`header-right ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}>
        {/* Version Selector */}
        <div className="control-group">
          <VersionSelector
            selectedVersion={ballerinaVersion}
            onVersionChange={onVersionChange}
            disabled={isRunning}
          />
        </div>

        {/* Primary Actions */}
        <div className="control-group primary-actions">
        {isDebugging ? (
          <button 
            className="btn btn-stop" 
            onClick={() => { onStopDebug(); closeMobileMenu(); }}
            aria-label="Stop debugging"
            title="Stop debugging"
          >
            <Square size={18} />
            <span>Stop Debug</span>
          </button>
        ) : isRunning ? (
          <div className="execution-container">
            <button 
              className="btn btn-stop" 
              onClick={() => { onStop(); closeMobileMenu(); }}
              aria-label="Stop execution"
              title="Stop execution (Ctrl+Shift+Q)"
            >
              <Square size={18} />
              <span>Stop</span>
              <span className="keyboard-hint">Ctrl+Shift+Q</span>
            </button>
            
            {/* Progress Bar */}
            <div className="execution-progress">
              <div className="progress-bar-container">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="progress-text">{progress}%</span>
            </div>
            
            {/* Elapsed Time */}
            <div className="execution-time">
              <span className="time-label">Running:</span>
              <span className="time-value">{elapsedTime}</span>
            </div>
          </div>
        ) : (
          <>
            <button 
              className="btn btn-debug" 
              onClick={() => { onDebug(); closeMobileMenu(); }}
              disabled={isRunning || isInitializing}
              aria-label="Debug code"
              title="Start debugging with breakpoints"
            >
              <Bug size={18} />
              {isInitializing ? 'Starting...' : 'Debug'}
            </button>
            <button 
              className="btn btn-primary" 
              onClick={() => { onRun(); closeMobileMenu(); }}
              disabled={isRunning}
              aria-label="Run code"
            >
              <Play size={18} />
              Run Code
            </button>
          </>
        )}
        </div>

        <div className="control-group secondary-actions">
        <button 
          className="btn btn-secondary" 
          onClick={() => { onReset(); closeMobileMenu(); }}
          aria-label="Reset code"
        >
          <RotateCcw size={18} />
          Reset
        </button>
        
        <button 
          className="btn btn-secondary" 
          onClick={() => { onClear(); closeMobileMenu(); }}
          aria-label="Clear code"
        >
          <Eraser size={18} />
          Clear
        </button>
        </div>

        {/* Layout Controls */}
        <div className="control-group layout-controls">
        <button 
          className={`btn btn-secondary ${isHorizontal ? 'active' : ''}`}
          onClick={() => { onToggleLayout(); closeMobileMenu(); }}
          title={`Switch to ${isHorizontal ? 'vertical' : 'horizontal'} layout`}
          aria-label={`Switch to ${isHorizontal ? 'vertical' : 'horizontal'} layout`}
        >
          {isHorizontal ? (
            <>
              <Rows size={18} />
              <span className="btn-text">Horizontal</span>
            </>
          ) : (
            <>
              <Columns size={18} />
              <span className="btn-text">Vertical</span>
            </>
          )}
        </button>

        <button 
          className="btn btn-secondary" 
          onClick={() => { onResetSplit(); closeMobileMenu(); }}
          title="Reset panel split to 50-50"
          aria-label="Reset panel split"
        >
          <Maximize2 size={18} />
          <span className="btn-text">Reset Split</span>
        </button>
        </div>

        {/* Fullscreen Control */}
        <div className="control-group">
        <button 
          className="btn btn-secondary" 
          onClick={() => { onToggleFullscreen(); closeMobileMenu(); }}
          title={isFullscreen ? "Exit fullscreen (Esc)" : "Enter fullscreen (F11)"}
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          <span className="btn-text">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
        </button>
        </div>

        {/* Theme and External Links */}
        <div className="control-group utility-controls">
        <button 
          className={`btn btn-icon ${showAIChat ? 'active' : ''}`}
          onClick={() => { onToggleAIChat(); closeMobileMenu(); }}
          title={showAIChat ? "Close AI Assistant" : "Open AI Assistant"}
          aria-label={showAIChat ? "Close AI Assistant" : "Open AI Assistant"}
        >
          <Sparkles size={20} />
        </button>

        <button 
          className="btn btn-icon" 
          onClick={() => { onOpenUserGuide(); closeMobileMenu(); }}
          title="User Guide & Documentation"
          aria-label="Open user guide"
        >
          <BookOpen size={20} />
        </button>

        <button 
          className="btn btn-icon" 
          onClick={() => { onToggleTheme(); closeMobileMenu(); }}
          title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        
        <a 
          href="https://github.com/PramithaMJ" 
          target="_blank" 
          rel="noopener noreferrer"
          className="btn btn-icon"
          title="View on GitHub"
          aria-label="View on GitHub"
          onClick={closeMobileMenu}
        >
          <Github size={20} />
        </a>
        </div>
      </div>
    </header>
  );
};

export default Header;
