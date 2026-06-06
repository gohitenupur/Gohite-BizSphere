import { useState, useEffect, useRef, useCallback } from 'react';

export default function ImagePreviewModal({ isOpen, onClose, src, title = 'Document Preview' }) {
  const [scale, setScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [rotate, setRotate] = useState(0);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Reset state when modal opens or src changes
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPanX(0);
      setPanY(0);
      setRotate(0);
      // Keep maximize state or reset it? Let's keep it as is, but reset position.
    }
  }, [isOpen, src]);

  // Handle ESC key press to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !src) return null;

  const isPdf = typeof src === 'string' && (src.startsWith('data:application/pdf') || src.toLowerCase().endsWith('.pdf'));

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.25, 5));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.25, 0.25));
  const handleRotate = () => setRotate((r) => (r + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setPanX(0);
    setPanY(0);
    setRotate(0);
  };

  const handleWheel = (e) => {
    if (isPdf) return;
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  const handleMouseDown = (e) => {
    if (isPdf || scale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX - panX, y: e.clientY - panY };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    setPanX(e.clientX - dragStart.current.x);
    setPanY(e.clientY - dragStart.current.y);
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (isPdf || scale <= 1 || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setIsDragging(true);
    dragStart.current = { x: touch.clientX - panX, y: touch.clientY - panY };
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPanX(touch.clientX - dragStart.current.x);
    setPanY(touch.clientY - dragStart.current.y);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = src;
    
    // Attempt to extract extension or default to png / pdf
    let filename = title.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    if (isPdf) {
      filename += '.pdf';
    } else if (typeof src === 'string' && src.startsWith('data:image/')) {
      const match = src.match(/data:image\/([a-zA-Z+]+);base64/);
      const ext = match ? match[1] : 'png';
      filename += `.${ext}`;
    } else {
      filename += '.png';
    }
    
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in text-left"
      onClick={onClose}
    >
      <div 
        className={`flex flex-col bg-surface-container border border-outline-variant/30 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${
          isMaximized 
            ? 'fixed inset-0 rounded-none w-full h-full z-50' 
            : 'relative w-full max-w-4xl h-[80vh]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-surface-container-high border-b border-outline-variant/30 shrink-0">
          <div className="min-w-0">
            <h2 className="text-xs font-bold text-on-surface truncate">{title}</h2>
          </div>
          
          {/* Controls Bar */}
          <div className="flex items-center gap-1.5 ml-4">
            {!isPdf && (
              <>
                <button
                  type="button"
                  title="Zoom In"
                  onClick={handleZoomIn}
                  className="w-8 h-8 rounded-lg hover:bg-surface-container-highest flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">zoom_in</span>
                </button>
                <button
                  type="button"
                  title="Zoom Out"
                  onClick={handleZoomOut}
                  className="w-8 h-8 rounded-lg hover:bg-surface-container-highest flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">zoom_out</span>
                </button>
                <button
                  type="button"
                  title="Reset Zoom & Rotation"
                  onClick={handleReset}
                  className="w-8 h-8 rounded-lg hover:bg-surface-container-highest flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">restart_alt</span>
                </button>
                <button
                  type="button"
                  title="Rotate Clockwise"
                  onClick={handleRotate}
                  className="w-8 h-8 rounded-lg hover:bg-surface-container-highest flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">rotate_right</span>
                </button>
                <div className="w-[1px] h-6 bg-outline-variant/30 mx-1"></div>
              </>
            )}

            <button
              type="button"
              title="Download File"
              onClick={handleDownload}
              className="w-8 h-8 rounded-lg hover:bg-surface-container-highest flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">download</span>
            </button>
            <button
              type="button"
              title={isMaximized ? 'Minimize' : 'Maximize'}
              onClick={() => setIsMaximized(!isMaximized)}
              className="w-8 h-8 rounded-lg hover:bg-surface-container-highest flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">
                {isMaximized ? 'fullscreen_exit' : 'fullscreen'}
              </span>
            </button>
            <button
              type="button"
              title="Close (Esc)"
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-error-container/20 hover:text-error flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Modal Viewer Content */}
        <div 
          ref={containerRef}
          className="relative flex-1 overflow-hidden flex items-center justify-center bg-black/5"
          onWheel={handleWheel}
        >
          {isPdf ? (
            <iframe 
              src={src} 
              className="w-full h-full border-none bg-white" 
              title={title}
            />
          ) : (
            <div 
              className="relative w-full h-full flex items-center justify-center overflow-hidden"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUpOrLeave}
            >
              <img
                src={src}
                alt={title}
                draggable="false"
                onDragStart={(e) => e.preventDefault()}
                style={{
                  transform: `translate(${panX}px, ${panY}px) scale(${scale}) rotate(${rotate}deg)`,
                  transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                  maxHeight: '100%',
                  maxWidth: '100%',
                  objectFit: 'contain',
                }}
              />
            </div>
          )}
        </div>
        
        {/* Footer status text for help */}
        {!isPdf && (
          <div className="px-4 py-2 bg-surface-container text-[10px] text-on-surface-variant/60 flex justify-between border-t border-outline-variant/20 shrink-0">
            <span>Scroll mouse wheel to zoom. Click and drag to pan when zoomed.</span>
            <span>Zoom: {Math.round(scale * 100)}% | Rotation: {rotate}°</span>
          </div>
        )}
      </div>
    </div>
  );
}
