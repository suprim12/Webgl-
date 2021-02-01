uniform float time;
uniform float progress;
uniform vec4 resolution;
varying vec2 vUv;
uniform sampler2D texture1;

const float pi = 3.1415925;

void main() {
  vUv = uv;
  vec3 pos = position;
  // pos.z = 0.1 * sin(pos.x * pos.y * 20. + time);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0 );
}
