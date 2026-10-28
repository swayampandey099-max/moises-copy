import React from 'react';
import { TrackMetadata } from '../types/audio';
import {
  Sparkles,
  Layers,
  Cpu,
  Sliders,
  CheckCircle2,
  Mic,
  Drum,
  Guitar,
  Music,
  ArrowRight,
} from 'lucide-react';

interface DemucsSeparationViewProps {
  currentTrack: TrackMetadata | null;
  onOpenUpload: () => void;
  onSwitchToMixer: () => void;
}

export const DemucsSeparationView: React.FC<DemucsSeparationViewProps> = ({
  currentTrack,
  onOpenUpload,
  onSwitchToMixer,
}) => {
  const modelSpecs = [
    {
      title: 'Vocals Extraction Model',
      icon: <Mic className="w-4 h-4 text-emerald-600" />,
      band: '250 Hz – 3.8 kHz',
      method: 'Center-channel phase cancellation & vocal formant harmonic filtering',
      quality: 'High SDR (Signal-to-Distortion Ratio)',
    },
    {
      title: 'Drum & Percussion Demixing',
      icon: <Drum className="w-4 h-4 text-emerald-600" />,
      band: '50 Hz – 16 kHz (Multi-band)',
      method: 'High-frequency transient attack envelope follower & punch bandpass',
      quality: 'Zero phase-smearing transient response',
    },
    {
      title: 'Bass & Sub-Harmonic Isolation',
      icon: <Guitar className="w-4 h-4 text-emerald-600" />,
      band: '25 Hz – 180 Hz',
      method: '4th-order Butterworth lowpass & second-order harmonic preservation',
      quality: 'Punchy low-end foundation',
    },
    {
      title: 'Accompaniment / Other Stems',
      icon: <Music className="w-4 h-4 text-emerald-600" />,
      band: 'Full Spectrum Residual',
      method: 'Stereo side-band harmonic reconstruction and ambient reflection matrix',
      quality: 'Crystal clear guitars, synths, and pianos',
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Overview Banner */}
      <div className="frosted-glass rounded-3xl p-6 sm:p-8 border border-white/90 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
            <Cpu className="w-4 h-4" />
            <span>Demucs v4 Hybrid Transformer Architecture</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Neural Audio Source Separation
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
            Demucs separates complex stereo audio files into four pristine isolated stems in real time, letting you control individual volume, pan, and playback parameters independently.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenUpload}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
          >
            Upload New Song
          </button>
          <button
            onClick={onSwitchToMixer}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Go to Mixer
          </button>
        </div>
      </div>

      {/* 4 Stem Demux Architecture Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-800">
          Stem Extraction Specifications
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modelSpecs.map((spec, i) => (
            <div
              key={i}
              className="frosted-glass rounded-2xl p-5 border border-white/80 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    {spec.icon}
                  </div>
                  <h4 className="text-xs font-semibold text-slate-900">
                    {spec.title}
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  {spec.band}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {spec.method}
              </p>
              <div className="text-[11px] text-slate-600 flex items-center gap-1.5 pt-1 border-t border-black/[0.04]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{spec.quality}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Track Stem Readiness */}
      {currentTrack && (
        <div className="frosted-glass rounded-2xl p-5 border border-white/80 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-semibold text-slate-900">
              Active Track: {currentTrack.title}
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              4 Stems Extracted · {currentTrack.bpm} BPM · {currentTrack.key}
            </p>
          </div>
          <button
            onClick={onSwitchToMixer}
            className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
          >
            <span>Launch 4-Stem Mixer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
