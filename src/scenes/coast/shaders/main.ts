import { boat } from "../../../rendering/shaders/boat.ts";
import { noise } from "../../../rendering/shaders/common.ts";
import { ripples } from "../../../rendering/shaders/ripples.ts";
import { surface } from "../../../rendering/shaders/surface.ts";
import { coastLayout, palmAnchors } from "../composition.ts";
import { people } from "./people.ts";
import { sails } from "./sails.ts";
import { surf } from "./surf.ts";
import { wind } from "./wind.ts";

const { landscape: sunL, portrait: sunP } = coastLayout.sun;

export const fragment = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 outColor;
uniform sampler2D u_beachCrew;
uniform sampler2D u_foreground, u_trunk0, u_leaves0, u_trunk1, u_leaves1, u_shore, u_boatLayer;
uniform vec2 u_size, u_boat, u_boatCenter, u_actorScale;
uniform float u_time;
uniform vec3 u_touch, u_environment;
uniform vec4 u_wind;
${noise}
${surface}
${boat}
${ripples}
${wind}
${surf}
${people}
${sails}
${palmAnchors}

vec2 coastSunCenter() {
  return u_size.x / u_size.y < 0.85
    ? vec2(${sunP[0]}, ${sunP[1]})
    : vec2(${sunL[0]}, ${sunL[1]});
}

float coastWaterAt(vec2 p) {
  if (!touchActive()) return 0.0;
  float solid = max(sampleLayer(u_foreground, p).a, sampleBoat(p - u_boat).a);
  solid = max(solid, sampleLayer(u_trunk0, palmUV(p, palmRoot0(), palmCrown0(), palmPhase0, false)).a);
  solid = max(solid, sampleLayer(u_leaves0, palmUV(p, palmRoot0(), palmCrown0(), palmPhase0, true)).a);
  solid = max(solid, sampleLayer(u_trunk1, palmUV(p, palmRoot1(), palmCrown1(), palmPhase1, false)).a);
  solid = max(solid, sampleLayer(u_leaves1, palmUV(p, palmRoot1(), palmCrown1(), palmPhase1, true)).a);
  return smoothstep(0.48, 0.50, p.y) * (1.0 - smoothstep(0.08, 0.35, solid));
}

void main() {
  vec2 p = vec2(v_uv.x, 1.0 - v_uv.y);
  float aspect = u_size.x / u_size.y;
  vec2 sunPos = coastSunCenter();
  vec3 color = vec3(0.0);

  if (p.y < 0.481) {
    color = mix(vec3(0.38, 0.66, 0.74), vec3(0.99, 0.86, 0.65), smoothstep(0.0, 0.49, p.y));
    vec2 sun = (p - sunPos) * vec2(aspect, 1.0);
    float disc = 1.0 - smoothstep(0.033, 0.036, length(sun));
    color += vec3(0.27, 0.19, 0.08) * exp(-length(sun) * 13.0);
    color = mix(color, vec3(1.0, 0.96, 0.78), disc);
    vec2 cloudP = vec2(p.x * 3.0 - u_wind.z * 0.10, p.y * 13.0 + sin(u_time * 0.18) * 0.08);
    float cloud = fbm(cloudP);
    color = mix(
      color,
      vec3(1.0, 0.94, 0.80),
      smoothstep(0.65 - u_environment.y * 0.45, 0.88 - u_environment.y * 0.4, cloud) * 0.62 * (1.0 - smoothstep(0.3, 0.44, p.y))
    );
  }

  vec3 waterWaveNormal = vec3(0.0, 0.0, 1.0);
  float waterDepth = max(0.0, (p.y - 0.475) / 0.525);
  if (p.y > 0.473) {
    vec3 skyEdge = color;
    vec2 flow = vec2(p.x * 45.0, p.y * 150.0 - u_time * 0.65);
    vec3 normal = waterNormal(p, aspect, waterDepth);
    waterWaveNormal = normal;
    float fresnel = waterFresnel(normal, waterDepth);
    float perspective = log(1.0 + waterDepth * 16.0) * 65.0;
    float ripple = sin(perspective - u_time * 1.3 + noise(flow) * 2.0);
    color = mix(vec3(0.12, 0.43, 0.49), vec3(0.43, 0.76, 0.67), pow(waterDepth, 0.65));
    color = mix(color, vec3(0.70, 0.81, 0.75), fresnel * 0.45);
    color = mix(vec3(0.64, 0.74, 0.69), color, smoothstep(0.0, 0.24, waterDepth));
    float caustic = pow(1.0 - abs(sin(fbm(flow * 0.34 + vec2(u_time * 0.045, 0.0)) * 24.0)), 18.0);
    color += vec3(0.055, 0.085, 0.048) * caustic * smoothstep(0.2, 0.9, waterDepth);
    float glint = exp(-pow((p.x - sunPos.x) / (0.014 + waterDepth * 0.12), 2.0));
    color = mix(
      color,
      vec3(1.0, 0.91, 0.68),
      glint * waterSparkle(normal) * (0.32 + waterDepth * 0.22) * (0.25 + 0.75 * pow(max(0.0, ripple), 3.0))
    );
    float wavePatch = smoothstep(0.28, 0.72, noise(vec2(p.x * 21.0 + u_time * 0.08, p.y * 37.0)));
    color += vec3(0.17, 0.24, 0.19) * pow(max(0.0, ripple), 25.0) * 0.13 * smoothstep(0.03, 0.4, waterDepth) * wavePatch;
    vec2 boatPos = u_boatCenter + u_boat;
    float behind = boatPos.x - p.x;
    float wy = abs(p.y - boatPos.y - 0.009);
    float wake = exp(-pow((wy - (0.002 + max(behind, 0.0) * 0.095)) * 400.0, 2.0))
      * smoothstep(0.005, 0.02, behind) * (1.0 - smoothstep(0.06, 0.19, behind));
    color += vec3(0.35, 0.40, 0.23) * wake * 0.6;
    color += vec3(0.12, 0.15, 0.10) * touchRipple(p, 0.475, coastWaterAt(u_touch.xy));
    color = mix(skyEdge, color, smoothstep(0.473, 0.481, p.y));
  }

  color = paintSails(color, p, aspect);

  // Clear shallow-water seabed shadow beneath the hull (daylight replaces the night stern lamp).
  vec2 shadowCenter = p - u_boat - vec2(0.006, 0.015 * (0.65 + waterDepth * 0.45)) + waterWaveNormal.xy * 0.0045;
  float seabedShadow = (
    boatMasks(shadowCenter).a * 0.5
    + boatMasks(shadowCenter + vec2(0.003, 0.0015)).a * 0.25
    + boatMasks(shadowCenter - vec2(0.003, 0.0015)).a * 0.25
  ) * smoothstep(0.49, 0.56, p.y);
  color = mix(color, color * vec3(0.55, 0.74, 0.76), seabedShadow * 0.46);

  vec4 boat = sampleBoat(p - u_boat);
  vec4 upperNeighbor = sampleBoat(p - u_boat + vec2(0.0, 1.2 / u_size.y));
  float sunRim = max(0.0, upperNeighbor.a - boat.a);
  color = mix(color, vec3(0.18, 0.24, 0.19), boat.a);
  color += vec3(0.34, 0.32, 0.22) * sunRim * 0.38;
  float oar = boatMasks(p - u_boat).r;
  color = mix(color, vec3(0.68, 0.63, 0.46), oar * 0.55);

  vec4 land = sampleLayer(u_foreground, p);
  land.rgb = mix(land.rgb, vec3(0.70, 0.77, 0.69), u_environment.z * (1.0 - smoothstep(0.47, 0.64, p.y)) * 0.38);
  color = over(color, land);
  color = paintSurf(color, p);
  color = beachPeople(color, p);
  color = over(color, sampleLayer(u_trunk0, palmUV(p, palmRoot0(), palmCrown0(), palmPhase0, false)));
  color = over(color, sampleLayer(u_leaves0, palmUV(p, palmRoot0(), palmCrown0(), palmPhase0, true)));
  color = over(color, sampleLayer(u_trunk1, palmUV(p, palmRoot1(), palmCrown1(), palmPhase1, false)));
  color = over(color, sampleLayer(u_leaves1, palmUV(p, palmRoot1(), palmCrown1(), palmPhase1, true)));
  color = applyAlbumPaper(color, gl_FragCoord.xy, 0.015);
  outColor = vec4(color, 1.0);
}
`;
