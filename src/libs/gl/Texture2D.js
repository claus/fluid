export default class Texture2D {

    constructor (gl, data, options = {}) {
        this.gl = gl;
        this.texture = gl.createTexture();
        this.unit = -1;
        this.bound = false;
        this.bindTexture();

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);

        let internalFormat = options.internalformat || options.format || gl.RGBA;
        let format = options.format ||  gl.RGBA;
        let type = options.type || gl.UNSIGNED_BYTE;

        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, format, type, data);

        let magFilter = options.mag_filter || gl.LINEAR;
        let minFilter = options.min_filter || gl.LINEAR_MIPMAP_LINEAR;
        let wrapS = options.wrap_s || gl.REPEAT;
        let wrapT = options.wrap_t || gl.REPEAT;

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);

        if (options.mipmap !== false) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }
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
