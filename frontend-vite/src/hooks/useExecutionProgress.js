/**
 * useExecutionProgress Hook
 * Tracks execution time and progress
 * @returns {object} Progress state and control functions
 */

import { useState, useEffect, useRef } from 'react';

export const useExecutionProgress = (isRunning) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now();
      setElapsedTime(0);
      setProgress(0);

      // Update every 100ms for smooth progress
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsedTime(elapsed);

        // Progress calculation: assuming 30s max execution
        // Progress grows slower as it approaches 100%
        const maxTime = 30; // 30 seconds timeout
        const rawProgress = (elapsed / maxTime) * 100;
        // Use an easing function to make it slow down near the end
        const easedProgress = Math.min(95, rawProgress * (1 - rawProgress / 200));
        setProgress(easedProgress);
      }, 100);
    } else {
      // Clean up when execution stops
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      startTimeRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const formatTime = (seconds) => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return {
    elapsedTime,
    formattedTime: formatTime(elapsedTime),
    progress: Math.round(progress),
  };
};

export default useExecutionProgress;
