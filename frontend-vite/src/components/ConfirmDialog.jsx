/**
 * ConfirmDialog Component
 * Reusable confirmation dialog
 * @component
 */

import { AlertTriangle } from 'lucide-react';
import './ConfirmDialog.css';

/**
 * @param {Object} props
 * @param {boolean} props.isOpen - Dialog visibility
 * @param {string} props.title - Dialog title
 * @param {string} props.message - Dialog message
 * @param {string} props.confirmText - Confirm button text
 * @param {string} props.cancelText - Cancel button text
 * @param {Function} props.onConfirm - Confirm handler
 * @param {Function} props.onCancel - Cancel handler
 * @param {string} props.type - Dialog type (warning, danger, info)
 */
const ConfirmDialog = ({
  isOpen,
  title = 'Confirm',
  message = 'Are you sure?',
  confirmText = 'Yes',
  cancelText = 'No',
  onConfirm,
  onCancel,
  type = 'warning'
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onCancel();
    } else if (e.key === 'Enter') {
      onConfirm();
    }
  };

  return (
    <div 
      className="confirm-dialog-backdrop" 
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-message"
    >
      <div className={`confirm-dialog confirm-dialog-${type}`}>
        <div className="confirm-dialog-icon">
          <AlertTriangle size={48} />
        </div>
        
        <div className="confirm-dialog-content">
          <h3 id="dialog-title" className="confirm-dialog-title">
            {title}
          </h3>
          <p id="dialog-message" className="confirm-dialog-message">
            {message}
          </p>
        </div>
        
        <div className="confirm-dialog-actions">
          <button
            className="confirm-dialog-btn confirm-dialog-btn-cancel"
            onClick={onCancel}
            autoFocus
          >
            {cancelText}
          </button>
          <button
            className="confirm-dialog-btn confirm-dialog-btn-confirm"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
