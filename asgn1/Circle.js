class Circle {
    constructor() {
        this.type = "circle";
        this.position = [0.0, 0.0, 0.0];
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.size = 5.0;
    }

    render() {
        let xy = this.position;
        let rgba = this.color;
        let size = this.size / 200.0;
        let segments = g_numSegments;

        let angleStep = (2 * Math.PI) / segments;

        let vertices = [xy[0], xy[1]];

        for (let i = 0; i <= segments; i++) {
            let angle = i * angleStep;
            let x = xy[0] + size * Math.cos(angle);
            let y = xy[1] + size * Math.sin(angle);
            vertices.push(x, y);
        }

        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        drawCircle(vertices);
    }
}
function drawCircle(vertices) {
    const n = vertices.length / 2;

    const vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log("Failed to create buffer");
        return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, n);
}
