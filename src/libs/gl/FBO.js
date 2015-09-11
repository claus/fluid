export default class FBO {

    constructor (gl, width, height, type = gl.UNSIGNED_BYTE, format = gl.RGBA) {
        this.gl = gl;
        this.width = width;
        this.height = height;
        this.unit = -1;

        this.framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);

        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, format, width, height, 0, format, type, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        this.depth = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.depth);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depth);
        this.supported = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;

        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    bind () {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
    }

    unbind () {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }

    bindTexture (unit) {
        if (unit !== undefined) {
            this.gl.activeTexture(this.gl.TEXTURE0 + unit);
            this.unit = unit;
        }
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.bound = true;
    }

    unbindTexture () {
        this.gl.activeTexture(this.gl.TEXTURE0 + this.unit);
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
        this.unit = -1;
        this.bound = false;
    }

    uniform (location) {
        this.gl.uniform1i(location, this.unit);
    }

    equals (value) {
        return (this.unit === value);
    }

    setTexture (obj, name) {
        obj[name] = this.unit;
    }

};
