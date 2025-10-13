/**
 * useCodeExecution Hook
 * Manages code execution state and operations with progressive loading
 * @returns {object} Execution state and control functions
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { apiService } from '../services/api.service';
import { SUCCESS_MESSAGES } from '../constants/app.constants';
import { validateCodeSecurity } from '../utils/ballerina-validator.util';

export const useCodeExecution = () => {
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const abortControllerRef = useRef(null);
  const progressIntervalRef = useRef(null);

  // Cleanup progress interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const executeCode = useCallback(async (code, version = '2201.12.0') => {
    // Security validation before execution
    const validation = validateCodeSecurity(code);
    if (!validation.isValid) {
      setError(`Security validation failed:\n${validation.errors.join('\n')}`);
      setOutput('');
      return;
    }

    setIsRunning(true);
    setProgress(0);
    setOutput('⏳ Preparing execution environment...');
    setError('');

    // Create new AbortController for this execution
    abortControllerRef.current = new AbortController();

    // Progressive loading: Update messages and simulate progress
    let currentProgress = 0;
    let messageIndex = 0;
    const progressMessages = [
      { time: 0, progress: 10, message: '📦 Creating Ballerina package...' },
      { time: 1000, progress: 25, message: '🔨 Compiling Ballerina code...' },
      { time: 3000, progress: 50, message: '⚙️ Executing in secure container...' },
      { time: 8000, progress: 75, message: ' Processing output...' },
      { time: 12000, progress: 85, message: '✨ Finalizing execution...' }
    ];

    // Start progress simulation
    progressIntervalRef.current = setInterval(() => {
      if (messageIndex < progressMessages.length) {
        const msg = progressMessages[messageIndex];
        currentProgress = msg.progress;
        setProgress(currentProgress);
        setOutput(msg.message);
        messageIndex++;
      } else {
        // Gradually increase to 95% max
        if (currentProgress < 95) {
          currentProgress += 1;
          setProgress(currentProgress);
        }
      }
    }, 800);

    try {
      const result = await apiService.executeCode(code, version, abortControllerRef.current.signal);
      
      // Clear progress interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      setProgress(100);
      
      // Check if it's a connection error
      if (result.error && result.error.includes('Connection failed')) {
        setIsRunning(false);
        setProgress(0);
        abortControllerRef.current = null;
        throw new Error(result.error);
      }
      
      setOutput(result.output);
      setError(result.error);
    } catch (err) {
      // Clear progress interval on error
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      setProgress(0);
      
      if (err.name === 'AbortError') {
        setOutput(' Execution stopped by user.');
        setError('');
      } else if (err.message && err.message.includes('Connection failed')) {
        // Re-throw connection errors to be handled by App.jsx
        throw err;
      } else {
        setOutput('');
        setError(`❌ Unexpected error: ${err.message}`);
      }
    } finally {
      setIsRunning(false);
      abortControllerRef.current = null;
      
      // Reset progress after delay
      setTimeout(() => setProgress(0), 2000);
    }
  }, []);

  const stopExecution = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsRunning(false);
      setProgress(0);
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const clearOutput = useCallback(() => {
    setOutput('');
    setError('');
    setProgress(0);
  }, []);

  return {
    output,
    error,
    isRunning,
    progress,
    executeCode,
    stopExecution,
    clearOutput,
  };
};

export default useCodeExecution;
