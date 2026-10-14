import{L as e}from"./typedArrayUtil-CSAQpn33.js";import{t}from"./glsl-Cd37kqnI.js";import{t as n}from"./BindType-jEQkss8w.js";var r;function i(e){return e===r.Shadow||e===r.ShadowHighlight||e===r.ShadowExcludeHighlight||e===r.ViewshedShadow}function a(e){return _(e)||e===r.Normal}function o(e){return v(e)||e===r.Normal}function s(e){return e===r.Highlight||e===r.ObjectAndLayerIdColor}function c(e){return l(e)||s(e)}function l(e){return e===r.Color}function u(e){return l(e)||b(e)}function d(e){return l(e)||e===r.ObjectAndLayerIdColor}function f(e){return u(e)||e===r.ObjectAndLayerIdColor}function p(e){return l(e)||e===r.Highlight}function m(e){return p(e)||y(e)}function h(e){return l(e)||s(e)}function g(e){return u(e)||s(e)}function _(e){return h(e)||y(e)}function v(e){return g(e)||y(e)}function y(e){return e===r.Depth}function b(e){return e===r.ColorEmission}(function(e){e[e.Color=0]=`Color`,e[e.ColorEmission=1]=`ColorEmission`,e[e.Depth=2]=`Depth`,e[e.Normal=3]=`Normal`,e[e.Shadow=4]=`Shadow`,e[e.ShadowHighlight=5]=`ShadowHighlight`,e[e.ShadowExcludeHighlight=6]=`ShadowExcludeHighlight`,e[e.ViewshedShadow=7]=`ViewshedShadow`,e[e.Highlight=8]=`Highlight`,e[e.ObjectAndLayerIdColor=9]=`ObjectAndLayerIdColor`,e[e.COUNT=10]=`COUNT`})(r||={});var x=class{constructor(e,t,r,i,a=null){if(this.name=e,this.type=t,this.arraySize=a,this.bind={[n.Bind]:null,[n.Pass]:null,[n.Draw]:null},i)switch(r){case void 0:break;case n.Bind:this.bind[n.Bind]=i;break;case n.Pass:this.bind[n.Pass]=i;break;case n.Draw:this.bind[n.Draw]=i}}equals(e){return this.type===e.type&&this.name===e.name&&this.arraySize===e.arraySize}},S=class extends x{constructor(e,t){super(e,`sampler2D`,n.Draw,((n,r,i)=>n.bindTexture(e,t(r,i))))}};function C(){return!!e(`enable-feature:objectAndLayerId-rendering`)}function w({code:e},n){n.doublePrecisionRequiresObfuscation?e.add(t`vec3 dpPlusFrc(vec3 a, vec3 b) {
return mix(a, a + b, vec3(notEqual(b, vec3(0))));
}
vec3 dpMinusFrc(vec3 a, vec3 b) {
return mix(vec3(0), a - b, vec3(notEqual(a, b)));
}
vec3 dpAdd(vec3 hiA, vec3 loA, vec3 hiB, vec3 loB) {
vec3 t1 = dpPlusFrc(hiA, hiB);
vec3 e = dpMinusFrc(t1, hiA);
vec3 t2 = dpMinusFrc(hiB, e) + dpMinusFrc(hiA, dpMinusFrc(t1, e)) + loA + loB;
return t1 + t2;
}`):e.add(t`vec3 dpAdd(vec3 hiA, vec3 loA, vec3 hiB, vec3 loB) {
vec3 t1 = hiA + hiB;
vec3 e = t1 - hiA;
vec3 t2 = ((hiB - e) + (hiA - (t1 - e))) + loA + loB;
return t1 + t2;
}`)}var T=class extends x{constructor(e,t){super(e,`vec3`,n.Draw,((n,r,i,a)=>n.setUniform3fv(e,t(r,i,a))))}},E=class extends x{constructor(e,t){super(e,`vec3`,n.Pass,((n,r,i)=>n.setUniform3fv(e,t(r,i))))}},D=class extends x{constructor(e,t){super(e,`mat3`,n.Draw,((n,r,i)=>n.setUniformMatrix3fv(e,t(r,i))))}},O=class extends x{constructor(e,t){super(e,`mat3`,n.Pass,((n,r,i)=>n.setUniformMatrix3fv(e,t(r,i))))}},k=class extends x{constructor(e,t){super(e,`mat4`,n.Bind,((n,r)=>n.setUniformMatrix4fv(e,t(r))))}};export{a as C,i as S,u as T,h as _,T as a,f as b,S as c,b as d,y as f,g,c as h,E as i,x as l,d as m,O as n,w as o,m as p,D as r,C as s,k as t,v as u,l as v,o as w,r as x,s as y};