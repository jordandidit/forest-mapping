import{i as e,n as t}from"./vec3f64-BT74T3Oq.js";import{hn as n}from"./index-OLwfcIFz.js";import{n as r,t as i}from"./glsl-Cd37kqnI.js";import{a,c as o,i as s}from"./Matrix4BindUniform-CcMQBvOS.js";import{t as c}from"./BindType-jEQkss8w.js";import{Lt as l,Nt as u,Qt as d,ln as f}from"./verticalOffsetUtils-DMFlvZy4.js";function p(e){e.uniforms.add(new d(`mainLightDirection`,(e=>e.lighting.mainLight.direction)))}function m(e){e.uniforms.add(new d(`mainLightIntensity`,(e=>e.lighting.mainLight.intensity)))}function h(e){p(e.fragment),m(e.fragment),e.fragment.code.add(i`vec3 applyShading(vec3 shadingNormalWorld, float shadow) {
float dotVal = clamp(dot(shadingNormalWorld, mainLightDirection), 0.0, 1.0);
return mainLightIntensity * ((1.0 - shadow) * dotVal);
}`)}function g({normalTexture:e,metallicRoughnessTexture:r,metallicFactor:i,roughnessFactor:a,emissiveTexture:o,emissiveFactor:s,occlusionTexture:c}){return e==null&&r==null&&o==null&&(s==null||n(s,t))&&c==null&&(a==null||a===1)&&(i==null||i===1)}var _=e(1,1,.5),v=e(0,.6,.2),y=e(0,1,.2),b;(function(e){e[e.Disabled=0]=`Disabled`,e[e.Normal=1]=`Normal`,e[e.Schematic=2]=`Schematic`,e[e.Water=3]=`Water`,e[e.WaterOnIntegratedMesh=4]=`WaterOnIntegratedMesh`,e[e.Simplified=5]=`Simplified`,e[e.TerrainWithWater=6]=`TerrainWithWater`,e[e.COUNT=7]=`COUNT`})(b||={});function x(e,t){let n=t.pbrMode,u=e.fragment;if(n!==b.Schematic&&n!==b.Disabled&&n!==b.Normal)return void u.code.add(i`void applyPBRFactors() {}`);if(n===b.Disabled)return void u.code.add(i`void applyPBRFactors() {}
float getBakedOcclusion() { return 1.0; }`);if(n===b.Schematic)return void u.code.add(i`vec3 mrr = vec3(0.0, 0.6, 0.2);
float occlusion = 1.0;
void applyPBRFactors() {}
float getBakedOcclusion() { return 1.0; }`);let{hasMetallicRoughnessTexture:d,hasMetallicRoughnessTextureTransform:p,hasOcclusionTexture:m,hasOcclusionTextureTransform:h,bindType:g}=t;(d||m)&&e.include(l,t),u.code.add(i`vec3 mrr;
float occlusion;`),d&&u.uniforms.add(g===c.Pass?new f(`texMetallicRoughness`,(e=>e.textureMetallicRoughness)):new o(`texMetallicRoughness`,(e=>e.textureMetallicRoughness))),m&&u.uniforms.add(g===c.Pass?new f(`texOcclusion`,(e=>e.textureOcclusion)):new o(`texOcclusion`,(e=>e.textureOcclusion))),u.uniforms.add(g===c.Pass?new s(`mrrFactors`,(e=>e.mrrFactors)):new a(`mrrFactors`,(e=>e.mrrFactors))),u.code.add(i`
    ${r(d,i`void applyMetallicRoughness(vec2 uv) {
            vec3 metallicRoughness = textureLookup(texMetallicRoughness, uv).rgb;
            mrr[0] *= metallicRoughness.b;
            mrr[1] *= metallicRoughness.g;
          }`)}

    ${r(m,`void applyOcclusion(vec2 uv) { occlusion *= textureLookup(texOcclusion, uv).r; }`)}

    float getBakedOcclusion() {
      return ${m?`occlusion`:`1.0`};
    }

    void applyPBRFactors() {
      mrr = mrrFactors;
      occlusion = 1.0;

      ${r(d,`applyMetallicRoughness(${p?`metallicRoughnessUV`:`vuv0`});`)}
      ${r(m,`applyOcclusion(${h?`occlusionUV`:`vuv0`});`)}
    }
  `)}function S(e){let t=e.fragment.code;t.add(i`vec3 evaluateDiffuseIlluminationHemisphere(vec3 ambientGround, vec3 ambientSky, float NdotNG)
{
return ((1.0 - NdotNG) * ambientGround + (1.0 + NdotNG) * ambientSky) * 0.5;
}`),t.add(i`float integratedRadiance(float cosTheta2, float roughness)
{
return (cosTheta2 - 1.0) / (cosTheta2 * (1.0 - roughness * roughness) - 1.0);
}`),t.add(i`vec3 evaluateSpecularIlluminationHemisphere(vec3 ambientGround, vec3 ambientSky, float RdotNG, float roughness)
{
float cosTheta2 = 1.0 - RdotNG * RdotNG;
float intRadTheta = integratedRadiance(cosTheta2, roughness);
float ground = RdotNG < 0.0 ? 1.0 - intRadTheta : 1.0 + intRadTheta;
float sky = 2.0 - ground;
return (ground * ambientGround + sky * ambientSky) * 0.5;
}`)}function C(e,t){let n=e.fragment.code;e.include(u),t.pbrMode!==b.Normal&&t.pbrMode!==b.Schematic&&t.pbrMode!==b.Simplified&&t.pbrMode!==b.TerrainWithWater||(n.add(i`float normalDistribution(float NdotH, float roughness)
{
float a = NdotH * roughness;
float b = roughness / (1.0 - NdotH * NdotH + a * a);
return b * b * INV_PI;
}`),n.add(i`const vec4 c0 = vec4(-1.0, -0.0275, -0.572,  0.022);
const vec4 c1 = vec4( 1.0,  0.0425,  1.040, -0.040);
const vec2 c2 = vec2(-1.04, 1.04);
vec2 prefilteredDFGAnalytical(float roughness, float NdotV) {
vec4 r = roughness * c0 + c1;
float a004 = min(r.x * r.x, exp2(-9.28 * NdotV)) * r.x + r.y;
return c2 * a004 + r.zw;
}`)),t.pbrMode!==b.Normal&&t.pbrMode!==b.Schematic||(e.include(S),n.add(i`struct PBRShadingInfo
{
float NdotV;
float LdotH;
float NdotNG;
float RdotNG;
float NdotAmbDir;
float NdotH_Horizon;
vec3 skyRadianceToSurface;
vec3 groundRadianceToSurface;
vec3 skyIrradianceToSurface;
vec3 groundIrradianceToSurface;
float averageAmbientRadiance;
float ssao;
vec3 albedoLinear;
vec3 f0;
vec3 f90;
vec3 diffuseColor;
float metalness;
float roughness;
};`),n.add(i`vec3 evaluateEnvironmentIllumination(PBRShadingInfo inputs) {
vec3 indirectDiffuse = evaluateDiffuseIlluminationHemisphere(inputs.groundIrradianceToSurface, inputs.skyIrradianceToSurface, inputs.NdotNG);
vec3 indirectSpecular = evaluateSpecularIlluminationHemisphere(inputs.groundRadianceToSurface, inputs.skyRadianceToSurface, inputs.RdotNG, inputs.roughness);
vec3 diffuseComponent = inputs.diffuseColor * indirectDiffuse * INV_PI;
vec2 dfg = prefilteredDFGAnalytical(inputs.roughness, inputs.NdotV);
vec3 specularColor = inputs.f0 * dfg.x + inputs.f90 * dfg.y;
vec3 specularComponent = specularColor * indirectSpecular;
return (diffuseComponent + specularComponent);
}`),n.add(i`float gamutMapChanel(float x, vec2 p){
return (x < p.x) ? mix(0.0, p.y, x/p.x) : mix(p.y, 1.0, (x - p.x) / (1.0 - p.x) );
}`),n.add(i`vec3 blackLevelSoftCompression(vec3 inColor, PBRShadingInfo inputs){
vec3 outColor;
vec2 p = vec2(0.02 * (inputs.averageAmbientRadiance), 0.0075 * (inputs.averageAmbientRadiance));
outColor.x = gamutMapChanel(inColor.x, p) ;
outColor.y = gamutMapChanel(inColor.y, p) ;
outColor.z = gamutMapChanel(inColor.z, p) ;
return outColor;
}`))}function w(e,t){let n=e.fragment.code;e.include(u),n.add(i`
  struct PBRShadingWater
  {
      float NdotL;   // cos angle between normal and light direction
      float NdotV;   // cos angle between normal and view direction
      float NdotH;   // cos angle between normal and half vector
      float VdotH;   // cos angle between view direction and half vector
      float LdotH;   // cos angle between light direction and half vector
      float VdotN;   // cos angle between view direction and normal vector
  };

  float dtrExponent = ${t.useCustomDTRExponentForWater?`2.2`:`2.0`};
  `),n.add(i`vec3 fresnelReflection(float angle, vec3 f0, float f90) {
return f0 + (f90 - f0) * pow(1.0 - angle, 5.0);
}`),n.add(i`float normalDistributionWater(float NdotH, float roughness)
{
float r2 = roughness * roughness;
float NdotH2 = NdotH * NdotH;
float denom = pow((NdotH2 * (r2 - 1.0) + 1.0), dtrExponent) * PI;
return r2 / denom;
}`),n.add(i`float geometricOcclusionKelemen(float LoH)
{
return 0.25 / (LoH * LoH);
}`),n.add(i`vec3 brdfSpecularWater(in PBRShadingWater props, float roughness, vec3 F0, float F0Max)
{
vec3  F = fresnelReflection(props.VdotH, F0, F0Max);
float dSun = normalDistributionWater(props.NdotH, roughness);
float V = geometricOcclusionKelemen(props.LdotH);
float diffusionSunHaze = mix(roughness + 0.045, roughness + 0.385, 1.0 - props.VdotH);
float strengthSunHaze  = 1.2;
float dSunHaze = normalDistributionWater(props.NdotH, diffusionSunHaze) * strengthSunHaze;
return ((dSun + dSunHaze) * V) * F;
}`)}var T=3e5,E=5e5;export{x as a,v as c,h as d,m as f,w as i,y as l,E as n,b as o,p,C as r,g as s,T as t,_ as u};