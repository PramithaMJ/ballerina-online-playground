/**
 * ErrorNotification Component
 * Displays connection errors with glassmorphism effect
 * @component
 */

import { AlertTriangle, X, RefreshCw } from 'lucide-react';
import ErrorIllustration from './ErrorIllustration';
import './ErrorNotification.css';

/**
 * @param {Object} props
 * @param {string} props.message - Error message
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onRetry - Retry handler
 */
const ErrorNotification = ({ message, onClose, onRetry }) => {
  return (
    <div className="error-notification glass-effect">
      <ErrorIllustration 
        title="Backend Connection Error"
        message={message || "Unable to connect to the backend server"}
        compact={true}
      />
      
      <div className="error-content">
        <p className="error-hint">
          Make sure the backend server is running on port 8081
        </p>
      </div>
      
      <div className="error-actions">
        {onRetry && (
          <button className="error-btn error-btn-retry" onClick={onRetry}>
            <RefreshCw size={16} />
            Retry
          </button>
        )}
        <button className="error-btn error-btn-close" onClick={onClose}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default ErrorNotification;
