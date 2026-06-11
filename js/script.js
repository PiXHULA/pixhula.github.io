// ============================================
// CONFIGURATION - Customize your projects here
// ============================================
const ORBIT_SPEED = 0.01; // Speed of orbital rotation (higher = faster orbit)

const PROJECTS = [
    {
        name: "Project MineSweeper",
        color: "#ff006e",
        x: 300,
        y: 200,
        radius: 35,
        description: "AI-powered analytics platform",
        link: "https://github.com"
    },
    {
        name: "Project Beta",
        color: "#00f5ff",
        x: 800,
        y: 300,
        radius: 30,
        description: "Real-time collaboration tool",
        link: "https://github.com"
    },
    {
        name: "Project Gamma",
        color: "#ffbe0b",
        x: 1200,
        y: 400,
        radius: 32,
        description: "Machine learning model registry",
        link: "https://github.com"
    },
    {
        name: "Project Delta",
        color: "#fb5607",
        x: 600,
        y: 700,
        radius: 38,
        description: "Distributed data pipeline",
        link: "https://github.com"
    },
    {
        name: "Project Epsilon",
        color: "#8338ec",
        x: 1100,
        y: 800,
        radius: 28,
        description: "Neural network visualization",
        link: "https://github.com"
    }
];

// ============================================
// GAME STATE
// ============================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameWidth = canvas.width = window.innerWidth;
let gameHeight = canvas.height = window.innerHeight;

const SPACESHIP = {
    x: gameWidth / 2,
    y: gameHeight / 2,
    vx: 0,
    vy: 0,
    angle: 0,
    speed: 0,
    maxSpeed: 6,
    friction: 0.99,
    rotationSpeed: 0.1,
    size: 12,
    docking: false,
    dockedPlanet: null
};

const keys = {};
let stars = [];
let targetPlanet = null;

// ============================================
// INITIALIZATION
// ============================================
function initStars() {
    stars = [];
    for (let i = 0; i < 200; i++) {
        stars.push({
            x: Math.random() * gameWidth * 1.5,
            y: Math.random() * gameHeight * 1.5,
            size: Math.random() * 1.5,
            depth: Math.random() * 0.5 + 0.5
        });
    }
}

function findNearestPlanet() {
    let nearest = null;
    let minDist = Infinity;

    for (let planet of PROJECTS) {
        const dx = planet.x - SPACESHIP.x;
        const dy = planet.y - SPACESHIP.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < minDist) {
            minDist = dist;
            nearest = {planet, distance: dist};
        }
    }

    return nearest;
}

// ============================================
// INPUT HANDLING
// ============================================
function isAnyKeyPressed() {
    return keys['W'] || keys['ARROWUP'] ||
        keys['S'] || keys['ARROWDOWN'] ||
        keys['A'] || keys['ARROWLEFT'] ||
        keys['D'] || keys['ARROWRIGHT'];
}

window.addEventListener('keydown', (e) => {
    keys[e.key.toUpperCase()] = true;

    // Break orbit when any movement key is pressed
    if (isAnyKeyPressed() && SPACESHIP.docking) {
        SPACESHIP.docking = false;
        SPACESHIP.dockedPlanet = null;
    }

    if (e.key === 'Escape') {
        SPACESHIP.docking = false;
        SPACESHIP.dockedPlanet = null;
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toUpperCase()] = false;
});

window.addEventListener('resize', () => {
    gameWidth = canvas.width = window.innerWidth;
    gameHeight = canvas.height = window.innerHeight;
});

// ============================================
// GAME LOGIC
// ============================================
function update() {
    // Check for auto-orbit: within range and no keys pressed
    const nearest = findNearestPlanet();
    const orbitRange = 150; // Distance to trigger auto-orbit (planet.radius + X)

    if (!SPACESHIP.docking && nearest && nearest.distance < nearest.planet.radius + orbitRange && !isAnyKeyPressed()) {
        // Enter auto-orbit
        SPACESHIP.docking = true;
        SPACESHIP.dockedPlanet = nearest.planet;
    }

    if (SPACESHIP.docking && SPACESHIP.dockedPlanet) {
        // Orbital mechanics
        const planet = SPACESHIP.dockedPlanet;
        const orbitRadius = planet.radius + 80;
        const currentAngle = Math.atan2(SPACESHIP.y - planet.y, SPACESHIP.x - planet.x);
        const newAngle = currentAngle + ORBIT_SPEED;

        SPACESHIP.x = planet.x + Math.cos(newAngle) * orbitRadius;
        SPACESHIP.y = planet.y + Math.sin(newAngle) * orbitRadius;
        SPACESHIP.angle = newAngle + Math.PI / 2;
        SPACESHIP.speed = 2;
    } else {
        // Normal flight
        if (keys['W'] || keys['ARROWUP']) {
            SPACESHIP.vx += Math.cos(SPACESHIP.angle) * 0.4;
            SPACESHIP.vy += Math.sin(SPACESHIP.angle) * 0.4;
        }
        if (keys['S'] || keys['ARROWDOWN']) {
            SPACESHIP.vx -= Math.cos(SPACESHIP.angle) * 0.3;
            SPACESHIP.vy -= Math.sin(SPACESHIP.angle) * 0.3;
        }
        if (keys['A'] || keys['ARROWLEFT']) {
            SPACESHIP.angle -= SPACESHIP.rotationSpeed;
        }
        if (keys['D'] || keys['ARROWRIGHT']) {
            SPACESHIP.angle += SPACESHIP.rotationSpeed;
        }

        // Apply friction
        SPACESHIP.vx *= SPACESHIP.friction;
        SPACESHIP.vy *= SPACESHIP.friction;

        // Cap speed
        SPACESHIP.speed = Math.sqrt(SPACESHIP.vx * SPACESHIP.vx + SPACESHIP.vy * SPACESHIP.vy);
        if (SPACESHIP.speed > SPACESHIP.maxSpeed) {
            SPACESHIP.vx *= SPACESHIP.maxSpeed / SPACESHIP.speed;
            SPACESHIP.vy *= SPACESHIP.maxSpeed / SPACESHIP.speed;
        }

        SPACESHIP.x += SPACESHIP.vx;
        SPACESHIP.y += SPACESHIP.vy;
    }

    // Wrap around screen
    if (SPACESHIP.x < -50) {
        SPACESHIP.x = gameWidth + 50;
    }
    if (SPACESHIP.x > gameWidth + 50) {
        SPACESHIP.x = -50;
    }
    if (SPACESHIP.y < -50) {
        SPACESHIP.y = gameHeight + 50;
    }
    if (SPACESHIP.y > gameHeight + 50) {
        SPACESHIP.y = -50;
    }

    targetPlanet = findNearestPlanet();
}

// ============================================
// RENDERING
// ============================================
function drawStarfield() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, gameWidth, gameHeight);

    for (let star of stars) {
        // Parallax effect
        const offsetX = (SPACESHIP.x * 0.1) % gameWidth;
        const offsetY = (SPACESHIP.y * 0.1) % gameHeight;

        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 * star.depth})`;
        ctx.fillRect(
            (star.x - offsetX) % gameWidth,
            (star.y - offsetY) % gameHeight,
            star.size,
            star.size
        );
    }
}

function drawPlanets() {
    for (let planet of PROJECTS) {
        // Glow effect
        const glowSize = planet.radius + 20;
        const gradient = ctx.createRadialGradient(planet.x, planet.y, planet.radius, planet.x, planet.y, glowSize);
        gradient.addColorStop(0, planet.color);
        gradient.addColorStop(0.5, planet.color + '80');
        gradient.addColorStop(1, planet.color + '00');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(planet.x, planet.y, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Planet body
        ctx.fillStyle = planet.color;
        ctx.beginPath();
        ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
        ctx.fill();

        // Planet border
        ctx.strokeStyle = planet.color + 'ff';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Planet name
        ctx.fillStyle = planet.color;
        ctx.font = 'bold 12px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText(planet.name, planet.x, planet.y + planet.radius + 25);
    }
}

function drawSpaceship() {
    ctx.save();
    ctx.translate(SPACESHIP.x, SPACESHIP.y);
    ctx.rotate(SPACESHIP.angle);

    // Ship body
    ctx.fillStyle = '#00ff88';
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -8);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-8, 8);
    ctx.closePath();
    ctx.fill();

    // Thruster glow
    if (SPACESHIP.speed > 0.5) {
        ctx.fillStyle = '#ff006e';
        ctx.beginPath();
        ctx.moveTo(-4, -4);
        ctx.lineTo(-4, 4);
        ctx.lineTo(-12 - SPACESHIP.speed * 2, 0);
        ctx.closePath();
        ctx.fill();

        // Flame flicker
        ctx.fillStyle = '#ffbe0b';
        ctx.beginPath();
        ctx.moveTo(-6, -2);
        ctx.lineTo(-6, 2);
        ctx.lineTo(-8 - Math.random() * SPACESHIP.speed * 2, 0);
        ctx.closePath();
        ctx.fill();
    }

    ctx.restore();
}

function drawDistanceLines() {
    if (targetPlanet) {
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.2)';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(SPACESHIP.x, SPACESHIP.y);
        ctx.lineTo(targetPlanet.planet.x, targetPlanet.planet.y);
        ctx.stroke();
        ctx.setLineDash([]);
    }
}

function draw() {
    drawStarfield();
    drawPlanets();
    drawDistanceLines();
    drawSpaceship();
}

// ============================================
// UI UPDATES
// ============================================
function updateUI() {
    // Info panel
    document.getElementById('posX').textContent = Math.round(SPACESHIP.x);
    document.getElementById('posY').textContent = Math.round(SPACESHIP.y);
    document.getElementById('velDisplay').textContent = (SPACESHIP.speed * 10).toFixed(0) + '%';
    document.getElementById('targetCount').textContent = PROJECTS.length;

    // Target panel
    if (targetPlanet) {
        const planet = targetPlanet.planet;
        const distance = Math.round(targetPlanet.distance);
        const orbitRange = 150;
        const canAutoOrbit = distance < planet.radius + orbitRange;

        document.getElementById('targetInfo').innerHTML = `
            <div style="color: ${planet.color}">◆ ${planet.name}</div>
            <div style="margin-top: 8px; font-size: 10px;">
                <div>Distance: ${distance}px</div>
                <div style="margin-top: 5px; color: ${canAutoOrbit ? '#00ff88' : '#ff0055'}">
                    ${canAutoOrbit ? '✓ In orbit range' : '✗ Out of range'}
                </div>
                <div style="margin-top: 8px; font-size: 9px; color: #0f0;">
                    ${planet.description}
                </div>
            </div>
        `;
    }

    // Orbiting indicator
    const orbitIndicator = document.getElementById('orbitingIndicator');
    if (SPACESHIP.docking) {
        orbitIndicator.classList.add('orbiting');
        document.getElementById('orbitingName').textContent = SPACESHIP.dockedPlanet.name;
    } else {
        orbitIndicator.classList.remove('orbiting');
    }
}

// ============================================
// MAIN GAME LOOP
// ============================================
function gameLoop() {
    update();
    draw();
    updateUI();
    requestAnimationFrame(gameLoop);
}

initStars();
gameLoop();
