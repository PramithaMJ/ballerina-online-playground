import { useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import { Code2, Settings, ZoomIn, ZoomOut, Sun, Moon, Palette } from 'lucide-react'
import './CodeEditor.css'

const CodeEditor = ({ code, onChange }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [fontSize, setFontSize] = useState(() => {
    return parseInt(localStorage.getItem('editorFontSize')) || 14
  })
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('editorTheme') || 'ballerina-dark'
  })
  const [showSettings, setShowSettings] = useState(false)
  const [editorRef, setEditorRef] = useState(null)

  
  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('editorFontSize', fontSize.toString())
  }, [fontSize])
  
  useEffect(() => {
    localStorage.setItem('editorTheme', theme)
    if (editorRef) {
      editorRef.updateOptions({ fontSize })
    }
  }, [theme, fontSize, editorRef])

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 2, 32))
  }

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, 10))
  }

  const cycleTheme = () => {
    const themes = ['ballerina-dark', 'ballerina-light', 'ballerina-monokai', 'ballerina-github']
    const currentIndex = themes.indexOf(theme)
    const nextTheme = themes[(currentIndex + 1) % themes.length]
    setTheme(nextTheme)
  }

  const handleEditorDidMount = (editor, monaco) => {
    setIsLoading(false)
    setEditorRef(editor)
    
    // Register Ballerina language with syntax highlighting
    monaco.languages.register({ id: 'ballerina' })
    
    // Define Ballerina syntax highlighting
    monaco.languages.setMonarchTokensProvider('ballerina', {
      keywords: [
        'import', 'public', 'function', 'returns', 'return', 'if', 'else',
        'while', 'foreach', 'in', 'int', 'string', 'boolean', 'float', 'decimal',
        'json', 'xml', 'byte', 'any', 'var', 'const', 'final', 'type',
        'record', 'object', 'error', 'map', 'future', 'typedesc', 'handle',
        'stream', 'table', 'transaction', 'retry', 'match', 'check', 'checkpanic',
        'panic', 'trap', 'from', 'where', 'select', 'do', 'on', 'conflict',
        'limit', 'join', 'outer', 'equals', 'worker', 'fork', 'is', 'new',
        'service', 'resource', 'listener', 'client', 'remote', 'abstract',
        'distinct', 'isolated', 'transactional', 'enum', 'base16', 'base64',
        'continue', 'break', 'typeof', 'annotation', 'source', 'field',
        'parameter', 'class', 'module', 'xmlns', 'as', 'readonly', 'never', 'main'
      ],
      
      operators: [
        '=', '>', '<', '!', '~', '?', ':',
        '==', '<=', '>=', '!=', '&&', '||', '++', '--',
        '+', '-', '*', '/', '&', '|', '^', '%', '<<',
        '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=',
        '^=', '%=', '<<=', '>>=', '>>>='
      ],
      
      symbols: /[=><!~?:&|+\-*\/\^%]+/,
      
      tokenizer: {
        root: [
          // Keywords
          [/\b(import|public|function|returns|return|if|else|while|foreach|in|int|string|boolean|float|decimal|json|xml|byte|any|var|const|final|type|record|object|error|map|future|typedesc|handle|stream|table|transaction|retry|match|check|checkpanic|panic|trap|from|where|select|do|on|conflict|limit|join|outer|equals|worker|fork|is|new|service|resource|listener|client|remote|abstract|distinct|isolated|transactional|enum|base16|base64|continue|break|typeof|annotation|source|field|parameter|class|module|xmlns|as|readonly|never|main)\b/, 'keyword'],
          
          // Identifiers
          [/[a-zA-Z_]\w*/, 'identifier'],
          
          // Whitespace
          [/[ \t\r\n]+/, ''],
          
          // Comments
          [/\/\/.*$/, 'comment'],
          [/\/\*/, 'comment', '@comment'],
          
          // Strings
          [/"([^"\\]|\\.)*$/, 'string.invalid'],
          [/"/, 'string', '@string'],
          
          // Numbers
          [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
          [/0[xX][0-9a-fA-F]+/, 'number.hex'],
          [/\d+/, 'number'],
          
          // Delimiters
          [/[{}()\[\]]/, '@brackets'],
          [/[<>](?!@symbols)/, '@brackets'],
          [/@symbols/, {
            cases: {
              '@operators': 'delimiter',
              '@default': ''
            }
          }],
        ],
        
        comment: [
          [/[^\/*]+/, 'comment'],
          [/\*\//, 'comment', '@pop'],
          [/[\/*]/, 'comment']
        ],
        
        string: [
          [/[^\\"]+/, 'string'],
          [/\\./, 'string.escape'],
          [/"/, 'string', '@pop']
        ],
      },
    })
    
    // Define multiple themes with better visibility
    // Dark Theme (VS Code style)
    monaco.editor.defineTheme('ballerina-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: 'C586C0', fontStyle: 'bold' },  // Purple
        { token: 'identifier', foreground: '9CDCFE' },  // Light blue
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },  // Green
        { token: 'string', foreground: 'CE9178' },  // Orange
        { token: 'number', foreground: 'B5CEA8' },  // Light green
        { token: 'delimiter', foreground: 'D4D4D4' },  // Light gray
      ],
      colors: {
        'editor.background': '#1E1E1E',
        'editor.foreground': '#D4D4D4',
        'editorLineNumber.foreground': '#858585',
        'editorLineNumber.activeForeground': '#C6C6C6',
        'editor.selectionBackground': '#264F78',
        'editor.inactiveSelectionBackground': '#3A3D41',
      }
    })
    
    // Light Theme (VS Code light style)
    monaco.editor.defineTheme('ballerina-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: 'AF00DB', fontStyle: 'bold' },  // Purple
        { token: 'identifier', foreground: '001080' },  // Dark blue
        { token: 'comment', foreground: '008000', fontStyle: 'italic' },  // Green
        { token: 'string', foreground: 'A31515' },  // Red
        { token: 'number', foreground: '098658' },  // Dark green
        { token: 'delimiter', foreground: '000000' },  // Black
      ],
      colors: {
        'editor.background': '#FFFFFF',
        'editor.foreground': '#000000',
        'editorLineNumber.foreground': '#237893',
        'editorLineNumber.activeForeground': '#0B216F',
        'editor.selectionBackground': '#ADD6FF',
        'editor.inactiveSelectionBackground': '#E5EBF1',
      }
    })
    
    // Monokai Theme
    monaco.editor.defineTheme('ballerina-monokai', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: 'F92672', fontStyle: 'bold' },  // Pink
        { token: 'identifier', foreground: 'A6E22E' },  // Green
        { token: 'comment', foreground: '75715E', fontStyle: 'italic' },  // Gray
        { token: 'string', foreground: 'E6DB74' },  // Yellow
        { token: 'number', foreground: 'AE81FF' },  // Purple
        { token: 'delimiter', foreground: 'F8F8F2' },  // White
      ],
      colors: {
        'editor.background': '#272822',
        'editor.foreground': '#F8F8F2',
        'editorLineNumber.foreground': '#90908A',
        'editorLineNumber.activeForeground': '#C2C2BF',
        'editor.selectionBackground': '#49483E',
        'editor.inactiveSelectionBackground': '#3E3D32',
      }
    })
    
    // GitHub Theme
    monaco.editor.defineTheme('ballerina-github', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: 'D73A49', fontStyle: 'bold' },  // Red
        { token: 'identifier', foreground: '6F42C1' },  // Purple
        { token: 'comment', foreground: '6A737D', fontStyle: 'italic' },  // Gray
        { token: 'string', foreground: '032F62' },  // Dark blue
        { token: 'number', foreground: '005CC5' },  // Blue
        { token: 'delimiter', foreground: '24292E' },  // Dark
      ],
      colors: {
        'editor.background': '#F6F8FA',
        'editor.foreground': '#24292E',
        'editorLineNumber.foreground': '#1B1F234D',
        'editorLineNumber.activeForeground': '#24292E',
        'editor.selectionBackground': '#C8C8FA',
        'editor.inactiveSelectionBackground': '#E8E8FA',
      }
    })
    
    monaco.editor.setTheme(theme)
    
    // Register Ballerina validation (linting)
    const validateBallerina = (model) => {
      const code = model.getValue()
      const markers = []
      const lines = code.split('\n')
      
      lines.forEach((line, lineIndex) => {
        const lineNumber = lineIndex + 1
        const trimmedLine = line.trim()
        
        // Check for common syntax errors
        
        // 1. Missing semicolon at end of statement
        if (trimmedLine && 
            !trimmedLine.startsWith('//') && 
            !trimmedLine.startsWith('/*') &&
            !trimmedLine.endsWith('{') && 
            !trimmedLine.endsWith('}') && 
            !trimmedLine.endsWith(';') &&
            !trimmedLine.endsWith(',') &&
            trimmedLine !== '' &&
            !/^(import|public|function|if|else|while|foreach|return)/.test(trimmedLine) &&
            /^\s*[a-zA-Z_].*/.test(trimmedLine)) {
          
          // Check if it's a statement that needs semicolon
          if (trimmedLine.includes('=') || 
              trimmedLine.includes('println') || 
              trimmedLine.includes('print') ||
              /^(int|string|boolean|float|decimal|var|const)\s+\w+\s*=/.test(trimmedLine)) {
            markers.push({
              severity: monaco.MarkerSeverity.Error,
              startLineNumber: lineNumber,
              startColumn: line.length,
              endLineNumber: lineNumber,
              endColumn: line.length + 1,
              message: 'Missing semicolon ";" at end of statement'
            })
          }
        }
        
        // 2. Unclosed string
        const stringMatches = line.match(/"/g)
        if (stringMatches && stringMatches.length % 2 !== 0 && !trimmedLine.startsWith('//')) {
          markers.push({
            severity: monaco.MarkerSeverity.Error,
            startLineNumber: lineNumber,
            startColumn: line.lastIndexOf('"') + 1,
            endLineNumber: lineNumber,
            endColumn: line.length + 1,
            message: 'Unclosed string literal'
          })
        }
        
        // 3. Unclosed parentheses
        const openParens = (line.match(/\(/g) || []).length
        const closeParens = (line.match(/\)/g) || []).length
        if (openParens > closeParens && !trimmedLine.startsWith('//')) {
          markers.push({
            severity: monaco.MarkerSeverity.Error,
            startLineNumber: lineNumber,
            startColumn: line.lastIndexOf('(') + 1,
            endLineNumber: lineNumber,
            endColumn: line.lastIndexOf('(') + 2,
            message: 'Unclosed parenthesis "("'
          })
        } else if (closeParens > openParens && !trimmedLine.startsWith('//')) {
          markers.push({
            severity: monaco.MarkerSeverity.Error,
            startLineNumber: lineNumber,
            startColumn: line.lastIndexOf(')') + 1,
            endLineNumber: lineNumber,
            endColumn: line.lastIndexOf(')') + 2,
            message: 'Unexpected closing parenthesis ")"'
          })
        }
        
        // 4. Missing import statement
        if (lineNumber === 1 && !trimmedLine.startsWith('import') && trimmedLine !== '') {
          if (code.includes('io:println') || code.includes('io:print')) {
            markers.push({
              severity: monaco.MarkerSeverity.Warning,
              startLineNumber: 1,
              startColumn: 1,
              endLineNumber: 1,
              endColumn: 10,
              message: 'Missing import statement. Add: import ballerina/io;'
            })
          }
        }
        
        // 5. Invalid function declaration
        if (trimmedLine.includes('function') && !trimmedLine.includes('(')) {
          markers.push({
            severity: monaco.MarkerSeverity.Error,
            startLineNumber: lineNumber,
            startColumn: line.indexOf('function') + 1,
            endLineNumber: lineNumber,
            endColumn: line.length + 1,
            message: 'Function declaration must have parentheses "()"'
          })
        }
        
        // 6. Check for undefined variables/functions
        if (trimmedLine.includes('io:println') && !code.includes('import ballerina/io')) {
          markers.push({
            severity: monaco.MarkerSeverity.Error,
            startLineNumber: lineNumber,
            startColumn: line.indexOf('io:println') + 1,
            endLineNumber: lineNumber,
            endColumn: line.indexOf('io:println') + 3,
            message: 'Cannot resolve module "io". Add: import ballerina/io;'
          })
        }
        
        // 7. Check for common typos
        if (trimmedLine.includes('printlin') || trimmedLine.includes('pritln')) {
          const typo = trimmedLine.includes('printlin') ? 'printlin' : 'pritln'
          markers.push({
            severity: monaco.MarkerSeverity.Error,
            startLineNumber: lineNumber,
            startColumn: line.indexOf(typo) + 1,
            endLineNumber: lineNumber,
            endColumn: line.indexOf(typo) + typo.length + 1,
            message: `Unknown function "${typo}". Did you mean "println"?`
          })
        }
        
        // 8. Check for missing function body
        if (trimmedLine.includes('function') && trimmedLine.endsWith(')')) {
          const nextLine = lines[lineIndex + 1]
          if (nextLine && !nextLine.trim().startsWith('{')) {
            markers.push({
              severity: monaco.MarkerSeverity.Error,
              startLineNumber: lineNumber + 1,
              startColumn: 1,
              endLineNumber: lineNumber + 1,
              endColumn: 2,
              message: 'Function declaration must be followed by a block "{"'
            })
          }
        }
      })
      
      // Check for balanced braces
      const openBraces = (code.match(/{/g) || []).length
      const closeBraces = (code.match(/}/g) || []).length
      if (openBraces !== closeBraces) {
        markers.push({
          severity: monaco.MarkerSeverity.Error,
          startLineNumber: lines.length,
          startColumn: 1,
          endLineNumber: lines.length,
          endColumn: 2,
          message: openBraces > closeBraces ? 'Missing closing brace "}"' : 'Unexpected closing brace "}"'
        })
      }
      
      return markers
    }
    
    // Set up validation on model content change
    monaco.editor.onDidCreateModel((model) => {
      if (model.getLanguageId() === 'ballerina') {
        const validate = () => {
          const markers = validateBallerina(model)
          monaco.editor.setModelMarkers(model, 'ballerina', markers)
        }
        
        validate()
        model.onDidChangeContent(() => validate())
      }
    })
    
    // Validate existing models
    monaco.editor.getModels().forEach((model) => {
      if (model.getLanguageId() === 'ballerina') {
        const markers = validateBallerina(model)
        monaco.editor.setModelMarkers(model, 'ballerina', markers)
        
        model.onDidChangeContent(() => {
          const newMarkers = validateBallerina(model)
          monaco.editor.setModelMarkers(model, 'ballerina', newMarkers)
        })
      }
    })
  }

  return (
    <div className="editor-container">
      <div className="panel-header">
        <div className="panel-title">
          <Code2 size={18} />
          <span>Code Editor</span>
        </div>
        <div className="editor-info">
          <span className="language-badge">Ballerina</span>
          <span className="line-info">{code.split('\n').length} lines</span>
        </div>
        <div className="editor-controls">
          <button 
            className="control-btn" 
            onClick={decreaseFontSize}
            title="Decrease font size"
          >
            <ZoomOut size={16} />
          </button>
          <span className="font-size-display">{fontSize}px</span>
          <button 
            className="control-btn" 
            onClick={increaseFontSize}
            title="Increase font size"
          >
            <ZoomIn size={16} />
          </button>
          <button 
            className="control-btn" 
            onClick={cycleTheme}
            title={`Current theme: ${theme.replace('ballerina-', '')}`}
          >
            {theme.includes('light') || theme.includes('github') ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button 
            className="control-btn" 
            onClick={() => setShowSettings(!showSettings)}
            title="Editor settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>
      
      {showSettings && (
        <div className="settings-panel">
          <div className="settings-group">
            <label>Theme</label>
            <div className="theme-buttons">
              <button 
                className={`theme-btn ${theme === 'ballerina-dark' ? 'active' : ''}`}
                onClick={() => setTheme('ballerina-dark')}
              >
                <Moon size={14} /> Dark
              </button>
              <button 
                className={`theme-btn ${theme === 'ballerina-light' ? 'active' : ''}`}
                onClick={() => setTheme('ballerina-light')}
              >
                <Sun size={14} /> Light
              </button>
              <button 
                className={`theme-btn ${theme === 'ballerina-monokai' ? 'active' : ''}`}
                onClick={() => setTheme('ballerina-monokai')}
              >
                <Palette size={14} /> Monokai
              </button>
              <button 
                className={`theme-btn ${theme === 'ballerina-github' ? 'active' : ''}`}
                onClick={() => setTheme('ballerina-github')}
              >
                <Palette size={14} /> GitHub
              </button>
            </div>
          </div>
          <div className="settings-group">
            <label>Font Size: {fontSize}px</label>
            <input 
              type="range" 
              min="10" 
              max="32" 
              value={fontSize} 
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              className="font-size-slider"
            />
          </div>
        </div>
      )}
      
      <div className="editor-wrapper">
        {isLoading && (
          <div className="editor-loading">
            <div className="spinner-large"></div>
            <p>Loading editor...</p>
          </div>
        )}
        <Editor
          height="100%"
          defaultLanguage="ballerina"
          value={code}
          onChange={onChange}
          onMount={handleEditorDidMount}
          theme={theme}
          options={{
            minimap: { enabled: false },
            fontSize: fontSize,
            fontFamily: "'Fira Code', 'Cascadia Code', 'Courier New', monospace",
            fontLigatures: true,
            lineNumbers: 'on',
            roundedSelection: true,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            wordWrap: 'on',
            padding: { top: 16, bottom: 16 },
            suggestOnTriggerCharacters: false,
            quickSuggestions: false,
            glyphMargin: true,
            folding: true,
            renderValidationDecorations: 'on',
            hover: {
              enabled: true,
            },
            scrollbar: {
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
            },
          }}
        />
      </div>
    </div>
  )
}

export default CodeEditor
