// ===== GLOBALS =====
let score = 0;
let highScore = localStorage.getItem('tetrisHighScore') || 0;
let highScoreInitials = localStorage.getItem('tetrisHighScoreInitials') || '---';
let canvas, context;
let running = false;
let blockSize = 20;
let rows = 20;
let cols = 10;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let posX = 0;
let posY = 0;
let currentPiece = null;
let currentColor = 'cyan';
const colors = ['cyan', 'magenta', 'yellow', 'lime', 'orange', 'red', 'blue'];

const tetrominoes = [
    [[1, 1, 1, 1]],
    [[1, 0, 0], [1, 1, 1]],
    [[0, 0, 1], [1, 1, 1]],
    [[0, 1, 0], [1, 1, 1]],
    [[1, 1], [1, 1]],
    [[0, 1, 1], [1, 1, 0]],
    [[1, 1, 0], [0, 1, 1]]
];

let playfield = createMatrix(rows, cols);

// ===== FUNCTIONS =====
function createMatrix(rows, cols) {
    const matrix = [];
    while (rows--) {
        matrix.push(new Array(cols).fill(0));
    }
    return matrix;
}

function drawMatrix(matrix, offsetX = 0, offsetY = 0) {
    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < matrix[y].length; x++) {
            if (matrix[y][x]) {
                context.fillStyle = typeof matrix[y][x] === 'string' ? matrix[y][x] : currentColor;
                context.fillRect((x + offsetX) * blockSize, (y + offsetY) * blockSize, blockSize - 1, blockSize - 1);
            }
        }
    }
}

function drawTetris(time = 0) {
    if (!running) return;

    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;

    if (dropCounter > dropInterval) {
        posY++;
        if (collide(playfield, currentPiece, posX, posY)) {
            posY--;
            merge(playfield, currentPiece, posX, posY, currentColor);
            clearRows();
            spawnNewPiece();
        }
        dropCounter = 0;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    drawMatrix(playfield);
    drawMatrix(currentPiece, posX, posY);

    requestAnimationFrame(drawTetris);
}

function merge(grid, piece, offsetX, offsetY, color) {
    piece.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                grid[y + offsetY][x + offsetX] = color;
            }
        });
    });
}

function collide(grid, piece, offsetX, offsetY) {
    for (let y = 0; y < piece.length; y++) {
        for (let x = 0; x < piece[y].length; x++) {
            if (piece[y][x] && (grid[y + offsetY] && grid[y + offsetY][x + offsetX]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function spawnNewPiece() {
    const index = Math.floor(Math.random() * tetrominoes.length);
    currentPiece = tetrominoes[index];
    posX = Math.floor(cols / 2) - Math.floor(currentPiece[0].length / 2);
    posY = 0;
    currentColor = colors[Math.floor(Math.random() * colors.length)];

    if (collide(playfield, currentPiece, posX, posY)) {
        running = false;
        context.clearRect(0, 0, canvas.width, canvas.height);
        drawMatrix(playfield);

        setTimeout(() => {
            if (score > highScore) {
                let initials = prompt('🏆 New High Score! Enter your initials (3 letters):', '').toUpperCase().slice(0, 3);
                if (!initials) initials = '---';
                highScoreInitials = initials;
                highScore = score;
                localStorage.setItem('tetrisHighScore', highScore);
                localStorage.setItem('tetrisHighScoreInitials', initials);
                saveHighScoreOnline(initials, highScore);
            }
            updateScoreboard();
            alert('💀 GAME OVER!\nPress the Tetris button to play again.');
        }, 300);
    }
}

function updateScore(points) {
    score += points;
    document.getElementById('score').textContent = score;
}

function updateScoreboard() {
    document.getElementById('score').textContent = score;
    document.getElementById('highScore').textContent = `${highScore} (${highScoreInitials})`;
}

function clearRows() {
    let rowsCleared = 0;
    for (let y = playfield.length - 1; y >= 0; y--) {
        if (playfield[y].every(cell => cell !== 0)) {
            playfield.splice(y, 1);
            playfield.unshift(new Array(cols).fill(0));
            rowsCleared++;
            y++;
        }
    }
    if (rowsCleared > 0) {
        updateScore(rowsCleared * 100);
    }
}

function startTetris() {
    canvas = document.getElementById('tetris');
    context = canvas.getContext('2d');
    running = true;
    playfield = createMatrix(rows, cols);
    spawnNewPiece();
    score = 0;
    lastTime = 0;
    dropCounter = 0;

    setupScoreboard();
    updateScoreboard();

    context.clearRect(0, 0, canvas.width, canvas.height);
    drawMatrix(playfield);
    drawMatrix(currentPiece, posX, posY);

    requestAnimationFrame(drawTetris);
}

function setupScoreboard() {
    if (!document.getElementById('scoreboard')) {
        const scoreboard = document.createElement('div');
        scoreboard.id = 'scoreboard';
        scoreboard.style.color = 'white';
        scoreboard.style.fontSize = '18px';
        scoreboard.style.textAlign = 'center';
        scoreboard.style.marginBottom = '10px';
        scoreboard.style.textShadow = '1px 1px 2px black';
        scoreboard.style.position = 'fixed';
        scoreboard.style.top = '10px';
        scoreboard.style.left = '50%';
        scoreboard.style.transform = 'translateX(-50%)';
        scoreboard.style.zIndex = '3000';
        scoreboard.innerHTML = `Score: <span id="score">0</span> | High Score: <span id="highScore">0 (---)</span>`;
        document.body.appendChild(scoreboard);
    }
}

function tryRotateClockwise() {
    const rotated = rotateClockwise(currentPiece);
    if (!collide(playfield, rotated, posX, posY)) {
        currentPiece = rotated;
    } else {
        // Try wall kicks
        if (!collide(playfield, rotated, posX - 1, posY)) {
            posX--;
            currentPiece = rotated;
        } else if (!collide(playfield, rotated, posX + 1, posY)) {
            posX++;
            currentPiece = rotated;
        }
    }
}


function rotateClockwise(matrix) {
    return matrix[0].map((_, i) => matrix.map(row => row[i]).reverse());
}

function tryRotateCounterClockwise() {
    const rotated = rotateCounterClockwise(currentPiece);
    if (!collide(playfield, rotated, posX, posY)) {
        currentPiece = rotated;
    } else {
        // Try wall kicks
        if (!collide(playfield, rotated, posX - 1, posY)) {
            posX--;
            currentPiece = rotated;
        } else if (!collide(playfield, rotated, posX + 1, posY)) {
            posX++;
            currentPiece = rotated;
        }
    }
}

function saveHighScoreOnline(initials, score) {
  fetch('save_score.php', {
    method: 'POST',
    body: new URLSearchParams({
      initials: initials,
      score: score
    })
  }).then(response => response.text())
    .then(data => console.log('✅ Server responded:', data))
    .catch(err => console.error('❌ Error saving score:', err));
}

function loadHighscores() {
    fetch('get_scores.php')
    .then(response => response.json())
    .then(scores => {
        const table = document.getElementById('highscore-table');
        table.innerHTML = '<tr><th>Rank</th><th>Initials</th><th>Score</th></tr>';

        scores.forEach((entry, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${entry.initials}</td>
                <td>${entry.score}</td>
            `;
            table.appendChild(row);
        });
    })
    .catch(error => console.error('❌ Failed to load highscores:', error));
}

// ===== EVENTS =====

document.getElementById('tetris-toggle').addEventListener('click', () => {
    const wrapper = document.getElementById('tetris-wrapper');
    if (running) {
        wrapper.style.display = 'none';
        running = false;
    } else {
        wrapper.style.display = 'flex';
        startTetris();
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        running = !running;
        if (running) requestAnimationFrame(drawTetris);
        return;
    }

    if (!running) return;
    event.preventDefault();

    if (event.key === 'ArrowLeft') {
        posX--;
        if (collide(playfield, currentPiece, posX, posY)) posX++;
    }
    if (event.key === 'ArrowRight') {
        posX++;
        if (collide(playfield, currentPiece, posX, posY)) posX--;
    }
    if (event.key === 'ArrowDown') {
        posY++;
        if (collide(playfield, currentPiece, posX, posY)) posY--;
    }
    if (event.key === 'ArrowUp') {
        tryRotateClockwise(); // <--- THIS
    }
});

// === Mobile buttons ===
document.getElementById('left-btn')?.addEventListener('click', () => {
    if (!running) return;
    posX--;
    if (collide(playfield, currentPiece, posX, posY)) posX++;
});
document.getElementById('right-btn')?.addEventListener('click', () => {
    if (!running) return;
    posX++;
    if (collide(playfield, currentPiece, posX, posY)) posX--;
});
document.getElementById('rotate-btn')?.addEventListener('click', () => {
    if (!running) return;
    tryRotateClockwise(); // <--- FIX FOR MOBILE TOO
});
document.getElementById('down-btn')?.addEventListener('click', () => {
    if (!running) return;
    while (!collide(playfield, currentPiece, posX, posY + 1)) {
        posY++;
    }
    // As soon as we collide, lock it into place:
    merge(playfield, currentPiece, posX, posY, currentColor);
    clearRows();
    spawnNewPiece();
});

// Setup scoreboard immediately
setupScoreboard();
updateScoreboard();
loadHighscores();
