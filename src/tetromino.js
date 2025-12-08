export const SHAPES = {
    I: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    J: [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0]
    ],
    L: [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0]
    ],
    O: [
        [1, 1],
        [1, 1]
    ],
    S: [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0]
    ],
    T: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0]
    ],
    Z: [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0]
    ]
};

export const COLORS = {
    I: 1, J: 1, L: 1, O: 1, S: 1, T: 1, Z: 1 // All same color for GB style
};

export class Tetromino {
    constructor(type) {
        this.type = type || this.randomType();
        this.shape = SHAPES[this.type];
        this.color = COLORS[this.type];
        this.x = Math.floor((10 - this.shape[0].length) / 2);
        this.y = 0;
    }

    randomType() {
        const types = 'IJLOSTZ';
        return types[Math.floor(Math.random() * types.length)];
    }

    rotate() {
        const newShape = [];
        for (let y = 0; y < this.shape[0].length; y++) {
            newShape[y] = [];
            for (let x = 0; x < this.shape.length; x++) {
                newShape[y][x] = this.shape[this.shape.length - 1 - x][y];
            }
        }
        return newShape;
    }
}
