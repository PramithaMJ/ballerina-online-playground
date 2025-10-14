/**
 * App Component (Refactored)
 * Main application component
 * @component
 */

import { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import CodeEditor from './components/CodeEditor';
import OutputPanel from './components/OutputPanel';
import ResizablePanels from './components/ResizablePanels';
import ConfirmDialog from './components/ConfirmDialog';
import ErrorNotification from './components/ErrorNotification';
import UserGuide from './components/UserGuide';
import { TurnstileChallenge } from './components';
import { useTheme, useFullscreen, useCodeExecution, useExecutionProgress, useBallerinaVersion } from './hooks';
import { DEFAULT_SAMPLE_CODE } from './constants/app.constants';
import { isFirstVisit, markAsVisited } from './utils';
import { envConfig } from './config';
import './App.css';

/**
 * Main Application Component
 * Orchestrates the overall application behavior
 */
function App() {
  // Turnstile verification state
  const [isVerified, setIsVerified] = useState(!envConfig.enableVerification);
  const [turnstileToken, setTurnstileToken] = useState(null);

  // State management
  const [code, setCode] = useState(DEFAULT_SAMPLE_CODE);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const resizablePanelsRef = useRef(null);

  // Custom hooks for feature management
  const { theme, toggleTheme } = useTheme();
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const { output, error, isRunning, progress: executionProgress, executeCode, stopExecution, clearOutput } = useCodeExecution();
  const { elapsedTime, formattedTime, progress } = useExecutionProgress(isRunning);
  const { version: ballerinaVersion, changeVersion } = useBallerinaVersion();

  // Check for Turnstile verification on mount
  useEffect(() => {
    if (!envConfig.enableVerification) return;

    const verified = sessionStorage.getItem('turnstile_verified');
    const token = sessionStorage.getItem('turnstile_token');
    const timestamp = sessionStorage.getItem('turnstile_timestamp');
    const isTokenValid = timestamp && (Date.now() - parseInt(timestamp)) < 5 * 60 * 1000;
    
    if (verified === 'true' && token && isTokenValid) {
      setIsVerified(true);
      setTurnstileToken(token);
    }
  }, []);

  // Check for first visit and show User Guide
  useEffect(() => {
    if (isFirstVisit()) {
      // Show user guide after a small delay for better UX
      const timer = setTimeout(() => {
        setIsFirstTime(true);
        setShowUserGuide(true);
        markAsVisited();
      }, 800); // 800ms delay to let the page load smoothly

      return () => clearTimeout(timer);
    }
  }, []);

  // Keyboard shortcut handler (Ctrl+Shift+Q to stop)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Shift+Q to stop execution
      if (e.ctrlKey && e.shiftKey && e.key === 'Q' && isRunning) {
        e.preventDefault();
        setShowStopConfirm(true);
      }
      
      // Ctrl+Enter to run code
      if (e.ctrlKey && e.key === 'Enter' && !isRunning) {
        e.preventDefault();
        handleRun();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, code, ballerinaVersion]);

  // Handler functions
  const handleTurnstileVerified = (token) => {
    console.log(' App: Turnstile verification successful');
    setTurnstileToken(token);
    setIsVerified(true);
  };

  // Show Turnstile verification page if not verified
  if (!isVerified && envConfig.enableVerification) {
    return <TurnstileChallenge onVerified={handleTurnstileVerified} />;
  }

  // Handler functions
  const handleRun = async () => {
    try {
      setConnectionError(null);
      await executeCode(code, ballerinaVersion);
    } catch (err) {
      // Check if it's a connection error
      if (err.message && err.message.includes('connection')) {
        setConnectionError(err.message);
      }
    }
  };

  const handleRetryConnection = () => {
    setConnectionError(null);
    handleRun();
  };

  const handleCloseError = () => {
    setConnectionError(null);
  };

  const handleStop = () => {
    // Show confirmation dialog
    setShowStopConfirm(true);
  };

  const handleConfirmStop = () => {
    stopExecution();
    setShowStopConfirm(false);
  };

  const handleCancelStop = () => {
    setShowStopConfirm(false);
  };

  const handleClear = () => {
    setCode('');
    clearOutput();
  };

  const handleReset = () => {
    setCode(DEFAULT_SAMPLE_CODE);
    clearOutput();
  };

  const handleToggleLayout = () => {
    resizablePanelsRef.current?.toggleLayout();
  };

  const handleResetSplit = () => {
    resizablePanelsRef.current?.resetSplit();
  };

  const handleOpenUserGuide = () => {
    setIsFirstTime(false); // Manual open, not first time
    setShowUserGuide(true);
  };

  const handleCloseUserGuide = () => {
    setShowUserGuide(false);
    // Reset first time flag after closing
    setTimeout(() => setIsFirstTime(false), 300);
  };

  // Get current layout from ref
  const currentLayout = resizablePanelsRef.current?.layout || 'horizontal';

  return (
    <div className="app">
      <Header 
        onRun={handleRun}
        onStop={handleStop}
        onClear={handleClear}
        onReset={handleReset}
        isRunning={isRunning}
        progress={progress}
        elapsedTime={formattedTime}
        theme={theme}
        onToggleTheme={toggleTheme}
        layout={currentLayout}
        onToggleLayout={handleToggleLayout}
        onResetSplit={handleResetSplit}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onOpenUserGuide={handleOpenUserGuide}
        ballerinaVersion={ballerinaVersion}
        onVersionChange={changeVersion}
      />
      
      <ResizablePanels
        ref={resizablePanelsRef}
        leftPanel={<CodeEditor code={code} onChange={setCode} />}
        rightPanel={<OutputPanel output={output} error={error} isRunning={isRunning} progress={executionProgress} />}
      />

      {/* Stop Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showStopConfirm}
        title="Stop Execution?"
        message={`Code has been running for ${formattedTime}. Are you sure you want to stop it?`}
        confirmText="Yes, Stop"
        cancelText="No, Continue"
        onConfirm={handleConfirmStop}
        onCancel={handleCancelStop}
        type="danger"
      />

      {/* Backend Connection Error Notification */}
      {connectionError && (
        <ErrorNotification
          message={connectionError}
          onClose={handleCloseError}
          onRetry={handleRetryConnection}
        />
      )}

      {/* User Guide Modal */}
      <UserGuide
        isOpen={showUserGuide}
        onClose={handleCloseUserGuide}
        isFirstVisit={isFirstTime}
      />
    </div>
  );
}

export default App;
