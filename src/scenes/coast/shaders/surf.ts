import { shoreline } from "../shore.ts";

export const surf = `
${shoreline}
vec3 paintSurf(vec3 color, vec2 p) {
  if (p.y < 0.78) return color;
  vec4 material = sampleLayer(u_shore, p);
  if (material.b > 0.5) return color;
  float distance = p.y - beachHeight(p.x);
  float swell = 0.5 + 0.5 * sin(u_time * 0.78 - p.x * 5.0 + u_wind.x * 0.3);
  float reach = -0.012 + 0.032 * pow(swell, 1.7);
  float grain = noise(vec2(p.x * 170.0, p.y * 300.0 - u_time * 0.6));
  float edge = distance - reach + (grain - 0.5) * 0.004;
  float wash = (1.0 - smoothstep(-0.002, 0.003, edge)) * smoothstep(-0.032, -0.003, distance);
  float wetReach = 0.015 + 0.029 * (0.5 + 0.5 * sin(u_time * 0.78 - p.x * 5.0 - 0.9));
  float wet = (1.0 - smoothstep(wetReach, wetReach + 0.014, distance)) * smoothstep(-0.003, 0.005, distance);
  // Damp sand darkens, while a receding water film briefly mirrors the warm coastal sky.
  color = mix(color, color * vec3(0.73, 0.79, 0.80), wet * material.r * 0.78);
  float glaze = wet * material.r * (0.28 + 0.72 * pow(1.0 - swell, 0.85)) * (1.0 - smoothstep(0.0, wetReach, distance) * 0.55);
  color = mix(color, vec3(0.78, 0.86, 0.85), glaze * 0.34);
  color = mix(color, vec3(0.53, 0.73, 0.63), wash * material.r * 0.32);
  float sheen = wet * material.r * pow(max(0.0, sin(p.y * 280.0 - u_time * 1.3 + p.x * 19.0)), 10.0);
  color += vec3(0.15, 0.14, 0.09) * sheen * (0.45 + 0.35 * (1.0 - swell));
  float foam = exp(-pow(edge * 430.0, 2.0)) * (0.45 + 0.55 * grain);
  float lace = exp(-pow((edge + 0.007) * 270.0, 2.0)) * smoothstep(0.50, 0.75, grain) * (1.0 - swell) * 0.68;
  color = mix(color, vec3(0.97, 0.97, 0.87), clamp((foam + lace) * (1.0 - material.g), 0.0, 0.86));
  // Sample the actual rock mask, so breakers follow the drawn boulders.
  vec2 offset = vec2(3.0 / u_size.x, 3.0 / u_size.y);
  float rocks = max(
    sampleLayer(u_shore, p + vec2(0.0, offset.y)).g,
    max(sampleLayer(u_shore, p + offset).g, sampleLayer(u_shore, p + vec2(-offset.x, offset.y)).g)
  );
  float breaker = rocks * (1.0 - material.g) * (0.35 + 0.65 * swell) * (0.55 + 0.45 * grain);
  color = mix(color, vec3(0.94, 0.97, 0.87), breaker * 0.8);
  return color;
}
`;
