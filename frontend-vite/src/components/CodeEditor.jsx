import { useState } from 'react'
import Editor from '@monaco-editor/react'
import { Code2 } from 'lucide-react'
import './CodeEditor.css'

const CodeEditor = ({ code, onChange }) => {
  const [isLoading, setIsLoading] = useState(true)

  const handleEditorDidMount = (editor, monaco) => {
    setIsLoading(false)
    
    // Register Ballerina language with syntax highlighting but no validation
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
        'parameter', 'class', 'module', 'xmlns', 'as', 'readonly', 'never'
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
          [/\b(import|public|function|returns|return|if|else|while|foreach|in|int|string|boolean|float|decimal|json|xml|byte|any|var|const|final|type|record|object|error|map|future|typedesc|handle|stream|table|transaction|retry|match|check|checkpanic|panic|trap|from|where|select|do|on|conflict|limit|join|outer|equals|worker|fork|is|new|service|resource|listener|client|remote|abstract|distinct|isolated|transactional|enum|base16|base64|continue|break|typeof|annotation|source|field|parameter|class|module|xmlns|as|readonly|never)\b/, 'keyword'],
          
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
    
    // Set theme colors for Ballerina
    monaco.editor.defineTheme('ballerina-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '569cd6', fontStyle: 'bold' },
        { token: 'identifier', foreground: '9cdcfe' },
        { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
        { token: 'string', foreground: 'ce9178' },
        { token: 'number', foreground: 'b5cea8' },
        { token: 'delimiter', foreground: 'd4d4d4' },
      ],
      colors: {
        'editor.background': '#1e1e1e',
      }
    })
    
    monaco.editor.setTheme('ballerina-dark')
    
    // Disable all validation for Ballerina (no red squiggles)
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
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
      </div>
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
          theme="ballerina-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'Fira Code', 'Cascadia Code', 'Courier New', monospace",
            lineNumbers: 'on',
            roundedSelection: true,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            wordWrap: 'on',
            padding: { top: 16, bottom: 16 },
            suggestOnTriggerCharacters: false,
            quickSuggestions: false,
            // Disable all validation and error markers
            glyphMargin: false,
            folding: true,
            renderValidationDecorations: 'off',
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
