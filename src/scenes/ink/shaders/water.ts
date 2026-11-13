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
  float vessel = sampleBoat(p - u_boat).a;
  return river * (1.0 - smoothstep(0.08, 0.3, max(shore, max(trees, vessel))));
}

vec3 paintWater(vec3 color, vec3 paper, vec2 p) {
  float river = smoothstep(0.725, 0.75, p.y) * (1.0 - smoothstep(0.925, 0.985, p.y));
  if (river < 0.001) return color;
  float depth = (p.y - ${WL}) / 0.25;
  vec3 normal = waterNormal(p, u_size.x / u_size.y, depth);
  float fresnel = waterFresnel(normal, depth);
  float flow = sin(p.y * 155.0 - u_time * 1.8 + p.x * 12.0) * 0.6
    + sin(p.y * 287.0 + u_time * 1.35) * 0.3;
  float ring = touchRipple(p, ${WL}, inkWaterAt(u_touch.xy));
  ring *= 1.0 - smoothstep(0.08, 0.4, sampleLayer(u_shore, inkParallax(p, 0.032)).a);
  vec2 reflected = vec2(
    p.x + normal.x * 0.09 * depth + flow * 0.005 * depth + ring * 0.006,
    ${WL} - (p.y - ${WL}) * 2.05 + flow * 0.004
  );
  vec3 reflection = paper;
  reflection = over(reflection, sampleLayer(u_far, inkParallax(reflected, 0.007)));
  reflection = over(reflection, sampleLayer(u_middle, inkParallax(reflected, 0.015)));
  reflection = over(reflection, sampleLayer(u_near, inkParallax(reflected, 0.025)));
  float broken = 0.55 + 0.45 * smoothstep(-0.5, 0.8, sin(p.y * 560.0 + flow * 2.0));
  float fade = (1.0 - smoothstep(0.80, 0.99, p.y)) * (0.40 + fresnel * 0.25) * river * broken;
  color = mix(color, reflection, fade);
  float ripples = pow(max(0.0, sin(p.y * 470.0 + sin(p.x * 29.0 + u_time * 0.38) * 2.0 - u_time * 1.65)), 14.0);
  color += vec3(0.05, 0.045, 0.025) * waterSparkle(normal) * river * 0.35;
  color -= vec3(0.11, 0.12, 0.09) * ripples * river * 0.18;
  vec2 boat = u_boatCenter + u_boat;
  float behind = boat.x - p.x;
  float wakeWidth = 0.003 + max(behind, 0.0) * 0.095;
  float wakeY = abs(p.y - boat.y - 0.008);
  float banks = exp(-pow((wakeY - wakeWidth) * 430.0, 2.0));
  float trail = exp(-wakeY * 170.0) * (0.5 + 0.5 * sin(behind * 340.0 - u_time * 3.0));
  float fadeWake = smoothstep(0.008, 0.025, behind) * (1.0 - smoothstep(0.04, 0.19, behind));
  color -= vec3(0.13, 0.14, 0.11) * (banks * 0.8 + trail * 0.35) * fadeWake;
  color -= vec3(0.055) * ring * river;
  return color;
}
`;
