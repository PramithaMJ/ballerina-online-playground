/**
 * Ballerina Language Definition for Monaco Editor
 * Provides syntax highlighting and tokenization
 */

export const ballerinaLanguageDefinition = {
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
      [/\b(import|public|function|returns|return|if|else|while|foreach|in|int|string|boolean|float|decimal|json|xml|byte|any|var|const|final|type|record|object|error|map|future|typedesc|handle|stream|table|transaction|retry|match|check|checkpanic|panic|trap|from|where|select|do|on|conflict|limit|join|outer|equals|worker|fork|is|new|service|resource|listener|client|remote|abstract|distinct|isolated|transactional|enum|base16|base64|continue|break|typeof|annotation|source|field|parameter|class|module|xmlns|as|readonly|never|main)\b/, 'keyword'],
      [/[a-zA-Z_]\w*/, 'identifier'],
      [/[ \t\r\n]+/, ''],
      [/\/\/.*$/, 'comment'],
      [/\/\*/, 'comment', '@comment'],
      [/"([^"\\]|\\.)*$/, 'string.invalid'],
      [/"/, 'string', '@string'],
      [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
      [/0[xX][0-9a-fA-F]+/, 'number.hex'],
      [/\d+/, 'number'],
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
};
