import{z as e}from"./promiseUtils-C88lzzOz.js";import{S as t,a as n,i as r,o as i,s as a,u as o,v as s}from"./enums-CG_ptOpd.js";import{Ft as c,Lt as l}from"./index-OLwfcIFz.js";import{l as u}from"./WGLContainer-D2jlUHlt.js";import{n as d,t as f}from"./VertexArrayObject-DSfxL6-F.js";import{t as p}from"./FramebufferObject-BvpsveAu.js";var m=class{constructor(){this._result=!1}dispose(){this._program=e(this._program)}get result(){return this._program!=null&&(this._result=this._test(this._program),this.dispose()),this._result}},h=class extends m{constructor(e){super(),this._rctx=e,this._program=e.programCache.acquire(`
    precision highp float;

    attribute vec2 a_pos;
    varying vec2 v_uv;

    void main() {
      v_uv = a_pos;
      gl_Position = vec4(a_pos * 2.0 - 1.0, 0.0, 1.0);
    }
    `,`
    precision highp float;

    varying vec2 v_uv;

    uniform sampler2D u_texture;

    void main() {
      gl_FragColor = texture2D(u_texture, v_uv);
    }
    `,new Map([[`a_pos`,0]]))}dispose(){super.dispose()}_test(e){let m=this._rctx;if(!m.gl)return e.dispose(),!0;let h=new l(1);h.wrapMode=r.CLAMP_TO_EDGE,h.samplingMode=o.NEAREST;let _=new p(m,h),v=d.createVertex(m,i.STATIC_DRAW,new Uint16Array([0,0,1,0,0,1,1,1])),y=new f(m,new Map([[`a_pos`,0]]),u,new Map([[`geometry`,v]])),b=new l;b.samplingMode=o.LINEAR,b.wrapMode=r.CLAMP_TO_EDGE;let x=new c(m,b,g);m.useProgram(e),m.bindTexture(x,0),e.setUniform1i(`u_texture`,0);let S=m.getBoundFramebufferObject(),{x:C,y:w,width:T,height:E}=m.getViewport();m.bindFramebuffer(_),m.setViewport(0,0,1,1),m.setClearColor(0,0,0,0),m.setBlendingEnabled(!1),m.clear(t.COLOR),m.bindVAO(y),m.drawArrays(n.TRIANGLE_STRIP,0,4);let D=new Uint8Array(4);return _.readPixels(0,0,1,1,a.RGBA,s.UNSIGNED_BYTE,D),y.dispose(),_.dispose(),x.dispose(),m.setViewport(C,w,T,E),m.bindFramebuffer(S),D[0]!==255}},g=new Image;g.src=`data:image/svg+xml,%3C%3Fxml version='1.0' encoding='UTF-8'%3F%3E%3Csvg width='5' height='5' version='1.1' viewBox='0 0 5 5' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='5' height='5' fill='%23f00' fill-opacity='.5'/%3E%3C/svg%3E%0A`,g.width=5,g.height=5,g.decode();var _=class{constructor(e,t,n,r,i,a,o,s,c){this.createQuery=e,this.deleteQuery=t,this.resultAvailable=n,this.getResult=r,this.disjoint=i,this.beginTimeElapsed=a,this.endTimeElapsed=o,this.createTimestamp=s,this.timestampBits=c}},v=!1;function y(e,t){if(t.disjointTimerQuery)return null;let n=e.getExtension(`EXT_disjoint_timer_query_webgl2`);return n?new _((()=>e.createQuery()),(t=>{e.deleteQuery(t),v=!1}),(t=>e.getQueryParameter(t,e.QUERY_RESULT_AVAILABLE)),(t=>e.getQueryParameter(t,e.QUERY_RESULT)),(()=>e.getParameter(n.GPU_DISJOINT_EXT)),(t=>{v||(v=!0,e.beginQuery(n.TIME_ELAPSED_EXT,t))}),(()=>{e.endQuery(n.TIME_ELAPSED_EXT),v=!1}),(e=>n.queryCounterEXT(e,n.TIMESTAMP_EXT)),(()=>e.getQuery(n.TIMESTAMP_EXT,n.QUERY_COUNTER_BITS_EXT))):(n=e.getExtension(`EXT_disjoint_timer_query`),n?new _((()=>n.createQueryEXT()),(e=>{n.deleteQueryEXT(e),v=!1}),(e=>n.getQueryObjectEXT(e,n.QUERY_RESULT_AVAILABLE_EXT)),(e=>n.getQueryObjectEXT(e,n.QUERY_RESULT_EXT)),(()=>e.getParameter(n.GPU_DISJOINT_EXT)),(e=>{v||(v=!0,n.beginQueryEXT(n.TIME_ELAPSED_EXT,e))}),(()=>{n.endQueryEXT(n.TIME_ELAPSED_EXT),v=!1}),(e=>n.queryCounterEXT(e,n.TIMESTAMP_EXT)),(()=>n.getQueryEXT(n.TIMESTAMP_EXT,n.QUERY_COUNTER_BITS_EXT))):null)}export{h as n,m as r,y as t};