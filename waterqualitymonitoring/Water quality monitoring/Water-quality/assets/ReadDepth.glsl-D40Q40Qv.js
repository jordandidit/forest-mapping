import{gi as e,qr as t}from"./index-OLwfcIFz.js";import{t as n}from"./glsl-Cd37kqnI.js";import{t as r}from"./Float2BindUniform-Dsz262yK.js";function i(e){e.uniforms.add(new r(`zProjectionMap`,(e=>a(e.camera)))),e.code.add(n`float linearizeDepth(float depth) {
float depthNdc = depth * 2.0 - 1.0;
float c1 = zProjectionMap[0];
float c2 = zProjectionMap[1];
return -(c1 / (depthNdc + c2 + 1e-7));
}`),e.code.add(n`float depthFromTexture(sampler2D depthTexture, vec2 uv) {
ivec2 iuv = ivec2(uv * vec2(textureSize(depthTexture, 0)));
float depth = texelFetch(depthTexture, iuv, 0).r;
return depth;
}`),e.code.add(n`float linearDepthFromTexture(sampler2D depthTexture, vec2 uv) {
return linearizeDepth(depthFromTexture(depthTexture, uv));
}`)}function a(t){let n=t.projectionMatrix;return e(o,n[14],n[10])}var o=t();export{i as t};