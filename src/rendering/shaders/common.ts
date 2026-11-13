export const vertex = `#version 300 es
in vec2 aPosition;
out vec2 v_uv;
void main() {
  v_uv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const noise = `
float hash(vec2 p) {
  return fract(sin(dot(mod(p, 256.0), vec2(12.9898, 78.233))) * 437.585);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

float fbm(vec2 p) {
  return noise(p) * 0.57 + noise(p * 2.03 + 7.1) * 0.29 + noise(p * 4.07 - 3.4) * 0.14;
}

vec3 over(vec3 base, vec4 paint) {
  return mix(base, paint.rgb, paint.a);
}

vec4 sampleLayer(sampler2D source, vec2 p) {
  if (any(lessThan(p, vec2(0.0))) || any(greaterThan(p, vec2(1.0)))) return vec4(0.0);
  return texture(source, p);
}

// Subtle cotton/woodblock album paper texture shared across painted scenes.
vec3 applyAlbumPaper(vec3 color, vec2 fragCoord, float strength) {
  float fiberX = noise(fragCoord * vec2(0.055, 0.32)) - 0.5;
  float fiberY = noise(fragCoord * vec2(0.28, 0.06) + 19.3) - 0.5;
  float speck = hash(fragCoord) - 0.5;
  float weave = fiberX * 0.55 + fiberY * 0.35 + speck * 0.28;
  vec3 tint = vec3(1.04, 1.01, 0.94) * weave;
  return clamp(color + tint * strength, 0.0, 1.0);
}
`;
