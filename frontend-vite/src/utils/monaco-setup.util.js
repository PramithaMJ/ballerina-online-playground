/**
 * Monaco Editor Setup Utility
 * Configures Monaco editor with Ballerina support
 */

import { ballerinaLanguageDefinition } from '../config/ballerina-language.config';
import { monacoThemes } from '../config/monaco-themes.config';
import { validateBallerinaCode } from './ballerina-validator.util';

/**
 * Register Ballerina language with Monaco
 * @param {object} monaco - Monaco editor instance
 */
export const registerBallerinaLanguage = (monaco) => {
  monaco.languages.register({ id: 'ballerina' });
  monaco.languages.setMonarchTokensProvider('ballerina', ballerinaLanguageDefinition);
};

/**
 * Register all Monaco themes
 * @param {object} monaco - Monaco editor instance
 */
export const registerMonacoThemes = (monaco) => {
  Object.entries(monacoThemes).forEach(([themeName, themeData]) => {
    monaco.editor.defineTheme(themeName, themeData);
  });
};

/**
 * Setup validation for Ballerina code
 * @param {object} monaco - Monaco editor instance
 */
export const setupBallerinaValidation = (monaco) => {
  // Validation on model creation
  monaco.editor.onDidCreateModel((model) => {
    if (model.getLanguageId() === 'ballerina') {
      const validate = () => {
        const markers = validateBallerinaCode(model, monaco);
        monaco.editor.setModelMarkers(model, 'ballerina', markers);
      };
      
      validate();
      model.onDidChangeContent(() => validate());
    }
  });
  
  // Validate existing models
  monaco.editor.getModels().forEach((model) => {
    if (model.getLanguageId() === 'ballerina') {
      const markers = validateBallerinaCode(model, monaco);
      monaco.editor.setModelMarkers(model, 'ballerina', markers);
      
      model.onDidChangeContent(() => {
        const newMarkers = validateBallerinaCode(model, monaco);
        monaco.editor.setModelMarkers(model, 'ballerina', newMarkers);
      });
    }
  });
};

/**
 * Complete Monaco editor setup for Ballerina
 * @param {object} editor - Monaco editor instance
 * @param {object} monaco - Monaco instance
 * @param {string} theme - Theme to apply
 * @returns {object} Editor reference
 */
export const setupMonacoEditor = (editor, monaco, theme) => {
  // Register language and themes
  registerBallerinaLanguage(monaco);
  registerMonacoThemes(monaco);
  
  // Setup validation
  setupBallerinaValidation(monaco);
  
  // Apply theme
  monaco.editor.setTheme(theme);
  
  return editor;
};
