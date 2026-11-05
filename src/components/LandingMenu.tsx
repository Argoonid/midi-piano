import { useState, useRef, useEffect } from 'react';
import type { Beatmap, NoteEvent } from '../types/game';
import { CreateBeatmapModal } from './CreateBeatmapModal';
import { Play, Flame, Search, Plus, Disc, Activity, Maximize2, Minimize2, Music } from 'lucide-react';

interface Props {
  beatmaps: Beatmap[];
  selectedMap: Beatmap;
  noteCount: number;
  onSelectMap: (map: Beatmap) => void;
  onStartGame: () => void;
  onCreateBeatmap: (beatmap: Beatmap, notes: NoteEvent[]) => void;
}

const DIFF_COLORS: Record<string, string> = {
  Easy: '#22c55e',
  Normal: '#38bdf8',
  Hard: '#f59e0b',
  Insane: '#f43f5e',
};

export function LandingMenu({
  beatmaps,
  selectedMap,
  noteCount,
  onSelectMap,
  onStartGame,
  onCreateBeatmap,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const activeCardRef = useRef<HTMLDivElement | null>(null);

  // Исключаем дубликаты треков по id
  const uniqueBeatmaps = Array.from(new Map(beatmaps.map((m) => [m.id, m])).values());

  const filteredMaps = uniqueBeatmaps.filter(
    (m) =>
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedIndex = filteredMaps.findIndex((m) => m.id === selectedMap.id);

  // Автоскролл к выбранной карточке при смене трека
  useEffect(() => {
    if (activeCardRef.current) {
      activeCardRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedMap.id]);

  // Управление с клавиатуры как в osu! (Стрелки Вверх/Вниз + Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Игнорируем нажатия, если открыт модал добавления или поле поиска активно
      if (isModalOpen || document.activeElement?.tagName === 'INPUT') return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIdx = (selectedIndex + 1) % filteredMaps.length;
        if (filteredMaps[nextIdx]) onSelectMap(filteredMaps[nextIdx]);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIdx = (selectedIndex - 1 + filteredMaps.length) % filteredMaps.length;
        if (filteredMaps[prevIdx]) onSelectMap(filteredMaps[prevIdx]);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleStart();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, filteredMaps, isModalOpen]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
        if ('orientation' in screen && 'lock' in (screen.orientation as any)) {
          await (screen.orientation as any).lock('landscape').catch(() => {});
        }
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (e) {
      console.warn('Fullscreen toggle error:', e);
    }
  };

  const handleStart = () => {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    onStartGame();
  };

  return (
    <>
      <style>
        {`
          .osu-carousel-scroll {
            scrollbar-width: none;
            -ms-overflow-style: none;
            -webkit-overflow-scrolling: touch;
            scroll-behavior: smooth;
            scroll-snap-type: y proximity;
            overscroll-behavior-y: contain;
          }
          .osu-carousel-scroll::-webkit-scrollbar {
            display: none;
          }
          .card-snap-item {
            scroll-snap-align: center;
          }
        `}
      </style>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 50,
          background: '#050508',
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'nowrap',
          overflow: 'hidden',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          userSelect: 'none',
        }}
      >
        {/* 1. Атмосферный динамический фон */}
        <div
          style={{
            position: 'absolute',
            inset: -50,
            backgroundImage: `url(${selectedMap.bgSrc})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(55px) brightness(0.24) saturate(1.3)',
            transform: 'scale(1.08)',
            transition: 'background-image 0.5s ease',
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, rgba(5,5,8,0.2) 0%, rgba(5,5,8,0.85) 60%, rgba(5,5,8,0.98) 100%)',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />

        {/* 2. ЛЕВАЯ КОЛОННА: Презентация выбранного трека (Showcase) */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: 'min(24px, 4vh) min(36px, 4vw)',
            boxSizing: 'border-box',
          }}
        >
          {/* Шапка Showcase */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 25px rgba(245, 158, 11, 0.45)',
                }}
              >
                <Disc size={20} color="#000" />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: 1.2, color: '#ffffff', lineHeight: 1 }}>
                  Pian<span style={{ color: '#f59e0b' }}>OSU!</span>
                </div>
                <div style={{ fontSize: 8, color: '#71717a', letterSpacing: 2, textTransform: 'uppercase', marginTop: 2 }}>
                  Rhythm Engine Core
                </div>
              </div>
            </div>

            <button
              onClick={toggleFullscreen}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#d4d4d8',
                padding: '6px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 10,
                fontWeight: 700,
                transition: 'all 0.15s ease',
              }}
            >
              {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              <span className="hidden md:inline">FULLSCREEN</span>
            </button>
          </div>

          {/* Инфо-стенд трека */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'min(12px, 2vh)', margin: 'auto 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 900,
                  color: DIFF_COLORS[selectedMap.difficulty] || '#38bdf8',
                  background: `${DIFF_COLORS[selectedMap.difficulty]}18`,
                  border: `1.5px solid ${DIFF_COLORS[selectedMap.difficulty]}55`,
                  padding: '3px 10px',
                  borderRadius: 6,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}
              >
                {selectedMap.difficulty}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fbbf24', fontSize: 12, fontWeight: 800 }}>
                <Flame size={14} /> {selectedMap.bpm} BPM
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: 'clamp(20px, 5.5vh, 48px)',
                  fontWeight: 900,
                  color: '#ffffff',
                  lineHeight: 1.1,
                  letterSpacing: -0.5,
                  textTransform: 'uppercase',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textShadow: '0 8px 30px rgba(0,0,0,0.8)',
                }}
              >
                {selectedMap.title}
              </div>
              <div
                style={{
                  fontSize: 'clamp(12px, 2.4vh, 18px)',
                  color: '#a1a1aa',
                  fontWeight: 600,
                  marginTop: 4,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {selectedMap.artist}
              </div>
            </div>
          </div>

          {/* Кнопка запуска и счетчик нот */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <button
              onClick={handleStart}
              style={{
                padding: 'min(14px, 2.5vh) min(44px, 5vw)',
                borderRadius: 14,
                background: 'linear-gradient(135deg, #f59e0b, #fcd34d)',
                border: 'none',
                color: '#000000',
                fontSize: 'clamp(13px, 2.2vh, 16px)',
                fontWeight: 900,
                letterSpacing: 2,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                boxShadow: '0 8px 25px rgba(245, 158, 11, 0.4), inset 0 1px 0 rgba(255,255,255,0.4)',
                transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <Play size={18} fill="#000" /> PLAY
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 9, color: '#71717a', fontWeight: 800, letterSpacing: 1 }}>OBJECTS</span>
              <span style={{ fontSize: 'clamp(13px, 2.4vh, 18px)', fontWeight: 900, color: '#f4f4f5', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Activity size={14} color="#38bdf8" />
                {noteCount > 0 ? noteCount.toLocaleString() : '---'}
              </span>
            </div>
          </div>
        </div>

        {/* 3. ПРАВАЯ КОЛОННА: osu! Цилиндрическая Карусель */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            width: 'clamp(280px, 35vw, 420px)',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            padding: 'min(20px, 3vh) 0 min(20px, 3vh) 14px',
            boxSizing: 'border-box',
          }}
        >
          {/* Поиск и кнопка добавления трека */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, paddingRight: 16 }}>
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(24, 24, 27, 0.65)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 10,
                padding: '8px 12px',
              }}
            >
              <Search size={14} color="#71717a" />
              <input
                type="text"
                placeholder="Search beatmaps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#ffffff',
                  fontSize: 12,
                  width: '100%',
                }}
              />
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                padding: '0 14px',
                borderRadius: 10,
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                color: '#f59e0b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(245, 158, 11, 0.15)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(245, 158, 11, 0.25)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(245, 158, 11, 0.15)')}
            >
              <Plus size={18} />
            </button>
          </div>

          {/* Список карточек с кинетическим скроллом и дуговой физикой */}
          <div
            className="osu-carousel-scroll"
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end', // Намертво прижимаем правый край к границе экрана
              gap: 8,
              paddingRight: 0,
              paddingTop: 8,
              paddingBottom: 24,
            }}
          >
            {filteredMaps.map((map, idx) => {
              const isSelected = map.id === selectedMap.id;
              const diffColor = DIFF_COLORS[map.difficulty] || '#38bdf8';

              // Расчет цилиндрического отступа в зависимости от дистанции до активного трека
              const dist = selectedIndex >= 0 ? Math.abs(idx - selectedIndex) : 2;
              const widthIndent = isSelected ? 0 : dist === 1 ? 18 : 34;
              const cardOpacity = isSelected ? 1 : dist === 1 ? 0.9 : 0.72;

              return (
                <div
                  key={map.id}
                  ref={isSelected ? activeCardRef : null}
                  onClick={() => onSelectMap(map)}
                  className="card-snap-item"
                  style={{
                    position: 'relative',
                    height: 'clamp(56px, 13vh, 74px)',
                    width: `calc(100% - ${widthIndent}px)`,
                    borderRadius: '16px 0 0 16px',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    opacity: cardOpacity,
                    // Премиальный градиент с неоновым оттенком
                    background: isSelected
                      ? `linear-gradient(90deg, ${diffColor}28 0%, rgba(26, 26, 36, 0.95) 100%)`
                      : 'rgba(22, 22, 28, 0.65)',
                    backdropFilter: 'blur(20px)',
                    borderTop: isSelected ? `1px solid ${diffColor}88` : '1px solid rgba(255, 255, 255, 0.06)',
                    borderBottom: isSelected ? `1px solid ${diffColor}88` : '1px solid rgba(255, 255, 255, 0.06)',
                    borderLeft: isSelected ? `5px solid ${diffColor}` : '5px solid transparent',
                    borderRight: 'none',
                    boxShadow: isSelected
                      ? `-14px 0 35px ${diffColor}25, 0 8px 24px rgba(0,0,0,0.6)`
                      : 'none',
                    transition: 'width 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease, background 0.2s ease, border-color 0.2s ease, box-shadow 0.28s ease',
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: 12,
                    paddingRight: 16,
                    gap: 12,
                    boxSizing: 'border-box',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.width = 'calc(100% - 8px)';
                      e.currentTarget.style.opacity = '1';
                      e.currentTarget.style.background = 'rgba(32, 32, 44, 0.85)';
                      e.currentTarget.style.borderLeft = `5px solid ${diffColor}66`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.width = `calc(100% - ${widthIndent}px)`;
                      e.currentTarget.style.opacity = `${cardOpacity}`;
                      e.currentTarget.style.background = 'rgba(22, 22, 28, 0.65)';
                      e.currentTarget.style.borderLeft = '5px solid transparent';
                    }
                  }}
                >
                  {/* Обложка трека */}
                  <div
                    style={{
                      width: 'clamp(38px, 8.5vh, 48px)',
                      height: 'clamp(38px, 8.5vh, 48px)',
                      borderRadius: 10,
                      overflow: 'hidden',
                      flexShrink: 0,
                      boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
                    }}
                  >
                    <img src={map.bgSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>

                  {/* Метаданные */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        style={{
                          fontSize: 8,
                          fontWeight: 900,
                          color: diffColor,
                          textTransform: 'uppercase',
                        }}
                      >
                        {map.difficulty}
                      </span>
                      <span style={{ fontSize: 9, color: '#71717a' }}>•</span>
                      <span style={{ fontSize: 9, color: '#a1a1aa', fontFamily: 'monospace' }}>
                        {map.bpm} BPM
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: 'clamp(11px, 2vh, 14px)',
                        fontWeight: 800,
                        color: isSelected ? '#ffffff' : '#e4e4e7',
                        marginTop: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {map.title}
                    </div>
                    <div
                      style={{
                        fontSize: 'clamp(9px, 1.6vh, 11px)',
                        color: '#71717a',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {map.artist}
                    </div>
                  </div>

                  {/* Индикатор воспроизведения для активного трека */}
                  {isSelected && (
                    <div style={{ paddingRight: 4 }}>
                      <Music size={14} color={diffColor} className="animate-pulse" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Модал создания битмапа */}
        <CreateBeatmapModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCreate={onCreateBeatmap}
        />
      </div>
    </>
  );
}