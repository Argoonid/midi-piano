import type { Beatmap } from '../types/game';

export const BUILTIN_BEATMAPS: Beatmap[] = [
  {
    id: 'love-story',
    title: 'Love Story',
    artist: 'Indila',
    audioSrc: '/tracks/love-story/audio.mp3',
    midiSrc: '/tracks/love-story/notes.mid',
    bgSrc: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1920&auto=format&fit=crop',
    difficulty: 'Normal',
    bpm: 128,
    defaultOffsetMs: 0,
  },
  {
    id: 'kaer-morhen',
    title: 'Kaer Morhen',
    artist: 'Marcin Przybyłowicz (The Witcher 3)',
    audioSrc: '/tracks/Kaer Morhen/audio.mp3',
    midiSrc: '/tracks/Kaer Morhen/notes.mid',
    bgSrc: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1920&auto=format&fit=crop',
    difficulty: 'Hard',
    bpm: 75,
    defaultOffsetMs: 0,
  },
];