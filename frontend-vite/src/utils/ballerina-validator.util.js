/**
 * Ballerina Code Validator
 * Provides real-time syntax validation for Ballerina code
 */

/**
 * Validates Ballerina code and returns error markers
 * @param {object} model - Monaco editor model
 * @param {object} monaco - Monaco editor instance
 * @returns {Array} Array of validation markers
 */
export const validateBallerinaCode = (model, monaco) => {
  const code = model.getValue();
  const markers = [];
  const lines = code.split('\n');
  
  lines.forEach((line, lineIndex) => {
    const lineNumber = lineIndex + 1;
    const trimmedLine = line.trim();
    
    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('/*')) {
      return;
    }
    
    // Check for missing semicolon
    if (shouldHaveSemicolon(trimmedLine)) {
      markers.push({
        severity: monaco.MarkerSeverity.Error,
        startLineNumber: lineNumber,
        startColumn: line.length,
        endLineNumber: lineNumber,
        endColumn: line.length + 1,
        message: 'Missing semicolon ";" at end of statement'
      });
    }
    
    // Check for unclosed string
    if (hasUnclosedString(line, trimmedLine)) {
      markers.push({
        severity: monaco.MarkerSeverity.Error,
        startLineNumber: lineNumber,
        startColumn: line.lastIndexOf('"') + 1,
        endLineNumber: lineNumber,
        endColumn: line.length + 1,
        message: 'Unclosed string literal'
      });
    }
    
    // Check for unbalanced parentheses
    const parenError = checkParentheses(line, lineNumber, trimmedLine);
    if (parenError) {
      markers.push(parenError);
    }
    
    // Check for missing import statement
    if (lineNumber === 1 && needsImport(code, trimmedLine)) {
      markers.push({
        severity: monaco.MarkerSeverity.Warning,
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 10,
        message: 'Missing import statement. Add: import ballerina/io;'
      });
    }
    
    // Check for function declaration syntax
    if (hasInvalidFunctionDeclaration(trimmedLine, lineNumber)) {
      markers.push({
        severity: monaco.MarkerSeverity.Error,
        startLineNumber: lineNumber,
        startColumn: line.indexOf('function') + 1,
        endLineNumber: lineNumber,
        endColumn: line.length + 1,
        message: 'Function declaration must have parentheses "()"'
      });
    }
    
    // Check for undefined module usage
    if (hasUndefinedModule(code, line, lineNumber)) {
      markers.push({
        severity: monaco.MarkerSeverity.Error,
        startLineNumber: lineNumber,
        startColumn: line.indexOf('io:println') + 1,
        endLineNumber: lineNumber,
        endColumn: line.indexOf('io:println') + 3,
        message: 'Cannot resolve module "io". Add: import ballerina/io;'
      });
    }
    
    // Check for common typos
    const typoError = checkCommonTypos(line, lineNumber, trimmedLine);
    if (typoError) {
      markers.push(typoError);
    }
    
    // Check for missing function body
    const bodyError = checkFunctionBody(trimmedLine, lines, lineIndex, lineNumber);
    if (bodyError) {
      markers.push(bodyError);
    }
  });
  
  // Check for balanced braces
  const braceError = checkBalancedBraces(code, lines, monaco);
  if (braceError) {
    markers.push(braceError);
  }
  
  return markers;
};

// Helper functions

const shouldHaveSemicolon = (trimmedLine) => {
  return (
    !trimmedLine.endsWith('{') &&
    !trimmedLine.endsWith('}') &&
    !trimmedLine.endsWith(';') &&
    !trimmedLine.endsWith(',') &&
    !/^(import|public|function|if|else|while|foreach|return)/.test(trimmedLine) &&
    /^\s*[a-zA-Z_].*/.test(trimmedLine) &&
    (trimmedLine.includes('=') ||
     trimmedLine.includes('println') ||
     trimmedLine.includes('print') ||
     /^(int|string|boolean|float|decimal|var|const)\s+\w+\s*=/.test(trimmedLine))
  );
};

const hasUnclosedString = (line, trimmedLine) => {
  const stringMatches = line.match(/"/g);
  return stringMatches && stringMatches.length % 2 !== 0 && !trimmedLine.startsWith('//');
};

const checkParentheses = (line, lineNumber, trimmedLine) => {
  if (trimmedLine.startsWith('//')) return null;
  
  const openParens = (line.match(/\(/g) || []).length;
  const closeParens = (line.match(/\)/g) || []).length;
  
  if (openParens > closeParens) {
    return {
      severity: 2, // Error
      startLineNumber: lineNumber,
      startColumn: line.lastIndexOf('(') + 1,
      endLineNumber: lineNumber,
      endColumn: line.lastIndexOf('(') + 2,
      message: 'Unclosed parenthesis "("'
    };
  } else if (closeParens > openParens) {
    return {
      severity: 2, // Error
      startLineNumber: lineNumber,
      startColumn: line.lastIndexOf(')') + 1,
      endLineNumber: lineNumber,
      endColumn: line.lastIndexOf(')') + 2,
      message: 'Unexpected closing parenthesis ")"'
    };
  }
  
  return null;
};

const needsImport = (code, trimmedLine) => {
  return (
    !trimmedLine.startsWith('import') &&
    trimmedLine !== '' &&
    (code.includes('io:println') || code.includes('io:print'))
  );
};

const hasInvalidFunctionDeclaration = (trimmedLine) => {
  return trimmedLine.includes('function') && !trimmedLine.includes('(');
};

const hasUndefinedModule = (code, line, lineNumber) => {
  return line.includes('io:println') && !code.includes('import ballerina/io');
};

const checkCommonTypos = (line, lineNumber, trimmedLine) => {
  const typos = ['printlin', 'pritln'];
  
  for (const typo of typos) {
    if (trimmedLine.includes(typo)) {
      return {
        severity: 2, // Error
        startLineNumber: lineNumber,
        startColumn: line.indexOf(typo) + 1,
        endLineNumber: lineNumber,
        endColumn: line.indexOf(typo) + typo.length + 1,
        message: `Unknown function "${typo}". Did you mean "println"?`
      };
    }
  }
  
  return null;
};

const checkFunctionBody = (trimmedLine, lines, lineIndex, lineNumber) => {
  if (trimmedLine.includes('function') && trimmedLine.endsWith(')')) {
    const nextLine = lines[lineIndex + 1];
    if (nextLine && !nextLine.trim().startsWith('{')) {
      return {
        severity: 2, // Error
        startLineNumber: lineNumber + 1,
        startColumn: 1,
        endLineNumber: lineNumber + 1,
        endColumn: 2,
        message: 'Function declaration must be followed by a block "{"'
      };
    }
  }
  
  return null;
};

const checkBalancedBraces = (code, lines, monaco) => {
  const openBraces = (code.match(/{/g) || []).length;
  const closeBraces = (code.match(/}/g) || []).length;
  
  if (openBraces !== closeBraces) {
    return {
      severity: monaco.MarkerSeverity.Error,
      startLineNumber: lines.length,
      startColumn: 1,
      endLineNumber: lines.length,
      endColumn: 2,
      message: openBraces > closeBraces 
        ? 'Missing closing brace "}"' 
        : 'Unexpected closing brace "}"'
    };
  }
  
  return null;
};
