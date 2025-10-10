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
import { useTheme, useFullscreen, useCodeExecution, useExecutionProgress } from './hooks';
import { DEFAULT_SAMPLE_CODE } from './constants/app.constants';
import './App.css';

/**
 * Main Application Component
 * Orchestrates the overall application behavior
 */
function App() {
  // State management
  const [code, setCode] = useState(DEFAULT_SAMPLE_CODE);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const resizablePanelsRef = useRef(null);

  // Custom hooks for feature management
  const { theme, toggleTheme } = useTheme();
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const { output, error, isRunning, executeCode, stopExecution, clearOutput } = useCodeExecution();
  const { elapsedTime, formattedTime, progress } = useExecutionProgress(isRunning);

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
  }, [isRunning, code]);

  // Handler functions
  const handleRun = async () => {
    await executeCode(code);
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
      />
      
      <ResizablePanels
        ref={resizablePanelsRef}
        leftPanel={<CodeEditor code={code} onChange={setCode} />}
        rightPanel={<OutputPanel output={output} error={error} />}
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
    </div>
  );
}

export default App;
