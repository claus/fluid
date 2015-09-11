'use strict';

import React from 'react';
import _ from 'lodash';

import Loader from '../../libs/Loader';
import Context from '../../libs/gl/Context';
import ShaderManager from '../../libs/gl/ShaderManager';
import Mesh from '../../libs/gl/Mesh';
import FBO from '../../libs/gl/FBO';
import Kernel from '../../libs/gl/Kernel';
import { vec2 } from '../../libs/gl-matrix';
import { screenQuad } from '../../libs/gl/Geometry';

export default class Fluid extends React.Component{

    constructor () {
        super();
        this.onTick = this.onTick.bind(this);
        this.onLoadShaders = this.onLoadShaders.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onResize = _.throttle(this.onResize.bind(this), 200);
        this.shaders = null;
        this.mousePos = {
            x: 0,
            y: 0,
            xDelta: 0,
            yDelta: 0
        };
        this.state = {
            options: {
                iterations: 32,
                mouseForce: 1,
                resolution: 0.5,
                cursorSize: 100,
                step: 1 / 60
            }
        };
    }

    componentDidMount () {
        this.loadShaders();
    }

    componentWillUnmount () {
        document.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('resize', this.onResize);
        this.shaders = null;
    }

    loadShaders () {
        Loader.load([
            'shaders/advect.frag',
            'shaders/addForce.frag',
            'shaders/divergence.frag',
            'shaders/jacobi.frag',
            'shaders/subtractPressureGradient.frag',
            'shaders/visualize.frag',
            'shaders/cursor.vertex',
            'shaders/boundary.vertex',
            'shaders/kernel.vertex'
        ]).then(this.onLoadShaders);
    }

    onLoadShaders (results) {
        this.shaderSources = {};
        for (let [i, result] of results.entries()) {
            let name = /shaders\/(\S+\.(vertex|frag))/.exec(result.src);
            if (name && name.length > 1) {
                this.shaderSources[name[1]] = result.response;
            }
        }
        document.addEventListener('mousemove', this.onMouseMove);
        window.addEventListener('resize', this.onResize);
        this.setup();
        requestAnimationFrame(this.onTick);
    }

    onMouseMove (event) {
        let options = this.state.options;
        let x1 = event.pageX * options.resolution;
        let y1 = event.pageY * options.resolution;
        let xDelta = x1 - this.mousePos.x;
        let yDelta = y1 - this.mousePos.y;
        this.mousePos = {
            x: x1,
            y: y1,
            xDelta: xDelta,
            yDelta: yDelta
        };
    }

    onResize (event) {
        this.setup();
    }

    setup () {
        let options = this.state.options;
        let canvas = React.findDOMNode(this);
        let width = canvas.width = window.innerWidth * options.resolution;
        let height = canvas.height = window.innerHeight * options.resolution;
        let gl = Context.initialize(canvas, {
            debug: false,
            context: {
                depth: false
            },
            extensions: {
                texture_float: true
            }
        });
        this.sizes = {
            px_x: 1 / width,
            px_y: 1 / height,
            px: vec2.create([ 1 / width, 1 / height ]),
            px1: vec2.create([ 1, width / height ])
        };
        // just load it when it's there. If it's not there it's hopefully not needed.
        gl.getExtension('OES_texture_float_linear');
        gl.viewport(0, 0, width, height);
        gl.lineWidth(1);
        this.shaders = new ShaderManager(gl, this.shaderSources);
        this.createMeshes(gl, width, height);
        this.createFBOs(gl, width, height);
        this.createKernels(gl, width, height);
    }

    onTick () {
        if (this.shaders) {
            let options = this.state.options;
            let sizes = this.sizes;

            this.advectVelocityKernel.uniforms.dt = options.step;
            this.advectVelocityKernel.run();

            let xd = this.mousePos.xDelta;
            let yd = this.mousePos.yDelta;
            let x0 = this.mousePos.x;
            let y0 = this.mousePos.y;
            let cursorMult = options.cursorSize * options.mouseForce;
            vec2.set([ xd * sizes.px_x * cursorMult, -yd * sizes.px_y * cursorMult ], this.addForceKernel.uniforms.force);
            vec2.set([ x0 * sizes.px_x * 2 - 1, -(y0 * sizes.px_y * 2 - 1) ], this.addForceKernel.uniforms.center);
            this.addForceKernel.run();

            this.velocityBoundaryKernel.run();

            this.divergenceKernel.run();

            let p0 = this.pressureFBO0;
            let p1 = this.pressureFBO1;
            let ptmp;
            for (let i = 0; i < options.iterations; i++) {
                this.jacobiKernel.uniforms.pressure = this.pressureBoundaryKernel.uniforms.pressure = p0;
                this.jacobiKernel.outputFBO = this.pressureBoundaryKernel.outputFBO = p1;
                this.jacobiKernel.run();
                this.pressureBoundaryKernel.run();
                ptmp = p0;
                p0 = p1;
                p1 = ptmp;
            }

            this.subtractPressureGradientKernel.run();
            this.subtractPressureGradientBoundaryKernel.run();

            this.drawKernel.run();
        }
        requestAnimationFrame(this.onTick);
    }

    createMeshes (gl, width, height) {
        let px_x = this.sizes.px_x;
        let px_y = this.sizes.px_y;
        let px = this.sizes.px;
        let px1 = this.sizes.px1;
        let options = this.state.options;
        this.cursorMesh = new Mesh(gl, {
            vertex: screenQuad(px_x * options.cursorSize * 2, px_y * options.cursorSize * 2),
            attributes: { position: {} }
        });
        this.coverMesh = new Mesh(gl, {
            vertex: screenQuad(1, 1),
            attributes: { position: {} }
        });
        this.innerMesh = new Mesh(gl, {
            vertex: screenQuad(1 - px_x * 2, 1 - px_y * 2),
            attributes: { position: {} }
        });
        this.boundaryMesh = new Mesh(gl, {
            mode: gl.LINES,
            vertex: new Float32Array([
                // bottom
                -1,   -1,
                -1,   -1 + px_y * 2,
                 1,   -1,
                 1,   -1 + px_y * 2,

                // top
                -1,    1,
                -1,    1 - px_y * 2,
                 1,    1,
                 1,    1 - px_y * 2,

                // left
                -1,              1,
                -1 + px_x * 2,   1,
                -1,             -1,
                -1 + px_x * 2,  -1,

                // right
                 1,              1,
                 1 - px_x * 2,   1,
                 1,             -1,
                 1 - px_x * 2,  -1
            ]),
            attributes: {
                position: {
                    size: 2,
                    stride: 16,
                    offset: 0
                },
                offset: {
                    size: 2,
                    stride: 16,
                    offset: 8
                }
            }
        });
    }

    createFBOs (gl, width, height) {
        let singleComponentFBOFormat = (() => {
            var fbo = new FBO(gl, 32, 32, gl.FLOAT, gl.LUMINANCE);
            return fbo.supported ? gl.LUMINANCE : gl.RGBA;
        })();
        this.velocityFBO0 = new FBO(gl, width, height, gl.FLOAT, gl.RGBA);
        this.velocityFBO1 = new FBO(gl, width, height, gl.FLOAT, gl.RGBA);
        this.divergenceFBO = new FBO(gl, width, height, gl.FLOAT, singleComponentFBOFormat);
        this.pressureFBO0 = new FBO(gl, width, height, gl.FLOAT, singleComponentFBOFormat);
        this.pressureFBO1 = new FBO(gl, width, height, gl.FLOAT, singleComponentFBOFormat);
    }

    createKernels (gl, width, height) {
        let px_x = this.sizes.px_x;
        let px_y = this.sizes.px_y;
        let px = this.sizes.px;
        let px1 = this.sizes.px1;
        let options = this.state.options;
        this.advectVelocityKernel = new Kernel(gl, {
            shader: this.shaders.getShader('kernel', 'advect'),
            mesh: this.innerMesh,
            uniforms: {
                px: px,
                px1: px1,
                scale: 1,
                velocity: this.velocityFBO0,
                source: this.velocityFBO0,
                dt: options.step
            },
            output: this.velocityFBO1
        });
        this.velocityBoundaryKernel = new Kernel(gl, {
            shader: this.shaders.getShader('boundary', 'advect'),
            mesh: this.boundaryMesh,
            uniforms: {
                px: px,
                scale: -1,
                velocity: this.velocityFBO0,
                source: this.velocityFBO0,
                dt: options.step
            },
            output: this.velocityFBO1
        });
        this.addForceKernel = new Kernel(gl, {
            shader: this.shaders.getShader('cursor', 'addForce'),
            mesh: this.cursorMesh,
            blend: 'add',
            uniforms: {
                px: px,
                force: vec2.create([ 0.5, 0.2 ]),
                center: vec2.create([ 0.1, 0.4 ]),
                scale: vec2.create([ options.cursorSize * px_x, options.cursorSize * px_y ])
            },
            output: this.velocityFBO1
        });
        this.divergenceKernel = new Kernel(gl, {
            shader: this.shaders.getShader('kernel', 'divergence'),
            mesh: this.coverMesh,
            uniforms: {
                velocity: this.velocityFBO1,
                px: px
            },
            output: this.divergenceFBO
        });
        this.jacobiKernel = new Kernel(gl, {
            shader: this.shaders.getShader('kernel', 'jacobi'),
            // use cover so the simulation still works
            // even if the pressure boundary is not
            // properly enforced
            mesh: this.coverMesh,
            nounbind: true,
            uniforms: {
                pressure: this.pressureFBO0,
                divergence: this.divergenceFBO,
                alpha: -1,
                beta: 0.25,
                px: px
            },
            output: this.pressureFBO1
        });
        this.pressureBoundaryKernel = new Kernel(gl, {
            shader: this.shaders.getShader('boundary', 'jacobi'),
            mesh: this.boundaryMesh,
            noUnbind: true,
            noBind: true,
            uniforms: {
                pressure: this.pressureFBO0,
                divergence: this.divergenceFBO,
                alpha: -1,
                beta: 0.25,
                px: px
            },
            output: this.pressureFBO1
        });
        this.subtractPressureGradientKernel = new Kernel(gl, {
            shader: this.shaders.getShader('kernel', 'subtractPressureGradient'),
            mesh: this.coverMesh,
            uniforms: {
                scale: 1,
                pressure: this.pressureFBO0,
                velocity: this.velocityFBO1,
                px: px
            },
            output: this.velocityFBO0
        });
        this.subtractPressureGradientBoundaryKernel = new Kernel(gl, {
            shader: this.shaders.getShader('boundary', 'subtractPressureGradient'),
            mesh: this.boundaryMesh,
            uniforms: {
                scale: -1,
                pressure: this.pressureFBO0,
                velocity: this.velocityFBO1,
                px: px
            },
            output: this.velocityFBO0
        });
        this.drawKernel = new Kernel(gl, {
            shader: this.shaders.getShader('kernel', 'visualize'),
            mesh: this.coverMesh,
            uniforms: {
                velocity: this.velocityFBO0,
                pressure: this.pressureFBO0,
                px: px
            },
            output: null
        });
    }

    render () {
        return (
            <canvas className="fluid"></canvas>
        );
    }
}
