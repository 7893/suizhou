import { inkLayout } from "../composition.ts";

const WL = inkLayout.waterline.toFixed(2);

export const water = `
vec2 inkParallax(vec2 p, float shift) {
  float margin = abs(shift) * 0.85;
  float x = 0.5 + (p.x - 0.5) * (1.0 - margin * 2.0) - u_boat.x * shift;
  return vec2(clamp(x, 0.001, 0.999), p.y);
}

float inkWaterAt(vec2 p) {
  if (!touchActive()) return 0.0;
  float river = smoothstep(0.735, 0.755, p.y) * (1.0 - smoothstep(0.925, 0.975, p.y));
  float shore = sampleLayer(u_shore, inkParallax(p, 0.032)).a;
  float trees = sampleLayer(u_foliage, inkParallax(p, 0.04)).a;
  float vessel = sampleDayBoat(p - u_boat).a;
  return river * (1.0 - smoothstep(0.08, 0.3, max(shore, max(trees, vessel))));
}

vec3 paintWater(vec3 color, vec3 paper, vec2 p) {
  float river = smoothstep(0.725, 0.75, p.y) * (1.0 - smoothstep(0.925, 0.985, p.y));
  if (river < 0.001) return color;
  float depth = (p.y - ${WL}) / 0.25;
  float aspect = u_size.x / u_size.y;
  vec3 normal = waterNormal(p, aspect, depth);
  float fresnel = waterFresnel(normal, depth);
  // Domain-warped organic river breeze instead of equidistant horizontal sine bars.
  vec2 warp = vec2(
    fbm(vec2(p.x * 5.5 * aspect - u_wind.z * 0.03, p.y * 22.0)),
    fbm(vec2(p.x * 7.5 * aspect + 2.3, p.y * 34.0 - u_time * 0.14))
  );
  float breezePatch = smoothstep(0.28, 0.78, fbm(vec2(p.x * 4.2 * aspect - u_wind.z * 0.04, p.y * 16.0)));
  float flow = (warp.x - 0.5) * 1.15 + sin(p.y * 115.0 + warp.y * 4.5 - u_time * 1.15) * 0.28;
  float ring = touchRipple(p, ${WL}, inkWaterAt(u_touch.xy));
  ring *= 1.0 - smoothstep(0.08, 0.4, sampleLayer(u_shore, inkParallax(p, 0.032)).a);

  vec2 reflected = vec2(
    p.x + normal.x * (0.045 + depth * 0.05) + flow * 0.004 * depth + ring * 0.006,
    ${WL} - (p.y - ${WL}) * 2.02 + flow * 0.0028
  );
  vec3 reflection = paper;
  reflection = over(reflection, sampleLayer(u_far, inkParallax(reflected, 0.007)));
  reflection = over(reflection, sampleLayer(u_middle, inkParallax(reflected, 0.015)));
  reflection = over(reflection, sampleLayer(u_near, inkParallax(reflected, 0.025)));

  // Reflections stay glassy-calm near the far bank and dissolve softly under breeze patches.
  float silkBreak = mix(0.88, 0.58 + 0.42 * smoothstep(0.25, 0.8, warp.y), depth * breezePatch);
  float fade = (1.0 - smoothstep(0.81, 0.99, p.y)) * (0.39 + fresnel * 0.24) * river * silkBreak;
  color = mix(color, reflection, fade);

  // Delicate intermittent ink-wash micro-ripples guided by wind patches.
  float microWave = sin(p.y * 240.0 + warp.x * 9.5 + p.x * 16.0 - u_time * 1.25)
    * sin(p.y * 155.0 - warp.y * 7.0 + u_time * 0.85);
  float ripples = pow(max(0.0, microWave), 6.0) * breezePatch * smoothstep(0.05, 0.65, depth);
  color += vec3(0.045, 0.04, 0.024) * waterSparkle(normal) * river * 0.28;
  color -= vec3(0.095, 0.105, 0.082) * ripples * river * 0.15;

  // Soft ink-wash boat wake with subtle rhythmic oar-stroke rings.
  vec2 boat = u_boatCenter + u_boat;
  float behind = boat.x - p.x;
  float wakeWidth = 0.004 + max(behind, 0.0) * 0.085;
  float wakeY = abs(p.y - boat.y - 0.008);
  float banks = exp(-pow((wakeY - wakeWidth) * 280.0, 2.0));
  float innerWash = exp(-wakeY * 145.0) * (0.55 + 0.45 * sin(behind * 220.0 - u_time * 2.4 + warp.x * 3.0));
  float fadeWake = smoothstep(0.008, 0.028, behind) * (1.0 - smoothstep(0.05, 0.21, behind));
  color -= vec3(0.10, 0.11, 0.085) * (banks * 0.52 + innerWash * 0.26) * fadeWake;
  color -= vec3(0.055) * ring * river;
  return color;
}
`;
