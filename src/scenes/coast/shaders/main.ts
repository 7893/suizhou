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

// One or two distant white coastal gulls gliding unhurriedly across the sunlit sky.
vec3 paintSeagulls(vec3 color, vec2 p, float aspect) {
  float passage = mod(u_time + 5.0, 46.0);
  if (passage > 28.0 || p.y < 0.08 || p.y > 0.42) return color;
  for (int i = 0; i < 2; i++) {
    float f = float(i);
    float x = 1.12 - passage * (0.044 + f * 0.004) + f * 0.075;
    float y = 0.21 + f * 0.042 + sin(x * 6.5 + f * 1.4) * 0.018;
    vec2 q = (p - vec2(x, y)) * vec2(aspect, 1.0);
    q /= min(aspect, 1.0) * (0.0085 - f * 0.0014);
    float glide = sin(u_time * 3.8 + f * 2.1) * 0.36;
    float wingY = -abs(q.x) * (0.25 + glide) + 0.22 * q.x * q.x;
    float stroke = (1.0 - smoothstep(0.08, 0.21, abs(q.y - wingY))) * (1.0 - smoothstep(0.72, 1.12, abs(q.x)));
    color = mix(color, vec3(0.98, 0.96, 0.89), stroke * (0.72 - f * 0.14));
  }
  return color;
}

float coastWaterAt(vec2 p) {
  if (!touchActive()) return 0.0;
  float solid = max(sampleLayer(u_foreground, p).a, sampleDayBoat(p - u_boat).a);
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
    color = mix(vec3(0.37, 0.65, 0.75), vec3(0.99, 0.86, 0.65), smoothstep(0.0, 0.49, p.y));
    vec2 sun = (p - sunPos) * vec2(aspect, 1.0);
    float disc = 1.0 - smoothstep(0.033, 0.036, length(sun));
    color += vec3(0.28, 0.20, 0.08) * exp(-length(sun) * 12.5);
    color = mix(color, vec3(1.0, 0.96, 0.80), disc);
    vec2 cloudP = vec2(p.x * 3.0 - u_wind.z * 0.10, p.y * 13.0 + sin(u_time * 0.18) * 0.08);
    float cloud = fbm(cloudP);
    color = mix(
      color,
      vec3(1.0, 0.95, 0.82),
      smoothstep(0.64 - u_environment.y * 0.45, 0.88 - u_environment.y * 0.4, cloud) * 0.62 * (1.0 - smoothstep(0.3, 0.44, p.y))
    );
    color = paintSeagulls(color, p, aspect);
  }

  vec3 waterWaveNormal = vec3(0.0, 0.0, 1.0);
  float waterDepth = max(0.0, (p.y - 0.475) / 0.525);
  if (p.y > 0.473) {
    vec3 skyEdge = color;
    vec2 flow = vec2(p.x * 42.0 * aspect, p.y * 135.0 - u_time * 0.62);
    vec3 normal = waterNormal(p, aspect, waterDepth);
    waterWaveNormal = normal;
    float fresnel = waterFresnel(normal, waterDepth);
    float perspective = log(1.0 + waterDepth * 15.0) * 58.0;
    float swellNoise = fbm(vec2(p.x * 16.0 * aspect + u_time * 0.05, p.y * 42.0 - u_time * 0.16));
    float ripple = sin(perspective - u_time * 1.2 + swellNoise * 4.5);

    color = mix(vec3(0.11, 0.44, 0.51), vec3(0.42, 0.77, 0.68), pow(waterDepth, 0.64));
    color = mix(color, vec3(0.72, 0.83, 0.77), fresnel * 0.42);
    color = mix(vec3(0.65, 0.75, 0.70), color, smoothstep(0.0, 0.22, waterDepth));

    // Gentle drifting cloud shadow gliding across the open turquoise bay.
    float cloudShade = smoothstep(0.56, 0.84, fbm(vec2(p.x * 2.4 - u_wind.z * 0.06, p.y * 5.2)));
    color = mix(color, color * vec3(0.84, 0.90, 0.93), cloudShade * smoothstep(0.04, 0.55, waterDepth) * (1.0 - smoothstep(0.55, 0.92, waterDepth)) * 0.34);

    // Subtle sunlit seabed caustics in clear turquoise shallows.
    float caustic = pow(1.0 - abs(sin(fbm(flow * 0.34 + vec2(u_time * 0.045, 0.0)) * 22.0)), 16.0);
    color += vec3(0.06, 0.09, 0.052) * caustic * smoothstep(0.22, 0.92, waterDepth);

    // Crisp dancing diamond Sun Glitter replacing horizontal zebra bands.
    float sunSpan = 0.018 + waterDepth * 0.11;
    float sunCorridor = exp(-pow((p.x - sunPos.x) / sunSpan, 2.0));
    vec2 glitterUv = vec2(p.x * 165.0 * aspect, log(1.0 + waterDepth * 22.0) * 95.0);
    float facetA = noise(glitterUv + vec2(u_time * 0.42, -u_time * 0.95));
    float facetB = noise(glitterUv * 1.73 + vec2(-u_time * 0.35, -u_time * 1.25));
    float diamond = pow(smoothstep(0.54, 0.96, facetA * facetB * 1.55), 2.4);
    float softSheen = waterSparkle(normal) * (0.45 + 0.55 * facetA);
    color += vec3(1.0, 0.93, 0.72) * sunCorridor * (diamond * 0.72 + softSheen * 0.34) * (0.42 + waterDepth * 0.32) * (1.0 - cloudShade * 0.45);

    float wavePatch = smoothstep(0.32, 0.74, noise(vec2(p.x * 19.0 + u_time * 0.07, p.y * 34.0)));
    color += vec3(0.16, 0.23, 0.19) * pow(max(0.0, ripple), 22.0) * 0.10 * smoothstep(0.04, 0.45, waterDepth) * wavePatch;

    // Soft rhythmic hand-rowed wake & gentle oar-stroke foam ripples (no harsh laser lines).
    vec2 boatPos = u_boatCenter + u_boat;
    float behind = boatPos.x - p.x;
    float wy = abs(p.y - boatPos.y - 0.009);
    float wakeJitter = (noise(vec2(p.x * 95.0, p.y * 190.0 - u_time * 1.2)) - 0.5) * 0.004;
    float wakeSpread = 0.0035 + max(behind, 0.0) * 0.078;
    float wakeEdge = exp(-pow((wy + wakeJitter - wakeSpread) * 230.0, 2.0));
    float wakeFoam = exp(-wy * 130.0) * smoothstep(0.38, 0.78, noise(vec2(behind * 110.0 - u_time * 1.8, wy * 340.0)));
    float oarPulse = 0.65 + 0.35 * sin(behind * 130.0 - u_time * 1.75);
    float wakeFade = smoothstep(0.006, 0.024, behind) * (1.0 - smoothstep(0.045, 0.18, behind));
    color += vec3(0.36, 0.44, 0.32) * (wakeEdge * 0.42 + wakeFoam * 0.28) * oarPulse * wakeFade;

    color += vec3(0.12, 0.15, 0.10) * touchRipple(p, 0.475, coastWaterAt(u_touch.xy));
    color = mix(skyEdge, color, smoothstep(0.473, 0.481, p.y));
  }

  color = paintSails(color, p, aspect);

  // Clear shallow-water seabed shadow beneath the clean daylight skiff.
  vec2 shadowCenter = p - u_boat - vec2(0.006, 0.015 * (0.65 + waterDepth * 0.45)) + waterWaveNormal.xy * 0.0045;
  float seabedShadow = (
    sampleDayBoat(shadowCenter).a * 0.5
    + sampleDayBoat(shadowCenter + vec2(0.003, 0.0015)).a * 0.25
    + sampleDayBoat(shadowCenter - vec2(0.003, 0.0015)).a * 0.25
  ) * smoothstep(0.49, 0.56, p.y);
  color = mix(color, color * vec3(0.55, 0.74, 0.76), seabedShadow * 0.46);

  vec4 boat = sampleDayBoat(p - u_boat);
  vec4 upperNeighbor = sampleDayBoat(p - u_boat + vec2(0.0, 1.2 / u_size.y));
  float sunRim = max(0.0, upperNeighbor.a - boat.a);
  color = mix(color, vec3(0.18, 0.24, 0.19), boat.a);
  color += vec3(0.36, 0.34, 0.23) * sunRim * 0.40;
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
