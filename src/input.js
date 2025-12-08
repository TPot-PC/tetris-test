export class InputHandler {
    constructor(game) {
        this.game = game;
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    handleKeyDown(event) {
        if (!this.game.isRunning) {
            if (event.code === 'Enter') {
                this.game.start();
            }
            return;
        }

        switch (event.code) {
            case 'ArrowLeft':
                if (this.game.board.movePiece(-1, 0)) {
                    if (this.game.soundManager) this.game.soundManager.playMove();
                }
                break;
            case 'ArrowRight':
                if (this.game.board.movePiece(1, 0)) {
                    if (this.game.soundManager) this.game.soundManager.playMove();
                }
                break;
            case 'ArrowDown':
                if (this.game.board.movePiece(0, 1)) {
                    if (this.game.soundManager) this.game.soundManager.playMove();
                }
                break;
            case 'KeyZ':
                if (this.game.board.rotatePiece()) {
                    if (this.game.soundManager) this.game.soundManager.playRotate();
                }
                break;
            case 'KeyX':
                if (this.game.board.rotatePiece()) { // Basic rotation for now, maybe different direction later
                    if (this.game.soundManager) this.game.soundManager.playRotate();
                }
                break;
            case 'KeyM':
                if (this.game.soundManager) this.game.soundManager.toggleMute();
                break;
        }
        this.game.draw(); // Redraw immediately on input
    }
}
