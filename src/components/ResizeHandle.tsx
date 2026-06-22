import React, { useState } from 'react';

interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
  onDoubleClick?: () => void;
}

export default function ResizeHandle({ onMouseDown, onDoubleClick }: ResizeHandleProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative flex-shrink-0 w-[1px] bg-gray-200 cursor-col-resize select-none z-20"
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="absolute inset-y-0 -left-[4px] -right-[4px]" />
      <div className={`absolute inset-y-0 left-0 w-[2px] transition-all duration-100 ${
        hovered ? 'bg-blue-400 opacity-100' : 'bg-transparent opacity-0'
      }`} />
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-150 ${
        hovered ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="w-[4px] h-[28px] bg-blue-400 rounded-full shadow-sm" />
      </div>
    </div>
  );
}
