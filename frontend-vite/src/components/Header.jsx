import { Play, Eraser, RotateCcw, Github, Sun, Moon, Columns, Rows, Maximize2, Maximize, Minimize } from 'lucide-react'
import './Header.css'

const Header = ({ 
  onRun, 
  onClear, 
  onReset, 
  isRunning, 
  theme, 
  onToggleTheme,
  layout,
  onToggleLayout,
  onResetSplit,
  isFullscreen,
  onToggleFullscreen
}) => {
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
          <p className="subtitle">Write, Run & Debug Ballerina Code Online • Ballerina 2201.12.2 (Swan Lake Update 12)</p>
        </div>
      </div>
      
      <div className="header-right">
        <button 
          className="btn btn-primary" 
          onClick={onRun}
          disabled={isRunning}
        >
          {isRunning ? (
            <>
              <div className="spinner"></div>
              Running...
            </>
          ) : (
            <>
              <Play size={18} />
              Run Code
            </>
          )}
        </button>
        
        <button className="btn btn-secondary" onClick={onReset}>
          <RotateCcw size={18} />
          Reset
        </button>
        
        <button className="btn btn-secondary" onClick={onClear}>
          <Eraser size={18} />
          Clear
        </button>

        {/* Layout Controls */}
        <div className="header-divider"></div>
        
        <button 
          className={`btn btn-secondary ${layout === 'horizontal' ? 'active' : ''}`}
          onClick={onToggleLayout}
          title={`Switch to ${layout === 'horizontal' ? 'vertical' : 'horizontal'} layout`}
        >
          {layout === 'horizontal' ? (
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
        >
          <Maximize2 size={18} />
          <span className="btn-text">Reset Split</span>
        </button>
        
        <div className="header-divider"></div>

        <button 
          className="btn btn-secondary" 
          onClick={onToggleFullscreen}
          title={isFullscreen ? "Exit fullscreen (Esc)" : "Enter fullscreen (F11)"}
        >
          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          <span className="btn-text">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
        </button>
        
        <div className="header-divider"></div>

        <button 
          className="btn btn-icon" 
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        
        <a 
          href="https://github.com/PramithaMJ/ballerina-online-playground" 
          target="_blank" 
          rel="noopener noreferrer"
          className="btn btn-icon"
          title="View on GitHub"
        >
          <Github size={20} />
        </a>
      </div>
    </header>
  )
}

export default Header
