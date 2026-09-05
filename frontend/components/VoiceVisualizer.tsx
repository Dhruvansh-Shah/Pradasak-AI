'use client';

import { useEffect, useRef } from 'react';

interface VoiceVisualizerProps {
  stream: MediaStream | null;
  isListening: boolean;
}

export default function VoiceVisualizer({ stream, isListening }: VoiceVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isListening || !stream || !canvasRef.current) return;

    let animationFrameId: number;
    let audioCtx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;

    try {
      const AudioCtxCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new AudioCtxCtor();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;

      source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      const numBars = 5;
      const barWidth = 4;
      const barGap = 6;
      const totalWidth = numBars * barWidth + (numBars - 1) * barGap;

      const draw = () => {
        if (!ctx || !canvas) return;

        animationFrameId = requestAnimationFrame(draw);

        analyser?.getByteFrequencyData(dataArray);

        // Compute average volume / frequency spectrum across 5 bands
        const bandValues = [0, 0, 0, 0, 0];
        const step = Math.floor(bufferLength / numBars);

        for (let i = 0; i < numBars; i++) {
          let sum = 0;
          const start = i * step;
          const count = Math.min(step, bufferLength - start);
          for (let j = 0; j < count; j++) {
            sum += dataArray[start + j];
          }
          bandValues[i] = sum / (count || 1);
        }

        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        const startX = (width - totalWidth) / 2;
        const centerY = height / 2;

        for (let i = 0; i < numBars; i++) {
          const rawVal = bandValues[i] / 255;
          // Scale height: minimum 6px baseline, maximum height - 8px
          const barHeight = Math.max(6, rawVal * (height - 8));
          const x = startX + i * (barWidth + barGap);
          const y = centerY - barHeight / 2;

          // Color gradient from energetic orange to deep brand navy/red when speaking louder
          const color = rawVal > 0.35 ? '#dc2626' : rawVal > 0.15 ? '#e87722' : '#0b1f3a';

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, barWidth / 2);
          ctx.fill();
        }
      };

      draw();
    } catch (err) {
      console.error('[voice-visualizer-error]', err);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (source) {
        try {
          source.disconnect();
        } catch {}
      }
      if (analyser) {
        try {
          analyser.disconnect();
        } catch {}
      }
      if (audioCtx && audioCtx.state !== 'closed') {
        try {
          audioCtx.close();
        } catch {}
      }
    };
  }, [stream, isListening]);

  if (!isListening) return null;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 8px',
        height: 36,
        background: '#fee2e2',
        borderRadius: 14,
        border: '1.5px solid #fca5a5',
      }}
    >
      <canvas
        ref={canvasRef}
        width={60}
        height={28}
        style={{ display: 'block' }}
      />
    </div>
  );
}
