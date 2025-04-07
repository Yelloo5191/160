// DrawTriangle.js (c) 2012 matsuda
function main() {
    // Retrieve <canvas> element
    var canvas = document.getElementById("example");
    if (!canvas) {
        console.log("Failed to retrieve the <canvas> element");
        return false;
    }

    // Get the rendering context for 2DCG
    var ctx = canvas.getContext("2d");

    document
        .getElementById("drawBtn")
        .addEventListener("click", () => handleDrawEvent(ctx));

    document
        .getElementById("opBtn")
        .addEventListener("click", () => handleDrawOperationEvent(ctx));

    // Draw a blue rectangle
    // ctx.fillStyle = "rgba(0, 0, 255, 1.0)"; // Set color to blue
    // ctx.fillRect(120, 10, 150, 150); // Fill a rectangle with the color

    var v1 = new Vector3([2.25, 2.25, 0]);

    drawVector(v1, "red", ctx);
}

function handleDrawEvent(ctx) {
    const { width, height } = ctx.canvas;
    ctx.clearRect(0, 0, width, height);

    const x1 = parseFloat(document.getElementById("x1").value);
    const y1 = parseFloat(document.getElementById("y1").value);
    const v1 = new Vector3([x1, y1, 0]);

    const x2 = parseFloat(document.getElementById("x2").value);
    const y2 = parseFloat(document.getElementById("y2").value);
    const v2 = new Vector3([x2, y2, 0]);

    drawVector(v1, "red", ctx);
    drawVector(v2, "blue", ctx);
}

function handleDrawOperationEvent(ctx) {
    const { width, height } = ctx.canvas;
    ctx.clearRect(0, 0, width, height);

    const v1 = new Vector3([
        parseFloat(document.getElementById("x1").value),
        parseFloat(document.getElementById("y1").value),
        0,
    ]);
    const v2 = new Vector3([
        parseFloat(document.getElementById("x2").value),
        parseFloat(document.getElementById("y2").value),
        0,
    ]);

    drawVector(v1, "red", ctx);
    drawVector(v2, "blue", ctx);

    const op = document.getElementById("op").value;
    const scalar = parseFloat(document.getElementById("scalar").value);

    switch (op) {
        case "add": {
            drawVector(v1.add(v2), "green", ctx);
            break;
        }
        case "sub": {
            drawVector(v1.sub(v2), "green", ctx);
            break;
        }
        case "mul": {
            drawVector(v1.mul(scalar), "green", ctx);
            drawVector(v2.mul(scalar), "green", ctx);
            break;
        }
        case "div": {
            drawVector(v1.div(scalar), "green", ctx);
            drawVector(v2.div(scalar), "green", ctx);
            break;
        }
        case "mag": {
            console.log("||v1|| =", v1.magnitude());
            console.log("||v2|| =", v2.magnitude());
            break;
        }
        case "norm": {
            drawVector(v1.normalize(), "green", ctx);
            drawVector(v2.normalize(), "green", ctx);
            break;
        }
        case "angle": {
            const ang = angleBetween(v1, v2);
            console.log("∠(v1, v2) =", ang.toFixed(2), "degrees");
            break;
        }
        case "area": {
            const area = areaTriangle(v1, v2);
            console.log("△ area =", area.toFixed(4));
            break;
        }
    }
}

function angleBetween(v1, v2) {
    const dot = Vector3.dot(v1, v2);
    const mags = v1.magnitude() * v2.magnitude();
    if (mags === 0) return NaN;
    const rad = Math.acos(dot / mags);
    return (rad * 180) / Math.PI;
}

function drawVector(v, color, ctx) {
    const scale = 20;
    const { width, height } = ctx.canvas;

    ctx.beginPath();
    ctx.moveTo(width / 2, height / 2);
    ctx.lineTo(
        width / 2 + v.elements[0] * scale,
        height / 2 - v.elements[1] * scale
    );
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
}

function areaTriangle(v1, v2) {
    const cross = Vector3.cross(v1, v2);
    return cross.elements[2] / 2;
}
