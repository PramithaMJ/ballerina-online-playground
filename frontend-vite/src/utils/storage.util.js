/**
 * Local Storage utility functions
 * Provides abstraction over localStorage with error handling
 */

/**
 * Get item from localStorage
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if key doesn't exist
 * @returns {*} Stored value or default value
 */
export const getStorageItem = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item !== null ? item : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage: ${key}`, error);
    return defaultValue;
  }
};

/**
 * Set item in localStorage
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 * @returns {boolean} Success status
 */
export const setStorageItem = (key, value) => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`Error writing to localStorage: ${key}`, error);
    return false;
  }
};

/**
 * Remove item from localStorage
 * @param {string} key - Storage key
 * @returns {boolean} Success status
 */
export const removeStorageItem = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing from localStorage: ${key}`, error);
    return false;
  }
};

/**
 * Clear all items from localStorage
 * @returns {boolean} Success status
 */
export const clearStorage = () => {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing localStorage', error);
    return false;
  }
};

/**
 * Check if this is the user's first visit
 * @returns {boolean} True if first visit, false otherwise
 */
export const isFirstVisit = () => {
  try {
    const hasVisited = localStorage.getItem('hasVisitedBefore');
    return hasVisited === null;
  } catch (error) {
    console.error('Error checking first visit', error);
    return false;
  }
};

/**
 * Mark that the user has visited the site
 * @returns {boolean} Success status
 */
export const markAsVisited = () => {
  try {
    localStorage.setItem('hasVisitedBefore', 'true');
    localStorage.setItem('firstVisitDate', new Date().toISOString());
    return true;
  } catch (error) {
    console.error('Error marking as visited', error);
    return false;
  }
};
