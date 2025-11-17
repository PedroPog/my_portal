let canvas, ctx, score = 0, highScore = localStorage.getItem('snakeHighScore') || 0;
let snake = [{x: 10, y: 10}], dx = 0, dy = 0, food = {}, gameRunning = true;
const gridSize = 20, tileCount = 20;

function initGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // ✅ CORREÇÃO: Canvas recebe foco e captura teclas
    canvas.tabIndex = 1;
    canvas.focus();
    canvas.addEventListener('keydown', changeDirection);
    document.addEventListener('keydown', changeDirection);
    
    // ✅ CORREÇÃO: Gera comida ANTES do loop
    createFood();
    
    // Pequeno delay pra garantir inicialização
    setTimeout(() => {
        gameLoop();
    }, 100);
}

function changeDirection(e) {
    const LEFT = 37, UP = 38, RIGHT = 39, DOWN = 40;
    // ✅ CORREÇÃO: Previne movimento oposto e teclas inválidas
    if ((e.keyCode === LEFT || e.key === 'ArrowLeft') && dx !== 1) { 
        dx = -1; dy = 0; 
    }
    if ((e.keyCode === UP || e.key === 'ArrowUp') && dy !== 1) { 
        dx = 0; dy = -1; 
    }
    if ((e.keyCode === RIGHT || e.key === 'ArrowRight') && dx !== -1) { 
        dx = 1; dy = 0; 
    }
    if ((e.keyCode === DOWN || e.key === 'ArrowDown') && dy !== -1) { 
        dx = 0; dy = 1; 
    }
    
    // Foca no canvas sempre
    canvas.focus();
}

function createFood() {
    // ✅ CORREÇÃO: Loop garantido pra NUNCA spawnar na cobra
    do {
        food = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
    } while (snake.some(part => part.x === food.x && part.y === food.y));
}

function drawGame() {
    // Limpa tela
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grade sutil
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1;
    for (let i = 0; i <= canvas.width; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i <= canvas.height; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }

    // Cobra (cabeça mais brilhante)
    for (let i = 0; i < snake.length; i++) {
        ctx.save();
        ctx.translate(snake[i].x * gridSize + gridSize/2, snake[i].y * gridSize + gridSize/2);
        
        // Gradiente neon
        let gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, gridSize/2);
        if (i === 0) { // Cabeça
            gradient.addColorStop(0, '#00ff88');
            gradient.addColorStop(1, '#00cc66');
        } else {
            gradient.addColorStop(0, '#00cc66');
            gradient.addColorStop(1, '#008844');
        }
        
        ctx.fillStyle = gradient;
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 15;
        ctx.fillRect(-gridSize/2 + 1, -gridSize/2 + 1, gridSize - 2, gridSize - 2);
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    // Comida (brilhante)
    ctx.save();
    ctx.translate(food.x * gridSize + gridSize/2, food.y * gridSize + gridSize/2);
    let foodGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, gridSize/2);
    foodGradient.addColorStop(0, '#ff4444');
    foodGradient.addColorStop(1, '#cc0000');
    ctx.shadowColor = '#ff6666';
    ctx.shadowBlur = 20;
    ctx.fillStyle = foodGradient;
    ctx.beginPath();
    ctx.arc(0, 0, gridSize/2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
}

function update() {
    if (!gameRunning) return;

    const head = {x: snake[0].x + dx, y: snake[0].y + dy};

    // ✅ CORREÇÃO: Só verifica colisão SE estiver se movendo
    if (dx === 0 && dy === 0) {
        return; // Cobra parada = sem movimento = sem colisão
    }

    // Parede
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }

    // Corpo (exceto cabeça atual)
    for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOver();
            return;
        }
    }

    snake.unshift(head);

    // Comeu?
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        document.getElementById('score').textContent = score;
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('snakeHighScore', highScore);
            document.getElementById('highScore').textContent = highScore;
        }
        createFood();
    } else {
        snake.pop();
    }
}

function gameLoop() {
    update();
    drawGame();
    setTimeout(gameLoop, 150); // Velocidade perfeita
}

function gameOver() {
    gameRunning = false;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').style.display = 'block';
}

function restartGame() {
    snake = [{x: 10, y: 10}];
    dx = 0; 
    dy = 0;
    score = 0;
    gameRunning = true;
    document.getElementById('score').textContent = 0;
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('highScore').textContent = highScore;
    createFood();
    canvas.focus();
}
function gameOver() {
    gameRunning = false;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').style.display = 'block';

    fetch('/submit_score/snake', {  // ← NUNCA MAIS ID!
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: score })
    });
}

// ✅ CORREÇÃO: Click na tela foca e inicia
document.addEventListener('click', () => {
    canvas.focus();
});