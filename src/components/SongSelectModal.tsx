import type { Beatmap } from '../types/game';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  beatmaps: Beatmap[];
  currentMapId: string;
  onSelectBeatmap: (beatmap: Beatmap) => void;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: '#22c55e',
  Normal: '#3b82f6',
  Hard: '#f59e0b',
  Insane: '#ef4444',
};

export function SongSelectModal({ isOpen, onClose, beatmaps, currentMapId, onSelectBeatmap }: Props) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        justifyContent: 'flex-end',
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(10px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          height: '100%',
          background: 'rgba(10, 10, 15, 0.95)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 20px',
          boxSizing: 'border-box',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase' }}>
              PianOSU Core
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#ffffff' }}>Song Library</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              color: '#ffffff',
              padding: '6px 14px',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            ✕ ESC
          </button>
        </div>

        {/* Список треков */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {beatmaps.map((map) => {
            const isSelected = map.id === currentMapId;
            const diffColor = DIFFICULTY_COLORS[map.difficulty] || '#3b82f6';

            return (
              <div
                key={map.id}
                onClick={() => {
                  onSelectBeatmap(map);
                  onClose();
                }}
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: 12,
                  padding: '14px 16px',
                  cursor: 'pointer',
                  border: isSelected ? '2px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: isSelected ? 'rgba(245, 158, 11, 0.12)' : 'rgba(24, 24, 30, 0.6)',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                {/* Превью картинки */}
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 8,
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: '#18181b',
                  }}
                >
                  <img src={map.bgSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                {/* Метаданные */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        fontSize: 9,
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontWeight: 800,
                        color: diffColor,
                        background: `${diffColor}20`,
                        textTransform: 'uppercase',
                      }}
                    >
                      {map.difficulty}
                    </span>
                    <span style={{ fontSize: 10, color: '#71717a', fontFamily: 'monospace' }}>
                      {map.bpm} BPM
                    </span>
                  </div>

                  <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {map.title}
                  </div>
                  <div style={{ fontSize: 11, color: '#a1a1aa', marginTop: 2 }}>
                    {map.artist}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}