import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { SimplexNoise } from "three/addons/math/SimplexNoise.js";

const canvas = document.querySelector("#c");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x000000, 20, 300);

const camera = new THREE.PerspectiveCamera(60, 2, 0.1, 1000);
camera.position.set(0, 5, 20);

function resize() {
    const { clientWidth: w, clientHeight: h } = renderer.domElement;
    if (renderer.domElement.width !== w || renderer.domElement.height !== h) {
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }
}
window.addEventListener("resize", resize);

const cubeLoader = new THREE.CubeTextureLoader();
const skybox = cubeLoader.load([
    "./public/sky_px.png",
    "./public/sky_nx.png",
    "./public/sky_py.png",
    "./public/sky_ny.png",
    "./public/sky_pz.png",
    "./public/sky_nz.png",
]);
skybox.colorSpace = THREE.SRGBColorSpace;
scene.background = skybox;

scene.add(new THREE.AmbientLight(0x00aaff, 0.5));

const dirLight = new THREE.DirectionalLight(0xff0000, 0.5);
dirLight.position.set(-50, 80, 30);
dirLight.castShadow = true;
scene.add(dirLight);

const pointLight = new THREE.PointLight(0xffeeaa, 1, 100, 2);
pointLight.position.set(0, 10, 0);
pointLight.castShadow = true;
scene.add(pointLight);

const spotLight = new THREE.SpotLight(
    0xffffff,
    0.6,
    100,
    Math.PI / 8,
    0.3,
    1.0
);
spotLight.castShadow = true;
camera.add(spotLight);
spotLight.target = camera;
scene.add(camera);

const groundTex = new THREE.TextureLoader().load(
    "./public/planet_diffuse.png",
    (t) => (t.colorSpace = THREE.SRGBColorSpace)
);
groundTex.wrapS = groundTex.wrapT = THREE.RepeatWrapping;
groundTex.repeat.set(80, 80);

const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(4000, 4000),
    new THREE.MeshStandardMaterial({ map: groundTex, roughness: 1 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const controls = new PointerLockControls(camera, canvas);
scene.add(controls.object);
controls.object.position.set(0, 5, 20);

canvas.addEventListener("click", () => controls.lock());

const move = { f: 0, b: 0, l: 0, r: 0 };
window.addEventListener("keydown", (e) => {
    if (e.code === "KeyW") move.f = 1;
    else if (e.code === "KeyS") move.b = 1;
    else if (e.code === "KeyA") move.l = 1;
    else if (e.code === "KeyD") move.r = 1;
});
window.addEventListener("keyup", (e) => {
    if (e.code === "KeyW") move.f = 0;
    else if (e.code === "KeyS") move.b = 0;
    else if (e.code === "KeyA") move.l = 0;
    else if (e.code === "KeyD") move.r = 0;
});

const primaryMeshes = [];
const boxGeo = new THREE.BoxGeometry(2, 2, 2);
const sphereGeo = new THREE.SphereGeometry(1.2, 32, 16);
const cylGeo = new THREE.CylinderGeometry(1, 1, 3, 24);
const texturedBoxMat = new THREE.MeshStandardMaterial({
    map: new THREE.TextureLoader().load("./public/brick_diffuse.png"),
});
texturedBoxMat.map.colorSpace = THREE.SRGBColorSpace;

for (let i = 0; i < 20; i++) {
    let geo, mat;

    if (i === 0) {
        geo = boxGeo;
        mat = texturedBoxMat;
    } else {
        const type = i % 3;
        if (type === 0) {
            geo = boxGeo;
            mat = new THREE.MeshStandardMaterial({
                color: new THREE.Color().setHSL(Math.random() + 0.5, 0.8, 0.9),
            });
        } else if (type === 1) {
            geo = sphereGeo;
            mat = new THREE.MeshStandardMaterial({
                color: new THREE.Color().setHSL(Math.random() + 0.5, 0.8, 0.9),
            });
        } else {
            geo = cylGeo;
            mat = new THREE.MeshStandardMaterial({
                color: new THREE.Color().setHSL(Math.random() + 0.5, 0.8, 0.9),
            });
        }
    }

    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;

    mesh.position.set(
        (Math.random() - 0.5) * 100,
        1 + Math.random() * 2,
        (Math.random() - 0.5) * 100
    );

    mesh.userData.velocity = new THREE.Vector3(0, 0, 0);
    scene.add(mesh);
    primaryMeshes.push(mesh);
}

function animatePrimaries(dt) {
    primaryMeshes.forEach((m, idx) => {
        if (idx % 3 === 0) {
            m.rotation.x += dt * 0.3;
            m.rotation.y += dt * 0.2;
        } else if (idx % 3 === 1) {
            m.rotation.y += dt * 0.4;
        } else {
            m.rotation.x += dt * 0.2;
            m.rotation.z += dt * 0.3;
        }

        m.position.addScaledVector(m.userData.velocity, dt);
        m.userData.velocity.multiplyScalar(0.92);
    });
}

const ALIEN_POS = new THREE.Vector3(0, 5, 0);
let mixer = null;
new GLTFLoader().load("./public/alien.glb", (gltf) => {
    const alien = gltf.scene;
    alien.scale.setScalar(2);
    alien.position.copy(ALIEN_POS);
    alien.traverse((o) => (o.castShadow = true));
    scene.add(alien);

    mixer = new THREE.AnimationMixer(alien);
    mixer
        .clipAction(
            THREE.AnimationUtils.subclip(gltf.animations[2], "Idle", 0, 221)
        )
        .setDuration(6)
        .play();
});

const simplexA = new SimplexNoise();
const rockTexA = new THREE.TextureLoader().load(
    "./public/asteroid_diffuse.png",
    (t) => (t.colorSpace = THREE.SRGBColorSpace)
);

const ASTEROID_COUNT = 40;
const asteroids = [];

function spawnAsteroid(i) {
    const g = new THREE.IcosahedronGeometry(2, 3);
    const p = g.attributes.position;
    const v = new THREE.Vector3();
    for (let k = 0; k < p.count; ++k) {
        v.fromBufferAttribute(p, k);
        const n = simplexA.noise3d(v.x * 0.6, v.y * 0.6, v.z * 0.6);
        v.multiplyScalar(1 + 0.3 * n);
        p.setXYZ(k, v.x, v.y, v.z);
    }
    g.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
        map: i === 0 ? rockTexA : null,
        color:
            i === 0
                ? 0xffffff
                : new THREE.Color().setHSL(Math.random(), 0.4, 0.55),
        roughness: 1,
        metalness: 0.05,
    });

    const mesh = new THREE.Mesh(g, mat);
    mesh.castShadow = true;

    const radius = THREE.MathUtils.randFloat(35, 140);
    const angle = Math.random() * Math.PI * 2;
    const speed = THREE.MathUtils.randFloat(0.25, 0.6);

    mesh.position.set(
        ALIEN_POS.x + radius * Math.cos(angle),
        ALIEN_POS.y + THREE.MathUtils.randFloat(-5, 5),
        ALIEN_POS.z + radius * Math.sin(angle)
    );
    scene.add(mesh);

    asteroids.push({
        mesh,
        radius,
        angle,
        speed,
        axis: new THREE.Vector3(
            Math.random(),
            Math.random(),
            Math.random()
        ).normalize(),
        spin: THREE.MathUtils.randFloat(0.05, 0.25),
        bobAmp: THREE.MathUtils.randFloat(2, 6),
        impulse: 0,
    });
}
for (let i = 0; i < ASTEROID_COUNT; i++) spawnAsteroid(i);

function resetAll() {
    primaryMeshes.forEach((m) => {
        m.rotation.set(0, 0, 0);
        m.position.set(
            (Math.random() - 0.5) * 100,
            1 + Math.random() * 2,
            (Math.random() - 0.5) * 100
        );
        m.userData.velocity.set(0, 0, 0);
    });
    asteroids.forEach((a) => {
        a.angle = Math.random() * Math.PI * 2;
        a.radius = THREE.MathUtils.randFloat(35, 140);
        a.impulse = 0;
    });
}

document.getElementById("reset")?.addEventListener("click", resetAll);

window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
        asteroids.forEach((a) => {
            a.impulse = 200 + Math.random() * 150;
        });

        primaryMeshes.forEach((m) => {
            const dir = m.position
                .clone()
                .sub(camera.position)
                .setY(0)
                .normalize();

            const primImpulse = 200 + Math.random() * 150;
            m.userData.velocity.copy(dir).multiplyScalar(primImpulse);
        });
    }
});

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
    resize();

    const dt = clock.getDelta();
    const t = clock.elapsedTime;

    if (controls.isLocked) {
        const s = 25 * dt;
        if (move.f) controls.moveForward(s);
        if (move.b) controls.moveForward(-s);
        if (move.r) controls.moveRight(s);
        if (move.l) controls.moveRight(-s);
        controls.object.position.y = 2;
    }

    animatePrimaries(dt);

    if (mixer) mixer.update(dt);

    asteroids.forEach((a) => {
        a.angle += a.speed * dt;
        a.radius += a.impulse * dt;
        a.impulse *= 0.92;

        a.mesh.position.set(
            ALIEN_POS.x + a.radius * Math.cos(a.angle),
            ALIEN_POS.y + Math.sin(t * 1.2) * a.bobAmp,
            ALIEN_POS.z + a.radius * Math.sin(a.angle)
        );
        a.mesh.rotateOnAxis(a.axis, a.spin * dt);
    });

    renderer.render(scene, camera);
});
