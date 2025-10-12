/**
 * useBallerinaVersion Hook
 * Manages Ballerina version selection and persistence
 * @returns {object} Version state and control functions
 */

import { useState, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

const DEFAULT_VERSION = '2201.12.0';
const VERSION_STORAGE_KEY = 'ballerina-version';

export const useBallerinaVersion = () => {
  const [storedVersion, setStoredVersion] = useLocalStorage(VERSION_STORAGE_KEY, DEFAULT_VERSION);
  const [version, setVersion] = useState(storedVersion);

  const changeVersion = useCallback((newVersion) => {
    setVersion(newVersion);
    setStoredVersion(newVersion);
  }, [setStoredVersion]);

  const resetVersion = useCallback(() => {
    setVersion(DEFAULT_VERSION);
    setStoredVersion(DEFAULT_VERSION);
  }, [setStoredVersion]);

  return {
    version,
    changeVersion,
    resetVersion,
  };
};

export default useBallerinaVersion;
