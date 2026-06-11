// ============================================
// CONFIGURATION - Customize your projects here
// ============================================
const SETTINGS = {
    ORBIT: {
        SPEED: 0.01,
        AUTO_ORBIT_RANGE: 150,
        ORBIT_RADIUS_OFFSET: 80,
        DOCKED_SPEED: 2
    },
    WORLD: {
        STAR_COUNT: 200,
        STARFIELD_SCALE: 1.5,
        STAR_DEPTH_BASE: 0.5,
        STAR_DEPTH_VARIATION: 0.5,
        STAR_SIZE_MAX: 1.5,
        STAR_PARALLAX_SCALE: 0.1,
        STAR_OPACITY: 0.3,
        WRAP_MARGIN: 50
    },
    SHIP: {
        START_VX: 0,
        START_VY: 0,
        START_ANGLE: 0,
        START_SPEED: 0,
        MAX_SPEED: 6,
        FRICTION: 0.99,
        ROTATION_SPEED: 0.1,
        FORWARD_THRUST: 0.4,
        REVERSE_THRUST: 0.3,
        THRUSTER_VISIBLE_SPEED: 0.5,
        SHIP_NOSE_X: 12,
        SHIP_REAR_X: -8,
        SHIP_MID_X: -4,
        SHIP_TOP_Y: -8,
        SHIP_BOTTOM_Y: 8,
        THRUSTER_BASE_X: -4,
        THRUSTER_BASE_Y: -4,
        THRUSTER_TIP_X: -12,
        THRUSTER_SPEED_MULTIPLIER: 2,
        FLAME_BASE_X: -6,
        FLAME_BASE_Y: -2,
        FLAME_TIP_X: -8,
        FLAME_SPEED_MULTIPLIER: 2
    },
    RENDER: {
        ORIGIN_X: 0,
        ORIGIN_Y: 0,
        FULL_CIRCLE: Math.PI * 2,
        HALF_CIRCLE: Math.PI / 2,
        GRADIENT_STOP_START: 0,
        GRADIENT_STOP_MIDDLE: 0.5,
        GRADIENT_STOP_END: 1,
        PLANET_GLOW_PADDING: 20,
        PLANET_BORDER_WIDTH: 1,
        PLANET_LABEL_OFFSET: 25,
        PLANET_LABEL_FONT_SIZE: 12,
        DISTANCE_LINE_WIDTH: 1,
        DISTANCE_DASH_LENGTH: 5,
        DISTANCE_DASH_GAP: 5,
        STARFIELD_BACKGROUND: '#000'
    },
    UI: {
        SPEED_DISPLAY_MULTIPLIER: 10,
        TARGET_DISTANCE_MARGIN_TOP: 8,
        TARGET_STATUS_MARGIN_TOP: 5,
        TARGET_DESCRIPTION_MARGIN_TOP: 8,
        TARGET_DESCRIPTION_FONT_SIZE: 9,
        TARGET_FONT_SIZE: 10
    }
};

const PROJECT_LAYOUT = {
    MINE_SWEEPER: { X: 300, Y: 200, RADIUS: 35 },
    BETA: { X: 800, Y: 300, RADIUS: 30 },
    GAMMA: { X: 1200, Y: 400, RADIUS: 32 },
    DELTA: { X: 600, Y: 700, RADIUS: 38 },
    EPSILON: { X: 1100, Y: 800, RADIUS: 28 }
};

const PROJECTS = [
    {
        name: "Project MineSweeper",
        color: "#ff006e",
        x: PROJECT_LAYOUT.MINE_SWEEPER.X,
        y: PROJECT_LAYOUT.MINE_SWEEPER.Y,
        radius: PROJECT_LAYOUT.MINE_SWEEPER.RADIUS,
        description: "AI-powered analytics platform",
        link: "https://github.com"
    },
    {
        name: "Project Beta",
        color: "#00f5ff",
        x: PROJECT_LAYOUT.BETA.X,
        y: PROJECT_LAYOUT.BETA.Y,
        radius: PROJECT_LAYOUT.BETA.RADIUS,
        description: "Real-time collaboration tool",
        link: "https://github.com"
    },
    {
        name: "Project Gamma",
        color: "#ffbe0b",
        x: PROJECT_LAYOUT.GAMMA.X,
        y: PROJECT_LAYOUT.GAMMA.Y,
        radius: PROJECT_LAYOUT.GAMMA.RADIUS,
        description: "Machine learning model registry",
        link: "https://github.com"
    },
    {
        name: "Project Delta",
        color: "#fb5607",
        x: PROJECT_LAYOUT.DELTA.X,
        y: PROJECT_LAYOUT.DELTA.Y,
        radius: PROJECT_LAYOUT.DELTA.RADIUS,
        description: "Distributed data pipeline",
        link: "https://github.com"
    },
    {
        name: "Project Epsilon",
        color: "#8338ec",
        x: PROJECT_LAYOUT.EPSILON.X,
        y: PROJECT_LAYOUT.EPSILON.Y,
        radius: PROJECT_LAYOUT.EPSILON.RADIUS,
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
    vx: SETTINGS.SHIP.START_VX,
    vy: SETTINGS.SHIP.START_VY,
    angle: SETTINGS.SHIP.START_ANGLE,
    speed: SETTINGS.SHIP.START_SPEED,
    maxSpeed: SETTINGS.SHIP.MAX_SPEED,
    friction: SETTINGS.SHIP.FRICTION,
    rotationSpeed: SETTINGS.SHIP.ROTATION_SPEED,
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
    for (let i = 0; i < SETTINGS.WORLD.STAR_COUNT; i++) {
        stars.push({
            x: Math.random() * gameWidth * SETTINGS.WORLD.STARFIELD_SCALE,
            y: Math.random() * gameHeight * SETTINGS.WORLD.STARFIELD_SCALE,
            size: Math.random() * SETTINGS.WORLD.STAR_SIZE_MAX,
            depth: Math.random() * SETTINGS.WORLD.STAR_DEPTH_VARIATION + SETTINGS.WORLD.STAR_DEPTH_BASE
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
    const orbitRange = SETTINGS.ORBIT.AUTO_ORBIT_RANGE; // Distance to trigger auto-orbit (planet.radius + X)

    if (!SPACESHIP.docking && nearest && nearest.distance < nearest.planet.radius + orbitRange && !isAnyKeyPressed()) {
        // Enter auto-orbit
        SPACESHIP.docking = true;
        SPACESHIP.dockedPlanet = nearest.planet;
    }

    if (SPACESHIP.docking && SPACESHIP.dockedPlanet) {
        // Orbital mechanics
        const planet = SPACESHIP.dockedPlanet;
        const orbitRadius = planet.radius + SETTINGS.ORBIT.ORBIT_RADIUS_OFFSET;
        const currentAngle = Math.atan2(SPACESHIP.y - planet.y, SPACESHIP.x - planet.x);
        const newAngle = currentAngle + SETTINGS.ORBIT.SPEED;

        SPACESHIP.x = planet.x + Math.cos(newAngle) * orbitRadius;
        SPACESHIP.y = planet.y + Math.sin(newAngle) * orbitRadius;
        SPACESHIP.angle = newAngle + SETTINGS.RENDER.HALF_CIRCLE;
        SPACESHIP.speed = SETTINGS.ORBIT.DOCKED_SPEED;
    } else {
        // Normal flight
        if (keys['W'] || keys['ARROWUP']) {
            SPACESHIP.vx += Math.cos(SPACESHIP.angle) * SETTINGS.SHIP.FORWARD_THRUST;
            SPACESHIP.vy += Math.sin(SPACESHIP.angle) * SETTINGS.SHIP.FORWARD_THRUST;
        }
        if (keys['S'] || keys['ARROWDOWN']) {
            SPACESHIP.vx -= Math.cos(SPACESHIP.angle) * SETTINGS.SHIP.REVERSE_THRUST;
            SPACESHIP.vy -= Math.sin(SPACESHIP.angle) * SETTINGS.SHIP.REVERSE_THRUST;
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
    if (SPACESHIP.x < -SETTINGS.WORLD.WRAP_MARGIN) {
        SPACESHIP.x = gameWidth + SETTINGS.WORLD.WRAP_MARGIN;
    }
    if (SPACESHIP.x > gameWidth + SETTINGS.WORLD.WRAP_MARGIN) {
        SPACESHIP.x = -SETTINGS.WORLD.WRAP_MARGIN;
    }
    if (SPACESHIP.y < -SETTINGS.WORLD.WRAP_MARGIN) {
        SPACESHIP.y = gameHeight + SETTINGS.WORLD.WRAP_MARGIN;
    }
    if (SPACESHIP.y > gameHeight + SETTINGS.WORLD.WRAP_MARGIN) {
        SPACESHIP.y = -SETTINGS.WORLD.WRAP_MARGIN;
    }

    targetPlanet = findNearestPlanet();
}

// ============================================
// RENDERING
// ============================================
function drawStarfield() {
    ctx.fillStyle = SETTINGS.RENDER.STARFIELD_BACKGROUND;
    ctx.fillRect(SETTINGS.RENDER.ORIGIN_X, SETTINGS.RENDER.ORIGIN_Y, gameWidth, gameHeight);

    for (let star of stars) {
        // Parallax effect
        const offsetX = (SPACESHIP.x * SETTINGS.WORLD.STAR_PARALLAX_SCALE) % gameWidth;
        const offsetY = (SPACESHIP.y * SETTINGS.WORLD.STAR_PARALLAX_SCALE) % gameHeight;

        ctx.fillStyle = `rgba(255, 255, 255, ${SETTINGS.WORLD.STAR_OPACITY * star.depth})`;
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
        const glowSize = planet.radius + SETTINGS.RENDER.PLANET_GLOW_PADDING;
        const gradient = ctx.createRadialGradient(planet.x, planet.y, planet.radius, planet.x, planet.y, glowSize);
        gradient.addColorStop(SETTINGS.RENDER.GRADIENT_STOP_START, planet.color);
        gradient.addColorStop(SETTINGS.RENDER.GRADIENT_STOP_MIDDLE, planet.color + '80');
        gradient.addColorStop(SETTINGS.RENDER.GRADIENT_STOP_END, planet.color + '00');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(planet.x, planet.y, glowSize, SETTINGS.RENDER.ORIGIN_X, SETTINGS.RENDER.FULL_CIRCLE);
        ctx.fill();

        // Planet body
        ctx.fillStyle = planet.color;
        ctx.beginPath();
        ctx.arc(planet.x, planet.y, planet.radius, SETTINGS.RENDER.ORIGIN_X, SETTINGS.RENDER.FULL_CIRCLE);
        ctx.fill();

        // Planet border
        ctx.strokeStyle = planet.color + 'ff';
        ctx.lineWidth = SETTINGS.RENDER.PLANET_BORDER_WIDTH;
        ctx.stroke();

        // Planet name
        ctx.fillStyle = planet.color;
        ctx.font = `bold ${SETTINGS.RENDER.PLANET_LABEL_FONT_SIZE}px "Courier New"`;
        ctx.textAlign = 'center';
        ctx.fillText(planet.name, planet.x, planet.y + planet.radius + SETTINGS.RENDER.PLANET_LABEL_OFFSET);
    }
}

function drawSpaceship() {
    ctx.save();
    ctx.translate(SPACESHIP.x, SPACESHIP.y);
    ctx.rotate(SPACESHIP.angle);

    // Ship body
    ctx.fillStyle = '#00ff88';
    ctx.beginPath();
    ctx.moveTo(SETTINGS.SHIP.SHIP_NOSE_X, SETTINGS.RENDER.ORIGIN_Y);
    ctx.lineTo(SETTINGS.SHIP.SHIP_REAR_X, SETTINGS.SHIP.SHIP_TOP_Y);
    ctx.lineTo(SETTINGS.SHIP.SHIP_MID_X, SETTINGS.RENDER.ORIGIN_Y);
    ctx.lineTo(SETTINGS.SHIP.SHIP_REAR_X, SETTINGS.SHIP.SHIP_BOTTOM_Y);
    ctx.closePath();
    ctx.fill();

    // Thruster glow
    if (SPACESHIP.speed > SETTINGS.SHIP.THRUSTER_VISIBLE_SPEED) {
        ctx.fillStyle = '#ff006e';
        ctx.beginPath();
        ctx.moveTo(SETTINGS.SHIP.THRUSTER_BASE_X, SETTINGS.SHIP.THRUSTER_BASE_Y);
        ctx.lineTo(SETTINGS.SHIP.THRUSTER_BASE_X, -SETTINGS.SHIP.THRUSTER_BASE_Y);
        ctx.lineTo(SETTINGS.SHIP.THRUSTER_TIP_X - SPACESHIP.speed * SETTINGS.SHIP.THRUSTER_SPEED_MULTIPLIER, SETTINGS.RENDER.ORIGIN_Y);
        ctx.closePath();
        ctx.fill();

        // Flame flicker
        ctx.fillStyle = '#ffbe0b';
        ctx.beginPath();
        ctx.moveTo(SETTINGS.SHIP.FLAME_BASE_X, SETTINGS.SHIP.FLAME_BASE_Y);
        ctx.lineTo(SETTINGS.SHIP.FLAME_BASE_X, -SETTINGS.SHIP.FLAME_BASE_Y);
        ctx.lineTo(SETTINGS.SHIP.FLAME_TIP_X - Math.random() * SPACESHIP.speed * SETTINGS.SHIP.FLAME_SPEED_MULTIPLIER, SETTINGS.RENDER.ORIGIN_Y);
        ctx.closePath();
        ctx.fill();
    }

    ctx.restore();
}

function drawDistanceLines() {
    if (targetPlanet) {
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.2)';
        ctx.setLineDash([SETTINGS.RENDER.DISTANCE_DASH_LENGTH, SETTINGS.RENDER.DISTANCE_DASH_GAP]);
        ctx.lineWidth = SETTINGS.RENDER.DISTANCE_LINE_WIDTH;
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
    document.getElementById('velDisplay').textContent = (SPACESHIP.speed * SETTINGS.UI.SPEED_DISPLAY_MULTIPLIER).toFixed(0) + '%';
    document.getElementById('targetCount').textContent = PROJECTS.length;

    // Target panel
    if (targetPlanet) {
        const planet = targetPlanet.planet;
        const distance = Math.round(targetPlanet.distance);
        const orbitRange = SETTINGS.ORBIT.AUTO_ORBIT_RANGE;
        const canAutoOrbit = distance < planet.radius + orbitRange;

        document.getElementById('targetInfo').innerHTML = `
            <div class="target-name">◆ ${planet.name}</div>
            <div class="target-distance-block">
                <div class="target-distance">Distance: ${distance}px</div>
                <div class="target-status">
                    ${canAutoOrbit ? '✓ In orbit range' : '✗ Out of range'}
                </div>
                <div class="target-description">
                    ${planet.description}
                </div>
            </div>
        `;

        const targetInfo = document.getElementById('targetInfo');
        const targetName = targetInfo.querySelector('.target-name');
        const targetDistanceBlock = targetInfo.querySelector('.target-distance-block');
        const targetStatus = targetInfo.querySelector('.target-status');
        const targetDescription = targetInfo.querySelector('.target-description');

        targetName.style.color = planet.color;
        targetDistanceBlock.style.marginTop = `${SETTINGS.UI.TARGET_DISTANCE_MARGIN_TOP}px`;
        targetDistanceBlock.style.fontSize = `${SETTINGS.UI.TARGET_FONT_SIZE}px`;
        targetStatus.style.marginTop = `${SETTINGS.UI.TARGET_STATUS_MARGIN_TOP}px`;
        targetStatus.style.color = canAutoOrbit ? '#00ff88' : '#ff0055';
        targetDescription.style.marginTop = `${SETTINGS.UI.TARGET_DESCRIPTION_MARGIN_TOP}px`;
        targetDescription.style.fontSize = `${SETTINGS.UI.TARGET_DESCRIPTION_FONT_SIZE}px`;
        targetDescription.style.color = '#0f0';
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
