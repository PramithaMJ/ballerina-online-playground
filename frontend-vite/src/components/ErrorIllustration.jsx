/**
 * ErrorIllustration Component
 * Displays Ballerina swan error illustration with theme-aware images
 * @component
 */

import { useState, useEffect } from 'react';
import './ErrorIllustration.css';

/**
 * @param {Object} props
 * @param {string} props.title - Error title (default: "Compilation Error")
 * @param {string} props.message - Error message (default: "Our swan got tangled in the code. Please try again!")
 * @param {boolean} props.compact - Use compact layout (default: false)
 */
const ErrorIllustration = ({ 
  title = "Compilation Error", 
  message = "Our swan got tangled in the code. Please try again!",
  compact = false 
}) => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // Detect theme from document or localStorage
    const detectTheme = () => {
      // Check if there's a theme in localStorage or data attribute
      const savedTheme = localStorage.getItem('theme');
      const htmlTheme = document.documentElement.getAttribute('data-theme');
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      if (savedTheme) {
        setTheme(savedTheme);
      } else if (htmlTheme) {
        setTheme(htmlTheme);
      } else if (isDark) {
        setTheme('dark');
      } else {
        setTheme('light');
      }
    };

    detectTheme();

    // Listen for theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => detectTheme();
    
    mediaQuery.addEventListener('change', handleChange);
    
    // Observer for theme attribute changes
    const observer = new MutationObserver(() => {
      detectTheme();
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class']
    });

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      observer.disconnect();
    };
  }, []);

  // Use dark image for dark theme, light image for light theme
  const imageSrc = theme === 'dark' 
    ? '/something-went-wrong-dark.png' 
    : '/something-went-wrong.png';

  return (
    <div className={`error-illustration ${compact ? 'compact' : ''}`}>
      <div className="error-illustration-image">
        <img 
          src={imageSrc} 
          alt="Ballerina Swan Error - Tangled in code"
          loading="lazy"
        />
      </div>
      <div className="error-illustration-content">
        <h3 className="error-illustration-title">{title}</h3>
        <p className="error-illustration-message">{message}</p>
      </div>
    </div>
  );
};

export default ErrorIllustration;
