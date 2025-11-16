/**
 * OutputPanel Component
 * Displays code execution output and errors
 * @component
 */

import { useState, useEffect, useRef } from 'react';
import { Terminal, Info, AlertCircle, Maximize2, Minimize2, Sparkles, ArrowUp, MoreVertical } from 'lucide-react';
import OutputStatus from './OutputStatus';
import EmptyState from './EmptyState';
import ErrorIllustration from './ErrorIllustration';
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
  const outputWrapperRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const mobileMenuRef = useRef(null);
  const headerRef = useRef(null);
  const [isNarrow, setIsNarrow] = useState(false);
  
  const {
    isOutputFullscreen,
    toggleOutputFullscreen,
  } = useOutputFullscreen();

  // Detect narrow panels using ResizeObserver
  useEffect(() => {
    if (!headerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        setIsNarrow(width < 600); // Show compact mode when panel is < 600px
      }
    });
    
    resizeObserver.observe(headerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

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

  // Scroll to top when new output arrives
  useEffect(() => {
    if (outputWrapperRef.current && hasContent && !isRunning) {
      // Scroll to top after content is rendered
      setTimeout(() => {
        if (outputWrapperRef.current) {
          outputWrapperRef.current.scrollTop = 0;
        }
      }, 100);
    }
  }, [output, error, hasContent, isRunning]);

  // Track scroll position to show/hide scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      if (outputWrapperRef.current) {
        setShowScrollTop(outputWrapperRef.current.scrollTop > 200);
      }
    };

    const wrapper = outputWrapperRef.current;
    if (wrapper) {
      wrapper.addEventListener('scroll', handleScroll);
      return () => wrapper.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    if (outputWrapperRef.current) {
      outputWrapperRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className={`output-container ${isOutputFullscreen ? 'output-fullscreen' : ''}`}>
      <div className="panel-header" ref={headerRef}>
        <div className="panel-title">
          <Terminal size={18} />
          <span className={isNarrow ? 'hide-on-narrow' : ''}>Output Console</span>
        </div>
        
        <div className="output-header-controls">
          {/* Desktop/Wide View - All buttons visible */}
          {!isNarrow && (
            <>
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
            </>
          )}

          {/* Narrow View - Compact buttons with menu */}
          {isNarrow && (
            <div className="narrow-controls" ref={mobileMenuRef}>
              {hasContent && !isRunning && (
                <div className="output-status-compact">
                  <OutputStatus isSuccess={isSuccess} isError={isError} />
                </div>
              )}
              
              <button 
                className="control-btn compact-menu-btn" 
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                title="More options"
                aria-label="More options"
              >
                <MoreVertical size={16} />
              </button>

              {showMobileMenu && (
                <div className="compact-dropdown-menu">
                  {onSwitchToAI && (
                    <button 
                      className="compact-menu-item" 
                      onClick={() => {
                        onSwitchToAI();
                        setShowMobileMenu(false);
                      }}
                    >
                      <Sparkles size={16} />
                      <span>AI Assistant</span>
                    </button>
                  )}
                  
                  <div className="compact-menu-divider" />
                  
                  <button 
                    className="compact-menu-item" 
                    onClick={() => {
                      toggleOutputFullscreen();
                      setShowMobileMenu(false);
                    }}
                  >
                    {isOutputFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    <span>{isOutputFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
                  </button>
                </div>
              )}
            </div>
          )}
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
      
      <div className="output-wrapper" ref={outputWrapperRef}>
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
                <ErrorIllustration 
                  title={error.includes('SECURITY_VALIDATION_ERROR:') ? 'Security Validation Error' : 'Compilation Error'}
                  message="Our swan got tangled in the code. Please try again!"
                />
                <div className="section-header">
                  <AlertCircle size={16} />
                  <span>Error Details</span>
                </div>
                <pre className="output-text error-text">
                  {error.includes('SECURITY_VALIDATION_ERROR:') 
                    ? error.replace('SECURITY_VALIDATION_ERROR: ', '').trim()
                    : error}
                </pre>
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
        
        {/* Scroll to top button */}
        {showScrollTop && (
          <button 
            className="scroll-to-top-btn" 
            onClick={scrollToTop}
            title="Scroll to top"
            aria-label="Scroll to top"
          >
            <ArrowUp size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

export default OutputPanel;
