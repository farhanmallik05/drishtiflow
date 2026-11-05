"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";

export interface Point {
  x: number; // 0.0 to 1.0
  y: number; // 0.0 to 1.0
}

interface ZoneCanvasProps {
  zonePoints: Point[];
  onZoneChange: (points: Point[]) => void;
  isDrawing: boolean;
  detectedBoxes?: Array<{ x_min: number; y_min: number; x_max: number; y_max: number; label: string }>;
  isAlarming?: boolean;
}

// Ray-casting point-in-polygon algorithm
export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export const ZoneCanvas: React.FC<ZoneCanvasProps> = ({
  zonePoints,
  onZoneChange,
  isDrawing,
  detectedBoxes = [],
  isAlarming = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<Point[]>(zonePoints);

  useEffect(() => {
    setPoints(zonePoints);
  }, [zonePoints]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Restricted Polygon Zone
    if (points.length > 0) {
      ctx.beginPath();
      ctx.moveTo(points[0].x * width, points[0].y * height);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x * width, points[i].y * height);
      }
      if (!isDrawing && points.length >= 3) {
        ctx.closePath();
      }

      // Fill with warning red/amber tint
      ctx.fillStyle = isAlarming ? "rgba(239, 68, 68, 0.4)" : "rgba(249, 115, 22, 0.25)";
      ctx.fill();

      // Border stroke
      ctx.strokeStyle = isAlarming ? "#ef4444" : "#f97316";
      ctx.lineWidth = isAlarming ? 3 : 2;
      ctx.setLineDash(isDrawing ? [6, 4] : []);
      ctx.stroke();

      // Draw point anchors
      points.forEach((p, idx) => {
        ctx.beginPath();
        ctx.arc(p.x * width, p.y * height, 5, 0, 2 * Math.PI);
        ctx.fillStyle = isAlarming ? "#ef4444" : "#fbbf24";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "10px sans-serif";
        ctx.fillText(`P${idx + 1}`, p.x * width + 8, p.y * height - 4);
      });
    }

    // 2. Draw Detected Bounding Boxes
    detectedBoxes.forEach((box) => {
      const bx = box.x_min * width;
      const by = box.y_min * height;
      const bw = (box.x_max - box.x_min) * width;
      const bh = (box.y_max - box.y_min) * height;

      // Check if feet/bottom-center is in zone
      const feetPoint: Point = {
        x: (box.x_min + box.x_max) / 2,
        y: box.y_max,
      };
      const inside = isPointInPolygon(feetPoint, points);

      ctx.beginPath();
      ctx.rect(bx, by, bw, bh);
      ctx.strokeStyle = inside ? "#ef4444" : "#3b82f6";
      ctx.lineWidth = 2.5;
      ctx.setLineDash([]);
      ctx.stroke();

      // Label tag
      ctx.fillStyle = inside ? "#ef4444" : "#3b82f6";
      ctx.fillRect(bx, by - 22, 110, 22);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText(`${box.label} ${inside ? "⚠️ IN ZONE" : "OUTSIDE"}`, bx + 4, by - 6);

      // Foot anchor point
      ctx.beginPath();
      ctx.arc(feetPoint.x * width, feetPoint.y * height, 4, 0, 2 * Math.PI);
      ctx.fillStyle = inside ? "#ef4444" : "#3b82f6";
      ctx.fill();
    });
  }, [points, isDrawing, detectedBoxes, isAlarming]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const newPoints = [...points, { x, y }];
    setPoints(newPoints);
    onZoneChange(newPoints);
  };

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={360}
      onClick={handleCanvasClick}
      className={`absolute inset-0 w-full h-full pointer-events-auto ${
        isDrawing ? "cursor-crosshair" : "cursor-default"
      }`}
    />
  );
};

