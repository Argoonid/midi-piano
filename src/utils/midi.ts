import { Midi } from '@tonejs/midi';
import type { NoteEvent, MidiTrackInfo } from '../types/game';

export interface ParsedMidiResult {
  notes: NoteEvent[];
  tracksInfo: MidiTrackInfo[];
}

export async function parseMidiFile(file: File): Promise<ParsedMidiResult> {
  const arrayBuffer = await file.arrayBuffer();
  const midi = new Midi(arrayBuffer);

  // 1. Отбираем треки с нотами (исключая канал 10 ударных)
  const validTracks = midi.tracks.filter(
    (t) => t.channel !== 9 && t.notes.length > 0
  );

  // 2. Рассчитываем средний регистр звучания каждой дорожки
  const trackPitchStats = validTracks.map((t) => {
    const totalPitch = t.notes.reduce((sum, n) => sum + n.midi, 0);
    const avg = t.notes.length > 0 ? totalPitch / t.notes.length : 60;
    const name = (t.name || '').toLowerCase();
    return { track: t, avg, name };
  });

  // 3. Назначаем руки СТРОГО на уровне дорожек
  const tracksInfo: MidiTrackInfo[] = validTracks.map((t, idx) => {
    const item = trackPitchStats[idx];
    let hand: 'left' | 'right';

    if (
      item.name.includes('left') ||
      item.name.includes('lh') ||
      item.name.includes('bass') ||
      item.name.includes('левая') ||
      item.name.includes('бас')
    ) {
      hand = 'left';
    } else if (
      item.name.includes('right') ||
      item.name.includes('rh') ||
      item.name.includes('treble') ||
      item.name.includes('правая') ||
      item.name.includes('melody')
    ) {
      hand = 'right';
    } else {
      // При отсутствии названий: трек с меньшей средней высотой — левая рука, с большей — правая
      const sortedByAvg = [...trackPitchStats].sort((a, b) => a.avg - b.avg);
      const rank = sortedByAvg.findIndex((x) => x.track === t);
      hand = rank < sortedByAvg.length / 2 ? 'left' : 'right';
    }

    return {
      index: midi.tracks.indexOf(t),
      name: t.name || `Track ${idx + 1}`,
      noteCount: t.notes.length,
      hand,
    };
  });

  const trackHandMap = new Map<number, 'left' | 'right'>();
  tracksInfo.forEach((ti) => trackHandMap.set(ti.index, ti.hand));

  // 4. Сбор нот: рука берется ИСКЛЮЧИТЕЛЬНО из дорожки
  const rawNotes: {
    midi: number;
    time: number;
    duration: number;
    trackIndex: number;
    hand: 'left' | 'right';
  }[] = [];

  validTracks.forEach((track) => {
    const trackIndex = midi.tracks.indexOf(track);
    const hand = trackHandMap.get(trackIndex) || 'right';

    track.notes.forEach((note) => {
      rawNotes.push({
        midi: note.midi,
        time: note.time,
        duration: Math.max(note.duration, 0.08),
        trackIndex,
        hand, // Никаких порогов < 60: все ноты этой дороги красятся строго в свой цвет
      });
    });
  });

  rawNotes.sort((a, b) => a.time - b.time || a.midi - b.midi);

  // 5. Очистка дублей внутри одной дорожки
  const notes: NoteEvent[] = [];
  let noteId = 0;
  const keyLastActive = new Map<number, { time: number; index: number; trackIndex: number }>();

  for (const raw of rawNotes) {
    const existing = keyLastActive.get(raw.midi);

    if (existing && existing.trackIndex === raw.trackIndex && Math.abs(raw.time - existing.time) < 0.035) {
      const prevNote = notes[existing.index];
      if (prevNote && raw.duration > prevNote.duration) {
        prevNote.duration = raw.duration;
      }
      continue;
    }

    if (existing) {
      const prevNote = notes[existing.index];
      if (prevNote && prevNote.time + prevNote.duration > raw.time) {
        prevNote.duration = Math.max(0.08, raw.time - prevNote.time - 0.02);
      }
    }

    const newIndex = notes.length;
    notes.push({
      id: noteId++,
      midiKey: raw.midi,
      time: raw.time,
      duration: raw.duration,
      hand: raw.hand,
      trackIndex: raw.trackIndex,
    });

    keyLastActive.set(raw.midi, { time: raw.time, index: newIndex, trackIndex: raw.trackIndex });
  }

  return { notes, tracksInfo };
}