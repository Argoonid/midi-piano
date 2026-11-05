import { useRef } from 'react';
import type { Beatmap } from '../types/game';

interface Props {
  beatmap: Beatmap;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onMidiUpload: (file: File) => void;
  onOpenLibrary: () => void;
}

export function TopBar({ beatmap, isPlaying, onTogglePlay, onMidiUpload, onOpenLibrary }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        left: 16,
        right: 16,
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        pointerEvents: 'none',
      }}
    >
      {/* Карточка трека (клик открывает меню библиотеки) */}
      <div
        onClick={onOpenLibrary}
        style={{
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '6px 16px 6px 6px',
          borderRadius: 12,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          cursor: 'pointer',
          transition: 'background 0.2s ease',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            overflow: 'hidden',
            flexShrink: 0,
            background: '#27272a',
          }}
        >
          <img
            src={beatmap.bgSrc}
            alt="Cover"
            style={{ width: 40, height: 40, objectFit: 'cover', display: 'block' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 200 }}>
          <span
            style={{
              fontSize: 10,
              color: '#fbbf24',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            {beatmap.artist}
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: '#ffffff',
            }}
          >
            {beatmap.title}
          </span>
        </div>
      </div>

      {/* Кнопки управления */}
      <div style={{ pointerEvents: 'auto', display: 'flex', gap: 8 }}>
        <input
          type="file"
          accept=".mid,.midi"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onMidiUpload(file);
          }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: '8px 16px',
            borderRadius: 10,
            background: 'rgba(24, 24, 27, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#e4e4e7',
            fontSize: 12,
            fontFamily: 'monospace',
            cursor: 'pointer',
          }}
        >
          + BEATMAP
        </button>
        <button
          onClick={onTogglePlay}
          style={{
            padding: '8px 24px',
            borderRadius: 10,
            background: '#f59e0b',
            border: 'none',
            color: '#000000',
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 1,
            cursor: 'pointer',
          }}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
      </div>
    </div>
  );
}