/**
 * CodeEditor Component
 * Monaco-based code editor with Ballerina support and debugging
 * @component
 */

import { useState, useEffect, useLayoutEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Code2 } from 'lucide-react';
import EditorToolbar from './EditorToolbar';
import EditorSettings from './EditorSettings';
import LoadingSpinner from './LoadingSpinner';
import { useEditorSettings, useCodeEditorFullscreen } from '../hooks';
import { setupMonacoEditor } from '../utils/monaco-setup.util';
import { EDITOR_OPTIONS } from '../constants/app.constants';
import './CodeEditor.css';

/**
 * @param {Object} props
 * @param {string} props.code - Current code value
 * @param {Function} props.onChange - Code change handler
 * @param {Function} props.onEditorMount - Editor mount callback
 */
const CodeEditor = ({ code, onChange, onEditorMount }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [editorRef, setEditorRef] = useState(null);
  const [monacoRef, setMonacoRef] = useState(null);
  
  const {
    fontSize,
    setFontSize,
    increaseFontSize,
    decreaseFontSize,
    theme,
    setTheme,
    cycleTheme,
  } = useEditorSettings();

  const {
    isEditorFullscreen,
    toggleEditorFullscreen,
  } = useCodeEditorFullscreen();

  // Handle before mount - configure Monaco before initialization
  const handleEditorWillMount = (monaco) => {
    setMonacoRef(monaco);
  };

  // Update editor font size when it changes
  useEffect(() => {
    if (editorRef) {
      editorRef.updateOptions({ fontSize });
    }
  }, [fontSize, editorRef]);

  // Scroll to top when code changes or on mount
  useEffect(() => {
    if (editorRef) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        if (editorRef) {
          editorRef.setScrollPosition({ scrollTop: 0, scrollLeft: 0 });
          editorRef.revealLineInCenter(1);
          // Also set cursor to start
          editorRef.setPosition({ lineNumber: 1, column: 1 });
        }
      });
    }
  }, [editorRef]); // Only on editor mount

  // Scroll to top when code content changes significantly
  useEffect(() => {
    if (editorRef && code) {
      const lineCount = code.split('\n').length;
      // Reset scroll position for new code
      setTimeout(() => {
        if (editorRef) {
          editorRef.setScrollPosition({ scrollTop: 0, scrollLeft: 0 });
          editorRef.revealLineInCenter(1);
        }
      }, 50);
    }
  }, [code?.substring(0, 100), editorRef]); // Track first 100 chars to detect significant changes

  // Use layout effect to ensure editor is scrolled to top before paint
  useLayoutEffect(() => {
    if (editorRef) {
      editorRef.setScrollPosition({ scrollTop: 0, scrollLeft: 0 });
      editorRef.revealLine(1);
    }
  }, [editorRef, isEditorFullscreen]); // Re-run when fullscreen changes

  // Handle editor mount
  const handleEditorDidMount = (editor, monaco) => {
    setIsLoading(false);
    setEditorRef(editor);
    setupMonacoEditor(editor, monaco, theme);
    
    // Aggressive scroll to top - use multiple methods
    const scrollToTop = () => {
      editor.setScrollPosition({ scrollTop: 0, scrollLeft: 0 });
      editor.setPosition({ lineNumber: 1, column: 1 });
      editor.revealLine(1, monaco.editor.ScrollType.Immediate);
      editor.focus();
    };
    
    // Execute immediately
    scrollToTop();
    
    // Execute after short delays to ensure it sticks
    setTimeout(scrollToTop, 50);
    setTimeout(scrollToTop, 150);
    setTimeout(scrollToTop, 300);
    setTimeout(scrollToTop, 500);
    
    // Call parent's onEditorMount if provided
    if (onEditorMount) {
      onEditorMount(editor, monaco);
    }
  };

  // Calculate line count
  const lineCount = code.split('\n').length;

  return (
    <div className={`editor-container ${isEditorFullscreen ? 'editor-fullscreen' : ''}`}>
      <div className="panel-header">
        <div className="panel-title">
          <Code2 size={18} />
          <span>Code Editor</span>
        </div>
        
        <div className="editor-info">
          <span className="language-badge">Ballerina</span>
          <span className="line-info">{lineCount} lines</span>
        </div>
        
        <EditorToolbar
          lineCount={lineCount}
          fontSize={fontSize}
          theme={theme}
          onIncreaseFontSize={increaseFontSize}
          onDecreaseFontSize={decreaseFontSize}
          onCycleTheme={cycleTheme}
          showSettings={showSettings}
          onToggleSettings={() => setShowSettings(!showSettings)}
          isEditorFullscreen={isEditorFullscreen}
          onToggleEditorFullscreen={toggleEditorFullscreen}
        />
      </div>
      
      {showSettings && (
        <EditorSettings
          theme={theme}
          fontSize={fontSize}
          onThemeChange={setTheme}
          onFontSizeChange={setFontSize}
        />
      )}
      
      <div className="editor-wrapper">
        {isLoading && <LoadingSpinner message="Loading editor..." />}
        
        <Editor
          height="100%"
          defaultLanguage="ballerina"
          value={code}
          onChange={onChange}
          beforeMount={handleEditorWillMount}
          onMount={handleEditorDidMount}
          theme={theme}
          options={{
            ...EDITOR_OPTIONS,
            fontSize,
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditor;
