import Shader from './Shader';

export default class ShaderManager {

    constructor (gl, resources, options) {
        this.gl = gl;
        this.resources = resources;
        this.shaders = [];
        options = options || {};
        this.includeExpression = /#include "([^"]+)"/g;
    }

    preprocess (name, content) {
        return content.replace(this.includeExpression, (_, name) => {
            return this.getSource(name);
        });
    }

    getSource (name) {
        let content = this.resources[name];
        if(content == null) {
            throw 'Shader not found: ' + name;
        }
        return this.preprocess(name, content);
    }

    getShader (vertex, fragment) {
        if (!fragment) {
            fragment = vertex;
        }
        fragment += '.frag';
        vertex += '.vertex';
        var key = fragment + ';' + vertex;
        if (!(key in this.shaders)) {
            this.shaders[key] = new Shader(this.gl, this.getSource(vertex), this.getSource(fragment));
        }
        return this.shaders[key];
    }
};
