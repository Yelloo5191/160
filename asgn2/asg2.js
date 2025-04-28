var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_GlobalRotateMatrix;
    uniform float u_Size;
    void main() {
        gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
        gl_PointSize = u_Size;
    }`;

var FSHADER_SOURCE = `
    precision mediump float;
    uniform vec4 u_FragColor;
    void main() {
        gl_FragColor = u_FragColor;
    }`;

let canvas;
let gl;
let a_Position;
let u_FragColor;

let yellow = [1.0, 0.9, 0.1, 1.0];
let darkYellow = [0.8, 0.7, 0.0, 1.0];
let maneWhite = [1.0, 1.0, 1.0, 1.0];
let purple = [0.4, 0.0, 0.6, 1.0];
let black = [0.0, 0.0, 0.0, 0.8];

let g_animate = false;
let g_headAngle = 0;
let g_bodyAngle = 0;
let g_botSnoutAngle = 0;
let g_legAngle1 = 0;
let g_legAngle2 = 0;
let g_tail1Angle = 45;
let g_globalAngle = 0;
let g_globalAngle2 = 0;
let g_bodyYOffset = 0.0;
let drag = false;
let g_pokeAnimation = false;
let pokeStartTime = 0;
let xpos = 0;
let ypos = 0;

function setupWebGL() {
    canvas = document.getElementById("webgl");

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

    u_Size = gl.getUniformLocation(gl.program, "u_Size");
    if (!u_Size) {
        console.log("Failed to get the storage location of u_Size");
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

    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

function addActionsFOrHtmlUI() {
    document.getElementById("reset").onclick = function () {
        g_globalAngle = 0;
        g_globalAngle2 = 0;
        g_bodyAngle = 0;
        g_legAngle1 = 0;
        g_legAngle2 = 0;
        g_tail1Angle = 45;
        g_headAngle = 0;
        g_botSnoutAngle = 0;
        g_animate = false;
        xpos = 0;
        ypos = 0;

        document.getElementById("angleValue").innerHTML = g_globalAngle;
        document.getElementById("vertAngleValue").innerHTML = g_globalAngle2;
        renderAllShapes();
    };

    canvas.onmousedown = function (ev) {
        drag = true;
        xpos = ev.clientX;
        ypos = ev.clientY;

        if (ev.shiftKey) {
            g_pokeAnimation = true;
            pokeStartTime = performance.now() / 1000;
        }
    };

    canvas.onmousemove = function (ev) {
        if (!drag) return;

        if (drag) {
            let x = ev.clientX;
            let y = ev.clientY;
            let dx = x - xpos;
            let dy = y - ypos;

            g_globalAngle += dx * 0.5;
            g_globalAngle2 += dy * 0.5;
            xpos = ev.clientX;
            ypos = ev.clientY;

            document.getElementById("angleValue").innerHTML =
                Math.round(g_globalAngle);
            document.getElementById("vertAngleValue").innerHTML =
                Math.round(g_globalAngle2);
            document.getElementById("angleSlide").value = g_globalAngle;
            document.getElementById("vertAngleSlide").value = g_globalAngle2;
        }
    };

    canvas.onmouseup = function () {
        drag = false;
    };

    canvas.onmouseleave = function () {
        drag = false;
    };

    document.getElementById("startRunAnimation").onclick = function () {
        g_animate = true;
    };

    document.getElementById("stopRunAnimation").onclick = function () {
        g_animate = false;
    };

    document
        .getElementById("angleSlide")
        .addEventListener("input", function () {
            g_globalAngle = Number(this.value);
            document.getElementById("angleValue").innerHTML = Math.round(
                this.value
            );
            xpos = 0;
            ypos = 0;
            renderAllShapes();
        });

    document
        .getElementById("vertAngleSlide")
        .addEventListener("input", function () {
            g_globalAngle2 = Number(this.value);
            document.getElementById("vertAngleValue").innerHTML = Math.round(
                this.value
            );
            xpos = 0;
            ypos = 0;
            renderAllShapes();
        });

    document
        .getElementById("frontLegsAngleSlide")
        .addEventListener("input", function () {
            g_legAngle1 = this.value;
            document.getElementById("frontLegsAngleValue").innerHTML =
                Math.round(this.value);
            renderAllShapes();
        });

    document
        .getElementById("backLegsAngleSlide")
        .addEventListener("input", function () {
            g_legAngle2 = this.value;
            document.getElementById("backLegsAngleValue").innerHTML =
                Math.round(this.value);
            renderAllShapes();
        });

    document
        .getElementById("headAngleSlide")
        .addEventListener("input", function () {
            g_headAngle = this.value;
            document.getElementById("headAngleValue").innerHTML = Math.round(
                this.value
            );
            renderAllShapes();
        });
}

function main() {
    setupWebGL();

    connectVariablesToGLSL();

    addActionsFOrHtmlUI();

    // canvas.onmousedown = click;
    // canvas.onmousemove = function (ev) {
    //     if (ev.buttons == 1) {
    //         click(ev);
    //     }
    // };

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    gl.clear(gl.COLOR_BUFFER_BIT);

    // renderAllShapes();
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
    g_seconds = performance.now() / 1000 - g_startTime;
    updateAnimationAngles();
    renderAllShapes();
    requestAnimationFrame(tick);
}

function updateAnimationAngles() {
    if (g_pokeAnimation) {
        let elapsed = performance.now() / 1000 - pokeStartTime;
        if (elapsed > 3) {
            g_pokeAnimation = false;
            g_headAngle = 0;
            g_bodyYOffset = 0;
            return;
        }

        // Do a poke animation — wink + hop up
        g_headAngle = 5 * Math.sin(elapsed * 10);
        g_bodyYOffset = 0.05 * Math.abs(Math.sin(elapsed * 5));

        // wag tail
        g_tail1Angle = 45 + 15 * Math.sin(elapsed * 10 - 0.5);
    } else if (g_animate) {
        g_legAngle1 = 20 * Math.sin(g_seconds * 8);
        g_legAngle2 = -g_legAngle1;

        g_headAngle = 5 * Math.sin(g_seconds * 5);

        g_bodyYOffset = 0.02 * Math.sin(g_seconds * 6);
        g_tail1Angle = 45 + 15 * Math.sin(g_seconds * 7 - 0.5);
    }
}

function renderAllShapes() {
    var startTime = performance.now();

    var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
    globalRotMat.rotate(g_globalAngle2, 1, 0, 0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // Body
    var body = new Cube();
    body.color = yellow;
    body.matrix.setTranslate(-0.1, -0.4 + g_bodyYOffset, -0.25);
    body.matrix.rotate(g_bodyAngle, 1, 0, 0);
    body.matrix.scale(0.2, 0.3, 0.7);
    body.render();

    // Head
    var head = new Cube();
    head.color = yellow;
    head.matrix.setTranslate(-0.15, -0.1 + g_bodyYOffset, -0.4);
    head.matrix.rotate(g_headAngle, 1, 0, 0);
    head.matrix.scale(0.3, 0.3, 0.3);
    drawCube(head.matrix, yellow);

    // Snout
    var snout = new Cube();
    snout.color = yellow;
    snout.matrix.setTranslate(-0.07, -0.07 + g_bodyYOffset, -0.5);
    snout.matrix.rotate(g_headAngle, 1, 0, 0);
    snout.matrix.scale(0.15, 0.15, 0.1);
    drawCube(snout.matrix, yellow);

    // Snout tip
    var snoutTip = new Cube();
    snoutTip.color = black;
    snoutTip.matrix.setTranslate(-0.035, 0 + g_bodyYOffset, -0.51);
    snoutTip.matrix.rotate(g_headAngle, 1, 0, 0);
    snoutTip.matrix.scale(0.07, 0.07, 0.01);
    drawCube(snoutTip.matrix, black);

    // Eyes
    var eye = new Cube();
    eye.color = maneWhite;
    eye.matrix.setTranslate(0.05, 0 + g_bodyYOffset, -0.41);
    eye.matrix.rotate(g_headAngle, 1, 0, 0);
    eye.matrix.translate(0, 0.035, 0);
    eye.matrix.scale(0.1, 0.15, 0.01);
    drawCube(eye.matrix, maneWhite);

    var eye2 = new Cube();
    eye2.color = maneWhite;
    eye2.matrix.setTranslate(-0.15, 0 + g_bodyYOffset, -0.41);
    eye2.matrix.rotate(g_headAngle, 1, 0, 0);
    eye2.matrix.translate(0, 0.035, 0);
    eye2.matrix.scale(0.1, 0.15, 0.01);
    drawCube(eye2.matrix, maneWhite);

    // Eye pupils
    var eyePupil = new Cube();
    eyePupil.color = black;
    eyePupil.matrix.setTranslate(0.05, 0.035 + g_bodyYOffset, -0.42);
    eyePupil.matrix.rotate(g_headAngle, 1, 0, 0);
    eyePupil.matrix.scale(0.07, 0.1, 0.01);
    drawCube(eyePupil.matrix, black);

    var eyePupil2 = new Cube();
    eyePupil2.color = black;
    eyePupil2.matrix.setTranslate(-0.12, 0.035 + g_bodyYOffset, -0.42);
    eyePupil2.matrix.rotate(g_headAngle, 1, 0, 0);
    eyePupil2.matrix.scale(0.07, 0.1, 0.01);
    drawCube(eyePupil2.matrix, black);

    // Outer ears
    var leftEar = new Cube();
    leftEar.color = yellow;
    leftEar.matrix.setTranslate(-0.15, 0.2 + g_bodyYOffset, -0.2);
    leftEar.matrix.rotate(g_headAngle, 1, 0, 0);
    leftEar.matrix.rotate(45, 1, 0, 0);
    leftEar.matrix.scale(0.05, 0.2, 0.1);
    drawCube(leftEar.matrix, yellow);

    var rightEar = new Cube();
    rightEar.color = yellow;
    rightEar.matrix.setTranslate(0.1, 0.2 + g_bodyYOffset, -0.2);
    rightEar.matrix.rotate(g_headAngle, 1, 0, 0);
    rightEar.matrix.rotate(45, 1, 0, 0);
    rightEar.matrix.scale(0.05, 0.2, 0.1);
    drawCube(rightEar.matrix, yellow);

    // Inner ears
    var leftInnerEar = new Cube();
    leftInnerEar.color = purple;
    leftInnerEar.matrix.setTranslate(-0.16, 0.2 + g_bodyYOffset, -0.2);
    leftInnerEar.matrix.rotate(g_headAngle, 1, 0, 0);
    leftInnerEar.matrix.rotate(45, 1, 0, 0);
    leftInnerEar.matrix.scale(0.02, 0.2, 0.1);
    drawCube(leftInnerEar.matrix, purple);

    var rightInnerEar = new Cube();
    rightInnerEar.color = purple;
    rightInnerEar.matrix.setTranslate(0.14, 0.2 + g_bodyYOffset, -0.2);
    rightInnerEar.matrix.rotate(g_headAngle, 1, 0, 0);
    rightInnerEar.matrix.rotate(45, 1, 0, 0);
    rightInnerEar.matrix.scale(0.02, 0.2, 0.1);
    drawCube(rightInnerEar.matrix, purple);

    // Legs
    var frontLeftLeg = new Cube();
    frontLeftLeg.color = yellow;
    frontLeftLeg.matrix.setTranslate(-0.1, -0.3, -0.2);
    frontLeftLeg.matrix.rotate(g_legAngle1, 1, 0, 0);
    frontLeftLeg.matrix.translate(0, -0.5, 0);
    frontLeftLeg.matrix.scale(0.05, 0.5, 0.1);
    drawCube(frontLeftLeg.matrix, yellow);

    var frontRightLeg = new Cube();
    frontRightLeg.color = yellow;
    frontRightLeg.matrix.setTranslate(0.05, -0.3, -0.2);
    frontRightLeg.matrix.rotate(g_legAngle1, 1, 0, 0);
    frontRightLeg.matrix.translate(0, -0.5, 0);
    frontRightLeg.matrix.scale(0.05, 0.5, 0.1);
    drawCube(frontRightLeg.matrix, yellow);

    var backLeftLeg = new Cube();
    backLeftLeg.color = yellow;
    backLeftLeg.matrix.setTranslate(-0.1, -0.3, 0.3);
    backLeftLeg.matrix.rotate(g_legAngle2, 1, 0, 0);
    backLeftLeg.matrix.translate(0, -0.5, 0);
    backLeftLeg.matrix.scale(0.05, 0.5, 0.1);
    drawCube(backLeftLeg.matrix, yellow);

    var backRightLeg = new Cube();
    backRightLeg.color = yellow;
    backRightLeg.matrix.setTranslate(0.05, -0.3, 0.3);
    backRightLeg.matrix.rotate(g_legAngle2, 1, 0, 0);
    backRightLeg.matrix.translate(0, -0.5, 0);
    backRightLeg.matrix.scale(0.05, 0.5, 0.1);
    drawCube(backRightLeg.matrix, yellow);

    // Tail Spikes
    var spike1 = new Cube();
    spike1.color = yellow;
    spike1.matrix.setTranslate(-0.1, -0.1 + g_bodyYOffset, 0.4);
    spike1.matrix.rotate(g_tail1Angle, 1, 0, 0);
    spike1.matrix.scale(0.05, 0.3, 0.1);
    drawCube(spike1.matrix, yellow);

    var spike1tip = new Cube();
    spike1tip.color = yellow;
    spike1tip.matrix.setTranslate(-0.1, -0.1 + g_bodyYOffset, 0.5);
    spike1tip.matrix.rotate(g_tail1Angle, 1, 0, 0);
    spike1tip.matrix.rotate(10, 0, 0, 1);
    spike1tip.matrix.scale(0.05, 0.3, 0.1);
    drawCube(spike1tip.matrix, yellow);

    var spike2 = new Cube();
    spike2.color = yellow;
    spike2.matrix.setTranslate(0.05, -0.1 + g_bodyYOffset, 0.4);
    spike2.matrix.rotate(g_tail1Angle, 1, 0, 0);
    spike2.matrix.scale(0.05, 0.3, 0.1);
    drawCube(spike2.matrix, yellow);

    var spike2tip = new Cube();
    spike2tip.color = yellow;
    spike2tip.matrix.setTranslate(0.05, -0.1 + g_bodyYOffset, 0.5);
    spike2tip.matrix.rotate(g_tail1Angle, 1, 0, 0);
    spike2tip.matrix.rotate(-10, 0, 0, 1);
    spike2tip.matrix.scale(0.05, 0.3, 0.1);
    drawCube(spike2tip.matrix, yellow);

    var spike3 = new Cube();
    spike3.color = yellow;
    spike3.matrix.setTranslate(-0.03, -0.1 + g_bodyYOffset, 0.4);
    spike3.matrix.rotate(g_tail1Angle, 1, 0, 0);
    spike3.matrix.scale(0.05, 0.4, 0.1);
    drawCube(spike3.matrix, yellow);

    var spike3tip = new Cube();
    spike3tip.color = yellow;
    spike3tip.matrix.setTranslate(-0.03, -0.1 + g_bodyYOffset, 0.5);
    spike3tip.matrix.rotate(g_tail1Angle, 1, 0, 0);
    spike3tip.matrix.scale(0.05, 0.4, 0.1);
    drawCube(spike3tip.matrix, yellow);

    // Mane
    var mane = new Cube();
    mane.color = maneWhite;
    mane.matrix.setTranslate(-0.2, -0.15 + g_bodyYOffset, -0.4);
    mane.matrix.rotate(g_headAngle, 1, 0, 0);
    mane.matrix.rotate(45, 1, 0, 0);
    mane.matrix.scale(0.2, 0.25, 0.2);
    drawCube(mane.matrix, maneWhite);

    var mane2 = new Cube();
    mane2.color = maneWhite;
    mane2.matrix.setTranslate(0, -0.1 + g_bodyYOffset, -0.4);
    mane2.matrix.rotate(g_headAngle, 1, 0, 0);
    mane2.matrix.rotate(45, 1, 0, 0);
    mane2.matrix.scale(0.2, 0.25, 0.2);
    drawCube(mane2.matrix, maneWhite);

    var mane3 = new Cube();
    mane3.color = maneWhite;
    mane3.matrix.setTranslate(-0.145, 0 + g_bodyYOffset, -0.3);
    mane3.matrix.rotate(g_headAngle, 1, 0, 0);
    mane3.matrix.rotate(65, 1, 0, 0);
    mane3.matrix.scale(0.29, 0.35, 0.3);
    drawCube(mane3.matrix, maneWhite);

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
