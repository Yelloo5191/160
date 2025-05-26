class Cube {
    constructor() {
        this.type = "cube";
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.vertices = new Float32Array([
            1, 1, 1, 0, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1,
            0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1,
            1, 0, 1, 0, 1, 1, 0, 0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0,
            0, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 0,
            1, 1, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0,
        ]);

        const faceUV = [0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1];
        this.uvs = new Float32Array([
            ...faceUV,
            ...faceUV,
            ...faceUV,
            ...faceUV,
            ...faceUV,
            ...faceUV,
        ]);

        const px = [1, 0, 0],
            nx = [-1, 0, 0],
            py = [0, 1, 0],
            ny = [0, -1, 0],
            pz = [0, 0, 1],
            nz = [0, 0, -1];

        this.normals = new Float32Array([
            ...px,
            ...px,
            ...px,
            ...px,
            ...px,
            ...px,
            ...nx,
            ...nx,
            ...nx,
            ...nx,
            ...nx,
            ...nx,
            ...py,
            ...py,
            ...py,
            ...py,
            ...py,
            ...py,
            ...ny,
            ...ny,
            ...ny,
            ...ny,
            ...ny,
            ...ny,
            ...pz,
            ...pz,
            ...pz,
            ...pz,
            ...pz,
            ...pz,
            ...nz,
            ...nz,
            ...nz,
            ...nz,
            ...nz,
            ...nz,
        ]);

        this.buffer = null;
        this.uvBuffer = null;
        this.normalBuffer = null;
        this.textureNum = 0;
    }

    render() {
        gl.uniform4fv(u_FragColor, this.color);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
        gl.uniform1i(u_whichTexture, this.textureNum);

        if (!this.buffer) {
            this.buffer = gl.createBuffer();
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        if (!this.uvBuffer) {
            this.uvBuffer = gl.createBuffer();
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.uvs, gl.STATIC_DRAW);
        gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_UV);

        if (!this.normalBuffer) this.normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);
        gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Normal);

        gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / 3);
    }
}
