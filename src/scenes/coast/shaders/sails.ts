export const sails = `
float triangle(vec2 p,vec2 a,vec2 b,vec2 c){
  vec2 e0=b-a,e1=c-b,e2=a-c,v0=p-a,v1=p-b,v2=p-c;
  float s0=e0.x*v0.y-e0.y*v0.x,s1=e1.x*v1.y-e1.y*v1.x,s2=e2.x*v2.y-e2.y*v2.x;
  return (step(0.,s0)*step(0.,s1)*step(0.,s2)+step(s0,0.)*step(s1,0.)*step(s2,0.));
}
vec3 paintSails(vec3 color,vec2 p,float aspect){
  // Three distant sails drift in the open bay; on portrait, stay clear of the left palm crowns.
  bool portrait=aspect<.85;
  for(int i=0;i<3;i++){
    float fi=float(i),direction=i==1?-1.:1.;
    float course=u_time*(.009+fi*.0028)*direction;
    float turn=sin(u_time*.19+fi*2.);
    float x=portrait
      ?.46+fract(.14+fi*.31+course)*.50
      :-.08+fract(.24+fi*.29+course)*1.16;
    float y=(portrait?.535:.55)+fi*.046+.008*sin(u_time*.19+fi*2.);
    float scale=(portrait?.018:.015)+fi*.003;
    float bob=sin(u_time*1.45+fi*2.)*.003;
    vec2 q=(p-vec2(x,y+bob))/vec2(scale,scale*aspect);
    float roll=sin(u_time*1.1+fi*1.7)*.07;
    q=mat2(cos(roll),-sin(roll),sin(roll),cos(roll))*q;
    q.x*=direction/(.78+.22*abs(turn));
    float behind=(x-p.x)*direction;
    float trail=exp(-pow((abs(p.y-y-bob-.003)-max(behind,0.)*(.06+turn*.025))*900.,2.));
    trail*=smoothstep(.008,.015,behind)*(1.-smoothstep(.02,.065,behind));
    trail*=exp(-max(behind,0.)*25.)*(.65+.35*sin(behind*850.-u_time*3.));
    color+=vec3(.25,.29,.21)*trail;
    vec2 cloth=q;
    cloth.x+=sin(clamp(-q.y/1.7,0.,1.)*3.14159)*(.18+u_wind.y*.07);
    cloth.x+=sin(q.y*8.+u_time*3.+fi)*.022*smoothstep(.05,.6,abs(q.x));
    float sail=triangle(cloth,vec2(0.,-1.7),vec2(-.75,0.),vec2(0.,-.05));
    float jib=triangle(cloth,vec2(.08,-1.3),vec2(.13,-.03),vec2(.65,-.03));
    color=mix(color,vec3(.99,.94,.78),clamp(sail+jib,0.,1.)*(.84+.10*sin(q.y*2.+u_wind.y)));
    float hull=(1.-smoothstep(.65,.7,abs(q.x)))*(1.-smoothstep(.08,.16,abs(q.y-.14)));
    color=mix(color,vec3(.36,.39,.29),hull);
    float mast=(1.-smoothstep(.018,.035,abs(q.x)))*step(-1.75,q.y)*step(q.y,.14);
    color=mix(color,vec3(.56,.55,.40),mast);
  }
  return color;
}
`;
