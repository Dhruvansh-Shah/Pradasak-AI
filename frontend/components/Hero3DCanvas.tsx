'use client';

import React, { useEffect, useRef } from 'react';

interface NetworkNode3D {
  x: number;
  y: number;
  z: number;
  radius: number;
  color: string;
  label: string;
  type: 'hub' | 'scheme' | 'bank' | 'doc' | 'subsidy' | 'dbt';
  subText?: string;
}

export default function Hero3DCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let dpr = window.devicePixelRatio || 1;
    let width = (canvas.parentElement?.clientWidth || 460);
    let height = (canvas.parentElement?.clientHeight || 380);

    const setupCanvas = () => {
      if (!canvas || !canvas.parentElement) return;
      dpr = window.devicePixelRatio || 1;
      width = canvas.parentElement.clientWidth;
      height = canvas.parentElement.clientHeight || 380;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    setupCanvas();
    window.addEventListener('resize', setupCanvas);

    // Official Network Nodes for National Concessional Scheme Architecture
    const nodes: NetworkNode3D[] = [
      { x: 0, y: 0, z: 0, radius: 26, color: '#fe9832', label: 'NSFDC HUB', type: 'hub', subText: 'Central Portal' },
      { x: 130, y: -45, z: 50, radius: 15, color: '#38bdf8', label: 'Term Loan', type: 'scheme', subText: '6% – 8%' },
      { x: -125, y: 40, z: -40, radius: 14, color: '#34d399', label: 'Mahila Samriddhi', type: 'scheme', subText: '4% p.a.' },
      { x: 65, y: 110, z: -70, radius: 13, color: '#fbbf24', label: '100+ SCAs & Banks', type: 'bank', subText: 'Channel Partners' },
      { x: -85, y: -105, z: 60, radius: 13, color: '#a78bfa', label: 'Doc Verification', type: 'doc', subText: 'Caste & Income' },
      { x: 145, y: 65, z: -25, radius: 12, color: '#f472b6', label: 'Moratorium Math', type: 'subsidy', subText: '3–12 Months' },
      { x: -135, y: -45, z: -60, radius: 12, color: '#60a5fa', label: 'DBT Direct', type: 'dbt', subText: 'Benefit Transfer' },
    ];

    // Background ambient nodes
    const ambientStars = Array.from({ length: 32 }, () => ({
      x: (Math.random() - 0.5) * 380,
      y: (Math.random() - 0.5) * 380,
      z: (Math.random() - 0.5) * 320,
      size: Math.random() * 1.5 + 0.8,
    }));

    let rotY = 0;
    let rotX = 0.2;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse easing
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      rotY += 0.005 + mouseRef.current.x * 0.00025;
      rotX = 0.18 + mouseRef.current.y * 0.00025;

      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      const fov = 360;
      const centerX = width / 2;
      const centerY = height / 2;

      // 3D Projection Calculation
      const project = (x: number, y: number, z: number) => {
        const x1 = x * cosY - z * sinY;
        const z1 = z * cosY + x * sinY;

        const y2 = y * cosX - z1 * sinX;
        const z2 = z1 * cosX + y * sinX;

        const scale = fov / (fov + z2 + 180);
        const px = centerX + x1 * scale;
        const py = centerY + y2 * scale;
        const alpha = Math.max(0.15, Math.min(1, (z2 + 200) / 400));

        return { px, py, scale, z: z2, alpha };
      };

      // Draw subtle ambient dust
      ambientStars.forEach((star) => {
        const proj = project(star.x, star.y, star.z);
        if (proj.scale > 0) {
          ctx.beginPath();
          ctx.arc(proj.px, proj.py, star.size * proj.scale, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(186, 215, 255, ${proj.alpha * 0.35})`;
          ctx.fill();
        }
      });

      // Project all main network nodes
      const projectedNodes = nodes.map((node, i) => {
        if (i !== 0) {
          node.x += Math.sin(Date.now() * 0.0012 + i) * 0.18;
          node.y += Math.cos(Date.now() * 0.0012 + i) * 0.18;
        }
        const proj = project(node.x, node.y, node.z);
        return { node, ...proj };
      });

      // Sort by Z for realistic depth layering
      projectedNodes.sort((a, b) => a.z - b.z);

      const hubProj = projectedNodes.find((p) => p.node.type === 'hub') || projectedNodes[0];

      // Draw 3D Connection Lines & Flow Pulses
      projectedNodes.forEach((p) => {
        if (p.node.type !== 'hub') {
          ctx.beginPath();
          ctx.moveTo(hubProj.px, hubProj.py);
          ctx.lineTo(p.px, p.py);

          const grad = ctx.createLinearGradient(hubProj.px, hubProj.py, p.px, p.py);
          grad.addColorStop(0, `rgba(254, 152, 50, ${Math.min(p.alpha, 0.5)})`);
          grad.addColorStop(1, `rgba(56, 189, 248, ${Math.min(p.alpha, 0.35)})`);

          ctx.strokeStyle = grad;
          ctx.lineWidth = Math.max(1, 1.4 * p.scale);
          ctx.stroke();

          // Animated data photon pulse
          const progress = (Date.now() * 0.0012 + p.z * 0.008) % 1;
          const photonX = hubProj.px + (p.px - hubProj.px) * progress;
          const photonY = hubProj.py + (p.py - hubProj.py) * progress;

          ctx.beginPath();
          ctx.arc(photonX, photonY, 2.2 * p.scale, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // Draw Orbiting Guideline Ring
      ctx.beginPath();
      for (let angle = 0; angle <= Math.PI * 2; angle += 0.08) {
        const rx = Math.cos(angle) * 145;
        const rz = Math.sin(angle) * 145;
        const ringProj = project(rx, 0, rz);
        if (angle === 0) {
          ctx.moveTo(ringProj.px, ringProj.py);
        } else {
          ctx.lineTo(ringProj.px, ringProj.py);
        }
      }
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw 3D Nodes
      projectedNodes.forEach(({ node, px, py, scale, alpha }) => {
        const radius = node.radius * scale;
        if (radius <= 0) return;

        // Outer soft glow
        const glowGrad = ctx.createRadialGradient(px, py, 0, px, py, radius * 2);
        glowGrad.addColorStop(0, `${node.color}66`);
        glowGrad.addColorStop(0.5, `${node.color}22`);
        glowGrad.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(px, py, radius * 2, 0, Math.PI * 2);
        ctx.fillStyle = glowGrad;
        ctx.fill();

        // 3D Sphere gradient body
        const sphereGrad = ctx.createRadialGradient(
          px - radius * 0.3,
          py - radius * 0.3,
          radius * 0.1,
          px,
          py,
          radius
        );
        sphereGrad.addColorStop(0, '#ffffff');
        sphereGrad.addColorStop(0.4, node.color);
        sphereGrad.addColorStop(1, '#001e40');

        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fillStyle = sphereGrad;
        ctx.shadowColor = node.color;
        ctx.shadowBlur = node.type === 'hub' ? 14 : 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Outer rim ring
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1.2 * scale;
        ctx.stroke();

        // Structured Node Label Card
        if (node.label) {
          const fontSize = Math.max(10, Math.round(11 * scale));
          ctx.font = `600 ${fontSize}px "Noto Sans", Inter, sans-serif`;
          const textMetrics = ctx.measureText(node.label);
          const cardWidth = textMetrics.width + 14 * scale;
          const cardHeight = 20 * scale;
          const cardY = py + radius + 7 * scale;

          // Card Background
          ctx.fillStyle = 'rgba(0, 24, 51, 0.9)';
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.lineWidth = 1;

          ctx.beginPath();
          ctx.roundRect(px - cardWidth / 2, cardY, cardWidth, cardHeight, 4 * scale);
          ctx.fill();
          ctx.stroke();

          // Card Title
          ctx.fillStyle = '#f8fafc';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(node.label, px, cardY + cardHeight / 2);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - width / 2;
      const y = e.clientY - rect.top - height / 2;
      mouseRef.current.targetX = x;
      mouseRef.current.targetY = y;
    };

    const onMouseLeave = () => {
      mouseRef.current.targetX = 0;
      mouseRef.current.targetY = 0;
    };

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);

    return () => {
      window.removeEventListener('resize', setupCanvas);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative w-full h-[360px] flex items-center justify-center overflow-hidden rounded-lg">
      <canvas
        ref={canvasRef}
        className="relative z-10 cursor-grab active:cursor-grabbing w-full h-full"
      />
    </div>
  );
}
