/**
 * Header Component
 * Application header with controls
 * @component
 */

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
  BookOpen
} from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
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
  onOpenUserGuide
}) => {
  const isHorizontal = layout === 'horizontal';
  const isDark = theme === 'dark';

  return (
    <header className="header">
      <div className="header-left">
        <img 
          src="https://ballerina.io/img/branding/ballerina_logo_dgrey_svg.svg" 
          alt="Ballerina Logo" 
          className="logo"
        />
        <div className="title-section">
          <h1>Ballerina Playground</h1>
          <p className="subtitle">Write, Run & Debug Ballerina Code Online</p>
        </div>
      </div>
      
      <div className="header-right">
        {/* Primary Actions */}
        {isRunning ? (
          <div className="execution-container">
            <button 
              className="btn btn-stop" 
              onClick={onStop}
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
          <button 
            className="btn btn-primary" 
            onClick={onRun}
            disabled={isRunning}
            aria-label="Run code"
          >
            <Play size={18} />
            Run Code
          </button>
        )}
        
        <button 
          className="btn btn-secondary" 
          onClick={onReset}
          aria-label="Reset code"
        >
          <RotateCcw size={18} />
          Reset
        </button>
        
        <button 
          className="btn btn-secondary" 
          onClick={onClear}
          aria-label="Clear code"
        >
          <Eraser size={18} />
          Clear
        </button>

        {/* Layout Controls */}
        <div className="header-divider" role="separator"></div>
        
        <button 
          className={`btn btn-secondary ${isHorizontal ? 'active' : ''}`}
          onClick={onToggleLayout}
          title={`Switch to ${isHorizontal ? 'vertical' : 'horizontal'} layout`}
          aria-label={`Switch to ${isHorizontal ? 'vertical' : 'horizontal'} layout`}
        >
          {isHorizontal ? (
            <>
              <Columns size={18} />
              <span className="btn-text">Horizontal</span>
            </>
          ) : (
            <>
              <Rows size={18} />
              <span className="btn-text">Vertical</span>
            </>
          )}
        </button>

        <button 
          className="btn btn-secondary" 
          onClick={onResetSplit}
          title="Reset panel split to 50-50"
          aria-label="Reset panel split"
        >
          <Maximize2 size={18} />
          <span className="btn-text">Reset Split</span>
        </button>
        
        <div className="header-divider" role="separator"></div>

        {/* Fullscreen Control */}
        <button 
          className="btn btn-secondary" 
          onClick={onToggleFullscreen}
          title={isFullscreen ? "Exit fullscreen (Esc)" : "Enter fullscreen (F11)"}
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          <span className="btn-text">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
        </button>
        
        <div className="header-divider" role="separator"></div>

        {/* Theme and External Links */}
        <button 
          className="btn btn-icon" 
          onClick={onOpenUserGuide}
          title="User Guide & Documentation"
          aria-label="Open user guide"
        >
          <BookOpen size={20} />
        </button>

        <button 
          className="btn btn-icon" 
          onClick={onToggleTheme}
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
        >
          <Github size={20} />
        </a>
      </div>
    </header>
  );
};

export default Header;
