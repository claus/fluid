export default class Shader {

    constructor (gl, vertexSource, fragmentSource) {
        this.gl = gl;
        this.program = this.makeProgram(vertexSource, fragmentSource);
        this.uniformLocations = {};
        this.uniformValues = {};
        this.uniformNames = [];
        this.attributeLocations = {};
    }

    use () {
        this.gl.useProgram(this.program);
    }

    prepareUniforms (values) {
        this.uniformNames = Object.keys(values);
        for (let i = 0; i < this.uniformNames.length; i++) {
            let name = this.uniformNames[i];
            this.uniformLocations[name] = this.gl.getUniformLocation(this.program, name);
        }
    }

    uniforms (values) {
        if (this.uniformNames.length === 0) {
            this.prepareUniforms(values);
        }
        for (let i = 0; i < this.uniformNames.length; i++) {
            let name = this.uniformNames[i];
            let location = this.uniformLocations[name];
            let value = values[name];

            if (location === null) {
                continue;
            }

            if (value.uniform) {
                if (!value.equals(this.uniformValues[name])) {
                    value.uniform(location);
                    value.setTexture(this.uniformValues, name);
                }
            } else if (value.length) {
                let value2 = this.uniformValues[name];
                if (value2 !== undefined) {
                    let j = 0;
                    let l = value.length;
                    for (; j < l; j++) {
                        if (value[j] != value2[j]) {
                            break;
                        }
                    }
                    // already set
                    if (j == l) {
                        //continue;
                    } else {
                        j = 0;
                        l = value.length;
                        for (; j < l; j++) {
                            value2[j] = value[j];
                        }
                    }
                } else {
                    this.uniformValues[name] = new Float32Array(value);
                }
                switch (value.length) {
                    case 2:
                        this.gl.uniform2fv(location, value);
                        break;
                    case 3:
                        this.gl.uniform3fv(location, value);
                        break;
                    case 4:
                        this.gl.uniform4fv(location, value);
                        break;
                    case 9:
                        this.gl.uniformMatrix3fv(location, false, value);
                        break;
                    case 16:
                        this.gl.uniformMatrix4fv(location, false, value);
                        break;
                }
            } else {
                if (value != this.uniformValues[name]) {
                    this.gl.uniform1f(location, value);
                    this.uniformValues[name] = value;
                }
            }
        }
    }

    getUniformLocation (name) {
        if (this.uniformLocations[name] === undefined) {
            this.uniformLocations[name] = this.gl.getUniformLocation(this.program, name);
        }
        return this.uniformLocations[name];
    }

    getAttribLocation (name) {
        if (!(name in this.attributeLocations)) {
            let location = this.gl.getAttribLocation(this.program, name);
            if (location < 0) {
                throw 'undefined attribute ' + name;
            }
            this.attributeLocations[name] = location;
        }
        return this.attributeLocations[name];
    }

    makeShader (shaderType, source) {
        let shader = this.gl.createShader(shaderType);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.log(this.gl.getShaderInfoLog(shader), shaderType, source);
            throw 'Compiler exception: "' + this.gl.getShaderInfoLog(shader) + '"';
        }
        return shader;
    }

    makeProgram (vertexSource, fragmentSource) {
        let vertexShader = this.makeShader(this.gl.VERTEX_SHADER, vertexSource);
        let fragmentShader = this.makeShader(this.gl.FRAGMENT_SHADER, fragmentSource);
        let program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            throw 'Linker exception: ' + this.gl.getProgramInfoLog(program);
        }
        return program;
    }

}
