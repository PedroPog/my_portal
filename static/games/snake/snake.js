const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let grid = 20;
let count = 0;
let score = 0;
let highScore = localStorage.getItem('snakeHigh') || 0;
document.getElementById('highScore').textContent = highScore;

let snake = [
    {x: 10, y: 10}
];
let apple = {x: 15, y: 15};
let dx = 0;
let dy = 0;
let changingDirection = false;
let gameInterval;

// ===== RESPONSIVO =====
function resize() {
    const size = Math.min(window.innerWidth - 40, window.innerHeight - 200);
    canvas.width = canvas.height = Math.floor(size / grid) * grid;
}
resize();
window.addEventListener('resize');

// ===== CONTROLES TECLADO (WEB) =====
document.addEventListener('keydown', e => {
    if (changingDirection) return;
    changingDirection = true;

    const key = e.keyCode;
    if (key == 37 && dx != 1) { dx = -1; dy = 0; }
    if (key == 38 && dy != 1) { dx = 0; dy = -1; }
    if (key == 39 && dx != -1) { dx = 1; dy = 0; }
    if (key == 40 && dy != -1) { dx = 0; dy = 1; }
});

// ===== CONTROLES TOUCH/SWIPE (MOBILE) =====
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

canvas.addEventListener('touchend', e => {
    if (!e.touches.length) {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;

        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal
            if (deltaX > 30 && dx != -1) { dx = 1; dy = 0; }
            if (deltaX < -30 && dx != 1) { dx = -1; dy = 0; }
        } else {
            // Vertical
            if (deltaY > 30 && dy != -1) { dx = 0; dy = 1; }
            if (deltaY < -30 && dy != 1) { dx = 0; dy = -1; }
        }
    }
});

// ===== LOOP DO JOGO =====
function main() {
    if (dx === 0 && dy === 0) {
        // Primeiro toque/tecla inicia o jogo
        return requestAnimationFrame(main);
    }

    if (changingDirection) return;
    changingDirection = true;

    setTimeout(() => {
        changingDirection = false;

        // Move
        let head = {x: snake[0].x + dx, y: snake[0].y + dy};

        // Parede = game over
        if (head.x < 0 || head.x >= canvas.width/grid || head.y < 0 || head.y >= canvas.height/grid) {
            gameOver();
            return;
        }

        // Comeu a si mesma
        for (let segment of snake) {
            if (head.x == segment.x && head.y == segment.y) {
                gameOver();
                return;
            }
        }

        snake.unshift(head);

        // Comeu maçã
        if (head.x == apple.x && head.y == apple.y) {
            score += 10;
            document.getElementById('score').textContent = score;
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('snakeHigh', highScore);
                document.getElementById('highScore').textContent = highScore;
            }
            // Nova maçã
            apple = {
                x: Math.floor(Math.random() * (canvas.width/grid)),
                y: Math.floor(Math.random() * (canvas.height/grid))
            };
        } else {
            snake.pop();
        }

        // Desenha
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Maçã
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(apple.x * grid + 2, apple.y * grid + 2, grid - 4, grid - 4);

        // Cobra
        snake.forEach((s, i) => {
            ctx.fillStyle = i === 0 ? '#2ecc71' : '#27ae60';
            ctx.fillRect(s.x * grid + 2, s.y * grid + 2, grid - 4, grid - 4);
        });

        requestAnimationFrame(main);
    }, 130);
}

// ===== GAME OVER =====
function gameOver() {
    clearTimeout(gameInterval);
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').style.display = 'block';

    // Envia pro ranking do portal
    if (window.location.pathname.includes('/play/snake')) {
        fetch('/submit_score/snake', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score: score })
        });
    }
}

// ===== REINICIAR =====
function restartGame() {
    snake = [{x: 10, y: 10}];
    apple = {x: 15, y: 15};
    dx = 0; dy = 0;
    score = 0;
    document.getElementById('score').textContent = '0';
    document.getElementById('gameOver').style.display = 'none';
    main();
}

// ===== INICIA AUTOMÁTICO =====
main();