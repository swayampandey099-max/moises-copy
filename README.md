# Moises Demucs - Audio Source Separation & Stem Mixer

An Apple-inspired, minimalistic web workstation for audio source separation powered by Demucs 4-stem extraction. Built with a soft neutral aesthetic, frosted glass surfaces, and soft green accents.

![Moises Demucs Interface](https://raw.githubusercontent.com/swayampandey099-max/moises-copy/main/preview.png)

## Features

- **Demucs 4-Stem Audio Separation**:
  - Upload audio files (`.mp3`, `.wav`, `.m4a`, `.aac`, `.flac`, `.ogg`).
  - Isolate into 4 discrete channels: **Vocals** (250Hz - 3.8kHz formants), **Drums** (percussive transients & kicks), **Bass** (sub-harmonics 25Hz - 180Hz), and **Other** (melodic guitars, keyboards, synths).
  - 3 instant studio demo tracks (*Golden Sunrise* Funk/Pop, *Neon Boulevard* Synthwave, *Acoustic Horizon* Indie Folk).
- **Independent Stem Controls**:
  - Precision volume faders (0% to 150%) with real-time dB calculation (`-inf dB`, `0.0 dB`, `+2.1 dB`, `Muted`).
  - Stereo pan sliders (L100 to R100).
  - Individual Mute (M) and Solo (S) buttons with zero latency.
  - Interactive stem waveforms with scrubbable timeline.
  - Real-time animated VU level meters.
- **Musician Practice Suite**:
  - **Key Transposition**: Real-time pitch shifter ($\pm6$ semitones) without tempo changes.
  - **Tempo / Speed Control**: Playback speed adjustment (`0.75x`, `0.90x`, `1.00x`, `1.10x`, `1.25x`).
  - **BPM-Synced Metronome**: Synchronized click track with accented downbeat.
  - **Rehearsal Presets**: 1-click toggles for *Karaoke* (lead vocal mute), *Acapella* (vocal solo), *Drumless* (drum practice), and *Bassline* (bass transcription).
  - **Loop Mode**: Seamless rehearsal looping.
- **Master & Stem Export**:
  - Export individual isolated stems as lossless 16-bit 44.1kHz WAV.
  - Render custom balanced stereo mixes with your exact slider levels.

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Motion
- **Audio Engine**: Web Audio API (native client-side DSP, OfflineAudioContext for rendering, zero server bottlenecks)
- **Bundler**: Vite

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm / pnpm / bun

### Installation

```bash
# Clone the repository
git clone https://github.com/swayampandey099-max/moises-copy.git
cd moises-copy

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app in your browser.

### Build

```bash
npm run build
```

## License

Apache-2.0
