import{gi as e,qr as t}from"./index-OLwfcIFz.js";import{t as n}from"./glsl-Cd37kqnI.js";import{l as r}from"./Matrix4BindUniform-CcMQBvOS.js";import{t as i}from"./BindType-jEQkss8w.js";import{jt as a,ln as o}from"./verticalOffsetUtils-DMFlvZy4.js";import"./HighlightDownsample.glsl-lB1wntd0.js";var s=class extends r{constructor(e,t){super(e,`ivec2`,i.Pass,((n,r,i)=>n.setUniform2iv(e,t(r,i))))}};function c(t){let{vertex:r}=t;r.uniforms.add(new o(`coverageTexture`,(e=>e.coverageTexture)),new s(`highlightRenderCellCount`,(t=>e(l,t.horizontalCellCount,t.verticalCellCount))),new s(`highlightTextureResolution`,(({highlightTexture:t})=>e(l,t.descriptor.width,t.descriptor.height))),new a(`highlightLevel`,(e=>e.highlightLevel))).constants.add(`cellSize`,`int`,32),t.varyings.add(`sUV`,`vec2`),t.varyings.add(`vOutlinePossible`,`float`),r.code.add(n`const ivec2 cellVertices[4] = ivec2[4](ivec2(0,0), ivec2(1,0), ivec2(0,1), ivec2(1,1));`).main.add(n`int cellIndex = gl_InstanceID;
int cellX = cellIndex % highlightRenderCellCount[0];
int cellY = (cellIndex - cellX) / highlightRenderCellCount[0];
ivec2 cellPos = ivec2(cellX, cellY);
uvec2 covTexel = uvec2(texelFetch(coverageTexture, cellPos, 0).rg * 255.0);
int channelIndex = (highlightLevel >> 2) & 3;
uint channelValue = covTexel[channelIndex];
int highlightIndex = (highlightLevel & 3) << 1;
bool covered = ((channelValue >> highlightIndex) & 1u) == 1u;
if (!covered) {
gl_Position = vec4(0.0);
return;
}
vOutlinePossible = (((channelValue >> highlightIndex) & 2u) == 2u) ? 1.0 : 0.0;
ivec2 iPosInCell = cellVertices[gl_VertexID];
vec2 sPos = vec2(cellPos * cellSize + iPosInCell * (cellSize));
vec2 vPos = sPos / vec2(highlightTextureResolution);
sUV = vPos;
gl_Position = vec4(2.0 * vPos - vec2(1.0), 0.0, 1.0);`)}var l=t();export{c as t};