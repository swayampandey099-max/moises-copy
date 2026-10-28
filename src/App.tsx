/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { GlobalPlayerBar } from './components/GlobalPlayerBar';
import { StemChannelCard } from './components/StemChannelCard';
import { UploadModal } from './components/UploadModal';
import { ExportModal } from './components/ExportModal';
import { PracticeSuiteView } from './components/PracticeSuiteView';
import { DemucsSeparationView } from './components/DemucsSeparationView';
import { audioEngine } from './services/audioEngine';
import { StemState, StemType, TrackMetadata, PresetType } from './types/audio';
import { Sparkles, SlidersHorizontal, Music } from 'lucide-react';

const initialStems: StemState[] = [
  {
    id: 'vocals',
    name: 'Vocals',
    subtitle: 'Lead Vocal & Formants (250Hz - 3.8kHz)',
    icon: 'mic',
    volume: 1.0,
    pan: 0,
    isMuted: false,
    isSolo: false,
    waveformData: [],
    color: '#10b981',
    accentBg: 'bg-emerald-50',
  },
  {
    id: 'drums',
    name: 'Drums',
    subtitle: 'Kick, Snare & Transients',
    icon: 'drum',
    volume: 1.0,
    pan: 0,
    isMuted: false,
    isSolo: false,
    waveformData: [],
    color: '#059669',
    accentBg: 'bg-emerald-50',
  },
  {
    id: 'bass',
    name: 'Bass',
    subtitle: 'Sub-bass & Grooves (25Hz - 180Hz)',
    icon: 'guitar',
    volume: 1.0,
    pan: 0,
    isMuted: false,
    isSolo: false,
    waveformData: [],
    color: '#047857',
    accentBg: 'bg-emerald-50',
  },
  {
    id: 'other',
    name: 'Other',
    subtitle: 'Guitars, Synths, Keys & Ambiance',
    icon: 'music',
    volume: 1.0,
    pan: 0,
    isMuted: false,
    isSolo: false,
    waveformData: [],
    color: '#065f46',
    accentBg: 'bg-emerald-50',
  },
];

export default function App() {
  const [activeView, setActiveView] = useState<'mixer' | 'stems' | 'practice'>('mixer');
  const [currentTrack, setCurrentTrack] = useState<TrackMetadata | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(24);
  const [masterWaveform, setMasterWaveform] = useState<number[]>([]);
  const [masterVolume, setMasterVolume] = useState(1.0);
  const [pitch, setPitch] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [isLooping, setIsLooping] = useState(false);
  const [metronomeActive, setMetronomeActive] = useState(false);
  const [activePreset, setActivePreset] = useState<PresetType>('all');
  const [stems, setStems] = useState<StemState[]>(initialStems);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Real-time VU Levels
  const [liveLevels, setLiveLevels] = useState<{ [key in StemType]: number }>({
    vocals: 0,
    drums: 0,
    bass: 0,
    other: 0,
  });

  const animFrameRef = useRef<number | null>(null);

  // Load initial demo track on mount
  useEffect(() => {
    loadDemo('golden-sunrise');
  }, []);

  const loadDemo = async (trackId: string) => {
    setIsProcessing(true);
    setProcessingProgress(40);
    setCurrentStepIndex(1);

    try {
      const meta = await audioEngine.loadDemoTrack(trackId);
      setDuration(meta.duration);
      setCurrentTrack(meta);
      setMasterWaveform(audioEngine.getMasterWaveform());

      // Update stem waveforms
      setStems((prev) =>
        prev.map((s) => ({
          ...s,
          waveformData: audioEngine.getStemWaveform(s.id),
          volume: 1.0,
          pan: 0,
          isMuted: false,
          isSolo: false,
        }))
      );
      setActivePreset('all');
      setCurrentTime(0);
      setIsPlaying(false);
    } finally {
      setIsProcessing(false);
      setIsUploadOpen(false);
    }
  };

  // Subscribe to audio engine playback state
  useEffect(() => {
    const unsubscribe = audioEngine.subscribePlayback((state) => {
      setIsPlaying(state.isPlaying);
      setCurrentTime(state.currentTime);
      if (state.duration > 0) setDuration(state.duration);
    });
    return unsubscribe;
  }, []);

  // VU meter polling loop during playback
  useEffect(() => {
    if (!isPlaying) {
      setLiveLevels({ vocals: 0, drums: 0, bass: 0, other: 0 });
      return;
    }

    const updateLevels = () => {
      setLiveLevels(audioEngine.getStemLevels());
      animFrameRef.current = requestAnimationFrame(updateLevels);
    };

    animFrameRef.current = requestAnimationFrame(updateLevels);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying]);

  // Keyboard shortcut: Space to play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, stems]);

  // Master Play / Pause
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      audioEngine.pause();
    } else {
      audioEngine.play(stems);
    }
  }, [isPlaying, stems]);

  // Volume Change for a Stem
  const handleVolumeChange = (id: StemType, vol: number) => {
    setStems((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, volume: vol } : s));
      const targetStem = updated.find((s) => s.id === id);
      const hasAnySolo = updated.some((s) => s.isSolo);
      if (targetStem) audioEngine.updateStemRouting(targetStem, hasAnySolo);
      return updated;
    });
  };

  // Pan Change for a Stem
  const handlePanChange = (id: StemType, pan: number) => {
    setStems((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, pan } : s));
      const targetStem = updated.find((s) => s.id === id);
      const hasAnySolo = updated.some((s) => s.isSolo);
      if (targetStem) audioEngine.updateStemRouting(targetStem, hasAnySolo);
      return updated;
    });
  };

  // Toggle Mute for a Stem
  const handleToggleMute = (id: StemType) => {
    setStems((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, isMuted: !s.isMuted } : s));
      const hasAnySolo = updated.some((s) => s.isSolo);
      for (const stem of updated) {
        audioEngine.updateStemRouting(stem, hasAnySolo);
      }
      return updated;
    });
  };

  // Toggle Solo for a Stem
  const handleToggleSolo = (id: StemType) => {
    setStems((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, isSolo: !s.isSolo } : s));
      const hasAnySolo = updated.some((s) => s.isSolo);
      for (const stem of updated) {
        audioEngine.updateStemRouting(stem, hasAnySolo);
      }
      return updated;
    });
  };

  // Apply Presets (Karaoke, Acapella, Drumless, Bass Focus)
  const handleApplyPreset = (preset: PresetType) => {
    setActivePreset(preset);
    setStems((prev) => {
      const updated = prev.map((stem) => {
        if (preset === 'all') {
          return { ...stem, isMuted: false, isSolo: false, volume: 1.0 };
        } else if (preset === 'karaoke') {
          return { ...stem, isMuted: stem.id === 'vocals', isSolo: false, volume: 1.0 };
        } else if (preset === 'acapella') {
          return { ...stem, isMuted: false, isSolo: stem.id === 'vocals', volume: 1.0 };
        } else if (preset === 'drumless') {
          return { ...stem, isMuted: stem.id === 'drums', isSolo: false, volume: 1.0 };
        } else if (preset === 'bass-focus') {
          return { ...stem, isMuted: false, isSolo: stem.id === 'bass', volume: 1.0 };
        }
        return stem;
      });

      const hasAnySolo = updated.some((s) => s.isSolo);
      for (const s of updated) {
        audioEngine.updateStemRouting(s, hasAnySolo);
      }
      return updated;
    });
  };

  // Handle User Upload
  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setProcessingProgress(10);
    setCurrentStepIndex(0);

    try {
      const meta = await audioEngine.processUploadedAudio(file, (percent, stepIdx) => {
        setProcessingProgress(percent);
        setCurrentStepIndex(stepIdx);
      });

      setCurrentTrack(meta);
      setDuration(meta.duration);
      setMasterWaveform(audioEngine.getMasterWaveform());

      setStems((prev) =>
        prev.map((s) => ({
          ...s,
          waveformData: audioEngine.getStemWaveform(s.id),
          volume: 1.0,
          pan: 0,
          isMuted: false,
          isSolo: false,
        }))
      );
      setActivePreset('all');
      setCurrentTime(0);
      setIsPlaying(false);
      setIsUploadOpen(false);
    } catch (err) {
      console.error('Error processing audio file:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Stem and Mix export
  const handleExportStem = (id: StemType) => {
    audioEngine.exportStem(id, currentTrack?.title);
  };

  const handleExportMix = async () => {
    await audioEngine.exportMix(stems, currentTrack?.title);
  };

  const progressRatio = duration > 0 ? currentTime / duration : 0;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col justify-between selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Bar Header adhering strictly to Top Bar Contract */}
      <Header
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      {/* Main Workspace Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-6">
        {activeView === 'mixer' && (
          <div className="space-y-6">
            {/* Master Transport & Waveform Dock */}
            <GlobalPlayerBar
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              masterWaveform={masterWaveform}
              currentTrack={currentTrack}
              masterVolume={masterVolume}
              pitch={pitch}
              speed={speed}
              isLooping={isLooping}
              metronomeActive={metronomeActive}
              activePreset={activePreset}
              onTogglePlay={togglePlay}
              onSeek={(time) => audioEngine.seek(time, stems)}
              onMasterVolumeChange={(vol) => {
                setMasterVolume(vol);
                audioEngine.setMasterVolume(vol);
              }}
              onPitchChange={(p) => {
                setPitch(p);
                audioEngine.setPitch(p);
              }}
              onSpeedChange={(s) => {
                setSpeed(s);
                audioEngine.setPlaybackRate(s);
              }}
              onToggleLoop={() => {
                const next = !isLooping;
                setIsLooping(next);
                audioEngine.toggleLoop(next, 0, duration);
              }}
              onToggleMetronome={() => {
                const next = !metronomeActive;
                setMetronomeActive(next);
                audioEngine.toggleMetronome(next);
              }}
              onApplyPreset={handleApplyPreset}
              onRestart={() => audioEngine.seek(0, stems)}
            />

            {/* 4 Individual Stem Channel Strips Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Individual Stem Channels (Demucs 4-Track Separation)</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Double-click sliders to reset · Space to Play/Pause
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stems.map((stem) => (
                  <StemChannelCard
                    key={stem.id}
                    stem={stem}
                    onVolumeChange={handleVolumeChange}
                    onPanChange={handlePanChange}
                    onToggleMute={handleToggleMute}
                    onToggleSolo={handleToggleSolo}
                    onExportStem={handleExportStem}
                    onSeekToRatio={(ratio) => audioEngine.seek(ratio * duration, stems)}
                    liveLevel={liveLevels[stem.id] || 0}
                    playbackProgressRatio={progressRatio}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeView === 'stems' && (
          <DemucsSeparationView
            currentTrack={currentTrack}
            onOpenUpload={() => setIsUploadOpen(true)}
            onSwitchToMixer={() => setActiveView('mixer')}
          />
        )}

        {activeView === 'practice' && (
          <PracticeSuiteView
            currentTrack={currentTrack}
            pitch={pitch}
            speed={speed}
            isLooping={isLooping}
            metronomeActive={metronomeActive}
            activePreset={activePreset}
            onPitchChange={(p) => {
              setPitch(p);
              audioEngine.setPitch(p);
            }}
            onSpeedChange={(s) => {
              setSpeed(s);
              audioEngine.setPlaybackRate(s);
            }}
            onToggleLoop={() => {
              const next = !isLooping;
              setIsLooping(next);
              audioEngine.toggleLoop(next, 0, duration);
            }}
            onToggleMetronome={() => {
              const next = !metronomeActive;
              setMetronomeActive(next);
              audioEngine.toggleMetronome(next);
            }}
            onApplyPreset={handleApplyPreset}
            onSwitchToMixer={() => setActiveView('mixer')}
          />
        )}
      </main>

      {/* Clean Apple-style Footer */}
      <footer className="w-full border-t border-black/[0.05] py-4 px-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Moises Studio · Demucs Source Separation & Stem Player</span>
          <div className="flex items-center gap-3">
            <span>Lossless 16-bit PCM Audio</span>
            <span aria-hidden="true">·</span>
            <span>Client-side Web Audio API</span>
          </div>
        </div>
      </footer>

      {/* Upload & Demucs Separation Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSelectDemoTrack={loadDemo}
        onFileUpload={handleFileUpload}
        isProcessing={isProcessing}
        processingProgress={processingProgress}
        currentStepIndex={currentStepIndex}
      />

      {/* Stem & Custom Mix Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        stems={stems}
        currentTrack={currentTrack}
        onExportStem={handleExportStem}
        onExportMix={handleExportMix}
      />
    </div>
  );
}
