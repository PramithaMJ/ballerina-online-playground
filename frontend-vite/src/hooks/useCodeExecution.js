/**
 * useCodeExecution Hook
 * Manages code execution state and operations
 * @returns {object} Execution state and control functions
 */

import { useState, useCallback, useRef } from 'react';
import { apiService } from '../services/api.service';
import { SUCCESS_MESSAGES } from '../constants/app.constants';
import { validateCodeSecurity } from '../utils/ballerina-validator.util';

export const useCodeExecution = () => {
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const abortControllerRef = useRef(null);

  const executeCode = useCallback(async (code, version = '2201.12.0') => {
    // Security validation before execution
    const validation = validateCodeSecurity(code);
    if (!validation.isValid) {
      setError(`Security validation failed:\n${validation.errors.join('\n')}`);
      setOutput('');
      return;
    }

    setIsRunning(true);
    setOutput(SUCCESS_MESSAGES.RUNNING);
    setError('');

    // Create new AbortController for this execution
    abortControllerRef.current = new AbortController();

    try {
      const result = await apiService.executeCode(code, version, abortControllerRef.current.signal);
      
      // Check if it's a connection error
      if (result.error && result.error.includes('Connection failed')) {
        setIsRunning(false);
        abortControllerRef.current = null;
        throw new Error(result.error);
      }
      
      setOutput(result.output);
      setError(result.error);
    } catch (err) {
      if (err.name === 'AbortError') {
        setOutput('Execution stopped by user.');
        setError('');
      } else if (err.message && err.message.includes('Connection failed')) {
        // Re-throw connection errors to be handled by App.jsx
        throw err;
      } else {
        setOutput('');
        setError(`Unexpected error: ${err.message}`);
      }
    } finally {
      setIsRunning(false);
      abortControllerRef.current = null;
    }
  }, []);

  const stopExecution = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsRunning(false);
    }
  }, []);

  const clearOutput = useCallback(() => {
    setOutput('');
    setError('');
  }, []);

  return {
    output,
    error,
    isRunning,
    executeCode,
    stopExecution,
    clearOutput,
  };
};

export default useCodeExecution;
