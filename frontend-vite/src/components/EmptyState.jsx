/**
 * EmptyState Component
 * Reusable empty state display
 * @component
 */

/**
 * @param {Object} props
 * @param {React.Component} props.icon - Icon component
 * @param {string} props.title - Main title text
 * @param {string} props.subtitle - Subtitle text
 * @param {number} props.iconSize - Icon size (default: 32)
 */
const EmptyState = ({ icon: Icon, title, subtitle, iconSize = 32 }) => {
  return (
    <div className="output-empty">
      <Icon size={iconSize} className="empty-icon" />
      <p className="empty-title">{title}</p>
      {subtitle && <p className="empty-subtitle">{subtitle}</p>}
    </div>
  );
};

export default EmptyState;
