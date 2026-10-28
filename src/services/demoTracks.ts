import { StemType, TrackMetadata } from '../types/audio';

export interface DemoTrackConfig {
  metadata: TrackMetadata;
  generateStems: (ctx: AudioContext) => { [key in StemType]: AudioBuffer };
}

/**
 * Procedural studio multi-stem generator for authentic, offline-instant demo tracks.
 * Generates true independent 4-channel audio buffers for Vocals, Drums, Bass, and Other.
 */
export function generateDemoStems(
  ctx: AudioContext,
  trackId: string
): { metadata: TrackMetadata; stems: { [key in StemType]: AudioBuffer } } {
  const sampleRate = ctx.sampleRate || 44100;
  const duration = 24; // 24-second loopable showcase section
  const totalSamples = Math.floor(sampleRate * duration);

  const createBuffer = () => ctx.createBuffer(2, totalSamples, sampleRate);

  const vocalsBuf = createBuffer();
  const drumsBuf = createBuffer();
  const bassBuf = createBuffer();
  const otherBuf = createBuffer();

  const vL = vocalsBuf.getChannelData(0);
  const vR = vocalsBuf.getChannelData(1);

  const dL = drumsBuf.getChannelData(0);
  const dR = drumsBuf.getChannelData(1);

  const bL = bassBuf.getChannelData(0);
  const bR = bassBuf.getChannelData(1);

  const oL = otherBuf.getChannelData(0);
  const oR = otherBuf.getChannelData(1);

  let metadata: TrackMetadata;

  if (trackId === 'neon-boulevard') {
    metadata = {
      id: 'neon-boulevard',
      title: 'Neon Boulevard',
      artist: 'Kavinsky & Demucs Studio',
      duration,
      bpm: 124,
      key: 'D Minor',
      timeSignature: '4/4',
      isDemo: true,
    };
    buildSynthwaveStems(totalSamples, sampleRate, vL, vR, dL, dR, bL, bR, oL, oR);
  } else if (trackId === 'acoustic-horizon') {
    metadata = {
      id: 'acoustic-horizon',
      title: 'Acoustic Horizon',
      artist: 'Sierra Brooks & Ensemble',
      duration,
      bpm: 96,
      key: 'C Major',
      timeSignature: '4/4',
      isDemo: true,
    };
    buildAcousticStems(totalSamples, sampleRate, vL, vR, dL, dR, bL, bR, oL, oR);
  } else {
    // Default: Golden Sunrise (Funk/Pop)
    metadata = {
      id: 'golden-sunrise',
      title: 'Golden Sunrise',
      artist: 'Aura Collective',
      duration,
      bpm: 118,
      key: 'G Minor',
      timeSignature: '4/4',
      isDemo: true,
    };
    buildFunkPopStems(totalSamples, sampleRate, vL, vR, dL, dR, bL, bR, oL, oR);
  }

  return {
    metadata,
    stems: {
      vocals: vocalsBuf,
      drums: drumsBuf,
      bass: bassBuf,
      other: otherBuf,
    },
  };
}

/**
 * 1. Funk / Pop Stem Synthesis:
 * - Drums: 4-on-the-floor kick, snappy snare on 2 and 4, 16th hats with ghost notes.
 * - Bass: Funky syncopated slap & sub bass riff in G Minor (G1, Bb1, C2, D2, F2).
 * - Other: Rhodes electric piano 9th chords + funky muted wah guitar stabs.
 * - Vocals: Soulful vocal melody phrases with vibrato and vowel formant harmonics.
 */
function buildFunkPopStems(
  totalSamples: number,
  sampleRate: number,
  vL: Float32Array, vR: Float32Array,
  dL: Float32Array, dR: Float32Array,
  bL: Float32Array, bR: Float32Array,
  oL: Float32Array, oR: Float32Array
) {
  const bpm = 118;
  const beatSec = 60 / bpm;
  const barSec = beatSec * 4;
  const sixteenth = beatSec / 4;

  // Notes frequencies (Hz)
  const G1 = 48.999, Bb1 = 58.27, C2 = 65.41, D2 = 73.42, F2 = 87.31, G2 = 97.99;
  const G4 = 392.0, Bb4 = 466.16, C5 = 523.25, D5 = 587.33, F5 = 698.46;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const barTime = t % barSec;
    const beatInBar = Math.floor(barTime / beatSec);
    const timeInBeat = barTime % beatSec;

    // --- DRUMS STEM ---
    let drumSampleL = 0;
    let drumSampleR = 0;

    // Kick on beat 0, 2, and syncopated upbeat before 2
    const kickTimes = [0, 1.75 * beatSec, 2 * beatSec, 3.5 * beatSec];
    for (const kt of kickTimes) {
      const dt = barTime - kt;
      if (dt >= 0 && dt < 0.28) {
        const sweep = 120 * Math.exp(-dt * 26) + 48;
        const env = Math.exp(-dt * 14);
        const kick = Math.sin(2 * Math.PI * sweep * dt) * env * 0.9;
        drumSampleL += kick;
        drumSampleR += kick;
      }
    }

    // Snare on beat 1 and 3 (beats 2 and 4 of bar)
    const snareTimes = [beatSec, 3 * beatSec];
    for (const st of snareTimes) {
      const dt = barTime - st;
      if (dt >= 0 && dt < 0.22) {
        const tone = Math.sin(2 * Math.PI * 185 * dt) * Math.exp(-dt * 18) * 0.45;
        const noise = (Math.random() * 2 - 1) * Math.exp(-dt * 15) * 0.55;
        const snare = (tone + noise) * 0.85;
        drumSampleL += snare * 0.95;
        drumSampleR += snare * 1.05;
      }
    }

    // Hi-hats every 16th note
    const hatStep = Math.floor(barTime / sixteenth);
    const hatDt = barTime % sixteenth;
    if (hatDt < 0.07) {
      const isAccent = hatStep % 4 === 0 || hatStep % 4 === 2;
      const hatAmp = isAccent ? 0.35 : 0.18;
      const hatNoise = (Math.random() * 2 - 1) * Math.exp(-hatDt * (isAccent ? 50 : 80)) * hatAmp;
      drumSampleL += hatNoise * 0.8;
      drumSampleR += hatNoise * 1.2; // Stereo spread
    }

    dL[i] = Math.max(-1, Math.min(1, drumSampleL * 0.8));
    dR[i] = Math.max(-1, Math.min(1, drumSampleR * 0.8));

    // --- BASS STEM ---
    // Funky bass pattern
    let bassFreq = G1;
    if (barTime < beatSec) bassFreq = G1;
    else if (barTime < beatSec * 1.75) bassFreq = Bb1;
    else if (barTime < beatSec * 2.5) bassFreq = C2;
    else if (barTime < beatSec * 3.25) bassFreq = D2;
    else bassFreq = F2;

    const bassEnv = Math.exp(-(timeInBeat % (beatSec * 0.5)) * 4.5);
    // Sub sine + rich triangle harmonic
    const sub = Math.sin(2 * Math.PI * bassFreq * t);
    const harm = Math.sin(2 * Math.PI * (bassFreq * 2) * t) * 0.4 + Math.sin(2 * Math.PI * (bassFreq * 3) * t) * 0.15;
    const bassVal = (sub * 0.75 + harm * 0.4) * bassEnv * 0.85;
    bL[i] = Math.max(-1, Math.min(1, bassVal));
    bR[i] = Math.max(-1, Math.min(1, bassVal));

    // --- OTHER (KEYS & GUITAR) STEM ---
    // Gm7 -> C9 -> Fmaj7 -> Bbmaj7 progression
    let chordFreqs = [196, 233, 293, 349]; // Gm7
    if (barTime >= barSec * 0.5) chordFreqs = [174, 220, 261, 329]; // Fmaj7

    let chordSampleL = 0;
    let chordSampleR = 0;
    const chordEnv = Math.exp(-(barTime % (beatSec * 2)) * 1.6);
    for (let c = 0; c < chordFreqs.length; c++) {
      const f = chordFreqs[c];
      const toneL = Math.sin(2 * Math.PI * f * t + c * 0.4) * 0.16;
      const toneR = Math.sin(2 * Math.PI * (f * 1.002) * t + c * 0.7) * 0.16;
      chordSampleL += toneL * chordEnv;
      chordSampleR += toneR * chordEnv;
    }
    // Subtle funk guitar chick on upbeat
    if (timeInBeat > beatSec * 0.45 && timeInBeat < beatSec * 0.6) {
      const gdt = timeInBeat - beatSec * 0.45;
      const gNoise = (Math.random() * 2 - 1) * Math.exp(-gdt * 45) * 0.2;
      chordSampleL += gNoise * 1.1;
      chordSampleR += gNoise * 0.7;
    }
    oL[i] = Math.max(-1, Math.min(1, chordSampleL));
    oR[i] = Math.max(-1, Math.min(1, chordSampleR));

    // --- VOCALS STEM ---
    // Soulful melody phrase: Bb4 -> C5 -> D5 -> Bb4 -> G4
    let vocalFreq = 0;
    const vocalBar = Math.floor(t / barSec) % 2;
    if (vocalBar === 0) {
      if (barTime >= 0.2 && barTime < 1.0) vocalFreq = Bb4;
      else if (barTime >= 1.0 && barTime < 1.8) vocalFreq = C5;
      else if (barTime >= 1.8 && barTime < 2.8) vocalFreq = D5;
      else if (barTime >= 2.8 && barTime < 3.8) vocalFreq = Bb4;
    } else {
      if (barTime >= 0.2 && barTime < 1.2) vocalFreq = D5;
      else if (barTime >= 1.2 && barTime < 2.0) vocalFreq = C5;
      else if (barTime >= 2.0 && barTime < 3.6) vocalFreq = G4;
    }

    if (vocalFreq > 0) {
      const vib = 1 + 0.018 * Math.sin(2 * Math.PI * 5.2 * t);
      const vf = vocalFreq * vib;
      // Formant simulation: fundamental + 2nd, 3rd, 4th harmonics shaped with vowel formants
      const f0 = Math.sin(2 * Math.PI * vf * t);
      const f1 = Math.sin(2 * Math.PI * (vf * 2) * t) * 0.45;
      const f2 = Math.sin(2 * Math.PI * (vf * 3) * t) * 0.28;
      const f3 = Math.sin(2 * Math.PI * (vf * 4) * t) * 0.12;
      const breath = (Math.random() * 2 - 1) * 0.03;
      const vocalRaw = (f0 + f1 + f2 + f3 + breath) * 0.48;
      vL[i] = Math.max(-1, Math.min(1, vocalRaw * 0.98));
      vR[i] = Math.max(-1, Math.min(1, vocalRaw * 0.98));
    } else {
      vL[i] = 0;
      vR[i] = 0;
    }
  }
}

/**
 * 2. Synthwave / Electro Stem Synthesis:
 * - Drums: Heavy electro gated kick, 80s layered snare, sixteenth synth hi-hats.
 * - Bass: Rolling 16th-note analog synth bass in D Minor.
 * - Other: Arpeggiated sawtooth chords and warm analog pads.
 * - Vocals: Vocoded / airy melodic hook.
 */
function buildSynthwaveStems(
  totalSamples: number,
  sampleRate: number,
  vL: Float32Array, vR: Float32Array,
  dL: Float32Array, dR: Float32Array,
  bL: Float32Array, bR: Float32Array,
  oL: Float32Array, oR: Float32Array
) {
  const bpm = 124;
  const beatSec = 60 / bpm;
  const sixteenth = beatSec / 4;
  const barSec = beatSec * 4;

  const D1 = 36.71, F1 = 43.65, G1 = 48.99, A1 = 55.0;
  const D4 = 293.66, F4 = 349.23, A4 = 440.0, C5 = 523.25;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const barTime = t % barSec;
    const timeInBeat = barTime % beatSec;

    // DRUMS: punchy 4-on-the-floor electro
    let dSample = 0;
    if (timeInBeat < 0.2) {
      const dt = timeInBeat;
      const sweep = 140 * Math.exp(-dt * 30) + 42;
      dSample += Math.sin(2 * Math.PI * sweep * dt) * Math.exp(-dt * 15) * 0.9;
    }
    // Big 80s snare on beats 2 & 4
    if ((barTime >= beatSec && barTime < beatSec + 0.25) || (barTime >= beatSec * 3 && barTime < beatSec * 3 + 0.25)) {
      const dt = (barTime >= beatSec * 3) ? (barTime - beatSec * 3) : (barTime - beatSec);
      const tone = Math.sin(2 * Math.PI * 210 * dt) * Math.exp(-dt * 20) * 0.4;
      const noise = (Math.random() * 2 - 1) * Math.exp(-dt * 10) * 0.6;
      dSample += tone + noise;
    }
    // 16th hats
    const hatDt = barTime % sixteenth;
    if (hatDt < 0.04) {
      dSample += (Math.random() * 2 - 1) * Math.exp(-hatDt * 70) * 0.25;
    }
    dL[i] = Math.max(-1, Math.min(1, dSample * 0.8));
    dR[i] = Math.max(-1, Math.min(1, dSample * 0.8));

    // BASS: 16th rolling synth bass
    const bassStep = Math.floor(barTime / sixteenth);
    const bassDt = barTime % sixteenth;
    let bFreq = D1;
    if (barTime >= barSec * 0.75) bFreq = A1;
    else if (barTime >= barSec * 0.5) bFreq = F1;
    const bassOsc = (Math.sin(2 * Math.PI * bFreq * t) + 0.5 * Math.sin(2 * Math.PI * bFreq * 2 * t)) * Math.exp(-bassDt * 18);
    bL[i] = bassOsc * 0.8;
    bR[i] = bassOsc * 0.8;

    // OTHER: 80s synth pad & arp
    const arpNotes = [D4, F4, A4, C5];
    const arpNote = arpNotes[bassStep % 4];
    const arpVal = Math.sin(2 * Math.PI * arpNote * t) * Math.exp(-bassDt * 12) * 0.22;
    // Pad
    const padVal = (Math.sin(2 * Math.PI * 146.83 * t) + Math.sin(2 * Math.PI * 220.0 * t)) * 0.1;
    oL[i] = (arpVal + padVal) * 0.9;
    oR[i] = (arpVal * 1.1 + padVal) * 0.9;

    // VOCALS: Synth hook line
    let vFreq = 0;
    if (barTime >= 0.5 && barTime < 1.8) vFreq = A4;
    else if (barTime >= 2.0 && barTime < 3.4) vFreq = F4;

    if (vFreq > 0) {
      const vTone = Math.sin(2 * Math.PI * vFreq * t) * 0.35 + Math.sin(2 * Math.PI * (vFreq * 2) * t) * 0.15;
      vL[i] = vTone;
      vR[i] = vTone;
    } else {
      vL[i] = 0;
      vR[i] = 0;
    }
  }
}

/**
 * 3. Acoustic Folk / Ballad Stem Synthesis:
 * - Drums: Warm wooden cajon / brush percussions.
 * - Bass: Warm acoustic upright bass.
 * - Other: Fingerpicked acoustic guitar arpeggios in C Major.
 * - Vocals: Warm acoustic folk vocal line.
 */
function buildAcousticStems(
  totalSamples: number,
  sampleRate: number,
  vL: Float32Array, vR: Float32Array,
  dL: Float32Array, dR: Float32Array,
  bL: Float32Array, bR: Float32Array,
  oL: Float32Array, oR: Float32Array
) {
  const bpm = 96;
  const beatSec = 60 / bpm;
  const barSec = beatSec * 4;

  const C2 = 65.41, G1 = 48.99, A1 = 55.0, F1 = 43.65;
  const E4 = 329.63, G4 = 392.0, C5 = 523.25, D5 = 587.33;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const barTime = t % barSec;
    const timeInBeat = barTime % beatSec;

    // CAJON / BRUSH DRUMS
    let dSample = 0;
    // Low cajon tap on beat 1 and 3
    if (timeInBeat < 0.25) {
      dSample += Math.sin(2 * Math.PI * 75 * timeInBeat) * Math.exp(-timeInBeat * 16) * 0.7;
    }
    // High wood click on beat 2 and 4
    if ((barTime >= beatSec && barTime < beatSec + 0.12) || (barTime >= beatSec * 3 && barTime < beatSec * 3 + 0.12)) {
      dSample += (Math.random() * 2 - 1) * 0.35;
    }
    dL[i] = dSample * 0.7;
    dR[i] = dSample * 0.7;

    // UPRIGHT BASS
    let bFreq = C2;
    if (barTime >= barSec * 0.75) bFreq = F1;
    else if (barTime >= barSec * 0.5) bFreq = A1;
    else if (barTime >= barSec * 0.25) bFreq = G1;

    const bEnv = Math.exp(-(timeInBeat % (beatSec * 2)) * 2.2);
    const bassSound = Math.sin(2 * Math.PI * bFreq * t) * bEnv * 0.75;
    bL[i] = bassSound;
    bR[i] = bassSound;

    // ACOUSTIC GUITAR
    const guitarEighth = beatSec / 2;
    const gStep = Math.floor(barTime / guitarEighth);
    const gDt = barTime % guitarEighth;
    const chordPitches = [261.63, 329.63, 392.0, 523.25];
    const pitch = chordPitches[gStep % 4];
    const gSample = Math.sin(2 * Math.PI * pitch * t) * Math.exp(-gDt * 8) * 0.25;
    oL[i] = gSample * 0.85;
    oR[i] = gSample * 1.15;

    // VOCALS
    let vFreq = 0;
    if (barTime >= 0.4 && barTime < 1.6) vFreq = E4;
    else if (barTime >= 1.6 && barTime < 2.8) vFreq = G4;
    else if (barTime >= 2.8 && barTime < 3.8) vFreq = C5;

    if (vFreq > 0) {
      const vTone = Math.sin(2 * Math.PI * vFreq * t) * 0.4;
      vL[i] = vTone;
      vR[i] = vTone;
    } else {
      vL[i] = 0;
      vR[i] = 0;
    }
  }
}
