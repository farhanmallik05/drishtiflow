import React, { useRef, useEffect, useState, useCallback } from 'react';

export interface Point {
  x: number;
  y: number;
}

interface ZoneCanvasProps {
  zonePoints: Point[];
  onZoneChange: (points: Point[]) => void;
  isDrawing: boolean;
  detectedBoxes: Array<{ x_min: number; y_min: number; x_max: number; y_max: number; label: string }>;
  isAlarming: boolean;
}

// Ray-casting point-in-polygon test
export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export const ZoneCanvas: React.FC<ZoneCanvasProps> = ({
  zonePoints,
  onZoneChange,
  isDrawing,
  detectedBoxes,
  isAlarming,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Draw zone polygon
      if (zonePoints.length > 0) {
        ctx.beginPath();
        ctx.moveTo(zonePoints[0].x * w, zonePoints[0].y * h);
        for (let i = 1; i < zonePoints.length; i++) {
          ctx.lineTo(zonePoints[i].x * w, zonePoints[i].y * h);
        }
        ctx.closePath();
        ctx.strokeStyle = isAlarming ? '#ef4444' : '#00f0ff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = isAlarming ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0, 240, 255, 0.05)';
        ctx.fill();

        // Draw control points
        zonePoints.forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x * w, p.y * h, 5, 0, Math.PI * 2);
          ctx.fillStyle = isAlarming ? '#ef4444' : '#00f0ff';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
        });
      }

      // Draw detection boxes
      detectedBoxes.forEach(box => {
        ctx.beginPath();
        ctx.rect(box.x_min * w, box.y_min * h, (box.x_max - box.x_min) * w, (box.y_max - box.y_min) * h);
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = 'rgba(249, 115, 22, 0.2)';
        ctx.fill();
      });
    };

    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, [zonePoints, isAlarming, detectedBoxes]);

  // Handle click-to-add zone points
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      onZoneChange([...zonePoints, { x, y }]);
    },
    [isDrawing, zonePoints, onZoneChange]
  );

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
      onClick={handleClick}
      style={{ cursor: isDrawing ? 'crosshair' : 'default' }}
    />
  );
};
