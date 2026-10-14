import{t as e}from"./glsl-Cd37kqnI.js";import{c as t}from"./Matrix4BindUniform-CcMQBvOS.js";import{t as n}from"./ShaderBuilder-Bk1OGC9-.js";import{dn as r,sn as i}from"./verticalOffsetUtils-DMFlvZy4.js";var a=class extends i{};function o(){let i=new n,{outputs:a,fragment:o}=i;return i.include(r),o.uniforms.add(new t(`textureInput`,(e=>e.input))),o.constants.add(`outlineWidth`,`int`,9),o.constants.add(`cellSize`,`int`,32),a.add(`fragGrid`,`vec2`),o.main.add(e`ivec2 inputTextureSize = textureSize(textureInput, 0);
ivec2 cellBottomLeftCornerInput = ivec2(floor(gl_FragCoord.xy) * vec2(cellSize));
ivec2 coordMid =  cellBottomLeftCornerInput + ivec2(cellSize >> 1);
uvec2 centreTexel = uvec2( texelFetch(textureInput, coordMid, 0).rg * 255.0) & uvec2(0x55u);
float marginSquare = float(outlineWidth*outlineWidth);
uvec2 outputValue = centreTexel & uvec2(0x55u);
for(int y = -outlineWidth; y <= cellSize + outlineWidth; y+=2) {
int dy = y < 0 ? -y : y > cellSize ? y-cellSize : 0;
int xMargin = dy > 0 ? int(ceil(sqrt(marginSquare - float(dy*dy)))) : outlineWidth;
for(int x = -xMargin; x <= cellSize + xMargin; x+=2) {
ivec2 coord = cellBottomLeftCornerInput + ivec2(x, y);
uvec2[4] texels = uvec2[4] (
uvec2(texelFetch(textureInput,coord+ivec2(0,0),0).rg * 255.0) & uvec2(0x55u),
uvec2(texelFetch(textureInput,coord+ivec2(1,0),0).rg * 255.0) & uvec2(0x55u),
uvec2(texelFetch(textureInput,coord+ivec2(0,1),0).rg * 255.0) & uvec2(0x55u),
uvec2(texelFetch(textureInput,coord+ivec2(1,1),0).rg * 255.0) & uvec2(0x55u)
);
if (texels[0] == texels[1] && texels[1] == texels[2] && texels[2] == texels[3] && texels[3] ==  centreTexel) {
continue;
}
for (int i=0; i<4; ++i){
outputValue |= ((texels[i] ^ centreTexel) << 1);
outputValue |= texels[i];
}
}
}
fragGrid = vec2(outputValue) / 255.0;`),i}var s=32,c=9,l=.4,u=Object.freeze(Object.defineProperty({__proto__:null,HighlightDownsampleDrawParameters:a,blurSize:l,build:o,gridCellPixelSize:32,outlineSize:9},Symbol.toStringTag,{value:`Module`}));export{u as a,o as i,s as n,a as o,c as r,l as t};