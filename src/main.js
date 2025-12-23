import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

/* ---------- Scene ---------- */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

/* ---------- Camera ---------- */
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000); // (FOV, aspect ratio, near, far)
const cameraOffset = new THREE.Vector3(0, 2, 5);

camera.lookAt(0, 0, 0);

/* ---------- Renderer ---------- */
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

/* ---------- Controls ---------- */
const controls = new OrbitControls(camera, renderer.domElement);
// controls.update() must be called after any manual changes to the camera's transform
camera.position.set(0, 2, 5);
controls.update();

/* ---------- Lights ---------- */
const ambient = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambient);

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 5);
dirLight.castShadow = true;
scene.add(dirLight);

/* ---------- Ground ---------- */
const ground = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), new THREE.MeshStandardMaterial({ color: 0x444444 }));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

/* ---------- Skate ---------- */
const skate = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 1), new THREE.MeshStandardMaterial({ color: 0xff4444 }));
skate.position.y = 0.1;
scene.add(skate);

/* ---------- State ---------- */
const STATES = {
  IDLE: "IDLE",
  JUMP: "JUMP",
  FLIP: "FLIP",
  TREFLIP: "TREFLIP",
  HARDFLIP: "HARDFLIP",
};

const AIR_STATES = new Set([STATES.JUMP, STATES.FLIP, STATES.TREFLIP, STATES.HARDFLIP]);

let state = STATES.IDLE;

let velocityY = 0;
const GRAVITY = -9;
const JUMP_FORCE = 4;
let flipRotation = 0;
const FLIP_SPEED = Math.PI * 2.2; // ≈ 1 kickflip

/* ---------- Clock ---------- */
const clock = new THREE.Clock();

/* ---------- Déplacements ---------- */
const moveSpeed = 4; // unités par seconde
const move = {
  forward: false,
  back: false,
  left: false,
  right: false,
};

/* ---------- Input ---------- */
window.addEventListener("keydown", (e) => {
  if (state !== STATES.IDLE) return;

  const trickMap = {
    Space: STATES.JUMP,
    KeyE: STATES.FLIP,
    KeyR: STATES.TREFLIP,
    KeyF: STATES.HARDFLIP,
  };

  const nextState = trickMap[e.code];
  if (!nextState) return;

  state = nextState;
  velocityY = JUMP_FORCE;
  flipRotation = 0;
});

window.addEventListener("keydown", (e) => {
  if (e.repeat) return;

  switch (e.code) {
    case "KeyZ":
      move.forward = true;
      break;
    case "KeyS":
      move.back = true;
      break;
    case "KeyQ":
      move.left = true;
      break;
    case "KeyD":
      move.right = true;
      break;
  }
});

window.addEventListener("keyup", (e) => {
  switch (e.code) {
    case "KeyZ":
      move.forward = false;
      break;
    case "KeyS":
      move.back = false;
      break;
    case "KeyQ":
      move.left = false;
      break;
    case "KeyD":
      move.right = false;
      break;
  }
});

/* ---------- Animate ---------- */
function animate() {
  const delta = clock.getDelta();

  if (AIR_STATES.has(state)) {
    velocityY += GRAVITY * delta;
    skate.position.y += velocityY * delta;

    if (state !== STATES.JUMP) {
      flipRotation += FLIP_SPEED * delta;
    }

    switch (state) {
      case STATES.FLIP:
        skate.rotation.z = flipRotation;
        break;

      case STATES.TREFLIP:
        skate.rotation.z = flipRotation;
        skate.rotation.y = -flipRotation;
        break;

      case STATES.HARDFLIP:
        skate.rotation.z = flipRotation;
        skate.rotation.y = flipRotation / 2;
        break;
    }

    if (skate.position.y <= 0.1) {
      skate.position.y = 0.1;
      skate.rotation.set(0, 0, 0);
      velocityY = 0;
      flipRotation = 0;
      state = STATES.IDLE;
    }
  }

  if (state === STATES.IDLE) {
    const dir = new THREE.Vector3((move.right ? 1 : 0) - (move.left ? 1 : 0), 0, (move.back ? 1 : 0) - (move.forward ? 1 : 0));

    if (dir.lengthSq() > 0) {
      dir.normalize();
      skate.position.addScaledVector(dir, moveSpeed * delta);
    }
  }

  // position cible de la caméra
  const desiredCameraPos = skate.position.clone().add(cameraOffset);

  // déplacement smooth
  camera.position.lerp(desiredCameraPos, 0.8);

  // cible de l'OrbitControls = skate
  controls.target.copy(skate.position);
  controls.update();

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

/* ---------- Resize ---------- */
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
