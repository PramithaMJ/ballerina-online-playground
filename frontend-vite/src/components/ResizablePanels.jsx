import { useState, useRef, useEffect } from 'react'
import { Columns, Rows, GripVertical, GripHorizontal } from 'lucide-react'
import './ResizablePanels.css'

const ResizablePanels = ({ leftPanel, rightPanel }) => {
  const [isResizing, setIsResizing] = useState(false)
  const [splitPosition, setSplitPosition] = useState(() => {
    return parseInt(localStorage.getItem('splitPosition')) || 50
  })
  const [layout, setLayout] = useState(() => {
    return localStorage.getItem('panelLayout') || 'horizontal'
  })
  const containerRef = useRef(null)

  // Save preferences
  useEffect(() => {
    localStorage.setItem('splitPosition', splitPosition.toString())
  }, [splitPosition])

  useEffect(() => {
    localStorage.setItem('panelLayout', layout)
  }, [layout])

  const handleMouseDown = (e) => {
    e.preventDefault()
    setIsResizing(true)
  }

  const handleMouseMove = (e) => {
    if (!isResizing || !containerRef.current) return

    const container = containerRef.current
    const rect = container.getBoundingClientRect()
    
    let newPosition
    if (layout === 'horizontal') {
      const mouseX = e.clientX - rect.left
      newPosition = (mouseX / rect.width) * 100
    } else {
      const mouseY = e.clientY - rect.top
      newPosition = (mouseY / rect.height) * 100
    }

    // Constrain between 20% and 80%
    newPosition = Math.max(20, Math.min(80, newPosition))
    setSplitPosition(newPosition)
  }

  const handleMouseUp = () => {
    setIsResizing(false)
  }

  const toggleLayout = () => {
    setLayout(prev => prev === 'horizontal' ? 'vertical' : 'horizontal')
  }

  const resetSplit = () => {
    setSplitPosition(50)
  }

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = layout === 'horizontal' ? 'col-resize' : 'row-resize'
      document.body.style.userSelect = 'none'

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = 'default'
        document.body.style.userSelect = 'auto'
      }
    }
  }, [isResizing, layout])

  const containerStyle = {
    flexDirection: layout === 'horizontal' ? 'row' : 'column'
  }

  const leftPanelStyle = layout === 'horizontal'
    ? { width: `${splitPosition}%`, height: '100%' }
    : { width: '100%', height: `${splitPosition}%` }

  const rightPanelStyle = layout === 'horizontal'
    ? { width: `${100 - splitPosition}%`, height: '100%' }
    : { width: '100%', height: `${100 - splitPosition}%` }

  return (
    <div className="resizable-container-wrapper">
      {/* Layout Controls */}
      <div className="layout-controls">
        <button 
          className={`layout-btn ${layout === 'horizontal' ? 'active' : ''}`}
          onClick={toggleLayout}
          title="Toggle Horizontal/Vertical Layout"
        >
          {layout === 'horizontal' ? (
            <>
              <Columns size={16} />
              <span>Horizontal</span>
            </>
          ) : (
            <>
              <Rows size={16} />
              <span>Vertical</span>
            </>
          )}
        </button>
        <button 
          className="reset-btn"
          onClick={resetSplit}
          title="Reset to 50-50 split"
        >
          Reset Split
        </button>
      </div>

      {/* Resizable Container */}
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
        >
          <div className="resizer-line">
            <div className="resizer-handle">
              {layout === 'horizontal' ? (
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
  )
}

export default ResizablePanels
