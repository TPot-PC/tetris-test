import { Game } from './game.js';
import { SoundManager } from './audio.js';

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const soundManager = new SoundManager();
    const game = new Game(canvas, soundManager);

    const passwordScreen = document.getElementById('password-screen');
    const gameScreen = document.getElementById('game-screen');
    const passwordInput = document.getElementById('password-input');
    const passwordSubmit = document.getElementById('password-submit');
    const errorMessage = document.getElementById('error-message');

    // Leaderboard Elements
    const nameInputModal = document.getElementById('name-input-modal');
    const leaderboardModal = document.getElementById('leaderboard-modal');
    const submitScoreBtn = document.getElementById('submit-score-btn');
    const leaderboardList = document.getElementById('leaderboard-list');

    // SHA-256 hash of "P1101"
    const TARGET_HASH = 'bfaab51e35ad7b3d1666f7469bc4c42bc87bfa7807198d84cc0d59c656fc92f3';

    async function checkPassword() {
        const password = passwordInput.value;

        try {
            // Simple bypass for development contexts
            if (!window.crypto || !window.crypto.subtle) {
                if (password === 'P1101') {
                    startGame();
                    return;
                }
            }

            const msgBuffer = new TextEncoder().encode(password);
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            if (hashHex === TARGET_HASH) {
                startGame();
            } else {
                showError();
            }
        } catch (e) {
            console.error(e);
            if (password === 'P1101') {
                startGame();
            } else {
                showError();
            }
        }
    }

    function startGame() {
        passwordScreen.style.display = 'none';
        gameScreen.style.display = 'block';
        soundManager.init(); // Initialize audio context
        game.start();
    }

    // UI States
    const UI_STATE = {
        NORMAL: 'NORMAL',
        FETCHING: 'FETCHING',
        INPUT_NAME: 'INPUT_NAME',
        SHOWING_RANKING: 'SHOWING_RANKING'
    };
    let uiState = UI_STATE.NORMAL;

    // Custom Name Input Logic
    const CHAR_SET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789-.";
    let nameChars = ['A', 'A', 'A'];
    let nameCursor = 0;

    function updateNameInputUI() {
        for (let i = 0; i < 3; i++) {
            const slot = document.getElementById(`char-${i}`);
            if (slot) {
                slot.textContent = nameChars[i];
                if (i === nameCursor) {
                    slot.classList.add('active');
                } else {
                    slot.classList.remove('active');
                }
            }
        }
    }

    // Leaderboard Logic
    game.onLeaderboardCheck = async (score) => {
        uiState = UI_STATE.FETCHING;

        // Fetch leaderboard first to check if high score
        const rankings = await game.fetchLeaderboard();

        rankings.sort((a, b) => b.score - a.score);

        let isHighScore = false;
        if (score > 0) {
            if (rankings.length < 5) {
                isHighScore = true;
            } else {
                const lowestTop5 = rankings[4].score;
                if (score > lowestTop5) {
                    isHighScore = true;
                }
            }
        }

        if (isHighScore) {
            uiState = UI_STATE.INPUT_NAME;
            nameChars = ['A', 'A', 'A'];
            nameCursor = 0;
            updateNameInputUI();
            nameInputModal.style.display = 'block';
        } else {
            uiState = UI_STATE.SHOWING_RANKING;
            showLeaderboard(rankings, null, null);
        }
    };

    async function submitScore() {
        if (uiState !== UI_STATE.INPUT_NAME) return;

        const name = nameChars.join('');
        nameInputModal.style.display = 'none';

        uiState = UI_STATE.FETCHING;

        await game.submitScore(name);

        const rankings = await game.fetchLeaderboard();

        uiState = UI_STATE.SHOWING_RANKING;
        showLeaderboard(rankings, name, game.score);
    }

    submitScoreBtn.addEventListener('click', submitScore);

    function showLeaderboard(rankings, currentName, currentScore) {
        leaderboardList.innerHTML = '';
        rankings.sort((a, b) => b.score - a.score);
        const top5 = rankings.slice(0, 5);
        let highlighted = false;

        top5.forEach((entry, index) => {
            const div = document.createElement('div');
            div.className = 'leaderboard-item';

            if (currentName && currentScore && !highlighted && entry.name === currentName && parseInt(entry.score) === parseInt(currentScore)) {
                div.classList.add('blink');
                highlighted = true;
            }

            div.innerHTML = `<span>${index + 1}. ${entry.name}</span><span>${entry.score}</span>`;
            leaderboardList.appendChild(div);
        });

        leaderboardModal.style.display = 'block';
    }

    function dismissLeaderboard() {
        leaderboardModal.style.display = 'none';
        game.board.reset();
        game.draw();
        uiState = UI_STATE.NORMAL;
        // Do NOT restart game immediately, let user press start? 
        // User workflow: "Next game" usually implies waiting for start. 
        // game.start() checks isRunning, if reset() sets isRunning=false, we are good.
        // Game constructor sets isRunning=false. Game.start marks true. 
        // We just need to ensure we are in a "Title" or "Standby" state.
        // Current game.js doesn't have explicit title screen draw in reset, but draw() should clear/draw empty.
        // Wait, game.draw() when not running? 
        // Ensure game.isRunning is false?
        game.isRunning = false;
    }

    function showError() {
        errorMessage.style.display = 'block';
        passwordInput.value = '';
    }

    passwordSubmit.addEventListener('click', checkPassword);

    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkPassword();
        }
    });

    // Mouse Controls
    const btnA = document.getElementById('btn-a');
    const btnB = document.getElementById('btn-b');
    const btnStart = document.getElementById('btn-start');
    const dPadH = document.querySelector('.d-pad-h');
    const dPadV = document.querySelector('.d-pad-v');

    function handleInput(action) {
        if (uiState === UI_STATE.FETCHING) return;

        if (uiState === UI_STATE.INPUT_NAME) {
            if (action === 'start' || action === 'rotate') {
                submitScore();
            } else if (action === 'left') {
                nameCursor = (nameCursor - 1 + 3) % 3;
                updateNameInputUI();
            } else if (action === 'right') {
                nameCursor = (nameCursor + 1) % 3;
                updateNameInputUI();
            } else if (action === 'down') {
                const currentIndex = CHAR_SET.indexOf(nameChars[nameCursor]);
                const nextIndex = (currentIndex + 1) % CHAR_SET.length;
                nameChars[nameCursor] = CHAR_SET[nextIndex];
                updateNameInputUI();
            } else if (action === 'up') {
                const currentIndex = CHAR_SET.indexOf(nameChars[nameCursor]);
                const prevIndex = (currentIndex - 1 + CHAR_SET.length) % CHAR_SET.length;
                nameChars[nameCursor] = CHAR_SET[prevIndex];
                updateNameInputUI();
            }
            return;
        }

        if (uiState === UI_STATE.SHOWING_RANKING) {
            if (action) {
                dismissLeaderboard();
            }
            return;
        }

        if (!game.isRunning) {
            if (action === 'start') game.start();
            return;
        }

        if (action === 'start') {
            game.togglePause();
            return;
        }

        if (game.isPaused) return;

        switch (action) {
            case 'left':
                if (game.board.movePiece(-1, 0)) soundManager.playMove();
                break;
            case 'right':
                if (game.board.movePiece(1, 0)) soundManager.playMove();
                break;
            case 'down':
                if (game.board.movePiece(0, 1)) soundManager.playMove();
                break;
            case 'rotate':
                if (game.board.rotatePiece()) soundManager.playRotate();
                break;
        }
        game.draw();
    }

    btnA.addEventListener('click', () => handleInput('rotate'));
    btnB.addEventListener('click', () => handleInput('rotate'));
    btnStart.addEventListener('click', () => handleInput('start'));

    dPadH.addEventListener('click', (e) => {
        const rect = dPadH.getBoundingClientRect();
        const x = e.clientX - rect.left;
        if (x < rect.width / 2) {
            handleInput('left');
        } else {
            handleInput('right');
        }
    });

    // Continuous movement
    let moveInterval = null;
    let moveTimeout = null;
    let currentMoveAction = null;

    function startMove(action) {
        if (currentMoveAction) return;
        currentMoveAction = action;

        handleInput(action);

        let delay = 300;
        let rate = 100;

        if (uiState === UI_STATE.INPUT_NAME) {
            if (action === 'up' || action === 'down') {
                delay = 1000;
                rate = 200;
            }
        } else if (uiState === UI_STATE.NORMAL) {
            if (action === 'down') {
                delay = 200;
                rate = 100;
            }
        }

        moveTimeout = setTimeout(() => {
            moveInterval = setInterval(() => {
                handleInput(action);
            }, rate);
        }, delay);
    }

    function stopMove() {
        if (moveTimeout) clearTimeout(moveTimeout);
        if (moveInterval) clearInterval(moveInterval);
        moveTimeout = null;
        moveInterval = null;
        currentMoveAction = null;
    }

    dPadV.addEventListener('mousedown', (e) => {
        const rect = dPadV.getBoundingClientRect();
        const y = e.clientY - rect.top;
        if (y > rect.height / 2) {
            startMove('down');
        } else {
            startMove('up');
        }
    });

    dPadV.addEventListener('mouseup', stopMove);
    dPadV.addEventListener('mouseleave', stopMove);

    dPadV.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const rect = dPadV.getBoundingClientRect();
        const touch = e.touches[0];
        const y = touch.clientY - rect.top;
        if (y > rect.height / 2) {
            startMove('down');
        } else {
            startMove('up');
        }
    });

    dPadV.addEventListener('touchend', stopMove);

    document.addEventListener('keydown', (e) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
            e.preventDefault();
        }

        if (e.repeat) {
            if (uiState === UI_STATE.INPUT_NAME && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
                return;
            }
            // Allow OS repeat for game controls
        }

        let action = null;
        switch (e.key) {
            case 'ArrowLeft': action = 'left'; break;
            case 'ArrowRight': action = 'right'; break;
            case 'ArrowDown': action = 'down'; break;
            case 'ArrowUp': action = 'up'; break;
            case 'z': case 'Z': action = 'rotate'; break;
            case 'x': case 'X': action = 'rotate'; break;
            case 'Enter': action = 'start'; break;
            case 'm': case 'M':
                soundManager.toggleMute();
                return;
        }

        if (action) {
            if (uiState === UI_STATE.INPUT_NAME && (action === 'up' || action === 'down')) {
                startMove(action);
            } else {
                handleInput(action);
            }
        }
    });

    document.addEventListener('keyup', (e) => {
        let action = null;
        switch (e.key) {
            case 'ArrowUp': action = 'up'; break;
            case 'ArrowDown': action = 'down'; break;
        }
        if (action && uiState === UI_STATE.INPUT_NAME) {
            stopMove();
        }
    });
});
