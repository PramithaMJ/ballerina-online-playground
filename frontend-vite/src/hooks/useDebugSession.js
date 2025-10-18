/**
 * useDebugSession Hook
 * Manages debugging session state and operations
 */

import { useState, useCallback, useRef } from 'react';
import { debugService } from '../services/debug.service';

export const useDebugSession = () => {
  const [isDebugging, setIsDebugging] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [breakpoints, setBreakpoints] = useState(new Set());
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState(null);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);

  /**
   * Set editor and monaco references
   */
  const setEditorRefs = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  }, []);

  /**
   * Start a debugging session
   */
  const startDebugging = useCallback(async (code, version = '2201.12.0') => {
    setIsInitializing(true);
    setError(null);

    try {
      const id = await debugService.startDebugging(code, version);
      setSessionId(id);
      setIsDebugging(true);

      // Apply existing breakpoints to the session
      breakpoints.forEach(line => {
        debugService.setBreakpoint(line);
      });

      // Start the debug execution
      debugService.start();

      console.log('✅ Debugging session started:', id);
    } catch (err) {
      console.error('❌ Failed to start debugging:', err);
      setError(err.message);
      setIsDebugging(false);
    } finally {
      setIsInitializing(false);
    }
  }, [breakpoints]);

  /**
   * Stop debugging session
   */
  const stopDebugging = useCallback(() => {
    if (debugService.isDebugging()) {
      debugService.disconnect();
    }
    setIsDebugging(false);
    setSessionId(null);
    console.log('⏹ Debugging session stopped');
  }, []);

  /**
   * Toggle breakpoint at a line
   */
  const toggleBreakpoint = useCallback((lineNumber) => {
    if (!editorRef.current || !monacoRef.current) {
      console.warn('Editor not initialized');
      return;
    }

    const editor = editorRef.current;
    const monaco = monacoRef.current;

    setBreakpoints(prev => {
      const newBreakpoints = new Set(prev);
      
      if (newBreakpoints.has(lineNumber)) {
        // Remove breakpoint
        newBreakpoints.delete(lineNumber);
        
        // Remove decoration
        const newDecorations = decorationsRef.current.filter(
          dec => dec.line !== lineNumber
        );
        const decorationIds = newDecorations.map(dec => dec.id);
        decorationsRef.current = newDecorations;
        editor.deltaDecorations(decorationIds, []);

        // Notify debug service if debugging
        if (isDebugging) {
          debugService.removeBreakpoint(lineNumber);
        }

        console.log(`🔴 Removed breakpoint at line ${lineNumber}`);
      } else {
        // Add breakpoint
        newBreakpoints.add(lineNumber);

        // Add decoration
        const decorations = editor.deltaDecorations([], [
          {
            range: new monaco.Range(lineNumber, 1, lineNumber, 1),
            options: {
              isWholeLine: true,
              className: 'breakpoint-line',
              glyphMarginClassName: 'breakpoint-glyph',
              glyphMarginHoverMessage: { value: 'Breakpoint' },
            },
          },
        ]);

        decorationsRef.current.push({
          id: decorations[0],
          line: lineNumber,
        });

        // Notify debug service if debugging
        if (isDebugging) {
          debugService.setBreakpoint(lineNumber);
        }

        console.log(`🔵 Added breakpoint at line ${lineNumber}`);
      }

      return newBreakpoints;
    });
  }, [isDebugging]);

  /**
   * Clear all breakpoints
   */
  const clearAllBreakpoints = useCallback(() => {
    if (editorRef.current) {
      const decorationIds = decorationsRef.current.map(dec => dec.id);
      editorRef.current.deltaDecorations(decorationIds, []);
      decorationsRef.current = [];
    }

    breakpoints.forEach(line => {
      if (isDebugging) {
        debugService.removeBreakpoint(line);
      }
    });

    setBreakpoints(new Set());
    console.log('🧹 All breakpoints cleared');
  }, [isDebugging, breakpoints]);

  /**
   * Highlight current execution line
   */
  const highlightCurrentLine = useCallback((lineNumber) => {
    if (!editorRef.current || !monacoRef.current) return;

    const editor = editorRef.current;
    const monaco = monacoRef.current;

    // Remove previous highlight
    const oldHighlight = decorationsRef.current.find(dec => dec.type === 'currentLine');
    if (oldHighlight) {
      editor.deltaDecorations([oldHighlight.id], []);
      decorationsRef.current = decorationsRef.current.filter(
        dec => dec.type !== 'currentLine'
      );
    }

    if (lineNumber) {
      // Add new highlight
      const decorations = editor.deltaDecorations([], [
        {
          range: new monaco.Range(lineNumber, 1, lineNumber, 1),
          options: {
            isWholeLine: true,
            className: 'current-execution-line',
            glyphMarginClassName: 'current-execution-glyph',
          },
        },
      ]);

      decorationsRef.current.push({
        id: decorations[0],
        line: lineNumber,
        type: 'currentLine',
      });

      // Scroll to line
      editor.revealLineInCenter(lineNumber);
    }
  }, []);

  return {
    isDebugging,
    isInitializing,
    sessionId,
    breakpoints: Array.from(breakpoints),
    error,
    startDebugging,
    stopDebugging,
    toggleBreakpoint,
    clearAllBreakpoints,
    highlightCurrentLine,
    setEditorRefs,
  };
};

export default useDebugSession;
