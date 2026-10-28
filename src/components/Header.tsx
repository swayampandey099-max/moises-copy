import React from 'react';
import { Sliders, UploadCloud, Download, Sparkles, Music } from 'lucide-react';

interface HeaderProps {
  onOpenUpload: () => void;
  onOpenExport: () => void;
  activeView: 'mixer' | 'stems' | 'practice';
  setActiveView: (view: 'mixer' | 'stems' | 'practice') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenUpload,
  onOpenExport,
  activeView,
  setActiveView,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full frosted-glass border-b border-black/[0.06] px-6 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Strict single line, no subtitle clutter) */}
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
            <Sliders className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span className="text-[17px] font-semibold tracking-tight text-slate-900">
            Moises <span className="font-normal text-emerald-600">Demucs</span>
          </span>
        </div>

        {/* Zone 2: Navigation Links (Single line, text with clean active indicator) */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <button
            onClick={() => setActiveView('mixer')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeView === 'mixer'
                ? 'text-emerald-700 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Stem Mixer
          </button>
          <button
            onClick={() => setActiveView('stems')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeView === 'stems'
                ? 'text-emerald-700 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Demucs Separation
          </button>
          <button
            onClick={() => setActiveView('practice')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeView === 'practice'
                ? 'text-emerald-700 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Practice Suite
          </button>
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export Audio</span>
          </button>
        </nav>

        {/* Zone 3: 1 Primary CTA Button */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 active:bg-emerald-800 transition-all shadow-sm shadow-emerald-600/25 whitespace-nowrap shrink-0"
          >
            <UploadCloud className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>Upload Audio</span>
          </button>
        </div>
      </div>
    </header>
  );
};
