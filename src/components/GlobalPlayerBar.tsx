import React, { useState } from 'react';
import { TrackMetadata, PresetType } from '../types/audio';
import {
  Play,
  Pause,
  RotateCcw,
  Repeat,
  Volume2,
  Clock,
  Gauge,
  Music2,
  ChevronUp,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface GlobalPlayerBarProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  masterWaveform: number[];
  currentTrack: TrackMetadata | null;
  masterVolume: number;
  pitch: number;
  speed: number;
  isLooping: boolean;
  metronomeActive: boolean;
  activePreset: PresetType;
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
  onMasterVolumeChange: (vol: number) => void;
  onPitchChange: (semitones: number) => void;
  onSpeedChange: (speed: number) => void;
  onToggleLoop: () => void;
  onToggleMetronome: () => void;
  onApplyPreset: (preset: PresetType) => void;
  onRestart: () => void;
}

export const GlobalPlayerBar: React.FC<GlobalPlayerBarProps> = ({
  isPlaying,
  currentTime,
  duration,
  masterWaveform,
  currentTrack,
  masterVolume,
  pitch,
  speed,
  isLooping,
  metronomeActive,
  activePreset,
  onTogglePlay,
  onSeek,
  onMasterVolumeChange,
  onPitchChange,
  onSpeedChange,
  onToggleLoop,
  onToggleMetronome,
  onApplyPreset,
  onRestart,
}) => {
  const [hoverTimeRatio, setHoverTimeRatio] = useState<number | null>(null);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressRatio = duration > 0 ? Math.max(0, Math.min(1, currentTime / duration)) : 0;

  return (
    <div className="frosted-glass rounded-2xl border border-black/[0.06] p-5 shadow-lg shadow-black/[0.03]">
      {/* Upper Deck: Current Song Info, Metadata & Quick Practice Presets */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-black/[0.05]">
        {/* Track Title and Musical Properties */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
            <Music2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 tracking-tight leading-snug">
              {currentTrack?.title || 'No Track Selected'}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>{currentTrack?.artist || 'Demucs Studio'}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{currentTrack?.bpm || 120} BPM</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{currentTrack?.key || 'G Minor'}</span>
            </div>
          </div>
        </div>

        {/* Practice & Mix Preset Segmented Buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl border border-black/[0.04]">
          <button
            onClick={() => onApplyPreset('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
              activePreset === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Full Mix
          </button>
          <button
            onClick={() => onApplyPreset('karaoke')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
              activePreset === 'karaoke'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Karaoke
          </button>
          <button
            onClick={() => onApplyPreset('acapella')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
              activePreset === 'acapella'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Acapella
          </button>
          <button
            onClick={() => onApplyPreset('drumless')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
              activePreset === 'drumless'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Drumless
          </button>
          <button
            onClick={() => onApplyPreset('bass-focus')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
              activePreset === 'bass-focus'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bassline
          </button>
        </div>
      </div>

      {/* Middle Deck: Global Master Waveform Timeline */}
      <div className="py-4 space-y-1.5">
        <div
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            setHoverTimeRatio(Math.max(0, Math.min(1, ratio)));
          }}
          onMouseLeave={() => setHoverTimeRatio(null)}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            onSeek(Math.max(0, Math.min(1, ratio)) * duration);
          }}
          className="relative h-14 w-full bg-slate-50/70 rounded-xl px-2.5 py-1.5 flex items-center gap-[3px] overflow-hidden cursor-pointer border border-black/[0.04] group select-none"
        >
          {masterWaveform.slice(0, 72).map((peak, idx) => {
            const barRatio = idx / 72;
            const isPassed = barRatio <= progressRatio;
            const heightPercent = Math.max(14, peak * 100);

            return (
              <div
                key={idx}
                style={{ height: `${heightPercent}%` }}
                className={`flex-1 rounded-full transition-colors duration-100 ${
                  isPassed ? 'bg-emerald-600' : 'bg-slate-200 group-hover:bg-slate-300'
                }`}
              />
            );
          })}

          {/* Real Playhead Marker */}
          <div
            style={{ left: `${progressRatio * 100}%` }}
            className="absolute top-0 bottom-0 w-[2.5px] bg-emerald-700 pointer-events-none shadow-md shadow-emerald-700/60"
          />

          {/* Hover Time Tooltip */}
          {hoverTimeRatio !== null && (
            <div
              style={{ left: `${hoverTimeRatio * 100}%` }}
              className="absolute top-1 -translate-x-1/2 bg-slate-900/90 text-white text-[10px] font-mono py-0.5 px-1.5 rounded pointer-events-none backdrop-blur-sm"
            >
              {formatTime(hoverTimeRatio * duration)}
            </div>
          )}
        </div>

        {/* Time Labels */}
        <div className="flex justify-between items-center text-xs font-mono tabular-nums text-slate-500 px-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Lower Deck: Playback Transport, Speed, Pitch, Metronome, Master Volume */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        {/* Left: Play, Pause, Restart, Loop */}
        <div className="flex items-center gap-3">
          <button
            onClick={onRestart}
            title="Restart from beginning"
            className="p-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onTogglePlay}
            className="w-12 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white flex items-center justify-center transition-all shadow-md shadow-emerald-600/30"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current translate-x-0.5" />
            )}
          </button>

          <button
            onClick={onToggleLoop}
            title={isLooping ? 'Loop Enabled' : 'Loop Disabled'}
            className={`p-2.5 rounded-xl border transition-colors ${
              isLooping
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Pitch & Speed & Metronome controls */}
        <div className="flex items-center gap-4 text-xs">
          {/* Pitch Shifter */}
          <div className="flex items-center gap-1.5 bg-slate-100/80 px-2.5 py-1.5 rounded-xl border border-black/[0.04]">
            <span className="text-slate-500 font-medium">Pitch</span>
            <span className="font-mono tabular-nums text-slate-900 font-semibold w-8 text-center">
              {pitch > 0 ? `+${pitch}` : pitch} st
            </span>
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => onPitchChange(Math.min(6, pitch + 1))}
                className="p-0.5 text-slate-400 hover:text-slate-800"
              >
                <ChevronUp className="w-3 h-3" />
              </button>
              <button
                onClick={() => onPitchChange(Math.max(-6, pitch - 1))}
                className="p-0.5 text-slate-400 hover:text-slate-800"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Speed / Tempo */}
          <div className="flex items-center gap-1.5 bg-slate-100/80 px-2.5 py-1.5 rounded-xl border border-black/[0.04]">
            <Gauge className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={speed}
              onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
              className="bg-transparent font-mono font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="0.75">0.75x</option>
              <option value="0.9">0.90x</option>
              <option value="1.0">1.00x</option>
              <option value="1.1">1.10x</option>
              <option value="1.25">1.25x</option>
            </select>
          </div>

          {/* Metronome */}
          <button
            onClick={onToggleMetronome}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-colors ${
              metronomeActive
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-semibold shadow-sm'
                : 'bg-slate-100/80 border-black/[0.04] text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Click</span>
          </button>
        </div>

        {/* Right: Master Output Volume */}
        <div className="flex items-center gap-2.5 min-w-[140px]">
          <Volume2 className="w-4 h-4 text-slate-500 shrink-0" />
          <input
            type="range"
            min="0"
            max="1.5"
            step="0.01"
            value={masterVolume}
            onChange={(e) => onMasterVolumeChange(parseFloat(e.target.value))}
            className="w-24 h-1.5 bg-slate-200 rounded-lg appearance-none accent-emerald-600"
            title="Master Output Level"
          />
          <span className="text-[11px] font-mono tabular-nums text-slate-500 w-8">
            {Math.round(masterVolume * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};
