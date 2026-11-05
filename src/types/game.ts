export interface MidiTrackInfo {
  index: number;
  name: string;
  noteCount: number;
  hand: 'left' | 'right';
}

export interface NoteEvent {
  id: number;
  midiKey: number;
  time: number;
  duration: number;
  hand: 'left' | 'right';
  trackIndex: number;
}

export type DifficultyLevel = 'Easy' | 'Normal' | 'Hard' | 'Insane';

export interface Beatmap {
  id: string;
  title: string;
  artist: string;
  audioSrc: string;
  midiSrc?: string;
  bgSrc: string;
  difficulty: DifficultyLevel;
  bpm: number;
  defaultOffsetMs: number;
}

export interface KeyGeometry {
  type: 'white' | 'black';
  x: number;
  w: number;
  h: number;
  label: string;
}

export type IntroStyle = 'CYBER_SCAN' | 'COSMIC_WARP' | 'OSU_CHROMA';

export interface CountdownState {
  active: boolean;
  timeLeft: number;
  style: IntroStyle;
}

export interface GameSettings {
  playbackRate: number;
  noteSpeedMultiplier: number;
  offsetMs: number;
}