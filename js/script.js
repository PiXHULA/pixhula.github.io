// ============================================
// CONFIGURATION - Customize your projects here
// ============================================
import { SETTINGS, PROJECTS, createSpaceship } from './settings.js';
import { initShipRenderer, updateShipRenderer, setShipColor } from './shipRenderer.js';

// ============================================
// GAME STATE
// ============================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameWidth = canvas.width = window.innerWidth;
let gameHeight = canvas.height = window.innerHeight;

const SPACESHIP = createSpaceship(gameWidth, gameHeight);
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
    updateShipRenderer(SPACESHIP, gameWidth, gameHeight);
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
        const orbitLink = document.getElementById('orbitingLink');
        orbitLink.href = SPACESHIP.dockedPlanet.link;
        orbitLink.textContent = 'REPOSITORY';
        orbitLink.style.display = 'inline';
    } else {
        orbitIndicator.classList.remove('orbiting');
        document.getElementById('orbitingLink').style.display = 'none';
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
initShipRenderer();
initColorPicker();
gameLoop();

// ============================================
// COLOR PICKER
// ============================================
function initColorPicker() {
    const wheelCanvas = document.getElementById('colorWheel');
    const wheelContext = wheelCanvas.getContext('2d');
    const colorPreview = document.getElementById('colorPreview');
    const colorCursor = document.getElementById('colorCursor');
    const wheelRadius = wheelCanvas.width / 2;
    const wheelCenterX = wheelRadius;
    const wheelCenterY = wheelRadius;

    colorPreview.style.backgroundColor = SETTINGS.SHIP.MODEL_COLOR;
    
    // Initialize cursor to center
    colorCursor.style.left = wheelCenterX + 'px';
    colorCursor.style.top = wheelCenterY + 'px';
    colorCursor.classList.add('active');

    // Draw the color wheel
    for (let angleDegrees = 0; angleDegrees < 360; angleDegrees++) {
        const arcStart = (angleDegrees - 1) * Math.PI / 180;
        const arcEnd = (angleDegrees + 1) * Math.PI / 180;

        for (let distanceFromCenter = 0; distanceFromCenter <= wheelRadius; distanceFromCenter++) {
            const saturation = distanceFromCenter / wheelRadius;
            const hue = angleDegrees;
            const rgbColor = hslToRgb(hue / 360, saturation, 0.5);
            wheelContext.fillStyle = `rgb(${rgbColor[0]}, ${rgbColor[1]}, ${rgbColor[2]})`;
            wheelContext.beginPath();
            wheelContext.arc(wheelCenterX, wheelCenterY, distanceFromCenter, arcStart, arcEnd);
            wheelContext.arc(wheelCenterX, wheelCenterY, distanceFromCenter + 1, arcEnd, arcStart, true);
            wheelContext.closePath();
            wheelContext.fill();
        }
    }
    
    let isDragging = false;
    wheelCanvas.addEventListener('mousedown', (event) => {
        isDragging = true;
        pickColor(event);
    });
    wheelCanvas.addEventListener('mousemove', (event) => {
        if (isDragging) {
            pickColor(event);
        }
    });
    window.addEventListener('mouseup', () => { isDragging = false; });
}
//style="background-color: rgb(235, 197, 18);"
function pickColor(event) {
    const wheelCanvas = document.getElementById('colorWheel');
    const wheelContext = wheelCanvas.getContext('2d');
    const colorPreview = document.getElementById('colorPreview');
    const colorCursor = document.getElementById('colorCursor');
    const canvasBounds = wheelCanvas.getBoundingClientRect();
    const clickX = event.clientX - canvasBounds.left;
    const clickY = event.clientY - canvasBounds.top;
    const wheelRadius = wheelCanvas.width / 2;
    const wheelCenterX = wheelRadius;
    const wheelCenterY = wheelRadius;
    const distanceFromCenterX = clickX - wheelCenterX;
    const distanceFromCenterY = clickY - wheelCenterY;

    if (Math.sqrt(distanceFromCenterX * distanceFromCenterX + distanceFromCenterY * distanceFromCenterY) > wheelRadius) {
        return;
    }

    // Move cursor
    colorCursor.style.left = clickX + 'px';
    colorCursor.style.top = clickY + 'px';
    colorCursor.classList.add('active');

    const pixelData = wheelContext.getImageData(clickX, clickY, 1, 1).data;
    const hexColor = '#' + ((1 << 24) + (pixelData[0] << 16) + (pixelData[1] << 8) + pixelData[2]).toString(16).slice(1);
    colorPreview.style.backgroundColor = hexColor;
    setShipColor(hexColor);
}

function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

