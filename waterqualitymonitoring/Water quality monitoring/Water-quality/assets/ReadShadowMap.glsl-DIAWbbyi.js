import{s as e}from"./vec3f64-BT74T3Oq.js";import{u as t}from"./vec42-34aAVMtQ.js";import{r as n}from"./vec4f64-BbxOfS9b.js";import{Rn as r}from"./index-OLwfcIFz.js";import"./mat4f64-oFyHPITW.js";import{t as i}from"./glsl-Cd37kqnI.js";import{l as a}from"./Matrix4BindUniform-CcMQBvOS.js";import{t as o}from"./BindType-jEQkss8w.js";import{Qt as s,tn as c}from"./verticalOffsetUtils-DMFlvZy4.js";import{t as l}from"./Texture2DBindUniform-0vyKeaor.js";import{o as u}from"./ScreenSpaceConstants-Cccbwjd8.js";import{t as d}from"./IntegerBindUniform-Ct4Mlgqa.js";function f(e){e.code.add(i`const float MAX_RGBA4_FLOAT =
15.0 / 16.0 +
15.0 / 16.0 / 16.0 +
15.0 / 16.0 / 16.0 / 16.0 +
15.0 / 16.0 / 16.0 / 16.0 / 16.0;
const vec4 FIXED_POINT_FACTORS_RGBA4 = vec4(1.0, 16.0, 16.0 * 16.0, 16.0 * 16.0 * 16.0);
vec4 floatToRgba4(const float value) {
float valueInValidDomain = clamp(value, 0.0, MAX_RGBA4_FLOAT);
vec4 fixedPointU4 = floor(fract(valueInValidDomain * FIXED_POINT_FACTORS_RGBA4) * 16.0);
const float toU4AsFloat = 1.0 / 15.0;
return fixedPointU4 * toU4AsFloat;
}
const vec4 RGBA4_2_FLOAT_FACTORS = vec4(
15.0 / (16.0),
15.0 / (16.0 * 16.0),
15.0 / (16.0 * 16.0 * 16.0),
15.0 / (16.0 * 16.0 * 16.0 * 16.0)
);
float rgba4ToFloat(vec4 rgba) {
return dot(rgba, RGBA4_2_FLOAT_FACTORS);
}`)}function p(e,n){let a=e.fragment,o=n.lightingSphericalHarmonicsOrder===void 0?2:n.lightingSphericalHarmonicsOrder;o===0?(a.uniforms.add(new s(`lightingAmbientSH0`,(({lighting:e})=>r(m,e.sh.r[0],e.sh.g[0],e.sh.b[0])))),a.code.add(i`vec3 calculateAmbientIrradiance(vec3 normal, float ambientOcclusion) {
vec3 ambientLight = 0.282095 * lightingAmbientSH0;
return ambientLight * (1.0 - ambientOcclusion);
}`)):o===1?(a.uniforms.add(new c(`lightingAmbientSH_R`,(({lighting:e})=>t(h,e.sh.r[0],e.sh.r[1],e.sh.r[2],e.sh.r[3]))),new c(`lightingAmbientSH_G`,(({lighting:e})=>t(h,e.sh.g[0],e.sh.g[1],e.sh.g[2],e.sh.g[3]))),new c(`lightingAmbientSH_B`,(({lighting:e})=>t(h,e.sh.b[0],e.sh.b[1],e.sh.b[2],e.sh.b[3])))),a.code.add(i`vec3 calculateAmbientIrradiance(vec3 normal, float ambientOcclusion) {
vec4 sh0 = vec4(
0.282095,
0.488603 * normal.x,
0.488603 * normal.z,
0.488603 * normal.y
);
vec3 ambientLight = vec3(
dot(lightingAmbientSH_R, sh0),
dot(lightingAmbientSH_G, sh0),
dot(lightingAmbientSH_B, sh0)
);
return ambientLight * (1.0 - ambientOcclusion);
}`)):o===2&&(a.uniforms.add(new s(`lightingAmbientSH0`,(({lighting:e})=>r(m,e.sh.r[0],e.sh.g[0],e.sh.b[0]))),new c(`lightingAmbientSH_R1`,(({lighting:e})=>t(h,e.sh.r[1],e.sh.r[2],e.sh.r[3],e.sh.r[4]))),new c(`lightingAmbientSH_G1`,(({lighting:e})=>t(h,e.sh.g[1],e.sh.g[2],e.sh.g[3],e.sh.g[4]))),new c(`lightingAmbientSH_B1`,(({lighting:e})=>t(h,e.sh.b[1],e.sh.b[2],e.sh.b[3],e.sh.b[4]))),new c(`lightingAmbientSH_R2`,(({lighting:e})=>t(h,e.sh.r[5],e.sh.r[6],e.sh.r[7],e.sh.r[8]))),new c(`lightingAmbientSH_G2`,(({lighting:e})=>t(h,e.sh.g[5],e.sh.g[6],e.sh.g[7],e.sh.g[8]))),new c(`lightingAmbientSH_B2`,(({lighting:e})=>t(h,e.sh.b[5],e.sh.b[6],e.sh.b[7],e.sh.b[8])))),a.code.add(i`vec3 calculateAmbientIrradiance(vec3 normal, float ambientOcclusion) {
vec3 ambientLight = 0.282095 * lightingAmbientSH0;
vec4 sh1 = vec4(
0.488603 * normal.x,
0.488603 * normal.z,
0.488603 * normal.y,
1.092548 * normal.x * normal.y
);
vec4 sh2 = vec4(
1.092548 * normal.y * normal.z,
0.315392 * (3.0 * normal.z * normal.z - 1.0),
1.092548 * normal.x * normal.z,
0.546274 * (normal.x * normal.x - normal.y * normal.y)
);
ambientLight += vec3(
dot(lightingAmbientSH_R1, sh1),
dot(lightingAmbientSH_G1, sh1),
dot(lightingAmbientSH_B1, sh1)
);
ambientLight += vec3(
dot(lightingAmbientSH_R2, sh2),
dot(lightingAmbientSH_G2, sh2),
dot(lightingAmbientSH_B2, sh2)
);
return ambientLight * (1.0 - ambientOcclusion);
}`),n.pbrMode!==u.Normal&&n.pbrMode!==u.Schematic||a.code.add(i`const vec3 skyTransmittance = vec3(0.9, 0.9, 1.0);
vec3 calculateAmbientRadiance(float ambientOcclusion)
{
vec3 ambientLight = 1.2 * (0.282095 * lightingAmbientSH0) - 0.2;
return ambientLight *= (1.0 - ambientOcclusion) * skyTransmittance;
}`))}var m=e(),h=n(),g=class extends a{constructor(e,t,n){super(e,`mat4`,o.Draw,((n,r,i,a)=>n.setUniformMatrix4fv(e,t(r,i,a))),n)}},_=class extends a{constructor(e,t,n){super(e,`mat4`,o.Pass,((n,r,i)=>n.setUniformMatrix4fv(e,t(r,i))),n)}};function v(e,t){t.receiveShadows&&(e.fragment.uniforms.add(new _(`shadowMapMatrix`,((e,t)=>t.shadowMap.getShadowMapMatrices(e.origin)),4)),b(e))}function y(e,t){t.receiveShadows&&(e.fragment.uniforms.add(new g(`shadowMapMatrix`,((e,t)=>t.shadowMap.getShadowMapMatrices(e.origin)),4)),b(e))}function b(e){let t=e.fragment;t.include(f),t.uniforms.add(new l(`shadowMap`,(e=>e.shadowMap.depthTexture)),new d(`numCascades`,(e=>e.shadowMap.numCascades)),new c(`cascadeDistances`,(e=>e.shadowMap.cascadeDistances))).code.add(i`int chooseCascade(float depth, out mat4 mat) {
vec4 distance = cascadeDistances;
int i = depth < distance[1] ? 0 : depth < distance[2] ? 1 : depth < distance[3] ? 2 : 3;
mat = i == 0 ? shadowMapMatrix[0] : i == 1 ? shadowMapMatrix[1] : i == 2 ? shadowMapMatrix[2] : shadowMapMatrix[3];
return i;
}
vec3 lightSpacePosition(vec3 _vpos, mat4 mat) {
vec4 lv = mat * vec4(_vpos, 1.0);
lv.xy /= lv.w;
return 0.5 * lv.xyz + vec3(0.5);
}
vec2 cascadeCoordinates(int i, ivec2 textureSize, vec3 lvpos) {
float xScale = float(textureSize.y) / float(textureSize.x);
return vec2((float(i) + lvpos.x) * xScale, lvpos.y);
}
float readShadowMapDepth(ivec2 uv, sampler2D _depthTex) {
return rgba4ToFloat(texelFetch(_depthTex, uv, 0));
}
float posIsInShadow(ivec2 uv, vec3 lvpos, sampler2D _depthTex) {
return readShadowMapDepth(uv, _depthTex) < lvpos.z ? 1.0 : 0.0;
}
float filterShadow(vec2 uv, vec3 lvpos, ivec2 texSize, sampler2D _depthTex) {
vec2 st = fract(uv * vec2(texSize) + vec2(0.5));
ivec2 base = ivec2(uv * vec2(texSize) - vec2(0.5));
float s00 = posIsInShadow(ivec2(base.x, base.y), lvpos, _depthTex);
float s10 = posIsInShadow(ivec2(base.x + 1, base.y), lvpos, _depthTex);
float s11 = posIsInShadow(ivec2(base.x + 1, base.y + 1), lvpos, _depthTex);
float s01 = posIsInShadow(ivec2(base.x, base.y + 1), lvpos, _depthTex);
return mix(mix(s00, s10, st.x), mix(s01, s11, st.x), st.y);
}
float readShadowMap(const in vec3 _vpos, float _linearDepth) {
mat4 mat;
int i = chooseCascade(_linearDepth, mat);
if (i >= numCascades) { return 0.0; }
vec3 lvpos = lightSpacePosition(_vpos, mat);
if (lvpos.z >= 1.0 || lvpos.x < 0.0 || lvpos.x > 1.0 || lvpos.y < 0.0 || lvpos.y > 1.0) { return 0.0; }
ivec2 size = textureSize(shadowMap, 0);
vec2 uv = cascadeCoordinates(i, size, lvpos);
return filterShadow(uv, lvpos, size, shadowMap);
}`)}export{f as i,y as n,p as r,v as t};