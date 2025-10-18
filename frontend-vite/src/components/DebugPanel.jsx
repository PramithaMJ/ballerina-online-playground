/**
 * DebugPanel Component
 * Debug controls and information display
 */

import React, { useState, useEffect } from 'react';
import { Play, StepForward, StepInto, CornerDownLeft, Square, Bug } from 'lucide-react';
import { debugService } from '../services/debug.service';
import './DebugPanel.css';

const DebugPanel = ({ isDebugging, onStopDebugging }) => {
  const [variables, setVariables] = useState([]);
  const [callStack, setCallStack] = useState([]);
  const [currentLine, setCurrentLine] = useState(null);
  const [status, setStatus] = useState('ready');
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isDebugging) {
      // Register event listeners
      debugService.addListener('started', handleStarted);
      debugService.addListener('stopped', handleStopped);
      debugService.addListener('continued', handleContinued);
      debugService.addListener('completed', handleCompleted);
      debugService.addListener('variables', handleVariables);
      debugService.addListener('callStack', handleCallStack);
      debugService.addListener('stepped', handleStepped);
      debugService.addListener('error', handleError);
    }

    return () => {
      // Clean up listeners
      debugService.removeListener('started', handleStarted);
      debugService.removeListener('stopped', handleStopped);
      debugService.removeListener('continued', handleContinued);
      debugService.removeListener('completed', handleCompleted);
      debugService.removeListener('variables', handleVariables);
      debugService.removeListener('callStack', handleCallStack);
      debugService.removeListener('stepped', handleStepped);
      debugService.removeListener('error', handleError);
    };
  }, [isDebugging]);

  const handleStarted = (data) => {
    setStatus('running');
    setIsPaused(false);
  };

  const handleStopped = (data) => {
    setStatus('paused');
    setIsPaused(true);
    if (data.line) {
      setCurrentLine(data.line);
    }
  };

  const handleContinued = (data) => {
    setStatus('running');
    setIsPaused(false);
  };

  const handleCompleted = (data) => {
    setStatus('completed');
    setIsPaused(false);
    setCurrentLine(null);
  };

  const handleVariables = (data) => {
    setVariables(data.variables || []);
  };

  const handleCallStack = (data) => {
    setCallStack(data.frames || []);
  };

  const handleStepped = (data) => {
    setStatus('paused');
    setIsPaused(true);
  };

  const handleError = (data) => {
    console.error('Debug error:', data.error);
    setStatus('error');
  };

  const handleContinue = () => {
    debugService.continue();
  };

  const handleStepOver = () => {
    debugService.stepOver();
  };

  const handleStepInto = () => {
    debugService.stepInto();
  };

  const handleStepOut = () => {
    debugService.stepOut();
  };

  const handleStop = () => {
    debugService.stop();
    onStopDebugging();
  };

  return (
    <div className="debug-panel">
      <div className="debug-header">
        <div className="debug-title">
          <Bug size={18} />
          <span>Debug Session</span>
        </div>
        <div className="debug-status">
          <span className={`status-badge status-${status}`}>
            {status === 'running' && '▶ Running'}
            {status === 'paused' && '⏸ Paused'}
            {status === 'ready' && '⏹ Ready'}
            {status === 'completed' && '✓ Completed'}
            {status === 'error' && '✗ Error'}
          </span>
          {currentLine && (
            <span className="current-line">Line {currentLine}</span>
          )}
        </div>
      </div>

      <div className="debug-controls">
        <button
          onClick={handleContinue}
          disabled={!isPaused}
          className="debug-btn debug-btn-continue"
          title="Continue (F5)"
        >
          <Play size={16} />
          <span>Continue</span>
        </button>

        <button
          onClick={handleStepOver}
          disabled={!isPaused}
          className="debug-btn debug-btn-step"
          title="Step Over (F10)"
        >
          <StepForward size={16} />
          <span>Step Over</span>
        </button>

        <button
          onClick={handleStepInto}
          disabled={!isPaused}
          className="debug-btn debug-btn-step"
          title="Step Into (F11)"
        >
          <StepInto size={16} />
          <span>Step Into</span>
        </button>

        <button
          onClick={handleStepOut}
          disabled={!isPaused}
          className="debug-btn debug-btn-step"
          title="Step Out (Shift+F11)"
        >
          <CornerDownLeft size={16} />
          <span>Step Out</span>
        </button>

        <button
          onClick={handleStop}
          className="debug-btn debug-btn-stop"
          title="Stop Debugging (Shift+F5)"
        >
          <Square size={16} />
          <span>Stop</span>
        </button>
      </div>

      <div className="debug-info">
        <div className="debug-section">
          <h4 className="debug-section-title">Variables</h4>
          <div className="debug-section-content">
            {variables.length === 0 ? (
              <div className="debug-empty">No variables</div>
            ) : (
              <table className="variables-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Value</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {variables.map((v, index) => (
                    <tr key={index}>
                      <td className="var-name">{v.name}</td>
                      <td className="var-value">{v.value}</td>
                      <td className="var-type">{v.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="debug-section">
          <h4 className="debug-section-title">Call Stack</h4>
          <div className="debug-section-content">
            {callStack.length === 0 ? (
              <div className="debug-empty">No call stack</div>
            ) : (
              <ul className="call-stack-list">
                {callStack.map((frame, index) => (
                  <li
                    key={index}
                    className={`call-stack-item ${index === 0 ? 'active-frame' : ''}`}
                  >
                    <div className="frame-name">{frame.name}</div>
                    <div className="frame-location">
                      {frame.file && <span className="frame-file">{frame.file}</span>}
                      <span className="frame-line">:{frame.line}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;
