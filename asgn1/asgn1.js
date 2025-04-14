// ColoredPoint.js (c) 2012 matsuda
var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    uniform float u_Size;
    void main() {
        gl_Position = a_Position;
        gl_PointSize = 30.0;
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
let u_Size;
let g_numSegments = 10;

function updateNumSegments() {
    let slider = document.getElementById("segmentSlider");
    g_numSegments = parseInt(slider.value);
    document.getElementById("segmentDisplay").textContent = g_numSegments;
    renderAllShapes();
}

function setupWebGL() {
    canvas = document.getElementById("webgl");

    gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
    if (!gl) {
        console.log("Failed to get the rendering context for WebGL");
        return;
    }
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
    u_Size = gl.getUniformLocation(gl.program, "u_Size");
    if (!u_Size) {
        console.log("Failed to get the storage location of u_Size");
        return;
    }
}
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 5;
let g_selectedType = POINT;

function addActionsFOrHtmlUI() {
    document.getElementById("green").onclick = function () {
        g_selectedColor = [0.0, 1.0, 0.0, 1.0];
    };
    document.getElementById("red").onclick = function () {
        g_selectedColor = [1.0, 0.0, 0.0, 1.0];
    };
    document.getElementById("clearButton").onclick = function () {
        g_shapesList = [];
        renderAllShapes();
    };

    document.getElementById("alphaValue").oninput = function () {
        g_selectedColor[3] = this.value / 100;
    };

    document.getElementById("pointButton").onclick = function () {
        g_selectedType = POINT;
    };
    document.getElementById("triangleButton").onclick = function () {
        g_selectedType = TRIANGLE;
    };
    document.getElementById("circleButton").onclick = function () {
        g_selectedType = CIRCLE;
    };

    document
        .getElementById("redSlide")
        .addEventListener("mouseup", function () {
            g_selectedColor[0] = this.value / 100;
        });
    document
        .getElementById("greenSlide")
        .addEventListener("mouseup", function () {
            g_selectedColor[1] = this.value / 100;
        });
    document
        .getElementById("blueSlide")
        .addEventListener("mouseup", function () {
            g_selectedColor[2] = this.value / 100;
        });

    document
        .getElementById("sizeValue")
        .addEventListener("mouseup", function () {
            g_selectedSize = this.value;
        });
    document
        .getElementById("segmentValue")
        .addEventListener("input", updateNumSegments);

    document
        .getElementById("drawPictureButton")
        .addEventListener("click", drawMyTrianglePicture);
}

function main() {
    setupWebGL();

    connectVariablesToGLSL();

    addActionsFOrHtmlUI();

    canvas.onmousedown = click;
    canvas.onmousemove = function (ev) {
        if (ev.buttons == 1) {
            click(ev);
        }
    };

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    gl.clear(gl.COLOR_BUFFER_BIT);
}

var g_shapesList = [];

function click(ev) {
    let [x, y] = convertCoordinatesEventToGL(ev);

    let point;
    if (g_selectedType == POINT) {
        point = new Point();
    } else if (g_selectedType == TRIANGLE) {
        point = new Triangle();
    } else if (g_selectedType == CIRCLE) {
        point = new Circle();
    }
    point.position = [x, y];
    point.color = g_selectedColor.slice();
    point.size = g_selectedSize;
    g_shapesList.push(point);

    renderAllShapes();
}

function convertCoordinatesEventToGL(ev) {
    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();

    x = (x - rect.left - canvas.width / 2) / (canvas.width / 2);
    y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

    return [x, y];
}

function renderAllShapes() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    var len = g_shapesList.length;
    for (var i = 0; i < len; i++) {
        g_shapesList[i].render();
    }
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
