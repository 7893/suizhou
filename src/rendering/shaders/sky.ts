export const skyEffects = `
vec3 skyStars(vec2 p,vec2 pixels,float time,float density){
  // Delicate pinpoint high-altitude stars; avoids snow-like oversized blobs on city skies.
  vec2 grid=vec2(34.*pixels.x/pixels.y,34.);
  vec2 cell=floor(p*grid);
  float seed=hash(cell+17.3);
  vec2 center=(cell+.18+.64*vec2(hash(cell+3.7),hash(cell+9.2)))/grid;
  vec2 delta=(p-center)*pixels;
  float radius=mix(.42,.78,fract(seed*13.7));
  float core=exp(-dot(delta,delta)/(radius*radius));
  float halo=exp(-dot(delta,delta)/7.5)*.14;
  float twinkle=.38+.72*pow(.5+.5*sin(time*(1.0+seed*1.1)+seed*83.),1.6);
  float visible=step(density,seed)*(1.-smoothstep(.10,.40,p.y));
  return mix(vec3(.72,.84,1.),vec3(1.,.90,.72),seed)*(core+halo)*twinkle*visible;
}
float cloudLobe(vec2 q,vec2 center,vec2 size){
  return 1.-smoothstep(.72,1.08,length((q-center)/size));
}
float cloudBank(vec2 q){
  float cloud=cloudLobe(q,vec2(0.,.67),vec2(3.2,.59));
  cloud=max(cloud,cloudLobe(q,vec2(1.,.48),vec2(1.7,.50)));
  cloud=max(cloud,cloudLobe(q,vec2(-1.5,.62),vec2(1.7,.43)));
  return max(cloud,cloudLobe(q,vec2(-3.1,.85),vec2(2.,.25))*.73);
}
`;
