export const SETTINGS = {
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

export const PROJECT_LAYOUT = {
    MINE_SWEEPER: { X: 300, Y: 200, RADIUS: 35 },
    BETA: { X: 800, Y: 300, RADIUS: 30 },
    GAMMA: { X: 1200, Y: 400, RADIUS: 32 },
    DELTA: { X: 600, Y: 700, RADIUS: 38 },
    EPSILON: { X: 1100, Y: 800, RADIUS: 28 }
};

export const PROJECTS = [
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

export function createSpaceship(gameWidth, gameHeight) {
    return {
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
}
