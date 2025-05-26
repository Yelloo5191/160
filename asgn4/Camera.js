class Camera {
    constructor(canvas) {
        this.canvas = canvas;
        this.fov = 60;
        this.eye = new Vector3([0, 1, 5]);
        this.yaw = -90;
        this.pitch = 0;

        this.speed = 5;
        this.sensitivity = 0.1;

        this.viewMatrix = new Matrix4();
        this.updateView();

        this.projMatrix = new Matrix4();
        this.projMatrix.setPerspective(
            this.fov,
            canvas.width / canvas.height,
            0.1,
            1000
        );
    }

    updateView() {
        const y = (this.yaw * Math.PI) / 180;
        const p = (this.pitch * Math.PI) / 180;

        const fx = Math.cos(p) * Math.cos(y);
        const fy = Math.sin(p);
        const fz = Math.cos(p) * Math.sin(y);
        const forward = new Vector3([fx, fy, fz]).normalize();

        const worldUp = new Vector3([0, 1, 0]);
        const right = Vector3.cross(forward, worldUp).normalize();

        const up = Vector3.cross(right, forward).normalize();

        const target = new Vector3(this.eye.elements).add(forward);

        this.viewMatrix.setLookAt(
            this.eye.elements[0],
            this.eye.elements[1],
            this.eye.elements[2],
            target.elements[0],
            target.elements[1],
            target.elements[2],
            up.elements[0],
            up.elements[1],
            up.elements[2]
        );
    }

    updateProjection() {
        this.projMatrix.setPerspective(
            this.fov,
            this.canvas.width / this.canvas.height,
            0.1,
            1000
        );
    }

    moveForward(dt) {
        this._moveAlong(this._forward(), dt);
    }
    moveBackward(dt) {
        this._moveAlong(this._forward(), -dt);
    }
    moveRight(dt) {
        this._moveAlong(this._right(), dt);
    }
    moveLeft(dt) {
        this._moveAlong(this._right(), -dt);
    }

    _moveAlong(dir, dt) {
        dir.mul(this.speed * dt);
        this.eye.add(dir);
        this.updateView();
    }

    _forward() {
        const y = (this.yaw * Math.PI) / 180;
        const p = (this.pitch * Math.PI) / 180;
        return new Vector3([
            Math.cos(p) * Math.cos(y),
            Math.sin(p),
            Math.cos(p) * Math.sin(y),
        ]).normalize();
    }

    _right() {
        const forward = this._forward();
        const up = new Vector3([0, 1, 0]);
        return Vector3.cross(forward, up).normalize();
    }

    panLeft(dt) {
        this.yaw -= dt * this.speed * 30;
        this.updateView();
    }

    panRight(dt) {
        this.yaw += dt * this.speed * 30;
        this.updateView();
    }

    rotate(dx, dy) {
        this.yaw += dx * this.sensitivity;
        this.pitch += dy * this.sensitivity;
        this.pitch = Math.max(-89, Math.min(89, this.pitch));
        this.updateView();
    }
}
