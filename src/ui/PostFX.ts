import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'

const CorruptionShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uTime: { value: 0 },
    uCorruption: { value: 0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uCorruption;
    varying vec2 vUv;

    float rand(vec2 co) { return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453); }

    void main() {
      vec2 uv = vUv;
      float c = uCorruption;

      float sliceY = floor(uv.y * 40.0);
      float sliceSeed = rand(vec2(sliceY, floor(uTime * 6.0)));
      float sliceShift = (sliceSeed - 0.5) * c * 0.05 * step(0.93, sliceSeed);
      uv.x += sliceShift;

      float ab = c * 0.0035;
      float r = texture2D(tDiffuse, uv + vec2(ab, 0.0)).r;
      float g = texture2D(tDiffuse, uv).g;
      float b = texture2D(tDiffuse, uv - vec2(ab, 0.0)).b;
      vec3 color = vec3(r, g, b);

      float scan = sin(uv.y * 800.0) * 0.025 * c;
      color -= scan;

      float grain = (rand(uv * fract(uTime)) - 0.5) * c * 0.1;
      color += grain;

      gl_FragColor = vec4(color, 1.0);
    }
  `,
}

export class PostFX {
  composer: EffectComposer
  private shaderPass: ShaderPass
  private clock = 0

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
    this.composer = new EffectComposer(renderer)
    this.composer.addPass(new RenderPass(scene, camera))
    this.shaderPass = new ShaderPass(CorruptionShader)
    this.composer.addPass(this.shaderPass)
    this.composer.addPass(new OutputPass())
  }

  setCorruption(v: number) {
    this.shaderPass.uniforms.uCorruption.value = Math.max(0, Math.min(1, v))
  }

  setSize(w: number, h: number) {
    this.composer.setSize(w, h)
  }

  render(dt: number) {
    this.clock += dt
    this.shaderPass.uniforms.uTime.value = this.clock
    this.composer.render()
  }
}
