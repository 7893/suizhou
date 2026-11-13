import { boat } from "../../../rendering/shaders/boat.ts";
import { noise } from "../../../rendering/shaders/common.ts";
import { ripples } from "../../../rendering/shaders/ripples.ts";
import { surface } from "../../../rendering/shaders/surface.ts";
import { birds } from "./birds.ts";
import { mist } from "./mist.ts";
import { sky } from "./sky.ts";
import { water } from "./water.ts";
import { wildlife } from "./wildlife.ts";
export const fragment = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 outColor;
uniform sampler2D u_paper,u_far,u_middle,u_near,u_shore,u_foliage,u_boatLayer;
uniform vec2 u_size,u_boat,u_boatCenter,u_actorScale;
uniform float u_time;
uniform vec3 u_touch,u_environment;
uniform vec4 u_wind;
uniform vec4 u_fish[3],u_fishRipples[3];
${noise}
${surface}
${boat}
${ripples}
${mist}
${water}
${wildlife}
${sky}
${birds}
void main() {
  vec2 p = vec2(v_uv.x, 1.0 - v_uv.y);
  vec3 paper = texture(u_paper, p).rgb;
  vec3 color = mountainLayer(paintSun(paper, p), texture(u_far, inkParallax(p, 0.007)), paper, 0.18);
  color = mix(color, paper, mistLayer(p, 0.47, 0.0));
  color = paintBirds(color, p);
  color = mountainLayer(color, texture(u_middle, inkParallax(p, 0.015)), paper, 0.07);
  color = mix(color, paper, mistLayer(p, 0.56, 1.0));
  color = over(color, texture(u_near, inkParallax(p, 0.025)));
  color = mix(color, paper, mistLayer(p, 0.665, 2.0));
  color = paintPassingCloud(color, paper, p);
  color = paintWater(color, paper, p);
  color = paintFish(color, p);
  color = over(color, sampleLayer(u_shore, inkParallax(p, 0.032)));
  float bend = pow(clamp((0.89 - p.y) / 0.27, 0.0, 1.0), 2.0);
  float wind = (u_wind.x * 0.75 + sin(u_time * 0.85 + p.y * 13.0) * 0.20) * 0.008 * bend;
  color = over(color, sampleLayer(u_foliage, inkParallax(p, 0.04) + vec2(wind, 0.0)));
  // The small boat moves independently of the paper and mountain layers.
  vec4 boatInk = sampleBoat(p - u_boat);
  color = over(color, boatInk);
  vec2 boatReflection = vec2(p.x - u_boat.x, 2.0 * (u_boatCenter.y + u_boat.y) - p.y - u_boat.y);
  vec4 reflectedBoat = sampleBoat(boatReflection + vec2(sin(p.y * 250.0 - u_time) * 0.002, 0.0));
  reflectedBoat.a *= smoothstep(u_boatCenter.y + 0.004 + u_boat.y, u_boatCenter.y + 0.009 + u_boat.y, p.y) * 0.24;
  color = over(color, reflectedBoat);
  outColor = vec4(color, 1.0);
}
`;
