export default class Buffer {

    constructor (gl, data, target = gl.ARRAY_BUFFER, mode = gl.STATIC_DRAW) {
        this.gl = gl;
        this.target = target;
        this.buffer = gl.createBuffer();
        this.bind();
        gl.bufferData(gl.ARRAY_BUFFER, data, mode);
        this.unbind();
        this.length = data.length;
        this.btyeLength = data.byteLength;
    }

    bind () {
        this.gl.bindBuffer(this.target, this.buffer);
    }

    unbind () {
        this.gl.bindBuffer(this.target, null);
    }

    free (mode) {
        this.gl.deleteBuffer(this.buffer);
        delete this.buffer;
    }

};
