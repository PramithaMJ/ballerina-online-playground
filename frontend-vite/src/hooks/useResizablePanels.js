/**
 * useResizablePanels Hook
 * Manages resizable panel layout and split position
 * @returns {object} Panel state and control functions
 */

import { useState, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { 
  LAYOUTS, 
  SPLIT_POSITION, 
  STORAGE_KEYS 
} from '../constants/app.constants';

export const useResizablePanels = () => {
  const [splitPosition, setSplitPosition] = useLocalStorage(
    STORAGE_KEYS.SPLIT_POSITION,
    SPLIT_POSITION.DEFAULT
  );

  const [layout, setLayout] = useLocalStorage(
    STORAGE_KEYS.PANEL_LAYOUT,
    LAYOUTS.HORIZONTAL
  );

  const [isResizing, setIsResizing] = useState(false);

  const toggleLayout = useCallback(() => {
    setLayout(prev => 
      prev === LAYOUTS.HORIZONTAL ? LAYOUTS.VERTICAL : LAYOUTS.HORIZONTAL
    );
  }, [setLayout]);

  const resetSplit = useCallback(() => {
    setSplitPosition(SPLIT_POSITION.DEFAULT);
  }, [setSplitPosition]);

  const updateSplitPosition = useCallback((position) => {
    const constrainedPosition = Math.max(
      SPLIT_POSITION.MIN,
      Math.min(SPLIT_POSITION.MAX, position)
    );
    setSplitPosition(constrainedPosition);
  }, [setSplitPosition]);

  return {
    splitPosition: parseInt(splitPosition) || SPLIT_POSITION.DEFAULT,
    setSplitPosition: updateSplitPosition,
    layout,
    setLayout,
    toggleLayout,
    resetSplit,
    isResizing,
    setIsResizing,
  };
};

export default useResizablePanels;
