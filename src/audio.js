export class SoundManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.isMuted = false;
        this.bgmInterval = null;
    }

    init() {
        if (this.ctx) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) {
                console.warn('AudioContext not supported');
                return;
            }
            this.ctx = new AudioContext();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.3; // Default volume
            this.masterGain.connect(this.ctx.destination);
        } catch (e) {
            console.warn('Failed to initialize audio:', e);
            this.ctx = null;
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain) {
            this.masterGain.gain.value = this.isMuted ? 0 : 0.3;
        }
    }

    playTone(freq, type, duration, startTime = 0, volume = 0.3) {
        if (!this.ctx || this.isMuted) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + startTime);

        gain.gain.setValueAtTime(volume, this.ctx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + startTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(this.ctx.currentTime + startTime);
        osc.stop(this.ctx.currentTime + startTime + duration);
    }

    playMove() {
        this.playTone(440, 'square', 0.05, 0, 0.2);
    }

    playRotate() {
        this.playTone(880, 'square', 0.05, 0, 0.2);
    }

    playDrop() {
        if (!this.ctx || this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(880, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.2);

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    }

    playClear(lines) {
        if (!this.ctx || this.isMuted) return;
        const baseNote = 440;
        const notes = [baseNote, baseNote * 1.25, baseNote * 1.5, baseNote * 2]; // Major chord

        notes.forEach((note, i) => {
            this.playTone(note, 'square', 0.1, i * 0.05, 0.3);
        });

        if (lines >= 4) {
            setTimeout(() => {
                this.playTone(baseNote * 2, 'square', 0.2, 0, 0.4);
                this.playTone(baseNote * 3, 'square', 0.4, 0.1, 0.4);
            }, 200);
        }
    }

    playGameOver() {
        if (!this.ctx || this.isMuted) return;
        this.stopBGM();
        const startFreq = 880;
        const duration = 1.5;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(55, this.ctx.currentTime + duration);

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playPattern(tracks, intervalMs) {
        this.stopBGM();
        if (!this.ctx || this.isMuted) return;

        let step = 0;

        const playStep = () => {
            if (this.isMuted) return;

            tracks.forEach(track => {
                const note = track.notes[step % track.notes.length];
                if (note > 0) {
                    this.playTone(note, track.instrument, 0.15, 0, track.volume);
                }
            });
            step++;
        };

        this.bgmInterval = setInterval(playStep, intervalMs);
    }

    startBGM() {
        // Korobeiniki Polyphonic (16-voice style)
        // Melody (Square)
        const melody = [
            659, 0, 493, 0, 523, 0, 587, 0, 523, 0, 493, 0, 440, 0, 440, 0,
            523, 0, 659, 0, 587, 0, 523, 0, 493, 0, 523, 0, 587, 0, 659, 0,
            523, 0, 440, 0, 440, 0, 0, 0, 0, 0, 587, 0, 587, 0, 698, 0, 880, 0,
            783, 0, 698, 0, 659, 0, 659, 0, 523, 0, 659, 0, 587, 0, 523, 0,
            493, 0, 493, 0, 523, 0, 587, 0, 659, 0, 523, 0, 440, 0, 440, 0
        ];
        // Bass (Sawtooth)
        const bass = [
            330, 0, 330, 0, 330, 0, 330, 0, 294, 0, 294, 0, 294, 0, 294, 0,
            330, 0, 330, 0, 330, 0, 330, 0, 330, 0, 330, 0, 330, 0, 330, 0,
            294, 0, 294, 0, 294, 0, 294, 0, 294, 0, 294, 0, 294, 0, 294, 0,
            330, 0, 330, 0, 330, 0, 330, 0, 330, 0, 330, 0, 330, 0, 330, 0,
            294, 0, 294, 0, 294, 0, 294, 0, 294, 0, 294, 0, 220, 0, 220, 0
        ];
        // Harmony (Triangle)
        const harmony = [
            0, 415, 0, 415, 0, 415, 0, 415, 0, 370, 0, 370, 0, 370, 0, 370,
            0, 415, 0, 415, 0, 415, 0, 415, 0, 415, 0, 415, 0, 415, 0, 415,
            0, 370, 0, 370, 0, 370, 0, 370, 0, 370, 0, 370, 0, 370, 0, 370,
            0, 415, 0, 415, 0, 415, 0, 415, 0, 415, 0, 415, 0, 415, 0, 415,
            0, 370, 0, 370, 0, 370, 0, 370, 0, 370, 0, 370, 0, 277, 0, 277
        ];

        // Speed up by 1.3x (180ms / 1.3 = ~138ms)
        this.playPattern([
            { notes: melody, instrument: 'square', volume: 0.15 },
            { notes: bass, instrument: 'sawtooth', volume: 0.12 },
            { notes: harmony, instrument: 'triangle', volume: 0.1 }
        ], 138);
    }

    stopBGM() {
        if (this.bgmInterval) {
            clearInterval(this.bgmInterval);
            this.bgmInterval = null;
        }
    }

    playEndingTheme() {
        // Troika Polyphonic
        // Melody
        const melody = [
            659, 0, 880, 0, 659, 0, 523, 0, 587, 0, 493, 0, 392, 0, 392, 0,
            440, 0, 523, 0, 659, 0, 587, 0, 493, 0, 523, 0, 440, 0, 0, 0
        ];
        // Bass
        const bass = [
            330, 0, 330, 0, 330, 0, 262, 0, 294, 0, 247, 0, 196, 0, 196, 0,
            220, 0, 262, 0, 330, 0, 294, 0, 247, 0, 262, 0, 220, 0, 220, 0
        ];

        // Speed up by 1.3x (150ms / 1.3 = ~115ms)
        this.playPattern([
            { notes: melody, instrument: 'square', volume: 0.15 },
            { notes: bass, instrument: 'sawtooth', volume: 0.15 }
        ], 115);
    }

    playRocketLaunch() {
        if (!this.ctx || this.isMuted) return;

        const duration = 12.0; // Total duration
        const liftOffTime = 2.0; // Time until lift off (Ready phase)

        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const now = this.ctx.currentTime;

        // --- Main Rumble ---
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';

        // Dynamic Filter: Idle (Low) -> Lift Off (Rising) -> Ascent (High)
        filter.frequency.setValueAtTime(60, now);
        filter.frequency.linearRampToValueAtTime(80, now + liftOffTime); // Idle rumble
        filter.frequency.exponentialRampToValueAtTime(1200, now + duration); // Whoosh up

        const gain = this.ctx.createGain();
        // Dynamic Volume: Idle (Quiet) -> Lift Off (Loud) -> Fade Out
        gain.gain.setValueAtTime(0.2, now); // Lower initial volume
        gain.gain.linearRampToValueAtTime(0.25, now + liftOffTime); // Steady idle
        gain.gain.linearRampToValueAtTime(0.5, now + liftOffTime + 0.5); // BLAST OFF! (Max volume reduced from 0.8)
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration); // Fade out

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start();

        // --- Sub-bass Layer (Engine Power) ---
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        subOsc.type = 'sawtooth';

        // Pitch rises with speed
        subOsc.frequency.setValueAtTime(40, now);
        subOsc.frequency.linearRampToValueAtTime(50, now + liftOffTime);
        subOsc.frequency.linearRampToValueAtTime(20, now + duration); // Drop pitch as it goes away? Or rise? Let's drop for "doppler" feel

        // Volume follows main engine
        subGain.gain.setValueAtTime(0.2, now);
        subGain.gain.linearRampToValueAtTime(0.2, now + liftOffTime);
        subGain.gain.linearRampToValueAtTime(0.3, now + liftOffTime + 0.5); // Kick in
        subGain.gain.linearRampToValueAtTime(0.01, now + duration);

        subOsc.connect(subGain);
        subGain.connect(this.masterGain);
        subOsc.start();
        subOsc.stop(now + duration);
    }
}
