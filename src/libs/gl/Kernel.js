export default class Kernel {

    constructor (gl, options = {}) {
        this.gl = gl;
        this.shader = options.shader;
        this.mesh = options.mesh;
        this.uniforms = options.uniforms;
        this.outputFBO = options.output;
        this.blend = options.blend;
        this.noBind = options.noBind;
        this.noUnbind = options.noUnbind;
    }

    run () {
        if(this.outputFBO && !this.noBind) {
            this.outputFBO.bind();
        }
        let textureUnit = 0;
        let value;
        let name;
        for (name in this.uniforms) {
            if (this.uniforms.hasOwnProperty(name)) {
                value = this.uniforms[name];
                if (value.bindTexture && !value.bound) {
                    value.bindTexture(textureUnit++);
                }
            }
        }
        this.shader.use();
        this.shader.uniforms(this.uniforms);
        if (this.blend === 'add') {
            this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE);
            this.gl.enable(this.gl.BLEND);
        } else {
            this.gl.disable(this.gl.BLEND);
        }
        this.mesh.draw(this.shader);
        if (this.outputFBO && !this.noUnbind) {
            this.outputFBO.unbind();
        }
        for (name in this.uniforms) {
            if (this.uniforms.hasOwnProperty(name)) {
                value = this.uniforms[name];
                if (value.bindTexture && value.bound) {
                    value.unbindTexture();
                }
            }
        }
    }

};
