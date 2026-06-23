import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {SETTINGS} from './settings.js';

const CAMERA_HEIGHT = 50;
const CAMERA_FRUSTUM = 40;

let scene, camera, renderer, shipModel;
let shipCanvas;

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

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const shipColor = new THREE.Color(SETTINGS.SHIP.MODEL_COLOR);

    const directionalLight = new THREE.DirectionalLight(shipColor, 1.2);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);

    const rimLight = new THREE.DirectionalLight(0x00ffff, 0.4);
    rimLight.position.set(-5, 5, -5);
    scene.add(rimLight);

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
                    child.material.color.set(SETTINGS.SHIP.MODEL_COLOR);
                }
            });

            scene.add(shipModel);
        },
        undefined,
        (error) => {
            console.warn('Could not load spaceship.glb:', error.message);
        }
    );

    window.addEventListener('resize', onResize);
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
    if (shipModel) {
        shipModel.traverse((child) => {
            if (child.isMesh) {
                child.material.color.set(hexColor);
            }
        });
    }
    // Update directional light to match
    scene.children.forEach((child) => {
        if (child.isDirectionalLight && child.position.x === 5) {
            child.color.set(hexColor);
        }
    });
}

export function updateShipRenderer(spaceship, gameWidth, gameHeight) {
    if (!shipModel) return;

    // Convert screen position to Three.js world coordinates
    // Map spaceship screen position to normalized coordinates then to camera frustum
    const aspect = gameWidth / gameHeight;
    const worldX = ((spaceship.x / gameWidth) - 0.5) * CAMERA_FRUSTUM * 2 * aspect;
    const worldZ = ((spaceship.y / gameHeight) - 0.5) * CAMERA_FRUSTUM * 2;

    shipModel.position.x = worldX;
    shipModel.position.z = worldZ;

    // Rotate ship model to match angle (Y-axis rotation, offset because model faces +Z by default)
    shipModel.rotation.y = -spaceship.angle + Math.PI / 2;

    renderer.render(scene, camera);
}

