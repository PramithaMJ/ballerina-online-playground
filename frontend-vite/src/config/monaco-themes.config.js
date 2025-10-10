/**
 * Monaco Editor Theme Definitions
 * Multiple color themes for the editor
 */

export const monacoThemes = {
  'ballerina-dark': {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: 'C586C0', fontStyle: 'bold' },
      { token: 'identifier', foreground: '9CDCFE' },
      { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'delimiter', foreground: 'D4D4D4' },
    ],
    colors: {
      'editor.background': '#1E1E1E',
      'editor.foreground': '#D4D4D4',
      'editorLineNumber.foreground': '#858585',
      'editorLineNumber.activeForeground': '#C6C6C6',
      'editor.selectionBackground': '#264F78',
      'editor.inactiveSelectionBackground': '#3A3D41',
    }
  },
  
  'ballerina-light': {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: 'AF00DB', fontStyle: 'bold' },
      { token: 'identifier', foreground: '001080' },
      { token: 'comment', foreground: '008000', fontStyle: 'italic' },
      { token: 'string', foreground: 'A31515' },
      { token: 'number', foreground: '098658' },
      { token: 'delimiter', foreground: '000000' },
    ],
    colors: {
      'editor.background': '#FFFFFF',
      'editor.foreground': '#000000',
      'editorLineNumber.foreground': '#237893',
      'editorLineNumber.activeForeground': '#0B216F',
      'editor.selectionBackground': '#ADD6FF',
      'editor.inactiveSelectionBackground': '#E5EBF1',
    }
  },
  
  'ballerina-monokai': {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: 'F92672', fontStyle: 'bold' },
      { token: 'identifier', foreground: 'A6E22E' },
      { token: 'comment', foreground: '75715E', fontStyle: 'italic' },
      { token: 'string', foreground: 'E6DB74' },
      { token: 'number', foreground: 'AE81FF' },
      { token: 'delimiter', foreground: 'F8F8F2' },
    ],
    colors: {
      'editor.background': '#272822',
      'editor.foreground': '#F8F8F2',
      'editorLineNumber.foreground': '#90908A',
      'editorLineNumber.activeForeground': '#C2C2BF',
      'editor.selectionBackground': '#49483E',
      'editor.inactiveSelectionBackground': '#3E3D32',
    }
  },
  
  'ballerina-github': {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: 'D73A49', fontStyle: 'bold' },
      { token: 'identifier', foreground: '6F42C1' },
      { token: 'comment', foreground: '6A737D', fontStyle: 'italic' },
      { token: 'string', foreground: '032F62' },
      { token: 'number', foreground: '005CC5' },
      { token: 'delimiter', foreground: '24292E' },
    ],
    colors: {
      'editor.background': '#F6F8FA',
      'editor.foreground': '#24292E',
      'editorLineNumber.foreground': '#1B1F234D',
      'editorLineNumber.activeForeground': '#24292E',
      'editor.selectionBackground': '#C8C8FA',
      'editor.inactiveSelectionBackground': '#E8E8FA',
    }
  },
};
