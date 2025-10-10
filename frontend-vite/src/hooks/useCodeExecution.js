/**
 * useCodeExecution Hook
 * Manages code execution state and operations
 * @returns {object} Execution state and control functions
 */

import { useState, useCallback, useRef } from 'react';
import { apiService } from '../services/api.service';
import { SUCCESS_MESSAGES } from '../constants/app.constants';

export const useCodeExecution = () => {
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const abortControllerRef = useRef(null);

  const executeCode = useCallback(async (code) => {
    setIsRunning(true);
    setOutput(SUCCESS_MESSAGES.RUNNING);
    setError('');

    // Create new AbortController for this execution
    abortControllerRef.current = new AbortController();

    try {
      const result = await apiService.executeCode(code, abortControllerRef.current.signal);
      setOutput(result.output);
      setError(result.error);
    } catch (err) {
      if (err.name === 'AbortError') {
        setOutput('Execution stopped by user.');
        setError('');
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
