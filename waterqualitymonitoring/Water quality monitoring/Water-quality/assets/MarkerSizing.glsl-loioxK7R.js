import{i as e}from"./tslib.es6-C-Yif_04.js";import"./enums-CG_ptOpd.js";import"./index-OLwfcIFz.js";import{n as t}from"./VertexAttribute-BNGbSfhI.js";import{t as n}from"./glsl-Cd37kqnI.js";import{i as r}from"./Matrix4BindUniform-CcMQBvOS.js";import{Rt as i,Xt as a,at as o,ct as s,ht as c,on as l,pt as u,st as d,un as f}from"./verticalOffsetUtils-DMFlvZy4.js";import"./graphicUtils-B-kNy1Jh.js";var p,m;(function(e){e[e.Draped=0]=`Draped`,e[e.Screen=1]=`Screen`,e[e.World=2]=`World`,e[e.COUNT=3]=`COUNT`})(p||={}),function(e){e[e.Center=0]=`Center`,e[e.Tip=1]=`Tip`,e[e.COUNT=2]=`COUNT`}(m||={});var h=class extends u{constructor(){super(...arguments),this.space=p.Screen,this.anchor=m.Center,this.occluder=!1,this.writeDepth=!1,this.hideOnShortSegments=!1,this.hasCap=!1,this.hasTip=!1,this.vvSize=!1,this.vvColor=!1,this.vvOpacity=!1,this.hasOccludees=!1,this.terrainDepthTest=!1,this.cullAboveTerrain=!1,this.textureCoordinateType=i.None,this.emissionSource=c.None,this.discardInvisibleFragments=!0,this.occlusionPass=!1,this.hasVvInstancing=!0,this.hasSliceTranslatedView=!0,this.objectAndLayerIdColorInstanced=!1}get draped(){return this.space===p.Draped}};e([l({count:p.COUNT})],h.prototype,`space`,void 0),e([l({count:m.COUNT})],h.prototype,`anchor`,void 0),e([l()],h.prototype,`occluder`,void 0),e([l()],h.prototype,`writeDepth`,void 0),e([l()],h.prototype,`hideOnShortSegments`,void 0),e([l()],h.prototype,`hasCap`,void 0),e([l()],h.prototype,`hasTip`,void 0),e([l()],h.prototype,`vvSize`,void 0),e([l()],h.prototype,`vvColor`,void 0),e([l()],h.prototype,`vvOpacity`,void 0),e([l()],h.prototype,`hasOccludees`,void 0),e([l()],h.prototype,`terrainDepthTest`,void 0),e([l()],h.prototype,`cullAboveTerrain`,void 0);var g=8;function _(e,i){let a=e.vertex;a.uniforms.add(new f(`intrinsicWidth`,(e=>e.width))),i.vvSize?(e.attributes.add(t.SIZEFEATUREATTRIBUTE,`float`),a.uniforms.add(new r(`vvSizeMinSize`,(e=>e.vvSize.minSize)),new r(`vvSizeMaxSize`,(e=>e.vvSize.maxSize)),new r(`vvSizeOffset`,(e=>e.vvSize.offset)),new r(`vvSizeFactor`,(e=>e.vvSize.factor))),a.code.add(n`float getSize() {
return intrinsicWidth * clamp(vvSizeOffset + sizeFeatureAttribute * vvSizeFactor, vvSizeMinSize, vvSizeMaxSize).x;
}`)):(e.attributes.add(t.SIZE,`float`),a.code.add(n`float getSize(){
return intrinsicWidth * size;
}`)),i.vvOpacity?(e.attributes.add(t.OPACITYFEATUREATTRIBUTE,`float`),a.constants.add(`vvOpacityNumber`,`int`,8),a.uniforms.add(new s(`vvOpacityValues`,(e=>e.vvOpacity.values),g),new s(`vvOpacityOpacities`,(e=>e.vvOpacity.opacityValues),g)),a.code.add(n`float interpolateOpacity( float value ){
if (value <= vvOpacityValues[0]) {
return vvOpacityOpacities[0];
}
for (int i = 1; i < vvOpacityNumber; ++i) {
if (vvOpacityValues[i] >= value) {
float f = (value - vvOpacityValues[i-1]) / (vvOpacityValues[i] - vvOpacityValues[i-1]);
return mix(vvOpacityOpacities[i-1], vvOpacityOpacities[i], f);
}
}
return vvOpacityOpacities[vvOpacityNumber - 1];
}
vec4 applyOpacity( vec4 color ){
return vec4(color.xyz, interpolateOpacity(opacityFeatureAttribute));
}`)):a.code.add(n`vec4 applyOpacity( vec4 color ){
return color;
}`),i.vvColor?(e.include(d,i),e.attributes.add(t.COLORFEATUREATTRIBUTE,`float`),a.code.add(n`vec4 getColor(){
return applyOpacity(interpolateVVColor(colorFeatureAttribute));
}`)):(e.attributes.add(t.COLOR,`vec4`),a.code.add(n`vec4 getColor(){
return applyOpacity(color);
}`))}var v=.25;function y(e,t){let r=e.vertex;o(r),r.uniforms.get(`markerScale`)??r.constants.add(`markerScale`,`float`,1),r.constants.add(`markerSizePerLineWidth`,`float`,10).code.add(n`float getLineWidth() {
return max(getSize(), 1.0) * pixelRatio;
}
float getScreenMarkerSize() {
return markerSizePerLineWidth * markerScale * getLineWidth();
}`),t.space===p.World&&(r.constants.add(`maxSegmentLengthFraction`,`float`,.45),r.uniforms.add(new a(`perRenderPixelRatio`,(e=>e.camera.perRenderPixelRatio))),r.code.add(n`bool areWorldMarkersHidden(vec4 pos, vec4 other) {
vec3 midPoint = mix(pos.xyz, other.xyz, 0.5);
float distanceToCamera = length(midPoint);
float screenToWorldRatio = perRenderPixelRatio * distanceToCamera * 0.5;
float worldMarkerSize = getScreenMarkerSize() * screenToWorldRatio;
float segmentLen = length(pos.xyz - other.xyz);
return worldMarkerSize > maxSegmentLengthFraction * segmentLen;
}
float getWorldMarkerSize(vec4 pos) {
float distanceToCamera = length(pos.xyz);
float screenToWorldRatio = perRenderPixelRatio * distanceToCamera * 0.5;
return getScreenMarkerSize() * screenToWorldRatio;
}`))}export{m as a,h as i,v as n,p as o,_ as r,y as t};