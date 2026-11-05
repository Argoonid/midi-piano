import { useEffect, useRef } from 'react';
import type { NoteEvent, CountdownState } from '../types/game';
import { PianoRenderer } from '../engine/PianoRenderer';

interface Props {
  notes: NoteEvent[];
  audioRef: React.RefObject<HTMLAudioElement | null>;
  bgSrc: string;
  countdown: CountdownState;
  offsetSec?: number;
  isPaused: boolean;
  speedMultiplier?: number;
  onTogglePause: () => void;
}

export function PianoCanvas({
  notes,
  audioRef,
  bgSrc,
  countdown,
  offsetSec = 0,
  isPaused,
  speedMultiplier = 1.0,
  onTogglePause,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<PianoRenderer | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const renderer = new PianoRenderer(canvasRef.current);
    rendererRef.current = renderer;
    renderer.setBackground(bgSrc);

    return () => {
      renderer.destroy();
    };
  }, [bgSrc]);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.updateActiveRange(notes);
    }
  }, [notes]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !rendererRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          rendererRef.current?.resize(width, height);
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let animId: number;

    const loop = () => {
      if (rendererRef.current && containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;

        // ПУСТОЙ ПРОГОН В 3 СЕКУНДЫ:
        // Если активен обратный отсчет, время идет от -3.0 до 0.0,
        // заставляя ноты плавно спускаться сверху еще до старта музыки.
        const currentTime = countdown.active
          ? -countdown.timeLeft
          : (audioRef.current?.currentTime || 0) + (offsetSec || 0);

        rendererRef.current.render(
          notes,
          currentTime,
          clientWidth,
          clientHeight,
          countdown,
          isPaused,
          speedMultiplier
        );
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [notes, audioRef, countdown, offsetSec, isPaused, speedMultiplier]);

  return (
    <div
      ref={containerRef}
      onClick={onTogglePause}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        cursor: 'pointer',
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}