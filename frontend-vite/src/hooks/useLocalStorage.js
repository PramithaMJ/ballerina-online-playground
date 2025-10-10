/**
 * useLocalStorage Hook
 * Manages state synchronized with localStorage
 * @param {string} key - localStorage key
 * @param {*} initialValue - Initial value if key doesn't exist
 * @returns {[value, setValue]} - Stateful value and setter function
 */

import { useState, useEffect } from 'react';
import { getStorageItem, setStorageItem } from '../utils/storage.util';

export const useLocalStorage = (key, initialValue) => {
  // Get initial value from localStorage or use provided initial value
  const [storedValue, setStoredValue] = useState(() => {
    return getStorageItem(key, initialValue);
  });

  // Update localStorage when value changes
  useEffect(() => {
    setStorageItem(key, storedValue);
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
};

export default useLocalStorage;
