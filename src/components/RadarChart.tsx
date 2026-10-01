import React, { useEffect, useRef } from 'react';

interface RadarChartProps {
  data?: {
    label: string;
    value: number; // 0 to 1
  }[];
}

const DEFAULT_METRICS = [
  { label: 'Attendance', value: 0.94 },
  { label: 'Workshops', value: 0.82 },
  { label: 'Hackathons', value: 0.88 },
  { label: 'Quorum', value: 0.91 },
  { label: 'Projects', value: 0.85 },
  { label: 'Community', value: 0.89 }
];

export const RadarChart: React.FC<RadarChartProps> = ({ data = DEFAULT_METRICS }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    const width = 280;
    const height = 240;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 75;
    const totalAxes = data.length;

    // Draw concentric polygon web levels
    for (let level = 1; level <= 4; level++) {
      const r = (radius / 4) * level;
      ctx.beginPath();
      ctx.strokeStyle = '#F1F5F9';
      ctx.lineWidth = 1.2;
      for (let i = 0; i < totalAxes; i++) {
        const angle = (Math.PI * 2 / totalAxes) * i - Math.PI / 2;
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Draw axis lines and text labels
    ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#64748B';
    ctx.textAlign = 'center';

    for (let i = 0; i < totalAxes; i++) {
      const angle = (Math.PI * 2 / totalAxes) * i - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      // Radial axis line
      ctx.beginPath();
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();

      // Label with slight offset
      const labelX = centerX + (radius + 22) * Math.cos(angle);
      const labelY = centerY + (radius + 22) * Math.sin(angle) + 3;
      ctx.fillText(data[i].label, labelX, labelY);
    }

    // Draw filled polygon data shape
    ctx.beginPath();
    ctx.fillStyle = 'rgba(245, 158, 11, 0.25)'; // UByTeS amber glow
    ctx.strokeStyle = '#75121E'; // UByTeS Maroon outline
    ctx.lineWidth = 2.5;

    for (let i = 0; i < totalAxes; i++) {
      const angle = (Math.PI * 2 / totalAxes) * i - Math.PI / 2;
      const r = radius * data[i].value;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw accent vertex dots
    for (let i = 0; i < totalAxes; i++) {
      const angle = (Math.PI * 2 / totalAxes) * i - Math.PI / 2;
      const r = radius * data[i].value;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#F59E0B';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [data]);

  return (
    <div className="w-full flex items-center justify-center relative">
      <canvas ref={canvasRef} className="block" />
    </div>
  );
};
