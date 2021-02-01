uniform float time;
uniform float progress;
uniform sampler2D texture;
uniform sampler2D texture2;
uniform vec4 resolution;
varying vec2 vUv;
varying vec4 vPosition;
varying float vFrontShadow;
// varying float vBackShadow;
// varying float vProgress;

void main()	{
vec2 newUv = (vUv  - vec2(0.5))*resolution.zw + vec2(0.5);
    vec4 ftexture = texture2D(texture,vUv);
    gl_FragColor = vec4(vUv,0.0,1.);
    gl_FragColor = ftexture;
}
