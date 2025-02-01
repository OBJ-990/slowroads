import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js';
import * as CANNON from 'https://cdnjs.cloudflare.com/ajax/libs/cannon-es/0.20.0/cannon-es.min.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const light = new THREE.DirectionalLight(0xffffff, 1.5);
light.position.set(5, 10, 5);
light.castShadow = true;
scene.add(light);

scene.fog = new THREE.Fog(0x87CEEB, 10, 200);

const world = new CANNON.World();
world.gravity.set(0, -9.8, 0);

const roadMaterial = new THREE.ShaderMaterial({
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        varying vec2 vUv;
        void main() {
            gl_FragColor = vec4(mix(vec3(0.1, 0.1, 0.1), vec3(0.3, 0.3, 0.3), vUv.y), 1.0);
        }
    `
});
const roadPieces = [];
const roadWidth = 10;
let roadZ = 0;

function generateRoadPiece() {
    const roadGeometry = new THREE.PlaneGeometry(roadWidth, 20);
    roadGeometry.rotateX(-Math.PI / 2);
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.position.z = roadZ;
    road.receiveShadow = true;
    scene.add(road);
    roadPieces.push(road);
    roadZ -= 20;
}

for (let i = 0; i < 20; i++) generateRoadPiece();

const carGeometry = new THREE.BoxGeometry(1.2, 0.6, 2.5);
const carMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const car = new THREE.Mesh(carGeometry, carMaterial);
car.castShadow = true;
scene.add(car);

const carBody = new CANNON.Body({ mass: 1, shape: new CANNON.Box(new CANNON.Vec3(0.6, 0.3, 1.25)) });
carBody.position.set(0, 0.6, 0);
world.addBody(carBody);

camera.position.set(0, 2, 5);
camera.lookAt(car.position);

let speed = 0;
let maxSpeed = 2.5;
let direction = 0;

function animate() {
    requestAnimationFrame(animate);
    world.step(1 / 60);

    roadPieces.forEach(piece => {
        piece.position.z += speed;
        if (piece.position.z > 10) {
            piece.position.z = roadZ;
            roadZ -= 20;
        }
    });

    car.position.copy(carBody.position);
    car.quaternion.copy(carBody.quaternion);
    carBody.velocity.z = -speed;
    carBody.velocity.x = direction * speed * 0.8;
    car.rotation.y = direction * 0.2;
    renderer.render(scene, camera);
}
animate();

window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" && speed < maxSpeed) speed += 0.2;
    if (e.key === "ArrowDown" && speed > 0) speed -= 0.1;
    if (e.key === "ArrowLeft") direction = -1;
    if (e.key === "ArrowRight") direction = 1;
});

window.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") direction = 0;
});

window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
