/**
 * useCodeExecution Hook
 * Manages code execution state and operations
 * @returns {object} Execution state and control functions
 */

import { useState, useCallback } from 'react';
import { apiService } from '../services/api.service';
import { SUCCESS_MESSAGES } from '../constants/app.constants';

export const useCodeExecution = () => {
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const executeCode = useCallback(async (code) => {
    setIsRunning(true);
    setOutput(SUCCESS_MESSAGES.RUNNING);
    setError('');

    try {
      const result = await apiService.executeCode(code);
      setOutput(result.output);
      setError(result.error);
    } catch (err) {
      setOutput('');
      setError(`Unexpected error: ${err.message}`);
    } finally {
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
    clearOutput,
  };
};

export default useCodeExecution;
