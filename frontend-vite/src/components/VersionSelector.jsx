/**
 * VersionSelector Component
 * Allows users to select Ballerina version
 * @component
 */

import { ChevronDown } from 'lucide-react';
import './VersionSelector.css';

const BALLERINA_VERSIONS = [
  // Swan Lake Update 12 (Latest)
  { value: '2201.12.0', label: 'Swan Lake Update 12 (2201.12.0)', recommended: true },
  
  // Swan Lake Update 11
  { value: '2201.11.0', label: 'Swan Lake Update 11 (2201.11.0)' },
  
  // Swan Lake Update 10
  { value: '2201.10.5', label: 'Swan Lake Update 10.5 (2201.10.5)' },
  { value: '2201.10.4', label: 'Swan Lake Update 10.4 (2201.10.4)' },
  { value: '2201.10.3', label: 'Swan Lake Update 10.3 (2201.10.3)' },
  { value: '2201.10.2', label: 'Swan Lake Update 10.2 (2201.10.2)' },
  { value: '2201.10.1', label: 'Swan Lake Update 10.1 (2201.10.1)' },
  { value: '2201.10.0', label: 'Swan Lake Update 10 (2201.10.0)' },
  
  // Swan Lake Update 9
  { value: '2201.9.3', label: 'Swan Lake Update 9.3 (2201.9.3)' },
  { value: '2201.9.2', label: 'Swan Lake Update 9.2 (2201.9.2)' },
  { value: '2201.9.1', label: 'Swan Lake Update 9.1 (2201.9.1)' },
  { value: '2201.9.0', label: 'Swan Lake Update 9 (2201.9.0)' },
  
  // Swan Lake Update 8
  { value: '2201.8.6', label: 'Swan Lake Update 8.6 (2201.8.6)' },
  { value: '2201.8.5', label: 'Swan Lake Update 8.5 (2201.8.5)' },
  { value: '2201.8.4', label: 'Swan Lake Update 8.4 (2201.8.4)' },
  { value: '2201.8.3', label: 'Swan Lake Update 8.3 (2201.8.3)' },
  { value: '2201.8.2', label: 'Swan Lake Update 8.2 (2201.8.2)' },
  { value: '2201.8.1', label: 'Swan Lake Update 8.1 (2201.8.1)' },
  { value: '2201.8.0', label: 'Swan Lake Update 8 (2201.8.0)' },
  
  // Swan Lake Update 7
  { value: '2201.7.2', label: 'Swan Lake Update 7.2 (2201.7.2)' },
  { value: '2201.7.0', label: 'Swan Lake Update 7 (2201.7.0)' },
  
  // Swan Lake Update 6
  { value: '2201.6.0', label: 'Swan Lake Update 6 (2201.6.0)' },
  
  // Swan Lake Update 5
  { value: '2201.5.0', label: 'Swan Lake Update 5 (2201.5.0)' },
  
  // Swan Lake Update 4
  { value: '2201.4.1', label: 'Swan Lake Update 4.1 (2201.4.1)' },
  { value: '2201.4.0', label: 'Swan Lake Update 4 (2201.4.0)' },
  
  // Special tags
  { value: 'swan-lake', label: 'Swan Lake (Latest Development Build)' },
];

/**
 * @param {Object} props
 * @param {string} props.selectedVersion - Currently selected version
 * @param {Function} props.onVersionChange - Version change handler
 * @param {boolean} props.disabled - Whether the selector is disabled
 */
const VersionSelector = ({ selectedVersion, onVersionChange, disabled = false }) => {
  const currentVersion = BALLERINA_VERSIONS.find(v => v.value === selectedVersion);

  return (
    <div className="version-selector-container">
      <label htmlFor="version-select" className="version-label">
        Version:
      </label>
      <div className="version-select-wrapper">
        <select
          id="version-select"
          className="version-select"
          value={selectedVersion}
          onChange={(e) => onVersionChange(e.target.value)}
          disabled={disabled}
          aria-label="Select Ballerina version"
        >
          {BALLERINA_VERSIONS.map((version) => (
            <option key={version.value} value={version.value}>
              {version.label}
              {version.recommended ? ' ⭐' : ''}
            </option>
          ))}
        </select>
        <ChevronDown className="version-select-icon" size={16} />
      </div>
    </div>
  );
};

export default VersionSelector;
export { BALLERINA_VERSIONS };
