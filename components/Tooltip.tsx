import React from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: React.ReactNode;
  position: { x: number; y: number } | null;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, position }) => {
  if (!position || !content) return null;

  const style: React.CSSProperties = {
    position: 'fixed',
    top: position.y + 12, 
    left: position.x,
    transform: 'translateX(-50%)', 
    zIndex: 9999,
    pointerEvents: 'none',
  };

  return createPortal(
    <div style={style} className="animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-slate-900/80 backdrop-blur-xl text-white text-xs rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.2)] py-3 px-4 min-w-[200px] border border-white/10 ring-1 ring-black/20">
        {content}
      </div>
    </div>,
    document.body
  );
};