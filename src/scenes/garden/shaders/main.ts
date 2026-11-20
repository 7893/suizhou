import { boat } from "../../../rendering/shaders/boat.ts";
import { noise } from "../../../rendering/shaders/common.ts";
import { ripples } from "../../../rendering/shaders/ripples.ts";
import { surface } from "../../../rendering/shaders/surface.ts";
export const fragment = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 outColor;
uniform sampler2D u_buildings,u_foliage,u_bank,u_boatLayer;
uniform vec2 u_size,u_boat,u_boatCenter,u_actorScale;
uniform float u_time;
uniform vec3 u_touch,u_environment;
uniform vec4 u_wind;
${noise}
${boat}
${surface}
${ripples}
vec3 courtyard(vec2 p){
  vec3 sky=mix(vec3(.94,.90,.82),vec3(.81,.86,.77),smoothstep(0.,.68,p.y));
  float cloud=fbm(vec2(p.x*4.-u_wind.z*.007,p.y*9.));
  sky+=vec3(.04,.025,.005)*cloud*(.4+u_environment.y);
  sky+=vec3(.035,.02,.0)*exp(-length((p-vec2(.55,.23))*vec2(3.,5.)));
  return over(sky,sampleLayer(u_buildings,p));
}
float waterAt(vec2 p){
  float solid=max(sampleLayer(u_bank,p).a,sampleDayBoat(p-u_boat).a);
  solid=max(solid,sampleLayer(u_buildings,p).a);
  solid=max(solid,sampleLayer(u_foliage,p).a);
  return smoothstep(.663,.68,p.y)*(1.-smoothstep(.08,.35,solid));
}
void main(){
  vec2 p=vec2(v_uv.x,1.-v_uv.y);
  vec3 color=courtyard(p);
  if(p.y>.66){
    float depth=(p.y-.66)/.34;
    vec3 n=waterNormal(p,u_size.x/u_size.y,depth);
    vec2 reflection=vec2(p.x+n.x*(.02+depth*.055),1.32-p.y+n.y*.02);
    vec3 water=mix(vec3(.46,.59,.51),vec3(.22,.37,.32),depth);
    color=mix(water,courtyard(reflection),.32+waterFresnel(n,depth)*.32);
    color+=vec3(.23,.22,.14)*waterSparkle(n)*.16;
    float lines=pow(max(0.,sin(p.y*610.+sin(p.x*25.)-u_time*1.6)),22.);
    color+=vec3(.07,.085,.06)*lines*depth;
    float behind=u_boatCenter.x+u_boat.x-p.x;
    float wake=exp(-pow((abs(p.y-u_boatCenter.y-u_boat.y-.009)-max(0.,behind)*.07)*500.,2.));
    color+=vec3(.15,.17,.11)*wake*smoothstep(.01,.04,behind)*(1.-smoothstep(.08,.23,behind));
    color+=vec3(.19,.22,.16)*touchRipple(p,.66,waterAt(u_touch.xy));
    vec2 reflectedBoat=vec2(p.x+n.x*.01,2.*(u_boatCenter.y+u_boat.y+.008)-p.y);
    if(p.y>u_boatCenter.y+u_boat.y+.008)
      color=mix(color,vec3(.16,.25,.21),sampleDayBoat(reflectedBoat-u_boat).a*.25);
  }
  if(p.y>.66)color=over(color,sampleLayer(u_buildings,p));
  vec2 leaf=p;
  leaf.x+=(sin(u_time*1.1+p.y*13.)*.0025+u_wind.x*.002)*smoothstep(.1,.4,p.y);
  color=over(color,sampleLayer(u_foliage,leaf));
  vec4 actor=sampleDayBoat(p-u_boat);
  color=mix(color,vec3(.18,.23,.20),actor.a);
  color=mix(color,vec3(.55,.47,.33),boatMasks(p-u_boat).r*.8);
  // A few drifting petals, never an accumulating particle allocation.
  for(int i=0;i<12;i++){
    float fi=float(i),phase=fract(u_time*(.017+fi*.0005)+fi*.173);
    vec2 pos=vec2(fract(fi*.137+u_time*.007+sin(phase*6.+fi)*.035),.19+phase*.73);
    vec2 q=(p-pos)*u_size;
    float petal=exp(-dot(q/vec2(2.8,1.3),q/vec2(2.8,1.3)));
    color=mix(color,vec3(.89,.71,.65),petal*.7*sin(phase*3.14159));
  }
  color=over(color,sampleLayer(u_bank,p));
  color*=1.-.08*dot(p-.5,p-.5);
  color+=vec3((hash(gl_FragCoord.xy)-.5)*.008);
  outColor=vec4(color,1.);
}
`;
