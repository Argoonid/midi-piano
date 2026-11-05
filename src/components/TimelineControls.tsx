interface Props {
  currentTime: number;
  duration: number;
  offsetMs: number;
  onSeek: (time: number) => void;
  onOffsetChange: (delta: number) => void;
}

export function TimelineControls({ currentTime, duration, offsetMs, onSeek, onOffsetChange }: Props) {
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 8,
        left: 16,
        right: 16,
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '6px 14px',
        borderRadius: 10,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        color: '#ffffff',
        pointerEvents: 'auto',
      }}
    >
      {/* Время */}
      <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#a1a1aa', minWidth: 70 }}>
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>

      {/* Полоса перемотки */}
      <div
        style={{
          position: 'relative',
          flex: 1,
          height: 6,
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 3,
          cursor: 'pointer',
        }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const ratio = Math.max(0, Math.min(1, clickX / rect.width));
          onSeek(ratio * duration);
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            background: '#f59e0b',
            borderRadius: 3,
            boxShadow: '0 0 10px rgba(245, 158, 11, 0.5)',
          }}
        />
      </div>

      {/* Калибровка Оффсета */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: 10 }}>
        <span style={{ fontSize: 10, color: '#71717a', fontFamily: 'monospace' }}>OFFSET:</span>
        <button
          onClick={() => onOffsetChange(-10)}
          style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', borderRadius: 4, width: 22, height: 22, cursor: 'pointer', fontSize: 12 }}
        >
          -
        </button>
        <span style={{ fontSize: 11, fontFamily: 'monospace', color: offsetMs >= 0 ? '#38bdf8' : '#f43f5e', minWidth: 45, textAlign: 'center' }}>
          {offsetMs > 0 ? `+${offsetMs}` : offsetMs}ms
        </span>
        <button
          onClick={() => onOffsetChange(10)}
          style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', borderRadius: 4, width: 22, height: 22, cursor: 'pointer', fontSize: 12 }}
        >
          +
        </button>
      </div>
    </div>
  );
}