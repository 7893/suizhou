import { boat } from "../../../rendering/shaders/boat.ts";
import { noise } from "../../../rendering/shaders/common.ts";
import { ripples } from "../../../rendering/shaders/ripples.ts";
import { skyEffects } from "../../../rendering/shaders/sky.ts";
import { surface } from "../../../rendering/shaders/surface.ts";
import { cityLayout } from "../composition.ts";
import { lights } from "./lights.ts";

const WL = cityLayout.waterline.toFixed(2);

export const fragment = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 outColor;
uniform sampler2D u_buildings, u_lights, u_bank, u_glow, u_windows, u_boatLayer;
uniform vec2 u_size, u_boat, u_boatCenter, u_actorScale;
uniform float u_time;
uniform vec3 u_touch, u_environment;
uniform vec4 u_wind;
${noise}
${surface}
${boat}
${ripples}
${lights}
${skyEffects}

vec3 skyline(vec2 p, vec3 lamps, vec3 spill) {
  vec3 top = vec3(0.025, 0.052, 0.079);
  vec3 horizon = vec3(0.17, 0.22, 0.245);
  vec3 color = mix(top, horizon, pow(clamp(p.y / 0.72, 0.0, 1.0), 1.7));
  float haze = fbm(vec2(p.x * 4.0 - u_wind.z * 0.018, p.y * 8.0));
  color += vec3(0.035, 0.035, 0.028) * (0.65 + u_environment.z) * haze * smoothstep(0.2, 0.7, p.y);
  color += skyStars(p, u_size, u_time, 0.84) * (1.0 - u_environment.y * 0.8);
  color = over(color, sampleLayer(u_buildings, p));
  color += lamps;
  color += spill * 0.85;
  return color;
}

float cityWaterAt(vec2 p) {
  if (!touchActive()) return 0.0;
  float solid = max(sampleLayer(u_bank, p).a, sampleBoat(p - u_boat).a);
  return smoothstep(0.645, 0.66, p.y) * (1.0 - smoothstep(0.08, 0.35, solid));
}

float bridgeVaultGlow(float x) {
  float span = smoothstep(0.42, 0.47, x) * (1.0 - smoothstep(0.87, 0.92, x));
  float arches = 0.55 + 0.45 * sin((x - 0.42) * 18.85);
  return span * arches;
}

float nearBankWarmth(vec2 p) {
  float rightSpan = exp(-pow((p.x - 0.87) / 0.11, 2.0));
  return rightSpan * smoothstep(0.76, 0.94, p.y);
}

void main() {
  vec2 p = vec2(v_uv.x, 1.0 - v_uv.y);
  vec3 color;
  if (p.y > ${WL}) {
    float depth = (p.y - ${WL}) / 0.36;
    float waves = sin(p.y * 210.0 - u_time * 1.65 + p.x * 9.0) * 0.34
      + sin(p.y * 437.0 + u_time * 1.2 + p.x * 23.0) * 0.16;
    waves += (noise(vec2(p.x * 85.0, p.y * 180.0 - u_time * 0.65)) - 0.5) * 0.5;
    vec3 normal = waterNormal(p, u_size.x / u_size.y, depth);
    float fresnel = waterFresnel(normal, depth);
    vec2 reflected = vec2(
      p.x + normal.x * (0.012 + depth * 0.07) + waves * 0.001,
      0.635 - (p.y - ${WL}) * 1.28 + waves * 0.002
    );
    vec3 lamps = animatedLights(reflected);
    vec3 spill = lightSpill(reflected);
    vec3 reflectedCity = skyline(reflected, lamps, spill);
    vec3 water = mix(vec3(0.055, 0.13, 0.18), vec3(0.025, 0.075, 0.12), depth);
    float breaks = 0.35 + 0.65 * noise(vec2(p.x * 95.0, p.y * 640.0 - u_time * 1.5));
    color = mix(water, reflectedCity, (0.23 + fresnel * 0.45) * (1.0 - depth * 0.5));
    color += lamps * breaks * (1.25 - depth * 0.45);
    vec3 spread = animatedLights(reflected + vec2(0.002, 0.0)) + animatedLights(reflected - vec2(0.002, 0.0));
    color += spread * breaks * 0.18;
    color += spill * (0.65 + 0.35 * breaks) * (1.0 - depth * 0.6);
    // Warm arch-vault shimmer below the mid-river bridge and near-bank lantern reflections.
    float vault = bridgeVaultGlow(p.x + normal.x * 0.015) * (1.0 - smoothstep(0.64, 0.77, p.y));
    color += vec3(0.30, 0.20, 0.08) * vault * breaks * 0.36;
    color += vec3(0.32, 0.21, 0.09) * nearBankWarmth(p + vec2(normal.x * 0.02, 0.0)) * breaks * 0.32;
    color += vec3(0.08, 0.11, 0.12) * waterSparkle(normal) * fresnel;
    color += vec3(0.13, 0.16, 0.17) * pow(max(0.0, sin(p.y * 485.0 + p.x * 13.0 - u_time * 1.6)), 18.0) * 0.055;
    vec2 boat = u_boatCenter + u_boat;
    float behind = boat.x - p.x;
    float wy = abs(p.y - boat.y - 0.009);
    float wake = exp(-pow((wy - (0.002 + max(behind, 0.0) * 0.095)) * 400.0, 2.0));
    wake *= smoothstep(0.005, 0.02, behind) * (1.0 - smoothstep(0.06, 0.19, behind));
    color += vec3(0.37, 0.30, 0.16) * wake * 0.24;
    color += vec3(0.10, 0.13, 0.14) * touchRipple(p, ${WL}, cityWaterAt(u_touch.xy));
  } else {
    color = skyline(p, animatedLights(p), lightSpill(p));
  }

  // Evening strollers along the opposite promenade with natural stride bobbing and lamp rim-light.
  if (p.y > 0.594 && p.y < 0.618) {
    float scale = max(0.65, u_size.y / 1000.0);
    for (int i = 0; i < 6; i++) {
      float fi = float(i);
      float dir = mod(fi, 2.0) < 0.5 ? 1.0 : -1.0;
      float speed = (0.0014 + mod(fi, 3.0) * 0.00025) * dir;
      float baseX = fract(fi * 0.167 + 0.06 + u_time * speed);
      for (int companion = 0; companion < 2; companion++) {
        if (companion == 1 && mod(fi, 2.0) > 0.5) continue;
        float cx = baseX + float(companion) * 0.0045;
        float stride = u_time * 4.4 + fi * 1.9 + float(companion) * 1.2;
        float bob = abs(sin(stride)) * 0.45;
        vec2 q = (p - vec2(cx, 0.611)) * u_size / scale;
        q.y += bob;
        float head = 1.0 - smoothstep(0.85, 1.35, length(q - vec2(0.0, -5.2)));
        float torso = (1.0 - smoothstep(0.75, 1.3, abs(q.x - sin(stride) * 0.12)))
          * smoothstep(-4.1, -3.5, q.y) * (1.0 - smoothstep(-0.8, -0.2, q.y));
        float legA = (1.0 - smoothstep(0.35, 0.75, abs(q.x - sin(stride) * 0.65)))
          * smoothstep(-1.1, -0.5, q.y) * (1.0 - smoothstep(0.8, 1.3, q.y));
        float legB = (1.0 - smoothstep(0.35, 0.75, abs(q.x + sin(stride) * 0.65)))
          * smoothstep(-1.1, -0.5, q.y) * (1.0 - smoothstep(0.8, 1.3, q.y));
        float figure = clamp(max(head, max(torso, max(legA, legB))), 0.0, 1.0);
        // Softly shelter strollers behind denser promenade tree canopies.
        float canopy = smoothstep(0.55, 0.95, sampleLayer(u_buildings, p - vec2(0.0, 0.008)).a);
        vec3 coat = mix(vec3(0.055, 0.095, 0.105), vec3(0.22, 0.18, 0.12), head * 0.35);
        color = mix(color, coat, figure * (0.82 - canopy * 0.32));
      }
    }
  }

  vec2 bankP = p;
  bankP.x += (u_wind.x * 0.002 + sin(u_time * 0.85 + p.y * 15.0) * 0.0005)
    * clamp((0.86 - p.y) / 0.17, 0.0, 1.0) * (1.0 - smoothstep(0.12, 0.23, p.x));
  vec4 bank = sampleLayer(u_bank, bankP);
  color = over(color, bank);

  vec4 boat = sampleBoat(p - u_boat);
  vec4 neighbor = sampleBoat(p - u_boat + vec2(0.0, 1.2 / u_size.y));
  vec2 boatWorld = u_boatCenter + u_boat;
  float bridgeAndBankGlow = max(bridgeVaultGlow(boatWorld.x) * 0.45, nearBankWarmth(boatWorld));
  float rim = max(0.0, neighbor.a - boat.a * (1.0 - bank.a));
  vec3 hullTone = mix(vec3(0.035, 0.07, 0.085), vec3(0.078, 0.072, 0.055), bridgeAndBankGlow * 0.5);
  color = mix(color, hullTone, boat.a * (1.0 - bank.a));
  color += vec3(0.90, 0.64, 0.30) * rim * (0.65 + bridgeAndBankGlow * 0.48) * (1.0 - bank.a);
  float oar = boatMasks(p - u_boat).r;
  color = mix(color, vec3(0.72, 0.59, 0.36), oar * (0.8 + bridgeAndBankGlow * 0.15) * (1.0 - bank.a));
  color = boatLamp(color, p - u_boat, 0.8 * (1.0 - bank.a), u_time);

  color *= 1.0 - 0.18 * pow(length((p - 0.5) * vec2(1.0, 0.8)), 2.0);
  color = applyAlbumPaper(color, gl_FragCoord.xy, 0.018);
  outColor = vec4(color, 1.0);
}
`;
