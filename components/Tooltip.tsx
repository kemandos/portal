import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: React.ReactNode;
  position: { x: number; y: number } | null;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, position }) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({
    opacity: 0,
    position: 'fixed',
    top: 0,
    left: 0,
    pointerEvents: 'none',
    zIndex: 9999
  });

  useLayoutEffect(() => {
    if (position && tooltipRef.current) {
      const { width, height } = tooltipRef.current.getBoundingClientRect();
      const padding = 12; // Gap from edges
      const verticalGap = 12; // Gap from target

      // Default: Center bottom of target
      let top = position.y + verticalGap;
      let left = position.x - (width / 2);

      // Horizontal Collision
      if (left < padding) {
        left = padding;
      } else if (left + width > window.innerWidth - padding) {
        left = window.innerWidth - width - padding;
      }

      // Vertical Collision - if it overflows bottom, flip to top
      if (top + height > window.innerHeight - padding) {
        top = position.y - height - verticalGap;
      }

      setTooltipStyle({
        position: 'fixed',
        top,
        left,
        opacity: 1,
        pointerEvents: 'none',
        zIndex: 9999,
        transform: 'none' // We manually calculate left, so no transform needed
      });
    } else {
        // Reset or hide if no position
        setTooltipStyle(prev => ({ ...prev, opacity: 0 }));
    }
  }, [position, content]);

  if (!position || !content) return null;

  return createPortal(
    <div 
        ref={tooltipRef}
        style={tooltipStyle} 
        className="transition-opacity duration-200"
    >
      <div className="bg-slate-900/90 backdrop-blur-xl text-white text-xs rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.2)] py-3 px-4 min-w-[200px] max-w-[300px] border border-white/10 ring-1 ring-black/20 animate-in fade-in zoom-in-95 duration-200">
        {content}
      </div>
    </div>,
    document.body
  );
};