'use client';

import { Volume2, Square, Loader2 } from 'lucide-react';

export interface VoiceButtonProps {
  isPlaying: boolean;
  isLoading?: boolean;
  isAnyLoading?: boolean;
  disabled?: boolean;
  text?: string;
  onPlay: () => void;
  onStop: () => void;
  label?: string;
  playingLabel?: string;
  loadingLabel?: string;
  title?: string;
  variant?: 'outline' | 'glass' | 'subtle';
  size?: 'sm' | 'md';
  className?: string;
  style?: React.CSSProperties;
}

export default function VoiceButton({
  isPlaying,
  isLoading = false,
  isAnyLoading = false,
  disabled = false,
  text,
  onPlay,
  onStop,
  label = 'Listen',
  playingLabel = 'Stop',
  loadingLabel = 'Loading...',
  title = 'Listen to voice narration',
  variant = 'outline',
  size = 'md',
  className = '',
  style,
}: VoiceButtonProps) {
  const isSm = size === 'sm';
  const isDisabled = isLoading || isAnyLoading || disabled;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (isPlaying) {
          onStop();
        } else {
          onPlay();
        }
      }}
      disabled={isDisabled}
      title={isPlaying ? 'Stop voice playback' : title}
      aria-label={isPlaying ? 'Stop voice playback' : title}
      className={`voice-btn voice-btn-${variant} ${isPlaying ? 'voice-btn-playing' : ''} ${className}`}
      style={{
        padding: isSm ? '4px 10px' : '6px 14px',
        fontSize: isSm ? 11.5 : 12.5,
        opacity: isAnyLoading ? 0.6 : 1,
        ...style,
      }}
    >
      {isLoading ? (
        <Loader2 size={isSm ? 12 : 13} style={{ animation: 'spin 1s linear infinite' }} />
      ) : isPlaying ? (
        <Square size={isSm ? 11 : 12} fill="currentColor" />
      ) : (
        <Volume2 size={isSm ? 13 : 14} />
      )}
      <span>{isLoading ? loadingLabel : isPlaying ? playingLabel : label}</span>
    </button>
  );
}
