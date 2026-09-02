'use client';

import { useEffect, useRef, useState } from 'react';
import { renderText } from '@/lib/textFormat';

interface Props {
  text: string;
  /** When false (e.g. messages loaded from chat history), the full text
   *  renders immediately with no animation. */
  animate: boolean;
  color?: string;
  /** Called on every reveal tick — handy for auto-scrolling as text grows. */
  onTick?: () => void;
  /** Called once the full text has been revealed. */
  onDone?: () => void;
}

/**
 * Reveals `text` progressively for an authentic "typing" feel instead of
 * dumping the full answer into the chat in one frame.
 *
 * Total reveal time is bounded (roughly 1–1.5s) regardless of message
 * length — long answers type faster per character rather than taking
 * forever, short answers still get a visible typing beat.
 */
export default function TypewriterText({ text, animate, color, onTick, onDone }: Props) {
  const [display, setDisplay] = useState(animate ? '' : text);
  const [done, setDone] = useState(!animate);
  const doneFiredRef = useRef(false);

  useEffect(() => {
    if (!animate) {
      setDisplay(text);
      setDone(true);
      return;
    }

    setDisplay('');
    setDone(false);
    doneFiredRef.current = false;

    let index = 0;
    const TOTAL_TICKS = 70; // ~1.1s at 16ms/tick, independent of message length
    const TICK_MS = 16;
    const charsPerTick = Math.max(1, Math.ceil(text.length / TOTAL_TICKS));

    const id = setInterval(() => {
      index += charsPerTick;
      if (index >= text.length) {
        setDisplay(text);
        if (!doneFiredRef.current) {
          doneFiredRef.current = true;
          setDone(true);
          onDone?.();
        }
        clearInterval(id);
      } else {
        setDisplay(text.slice(0, index));
        onTick?.();
      }
    }, TICK_MS);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, animate]);

  const lines = display.split('\n');

  return (
    <div style={{ whiteSpace: 'pre-wrap' }}>
      {lines.map((line, i) => (
        <p key={i} style={{ margin: i > 0 ? '6px 0 0' : 0, color }}>
          {renderText(line)}
          {!done && i === lines.length - 1 && (
            <span
              style={{
                display: 'inline-block',
                width: 2,
                height: '1em',
                background: color || 'currentColor',
                marginLeft: 2,
                verticalAlign: 'text-bottom',
                animation: 'pai-caret-blink 0.9s steps(1) infinite',
              }}
            />
          )}
        </p>
      ))}
      <style>{`
        @keyframes pai-caret-blink { 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}
