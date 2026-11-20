import { noise } from "./common.ts";
export const fragment = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 outColor;
uniform sampler2D u_source,u_destination;
uniform vec2 u_size;
uniform float u_blend,u_time;
uniform bool u_sourceInk,u_destinationInk;
${noise}
vec3 sceneAt(sampler2D source,vec2 uv,bool ink){
  vec3 c=texture(source,uv).rgb;
  if(!ink)return c;
  vec2 pixel=1./u_size;
  vec3 bleed=min(c,min(texture(source,uv-pixel*vec2(.9,.25)).rgb,texture(source,uv+pixel*vec2(.8,.4)).rgb));
  return mix(c,bleed,.13+noise(gl_FragCoord.xy*.34)*.10)+vec3((hash(gl_FragCoord.xy)-.5)*.007);
}
// Edge-safe subtle scroll-zoom UV: stays strictly within [0.002, 0.998] so border pixels never smear.
vec2 scrollUv(vec2 uv,float shift,float zoom){
  vec2 centered=(uv-.5)*zoom+.5;
  float safeShift=shift*(1.-zoom)*.5;
  return clamp(vec2(centered.x+safeShift,centered.y),vec2(.002),vec2(.998));
}
void main(){
  float t=u_blend;vec3 color;
  if(t<.001)color=sceneAt(u_source,v_uv,u_sourceInk);
  else if(t>.999)color=sceneAt(u_destination,v_uv,u_destinationInk);
  else{
    float curtain=pow(sin(t*3.14159265),1.25);
    float zoomA=1.-.045*t;
    float zoomB=1.-.045*(1.-t);
    vec2 uvA=scrollUv(v_uv,1.0,zoomA);
    vec2 uvB=scrollUv(v_uv,-1.0,zoomB);
    vec3 a=sceneAt(u_source,uvA,u_sourceInk);
    vec3 b=sceneAt(u_destination,uvB,u_destinationInk);
    vec2 warp=vec2(fbm(vec2(v_uv.x*2.6-u_time*.025,v_uv.y*3.2)),fbm(vec2(v_uv.x*3.4+1.7,v_uv.y*4.1-u_time*.02)));
    float cloud=fbm(vec2(v_uv.x*3.5-u_time*.035,v_uv.y*4.4)+warp*.35);
    float washMask=smoothstep(.16,.84,t+(cloud-.5)*.28+(v_uv.x-.5)*.08);
    color=mix(a,b,washMask);
    // Adaptive atmospheric mist veil harmonises day-to-night and ink transitions without harsh glare.
    float lum=dot(color,vec3(.299,.587,.114));
    vec3 mistTone=mix(vec3(.13,.19,.23),vec3(.88,.89,.82),smoothstep(.12,.58,lum));
    color=mix(color,mistTone,curtain*(.52+cloud*.24));
  }
  outColor=vec4(color,1.);
}
`;
