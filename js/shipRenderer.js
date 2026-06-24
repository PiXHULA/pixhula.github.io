import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {SETTINGS} from './settings.js';

const CAMERA_HEIGHT = 50;
const CAMERA_FRUSTUM = 40;

// Thruster nozzle positions in ship-local space (world units, MODEL_SIZE scale).
// X = left/right, Y = up/down, Z = forward(+)/rear(-). Tune Z to match your model.
const THRUSTER_OFFSETS = [
    new THREE.Vector3(0.60, 0, -1.5), new THREE.Vector3(-0.60, 0, -1.5)
];

let scene, camera, renderer, shipModel;
let shipCanvas;
let flameEmitters = [];
let shipModelY = 0; // Y world offset from model centering — kept in sync on load

const _up      = new THREE.Vector3(0, 1, 0);
const _rearDir = new THREE.Vector3();

// ============================================
// FLAME SYSTEM
// ============================================

/**
 * Creates one flame emitter and adds it directly to the scene
 * (NOT as a child of shipModel) to avoid inheriting the model's scale.
 */
function createFlameEmitter() {
    const group = new THREE.Group();

    // Outer flame — wide orange shell, additive so it glows
    const outerGeo = new THREE.ConeGeometry(0.30, 3.0, 10, 1, true);
    const outerMat = new THREE.MeshBasicMaterial({
        color: 0xff4400,
        transparent: true,
        opacity: 0.0,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const outerCone = new THREE.Mesh(outerGeo, outerMat);
    // Flip cone so tip faces -Y (toward nozzle) and base extends in +Y (flame direction)
    outerCone.rotation.x = Math.PI;
    outerCone.position.y = 2.5; // shift so flipped tip sits at group origin

    // Inner core — narrow, bright yellow-white
    const innerGeo = new THREE.ConeGeometry(0.10, 2.0, 8, 1, true);
    const innerMat = new THREE.MeshBasicMaterial({
        color: 0xffee88,
        transparent: true,
        opacity: 0.0,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const innerCone = new THREE.Mesh(innerGeo, innerMat);
    innerCone.rotation.x = Math.PI;
    innerCone.position.y = 2.0;

    // Point light — orange engine glow
    const light = new THREE.PointLight(0xff6600, 0, 15);

    group.add(outerCone, innerCone, light);
    scene.add(group); // attach to scene, NOT shipModel

    return { group, outerMat, innerMat, light };
}

function createFlames() {
    flameEmitters = [];
    for (let i = 0; i < THRUSTER_OFFSETS.length; i++) {
        flameEmitters.push(createFlameEmitter());
    }
}

/**
 * Called every frame. Computes world position of each nozzle from the ship's
 * world position + rotation, then scales/fades flames by current speed.
 */
function updateFlames(speed, maxSpeed, worldX, worldZ, shipRotY) {
    const t = Math.min(speed / maxSpeed, 1.0);
    const flicker = 0.85 + Math.random() * 0.1;

    const cosR = Math.cos(shipRotY);
    const sinR = Math.sin(shipRotY);

    // Ship rear direction in world space (ship faces +Z by default, rotated by shipRotY)
    _rearDir.set(-sinR, 0, -cosR);

    THRUSTER_OFFSETS.forEach((offset, i) => {
        const emitter = flameEmitters[i];

        // Rotate offset from ship-local to world (Y-axis rotation matrix)
        const wx = worldX + offset.x * cosR + offset.z * sinR;
        const wy = shipModelY + offset.y;
        const wz = worldZ - offset.x * sinR + offset.z * cosR;

        emitter.group.position.set(wx, wy, wz);
        // Point the group's +Y axis toward the ship's rear so cones shoot backward
        emitter.group.quaternion.setFromUnitVectors(_up, _rearDir);

        if (t > 0.01) {
            const scaleLen = (0.4 + t * 1.0) * flicker;
            emitter.group.scale.set(1.0, scaleLen, 1.0);
            emitter.outerMat.opacity = (0.5 + t * 0.4) * flicker;
            emitter.innerMat.opacity = (0.7 + t * 0.25) * flicker;
            emitter.light.intensity  = (1.5 + t * 3.0) * flicker;
        } else {
            emitter.group.scale.setScalar(0.001);
            emitter.outerMat.opacity = 0;
            emitter.innerMat.opacity = 0;
            emitter.light.intensity  = 0;
        }
    });
}

export function initShipRenderer() {
    shipCanvas = document.getElementById('shipCanvas');

    scene = new THREE.Scene();

    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.OrthographicCamera(
        -CAMERA_FRUSTUM * aspect, CAMERA_FRUSTUM * aspect,
        CAMERA_FRUSTUM, -CAMERA_FRUSTUM,
        0.1, 200
    );
    camera.position.set(0, CAMERA_HEIGHT, 0);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({
        canvas: shipCanvas,
        alpha: true,
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lighting
    // Low ambient so shadows stay dark and contrast is high
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.08);
    scene.add(ambientLight);

    // Primary key light — bright white from top-front-right, casts shadows
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(8, 14, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 200;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    // Sun reflection rim light — warm golden from bottom-back, simulates sun bounce
    const sunRimLight = new THREE.DirectionalLight(0xffb347, 1.4);
    sunRimLight.position.set(-6, -4, -8);
    scene.add(sunRimLight);

    // Subtle cool fill to separate the ship from pure black on shadow side
    const fillLight = new THREE.DirectionalLight(0x8ab4ff, 0.25);
    fillLight.position.set(-8, 4, 4);
    scene.add(fillLight);

    // Load the spaceship model
    const loader = new GLTFLoader();
    loader.load(
        'assets/spaceship.glb',
        (gltf) => {
            shipModel = gltf.scene;
            // Center and scale the model
            const box = new THREE.Box3().setFromObject(shipModel);
            const center = box.getCenter(new THREE.Vector3());
            shipModel.position.sub(center);

            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = SETTINGS.SHIP.MODEL_SIZE / maxDim;
            shipModel.scale.setScalar(scale);

            // Apply ship color to all meshes
            shipModel.traverse((child) => {
                if (child.isMesh) {
                    child.material = child.material.clone();
                    child.material.userData.isCloned = true;
                    child.material.color.set(SETTINGS.SHIP.MODEL_COLOR);
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            scene.add(shipModel);

            // Store Y centering offset so flames sit at the same height
            shipModelY = shipModel.position.y;

            // Create flame emitters attached to the scene (not the model)
            // so they are not affected by the model's scale.
            createFlames();

            hideLoadingScreen();
        },
        (xhr) => {
            if (xhr.lengthComputable) {
                const percent = Math.round((xhr.loaded / xhr.total) * 100);
                updateLoadingProgress(percent);
            }
        },
        (error) => {
            console.warn('Could not load spaceship.glb:', error.message);
            hideLoadingScreen();
        }
    );

    window.addEventListener('resize', onResize);
}

function updateLoadingProgress(percent) {
    const bar = document.getElementById('loadingBar');
    const text = document.getElementById('loadingPercent');
    if (bar) bar.style.width = percent + '%';
    if (text) text.textContent = percent + '%';
}

function hideLoadingScreen() {
    const screen = document.getElementById('loadingScreen');
    if (!screen) return;
    screen.style.opacity = '0';
    setTimeout(() => { screen.style.display = 'none'; }, 600);
}

function onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;

    camera.left = -CAMERA_FRUSTUM * aspect;
    camera.right = CAMERA_FRUSTUM * aspect;
    camera.top = CAMERA_FRUSTUM;
    camera.bottom = -CAMERA_FRUSTUM;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
}

export function setShipColor(hexColor) {
    SETTINGS.SHIP.MODEL_COLOR = hexColor;
    
    if (!shipModel) {
        console.warn('Ship model not loaded yet');
        return;
    }
    
    shipModel.traverse((child) => {
        if (child.isMesh && child.material) {
            if (!child.material.userData.isCloned) {
                child.material = child.material.clone();
                child.material.userData.isCloned = true;
            }
            child.material.color.set(hexColor);
        }
    });
}

export function updateShipRenderer(spaceship, gameWidth, gameHeight) {
    if (!shipModel) return;

    const aspect = gameWidth / gameHeight;
    const worldX = ((spaceship.x / gameWidth) - 0.5) * CAMERA_FRUSTUM * 2 * aspect;
    const worldZ = ((spaceship.y / gameHeight) - 0.5) * CAMERA_FRUSTUM * 2;
    const shipRotY = -spaceship.angle + Math.PI / 2;

    shipModel.position.x = worldX;
    shipModel.position.z = worldZ;
    shipModel.rotation.y = shipRotY;

    updateFlames(spaceship.speed, spaceship.maxSpeed, worldX, worldZ, shipRotY);

    renderer.render(scene, camera);
}
