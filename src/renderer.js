export class Renderer {
    constructor(ctx) {
        this.ctx = ctx;
        // GameBoy res is 160x144. 
        // Tetris board is 10x20 (logical).
        // Visible area is usually 10x18.
        // 144px height / 18 rows = 8px per block.
        this.blockSize = 8;

        // Board width = 80px.
        // Align board to the left side with some padding.
        this.offsetX = 12;

        // Hide the top 2 rows (spawn area).
        // Row 0 is at y = -16. Row 2 starts at y = 0.
        this.offsetY = -16;
    }

    clear(drawSeparator = true) {
        this.ctx.fillStyle = '#9bbc0f'; // Background color
        this.ctx.fillRect(0, 0, 160, 144);

        // Draw separator line
        if (drawSeparator) {
            this.ctx.strokeStyle = '#0f380f';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(this.offsetX + 10 * this.blockSize + 4, 0);
            this.ctx.lineTo(this.offsetX + 10 * this.blockSize + 4, 144);
            this.ctx.stroke();
        }
    }

    draw(game) {
        this.clear(true);
        this.drawBoard(game.board);
        this.drawScore(game);
        this.drawNextPiece(game.nextPiece);
    }

    drawBoard(board) {
        // Draw grid
        board.grid.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    this.drawBlock(x, y, value);
                }
            });
        });

        // Draw active piece
        const p = board.piece;
        if (p) {
            p.shape.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value) {
                        this.drawBlock(p.x + x, p.y + y, value);
                    }
                });
            });
        }
    }

    drawScore(game) {
        const uiX = 105;
        this.ctx.fillStyle = '#0f380f';
        this.ctx.font = 'bold 10px monospace';

        this.ctx.fillText(`SCORE`, uiX, 20);
        this.ctx.fillText(`${game.score}`, uiX, 30);

        this.ctx.fillText(`LEVEL`, uiX, 50);
        this.ctx.fillText(`${game.level}`, uiX, 60);

        this.ctx.fillText(`LINES`, uiX, 80);
        this.ctx.fillText(`${game.lines}`, uiX, 90);
    }

    drawNextPiece(piece) {
        if (!piece) return;
        const uiX = 105;
        this.ctx.fillText(`NEXT`, uiX, 110);

        // Draw mini piece
        const offsetX = uiX;
        const offsetY = 120;
        const miniBlockSize = 6;

        this.ctx.fillStyle = '#0f380f';
        piece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    this.ctx.fillRect(
                        offsetX + x * miniBlockSize,
                        offsetY + y * miniBlockSize,
                        miniBlockSize - 1,
                        miniBlockSize - 1
                    );
                }
            });
        });
    }

    drawGameOver(ctx) {
        ctx.fillStyle = 'rgba(15, 56, 15, 0.8)';
        ctx.fillRect(10, 50, 90, 40);
        ctx.fillStyle = '#9bbc0f';
        ctx.font = '14px monospace';
        ctx.fillText('GAME', 35, 70);
        ctx.fillText('OVER', 35, 85);
    }

    drawBlock(x, y, value) {
        this.ctx.fillStyle = '#0f380f'; // Darkest green for blocks
        // Draw main block
        this.ctx.fillRect(
            this.offsetX + x * this.blockSize,
            this.offsetY + y * this.blockSize,
            this.blockSize - 1,
            this.blockSize - 1
        );

        // Inner detail for retro look (optional)
        this.ctx.fillStyle = '#306230'; // Lighter green inside
        this.ctx.fillRect(
            this.offsetX + x * this.blockSize + 2,
            this.offsetY + y * this.blockSize + 2,
            this.blockSize - 5,
            this.blockSize - 5
        );
    }

    drawRocket(x, y, type) {
        // Pixel size 2 for finer detail (smaller rocket)
        const s = 2;
        this.ctx.fillStyle = '#0f380f';

        let shape = [];

        // 1点以上: Small Rocket (Type 1) - Slimmer
        if (type === 1) {
            shape = [
                [0, 0, 1, 1, 0, 0],
                [0, 1, 1, 1, 1, 0],
                [0, 1, 1, 1, 1, 0],
                [0, 1, 1, 1, 1, 0],
                [0, 1, 1, 1, 1, 0],
                [1, 1, 0, 0, 1, 1],
                [1, 1, 0, 0, 1, 1]
            ];
        }
        // 1万点以上: Medium Rocket (Type 2) - Taller
        else if (type === 2) {
            shape = [
                [0, 0, 1, 1, 0, 0],
                [0, 1, 1, 1, 1, 0],
                [0, 1, 1, 1, 1, 0],
                [0, 1, 1, 1, 1, 0],
                [0, 1, 1, 1, 1, 0],
                [0, 1, 1, 1, 1, 0],
                [0, 1, 1, 1, 1, 0],
                [1, 1, 1, 1, 1, 1],
                [1, 1, 0, 0, 1, 1],
                [1, 1, 0, 0, 1, 1]
            ];
        }
        // 10万点以上: Space Shuttle (Type 3) - Complex
        else if (type === 3) {
            shape = [
                [0, 0, 0, 1, 1, 0, 0, 0],
                [0, 0, 1, 1, 1, 1, 0, 0],
                [0, 0, 1, 1, 1, 1, 0, 0],
                [0, 0, 1, 1, 1, 1, 0, 0],
                [0, 0, 1, 1, 1, 1, 0, 0],
                [0, 0, 1, 1, 1, 1, 0, 0],
                [0, 1, 1, 1, 1, 1, 1, 0],
                [0, 1, 1, 1, 1, 1, 1, 0],
                [1, 1, 1, 0, 0, 1, 1, 1],
                [1, 1, 1, 0, 0, 1, 1, 1],
                [1, 1, 1, 0, 0, 1, 1, 1]
            ];
        }

        shape.forEach((row, rY) => {
            row.forEach((val, rX) => {
                if (val) {
                    this.ctx.fillRect(x + rX * s, y + rY * s, s, s);
                }
            });
        });
    }

    drawLaunchPad() {
        // Draw tower and platform
        const s = 2;
        this.ctx.fillStyle = '#0f380f';

        // Platform
        this.ctx.fillRect(40, 125, 80, 5); // Base

        // Tower (Right side)
        const tx = 90;
        const ty = 60;
        // Lattice structure pattern
        for (let y = ty; y < 125; y += 4) {
            this.ctx.fillRect(tx, y, 10, 1); // Horizontal rungs
            this.ctx.fillRect(tx, y, 2, 4);  // Left vertical
            this.ctx.fillRect(tx + 8, y, 2, 4); // Right vertical
            // Cross
            if ((y - ty) % 8 === 0) {
                this.ctx.fillRect(tx + 2, y + 1, 6, 2);
            }
        }
    }

    drawPerformance(tick) {
        this.clear(false);

        // Background: St. Basil's Silhouette (Detailed)
        this.ctx.fillStyle = '#8bac0f'; // Light green for background shapes

        // Main central tower
        this.ctx.fillRect(70, 60, 20, 70);
        this.ctx.beginPath();
        this.ctx.moveTo(70, 60);
        this.ctx.lineTo(80, 40);
        this.ctx.lineTo(90, 60);
        this.ctx.fill();

        // Left tower
        this.ctx.fillRect(40, 80, 15, 50);
        this.ctx.beginPath();
        this.ctx.arc(47.5, 80, 10, 0, Math.PI * 2);
        this.ctx.fill();

        // Right tower
        this.ctx.fillRect(105, 80, 15, 50);
        this.ctx.beginPath();
        this.ctx.arc(112.5, 80, 10, 0, Math.PI * 2);
        this.ctx.fill();

        // Ground
        this.ctx.fillStyle = '#0f380f';
        this.ctx.fillRect(0, 130, 160, 14);

        // Dancers/Musicians (5 people)
        // Stick figure style: distinct limbs
        const pixelSize = 2; // Finer detail
        const frame = Math.floor(tick / 12) % 2; // Animation frame

        // Positions for 5 people
        const positions = [20, 50, 80, 110, 140];

        // 1. Musician (Left) - Accordion/Balalaika
        this.drawStickMusician(positions[0], 115, frame, pixelSize);

        // 2. Dancer (Left-Center)
        this.drawStickDancer(positions[1], 115, frame, pixelSize);

        // 3. Dancer (Center) - High jumper
        this.drawStickDancer(positions[2], 115, (frame + 1) % 2, pixelSize);

        // 4. Dancer (Right-Center)
        this.drawStickDancer(positions[3], 115, frame, pixelSize);

        // 5. Musician (Right) - Trumpet/Horn
        this.drawStickMusician(positions[4], 115, (frame + 1) % 2, pixelSize);
    }

    drawStickDancer(x, y, frame, s) {
        this.ctx.fillStyle = '#0f380f';

        // Head (Circle-ish)
        this.ctx.fillRect(x + 1 * s, y, 2 * s, 2 * s);

        // Body (Line)
        this.ctx.fillRect(x + 1.5 * s, y + 2 * s, 1 * s, 4 * s);

        // Arms
        if (frame === 0) {
            // Arms down/out
            this.ctx.fillRect(x - 0.5 * s, y + 3 * s, 2 * s, 1 * s); // Left arm
            this.ctx.fillRect(x + 2.5 * s, y + 3 * s, 2 * s, 1 * s); // Right arm
        } else {
            // Arms up
            this.ctx.fillRect(x - 0.5 * s, y + 1 * s, 1 * s, 2 * s); // Left arm up
            this.ctx.fillRect(x + 3.5 * s, y + 1 * s, 1 * s, 2 * s); // Right arm up
        }

        // Legs (Cossack Squat/Kick)
        if (frame === 0) {
            // Squat
            this.ctx.fillRect(x, y + 6 * s, 1 * s, 2 * s); // Left leg bent
            this.ctx.fillRect(x + 3 * s, y + 6 * s, 1 * s, 2 * s); // Right leg bent
            this.ctx.fillRect(x + 1 * s, y + 6 * s, 2 * s, 1 * s); // Hip connector
        } else {
            // Kick
            this.ctx.fillRect(x + 1.5 * s, y + 6 * s, 1 * s, 3 * s); // Standing leg
            this.ctx.fillRect(x - 1.5 * s, y + 5 * s, 3 * s, 1 * s); // Kicking leg (horizontal)
        }
    }

    drawStickMusician(x, y, frame, s) {
        this.ctx.fillStyle = '#0f380f';

        // Head
        this.ctx.fillRect(x + 1 * s, y, 2 * s, 2 * s);

        // Body
        this.ctx.fillRect(x + 1.5 * s, y + 2 * s, 1 * s, 4 * s);

        // Legs (Standing)
        this.ctx.fillRect(x + 0.5 * s, y + 6 * s, 1 * s, 3 * s);
        this.ctx.fillRect(x + 2.5 * s, y + 6 * s, 1 * s, 3 * s);

        // Instrument/Arms
        if (frame === 0) {
            // Playing
            this.ctx.fillRect(x, y + 3 * s, 4 * s, 1 * s); // Arms holding instrument
            this.ctx.fillRect(x + 1 * s, y + 3 * s, 2 * s, 2 * s); // Instrument body
        } else {
            // Bobbing
            this.ctx.fillRect(x, y + 4 * s, 4 * s, 1 * s); // Arms lower
            this.ctx.fillRect(x + 1 * s, y + 4 * s, 2 * s, 2 * s); // Instrument body
        }
    }

    drawParticles(particles) {
        if (!particles) return;
        this.ctx.fillStyle = '#0f380f'; // Dark green smoke
        // Or maybe lighter green for contrast? Let's stick to dark for "smoke" against light sky, 
        // or light against dark ground?
        // Sky is light (#9bbc0f), so smoke should be dark (#0f380f) or medium (#8bac0f).
        // Let's use dark for visibility.

        particles.forEach(p => {
            // Size depends on life
            const size = p.life > 0.5 ? 4 : 2;

            // Dither pattern for semi-transparency effect (checkerboard)
            if (Math.floor(p.x) % 2 === Math.floor(p.y) % 2) {
                this.ctx.fillRect(p.x, p.y, size, size);
            }
        });
    }
}
