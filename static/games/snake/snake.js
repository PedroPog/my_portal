let canvas, ctx, score = 0, highScore = localStorage.getItem('snakeHighScore') || 0;
let snake = [{x: 10, y: 10}], dx = 0, dy = 0, food = {}, gameRunning = false; // Para no mobile
const gridSize = 20, tileCount = 20;
let joystickActive = false, joystickAngle = 0;
let touchStartX = 0, touchStartY = 0;

// ===== INICIALIZAÇÃO =====
function initGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // RESPONSIVO: adapta ao mobile
    function resizeCanvas() {
        const maxSize = Math.min(window.innerWidth * 0.95, window.innerHeight * 0.7);
        canvas.width = Math.floor(maxSize / gridSize) * gridSize;
        canvas.height = canvas.width;
        tileCount = canvas.width / gridSize;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // CONTROLES TECLADO (desktop)
    document.addEventListener('keydown', changeDirection);
    canvas.addEventListener('keydown', changeDirection);
    
    // CONTROLES TOUCH/SWIPE (mobile)
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // Clique/tap inicia o jogo
    canvas.addEventListener('click', () => { if (!gameRunning) startGame(); });
    canvas.addEventListener('touchstart', () => { if (!gameRunning) startGame(); });
    
    // Foco automático
    canvas.focus();
    
    createFood();
    document.getElementById('highScore').textContent = highScore;
}

// ===== INÍCIO DO JOGO (mobile precisa de toque primeiro) =====
function startGame() {
    gameRunning = true;
    document.querySelector('.tutorial').style.display = 'none';
}

// ===== SWIPE GESTURES (super intuitivo no mobile) =====
function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    showJoystick(touch.clientX, touch.clientY);
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!gameRunning) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    
    // Atualiza joystick visual
    updateJoystick(deltaX, deltaY);
    
    // Detecta direção dominante (swipe)
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal
        if (deltaX > 30 && dx !== -1) { dx = 1; dy = 0; }  // Direita
        else if (deltaX < -30 && dx !== 1) { dx = -1; dy = 0; } // Esquerda
    } else {
        // Vertical
        if (deltaY > 30 && dy !== -1) { dx = 0; dy = 1; }  // Baixo
        else if (deltaY < -30 && dy !== 1) { dx = 0; dy = -1; } // Cima
    }
}

function handleTouchEnd(e) {
    e.preventDefault();
    hideJoystick();
}

// ===== JOYSTICK VISUAL (discreto e mobile-only) =====
function showJoystick(clientX, clientY) {
    const zone = document.getElementById('joystickZone');
    const knob = document.getElementById('joystickKnob');
    zone.style.display = 'block';
    zone.style.left = (clientX - 60) + 'px';
    zone.style.top = (clientY - 60) + 'px';
    joystickActive = true;
}

function updateJoystick(deltaX, deltaY) {
    const knob = document.getElementById('joystickKnob');
    const dist = Math.min(30, Math.sqrt(deltaX*deltaX + deltaY*deltaY));
    const angle = Math.atan2(deltaY, deltaX);
    const knobX = 30 + Math.cos(angle) * dist;
    const knobY = 30 + Math.sin(angle) * dist;
    knob.style.left = knobX + 'px';
    knob.style.top = knobY + 'px';
}

function hideJoystick() {
    document.getElementById('joystickZone').style.display = 'none';
    joystickActive = false;
}

// ===== CONTROLES TECLADO (igual antes) =====
function changeDirection(e) {
    const LEFT = 37, UP = 38, RIGHT = 39, DOWN = 40;
    if ((e.keyCode === LEFT || e.key === 'ArrowLeft') && dx !== 1) { dx = -1; dy = 0; }
    if ((e.keyCode === UP || e.key === 'ArrowUp') && dy !== 1) { dx = 0; dy = -1; }
    if ((e.keyCode === RIGHT || e.key === 'ArrowRight') && dx !== -1) { dx = 1; dy = 0; }
    if ((e.keyCode === DOWN || e.key === 'ArrowDown') && dy !== -1) { dx = 0; dy = 1; }
    if (!gameRunning) startGame();
    canvas.focus();
}

// Resto do código igual (createFood, drawGame, update, gameLoop, gameOver, restartGame)
function createFood() {
    do {
        food = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
    } while (snake.some(part => part.x === food.x && part.y === food.y));
}

function drawGame() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grade
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1;
    for (let i = 0; i <= canvas.width; i += gridSize) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
    }
    for (let i = 0; i <= canvas.height; i += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
    }

    // Cobra
    for (let i = 0; i < snake.length; i++) {
        ctx.save();
        ctx.translate(snake[i].x * gridSize + gridSize/2, snake[i].y * gridSize + gridSize/2);
        let gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, gridSize/2);
        if (i === 0) {
            gradient.addColorStop(0, '#00ff88'); gradient.addColorStop(1, '#00cc66');
        } else {
            gradient.addColorStop(0, '#00cc66'); gradient.addColorStop(1, '#008844');
        }
        ctx.fillStyle = gradient;
        ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 15;
        ctx.fillRect(-gridSize/2 + 1, -gridSize/2 + 1, gridSize - 2, gridSize - 2);
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    // Comida
    ctx.save();
    ctx.translate(food.x * gridSize + gridSize/2, food.y * gridSize + gridSize/2);
    let foodGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, gridSize/2);
    foodGradient.addColorStop(0, '#ff4444'); foodGradient.addColorStop(1, '#cc0000');
    ctx.shadowColor = '#ff6666'; ctx.shadowBlur = 20;
    ctx.fillStyle = foodGradient;
    ctx.beginPath();
    ctx.arc(0, 0, gridSize/2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
}

function update() {
    if (!gameRunning) return;

    if (dx === 0 && dy === 0) return; // Cobra parada no mobile

    const head = {x: snake[0].x + dx, y: snake[0].y + dy};

    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver(); return;
    }

    for (let part of snake) {
        if (head.x === part.x && head.y === part.y) {
            gameOver(); return;
        }
    }

    snake.unshift(head);

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
    setTimeout(gameLoop, 150);
}

function gameOver() {
    gameRunning = false;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').style.display = 'block';
    
    // ENVIA PONTUAÇÃO (se no portal)
    if (window.location.pathname.includes('/play/')) {
        fetch('/submit_score/snake', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score: score })
        }).catch(() => {}); // Silencioso se offline
    }
}

function restartGame() {
    snake = [{x: 10, y: 10}];
    dx = 0; dy = 0; score = 0;
    document.getElementById('score').textContent = 0;
    document.getElementById('gameOver').style.display = 'none';
    gameRunning = true;
    createFood();
    canvas.focus();
}