/**
 * Toast Notification Component
 * Modern, beautiful notification system
 */

import React, { useEffect, useState } from 'react';
import { X, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import './Toast.css';

const Toast = ({ id, type = 'info', title, message, list, duration = 5000, onClose }) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // Match animation duration
  };

  const icons = {
    info: Info,
    warning: AlertTriangle,
    success: CheckCircle,
    error: XCircle,
  };

  const Icon = icons[type] || icons.info;

  return (
    <div className={`toast ${type} ${isClosing ? 'closing' : ''}`}>
      <div className="toast-icon">
        <Icon size={20} />
      </div>

      <div className="toast-content">
        <div className="toast-title">{title}</div>
        {message && <div className="toast-message">{message}</div>}
        {list && list.length > 0 && (
          <ul className="toast-list">
            {list.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        )}
      </div>

      <button className="toast-close" onClick={handleClose} aria-label="Close notification">
        <X size={16} />
      </button>

      {duration > 0 && <div className="toast-progress" />}
    </div>
  );
};

export default Toast;
