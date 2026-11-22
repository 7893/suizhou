import { skyline } from "../composition.ts";

const { tower: towerL } = skyline.landscape;
const { tower: towerP } = skyline.portrait;
const glFloat = (value: number) =>
	Number.isInteger(value) ? value.toFixed(1) : String(value);

export const lights = `
float roomState(vec2 id,float epoch){
  return step(.43,hash(id+vec2(epoch*7.13,epoch*3.71)));
}
float lightLevel(vec2 p){
  vec4 room=sampleLayer(u_windows,p);
  // Room and floor IDs come from the painted window rectangles, not screen tiles.
  vec2 id=floor(room.rg*255.+.5);
  float seed=hash(id);
  float clock=u_time/(5.+seed*7.)+seed*29.;
  float epoch=floor(clock),fade=smoothstep(0.,.12,fract(clock));
  float occupied=mix(roomState(id,epoch-1.),roomState(id,epoch),fade);
  occupied=mix(occupied,1.,step(.82,seed));
  float floorClock=u_time*.16+id.y*.37;
  float sequence=smoothstep(.74,.82,fract(floorClock))*(1.-smoothstep(.93,1.,fract(floorClock)));
  float rooms=max(occupied,sequence)*1.9;
  float level=mix(1.,rooms,step(.05,room.a));
  bool portrait=u_size.x/u_size.y<.85;
  float towerX=portrait?${glFloat(towerP.x)}:${glFloat(towerL.x)};
  float top=portrait?${glFloat(towerP.top)}:${glFloat(towerL.top)};
  float width=portrait?${glFloat(towerP.width)}:${glFloat(towerL.width)};
  float tower=step(abs(p.x-towerX),width*.64)*step(top,p.y)*step(p.y,.42);
  float band=exp(-pow((fract(u_time*.065)-(p.y-top)/(.59-top))/.15,2.));
  level=mix(level,.65+band*2.8,tower);
  float river=smoothstep(.565,.595,p.y);
  float sweep=pow(.5+.5*sin(p.x*15.-u_time*.95),5.);
  return mix(level,.65+1.25*sweep,river);
}
vec3 animatedLights(vec2 p){
  if(p.y<.27||p.y>.65)return vec3(0.);
  vec4 lamps=sampleLayer(u_lights,p);
  return lamps.rgb*lamps.a*lightLevel(p);
}
vec3 lightSpill(vec2 p){
  if(p.y<.26||p.y>.66)return vec3(0.);
  // Sample the same emitters and schedules for halos and reflected halos.
  vec2 d=vec2(2.5)/u_size;
  vec3 spill=animatedLights(p+vec2(d.x,0.))+animatedLights(p-vec2(d.x,0.));
  spill+=animatedLights(p+vec2(0.,d.y))+animatedLights(p-vec2(0.,d.y));
  vec4 glow=sampleLayer(u_glow,p);
  return spill*.16+glow.rgb*glow.a*lightLevel(p)*.55;
}
`;
