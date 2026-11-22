import { BEACH_RUN } from "../../../config/actors.ts";
export const people = `
vec3 beachPeople(vec3 color,vec2 p){
  if(p.y<.83||p.x>.32)return color;
  bool portrait=u_size.x/u_size.y<.85;
  float pixelScale=max(.50,min(u_size.x,u_size.y)/850.);
  float baseX=portrait?.155:${BEACH_RUN.x};
  float rangeX=portrait?.050:${BEACH_RUN.range};
  float yLift=portrait?.024:.053;
  for(int i=0;i<2;i++){
    float phase=u_time*${BEACH_RUN.speed}-float(i)*${BEACH_RUN.lag};
    float x=baseX+rangeX*sin(phase);
    float y=beachHeight(x)+yLift+float(i)*(portrait?.006:.009)+${BEACH_RUN.orbit}*cos(phase);
    vec2 local=(p-vec2(x,y))*u_size/pixelScale;
    vec2 uv=(local+vec2(32.,57.))/vec2(64.);
    if(all(greaterThanEqual(uv,vec2(0)))&&all(lessThanEqual(uv,vec2(1)))){
      uv.x=(uv.x+float(i))/2.;
      vec4 s=texture(u_beachCrew,uv);
      color=color*(1.-s.a)+s.rgb;
    }
  }
  return color;
}
`;
