/**
 * Application-wide constants
 * Centralized location for all magic strings and configuration values
 */

// Default code sample
export const DEFAULT_SAMPLE_CODE = `import ballerina/io;

public function main() {
    io:println("Hello, Ballerina!");
    
    // Try some math
    int result = 10 + 5 * 2;
    io:println("Result: ", result);
    
    // String operations
    string name = "Developer";
    io:println("Welcome, ", name, "!");
}`;

// Theme constants
export const THEMES = {
  DARK: 'dark',
  LIGHT: 'light',
};

// Editor themes
export const EDITOR_THEMES = {
  DARK: 'ballerina-dark',
  LIGHT: 'ballerina-light',
  MONOKAI: 'ballerina-monokai',
  GITHUB: 'ballerina-github',
};

// Layout constants
export const LAYOUTS = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
};

// Font size constraints
export const FONT_SIZE = {
  MIN: 10,
  MAX: 32,
  DEFAULT: 14,
  STEP: 2,
};

// Split position constraints
export const SPLIT_POSITION = {
  MIN: 20,
  MAX: 80,
  DEFAULT: 50,
};

// Local storage keys
export const STORAGE_KEYS = {
  APP_THEME: 'app-theme',
  EDITOR_THEME: 'editorTheme',
  EDITOR_FONT_SIZE: 'editorFontSize',
  SPLIT_POSITION: 'splitPosition',
  PANEL_LAYOUT: 'panelLayout',
};

// API endpoints
export const API_ENDPOINTS = {
  EXECUTE: '/execute',
};

// Error messages
export const ERROR_MESSAGES = {
  EMPTY_CODE: 'Please write some Ballerina code first!',
  CONNECTION_ERROR: 'Connection Error',
  SERVER_ERROR: 'Something went wrong!',
};

// Success messages
export const SUCCESS_MESSAGES = {
  RUNNING: 'Running your code... Please wait.',
  NO_OUTPUT: 'Code executed successfully with no output.',
};

// Monaco editor options
export const EDITOR_OPTIONS = {
  minimap: { enabled: false },
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
  hover: { enabled: true },
  scrollbar: {
    verticalScrollbarSize: 10,
    horizontalScrollbarSize: 10,
  },
};
