import { useState, useRef, useEffect, useMemo } from 'react';
import type { NoteEvent, Beatmap, CountdownState, IntroStyle, GameSettings, MidiTrackInfo } from './types/game';
import { BUILTIN_BEATMAPS } from './constants/library';
import { parseMidiFile } from './utils/midi';
import { PianoCanvas } from './components/PianoCanvas';
import { LandingMenu } from './components/LandingMenu';
import { PauseModal } from './components/PauseModal';

const STYLES: IntroStyle[] = ['CYBER_SCAN', 'COSMIC_WARP', 'OSU_CHROMA'];

export default function App() {
  const [beatmaps, setBeatmaps] = useState<Beatmap[]>(BUILTIN_BEATMAPS);
  const [currentMap, setCurrentMap] = useState<Beatmap>(BUILTIN_BEATMAPS[0]);
  const [activeNotes, setActiveNotes] = useState<NoteEvent[]>([]);
  const [tracksInfo, setTracksInfo] = useState<MidiTrackInfo[]>([]);
  const [enabledTracks, setEnabledTracks] = useState<Set<number>>(new Set());
  const [view, setView] = useState<'MENU' | 'GAME'>('MENU');
  const [isPaused, setIsPaused] = useState(false);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const customNotesCache = useRef<Map<string, { notes: NoteEvent[]; tracksInfo: MidiTrackInfo[] }>>(new Map());

  const [settings, setSettings] = useState<GameSettings>({
    playbackRate: 1.0,
    noteSpeedMultiplier: 1.0,
    offsetMs: currentMap.defaultOffsetMs,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [countdown, setCountdown] = useState<CountdownState>({
    active: false,
    timeLeft: 3.0,
    style: 'CYBER_SCAN',
  });

  // Загрузка сохраненного manifest.json
  useEffect(() => {
    async function loadSavedManifest() {
      try {
        const res = await fetch('/tracks/manifest.json');
        if (!res.ok) return;

        const savedMaps: Beatmap[] = await res.json();
        if (Array.isArray(savedMaps) && savedMaps.length > 0) {
          setBeatmaps((prev) => {
            const savedIds = new Set(savedMaps.map((m) => m.id));
            const uniqueBuiltin = prev.filter((m) => !savedIds.has(m.id));
            return [...savedMaps, ...uniqueBuiltin];
          });
        }
      } catch (e) {
        console.warn('Локальный манифест пуст');
      }
    }

    loadSavedManifest();
  }, []);

  // Парсинг выбранной песни
  const loadSongMidi = async (map: Beatmap) => {
    if (customNotesCache.current.has(map.id)) {
      const cached = customNotesCache.current.get(map.id)!;
      setActiveNotes(cached.notes);
      setTracksInfo(cached.tracksInfo);
      initDefaultTracks(cached.tracksInfo);
      return;
    }

    if (!map.midiSrc) return;
    try {
      const res = await fetch(map.midiSrc);
      if (!res.ok) return;
      const blob = await res.blob();
      const file = new File([blob], `${map.id}.mid`);
      const { notes, tracksInfo: tInfo } = await parseMidiFile(file);
      setActiveNotes(notes);
      setTracksInfo(tInfo);
      initDefaultTracks(tInfo);
      customNotesCache.current.set(map.id, { notes, tracksInfo: tInfo });
    } catch (e) {
      console.warn('Не удалось прочитать MIDI:', map.title);
    }
  };

  // Автовыбор дорожек: если дорожек 3 (как в Another Love), включаем дорожки 0 и 1,
  // исключая дублирующий трек 2. Если дорожек 2 — включаем обе.
  const initDefaultTracks = (info: MidiTrackInfo[]) => {
    if (info.length === 3) {
      // Трек 0 (аккорды) + Трек 1 (мелодия) дают чистую партитуру в 4 ноты
      setEnabledTracks(new Set([info[0].index, info[1].index]));
    } else {
      setEnabledTracks(new Set(info.map((t) => t.index)));
    }
  };

  const toggleTrack = (trackIndex: number) => {
    setEnabledTracks((prev) => {
      const next = new Set(prev);
      if (next.has(trackIndex)) {
        if (next.size > 1) next.delete(trackIndex); // Не даем выключить все дорожки разом
      } else {
        next.add(trackIndex);
      }
      return next;
    });
  };

  useEffect(() => {
    loadSongMidi(currentMap);
    setSettings((prev) => ({ ...prev, offsetMs: currentMap.defaultOffsetMs }));
  }, [currentMap]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = settings.playbackRate;
    }
  }, [settings.playbackRate]);

  // Фильтруем ноты по включенным в микшере дорожкам
  const visibleNotes = useMemo(() => {
    if (tracksInfo.length <= 1) return activeNotes;
    return activeNotes.filter((n) => enabledTracks.has(n.trackIndex));
  }, [activeNotes, enabledTracks, tracksInfo]);

  const handleCreateBeatmap = (newMap: Beatmap, notes: NoteEvent[]) => {
    setBeatmaps((prev) => [newMap, ...prev.filter((m) => m.id !== newMap.id)]);
    setCurrentMap(newMap);
    setActiveNotes(notes);
  };

  const startGameSession = () => {
    setView('GAME');
    setIsPaused(false);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.playbackRate = settings.playbackRate;
    }

    const randomStyle = STYLES[Math.floor(Math.random() * STYLES.length)];
    setCountdown({ active: true, timeLeft: 3.0, style: randomStyle });

    const startTime = performance.now();
    const durationMs = 3000;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const remaining = Math.max(0, (durationMs - elapsed) / 1000);
      setCountdown((prev) => ({ ...prev, timeLeft: remaining }));

      if (remaining > 0) {
        requestAnimationFrame(tick);
      } else {
        setCountdown((prev) => ({ ...prev, active: false }));
        audioRef.current?.play();
      }
    };

    requestAnimationFrame(tick);
  };

  const togglePause = () => {
    if (countdown.active || !audioRef.current) return;

    if (isPaused) {
      audioRef.current.play();
      setIsPaused(false);
    } else {
      audioRef.current.pause();
      setIsPaused(true);
    }
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
    setIsPaused(false);
  };

  const backToMenu = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPaused(false);
    setCountdown((prev) => ({ ...prev, active: false }));
    setView('MENU');
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#050508' }}>
      <audio ref={audioRef} src={currentMap.audioSrc} preload="auto" />

      {view === 'MENU' && (
        <LandingMenu
          beatmaps={beatmaps}
          selectedMap={currentMap}
          noteCount={visibleNotes.length}
          onSelectMap={(map) => setCurrentMap(map)}
          onStartGame={startGameSession}
          onCreateBeatmap={handleCreateBeatmap}
        />
      )}

      {view === 'GAME' && (
        <>
          <PianoCanvas
            notes={visibleNotes}
            audioRef={audioRef}
            bgSrc={currentMap.bgSrc}
            countdown={countdown}
            offsetSec={settings.offsetMs / 1000}
            isPaused={isPaused}
            speedMultiplier={settings.noteSpeedMultiplier}
            onTogglePause={togglePause}
          />

          {isPaused && (
            <PauseModal
              beatmap={currentMap}
              currentTime={currentTime}
              duration={duration}
              settings={settings}
              tracksInfo={tracksInfo}
              enabledTracks={enabledTracks}
              onToggleTrack={toggleTrack}
              onResume={togglePause}
              onRestart={handleRestart}
              onExit={backToMenu}
              onSeek={handleSeek}
              onUpdateSettings={(newSettings) => setSettings((prev) => ({ ...prev, ...newSettings }))}
            />
          )}
        </>
      )}
    </div>
  );
}