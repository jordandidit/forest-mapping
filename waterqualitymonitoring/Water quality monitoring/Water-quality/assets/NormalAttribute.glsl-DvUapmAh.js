import{P as e}from"./typedArrayUtil-CSAQpn33.js";import{_ as t}from"./mathUtils-B92Yztdr.js";import{n}from"./VertexAttribute-BNGbSfhI.js";import{t as r}from"./glsl-Cd37kqnI.js";var i;function a(e){switch(e){case`multiply`:default:return i.Multiply;case`ignore`:return i.Ignore;case`replace`:return i.Replace;case`tint`:return i.Tint}}function o(e,n,r){if(e==null||n===i.Ignore)return r[0]=255,r[1]=255,r[2]=255,void(r[3]=255);let a=t(Math.round(e[3]*c),0,c),o=a===0||n===i.Tint?0:n===i.Replace?l:u;r[0]=t(Math.round(e[0]*s),0,s),r[1]=t(Math.round(e[1]*s),0,s),r[2]=t(Math.round(e[2]*s),0,s),r[3]=a+o}(function(e){e[e.Multiply=1]=`Multiply`,e[e.Ignore=2]=`Ignore`,e[e.Replace=3]=`Replace`,e[e.Tint=4]=`Tint`})(i||={});var s=255,c=85,l=c,u=170;function d(e){e.vertex.code.add(r`
    vec4 decodeSymbolColor(vec4 symbolColor, out int colorMixMode) {
      float symbolAlpha = 0.0;

      const float maxTint = 85.0;
      const float maxReplace = 170.0;
      const float scaleAlpha = 3.0;

      if (symbolColor.a > maxReplace) {
        colorMixMode = ${r.int(i.Multiply)};
        symbolAlpha = scaleAlpha * (symbolColor.a - maxReplace);
      } else if (symbolColor.a > maxTint) {
        colorMixMode = ${r.int(i.Replace)};
        symbolAlpha = scaleAlpha * (symbolColor.a - maxTint);
      } else if (symbolColor.a > 0.0) {
        colorMixMode = ${r.int(i.Tint)};
        symbolAlpha = scaleAlpha * symbolColor.a;
      } else {
        colorMixMode = ${r.int(i.Multiply)};
        symbolAlpha = 0.0;
      }

      return vec4(symbolColor.r, symbolColor.g, symbolColor.b, symbolAlpha);
    }
  `)}function f(t,i){switch(i.normalType){case p.Compressed:t.attributes.add(n.NORMALCOMPRESSED,`vec2`),t.vertex.code.add(r`vec3 decompressNormal(vec2 normal) {
float z = 1.0 - abs(normal.x) - abs(normal.y);
return vec3(normal + sign(normal) * min(z, 0.0), z);
}
vec3 normalModel() {
return decompressNormal(normalCompressed);
}`);break;case p.Attribute:t.attributes.add(n.NORMAL,`vec3`),t.vertex.code.add(r`vec3 normalModel() {
return normal;
}`);break;case p.ScreenDerivative:t.fragment.code.add(r`vec3 screenDerivativeNormal(vec3 positionView) {
return normalize(cross(dFdx(positionView), dFdy(positionView)));
}`);break;default:e(i.normalType);case p.COUNT:}}var p;(function(e){e[e.Attribute=0]=`Attribute`,e[e.Compressed=1]=`Compressed`,e[e.ScreenDerivative=2]=`ScreenDerivative`,e[e.COUNT=3]=`COUNT`})(p||={});export{i as a,a as i,f as n,o,d as r,p as t};