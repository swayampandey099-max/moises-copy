import React from 'react';
import { TrackMetadata, PresetType } from '../types/audio';
import {
  Clock,
  Gauge,
  Music2,
  Repeat,
  Headphones,
  Mic,
  Drum,
  Guitar,
  Sparkles,
  Volume2,
} from 'lucide-react';

interface PracticeSuiteViewProps {
  currentTrack: TrackMetadata | null;
  pitch: number;
  speed: number;
  isLooping: boolean;
  metronomeActive: boolean;
  activePreset: PresetType;
  onPitchChange: (pitch: number) => void;
  onSpeedChange: (speed: number) => void;
  onToggleLoop: () => void;
  onToggleMetronome: () => void;
  onApplyPreset: (preset: PresetType) => void;
  onSwitchToMixer: () => void;
}

export const PracticeSuiteView: React.FC<PracticeSuiteViewProps> = ({
  currentTrack,
  pitch,
  speed,
  isLooping,
  metronomeActive,
  activePreset,
  onPitchChange,
  onSpeedChange,
  onToggleLoop,
  onToggleMetronome,
  onApplyPreset,
  onSwitchToMixer,
}) => {
  const practiceProfiles = [
    {
      id: 'karaoke' as PresetType,
      title: 'Vocalist / Karaoke Mode',
      desc: 'Mutes lead vocals completely while keeping drums, bass, and backing melodies.',
      icon: <Mic className="w-4 h-4 text-emerald-600" />,
      benefit: 'Sing along or record vocal covers with pristine studio backing.',
    },
    {
      id: 'drumless' as PresetType,
      title: 'Drummer Practice',
      desc: 'Mutes all drums and percussive transients.',
      icon: <Drum className="w-4 h-4 text-emerald-600" />,
      benefit: 'Play real drum kit grooves with metronome click sync.',
    },
    {
      id: 'bass-focus' as PresetType,
      title: 'Bassist Transcribe',
      desc: 'Solos the isolated bassline and sub-harmonics.',
      icon: <Guitar className="w-4 h-4 text-emerald-600" />,
      benefit: 'Learn intricate bass riffs, slap lines, and chord roots.',
    },
    {
      id: 'acapella' as PresetType,
      title: 'Acapella Harmonies',
      desc: 'Solos the vocal track in isolation.',
      icon: <Headphones className="w-4 h-4 text-emerald-600" />,
      benefit: 'Hear vocal pitch precision, vibrato, and lyrical diction.',
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-black/[0.05]">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Musician Practice Suite
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Fine-tune tempo, pitch transposition, loop rehearsal, and instrument-specific practice presets.
          </p>
        </div>
        <button
          onClick={onSwitchToMixer}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
        >
          Open Stem Mixer
        </button>
      </div>

      {/* Practice Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tool 1: Pitch Transposer */}
        <div className="frosted-glass rounded-2xl p-5 border border-white/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Music2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">
                Key Transposition
              </h3>
            </div>
            <span className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              {pitch > 0 ? `+${pitch}` : pitch} Semitones
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Transpose pitch in real-time without altering playback speed. Shift key to match your vocal range or instrument tuning.
          </p>
          <div className="space-y-2">
            <input
              type="range"
              min="-6"
              max="6"
              step="1"
              value={pitch}
              onChange={(e) => onPitchChange(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none accent-emerald-600"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>-6st (Low)</span>
              <button
                onClick={() => onPitchChange(0)}
                className="hover:text-slate-700 font-semibold text-emerald-700"
              >
                Reset (0st)
              </button>
              <span>+6st (High)</span>
            </div>
          </div>
        </div>

        {/* Tool 2: Speed / Tempo Shifter */}
        <div className="frosted-glass rounded-2xl p-5 border border-white/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Gauge className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">
                Tempo & Speed Control
              </h3>
            </div>
            <span className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              {(speed * 100).toFixed(0)}% Speed
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Slow down fast solos or complex passages to practice technique at comfortable tempos.
          </p>
          <div className="grid grid-cols-5 gap-1.5">
            {[0.75, 0.9, 1.0, 1.1, 1.25].map((val) => (
              <button
                key={val}
                onClick={() => onSpeedChange(val)}
                className={`py-1.5 text-xs font-mono font-semibold rounded-lg border transition-all ${
                  speed === val
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                {val}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Rehearsal Presets */}
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-3">
          Instant Instrument Presets
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {practiceProfiles.map((item) => (
            <div
              key={item.id}
              onClick={() => onApplyPreset(item.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                activePreset === item.id
                  ? 'frosted-glass border-emerald-500/60 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/20'
                  : 'bg-white/70 hover:bg-white border-black/[0.04] hover:border-black/[0.08]'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <h4 className="text-xs font-semibold text-slate-900">
                    {item.title}
                  </h4>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    activePreset === item.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {activePreset === item.id ? 'Active' : 'Apply'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">{item.desc}</p>
              <div className="text-[10px] text-emerald-700 bg-emerald-50/60 p-2 rounded-lg">
                💡 {item.benefit}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
