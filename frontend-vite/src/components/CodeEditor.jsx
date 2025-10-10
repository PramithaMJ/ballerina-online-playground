/**
 * CodeEditor Component
 * Monaco-based code editor with Ballerina support
 * Following SOLID principles and clean architecture
 * @component
 */

import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Code2 } from 'lucide-react';
import EditorToolbar from './EditorToolbar';
import EditorSettings from './EditorSettings';
import LoadingSpinner from './LoadingSpinner';
import { useEditorSettings } from '../hooks';
import { setupMonacoEditor } from '../utils/monaco-setup.util';
import { EDITOR_OPTIONS } from '../constants/app.constants';
import './CodeEditor.css';

/**
 * @param {Object} props
 * @param {string} props.code - Current code value
 * @param {Function} props.onChange - Code change handler
 */
const CodeEditor = ({ code, onChange }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [editorRef, setEditorRef] = useState(null);
  
  const {
    fontSize,
    setFontSize,
    increaseFontSize,
    decreaseFontSize,
    theme,
    setTheme,
    cycleTheme,
  } = useEditorSettings();

  // Update editor font size when it changes
  useEffect(() => {
    if (editorRef) {
      editorRef.updateOptions({ fontSize });
    }
  }, [fontSize, editorRef]);

  // Handle editor mount
  const handleEditorDidMount = (editor, monaco) => {
    setIsLoading(false);
    setEditorRef(editor);
    setupMonacoEditor(editor, monaco, theme);
  };

  // Calculate line count
  const lineCount = code.split('\n').length;

  return (
    <div className="editor-container">
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
