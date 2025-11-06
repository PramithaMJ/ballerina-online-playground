/**
 * OutputPanel Component
 * Displays code execution output and errors
 * @component
 */

import { Terminal, Info, AlertCircle, Maximize2, Minimize2, Sparkles } from 'lucide-react';
import OutputStatus from './OutputStatus';
import EmptyState from './EmptyState';
import { useOutputFullscreen } from '../hooks';
import './OutputPanel.css';

/**
 * @param {Object} props
 * @param {string} props.output - Standard output
 * @param {string} props.error - Error output
 * @param {boolean} props.isRunning - Whether code is currently executing
 * @param {number} props.progress - Execution progress (0-100)
 * @param {Function} props.onSwitchToAI - Switch to AI Assistant handler
 */
const OutputPanel = ({ output, error, isRunning, progress, onSwitchToAI }) => {
  const hasContent = output || error;
  const isSuccess = output && !error;
  const isError = !!error;
  
  const {
    isOutputFullscreen,
    toggleOutputFullscreen,
  } = useOutputFullscreen();

  return (
    <div className={`output-container ${isOutputFullscreen ? 'output-fullscreen' : ''}`}>
      <div className="panel-header">
        <div className="panel-title">
          <Terminal size={18} />
          <span>Output Console</span>
        </div>
        
        <div className="output-header-controls">
          {onSwitchToAI && (
            <button 
              className="switch-ai-btn" 
              onClick={onSwitchToAI}
              title="Switch to AI Assistant"
              aria-label="Switch to AI Assistant"
            >
              <Sparkles size={16} />
              <span>AI Assistant</span>
            </button>
          )}
          
          {hasContent && !isRunning && (
            <div className="output-status">
              <OutputStatus isSuccess={isSuccess} isError={isError} />
            </div>
          )}
          
          <button 
            className="control-btn" 
            onClick={toggleOutputFullscreen}
            title={isOutputFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            aria-label={isOutputFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isOutputFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>
      
      {/* Progress Bar */}
      {isRunning && progress > 0 && (
        <div className="execution-progress">
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${progress}%` }}
            >
              <span className="progress-text">{progress}%</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="output-wrapper">
        {!hasContent ? (
          <EmptyState
            icon={Info}
            title="No output yet"
            subtitle="Run your code to see the output here"
          />
        ) : (
          <div className="output-content">
            {error && (
              <div className="output-section error-section">
                <div className="section-header">
                  <AlertCircle size={16} />
                  <span>Error</span>
                </div>
                <pre className="output-text error-text">{error}</pre>
              </div>
            )}
            
            {output && (
              <div className="output-section output-section-standard">
                <div className="section-header">
                  <Terminal size={16} />
                  <span>Output</span>
                </div>
                <pre className="output-text">{output}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OutputPanel;
