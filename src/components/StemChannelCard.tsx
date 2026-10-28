import React, { useMemo } from 'react';
import { StemState, StemType } from '../types/audio';
import { Mic, Drum, Guitar, Music, Download, Volume2, VolumeX } from 'lucide-react';

interface StemChannelCardProps {
  stem: StemState;
  onVolumeChange: (id: StemType, vol: number) => void;
  onPanChange: (id: StemType, pan: number) => void;
  onToggleMute: (id: StemType) => void;
  onToggleSolo: (id: StemType) => void;
  onExportStem: (id: StemType) => void;
  onSeekToRatio?: (ratio: number) => void;
  liveLevel: number; // 0.0 to 1.0
  playbackProgressRatio: number; // 0.0 to 1.0
}

export const StemChannelCard: React.FC<StemChannelCardProps> = ({
  stem,
  onVolumeChange,
  onPanChange,
  onToggleMute,
  onToggleSolo,
  onExportStem,
  onSeekToRatio,
  liveLevel,
  playbackProgressRatio,
}) => {
  // Stem icon mapper
  const renderIcon = () => {
    switch (stem.id) {
      case 'vocals':
        return <Mic className="w-4 h-4 text-emerald-600" />;
      case 'drums':
        return <Drum className="w-4 h-4 text-emerald-600" />;
      case 'bass':
        return <Guitar className="w-4 h-4 text-emerald-600" />;
      case 'other':
      default:
        return <Music className="w-4 h-4 text-emerald-600" />;
    }
  };

  // Convert linear volume [0.0 - 1.5] to approximate dB
  const dbDisplay = useMemo(() => {
    if (stem.isMuted) return 'Muted';
    if (stem.volume <= 0.001) return '-inf dB';
    const db = 20 * Math.log10(stem.volume);
    const sign = db > 0 ? '+' : '';
    return `${sign}${db.toFixed(1)} dB`;
  }, [stem.volume, stem.isMuted]);

  // Convert pan [-1.0, 1.0] to visual label
  const panDisplay = useMemo(() => {
    if (Math.abs(stem.pan) < 0.05) return 'Center';
    if (stem.pan < 0) return `L${Math.round(Math.abs(stem.pan) * 100)}`;
    return `R${Math.round(stem.pan * 100)}`;
  }, [stem.pan]);

  return (
    <div
      className={`relative rounded-2xl frosted-glass p-5 border transition-all duration-200 flex flex-col justify-between ${
        stem.isSolo
          ? 'border-emerald-500/50 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/30'
          : stem.isMuted
          ? 'opacity-60 border-black/[0.04]'
          : 'border-white/80 hover:border-black/[0.08]'
      }`}
    >
      {/* Card Header: Icon, Name, Frequency range, and Stem Download */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/50 flex items-center justify-center shrink-0">
            {renderIcon()}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-900 truncate tracking-tight">
              {stem.name}
            </h3>
            <p className="text-[11px] text-slate-400 truncate">
              {stem.subtitle}
            </p>
          </div>
        </div>

        <button
          onClick={() => onExportStem(stem.id)}
          title={`Download ${stem.name} Stem (.WAV)`}
          aria-label={`Download ${stem.name} stem`}
          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50/60 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Stem Waveform Mini Display with Playhead Scrubbing */}
      <div
        onClick={(e) => {
          if (!onSeekToRatio) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = (e.clientX - rect.left) / rect.width;
          onSeekToRatio(Math.max(0, Math.min(1, ratio)));
        }}
        className="relative h-12 w-full bg-slate-50/80 rounded-xl px-2 py-1 flex items-center gap-[2px] overflow-hidden cursor-pointer border border-black/[0.03] group mb-4"
        title="Click to seek"
      >
        {stem.waveformData.slice(0, 48).map((peak, idx) => {
          const barRatio = idx / 48;
          const isPassed = barRatio <= playbackProgressRatio;
          const heightPercent = Math.max(12, peak * 100);

          return (
            <div
              key={idx}
              style={{ height: `${heightPercent}%` }}
              className={`flex-1 rounded-full transition-colors duration-100 ${
                isPassed
                  ? stem.isMuted
                    ? 'bg-slate-300'
                    : 'bg-emerald-600'
                  : 'bg-slate-200 group-hover:bg-slate-300'
              }`}
            />
          );
        })}

        {/* Playhead marker line */}
        <div
          style={{ left: `${playbackProgressRatio * 100}%` }}
          className="absolute top-0 bottom-0 w-[2px] bg-emerald-700 pointer-events-none shadow-sm shadow-emerald-700/50"
        />
      </div>

      {/* VU Meter & Fader Controls Grid */}
      <div className="space-y-4">
        {/* Real-time Level Meter Bar */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[10px] font-mono tabular-nums text-slate-400 w-7">
            {dbDisplay}
          </span>
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden flex items-center p-[1px]">
            <div
              style={{ width: `${Math.min(100, liveLevel * 100)}%` }}
              className={`h-full rounded-full transition-all duration-75 ${
                liveLevel > 0.85
                  ? 'bg-emerald-600'
                  : 'bg-emerald-500'
              }`}
            />
          </div>
          <span className="text-[10px] font-mono tabular-nums text-slate-400 w-10 text-right">
            {Math.round(stem.volume * 100)}%
          </span>
        </div>

        {/* Volume Slider */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[11px] text-slate-500">
            <span className="flex items-center gap-1 font-medium">
              {stem.volume === 0 || stem.isMuted ? (
                <VolumeX className="w-3 h-3 text-slate-400" />
              ) : (
                <Volume2 className="w-3 h-3 text-emerald-600" />
              )}
              Level
            </span>
            <button
              onClick={() => onVolumeChange(stem.id, 1.0)}
              className="text-[10px] text-slate-400 hover:text-slate-600 font-mono"
              title="Reset to 0 dB"
            >
              Reset
            </button>
          </div>
          <input
            type="range"
            min="0"
            max="1.5"
            step="0.01"
            value={stem.volume}
            disabled={stem.isMuted}
            onChange={(e) => onVolumeChange(stem.id, parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none accent-emerald-600 disabled:opacity-40"
          />
        </div>

        {/* Pan Slider */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[11px] text-slate-500">
            <span className="font-medium">Pan</span>
            <span className="text-[10px] font-mono tabular-nums text-slate-400">
              {panDisplay}
            </span>
          </div>
          <input
            type="range"
            min="-1.0"
            max="1.0"
            step="0.02"
            value={stem.pan}
            onChange={(e) => onPanChange(stem.id, parseFloat(e.target.value))}
            onDoubleClick={() => onPanChange(stem.id, 0)}
            className="w-full h-1 bg-slate-100 rounded-lg appearance-none accent-emerald-600"
            title="Double click to center"
          />
        </div>

        {/* Mute and Solo Buttons (Standard audio DAW buttons) */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => onToggleMute(stem.id)}
            className={`py-1.5 px-3 text-xs font-semibold rounded-lg transition-colors border ${
              stem.isMuted
                ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm'
                : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50'
            }`}
          >
            MUTE
          </button>
          <button
            onClick={() => onToggleSolo(stem.id)}
            className={`py-1.5 px-3 text-xs font-semibold rounded-lg transition-colors border ${
              stem.isSolo
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50'
            }`}
          >
            SOLO
          </button>
        </div>
      </div>
    </div>
  );
};
