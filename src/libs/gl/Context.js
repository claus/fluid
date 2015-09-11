//var mesh = require('./mesh'),
//    texture = require('./texture'),
//    extend = require('../utils').extend,
//    shader = require('./shader');

//require('./_webgl-debug');

import _ from 'lodash';
import ShaderManager from '../../libs/gl/ShaderManager.js';

export default class Context {

    constructor (gl, resources) {
        this.gl = gl;
        this.resources = resources;
        this.shaderManager = new ShaderManager(gl, resources);
    }

    getBuffer (name, target, mode) {
        var data = this.resources[name];
        new mesh.Buffer(this.gl, data, target, mode);
    }

    getFBO () {
    }

    getTexture (name, options) {
        var image = this.resources[name];
        return new texture.Texture2D(this.gl, image, options);
    }

    getShader (name) {
    }

    static initialize (canvas, options = {}) {

        if (!canvas.getContext) {
            throw new Error('canvas is not supported by your browser.');
        }

        let contextOptions = _.extend({
                alpha: false,
                depth: true,
                stencil: false,
                antialias: true,
                premultipliedAlpha: false,
                preserveDrawingBuffer: false
            }, options.context);

        let extensions = options.extensions || {};

        let gl = canvas.getContext('webgl', contextOptions);
        if (gl == null) {
            gl = canvas.getContext('experimental-webgl', contextOptions);
            if (gl == null) {
                throw new Error('webgl is not supported by your browser.');
            }
        }

        if(options.vertex_texture_units && gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) < options.vertex_texture_units) {
            throw new Error('This application needs at least two vertex texture units which are not supported by your browser.');
        }

        if(extensions.texture_float && gl.getExtension('OES_texture_float') == null) {
            throw new Error('This application needs float textures which are not supported by your browser.');
        }

        if(extensions.standard_derivatives && gl.getExtension('OES_standard_derivatives') == null){
            throw new Error('This application need the standard deriviates extensions for WebGL which is not supported by your Browser.');
        }

        /*
        if(window.WebGLDebugUtils && options.debug) {
            if (options.log_all) {
                gl = WebGLDebugUtils.makeDebugContext(gl, undefined, function() {
                    console.log.apply(console, arguments);
                });
            } else {
                gl = WebGLDebugUtils.makeDebugContext(gl);
            }
            console.log('running in debug context');
        }
        */

        if (contextOptions.depth) {
            gl.enable(gl.DEPTH_TEST);
        } else {
            gl.disable(gl.DEPTH_TEST);
        }

        gl.enable(gl.CULL_FACE);

        gl.lost = false;
        canvas.addEventListener('webglcontextlost', () => {
            console.error('WebGL context lost');
            gl.lost = true;
        }, false);

        //canvas.addEventListener('webglcontextrestored', function () {
            //onerror(canvas, 'restored webgl context - reloading!');
            //window.location.reload();
        //}, false);

        return gl;

    }
}
