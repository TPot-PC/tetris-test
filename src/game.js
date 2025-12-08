import { Board } from './board.js';
import { Renderer } from './renderer.js';
import { Tetromino } from './tetromino.js';

export class Game {
    constructor(canvas, soundManager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.renderer = new Renderer(this.ctx);
        this.board = new Board();
        // this.input = new InputHandler(this); // specific input handler removed to avoid conflicts with main.js
        this.soundManager = soundManager;

        this.lastTime = 0;
        this.dropCounter = 0;
        this.dropInterval = 1000; // 1 second initially

        this.isRunning = false;
        this.score = 0;
        this.lines = 0;
        this.level = 0;
        this.nextPiece = new Tetromino();

        // Animation state
        this.isAnimating = false;
        this.rocketType = 0;
        this.rocketY = 0;
        this.rocketX = 0;
        this.animationTimer = 0;
        this.animationPhase = 'ready';
        this.tick = 0;

        // Leaderboard
        this.GAS_URL = 'https://script.google.com/macros/s/AKfycbzdybB-cG9vRkZM12Wj54xZFNTay27nfmjsncvi4IW06cjlZSqfngaHywSAhZnZKrw/exec';
        this.onLeaderboardCheck = null; // Callback for main.js
        this.isPaused = false;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.isPaused = false;
        this.board.reset();
        this.score = 0;
        this.lines = 0;
        this.level = 0;
        this.dropInterval = 1000;
        this.nextPiece = new Tetromino();
        this.lastTime = performance.now();
        if (this.soundManager) this.soundManager.startBGM();

        requestAnimationFrame(this.update.bind(this));
    }

    togglePause() {
        if (!this.isRunning) return;
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            if (this.soundManager) this.soundManager.stopBGM(); // Optional: pause music
        } else {
            this.lastTime = performance.now(); // Reset time to prevent jump
            if (this.soundManager) this.soundManager.startBGM(); // Resume music
            requestAnimationFrame(this.update.bind(this)); // Restart loop if needed, though update checks isPaused
        }
        this.draw();
    }

    update(time) {
        if (!this.isRunning) return;
        if (this.isPaused) return;

        // Ensure time is valid (first frame might be tricky depending on browser)
        if (!time) time = performance.now();

        const deltaTime = time - this.lastTime;
        this.lastTime = time;

        try {
            this.dropCounter += deltaTime;
            if (this.dropCounter > this.dropInterval) {
                const result = this.board.drop(this.nextPiece);
                if (!result.playing) {
                    this.gameOver();
                    return;
                }
                if (result.linesCleared > 0) {
                    this.updateScore(result.linesCleared);
                    if (this.soundManager) this.soundManager.playClear(result.linesCleared);
                }
                if (result.pieceLocked) {
                    if (this.soundManager) this.soundManager.playDrop();
                    this.nextPiece = new Tetromino();
                }
                this.dropCounter = 0;
            }

            this.draw();
        } catch (e) {
            console.error("Game Loop Error:", e);
            // Optionally stop game or try to recover
        }

        requestAnimationFrame(this.update.bind(this));
    }

    updateScore(lines) {
        const points = [0, 40, 100, 300, 1200];
        this.score += points[lines] * (this.level + 1);
        this.lines += lines;
        this.level = Math.floor(this.lines / 10);
        this.dropInterval = Math.max(100, 1000 - (this.level * 100));
    }

    async gameOver() {
        this.isRunning = false;
        if (this.soundManager) this.soundManager.playGameOver();

        // Determine rocket type based on score
        let rocketType = 0;
        if (this.score >= 100000) rocketType = 3;
        else if (this.score >= 10000) rocketType = 2;
        else if (this.score >= 1) rocketType = 1;

        if (rocketType > 0) {
            // Wait for animation to finish before checking leaderboard
            this.startEndingAnimation(rocketType);
        } else {
            // Check leaderboard immediately
            await this.handleLeaderboard();
        }
    }

    async handleLeaderboard() {
        if (this.onLeaderboardCheck) {
            await this.onLeaderboardCheck(this.score);
        } else {
            this.draw();
            this.renderer.drawGameOver(this.ctx);
        }
    }

    async fetchLeaderboard() {
        try {
            const response = await fetch(`${this.GAS_URL}?action=get`);
            return await response.json();
        } catch (e) {
            console.error('Failed to fetch leaderboard:', e);
            return [];
        }
    }

    async submitScore(name) {
        try {
            const response = await fetch(`${this.GAS_URL}?action=add&name=${encodeURIComponent(name)}&score=${this.score}`);
            return await response.json();
        } catch (e) {
            console.error('Failed to submit score:', e);
            return [];
        }
    }

    startEndingAnimation(rocketType) {
        this.isAnimating = true;
        this.rocketType = rocketType;
        // Platform top is at y=125.
        // Rocket heights: Type 1 (Small) = 14px, Type 2 (Medium) = 20px, Type 3 (Large) = 22px.
        // rocketY is top-left corner.
        if (this.rocketType === 1) this.rocketY = 111; // 125 - 14
        else if (this.rocketType === 2) this.rocketY = 105; // 125 - 20
        else if (this.rocketType === 3) this.rocketY = 103; // 125 - 22
        else this.rocketY = 111; // Default

        // Rocket width is approx 12-16px (6-8 blocks * 2px).
        // Center is 80. 80 - 8 = 72.
        this.rocketX = 72;
        this.animationTimer = 0;
        this.animationPhase = 'performance'; // Start with performance
        this.tick = 0;
        this.particles = []; // Array for smoke particles

        // Start animation loop
        this.lastTime = performance.now();
        if (this.soundManager) this.soundManager.playEndingTheme();
        this.updateAnimation();
    }

    updateAnimation(time = 0) {
        if (!this.isAnimating) return;

        const deltaTime = time - this.lastTime;
        this.lastTime = time;

        this.animationTimer += deltaTime;
        this.tick++;

        if (this.animationPhase === 'performance') {
            // Play music and dance for 10 seconds (Double duration)
            if (this.animationTimer > 10000) {
                this.animationPhase = 'ready';
                this.animationTimer = 0;
                if (this.soundManager) {
                    this.soundManager.stopBGM();
                    this.soundManager.playRocketLaunch();
                }
            }
        } else if (this.animationPhase === 'ready') {
            // Shake/Prepare for 2 seconds
            if (this.animationTimer > 2000) {
                this.animationPhase = 'launch';
                this.animationTimer = 0;
            }
        } else if (this.animationPhase === 'launch') {
            // Move up
            this.rocketY -= 0.33; // Slower ascent (1.5x duration approx)

            // Spawn smoke particles
            if (this.tick % 5 === 0) { // Every few frames
                this.particles.push({
                    x: this.rocketX + 4 + (Math.random() * 8), // Center of rocket base
                    y: this.rocketY + 16, // Bottom of rocket
                    vx: (Math.random() - 0.5) * 1, // Spread
                    vy: 0.5 + Math.random() * 1, // Downward velocity
                    life: 1.0 // Life 1.0 to 0.0
                });
            }

            if (this.rocketY < -50) { // Fully off screen
                this.animationPhase = 'done';
            }
        }

        // Update particles
        if (this.particles) {
            for (let i = this.particles.length - 1; i >= 0; i--) {
                let p = this.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.02; // Fade out
                if (p.life <= 0) {
                    this.particles.splice(i, 1);
                }
            }
        }

        this.drawAnimation();

        if (this.animationPhase !== 'done') {
            requestAnimationFrame(this.updateAnimation.bind(this));
        } else {
            this.isAnimating = false;
            this.handleLeaderboard();
        }
    }

    drawAnimation() {
        if (this.animationPhase === 'performance') {
            this.renderer.drawPerformance(this.tick);
            return;
        }

        this.renderer.clear(false);

        // Draw ground line
        this.ctx.fillStyle = '#0f380f';
        this.ctx.fillRect(0, 130, 160, 14);

        // Draw Launch Pad (Tower)
        this.renderer.drawLaunchPad();

        // Draw Particles (Smoke)
        if (this.particles) {
            this.renderer.drawParticles(this.particles);
        }

        // Draw Rocket
        let drawX = this.rocketX;
        let drawY = this.rocketY;

        // Shake effect in ready phase
        if (this.animationPhase === 'ready') {
            drawX += (Math.random() - 0.5) * 2;
            drawY += (Math.random() - 0.5) * 2;
        }

        this.renderer.drawRocket(drawX, drawY, this.rocketType);
    }

    draw() {
        if (this.isPaused) {
            // Clear screen and draw PAUSE
            this.renderer.clear(false); // Clear board area

            this.ctx.save();
            this.ctx.fillStyle = '#0f380f';
            this.ctx.font = 'bold 20px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('PAUSE', 80, 72);
            this.ctx.restore();
            return;
        }
        this.renderer.draw(this);
    }
}
