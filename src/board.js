import { Tetromino } from './tetromino.js';

export class Board {
    constructor() {
        this.rows = 20;
        this.cols = 10;
        this.grid = this.getEmptyGrid();
        this.piece = new Tetromino();
    }

    getEmptyGrid() {
        return Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
    }

    reset() {
        this.grid = this.getEmptyGrid();
        this.piece = new Tetromino();
    }

    isValid(p) {
        return p.shape.every((row, dy) => {
            return row.every((value, dx) => {
                let x = p.x + dx;
                let y = p.y + dy;
                return (
                    value === 0 ||
                    (x >= 0 && x < this.cols &&
                        y < this.rows && // y >= 0 is not needed for spawn above board, but here we spawn at 0
                        (y < 0 || this.grid[y][x] === 0))
                );
            });
        });
    }

    rotatePiece() {
        const rotatedShape = this.piece.rotate();
        const p = { ...this.piece, shape: rotatedShape };
        if (this.isValid(p)) {
            this.piece.shape = rotatedShape;
            return true;
        } else {
            // Wall kicks (basic)
            // Try moving left
            p.x -= 1;
            if (this.isValid(p)) {
                this.piece.x -= 1;
                this.piece.shape = rotatedShape;
                return true;
            }
            // Try moving right
            p.x += 2; // +1 from original
            if (this.isValid(p)) {
                this.piece.x += 1;
                this.piece.shape = rotatedShape;
                return true;
            }
        }
        return false;
    }

    movePiece(dx, dy) {
        const p = { ...this.piece, x: this.piece.x + dx, y: this.piece.y + dy };
        if (this.isValid(p)) {
            this.piece.x += dx;
            this.piece.y += dy;
            return true;
        }
        return false;
    }

    drop(nextPiece) {
        if (!this.movePiece(0, 1)) {
            this.lock();
            const linesCleared = this.clearLines();

            // Use the next piece provided, or create new if not provided (fallback)
            this.piece = nextPiece || new Tetromino();

            // Check game over
            if (!this.isValid(this.piece)) {
                return { playing: false, linesCleared: linesCleared, pieceLocked: true };
            }
            return { playing: true, linesCleared: linesCleared, pieceLocked: true };
        }
        return { playing: true, linesCleared: 0, pieceLocked: false };
    }

    lock() {
        this.piece.shape.forEach((row, dy) => {
            row.forEach((value, dx) => {
                if (value) {
                    let y = this.piece.y + dy;
                    if (y >= 0) {
                        this.grid[y][this.piece.x + dx] = value;
                    }
                }
            });
        });
    }

    clearLines() {
        let linesCleared = 0;
        this.grid = this.grid.filter(row => {
            const isFull = row.every(value => value !== 0);
            if (isFull) linesCleared++;
            return !isFull;
        });
        while (this.grid.length < this.rows) {
            this.grid.unshift(Array(this.cols).fill(0));
        }
        return linesCleared;
    }
}
