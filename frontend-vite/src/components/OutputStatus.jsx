/**
 * OutputStatus Component
 * Displays output status badge
 * @component
 */

import { CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * @param {Object} props
 * @param {boolean} props.isSuccess - Success status
 * @param {boolean} props.isError - Error status
 */
const OutputStatus = ({ isSuccess, isError }) => {
  if (isSuccess) {
    return (
      <span className="status-badge status-success">
        <CheckCircle2 size={14} />
        Success
      </span>
    );
  }
  
  if (isError) {
    return (
      <span className="status-badge status-error">
        <AlertCircle size={14} />
        Error
      </span>
    );
  }
  
  return null;
};

export default OutputStatus;
