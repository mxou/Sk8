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
let states = ["IDLE", "OLLIE", "FLIP", "TREFLIP", "HARDFLIP"];
let state = "IDLE";

let velocityY = 0;
const GRAVITY = -9;
const JUMP_FORCE = 4;
let flipRotation = 0;
const FLIP_SPEED = Math.PI * 2.2; // ≈ 1 kickflip

/* ---------- Clock ---------- */
const clock = new THREE.Clock();

/* ---------- Input ---------- */
window.addEventListener("keydown", (e) => {
  if (state !== "IDLE") return;

  if (e.code === "Space") {
    state = "JUMP";
    velocityY = JUMP_FORCE;
  }

  if (e.code === "KeyE") {
    state = "FLIP";
    velocityY = JUMP_FORCE;
    flipRotation = 0;
  }

  if (e.code === "KeyR") {
    state = "TREFLIP";
    velocityY = JUMP_FORCE;
    flipRotation = 0;
  }

  if (e.code === "KeyF") {
    state = "HARDFLIP";
    velocityY = JUMP_FORCE;
    flipRotation = 0;
  }
});

/* ---------- Animate ---------- */
function animate() {
  const delta = clock.getDelta();

  if (state === "JUMP" || state === "FLIP" || state === "TREFLIP" || state === "HARDFLIP") {
    velocityY += GRAVITY * delta;
    skate.position.y += velocityY * delta;

    // inclination ollie
    // skate.rotation.z = Math.min(skate.rotation.x + delta * 3, 0.4);

    // kickflip
    if (state === "FLIP") {
      flipRotation += FLIP_SPEED * delta;
      skate.rotation.z = flipRotation;
    }

    // treflip
    if (state === "TREFLIP") {
      flipRotation += FLIP_SPEED * delta;
      skate.rotation.z = flipRotation;
      skate.rotation.y = -flipRotation;
    }

    // hardflip
    if (state === "HARDFLIP") {
      flipRotation += FLIP_SPEED * delta;
      skate.rotation.z = flipRotation;
      skate.rotation.y = flipRotation / 2;
    }

    // atterrissage
    if (skate.position.y <= 0.1) {
      skate.position.y = 0.1;
      skate.rotation.set(0, 0, 0);
      velocityY = 0;
      flipRotation = 0;
      state = "IDLE";
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
