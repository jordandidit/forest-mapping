import{t as e}from"./glsl-Cd37kqnI.js";import{i as t}from"./Matrix4BindUniform-CcMQBvOS.js";import{en as n,ln as r,un as i}from"./verticalOffsetUtils-DMFlvZy4.js";import{t as a}from"./ReadDepth.glsl-D40Q40Qv.js";import{t as o}from"./Texture2DBindUniform-0vyKeaor.js";function s(s,c){let l=s.fragment;l.include(a),s.include(n),l.uniforms.add(new i(`globalAlpha`,(e=>e.globalAlpha)),new t(`glowColor`,(e=>e.glowColor)),new i(`glowWidth`,((e,t)=>e.glowWidth*t.camera.pixelRatio)),new i(`glowFalloff`,(e=>e.glowFalloff)),new t(`innerColor`,(e=>e.innerColor)),new i(`innerWidth`,((e,t)=>e.innerWidth*t.camera.pixelRatio)),new o(`depthMap`,(e=>e.depth?.attachment)),new r(`normalMap`,(e=>e.normals))),l.code.add(e`vec4 blendPremultiplied(vec4 source, vec4 dest) {
float oneMinusSourceAlpha = 1.0 - source.a;
return vec4(
source.rgb + dest.rgb * oneMinusSourceAlpha,
source.a + dest.a * oneMinusSourceAlpha
);
}`),l.code.add(e`vec4 premultipliedColor(vec3 rgb, float alpha) {
return vec4(rgb * alpha, alpha);
}`),l.code.add(e`vec4 laserlineProfile(float dist) {
if (dist > glowWidth) {
return vec4(0.0);
}
float innerAlpha = (1.0 - smoothstep(0.0, innerWidth, dist));
float glowAlpha = pow(max(0.0, 1.0 - dist / glowWidth), glowFalloff);
return blendPremultiplied(
premultipliedColor(innerColor, innerAlpha),
premultipliedColor(glowColor, glowAlpha)
);
}`),l.code.add(e`bool laserlineReconstructFromDepth(out vec3 pos, out vec3 normal, out float angleCutoffAdjust, out float depthDiscontinuityAlpha) {
float depth = depthFromTexture(depthMap, uv);
if (depth == 1.0) {
return false;
}
float linearDepth = linearizeDepth(depth);
pos = reconstructPosition(gl_FragCoord.xy, linearDepth);
float minStep = 6e-8;
float depthStep = clamp(depth + minStep, 0.0, 1.0);
float linearDepthStep = linearizeDepth(depthStep);
float depthError = abs(linearDepthStep - linearDepth);
if (depthError > 0.2) {
normal = texture(normalMap, uv).xyz * 2.0 - 1.0;
angleCutoffAdjust = 0.004;
} else {
normal = normalize(cross(dFdx(pos), dFdy(pos)));
angleCutoffAdjust = 0.0;
}
float ddepth = fwidth(linearDepth);
depthDiscontinuityAlpha = 1.0 - smoothstep(0.0, 0.01, -ddepth / linearDepth);
return true;
}`),c.contrastControlEnabled?l.uniforms.add(new r(`frameColor`,((e,t)=>e.colors)),new i(`globalAlphaContrastBoost`,(e=>e.globalAlphaContrastBoost))).code.add(e`float rgbToLuminance(vec3 color) {
return dot(vec3(0.2126, 0.7152, 0.0722), color);
}
vec4 laserlineOutput(vec4 color) {
float backgroundLuminance = rgbToLuminance(texture(frameColor, uv).rgb);
float alpha = clamp(globalAlpha * max(backgroundLuminance * globalAlphaContrastBoost, 1.0), 0.0, 1.0);
return color * alpha;
}`):l.code.add(e`vec4 laserlineOutput(vec4 color) {
return color * globalAlpha;
}`)}export{s as t};