import type { Beatmap, GameSettings, MidiTrackInfo } from '../types/game';
import { Play, RotateCcw, Home, Gauge, FastForward, Clock, Layers } from 'lucide-react';

interface Props {
  beatmap: Beatmap;
  currentTime: number;
  duration: number;
  settings: GameSettings;
  tracksInfo: MidiTrackInfo[];
  enabledTracks: Set<number>;
  onToggleTrack: (trackIndex: number) => void;
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
  onSeek: (time: number) => void;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
}

export function PauseModal({
  beatmap,
  currentTime,
  duration,
  settings,
  tracksInfo,
  enabledTracks,
  onToggleTrack,
  onResume,
  onRestart,
  onExit,
  onSeek,
  onUpdateSettings,
}: Props) {
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5];
  const scrollOptions = [0.8, 1.0, 1.2, 1.5];

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 50,
        background: 'rgba(5, 5, 8, 0.8)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 580,
          background: 'rgba(18, 18, 24, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 22,
          padding: '24px 28px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(245, 158, 11, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          maxHeight: '94vh',
          overflowY: 'auto',
        }}
      >
        {/* Заголовок */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase' }}>
              PianOSU // Paused
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', marginTop: 2 }}>
              {beatmap.title}
            </div>
            <div style={{ fontSize: 11, color: '#a1a1aa' }}>{beatmap.artist}</div>
          </div>
          <div
            style={{
              padding: '4px 10px',
              borderRadius: 8,
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#f59e0b',
              fontSize: 11,
              fontWeight: 800,
              fontFamily: 'monospace',
            }}
          >
            {settings.playbackRate}x
          </div>
        </div>

        {/* Таймлайн */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'monospace', color: '#a1a1aa' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={12} color="#f59e0b" /> {formatTime(currentTime)}
            </span>
            <span>{formatTime(duration)}</span>
          </div>

          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              onSeek(ratio * duration);
            }}
            style={{
              height: 8,
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: 6,
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                boxShadow: '0 0 15px rgba(245, 158, 11, 0.6)',
                borderRadius: 6,
              }}
            />
          </div>
        </div>

        {/* МИКШЕР ДОРОЖЕК MIDI (Позволяет выключить лишний дублирующий трек) */}
        {tracksInfo.length > 1 && (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 14,
              padding: '12px 14px',
            }}
          >
            <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Layers size={13} /> MIDI TRACKS (ВЫБОР ДОРОЖЕК)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {tracksInfo.map((t) => {
                const isEnabled = enabledTracks.has(t.index);
                return (
                  <div
                    key={t.index}
                    onClick={() => onToggleTrack(t.index)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: isEnabled ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                      border: isEnabled ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: isEnabled ? '#38bdf8' : '#52525b',
                        }}
                      />
                      <span style={{ fontSize: 12, fontWeight: 700, color: isEnabled ? '#ffffff' : '#71717a' }}>
                        {t.name}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, fontFamily: 'monospace', color: isEnabled ? '#38bdf8' : '#52525b' }}>
                      {t.noteCount} нот {isEnabled ? '[ВКЛ]' : '[ВЫКЛ]'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Скорость и Скролл */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 12,
              padding: '10px 12px',
            }}
          >
            <div style={{ fontSize: 10, color: '#a1a1aa', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Gauge size={12} color="#38bdf8" /> TRACK SPEED
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {speedOptions.map((rate) => (
                <button
                  key={rate}
                  onClick={() => onUpdateSettings({ playbackRate: rate })}
                  style={{
                    flex: 1,
                    padding: '5px 0',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    background: settings.playbackRate === rate ? '#38bdf8' : 'rgba(255, 255, 255, 0.06)',
                    color: settings.playbackRate === rate ? '#000000' : '#d4d4d8',
                  }}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 12,
              padding: '10px 12px',
            }}
          >
            <div style={{ fontSize: 10, color: '#a1a1aa', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <FastForward size={12} color="#a855f7" /> FALL SPEED
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {scrollOptions.map((speed) => (
                <button
                  key={speed}
                  onClick={() => onUpdateSettings({ noteSpeedMultiplier: speed })}
                  style={{
                    flex: 1,
                    padding: '5px 0',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    background: settings.noteSpeedMultiplier === speed ? '#a855f7' : 'rgba(255, 255, 255, 0.06)',
                    color: settings.noteSpeedMultiplier === speed ? '#ffffff' : '#d4d4d8',
                  }}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Кнопки действий */}
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button
            onClick={onExit}
            style={{
              flex: 1,
              padding: '11px',
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#d4d4d8',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Home size={14} /> MENU
          </button>

          <button
            onClick={onRestart}
            style={{
              flex: 1,
              padding: '11px',
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#d4d4d8',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <RotateCcw size={14} /> RESTART
          </button>

          <button
            onClick={onResume}
            style={{
              flex: 2,
              padding: '11px',
              borderRadius: 10,
              background: '#f59e0b',
              border: 'none',
              color: '#000000',
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: 1,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              boxShadow: '0 0 20px rgba(245, 158, 11, 0.4)',
            }}
          >
            <Play size={15} fill="#000" /> RESUME
          </button>
        </div>
      </div>
    </div>
  );
}