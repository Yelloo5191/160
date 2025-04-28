class Cone {
    constructor() {
        this.type = "cone";
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.buffer = null;
        this.vertices = null;
        this.baseRadius = 0.8;
        this.height = 1.5;
        this.segments = 20;
    }

    // generate the vertices
    generateVertices() {
        let v = [];
        var rgba = this.color;

        // circle
        for (let i = 0; i < this.segments; i++) {
            let angle1 = (i * 2 * Math.PI) / this.segments;
            let angle2 = ((i + 1) * 2 * Math.PI) / this.segments;

            // Base vertices
            let x1 = this.baseRadius * Math.cos(angle1);
            let z1 = this.baseRadius * Math.sin(angle1);

            let x2 = this.baseRadius * Math.cos(angle2);
            let z2 = this.baseRadius * Math.sin(angle2);

            // Top of cone
            let x0 = 0;
            let y0 = this.height;
            let z0 = 0;

            v.push(x1, 0, z1, x0, y0, z0, x2, 0, z2);
            v.push(x2, 0, z2, x0, y0, z0, x1, 0, z1);
        }

        this.vertices = new Float32Array(v);
    }

    render() {
        // check vertices
        if (this.vertices === null) {
            this.generateVertices();
        }

        // check buffer
        if (this.buffer === null) {
            this.buffer = gl.createBuffer();
            if (!this.buffer) {
                console.log("Failed to create buffer object");
                return -1;
            }
        }

        // bind vertices to buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.DYNAMIC_DRAW);

        // Pass the color of a point to u_FragColor variable
        gl.uniform4f(
            u_FragColor,
            this.color[0],
            this.color[1],
            this.color[2],
            this.color[3]
        );
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // position attrib
        const a_Position = gl.getAttribLocation(gl.program, "a_Position");
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        // Draw the cube
        gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / 3);
    }
}
