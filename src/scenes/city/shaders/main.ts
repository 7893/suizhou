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
  vec3 top = vec3(0.022, 0.044, 0.072);
  vec3 horizon = vec3(0.145, 0.195, 0.232);
  vec3 color = mix(top, horizon, pow(clamp(p.y / 0.72, 0.0, 1.0), 1.65));
  // Subtle warm CBD urban skyglow dome behind China Zun & Liangma River.
  float cbdDome = exp(-pow((p.x - 0.54) / 0.34, 2.0)) * smoothstep(0.14, 0.64, p.y);
  color += vec3(0.085, 0.068, 0.044) * cbdDome * (0.78 + u_environment.z * 0.45);
  // Slow drifting night clouds softly under-lit by the city horizon glow.
  float haze = fbm(vec2(p.x * 3.6 - u_wind.z * 0.018, p.y * 7.5 + sin(u_time * 0.05) * 0.15));
  float cloudMask = smoothstep(0.42, 0.80, haze) * smoothstep(0.08, 0.56, p.y) * (1.0 - smoothstep(0.54, 0.66, p.y));
  color += mix(vec3(0.032, 0.046, 0.056), vec3(0.09, 0.075, 0.052), cbdDome) * cloudMask * (0.65 + u_environment.z * 0.6);
  // Sparse, pinpoint high-altitude stars (clear Beijing evening, not snow).
  color += skyStars(p, u_size, u_time, 0.945) * (1.0 - u_environment.y * 0.75) * (1.0 - cloudMask * 0.65);
  color = over(color, sampleLayer(u_buildings, p));
  color += lamps;
  color += spill * 0.90;
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
  float aspect = u_size.x / u_size.y;
  vec3 color;
  if (p.y > ${WL}) {
    float depth = (p.y - ${WL}) / 0.36;
    float waves = sin(p.y * 210.0 - u_time * 1.65 + p.x * 9.0) * 0.36
      + sin(p.y * 437.0 + u_time * 1.2 + p.x * 23.0) * 0.18;
    waves += (noise(vec2(p.x * 78.0, p.y * 170.0 - u_time * 0.72)) - 0.5) * 0.58;
    vec3 normal = waterNormal(p, aspect, depth);
    float fresnel = waterFresnel(normal, depth);
    float blurDx = 0.0022 + depth * 0.0075;
    vec2 reflected = vec2(
      p.x + normal.x * (0.016 + depth * 0.085) + waves * (0.0014 + depth * 0.0022),
      0.635 - (p.y - ${WL}) * 1.28 + waves * (0.002 + depth * 0.0025)
    );
    vec3 lampsC = animatedLights(reflected);
    vec3 lampsL = animatedLights(reflected - vec2(blurDx, 0.0));
    vec3 lampsR = animatedLights(reflected + vec2(blurDx, 0.0));
    vec3 lamps = lampsC * 0.52 + (lampsL + lampsR) * 0.24;
    vec3 spill = lightSpill(reflected);
    // Softly blurred skyline reflection dissolves naturally with depth rather than hard mirror edges.
    vec3 reflectedCity = skyline(reflected, lampsC, spill) * 0.56
      + (skyline(reflected - vec2(blurDx * 1.2, 0.0), lampsL, spill)
        + skyline(reflected + vec2(blurDx * 1.2, 0.0), lampsR, spill)) * 0.22;

    vec3 water = mix(vec3(0.048, 0.118, 0.168), vec3(0.018, 0.062, 0.105), depth);
    float ribbon = 0.42 + 0.58 * pow(0.5 + 0.5 * sin(p.y * 540.0 + waves * 3.8 - u_time * 1.9), 2.0);
    float breaks = (0.32 + 0.68 * noise(vec2(p.x * 88.0, p.y * 580.0 - u_time * 1.65))) * ribbon;
    color = mix(water, reflectedCity, (0.24 + fresnel * 0.42) * (1.0 - depth * 0.52));

    // Shattered-gold anisotropic vertical light columns shimmering down the night water.
    vec3 column = lamps * breaks * (1.42 - depth * 0.42);
    vec3 verticalTail = animatedLights(vec2(reflected.x, clamp(reflected.y + 0.018 * depth, 0.28, 0.63)))
      + animatedLights(vec2(reflected.x, clamp(reflected.y - 0.012 * depth, 0.28, 0.63)));
    color += column + verticalTail * breaks * 0.24 * (1.0 - depth * 0.45);
    color += spill * (0.68 + 0.32 * breaks) * (1.0 - depth * 0.56);

    // Warm arch-vault shimmer below the mid-river bridge and near-bank lantern reflections.
    float vault = bridgeVaultGlow(p.x + normal.x * 0.018) * (1.0 - smoothstep(0.64, 0.78, p.y));
    color += vec3(0.34, 0.22, 0.09) * vault * breaks * 0.42;
    color += vec3(0.34, 0.22, 0.09) * nearBankWarmth(p + vec2(normal.x * 0.022, 0.0)) * breaks * 0.34;
    color += vec3(0.09, 0.12, 0.13) * waterSparkle(normal) * fresnel;
    color += vec3(0.14, 0.17, 0.18) * pow(max(0.0, sin(p.y * 485.0 + p.x * 13.0 - u_time * 1.6)), 18.0) * 0.055;

    // Warm amber stern-lantern reflection pool dancing on the dark river beneath the boat.
    vec2 boat = u_boatCenter + u_boat;
    vec2 lanternWater = boat + vec2(-18.0 * u_actorScale.x, 0.011);
    vec2 lq = (p - lanternWater) * vec2(aspect, 1.0);
    lq.x += sin(p.y * 340.0 - u_time * 2.6) * 0.0035;
    float lanternPool = exp(-pow(lq.x / 0.036, 2.0)) * exp(-pow((lq.y - 0.008) / 0.024, 2.0))
      * smoothstep(boat.y - 0.004, boat.y + 0.008, p.y);
    float lanternFlicker = 0.9 + 0.1 * sin(u_time * 3.2);
    color += vec3(0.95, 0.56, 0.19) * lanternPool * (0.36 + 0.64 * breaks) * 0.62 * lanternFlicker;

    // Soft golden-kissed wake behind the gliding night boat.
    float behind = boat.x - p.x;
    float wy = abs(p.y - boat.y - 0.009);
    float wake = exp(-pow((wy - (0.003 + max(behind, 0.0) * 0.088)) * 310.0, 2.0));
    float wakeShimmer = 0.62 + 0.38 * sin(behind * 240.0 - u_time * 2.8);
    wake *= smoothstep(0.006, 0.024, behind) * (1.0 - smoothstep(0.06, 0.21, behind));
    color += vec3(0.55, 0.39, 0.18) * wake * wakeShimmer * 0.34;
    color += vec3(0.12, 0.15, 0.16) * touchRipple(p, ${WL}, cityWaterAt(u_touch.xy));
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
  vec3 hullTone = mix(vec3(0.042, 0.078, 0.094), vec3(0.10, 0.088, 0.062), 0.3 + bridgeAndBankGlow * 0.5);
  color = mix(color, hullTone, boat.a * (1.0 - bank.a));
  color += vec3(0.95, 0.68, 0.34) * rim * (0.78 + bridgeAndBankGlow * 0.48) * (1.0 - bank.a);
  float oar = boatMasks(p - u_boat).r;
  color = mix(color, vec3(0.78, 0.64, 0.40), oar * (0.85 + bridgeAndBankGlow * 0.15) * (1.0 - bank.a));
  color = boatLamp(color, p - u_boat, 1.05 * (1.0 - bank.a), u_time);

  color *= 1.0 - 0.16 * pow(length((p - 0.5) * vec2(1.0, 0.8)), 2.0);
  color = applyAlbumPaper(color, gl_FragCoord.xy, 0.018);
  outColor = vec4(color, 1.0);
}
`;
