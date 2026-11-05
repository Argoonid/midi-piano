import { useState, useRef } from 'react';
import type { Beatmap, NoteEvent } from '../types/game';
import { parseMidiFile } from '../utils/midi';
import { Upload, FileAudio, FileMusic, CheckCircle2, AlertCircle, X, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (beatmap: Beatmap, notes: NoteEvent[]) => void;
}

const DEFAULT_COVERS = [
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1920&auto=format&fit=crop',
];

export function CreateBeatmapModal({ isOpen, onClose, onCreate }: Props) {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [midiFile, setMidiFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('Custom Artist');
  const [selectedCover, setSelectedCover] = useState(DEFAULT_COVERS[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const processFiles = (files: FileList | File[]) => {
    setErrorMsg(null);
    let detectedAudio: File | null = audioFile;
    let detectedMidi: File | null = midiFile;

    Array.from(files).forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';

      // 1. Приоритетная проверка: строго определяем MIDI по расширению
      if (['mid', 'midi'].includes(ext)) {
        detectedMidi = file;
        if (!title && !detectedAudio) {
          const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          setTitle(cleanName);
        }
      } 
      // 2. Аудиодорожка: исключаем mime-типы midi
      else if (
        ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(ext) ||
        (file.type.startsWith('audio/') && !file.type.includes('mid'))
      ) {
        detectedAudio = file;
        if (!title) {
          const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          setTitle(cleanName);
        }
      }
    });

    setAudioFile(detectedAudio);
    setMidiFile(detectedMidi);
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const handleSubmit = async () => {
    if (!audioFile || !midiFile) {
      setErrorMsg('Пожалуйста, выберите оба файла: MP3 и MID');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      // Деструктурируем notes из результата парсинга
      const { notes } = await parseMidiFile(midiFile);
      if (notes.length === 0) throw new Error('В выбранном MIDI-файле нет нот');

      // Конвертируем файлы в Base64 для передачи через API сервера
      const audioBase64 = await fileToBase64(audioFile);
      const midiBase64 = await fileToBase64(midiFile);

      const res = await fetch('/api/save-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || 'Untitled Track',
          artist: artist.trim() || 'Custom Artist',
          bgSrc: selectedCover,
          difficulty: notes.length > 500 ? 'Hard' : notes.length > 250 ? 'Normal' : 'Easy',
          bpm: 120,
          audioBase64,
          midiBase64,
        }),
      });

      if (!res.ok) throw new Error('Сервер Vite не смог сохранить файлы на диск');

      const data = await res.json();
      onCreate(data.beatmap, notes);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка обработки трека');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 60,
        background: 'rgba(5, 5, 8, 0.8)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        boxSizing: 'border-box',
        userSelect: 'none',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 520,
          background: 'rgba(18, 18, 24, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 24,
          padding: '28px 32px',
          boxShadow: '0 30px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(245, 158, 11, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase' }}>
              PianOSU Studio
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', marginTop: 2 }}>
              Add New Beatmap
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              color: '#a1a1aa',
              width: 32,
              height: 32,
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '2px dashed rgba(255, 255, 255, 0.15)',
            borderRadius: 16,
            padding: '24px 20px',
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.02)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <input
            type="file"
            multiple
            accept=".mp3,.wav,.ogg,.m4a,.flac,.mid,.midi"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files) processFiles(e.target.files);
            }}
          />
          <Upload size={28} color="#f59e0b" style={{ margin: '0 auto 10px auto' }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>
            Перетащи сюда оба файла сразу (MP3 + MID)
          </div>
          <div style={{ fontSize: 11, color: '#71717a', marginTop: 4 }}>
            или нажми для выбора файлов из проводника
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div
            style={{
              background: audioFile ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255, 255, 255, 0.03)',
              border: audioFile ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 12,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <FileAudio size={20} color={audioFile ? '#38bdf8' : '#71717a'} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, color: audioFile ? '#38bdf8' : '#71717a', fontWeight: 800 }}>
                AUDIO FILE
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {audioFile ? audioFile.name : 'Не выбран (аудио)'}
              </div>
            </div>
            {audioFile && <CheckCircle2 size={16} color="#38bdf8" />}
          </div>

          <div
            style={{
              background: midiFile ? 'rgba(168, 85, 247, 0.08)' : 'rgba(255, 255, 255, 0.03)',
              border: midiFile ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 12,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <FileMusic size={20} color={midiFile ? '#a855f7' : '#71717a'} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, color: midiFile ? '#a855f7' : '#71717a', fontWeight: 800 }}>
                MIDI NOTES
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {midiFile ? midiFile.name : 'Не выбран (.mid)'}
              </div>
            </div>
            {midiFile && <CheckCircle2 size={16} color="#a855f7" />}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: '#a1a1aa', fontWeight: 700, display: 'block', marginBottom: 6 }}>
              НАЗВАНИЕ ТРЕКА
            </label>
            <input
              type="text"
              placeholder="Under the Sea"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 10,
                padding: '10px 14px',
                color: '#ffffff',
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, color: '#a1a1aa', fontWeight: 700, display: 'block', marginBottom: 6 }}>
              АРТИСТ / АВТОР
            </label>
            <input
              type="text"
              placeholder="Alan Menken"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 10,
                padding: '10px 14px',
                color: '#ffffff',
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: 11, color: '#a1a1aa', fontWeight: 700, display: 'block', marginBottom: 8 }}>
            АТМОСФЕРА ФОНА
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            {DEFAULT_COVERS.map((cov, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedCover(cov)}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 8,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: selectedCover === cov ? '2px solid #f59e0b' : '2px solid transparent',
                  opacity: selectedCover === cov ? 1 : 0.5,
                  transition: 'all 0.15s ease',
                }}
              >
                <img src={cov} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </div>

        {errorMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f43f5e', fontSize: 12, fontWeight: 600 }}>
            <AlertCircle size={15} /> {errorMsg}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={isProcessing}
          style={{
            padding: '14px',
            borderRadius: 14,
            background: audioFile && midiFile ? '#f59e0b' : 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            color: audioFile && midiFile ? '#000000' : '#71717a',
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: 1.5,
            cursor: audioFile && midiFile ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: audioFile && midiFile ? '0 0 25px rgba(245, 158, 11, 0.4)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <Sparkles size={16} /> {isProcessing ? 'PARSING TRACK...' : 'SAVE & PLAY BEATMAP'}
        </button>
      </div>
    </div>
  );
}