'use client';

import React from 'react';
import Image from 'next/image';

interface EmblemProps {
  className?: string;
  size?: number;
  invert?: boolean;
}

export default function EmblemOfIndia({
  className = '',
  size = 36,
  invert = false,
}: EmblemProps) {
  return (
    <div
      className={`inline-flex items-center justify-center flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        position: 'relative',
      }}
    >
      <img
        src="/emblem-india.png"
        alt="Government of India Emblem"
        width={size}
        height={size}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          filter: invert ? 'brightness(0) invert(1)' : 'none',
        }}
      />
    </div>
  );
}
