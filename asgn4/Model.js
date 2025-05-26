class Model {
    constructor(gl, filePath) {
        this.filePath = filePath;
        this.color = [150.0, 150.0, 1.0, 1.0];
        this.matrix = new Matrix4();

        this.loader = new OBJLoader(this.filePath);
        this.loader.parseModel().then(() => {
            this.modelData = this.loader.getModelData();

            this.vertexBuffer = gl.createBuffer();
            this.normalBuffer = gl.createBuffer();

            if (!this.vertexBuffer || !this.normalBuffer) {
                console.log("Failed to create buffers for", this.filePath);
                return;
            }
        });
    }

    render(gl, program) {
        if (!this.loader.isFullyLoaded) return;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(this.modelData.vertices),
            gl.DYNAMIC_DRAW
        );
        gl.vertexAttribPointer(program.a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(program.a_Position);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(this.modelData.normals),
            gl.DYNAMIC_DRAW
        );
        gl.vertexAttribPointer(program.a_Normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(program.a_Normal);

        gl.uniformMatrix4fv(program.u_ModelMatrix, false, this.matrix.elements);
        gl.uniform4fv(program.u_FragColor, this.color);

        let nm4 = new Matrix4().setInverseOf(this.matrix);
        nm4.transpose();
        const nm3 = new Float32Array([
            nm4.elements[0],
            nm4.elements[1],
            nm4.elements[2],
            nm4.elements[4],
            nm4.elements[5],
            nm4.elements[6],
            nm4.elements[8],
            nm4.elements[9],
            nm4.elements[10],
        ]);
        gl.uniformMatrix3fv(program.u_NormalMatrix, false, nm3);

        gl.drawArrays(gl.TRIANGLES, 0, this.modelData.vertices.length / 3);
    }
}
