import { Play, Eraser, RotateCcw, Github } from 'lucide-react'
import './Header.css'

const Header = ({ onRun, onClear, onReset, isRunning }) => {
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
