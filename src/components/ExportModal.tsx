import React, { useState } from 'react';
import { Download, X, Check, FileAudio, Disc, Music, Mic, Drum, Guitar } from 'lucide-react';
import { StemState, StemType, TrackMetadata } from '../types/audio';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  stems: StemState[];
  currentTrack: TrackMetadata | null;
  onExportStem: (id: StemType) => void;
  onExportMix: () => Promise<void>;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  stems,
  currentTrack,
  onExportStem,
  onExportMix,
}) => {
  const [isExportingMix, setIsExportingMix] = useState(false);
  const [downloadedStem, setDownloadedStem] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleMixExport = async () => {
    setIsExportingMix(true);
    try {
      await onExportMix();
    } finally {
      setIsExportingMix(false);
    }
  };

  const handleStemDownload = (id: StemType) => {
    onExportStem(id);
    setDownloadedStem(id);
    setTimeout(() => setDownloadedStem(null), 2500);
  };

  const renderIcon = (id: StemType) => {
    switch (id) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md">
      <div className="relative w-full max-w-lg frosted-glass rounded-3xl p-6 sm:p-8 border border-white/90 shadow-2xl shadow-slate-900/10">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100/60 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 mb-1">
            <Disc className="w-3.5 h-3.5" />
            <span>Master Audio Export</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Export Stems & Mix
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Download individual isolated stems or export your custom balanced audio mix in 16-bit lossless WAV format.
          </p>
        </div>

        {/* Option 1: Custom Mix Export */}
        <div className="mb-6 p-4 rounded-2xl bg-white border border-slate-200/70 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Custom Master Mix (.WAV)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Renders your active volume faders, pans, and mutes into a single stereo master track.
              </p>
            </div>
            <button
              onClick={handleMixExport}
              disabled={isExportingMix}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 transition-colors shadow-sm shadow-emerald-600/30 whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExportingMix ? 'Rendering...' : 'Export Mix'}</span>
            </button>
          </div>
        </div>

        {/* Option 2: Individual Stem Downloads */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-semibold text-slate-700 mb-2">
            Isolated Stems (Demucs 4-Track)
          </h4>
          <div className="space-y-2">
            {stems.map((stem) => (
              <div
                key={stem.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white/70 hover:bg-white border border-black/[0.04] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/50 flex items-center justify-center shrink-0">
                    {renderIcon(stem.id)}
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-slate-900">
                      {stem.name} Stem
                    </h5>
                    <p className="text-[11px] text-slate-400">
                      Lossless 16-bit 44.1kHz WAV
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleStemDownload(stem.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 ${
                    downloadedStem === stem.id
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-semibold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {downloadedStem === stem.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Downloaded</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Technical specs footer */}
        <div className="mt-6 pt-4 border-t border-black/[0.05] flex items-center justify-between text-[11px] text-slate-400">
          <span>Audio Engine: Demucs v4 HTDemucs</span>
          <span>Sample Rate: 44.1 kHz PCM</span>
        </div>
      </div>
    </div>
  );
};
