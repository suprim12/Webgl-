import * as THREE from "three";
import gsap from "gsap";
import fragment from "./shader/fragment.glsl";
import vertex from "./shader/vertex.glsl";
import * as dat from "dat.gui";
let OrbitControls = require("three-orbit-controls")(THREE);
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
// helper functions
const MathUtils = {
  // map number x from range [a, b] to [c, d]
  map: (x, a, b, c, d) => ((x - a) * (d - c)) / (b - a) + c,
  // linear interpolation
  lerp: (a, b, n) => (1 - n) * a + n * b,
};

export default class Sketch {
  constructor(selector) {
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xeeeeee, 1);
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.mouseX = 0;
    this.mouseY = 0;

    this.uMouse = new THREE.Vector2(0, 0);
    this.texture = new THREE.Vector2(0, 0);

    this.container = document.getElementById("container");
    this.container.appendChild(this.renderer.domElement);
    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.001,
      1000
    );
    this.camera.position.set(0, 0, 2);
    // this.camera.position.z = 0.5;
    // var frustumSize = 10;
    // var aspect = window.innerWidth / window.innerHeight;
    // this.camera = new THREE.OrthographicCamera(
    //   (frustumSize * aspect) / -2,
    //   (frustumSize * aspect) / 2,
    //   frustumSize / 2,
    //   frustumSize / -2,
    //   -1000,
    //   1000
    // );
    // this.camera.position.set(0, 0, 2);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;
    // this.loader = new THREE.GLTFLoader().setPath("models/");
    // THREE.DRACOLoader.setDecoderPath("js/lib/draco/");
    // this.loader.setDRACOLoader(new THREE.DRACOLoader());
    this.paused = false;
    this.composer;

    this.setupResize();
    this.addObjects();
    this.resize();
    this.comp();
    // this.render();
    this.mousmove();
  }

  mousmove() {
    document.addEventListener("mousemove", (e) => {
      // mousemove / touchmove
      this.uMouse.x = e.clientX / window.innerWidth;
      this.uMouse.y = 1 - e.clientY / window.innerHeight;
    });
  }

  addObjects() {
    const img = document.getElementById("texture");
    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable",
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { type: "f", value: 0 },
        texture: { type: "t", value: new THREE.TextureLoader().load(img.src) },
        resolution: { type: "v4", value: new THREE.Vector4() },
        uvRate1: {
          value: new THREE.Vector2(1, 1),
        },
      },
      vertexShader: vertex,
      fragmentShader: fragment,
    });

    this.geometry = new THREE.PlaneBufferGeometry(1, 1, 1, 1);
    this.plane = new THREE.Mesh(this.geometry, this.material);

    // this.texture = new THREE.Texture(document.getElementById("texture"));
    // this.texture.needsUpdate = true;
    // this.geometry = new THREE.PlaneGeometry(0.45, 0.3);
    // this.material = new THREE.MeshBasicMaterial({
    //   map: this.texture,
    //   side: THREE.DoubleSide,
    // });
    // this.plane = new THREE.Mesh(this.geometry, this.material);

    this.scene.add(this.plane);
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;

    // Full Screen
    const dist = this.camera.position.z;
    const height = 1;
    this.camera.fov = 2 * (180 / Math.PI) * Math.atan(height / (2 * dist));

    // Plane Aspect
    if (this.width / this.height > 1) {
      this.plane.scale.x = this.camera.aspect;
    } else {
      this.plane.scale.y = 1 / this.camera.aspect;
    }

    // this.imageAspect = 853 / 1280;
    // let a1, a2;
    // if (this.height / this.width > this.imageAspect) {
    //   a1 = (this.width / this.height) * this.imageAspect;
    //   a2 = 1;
    // } else {
    //   a1 = 1;
    //   a2 = this.height / this.width / this.imageAspect;
    // }

    // this.material.uniforms.resolution.value.x = this.width;
    // this.material.uniforms.resolution.value.y = this.height;
    // this.material.uniforms.resolution.value.z = a1;
    // this.material.uniforms.resolution.value.w = a2;

    this.camera.updateProjectionMatrix();
  }
  stop() {
    this.paused = true;
  }
  play() {
    this.paused = false;
  }

  comp() {
    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);
    let myEffect = {
      uniforms: {
        tDiffuse: { value: null },
        resolution: {
          value: new THREE.Vector2(1, window.innerHeight / window.innerWidth),
        },
        uMouse: { value: new THREE.Vector2(-10, -10) },
        uVelo: { value: 0 },
      },
      vertexShader: `
      varying vec2 vUv; 
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0 );
      }`,
      fragmentShader: `
          uniform float time;
          uniform sampler2D tDiffuse;
          uniform vec2 resolution;
          varying vec2 vUv;
          uniform vec2 uMouse;
          float circle(vec2 uv, vec2 disc_center, float disc_radius, float border_size) {
            uv -= disc_center;
            uv*=resolution;
            float dist = sqrt(dot(uv, uv));
            return smoothstep(disc_radius+border_size, disc_radius-border_size, dist);
          }
          void main()  {
              vec2 newUV = vUv;
              float c = circle(vUv, uMouse, 0.0, 0.2);
              float r = texture2D(tDiffuse, newUV.xy += c * (0.1 * .5)).x;
              float g = texture2D(tDiffuse, newUV.xy += c * (0.1 * .525)).y;
              float b = texture2D(tDiffuse, newUV.xy += c * (0.1 * .55)).z;
              vec4 color = vec4(r, g, b, 1.);
  
              gl_FragColor = color;
      }`,
    };

    this.customPass = new ShaderPass(myEffect);
    this.customPass.renderToScreen = true;
    this.composer.addPass(this.customPass);
    this.customPass.uniforms.uMouse.value = this.uMouse;
  }
  render() {
    requestAnimationFrame(this.render.bind(this));
    this.composer.render();
    // requestAnimationFrame(this.render);
    if (this.paused) return;
    this.time += 0.05;
    // // this.material.uniforms.time.value = this.time;
    // this.renderer.render(this.scene, this.camera);
  }
}

var img = document.getElementById("texture");
let dummyimg = document.createElement("img");
dummyimg.src = img.src;

dummyimg.onload = function () {
  document.body.classList.remove("loading");
  // img.style.opacity = 0;
  const scene = new Sketch();
  scene.render();
};
