import React, { useState, useRef } from 'react';
import { UploadCloud, Music, Sparkles, CheckCircle2, Loader2, X, Play } from 'lucide-react';
import { ProcessingStep } from '../types/audio';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDemoTrack: (trackId: string) => void;
  onFileUpload: (file: File) => void;
  isProcessing: boolean;
  processingProgress: number;
  currentStepIndex: number;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onSelectDemoTrack,
  onFileUpload,
  isProcessing,
  processingProgress,
  currentStepIndex,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const separationSteps: ProcessingStep[] = [
    {
      id: 'step-1',
      title: 'Audio STFT Spectral Analysis',
      detail: 'Computing Short-Time Fourier Transform and frequency bins',
      progress: 25,
      status: currentStepIndex > 0 ? 'completed' : currentStepIndex === 0 ? 'active' : 'pending',
    },
    {
      id: 'step-2',
      title: 'Vocal Formant & Mid-Side Demixing',
      detail: 'Isolating center channel vocal formants (250Hz - 3.8kHz)',
      progress: 50,
      status: currentStepIndex > 1 ? 'completed' : currentStepIndex === 1 ? 'active' : 'pending',
    },
    {
      id: 'step-3',
      title: 'Drum Transients & Sub-Bass Separation',
      detail: 'Decoupling percussive kick/snare attacks and sub-bass harmonics',
      progress: 75,
      status: currentStepIndex > 2 ? 'completed' : currentStepIndex === 2 ? 'active' : 'pending',
    },
    {
      id: 'step-4',
      title: 'Stem Synthesis & Buffer Reconstruction',
      detail: 'Normalizing 4 discrete studio stems for real-time mixer',
      progress: 100,
      status: currentStepIndex > 3 ? 'completed' : currentStepIndex === 3 ? 'active' : 'pending',
    },
  ];

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isProcessing) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.includes('audio') || /\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(file.name)) {
        onFileUpload(file);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md">
      <div className="relative w-full max-w-xl frosted-glass rounded-3xl p-6 sm:p-8 border border-white/90 shadow-2xl shadow-slate-900/10 transition-all">
        {/* Modal Close Button */}
        {!isProcessing && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Modal Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Demucs v4 Neural Engine</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Audio Source Separation
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Upload any song file to isolate Vocals, Drums, Bass, and Other instruments into clean individual stems.
          </p>
        </div>

        {/* Processing State View */}
        {isProcessing ? (
          <div className="py-6 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600 shadow-sm animate-pulse">
                <Loader2 className="w-7 h-7 animate-spin" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                Demucs Neural Processing...
              </h3>
              <p className="text-xs text-slate-500 font-mono tabular-nums">
                {processingProgress}% Complete
              </p>
            </div>

            {/* Overall Progress Bar */}
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden p-[1px]">
              <div
                style={{ width: `${processingProgress}%` }}
                className="h-full bg-emerald-600 rounded-full transition-all duration-300 shadow-sm shadow-emerald-600/30"
              />
            </div>

            {/* Neural Separation Pipeline Stages */}
            <div className="space-y-3 pt-2">
              {separationSteps.map((step) => (
                <div
                  key={step.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-colors ${
                    step.status === 'completed'
                      ? 'bg-emerald-50/50 border-emerald-200/60 text-slate-800'
                      : step.status === 'active'
                      ? 'bg-white border-emerald-500/40 text-slate-900 shadow-sm'
                      : 'bg-transparent border-transparent text-slate-400 opacity-60'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : step.status === 'active' ? (
                      <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold">{step.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Drag & Drop Upload Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center ${
                isDragOver
                  ? 'border-emerald-500 bg-emerald-50/40'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/40 hover:bg-slate-50/70'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac"
                onChange={handleFileInput}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-center text-emerald-600 mb-3">
                <UploadCloud className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">
                Choose an audio file or drag and drop
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                MP3, WAV, FLAC, M4A, or OGG up to 50MB
              </p>
              <button
                type="button"
                className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg shadow-sm hover:bg-emerald-700 transition-colors pointer-events-none"
              >
                Browse Audio Files
              </button>
            </div>

            {/* Quick Demo Tracks Selection */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-semibold text-slate-700">
                  Or load instant studio demo stems
                </span>
                <span className="text-[11px] text-slate-400">
                  Pre-separated 4 stems
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  onClick={() => onSelectDemoTrack('golden-sunrise')}
                  className="p-3 text-left rounded-xl bg-white/80 hover:bg-white border border-black/[0.05] hover:border-emerald-500/40 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      Funk / Pop
                    </span>
                    <Play className="w-3 h-3 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                  </div>
                  <h4 className="text-xs font-semibold text-slate-900 truncate">
                    Golden Sunrise
                  </h4>
                  <p className="text-[11px] text-slate-400">118 BPM · G Minor</p>
                </button>

                <button
                  onClick={() => onSelectDemoTrack('neon-boulevard')}
                  className="p-3 text-left rounded-xl bg-white/80 hover:bg-white border border-black/[0.05] hover:border-emerald-500/40 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      Synthwave
                    </span>
                    <Play className="w-3 h-3 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                  </div>
                  <h4 className="text-xs font-semibold text-slate-900 truncate">
                    Neon Boulevard
                  </h4>
                  <p className="text-[11px] text-slate-400">124 BPM · D Minor</p>
                </button>

                <button
                  onClick={() => onSelectDemoTrack('acoustic-horizon')}
                  className="p-3 text-left rounded-xl bg-white/80 hover:bg-white border border-black/[0.05] hover:border-emerald-500/40 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      Indie Folk
                    </span>
                    <Play className="w-3 h-3 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                  </div>
                  <h4 className="text-xs font-semibold text-slate-900 truncate">
                    Acoustic Horizon
                  </h4>
                  <p className="text-[11px] text-slate-400">96 BPM · C Major</p>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
