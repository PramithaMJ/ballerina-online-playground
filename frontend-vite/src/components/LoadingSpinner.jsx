/**
 * LoadingSpinner Component
 * Reusable loading indicator
 * @component
 */

/**
 * @param {Object} props
 * @param {string} props.message - Loading message (optional)
 * @param {string} props.size - Size variant: 'small' | 'large' (default: 'large')
 */
const LoadingSpinner = ({ message, size = 'large' }) => {
  const spinnerClass = size === 'small' ? 'spinner' : 'spinner-large';
  
  return (
    <div className="editor-loading">
      <div className={spinnerClass}></div>
      {message && <p>{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
