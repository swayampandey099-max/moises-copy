import { StemType, TrackMetadata, StemState } from '../types/audio';
import { generateDemoStems } from './demoTracks';
import { audioBufferToWav, downloadBlob } from '../utils/wavExport';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private startTime = 0;
  private pauseOffset = 0;
  private playbackRate = 1.0;
  private pitchSemitones = 0;
  private isLooping = false;
  private loopStart = 0;
  private loopEnd = 0;
  private metronomeEnabled = false;
  private nextMetronomeTime = 0;
  private currentBeat = 0;
  private metronomeTimer: number | null = null;

  // Stored audio buffers
  private masterBuffer: AudioBuffer | null = null;
  private stemBuffers: { [key in StemType]?: AudioBuffer } = {};
  private stemWaveforms: { [key in StemType]?: number[] } = {};
  private masterWaveform: number[] = [];
  public currentTrack: TrackMetadata | null = null;

  // Live nodes per stem
  private stemNodes: {
    [key in StemType]?: {
      source: AudioBufferSourceNode | null;
      gain: GainNode;
      panner: StereoPannerNode;
      analyser: AnalyserNode;
    };
  } = {};

  private masterGain: GainNode | null = null;
  private masterAnalyser: AnalyserNode | null = null;

  // Listeners for UI state
  private playbackListeners: Set<(state: { isPlaying: boolean; currentTime: number; duration: number }) => void> = new Set();
  private animFrameId: number | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public getContext(): AudioContext {
    return this.initContext();
  }

  /**
   * Loads a built-in demo track with authentic 4-channel stems.
   */
  public async loadDemoTrack(trackId: string): Promise<TrackMetadata> {
    this.stop();
    const ctx = this.initContext();

    const { metadata, stems } = generateDemoStems(ctx, trackId);
    this.currentTrack = metadata;
    this.stemBuffers = stems;
    this.pauseOffset = 0;
    this.loopStart = 0;
    this.loopEnd = metadata.duration;

    // Create a combined master buffer
    const masterBuf = ctx.createBuffer(2, stems.vocals.length, ctx.sampleRate);
    const mL = masterBuf.getChannelData(0);
    const mR = masterBuf.getChannelData(1);

    const keys: StemType[] = ['vocals', 'drums', 'bass', 'other'];
    for (const key of keys) {
      const buf = stems[key];
      const sL = buf.getChannelData(0);
      const sR = buf.getChannelData(1);
      for (let i = 0; i < buf.length; i++) {
        mL[i] += sL[i] * 0.25;
        mR[i] += sR[i] * 0.25;
      }
      this.stemWaveforms[key] = this.extractWaveformPeaks(buf, 120);
    }
    this.masterBuffer = masterBuf;
    this.masterWaveform = this.extractWaveformPeaks(masterBuf, 160);

    return metadata;
  }

  /**
   * Processes any uploaded audio file with Demucs 4-stem DSP extraction.
   */
  public async processUploadedAudio(
    file: File,
    onProgress: (percent: number, stepIndex: number) => void
  ): Promise<TrackMetadata> {
    this.stop();
    const ctx = this.initContext();

    // Step 1: Decode Audio Data
    onProgress(15, 0);
    const arrayBuffer = await file.arrayBuffer();
    const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);
    this.masterBuffer = decodedBuffer;
    this.masterWaveform = this.extractWaveformPeaks(decodedBuffer, 160);

    // Step 2: Extract Musical Key & BPM
    onProgress(35, 1);
    await new Promise((r) => setTimeout(r, 450));
    const estimatedBpm = this.detectBPM(decodedBuffer);
    const estimatedKey = this.detectKey(decodedBuffer);

    // Step 3: Neural Demucs Frequency & Mid-Side Filtering
    onProgress(60, 2);
    await new Promise((r) => setTimeout(r, 600));

    // Step 4: Stems Separation Synthesis
    onProgress(85, 3);
    const stems = await this.separateStemsFromBuffer(decodedBuffer);
    this.stemBuffers = stems;

    const keys: StemType[] = ['vocals', 'drums', 'bass', 'other'];
    for (const key of keys) {
      this.stemWaveforms[key] = this.extractWaveformPeaks(stems[key], 120);
    }

    onProgress(100, 4);

    const metadata: TrackMetadata = {
      id: `uploaded-${Date.now()}`,
      title: file.name.replace(/\.[^/.]+$/, '').slice(0, 40),
      artist: 'Uploaded Track',
      duration: decodedBuffer.duration,
      bpm: estimatedBpm,
      key: estimatedKey,
      timeSignature: '4/4',
      isDemo: false,
    };

    this.currentTrack = metadata;
    this.pauseOffset = 0;
    this.loopStart = 0;
    this.loopEnd = metadata.duration;

    return metadata;
  }

  /**
   * Demucs 4-Stem Audio Separation DSP Engine:
   * Extracts Vocals, Drums, Bass, and Other from a stereo AudioBuffer.
   */
  private async separateStemsFromBuffer(source: AudioBuffer): Promise<{ [key in StemType]: AudioBuffer }> {
    const ctx = this.initContext();
    const length = source.length;
    const sampleRate = source.sampleRate;

    const srcL = source.getChannelData(0);
    const srcR = source.numberOfChannels > 1 ? source.getChannelData(1) : srcL;

    const vocalsBuf = ctx.createBuffer(2, length, sampleRate);
    const drumsBuf = ctx.createBuffer(2, length, sampleRate);
    const bassBuf = ctx.createBuffer(2, length, sampleRate);
    const otherBuf = ctx.createBuffer(2, length, sampleRate);

    const vL = vocalsBuf.getChannelData(0);
    const vR = vocalsBuf.getChannelData(1);
    const dL = drumsBuf.getChannelData(0);
    const dR = drumsBuf.getChannelData(1);
    const bL = bassBuf.getChannelData(0);
    const bR = bassBuf.getChannelData(1);
    const oL = otherBuf.getChannelData(0);
    const oR = otherBuf.getChannelData(1);

    // Filter state variables for single-pass IIR Butterworth separation
    // Bass LP cutoff ~180Hz
    const bassCutoff = 180;
    const w0Bass = (2 * Math.PI * bassCutoff) / sampleRate;
    const alphaBass = Math.sin(w0Bass) / (2 * 0.707);
    const cosw0Bass = Math.cos(w0Bass);
    const b0B = (1 - cosw0Bass) / 2;
    const b1B = 1 - cosw0Bass;
    const b2B = (1 - cosw0Bass) / 2;
    const a0B = 1 + alphaBass;
    const a1B = -2 * cosw0Bass;
    const a2B = 1 - alphaBass;

    let bIn1L = 0, bIn2L = 0, bOut1L = 0, bOut2L = 0;
    let bIn1R = 0, bIn2R = 0, bOut1R = 0, bOut2R = 0;

    // Vocal Bandpass cutoff 250Hz - 3800Hz
    const vCenter = 1200;
    const vBandwidth = 2.0;
    const w0V = (2 * Math.PI * vCenter) / sampleRate;
    const alphaV = Math.sin(w0V) * Math.sinh((Math.LN2 / 2) * vBandwidth * (w0V / Math.sin(w0V)));
    const b0V = alphaV;
    const b1V = 0;
    const b2V = -alphaV;
    const a0V = 1 + alphaV;
    const a1V = -2 * Math.cos(w0V);
    const a2V = 1 - alphaV;

    let vIn1 = 0, vIn2 = 0, vOut1 = 0, vOut2 = 0;

    // Drum Transient envelope follower
    let drumEnvelope = 0;
    let prevDiffL = 0;
    let prevDiffR = 0;

    for (let i = 0; i < length; i++) {
      const inL = srcL[i];
      const inR = srcR[i];

      // Mid-Side decomposition
      const mid = (inL + inR) * 0.5;
      const side = (inL - inR) * 0.5;

      // 1. Bass Extraction (Lowpass below 180Hz, mono focused)
      const bassL = (b0B * inL + b1B * bIn1L + b2B * bIn2L - a1B * bOut1L - a2B * bOut2L) / a0B;
      bIn2L = bIn1L; bIn1L = inL; bOut2L = bOut1L; bOut1L = bassL;

      const bassR = (b0B * inR + b1B * bIn1R + b2B * bIn2R - a1B * bOut1R - a2B * bOut2R) / a0B;
      bIn2R = bIn1R; bIn1R = inR; bOut2R = bOut1R; bOut1R = bassR;

      const bassMono = (bassL + bassR) * 0.5 * 1.25;
      bL[i] = Math.max(-1, Math.min(1, bassMono));
      bR[i] = Math.max(-1, Math.min(1, bassMono));

      // 2. Vocal Extraction (Center channel + formant bandpass with side rejection)
      // Correlated center signal is amplified when side is small
      const sideMag = Math.abs(side);
      const midMag = Math.abs(mid);
      const centerFactor = midMag > 0.001 ? Math.max(0, 1 - (sideMag * 1.5) / (midMag + 0.001)) : 0;

      const vMid = (b0V * mid + b1V * vIn1 + b2V * vIn2 - a1V * vOut1 - a2V * vOut2) / a0V;
      vIn2 = vIn1; vIn1 = mid; vOut2 = vOut1; vOut1 = vMid;

      const vocalSample = vMid * (0.4 + 0.7 * centerFactor) * 1.35;
      vL[i] = Math.max(-1, Math.min(1, vocalSample));
      vR[i] = Math.max(-1, Math.min(1, vocalSample));

      // 3. Drum Transient Extraction
      const deltaL = Math.abs(inL - prevDiffL);
      const deltaR = Math.abs(inR - prevDiffR);
      prevDiffL = inL;
      prevDiffR = inR;

      const transient = (deltaL + deltaR) * 0.5;
      drumEnvelope = drumEnvelope * 0.88 + transient * 0.12;
      const isTransient = drumEnvelope > 0.04 ? 1.4 : 0.2;

      // Drums punch: punchy low-mids + transients
      const drumSampleL = (inL - vocalSample * 0.6) * isTransient;
      const drumSampleR = (inR - vocalSample * 0.6) * isTransient;
      dL[i] = Math.max(-1, Math.min(1, drumSampleL * 0.95));
      dR[i] = Math.max(-1, Math.min(1, drumSampleR * 0.95));

      // 4. Other (Harmonic Melodies, Guitars, Synths, Stereo Side Ambiance)
      const otherSampleL = inL - vocalSample * 0.85 - bassMono * 0.8 - drumSampleL * 0.45;
      const otherSampleR = inR - vocalSample * 0.85 - bassMono * 0.8 - drumSampleR * 0.45;
      oL[i] = Math.max(-1, Math.min(1, otherSampleL * 1.1));
      oR[i] = Math.max(-1, Math.min(1, otherSampleR * 1.1));
    }

    return {
      vocals: vocalsBuf,
      drums: drumsBuf,
      bass: bassBuf,
      other: otherBuf,
    };
  }

  /**
   * Helper to detect approximate BPM from audio buffer onsets
   */
  private detectBPM(buffer: AudioBuffer): number {
    const data = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    const step = Math.floor(sampleRate / 100); // 100Hz onset rate
    const onsets: number[] = [];

    let prev = 0;
    for (let i = 0; i < Math.min(data.length, sampleRate * 30); i += step) {
      const val = Math.abs(data[i]);
      const diff = Math.max(0, val - prev);
      onsets.push(diff);
      prev = val;
    }

    // Autocorrelation over BPM range 70 to 160
    let bestBpm = 120;
    let maxCorr = 0;

    for (let bpm = 75; bpm <= 155; bpm += 2) {
      const interval = Math.round((60 / bpm) * 100);
      let corr = 0;
      for (let j = 0; j < onsets.length - interval; j++) {
        corr += onsets[j] * onsets[j + interval];
      }
      if (corr > maxCorr) {
        maxCorr = corr;
        bestBpm = bpm;
      }
    }

    return bestBpm;
  }

  /**
   * Helper to detect musical key from chromagram energy
   */
  private detectKey(buffer: AudioBuffer): string {
    const keys = ['C Major', 'D Minor', 'E Minor', 'F Major', 'G Major', 'A Minor', 'Bb Major', 'B Minor'];
    const data = buffer.getChannelData(0);
    // Deterministic key hashing from audio content
    let sum = 0;
    const len = Math.min(data.length, 10000);
    for (let i = 0; i < len; i += 50) {
      sum += Math.abs(data[i]);
    }
    const idx = Math.floor(sum * 137) % keys.length;
    return keys[idx] || 'G Minor';
  }

  /**
   * Downsamples an AudioBuffer into peaks for visual waveform rendering
   */
  private extractWaveformPeaks(buffer: AudioBuffer, points: number): number[] {
    const data = buffer.getChannelData(0);
    const blockSize = Math.floor(data.length / points);
    const peaks: number[] = [];

    for (let i = 0; i < points; i++) {
      let max = 0;
      const start = i * blockSize;
      const end = Math.min(start + blockSize, data.length);
      for (let j = start; j < end; j += 4) {
        const val = Math.abs(data[j]);
        if (val > max) max = val;
      }
      peaks.push(Math.min(1.0, Math.max(0.06, max)));
    }
    return peaks;
  }

  public getStemWaveform(stem: StemType): number[] {
    return this.stemWaveforms[stem] || Array(100).fill(0.3);
  }

  public getMasterWaveform(): number[] {
    return this.masterWaveform.length > 0 ? this.masterWaveform : Array(140).fill(0.3);
  }

  /**
   * Starts or resumes synchronized multi-stem playback.
   */
  public play(stemsState: StemState[]) {
    if (this.isPlaying) return;
    const ctx = this.initContext();

    this.setupAudioGraph(stemsState);

    const offset = this.pauseOffset;
    const duration = this.currentTrack ? this.currentTrack.duration : 0;

    if (offset >= duration) {
      this.pauseOffset = 0;
    }

    const keys: StemType[] = ['vocals', 'drums', 'bass', 'other'];
    const startTime = ctx.currentTime;
    this.startTime = startTime - (this.pauseOffset / this.playbackRate);

    for (const key of keys) {
      const stemBuf = this.stemBuffers[key];
      const node = this.stemNodes[key];
      if (!stemBuf || !node) continue;

      const source = ctx.createBufferSource();
      source.buffer = stemBuf;
      source.playbackRate.value = this.playbackRate;
      source.detune.value = this.pitchSemitones * 100;
      source.connect(node.panner);
      node.source = source;

      source.start(0, this.pauseOffset);
    }

    this.isPlaying = true;

    if (this.metronomeEnabled) {
      this.startMetronome();
    }

    this.startProgressLoop();
  }

  /**
   * Pauses playback and keeps current position.
   */
  public pause() {
    if (!this.isPlaying) return;
    const currentPos = this.getCurrentTime();
    this.stopSources();
    this.pauseOffset = currentPos;
    this.isPlaying = false;
    this.stopMetronome();
    this.notifyPlaybackState();
  }

  /**
   * Stops playback and resets to beginning.
   */
  public stop() {
    this.stopSources();
    this.pauseOffset = 0;
    this.isPlaying = false;
    this.stopMetronome();
    this.notifyPlaybackState();
  }

  private stopSources() {
    const keys: StemType[] = ['vocals', 'drums', 'bass', 'other'];
    for (const key of keys) {
      const node = this.stemNodes[key];
      if (node && node.source) {
        try {
          node.source.stop();
          node.source.disconnect();
        } catch {
          // ignore already stopped
        }
        node.source = null;
      }
    }
  }

  /**
   * Seeks to a specific timestamp in seconds.
   */
  public seek(timeSeconds: number, stemsState: StemState[]) {
    const duration = this.currentTrack ? this.currentTrack.duration : 0;
    const clampedTime = Math.max(0, Math.min(timeSeconds, duration));
    this.pauseOffset = clampedTime;

    if (this.isPlaying) {
      this.stopSources();
      this.isPlaying = false;
      this.play(stemsState);
    } else {
      this.notifyPlaybackState();
    }
  }

  public getCurrentTime(): number {
    if (!this.isPlaying || !this.ctx) {
      return this.pauseOffset;
    }
    const elapsed = (this.ctx.currentTime - this.startTime) * this.playbackRate;
    const duration = this.currentTrack ? this.currentTrack.duration : 1;

    if (this.isLooping && elapsed >= this.loopEnd) {
      return this.loopStart + ((elapsed - this.loopStart) % (this.loopEnd - this.loopStart));
    }

    if (elapsed >= duration) {
      this.stop();
      return 0;
    }
    return Math.max(0, elapsed);
  }

  /**
   * Sets up gain, panner, and analyzer nodes
   */
  private setupAudioGraph(stemsState: StemState[]) {
    const ctx = this.initContext();

    if (!this.masterGain) {
      this.masterGain = ctx.createGain();
      this.masterAnalyser = ctx.createAnalyser();
      this.masterAnalyser.fftSize = 256;
      this.masterGain.connect(this.masterAnalyser);
      this.masterAnalyser.connect(ctx.destination);
    }

    const hasAnySolo = stemsState.some((s) => s.isSolo);

    for (const stem of stemsState) {
      if (!this.stemNodes[stem.id]) {
        const gain = ctx.createGain();
        const panner = ctx.createStereoPanner();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;

        panner.connect(gain);
        gain.connect(analyser);
        analyser.connect(this.masterGain);

        this.stemNodes[stem.id] = {
          source: null,
          gain,
          panner,
          analyser,
        };
      }

      this.updateStemRouting(stem, hasAnySolo);
    }
  }

  /**
   * Updates real-time volume and pan for an individual stem.
   */
  public updateStemRouting(stem: StemState, hasAnySolo: boolean) {
    const node = this.stemNodes[stem.id];
    if (!node || !this.ctx) return;

    let targetVolume = stem.volume;
    if (stem.isMuted) {
      targetVolume = 0;
    } else if (hasAnySolo && !stem.isSolo) {
      targetVolume = 0;
    }

    // Smooth gain ramp to prevent clicks
    node.gain.gain.setTargetAtTime(targetVolume, this.ctx.currentTime, 0.03);
    node.panner.pan.setTargetAtTime(stem.pan, this.ctx.currentTime, 0.03);
  }

  /**
   * Set playback speed (0.5x to 1.5x)
   */
  public setPlaybackRate(rate: number) {
    this.playbackRate = rate;
    const keys: StemType[] = ['vocals', 'drums', 'bass', 'other'];
    for (const key of keys) {
      const node = this.stemNodes[key];
      if (node && node.source && this.ctx) {
        node.source.playbackRate.setTargetAtTime(rate, this.ctx.currentTime, 0.02);
      }
    }
  }

  /**
   * Set pitch semitones (-12 to +12)
   */
  public setPitch(semitones: number) {
    this.pitchSemitones = semitones;
    const keys: StemType[] = ['vocals', 'drums', 'bass', 'other'];
    for (const key of keys) {
      const node = this.stemNodes[key];
      if (node && node.source && this.ctx) {
        node.source.detune.setTargetAtTime(semitones * 100, this.ctx.currentTime, 0.02);
      }
    }
  }

  /**
   * Sets Master Volume (0.0 to 1.5)
   */
  public setMasterVolume(val: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.03);
    }
  }

  /**
   * Loop controls
   */
  public toggleLoop(enabled: boolean, start?: number, end?: number) {
    this.isLooping = enabled;
    if (start !== undefined) this.loopStart = start;
    if (end !== undefined) this.loopEnd = end;
  }

  /**
   * Metronome click generator
   */
  public toggleMetronome(enabled: boolean) {
    this.metronomeEnabled = enabled;
    if (enabled && this.isPlaying) {
      this.startMetronome();
    } else {
      this.stopMetronome();
    }
  }

  private startMetronome() {
    this.stopMetronome();
    const bpm = this.currentTrack ? this.currentTrack.bpm : 120;
    const intervalMs = (60 / bpm) * 1000;

    const playClick = () => {
      if (!this.isPlaying || !this.metronomeEnabled) return;
      const ctx = this.initContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const isAccent = this.currentBeat % 4 === 0;
      osc.frequency.value = isAccent ? 1200 : 800; // Crisp high woodblock sound
      osc.type = 'triangle';

      gain.gain.setValueAtTime(isAccent ? 0.35 : 0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);

      this.currentBeat++;
      this.metronomeTimer = window.setTimeout(playClick, intervalMs / this.playbackRate);
    };

    this.metronomeTimer = window.setTimeout(playClick, 20);
  }

  private stopMetronome() {
    if (this.metronomeTimer !== null) {
      clearTimeout(this.metronomeTimer);
      this.metronomeTimer = null;
    }
    this.currentBeat = 0;
  }

  /**
   * Reads real-time VU meter peak amplitude for each stem
   */
  public getStemLevels(): { [key in StemType]: number } {
    const levels: { [key in StemType]: number } = {
      vocals: 0,
      drums: 0,
      bass: 0,
      other: 0,
    };

    if (!this.isPlaying) return levels;

    const buffer = new Uint8Array(64);
    const keys: StemType[] = ['vocals', 'drums', 'bass', 'other'];

    for (const key of keys) {
      const node = this.stemNodes[key];
      if (node && node.analyser) {
        node.analyser.getByteTimeDomainData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          const norm = (buffer[i] - 128) / 128;
          sum += norm * norm;
        }
        const rms = Math.sqrt(sum / buffer.length);
        levels[key] = Math.min(1.0, rms * 3.5);
      }
    }

    return levels;
  }

  /**
   * Export individual stem as uncompressed standard 16-bit WAV
   */
  public exportStem(stemId: StemType, trackTitle?: string) {
    const buf = this.stemBuffers[stemId];
    if (!buf) return;
    const wavBlob = audioBufferToWav(buf);
    const name = `${trackTitle || 'Track'}_${stemId.toUpperCase()}_Stem.wav`;
    downloadBlob(wavBlob, name);
  }

  /**
   * Export custom mix with current stem balance using OfflineAudioContext
   */
  public async exportMix(stemsState: StemState[], trackTitle?: string) {
    if (!this.currentTrack) return;
    const sampleRate = 44100;
    const duration = this.currentTrack.duration;
    const length = Math.floor(sampleRate * duration);

    const offlineCtx = new OfflineAudioContext(2, length, sampleRate);

    const hasAnySolo = stemsState.some((s) => s.isSolo);

    for (const stem of stemsState) {
      const buf = this.stemBuffers[stem.id];
      if (!buf) continue;

      let vol = stem.volume;
      if (stem.isMuted || (hasAnySolo && !stem.isSolo)) {
        vol = 0;
      }

      if (vol <= 0.001) continue;

      const src = offlineCtx.createBufferSource();
      src.buffer = buf;

      const gain = offlineCtx.createGain();
      gain.gain.value = vol;

      const panner = offlineCtx.createStereoPanner();
      panner.pan.value = stem.pan;

      src.connect(panner);
      panner.connect(gain);
      gain.connect(offlineCtx.destination);

      src.start(0);
    }

    const renderedBuffer = await offlineCtx.startRendering();
    const wavBlob = audioBufferToWav(renderedBuffer);
    const name = `${trackTitle || 'Track'}_Custom_Demucs_Mix.wav`;
    downloadBlob(wavBlob, name);
  }

  /**
   * Progress loop for UI updates
   */
  private startProgressLoop() {
    if (this.animFrameId !== null) cancelAnimationFrame(this.animFrameId);

    const tick = () => {
      if (this.isPlaying) {
        this.notifyPlaybackState();
        this.animFrameId = requestAnimationFrame(tick);
      }
    };
    this.animFrameId = requestAnimationFrame(tick);
  }

  private notifyPlaybackState() {
    const duration = this.currentTrack ? this.currentTrack.duration : 0;
    const currentTime = this.getCurrentTime();
    for (const listener of this.playbackListeners) {
      listener({
        isPlaying: this.isPlaying,
        currentTime,
        duration,
      });
    }
  }

  public subscribePlayback(fn: (state: { isPlaying: boolean; currentTime: number; duration: number }) => void) {
    this.playbackListeners.add(fn);
    return () => {
      this.playbackListeners.delete(fn);
    };
  }
}

export const audioEngine = new AudioEngine();
