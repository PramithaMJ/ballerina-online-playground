/**
 * OutputPanel Component
 * Displays code execution output and errors
 * Following SOLID principles and clean architecture
 * @component
 */

import { Terminal, Info, AlertCircle } from 'lucide-react';
import OutputStatus from './OutputStatus';
import EmptyState from './EmptyState';
import './OutputPanel.css';

/**
 * @param {Object} props
 * @param {string} props.output - Standard output
 * @param {string} props.error - Error output
 */
const OutputPanel = ({ output, error }) => {
  const hasContent = output || error;
  const isSuccess = output && !error;
  const isError = !!error;

  return (
    <div className="output-container">
      <div className="panel-header">
        <div className="panel-title">
          <Terminal size={18} />
          <span>Output Console</span>
        </div>
        
        {hasContent && (
          <div className="output-status">
            <OutputStatus isSuccess={isSuccess} isError={isError} />
          </div>
        )}
      </div>
      
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
