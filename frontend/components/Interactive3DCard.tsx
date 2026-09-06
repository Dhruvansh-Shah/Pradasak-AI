'use client';

import React, { useState } from 'react';

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
  style = {},
  onClick,
}: Interactive3DCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      className={`relative transition-all duration-200 ease-out ${className}`}
      style={{
        transform: isHovered ? 'translateY(-3px)' : 'translateY(0px)',
        boxShadow: isHovered
          ? '0 12px 24px -6px rgba(0, 30, 64, 0.12), 0 4px 8px -2px rgba(0, 30, 64, 0.04)'
          : '0 2px 6px rgba(0, 30, 64, 0.04), 0 1px 2px rgba(0, 0, 0, 0.03)',
        transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

