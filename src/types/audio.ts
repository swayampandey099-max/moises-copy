export type StemType = 'vocals' | 'drums' | 'bass' | 'other';

export interface StemState {
  id: StemType;
  name: string;
  subtitle: string;
  icon: string;
  volume: number; // 0.0 to 1.5 (1.0 = 0dB)
  pan: number; // -1.0 to 1.0 (0 = Center)
  isMuted: boolean;
  isSolo: boolean;
  waveformData: number[];
  color: string;
  accentBg: string;
}

export interface TrackMetadata {
  id: string;
  title: string;
  artist: string;
  duration: number; // seconds
  bpm: number;
  key: string;
  timeSignature: string;
  isDemo?: boolean;
}

export interface ProcessingStep {
  id: string;
  title: string;
  detail: string;
  progress: number;
  status: 'pending' | 'active' | 'completed';
}

export type PresetType = 'all' | 'karaoke' | 'acapella' | 'drumless' | 'bass-focus';
