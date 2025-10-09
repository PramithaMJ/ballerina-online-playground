import { Terminal, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import './OutputPanel.css'

const OutputPanel = ({ output, error }) => {
  const hasContent = output || error
  const isSuccess = output && !error
  const isError = error

  return (
    <div className="output-container">
      <div className="panel-header">
        <div className="panel-title">
          <Terminal size={18} />
          <span>Output Console • Ballerina 2201.12.2 (Swan Lake Update 12)</span>
        </div>
        {hasContent && (
          <div className="output-status">
            {isSuccess && (
              <span className="status-badge status-success">
                <CheckCircle2 size={14} />
                Success
              </span>
            )}
            {isError && (
              <span className="status-badge status-error">
                <AlertCircle size={14} />
                Error
              </span>
            )}
          </div>
        )}
      </div>
      <div className="output-wrapper">
        {!hasContent ? (
          <div className="output-empty">
            <Info size={32} className="empty-icon" />
            <p className="empty-title">No output yet</p>
            <p className="empty-subtitle">Run your code to see the output here</p>
          </div>
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
  )
}

export default OutputPanel
