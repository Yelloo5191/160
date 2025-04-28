class Cube {
    constructor() {
        this.type = "cube";
        this.color = [1.0, 1.0, 1.0, 1.0];

        this.matrix = new Matrix4();
    }

    render() {
        var rgba = this.color;
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // — front face
        gl.uniform4f(u_FragColor, rgba[0], rgba[1] * 0.8, rgba[2], rgba[3]);
        drawTriangle3D([0, 0, 0, 1, 1, 0, 1, 0, 0]);
        drawTriangle3D([0, 0, 0, 0, 1, 0, 1, 1, 0]);

        // — top face
        gl.uniform4f(u_FragColor, rgba[0] * 0.8, rgba[1], rgba[2], rgba[3]);
        drawTriangle3D([0, 1, 0, 0, 1, 1, 1, 1, 1]);
        drawTriangle3D([0, 1, 0, 1, 1, 1, 1, 1, 0]);

        // — back face
        gl.uniform4f(u_FragColor, rgba[0], rgba[1] * 0.8, rgba[2], rgba[3]);
        drawTriangle3D([0, 0, 1, 1, 0, 1, 1, 1, 1]);
        drawTriangle3D([0, 0, 1, 1, 1, 1, 0, 1, 1]);

        // — bottom face
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2] * 0.8, rgba[3]);
        drawTriangle3D([0, 0, 0, 1, 0, 1, 1, 0, 0]);
        drawTriangle3D([0, 0, 0, 0, 0, 1, 1, 0, 1]);

        // — right face
        gl.uniform4f(u_FragColor, rgba[0], rgba[1] * 0.9, rgba[2], rgba[3]);
        drawTriangle3D([1, 0, 0, 1, 1, 0, 1, 1, 1]);
        drawTriangle3D([1, 0, 0, 1, 1, 1, 1, 0, 1]);

        // — left face
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        drawTriangle3D([0, 0, 0, 0, 0, 1, 0, 1, 1]);
        drawTriangle3D([0, 0, 0, 0, 1, 1, 0, 1, 0]);
    }
}
