"use client";

import React, { useEffect, useRef } from "react";

type InfinityAnimationProps = {
  darkMode: boolean;
};

export default function InfinityAnimation({ darkMode }: InfinityAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;

      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Animation parameters
    let progress = 0;
    const speed = 0.004; // Speed of the spark
    const lineWidth = 2;

    // Infinity curve parameters (scaled to canvas)
    const scale = Math.min(canvas.width, canvas.height) * 0.25;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Parametric equations for infinity symbol (lemniscate)
    const getPoint = (t: number) => {
      const denominator = 1 + Math.sin(t) ** 2;
      const x = centerX + (scale * Math.cos(t)) / denominator;
      const y = centerY + (scale * Math.sin(t) * Math.cos(t)) / denominator;
      return { x, y };
    };

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update progress
      progress += speed;
      if (progress > Math.PI * 2) {
        progress = 0;
      }

      // Draw the FULL infinity symbol (always visible)
      ctx.strokeStyle = darkMode ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)";
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      const fullPoints = 200;
      for (let i = 0; i < fullPoints; i++) {
        const t = (i / fullPoints) * Math.PI * 2;
        const point = getPoint(t);

        if (i === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      }
      ctx.stroke();

      // Draw a GLOWING SPARK at the current position
      const currentPoint = getPoint(progress);

      // Outer glow (largest)
      ctx.beginPath();
      ctx.arc(currentPoint.x, currentPoint.y, 20, 0, Math.PI * 2);
      const outerGlow = ctx.createRadialGradient(
        currentPoint.x, currentPoint.y, 0,
        currentPoint.x, currentPoint.y, 20
      );
      outerGlow.addColorStop(0, darkMode ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)");
      outerGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = outerGlow;
      ctx.fill();

      // Middle glow
      ctx.beginPath();
      ctx.arc(currentPoint.x, currentPoint.y, 10, 0, Math.PI * 2);
      const middleGlow = ctx.createRadialGradient(
        currentPoint.x, currentPoint.y, 0,
        currentPoint.x, currentPoint.y, 10
      );
      middleGlow.addColorStop(0, darkMode ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)");
      middleGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = middleGlow;
      ctx.fill();

      // Core spark (brightest)
      ctx.beginPath();
      ctx.arc(currentPoint.x, currentPoint.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = darkMode ? "#ffffff" : "#000000";
      ctx.fill();

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [darkMode]);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
    </div>
  );
}
