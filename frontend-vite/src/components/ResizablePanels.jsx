/**
 * ResizablePanels Component
 * Resizable split panel container
 * Following SOLID principles and clean architecture
 * @component
 */

import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { GripVertical, GripHorizontal } from 'lucide-react';
import { useResizablePanels } from '../hooks';
import { LAYOUTS } from '../constants/app.constants';
import './ResizablePanels.css';

/**
 * @param {Object} props
 * @param {React.ReactNode} props.leftPanel - Left/top panel content
 * @param {React.ReactNode} props.rightPanel - Right/bottom panel content
 * @param {React.Ref} ref - Forwarded ref
 */
const ResizablePanels = forwardRef(({ leftPanel, rightPanel }, ref) => {
  const containerRef = useRef(null);
  
  const {
    splitPosition,
    setSplitPosition,
    layout,
    toggleLayout,
    resetSplit,
    isResizing,
    setIsResizing,
  } = useResizablePanels();

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    toggleLayout,
    resetSplit,
    layout,
  }));

  // Handle mouse down on resizer
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  // Handle mouse move for resizing
  const handleMouseMove = (e) => {
    if (!isResizing || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    let newPosition;
    if (layout === LAYOUTS.HORIZONTAL) {
      const mouseX = e.clientX - rect.left;
      newPosition = (mouseX / rect.width) * 100;
    } else {
      const mouseY = e.clientY - rect.top;
      newPosition = (mouseY / rect.height) * 100;
    }

    setSplitPosition(newPosition);
  };

  // Handle mouse up to stop resizing
  const handleMouseUp = () => {
    setIsResizing(false);
  };

  // Setup and cleanup event listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = layout === LAYOUTS.HORIZONTAL ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
      };
    }
  }, [isResizing, layout, handleMouseMove]);

  // Calculate styles
  const containerStyle = {
    flexDirection: layout === LAYOUTS.HORIZONTAL ? 'row' : 'column'
  };

  const leftPanelStyle = layout === LAYOUTS.HORIZONTAL
    ? { width: `${splitPosition}%`, height: '100%' }
    : { width: '100%', height: `${splitPosition}%` };

  const rightPanelStyle = layout === LAYOUTS.HORIZONTAL
    ? { width: `${100 - splitPosition}%`, height: '100%' }
    : { width: '100%', height: `${100 - splitPosition}%` };

  return (
    <div className="resizable-container-wrapper">
      <div 
        ref={containerRef}
        className={`resizable-container ${layout} ${isResizing ? 'resizing' : ''}`}
        style={containerStyle}
      >
        {/* Left/Top Panel */}
        <div className="resizable-panel left-panel" style={leftPanelStyle}>
          {leftPanel}
        </div>

        {/* Resizer Handle */}
        <div 
          className={`resizer ${layout}`}
          onMouseDown={handleMouseDown}
          role="separator"
          aria-orientation={layout === LAYOUTS.HORIZONTAL ? 'vertical' : 'horizontal'}
          aria-valuenow={splitPosition}
          aria-valuemin={20}
          aria-valuemax={80}
        >
          <div className="resizer-line">
            <div className="resizer-handle">
              {layout === LAYOUTS.HORIZONTAL ? (
                <GripVertical size={20} />
              ) : (
                <GripHorizontal size={20} />
              )}
            </div>
          </div>
        </div>

        {/* Right/Bottom Panel */}
        <div className="resizable-panel right-panel" style={rightPanelStyle}>
          {rightPanel}
        </div>
      </div>
    </div>
  );
});

ResizablePanels.displayName = 'ResizablePanels';

export default ResizablePanels;
