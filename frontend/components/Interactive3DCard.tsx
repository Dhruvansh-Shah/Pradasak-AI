'use client';

import React, { useRef, useState, useCallback } from 'react';

interface Interactive3DCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export default function Interactive3DCard({
  children,
  className = '',
  maxTilt = 6,
  style = {},
  onClick,
}: Interactive3DCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Subtle, clean 3D physical tilt
      const rotY = ((x - centerX) / centerX) * maxTilt;
      const rotX = -((y - centerY) / centerY) * maxTilt;

      setRotateX(rotX);
      setRotateY(rotY);
    },
    [maxTilt]
  );

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`relative transition-all duration-200 ease-out ${className}`}
      style={{
        perspective: 1000,
        transform: isHovered
          ? `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)',
        transformStyle: 'preserve-3d',
        willChange: 'transform, box-shadow',
        boxShadow: isHovered
          ? '0 16px 32px -8px rgba(0, 30, 64, 0.12), 0 4px 8px -2px rgba(0, 30, 64, 0.04), 0 0 0 1px rgba(0, 51, 102, 0.12)'
          : '0 2px 6px rgba(0, 30, 64, 0.04), 0 1px 2px rgba(0, 0, 0, 0.03)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
