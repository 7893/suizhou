import { shoreline } from "../shore.ts";

export const surf = `
${shoreline}
vec3 paintSurf(vec3 color, vec2 p) {
  if (p.y < 0.78) return color;
  vec4 material = sampleLayer(u_shore, p);
  if (material.b > 0.5) return color;
  float distance = p.y - beachHeight(p.x);
  // Two gentle staggered surf swells create authentic overlapping shoreline foam lace.
  float swell = 0.5 + 0.5 * sin(u_time * 0.78 - p.x * 5.0 + u_wind.x * 0.3);
  float swell2 = 0.5 + 0.5 * sin(u_time * 0.78 - p.x * 5.6 + 2.35 + u_wind.x * 0.25);
  float reach = -0.012 + 0.032 * pow(swell, 1.65);
  float reach2 = -0.014 + 0.025 * pow(swell2, 1.8);
  float grain = noise(vec2(p.x * 175.0, p.y * 310.0 - u_time * 0.58));
  float fineGrain = noise(vec2(p.x * 340.0 + 3.1, p.y * 520.0 - u_time * 0.9));
  float edge = distance - reach + (grain - 0.5) * 0.0045;
  float edge2 = distance - reach2 + (fineGrain - 0.5) * 0.004;
  float wash = (1.0 - smoothstep(-0.002, 0.003, edge)) * smoothstep(-0.034, -0.003, distance);

  float wetReach = 0.018 + 0.033 * (0.5 + 0.5 * sin(u_time * 0.78 - p.x * 5.0 - 0.85));
  float wet = (1.0 - smoothstep(wetReach, wetReach + 0.016, distance)) * smoothstep(-0.003, 0.004, distance);
  // Damp sand darkens, while the receding thin water film mirrors the warm sky like glass.
  color = mix(color, color * vec3(0.72, 0.78, 0.79), wet * material.r * 0.76);
  float recede = 0.30 + 0.70 * pow(1.0 - swell, 0.85);
  float glaze = wet * material.r * recede * (1.0 - smoothstep(0.0, wetReach, distance) * 0.5);
  vec3 skyMirror = mix(vec3(0.76, 0.88, 0.88), vec3(0.98, 0.90, 0.74), 0.38);
  color = mix(color, skyMirror, glaze * 0.46);
  color = mix(color, vec3(0.50, 0.74, 0.65), wash * material.r * 0.34);

  float sheen = wet * material.r * pow(max(0.0, sin(p.y * 260.0 - u_time * 1.25 + p.x * 19.0)), 9.0);
  color += vec3(0.18, 0.16, 0.10) * sheen * (0.45 + 0.40 * (1.0 - swell));

  float foam1 = exp(-pow(edge * 410.0, 2.0)) * (0.48 + 0.52 * grain);
  float lace1 = exp(-pow((edge + 0.0075) * 250.0, 2.0)) * smoothstep(0.46, 0.74, fineGrain) * (0.35 + 0.65 * (1.0 - swell)) * 0.72;
  float foam2 = exp(-pow(edge2 * 450.0, 2.0)) * (0.35 + 0.65 * fineGrain) * 0.52;
  color = mix(color, vec3(0.98, 0.98, 0.90), clamp((foam1 + lace1 + foam2) * (1.0 - material.g), 0.0, 0.90));

  // Sample the actual rock mask, so breakers follow the drawn boulders.
  vec2 offset = vec2(3.0 / u_size.x, 3.0 / u_size.y);
  float rocks = max(
    sampleLayer(u_shore, p + vec2(0.0, offset.y)).g,
    max(sampleLayer(u_shore, p + offset).g, sampleLayer(u_shore, p + vec2(-offset.x, offset.y)).g)
  );
  float breaker = rocks * (1.0 - material.g) * (0.35 + 0.65 * swell) * (0.55 + 0.45 * grain);
  color = mix(color, vec3(0.95, 0.98, 0.89), breaker * 0.82);
  return color;
}
`;
