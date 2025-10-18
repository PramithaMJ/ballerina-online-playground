/**
 * useToast Hook
 * Provides toast notification functionality
 */

import { useState, useCallback } from 'react';

let toastId = 0;

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type = 'info', title, message, list, duration = 5000 }) => {
    const id = ++toastId;
    const newToast = {
      id,
      type,
      title,
      message,
      list,
      duration,
    };

    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showInfo = useCallback((title, message, list) => {
    return addToast({ type: 'info', title, message, list });
  }, [addToast]);

  const showWarning = useCallback((title, message, list) => {
    return addToast({ type: 'warning', title, message, list });
  }, [addToast]);

  const showSuccess = useCallback((title, message, list) => {
    return addToast({ type: 'success', title, message, list });
  }, [addToast]);

  const showError = useCallback((title, message, list) => {
    return addToast({ type: 'error', title, message, list });
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    showInfo,
    showWarning,
    showSuccess,
    showError,
  };
};

export default useToast;
