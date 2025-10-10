/**
 * App Component (Refactored)
 * Main application component
 * Following SOLID principles and clean architecture
 * @component
 */

import { useState, useRef } from 'react';
import Header from './components/Header';
import CodeEditor from './components/CodeEditor';
import OutputPanel from './components/OutputPanel';
import ResizablePanels from './components/ResizablePanels';
import { useTheme, useFullscreen, useCodeExecution } from './hooks';
import { DEFAULT_SAMPLE_CODE } from './constants/app.constants';
import './App.css';

/**
 * Main Application Component
 * Orchestrates the overall application behavior
 */
function App() {
  // State management
  const [code, setCode] = useState(DEFAULT_SAMPLE_CODE);
  const resizablePanelsRef = useRef(null);

  // Custom hooks for feature management
  const { theme, toggleTheme } = useTheme();
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const { output, error, isRunning, executeCode, clearOutput } = useCodeExecution();

  // Handler functions
  const handleRun = async () => {
    await executeCode(code);
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
        onClear={handleClear}
        onReset={handleReset}
        isRunning={isRunning}
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
    </div>
  );
}

export default App;
