import { LEAP_DURATION } from "../../../motion/fish-leap.ts";
export const wildlife = `
vec2 fishInk(vec2 p,vec4 fish,float phase){
  vec2 q=(p-fish.xy)*vec2(u_size.x/u_size.y,1.);
  float c=cos(fish.z),s=sin(fish.z);
  q=mat2(c,-s,s,c)*q;
  float size=min(u_size.x/u_size.y,1.)*.027;
  q/=size;
  q.y-=sin(u_time*5.+phase-q.x*2.)*.11*(1.-smoothstep(-.65,.25,q.x));
  float body=1.-smoothstep(.86,1.08,length((q-vec2(.08,0.))/vec2(.58,.19)));
  float tailX=(-q.x-.40)/.53;
  float tail=smoothstep(0.,.14,tailX)*(1.-smoothstep(.82,1.,tailX));
  tail*=1.-smoothstep(.02,.09,abs(q.y)-tailX*.33);
  float fin=exp(-pow((q.x+.02)/.23,2.)-pow((abs(q.y)-.20)/.06,2.))*.38;
  // Brush-ink gradation: richer dorsal ink fading gently toward the translucent tail.
  float inkTone=smoothstep(-.75,.38,q.x)*.75+.25;
  float alpha=max(body,max(tail*.68,fin))*fish.w;
  return vec2(alpha,inkTone);
}
vec3 paintFish(vec3 color,vec2 p){
  if(p.y<.78||p.y>.97)return color;
  for(int i=0;i<3;i++) {
    vec4 fish=u_fish[i];
    vec4 ripple=u_fishRipples[i];
    vec2 mark=fishInk(p,fish,float(i)*2.17);
    vec3 pigment=mix(vec3(.44,.49,.42),vec3(.24,.30,.24),mark.y);
    color=mix(color,pigment,mark.x);
    // Surface rings remain where the fish touched the water, then diffuse softly into paper.
    vec2 d=(p-ripple.xy)*vec2(u_size.x/u_size.y,2.7);
    float radius=ripple.z*.015;
    float ring=exp(-pow((length(d)-radius)*540.,2.));
    float echo=exp(-pow((length(d)-radius*.62)*500.,2.))*.48;
    if(i>0)color-=vec3(.095,.11,.085)*(ring+echo)*ripple.w;
    // A landing splash follows the airborne fish; dual rings spread in perspective with pale droplets.
    if(i==0){
      float age=ripple.z-${LEAP_DURATION};
      float r1=max(age,0.)*.026;
      float r2=max(age-.12,0.)*.019;
      float landing=exp(-pow((length(d)-r1)*540.,2.))+exp(-pow((length(d)-r2)*520.,2.))*.55*step(.12,age);
      color-=vec3(.13,.15,.11)*landing*exp(-max(age,0.)*1.35)*step(0.,age);
      for(int j=0;j<6;j++){
        float f=float(j),t=max(age-f*.016,0.);
        float height=t*(.074+mod(f,2.)*.026)-.18*t*t;
        vec2 center=ripple.xy+vec2((f-2.5)*t*.014,-height);
        vec2 drop=(p-center)*u_size;
        float splash=exp(-dot(drop,drop)/1.7)*step(0.,age-f*.016)*smoothstep(0.,.004,height);
        color=mix(color,vec3(.92,.92,.84),splash*.78);
      }
    }
  }
  return color;
}
`;
