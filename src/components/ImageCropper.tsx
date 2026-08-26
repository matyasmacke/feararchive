import { useState, useRef, useCallback, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Check, RotateCcw } from 'lucide-react';

interface ImageCropperProps {
  imageSrc: string;
  onCrop: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

export function ImageCropper({ imageSrc, onCrop, onCancel }: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [containerSize, setContainerSize] = useState(280);

  // Body scroll lock with layout shift prevention
  useEffect(() => {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, []);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImage(img);
      // Reset position
      setOffset({ x: 0, y: 0 });
      setZoom(1);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Responsive container size
  useEffect(() => {
    const updateSize = () => {
      const w = window.innerWidth;
      if (w < 400) setContainerSize(Math.min(w - 80, 240));
      else if (w < 640) setContainerSize(260);
      else setContainerSize(300);
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Draw canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !image) return;

    const size = containerSize;
    canvas.width = size;
    canvas.height = size;

    ctx.clearRect(0, 0, size, size);

    // Calculate dimensions to fit image
    const imgAspect = image.width / image.height;
    let drawW: number, drawH: number;

    if (imgAspect > 1) {
      drawH = size * zoom;
      drawW = drawH * imgAspect;
    } else {
      drawW = size * zoom;
      drawH = drawW / imgAspect;
    }

    const drawX = (size - drawW) / 2 + offset.x;
    const drawY = (size - drawH) / 2 + offset.y;

    ctx.drawImage(image, drawX, drawY, drawW, drawH);
  }, [image, zoom, offset, containerSize]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Mouse/Touch handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = () => {
    setDragging(false);
  };

  const handleZoomChange = (newZoom: number) => {
    setZoom(Math.max(0.5, Math.min(3, newZoom)));
  };

  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create output canvas at 200x200
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = 200;
    outputCanvas.height = 200;
    const outCtx = outputCanvas.getContext('2d');
    if (!outCtx) return;

    // Draw the visible area scaled to 200x200
    outCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, 200, 200);

    const dataUrl = outputCanvas.toDataURL('image/jpeg', 0.85);
    onCrop(dataUrl);
  };

  // Handle scroll wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    handleZoomChange(zoom + delta);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onCancel} />

      {/* Modal */}
      <div className="relative bg-gray-900 border border-purple-900/40 rounded-2xl shadow-2xl shadow-purple-900/30 w-full max-w-md overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-purple-900/30">
          <h3 className="text-lg font-semibold text-white">Crop Profile Picture</h3>
          <button
            onClick={onCancel}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Crop Area */}
        <div className="px-5 py-6 flex flex-col items-center gap-5">
          <p className="text-xs text-gray-500 text-center">Drag to reposition • Scroll to zoom</p>

          <div
            ref={containerRef}
            className="relative rounded-full overflow-hidden border-2 border-purple-500/50 shadow-lg shadow-purple-900/40"
            style={{ width: containerSize, height: containerSize }}
          >
            <canvas
              ref={canvasRef}
              className="cursor-grab active:cursor-grabbing touch-none"
              style={{ width: containerSize, height: containerSize }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onWheel={handleWheel}
            />

            {/* Circle overlay guide */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                boxShadow: 'inset 0 0 0 2px rgba(168, 85, 247, 0.4)',
                borderRadius: '50%',
              }}
            />
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-3 w-full max-w-xs">
            <button
              onClick={() => handleZoomChange(zoom - 0.1)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors shrink-0"
            >
              <ZoomOut className="h-4 w-4" />
            </button>

            <div className="flex-1 relative">
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.05"
                value={zoom}
                onChange={e => handleZoomChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-800 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500
                  [&::-webkit-slider-thumb]:hover:bg-purple-400 [&::-webkit-slider-thumb]:shadow-lg
                  [&::-webkit-slider-thumb]:shadow-purple-900/50 [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-purple-500 [&::-moz-range-thumb]:border-0
                  [&::-moz-range-thumb]:hover:bg-purple-400 [&::-moz-range-thumb]:cursor-pointer
                  [&::-moz-range-track]:bg-gray-800 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:h-2"
              />
            </div>

            <button
              onClick={() => handleZoomChange(zoom + 0.1)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors shrink-0"
            >
              <ZoomIn className="h-4 w-4" />
            </button>

            <button
              onClick={handleReset}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors shrink-0"
              title="Reset"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          <span className="text-xs text-gray-600">{Math.round(zoom * 100)}% zoom</span>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-5 py-4 border-t border-purple-900/30">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCrop}
            className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Check className="h-4 w-4" />
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
