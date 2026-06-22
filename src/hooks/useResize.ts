import { useCallback, useRef, useState } from 'react';

interface UseResizeOptions {
  initial: number;
  min: number;
  max: number;
  direction: 'right' | 'left';
  collapseThreshold?: number;
}

export function useResize({ initial, min, max, direction, collapseThreshold = 80 }: UseResizeOptions) {
  const [width, setWidth] = useState(initial);
  const [collapsed, setCollapsed] = useState(false);
  const widthBeforeCollapse = useRef(initial);

  const collapse = useCallback(() => {
    widthBeforeCollapse.current = width;
    setCollapsed(true);
  }, [width]);

  const expand = useCallback(() => {
    setCollapsed(false);
  }, []);

  const toggle = useCallback(() => {
    if (collapsed) {
      setCollapsed(false);
    } else {
      widthBeforeCollapse.current = width;
      setCollapsed(true);
    }
  }, [collapsed, width]);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = collapsed ? widthBeforeCollapse.current : width;
      setCollapsed(false);

      const onMouseMove = (ev: MouseEvent) => {
        const delta = direction === 'right' ? ev.clientX - startX : startX - ev.clientX;
        const next = Math.max(min, Math.min(max, startWidth + delta));
        setWidth(next);
        setCollapsed(next <= collapseThreshold);
      };

      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [collapsed, width, direction, min, max, collapseThreshold]
  );

  return { width: collapsed ? 0 : width, collapsed, collapse, expand, toggle, onMouseDown };
}
