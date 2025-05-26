class Sphere {
    constructor(slices = 24, stacks = 16) {
        this.type = "sphere";
        this.color = [1, 1, 1, 1];
        this.matrix = new Matrix4();
        this.textureNum = -2;
        const verts = [];
        const norms = [];
        const uvs = [];

        for (let stack = 0; stack < stacks; ++stack) {
            const phi1 = (Math.PI * stack) / stacks;
            const phi2 = (Math.PI * (stack + 1)) / stacks;

            const y1 = Math.cos(phi1),
                r1 = Math.sin(phi1);
            const y2 = Math.cos(phi2),
                r2 = Math.sin(phi2);

            for (let slice = 0; slice < slices; ++slice) {
                const theta1 = (2 * Math.PI * slice) / slices;
                const theta2 = (2 * Math.PI * (slice + 1)) / slices;

                const x11 = r1 * Math.cos(theta1),
                    z11 = r1 * Math.sin(theta1);
                const x12 = r1 * Math.cos(theta2),
                    z12 = r1 * Math.sin(theta2);
                const x21 = r2 * Math.cos(theta1),
                    z21 = r2 * Math.sin(theta1);
                const x22 = r2 * Math.cos(theta2),
                    z22 = r2 * Math.sin(theta2);

                pushTri(x11, y1, z11, x21, y2, z21, x22, y2, z22);
                pushTri(x11, y1, z11, x22, y2, z22, x12, y1, z12);
            }
        }

        function pushTri(x1, y1, z1, x2, y2, z2, x3, y3, z3) {
            verts.push(x1, y1, z1, x2, y2, z2, x3, y3, z3);
            norms.push(x1, y1, z1, x2, y2, z2, x3, y3, z3);
            uvs.push(
                0.5 + Math.atan2(z1, x1) / (2 * Math.PI),
                1 - (y1 + 1) / 2,
                0.5 + Math.atan2(z2, x2) / (2 * Math.PI),
                1 - (y2 + 1) / 2,
                0.5 + Math.atan2(z3, x3) / (2 * Math.PI),
                1 - (y3 + 1) / 2
            );
        }

        this.vertices = new Float32Array(verts);
        this.normals = new Float32Array(norms);
        this.uvs = new Float32Array(uvs);

        this.posBuffer = null;
        this.normalBuffer = null;
        this.uvBuffer = null;
    }

    render() {
        gl.uniform4fv(u_FragColor, this.color);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
        gl.uniform1i(u_whichTexture, this.textureNum);

        if (!this.posBuffer) this.posBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        if (!this.normalBuffer) this.normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);
        gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Normal);

        if (!this.uvBuffer) this.uvBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.uvs, gl.STATIC_DRAW);
        gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_UV);

        gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / 3);
    }
}
