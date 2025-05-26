var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_GlobalRotateMatrix;
    uniform mat4 u_ViewMatrix;
    uniform mat4 u_ProjectionMatrix; 
    attribute vec2 a_UV;
    varying vec2 v_UV;
    attribute vec3 a_Normal;
    varying vec3 v_Normal;
    uniform vec3 u_LightPos;
    varying vec3 v_NormalDir;
    varying vec3 v_LightDir;
    uniform mat3 u_NormalMatrix;
    void main() {
        vec3 worldPos  = (u_ModelMatrix * a_Position).xyz;
        v_NormalDir = normalize(u_NormalMatrix * a_Normal);   // use uniform
        v_LightDir = normalize(u_LightPos - worldPos);
        v_UV = a_UV;
        gl_Position = u_ProjectionMatrix
                    * u_ViewMatrix
                    * u_GlobalRotateMatrix
                    * u_ModelMatrix
                    * a_Position;
    }`;

var FSHADER_SOURCE = `
    precision mediump float;
    uniform vec4 u_FragColor;
    uniform sampler2D u_Sampler0;
    uniform sampler2D u_Sampler1;
    uniform sampler2D u_Sampler2;
    uniform sampler2D u_Sampler3;
    uniform float u_texColorWeight;
    uniform int u_whichTexture;
    uniform bool u_showNormal;
    uniform vec3  u_LightColor;

    uniform bool u_useLighting;

    varying vec2 v_UV;
    varying vec3 v_NormalDir;
    varying vec3 v_LightDir;
    void main() {
        if (u_showNormal) {
            gl_FragColor = vec4(normalize(v_NormalDir)*0.5+0.5, 1.0);
            return;
        }
        vec4 baseColor;
        if      (u_whichTexture == -3){
            vec4 tex = texture2D(u_Sampler0, v_UV);
            baseColor = mix(u_FragColor, tex, u_texColorWeight);
        } else if (u_whichTexture == -2){
             baseColor = u_FragColor;
        } else if (u_whichTexture == -1){
            baseColor = vec4(v_UV, 1.0, 1.0);
        } else if (u_whichTexture == 0){
            baseColor = texture2D(u_Sampler0, v_UV);
        } else if (u_whichTexture == 1){
            baseColor = texture2D(u_Sampler1, v_UV);
        } else if (u_whichTexture == 2){
            baseColor = texture2D(u_Sampler2, v_UV);
        } else if (u_whichTexture == 3){
            baseColor = texture2D(u_Sampler3, v_UV);
        } else {
            baseColor = vec4(0.5, 0.7, 0.2, 1.0);
        }

        if (!u_useLighting) {
            gl_FragColor = baseColor;
            return;
        }

        vec3 N = normalize(v_NormalDir);
        vec3 L = normalize(v_LightDir);
        vec3 V = vec3(0.0,0.0,1.0);
        vec3 R = reflect(-L, N);

        float diff  = max(dot(N, L), 0.0);
        float spec  = pow(max(dot(R, V), 0.0), 32.0);

        vec3 ambient  = 0.15 * baseColor.rgb;
        vec3 diffuse  = diff * baseColor.rgb * u_LightColor;
        vec3 specular = 0.25 * spec * u_LightColor;

        vec3 result = ambient + diffuse + specular;
        gl_FragColor = vec4(result, baseColor.a);

    }
`;

const keyState = {};
let lastFrameTime = performance.now();
let u_whichTexture;
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_GlobalRotateMatrix;
let u_ModelMatrix;
let u_texColorWeight;
let a_UV;
let u_Sampler0;
let u_Sampler1;
let u_Sampler2;
let u_Sampler3;
let a_Normal;
let u_showNormal;
let u_LightPos;
let u_ViewMatrix, u_ProjectionMatrix;
let camera;
let g_worldCubes = [];
let dragging = false,
    lastX = 0,
    lastY = 0;
const MOUSE_SENSITIVITY = 0.2;

let g_lightPos = [6.0, 8.0, 3.0];
let g_lightAngle = 0;
let g_lightSpeed = 0.6;

let g_lightRadius = 10.0;
let g_lightHeight = 8.0;

let g_lightMarker = null;

let u_useLighting;

let u_NormalMatrix, u_LightColor;

let g_autoOrbit = true;
let g_model = null;

const map2D = [
    [
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1,
    ],
    [
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1,
    ],
    [
        1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
        2, 2, 2, 2, 2, 2, 1, 1,
    ],
    [
        1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
        2, 2, 2, 2, 2, 2, 1, 1,
    ],
    [
        1, 1, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
        3, 3, 3, 3, 2, 2, 1, 1,
    ],
    [
        1, 1, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
        3, 3, 3, 3, 2, 2, 1, 1,
    ],
    [
        1, 1, 2, 2, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
        4, 4, 3, 3, 2, 2, 1, 1,
    ],
    [
        1, 1, 2, 2, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
        4, 4, 3, 3, 2, 2, 1, 1,
    ],
    [
        1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
        4, 4, 3, 3, 2, 2, 1, 1,
    ],
    [
        1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
        4, 4, 3, 3, 2, 2, 1, 1,
    ],
    [
        1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 5, 5,
        4, 4, 3, 3, 2, 2, 1, 1,
    ],
    [
        1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 5, 5,
        4, 4, 3, 3, 2, 2, 1, 1,
    ],
    [
        1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 7, 7, 7, 7, 7, 7, 6, 6, 5, 5,
        4, 4, 3, 3, 2, 2, 1, 1,
    ],
    [
        1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 7, 7, 7, 7, 7, 7, 6, 6, 5, 5,
        4, 4, 3, 3, 2, 2, 1, 1,
    ],
    [
        1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 8, 8, 7, 7, 6, 6, 5, 5,
        4, 4, 3, 3, 2, 2, 1, 1,
    ],
    [
        1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 8, 8, 7, 7, 6, 6, 5, 5,
        4, 4, 3, 3, 2, 2, 1, 1,
    ],
    [
        1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 8, 8, 7, 7, 6, 6, 5, 5,
        4, 4, 3, 3, 2, 2, 1, 1,
    ],
    [
        1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 8, 8, 7, 7, 6, 6, 5, 5,
        4, 4, 3, 3, 2, 2, 1, 1,
    ],
    [
        1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 7, 7, 7, 7, 7, 7, 6, 6, 5, 5,
        4, 4, 3, 3, 2, 2, 1, 1,
    ],
    [
        1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 7, 7, 7, 7, 7, 7, 6, 6, 5, 5,
        4, 4, 3, 3, 2, 2, 1, 1,
    ],
    [
        1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 5, 5,
        4, 4, 3, 3, 2, 2, 1, 1,
    ],
    [
        1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 5, 5,
        4, 4, 3, 3, 2, 2, 1, 1,
    ],
    [
        1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
        4, 4, 3, 3, 2, 2, 1, 1,
    ],
    [
        1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
        4, 4, 3, 3, 2, 2, 1, 1,
    ],
    [
        1, 1, 2, 2, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
        4, 4, 3, 3, 2, 2, 1, 1,
    ],
    [
        1, 1, 2, 2, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
        4, 4, 3, 3, 2, 2, 1, 1,
    ],
    [
        1, 1, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
        3, 3, 3, 3, 2, 2, 1, 1,
    ],
    [
        1, 1, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
        3, 3, 3, 3, 2, 2, 1, 1,
    ],
    [
        1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
        2, 2, 2, 2, 2, 2, 1, 1,
    ],
    [
        1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
        2, 2, 2, 2, 2, 2, 1, 1,
    ],
    [
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1,
    ],
    [
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1,
    ],
];

function getPeak() {
    let maxH = -Infinity,
        pi = 0,
        pj = 0;
    for (let i = 0; i < map2D.length; ++i) {
        for (let j = 0; j < map2D[0].length; ++j) {
            if (map2D[i][j] > maxH) {
                maxH = map2D[i][j];
                pi = i;
                pj = j;
            }
        }
    }
    maxH += 2;
    return { i: pi, j: pj, h: maxH };
}

const PEAK = getPeak();

let yellow = [1.0, 0.9, 0.1, 1.0];
let darkYellow = [0.8, 0.7, 0.0, 1.0];
let maneWhite = [1.0, 1.0, 1.0, 1.0];
let purple = [0.4, 0.0, 0.6, 1.0];
let black = [0.0, 0.0, 0.0, 0.8];
let g_animate = false;
let g_globalAngle = 0;
let g_globalAngle2 = 0;
let drag = false;
let g_pokeAnimation = false;
let pokeStartTime = 0;
let xpos = 0;
let ypos = 0;
let showNormal = false;
let g_useLighting = true;

let g_lightColor = [1.0, 1.0, 1.0];

function setupWebGL() {
    canvas = document.getElementById("webgl");
    canvas.tabIndex = 0;
    canvas.style.outline = "none";
    canvas.focus();

    gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
    if (!gl) {
        console.log("Failed to get the rendering context for WebGL");
        return;
    }

    gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log("Failed to intialize shaders.");
        return;
    }

    u_texColorWeight = gl.getUniformLocation(gl.program, "u_texColorWeight");
    if (u_texColorWeight < 0) {
        console.error("Failed to get u_texColorWeight");
        return;
    }

    a_Position = gl.getAttribLocation(gl.program, "a_Position");
    if (a_Position < 0) {
        console.log("Failed to get the storage location of a_Position");
        return;
    }

    u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");
    if (!u_FragColor) {
        console.log("Failed to get the storage location of u_FragColor");
        return;
    }

    u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
    if (!u_ModelMatrix) {
        console.log("Failed to get the storage location of u_ModelMatrix");
        return;
    }

    u_GlobalRotateMatrix = gl.getUniformLocation(
        gl.program,
        "u_GlobalRotateMatrix"
    );
    if (!u_GlobalRotateMatrix) {
        console.log(
            "Failed to get the storage location of u_GlobalRotateMatrix"
        );
        return;
    }

    u_ViewMatrix = gl.getUniformLocation(gl.program, "u_ViewMatrix");
    if (!u_ViewMatrix) {
        console.log("Failed to get the storage location of u_ViewMatrix");
        return;
    }

    u_ProjectionMatrix = gl.getUniformLocation(
        gl.program,
        "u_ProjectionMatrix"
    );
    if (!u_ProjectionMatrix) {
        console.log("Failed to get the storage location of u_ProjectionMatrix");
        return;
    }

    u_whichTexture = gl.getUniformLocation(gl.program, "u_whichTexture");
    if (u_whichTexture < 0) {
        console.error("Failed to get storage location of u_whichTexture");
        return;
    }

    u_Sampler0 = gl.getUniformLocation(gl.program, "u_Sampler0");
    if (!u_Sampler0) {
        console.log("Failed to get the storage location of u_Sampler0");
        return;
    }

    u_Sampler1 = gl.getUniformLocation(gl.program, "u_Sampler1");
    if (!u_Sampler1) {
        console.log("Failed to get the storage location of u_Sampler1");
        return;
    }

    u_Sampler2 = gl.getUniformLocation(gl.program, "u_Sampler2");
    if (!u_Sampler2) {
        console.log("Failed to get the storage location of u_Sampler2");
        return;
    }

    u_Sampler3 = gl.getUniformLocation(gl.program, "u_Sampler3");
    if (!u_Sampler3) {
        console.log("Failed to get the storage location of u_Sampler3");
        return;
    }

    a_UV = gl.getAttribLocation(gl.program, "a_UV");
    if (a_UV < 0) {
        console.log("Failed to get the storage location of a_UV");
        return;
    }
    gl.enableVertexAttribArray(a_UV);

    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);

    a_Normal = gl.getAttribLocation(gl.program, "a_Normal");
    if (a_Normal < 0) {
        console.error("Failed to get a_Normal");
        return;
    }
    gl.enableVertexAttribArray(a_Normal);

    u_showNormal = gl.getUniformLocation(gl.program, "u_showNormal");
    if (!u_showNormal) {
        console.error("Failed to get u_showNormal");
        return;
    }

    u_LightPos = gl.getUniformLocation(gl.program, "u_LightPos");
    if (u_LightPos < 0) {
        console.error("Failed to get u_LightPos");
        return;
    }

    u_NormalMatrix = gl.getUniformLocation(gl.program, "u_NormalMatrix");
    if (!u_NormalMatrix) {
        console.error("u_NormalMatrix not found");
        return;
    }

    u_LightColor = gl.getUniformLocation(gl.program, "u_LightColor");
    if (!u_LightColor) {
        console.error("u_LightColor not found");
        return;
    }

    u_useLighting = gl.getUniformLocation(gl.program, "u_useLighting");
    if (!u_useLighting) {
        console.error("u_useLighting not found");
        return;
    }
}

function addActionsForHtmlUI() {
    const btn = document.getElementById("normBtn");
    btn.onclick = () => {
        showNormal = !showNormal;
        btn.textContent = `Normals: ${showNormal ? "ON" : "OFF"}`;
    };

    const radius = document.getElementById("radiusSlider");
    const height = document.getElementById("heightSlider");
    const speed = document.getElementById("speedSlider");

    radius.oninput = (e) => (g_lightRadius = parseFloat(e.target.value));
    height.oninput = (e) => (g_lightHeight = parseFloat(e.target.value));
    speed.oninput = (e) => (g_lightSpeed = parseFloat(e.target.value));

    const col = document.getElementById("lightColor");
    col.oninput = (e) => {
        const hex = e.target.value;
        g_lightColor = [
            parseInt(hex.substr(1, 2), 16) / 255,
            parseInt(hex.substr(3, 2), 16) / 255,
            parseInt(hex.substr(5, 2), 16) / 255,
        ];
    };

    const lx = document.getElementById("lightX");
    const ly = document.getElementById("lightY");
    const lz = document.getElementById("lightZ");

    /* every oninput updates the global position and the marker cube */
    function syncLight() {
        g_lightPos[0] = parseFloat(lx.value);
        g_lightPos[1] = parseFloat(ly.value);
        g_lightPos[2] = parseFloat(lz.value);

        g_autoOrbit = false;

        if (g_lightMarker) {
            g_lightMarker.matrix
                .setTranslate(g_lightPos[0], g_lightPos[1], g_lightPos[2])
                .scale(0.2, 0.2, 0.2)
                .translate(-0.5, -0.5, -0.5);
        }
    }

    lx.oninput = ly.oninput = lz.oninput = syncLight;

    const lightBtn = document.getElementById("lightBtn");
    lightBtn.onclick = () => {
        g_useLighting = !g_useLighting;
        lightBtn.textContent = `Lighting: ${g_useLighting ? "ON" : "OFF"}`;
    };

    const orbitBtn = document.getElementById("orbitBtn");
    orbitBtn.onclick = () => {
        g_autoOrbit = !g_autoOrbit;
        orbitBtn.textContent = `Orbit: ${g_autoOrbit ? "ON" : "OFF"}`;
    };
}

function initTextures() {
    // var image0 = new Image();
    // if (!image0) {
    //     console.log("Failed to create the image0 object");
    //     return false;
    // }
    // image0.onload = function () {
    //     sendTextureToGLSL(image0, gl.TEXTURE0, 0, u_Sampler0);
    // };
    // image0.src = "./images/sky.jpg";
    const skyImg = new Image();
    skyImg.onload = () => sendTextureToGLSL(skyImg, gl.TEXTURE0, 0, u_Sampler0);
    skyImg.src = "./images/skybox.jpg";

    const dirtImg = new Image();
    dirtImg.onload = () =>
        sendTextureToGLSL(dirtImg, gl.TEXTURE1, 1, u_Sampler1);
    dirtImg.src = "./images/dirt.jpg";

    const grassImg = new Image();
    grassImg.onload = () =>
        sendTextureToGLSL(grassImg, gl.TEXTURE2, 2, u_Sampler2);
    grassImg.src = "./images/grass.jpg";

    const herobrineImg = new Image();
    herobrineImg.onload = () =>
        sendTextureToGLSL(herobrineImg, gl.TEXTURE3, 3, u_Sampler3);
    herobrineImg.src = "./images/herobrine.jpg";

    return true;
}

function sendTextureToGLSL(image, activeTex, texNum, u_sampler) {
    var texture = gl.createTexture();
    if (!texture) {
        console.log("Failed to create the texture object");
        return false;
    }

    // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(activeTex);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    gl.uniform1i(u_sampler, texNum);
}

function initWorld() {
    g_worldCubes = [];

    const ground = new Cube();
    ground.matrix
        .setTranslate(0, -0.1, 0)
        .scale(100, 0.02, 100)
        .translate(-0.5, 0, -0.5);
    ground.color = [0.2, 0.7, 0.2, 1];
    ground.textureNum = 2;
    g_worldCubes.push(ground);

    const skybox = new Cube();
    skybox.isSkybox = true;
    skybox.matrix
        .setTranslate(0, 0, 0)
        .scale(200, 200, 200)
        .translate(-0.5, -0.5, -0.5);
    skybox.color = [0.2, 0.7, 0.2, 1];
    skybox.textureNum = 0;
    g_worldCubes.push(skybox);

    g_model = new Model(gl, "./dragon.obj");

    const sizeX = map2D.length,
        sizeZ = map2D[0].length;
    for (let i = 0; i < sizeX; i++) {
        for (let j = 0; j < sizeZ; j++) {
            const h = map2D[i][j];
            for (let y = 0; y < h; y++) {
                const block = new Cube();
                block.color = [0.8, 0.6, 0.2, 1];
                block.textureNum =
                    i === PEAK.i && j === PEAK.j && y === h - 1
                        ? 3
                        : h < 3
                        ? 1
                        : h > 7
                        ? -2
                        : 2;

                block.matrix
                    .setTranslate(i, y, j)
                    .scale(1, 1, 1)
                    .translate(-0.5, 0, -0.5);

                g_worldCubes.push(block);
            }
        }
    }

    g_lightMarker = new Cube();
    g_lightMarker.color = [1, 1, 1, 1];
    g_lightMarker.textureNum = -2;
    g_worldCubes.push(g_lightMarker);
}

function updateWorld() {
    g_worldCubes.length = 0;

    const ground = new Cube();
    ground.matrix
        .setTranslate(0, -0.1, 0)
        .scale(100, 0.02, 100)
        .translate(-0.5, 0, -0.5);
    ground.color = [0.2, 0.7, 0.2, 1];
    ground.textureNum = 2;
    g_worldCubes.push(ground);

    const skybox = new Cube();
    skybox.isSkybox = true;
    skybox.matrix
        .setTranslate(0, 0, 0)
        .scale(200, 200, 200)
        .translate(-0.5, -0.5, -0.5);
    skybox.textureNum = 0;
    g_worldCubes.push(skybox);

    const sizeX = map2D.length,
        sizeZ = map2D[0].length;
    for (let i = 0; i < sizeX; i++) {
        for (let j = 0; j < sizeZ; j++) {
            const h = map2D[i][j];
            for (let y = 0; y < h; y++) {
                const block = new Cube();
                block.color = [0.8, 0.6, 0.2, 1];
                block.textureNum =
                    i === PEAK.i && j === PEAK.j && y === h - 1
                        ? 3
                        : h < 3
                        ? 1
                        : h > 7
                        ? -2
                        : 2;

                block.matrix
                    .setTranslate(i, y, j)
                    .scale(1, 1, 1)
                    .translate(-0.5, 0, -0.5);

                g_worldCubes.push(block);
            }
        }
    }
    if (g_lightMarker) g_worldCubes.push(g_lightMarker);
}

function getFrontCell() {
    const reach = 1.0;
    const f = camera._forward();
    const px = camera.eye.elements[0];
    const pz = camera.eye.elements[2];

    const tx = px + f.elements[0] * reach;
    const tz = pz + f.elements[2] * reach;

    return {
        i: Math.floor(tx + 0.5),
        j: Math.floor(tz + 0.5),
    };
}

const g_glsl = {
    get a_Position() {
        return a_Position;
    },
    get a_Normal() {
        return a_Normal;
    },
    get u_ModelMatrix() {
        return u_ModelMatrix;
    },
    get u_NormalMatrix() {
        return u_NormalMatrix;
    },
    get u_FragColor() {
        return u_FragColor;
    },
};

function main() {
    setupWebGL();

    connectVariablesToGLSL();

    camera = new Camera(canvas);

    canvas.onmousedown = (e) => {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
    };
    window.onmouseup = () => (dragging = false);
    canvas.onmousemove = (e) => {
        if (!dragging) return;
        const dx = e.clientX - lastX;
        const dy = lastY - e.clientY;
        lastX = e.clientX;
        lastY = e.clientY;

        camera.rotate(dx, dy);
    };

    canvas.addEventListener("keydown", (e) => {
        keyState[e.code] = true;

        const { i, j } = getFrontCell();

        if (i < 0 || i >= map2D.length || j < 0 || j >= map2D[0].length) return;
        console.log(e.code);
        if (e.code === "KeyZ") {
            map2D[i][j] = map2D[i][j] + 1;
            updateWorld();
        }
        if (e.code === "KeyX") {
            map2D[i][j] = Math.max(0, map2D[i][j] - 1);
            updateWorld();
        }
    });
    canvas.addEventListener("keyup", (e) => {
        keyState[e.code] = false;
    });

    addActionsForHtmlUI();

    initTextures();

    // canvas.onmousedown = click;
    // canvas.onmousemove = function (ev) {
    //     if (ev.buttons == 1) {
    //         click(ev);
    //     }
    // };

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    gl.clear(gl.COLOR_BUFFER_BIT);

    // renderAllShapes();
    initWorld();
    requestAnimationFrame(tick);
}

var g_shapesList = [];

function sendTextToHTML(text, htmlID) {
    var htmlElem = document.getElementById(htmlID);
    if (!htmlElem) {
        console.log("Failed to get " + htmlElem + " from HTML");
        return;
    }
    htmlElem.innerHTML = text;
}

var g_startTime = performance.now() / 1000;
var g_seconds = performance.now() / 1000 - g_startTime;

function tick() {
    const now = performance.now();
    const dt = (now - lastFrameTime) / 1000;
    lastFrameTime = now;

    if (g_autoOrbit) updateLightPosition(dt);

    if (keyState["KeyW"]) camera.moveForward(dt);
    if (keyState["KeyS"]) camera.moveBackward(dt);
    if (keyState["KeyA"]) camera.moveLeft(dt);
    if (keyState["KeyD"]) camera.moveRight(dt);
    if (keyState["KeyQ"]) camera.panLeft(dt);
    if (keyState["KeyE"]) camera.panRight(dt);

    g_seconds = performance.now() / 1000 - g_startTime;
    renderAllShapes();
    requestAnimationFrame(tick);
}

function createDummyNormalBuffer(numVerts) {
    const normals = new Float32Array(numVerts * 3);
    for (let i = 0; i < numVerts; i++) {
        normals.set([1.0, 1.0, 0.0], i * 3);
    }
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
    return buf;
}

function addLightMarker() {
    const marker = new Cube();
    marker.color = [1.0, 1.0, 1.0, 1.0];
    marker.textureNum = -2;
    marker.matrix
        .setTranslate(g_lightPos[0], g_lightPos[1], g_lightPos[2])
        .scale(0.2, 0.2, 0.2)
        .translate(-0.5, -0.5, -0.5);
    g_worldCubes.push(marker);
}

function updateLightPosition(dt) {
    g_lightAngle += g_lightSpeed * dt;

    g_lightPos[0] = g_lightRadius * Math.cos(g_lightAngle);
    g_lightPos[2] = g_lightRadius * Math.sin(g_lightAngle);
    g_lightPos[1] = g_lightHeight;

    if (g_lightMarker) {
        g_lightMarker.matrix
            .setTranslate(g_lightPos[0], g_lightPos[1], g_lightPos[2])
            .scale(0.2, 0.2, 0.2)
            .translate(-0.5, -0.5, -0.5);
    }
}

function normalMatrixFrom(modelMat4) {
    const invT = new Matrix4(modelMat4);
    invT.invert();
    invT.transpose();

    return new Float32Array([
        invT.elements[0],
        invT.elements[1],
        invT.elements[2],
        invT.elements[4],
        invT.elements[5],
        invT.elements[6],
        invT.elements[8],
        invT.elements[9],
        invT.elements[10],
    ]);
}

function renderAllShapes() {
    var startTime = performance.now();

    gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projMatrix.elements);

    var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
    globalRotMat.rotate(g_globalAngle2, 1, 0, 0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

    gl.uniform3f(u_LightPos, g_lightPos[0], g_lightPos[1], g_lightPos[2]);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniform1i(u_showNormal, showNormal ? 1 : 0);
    gl.uniform1i(u_useLighting, g_useLighting ? 1 : 0);

    gl.uniform3f(u_LightPos, g_lightPos[0], g_lightPos[1], g_lightPos[2]);
    gl.uniform3f(
        u_LightColor,
        g_lightColor[0],
        g_lightColor[1],
        g_lightColor[2]
    );

    const ball = new Sphere(32, 24);
    ball.matrix.setTranslate(0, 3, 0).scale(1.5, 1.5, 1.5);
    ball.textureNum = -2;
    g_worldCubes.push(ball);

    for (const c of g_worldCubes) {
        if (c.isSkybox) {
            gl.depthMask(false);
            gl.uniform4fv(u_FragColor, c.color);
            gl.uniform1f(u_texColorWeight, 1.0);
            gl.uniform1i(u_whichTexture, c.textureNum);
            gl.uniformMatrix4fv(u_ModelMatrix, false, c.matrix.elements);
            const nm = normalMatrixFrom(c.matrix);
            gl.uniformMatrix3fv(u_NormalMatrix, false, nm);
            c.render();
        } else {
            gl.depthMask(true);
            gl.uniform4fv(u_FragColor, c.color);
            gl.uniform1f(u_texColorWeight, 1.0);
            gl.uniform1i(
                u_whichTexture,
                c.textureNum !== undefined ? c.textureNum : -2
            );
            gl.uniformMatrix4fv(u_ModelMatrix, false, c.matrix.elements);
            const nm = normalMatrixFrom(c.matrix);
            gl.uniformMatrix3fv(u_NormalMatrix, false, nm);
            c.render();
        }
    }

    if (g_model) {
        g_model.matrix.setTranslate(5, 1, -4).scale(0.5, 0.5, 0.5);
        // .rotate(performance.now() * 0.02, 0, 1, 0);

        g_model.render(gl, g_glsl);
    }

    //--------------------------------------
    var duration = performance.now() - startTime;
    sendTextToHTML(
        " ms: " +
            Math.floor(duration) +
            " fps: " +
            Math.floor(10000 / duration) / 10,
        "numdot"
    );
}

function drawCube(matrix, color) {
    var cube = new Cube();
    cube.matrix = matrix;
    cube.color = color;
    cube.render();
}

function drawMyTrianglePicture() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    let triVerts = [];

    function addTriangle(x1, y1, x2, y2, x3, y3) {
        let p1 = gridConvert(x1, y1);
        let p2 = gridConvert(x2, y2);
        let p3 = gridConvert(x3, y3);
        triVerts.push(p1[0], p1[1]);
        triVerts.push(p2[0], p2[1]);
        triVerts.push(p3[0], p3[1]);
    }

    addTriangle(5, 0, 5, 0, 0, 16);
    addTriangle(5, 0, 5, 16, 0, 16);

    addTriangle(5, 0, 10, 0, 10, 4);
    addTriangle(5, 0, 10, 4, 5, 4);

    addTriangle(5, 4, 10, 4, 10, 8);
    addTriangle(5, 4, 10, 8, 7, 6);

    addTriangle(5, 8, 10, 8, 10, 12);
    addTriangle(5, 8, 10, 12, 5, 12);

    addTriangle(5, 12, 10, 12, 10, 16);
    addTriangle(5, 12, 10, 16, 0, 16);

    let vertices = new Float32Array(triVerts);
    let n = vertices.length / 2;

    let vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0);

    gl.drawArrays(gl.TRIANGLES, 0, n);
}

function gridConvert(x, y) {
    let xGL = (x / 10) * 2 - 1;
    let yGL = (y / 16) * -2 + 1;
    return [xGL, yGL];
}
