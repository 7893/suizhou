import { BOAT_FRAME, BOAT_LANTERN } from "../../config/actors.ts";

const { x, y, width, height } = BOAT_FRAME;
// Pixi renders actor coverage (alpha), oar highlight (red), and night stern lantern (blue).
export const boat = `
vec4 boatMasks(vec2 p){
  vec2 uv=((p-u_boatCenter)/u_actorScale+vec2(${x}.,${y}.))/vec2(${width}.,${height}.);
  if(any(lessThan(uv,vec2(0)))||any(greaterThan(uv,vec2(1))))return vec4(0);
  return texture(u_boatLayer,uv);
}
vec3 boatLamp(vec3 color,vec2 p,float strength,float time){
  vec2 local=(p-u_boatCenter)/u_actorScale;
  vec2 q=(local-vec2(${BOAT_LANTERN.x.toFixed(1)},${BOAT_LANTERN.y.toFixed(1)}))/vec2(1.4,1.9);
  float flicker=.92+.08*sin(time*3.2)+.03*sin(time*7.7);
  float core=exp(-dot(q,q));
  float halo=exp(-dot(q,q)*.095);
  return color+(vec3(1.0,.78,.38)*core*1.15+vec3(.92,.54,.18)*halo*.36)*strength*flicker;
}
vec4 sampleBoat(vec2 p){return vec4(.169,.224,.192,boatMasks(p).a);}
vec4 sampleDayBoat(vec2 p){
  vec4 m=boatMasks(p);
  return vec4(.169,.224,.192,max(0.,m.a-m.b));
}
`;
