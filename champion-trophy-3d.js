// =====================
// SISTER CITIES — TRANSPARENT VIDEO CHAMPION TROPHY
// Uses the uploaded high-quality 360° MP4 as the source texture and removes
// its light studio background in a GPU fragment shader. The displayed pixels
// come directly from the decoded video texture — no low-resolution CPU canvas
// is used for presentation, so fine trophy detail stays sharp.
// =====================

(function initSclChampionTrophyTransparentVideo(){
  if(window.SCL_CHAMPION_TROPHY_WEBGL_INSTALLED) return;
  window.SCL_CHAMPION_TROPHY_WEBGL_INSTALLED = true;

  const VIDEO_SRC = './assets/gemini_generated_video_3906FDD0.mp4';
  const STAGE_SIZE = 60;
  const INTERNAL_SIZE = 360; // 6x CSS size; comfortably above iPhone Retina need
  const ANALYSIS_MAX = 300;
  const CROP_PADDING = 0.07;
  const players = new Set();

  function dominantBorderColor(data,w,h){
    let r=0,g=0,b=0,n=0;
    const edge=Math.max(2,Math.floor(Math.min(w,h)*0.05));
    const step=Math.max(1,Math.floor(Math.min(w,h)/80));
    const add=(x,y)=>{const i=((y*w)+x)*4;r+=data[i];g+=data[i+1];b+=data[i+2];n++;};
    for(let y=0;y<h;y+=step){for(let x=0;x<edge;x+=step)add(x,y);for(let x=w-edge;x<w;x+=step)add(x,y);}
    for(let x=0;x<w;x+=step){for(let y=0;y<edge;y+=step)add(x,y);for(let y=h-edge;y<h;y+=step)add(x,y);}
    return n?{r:r/n/255,g:g/n/255,b:b/n/255}:{r:1,g:1,b:1};
  }

  function analyze(video){
    if(!video.videoWidth||!video.videoHeight) return null;
    const s=Math.min(1,ANALYSIS_MAX/Math.max(video.videoWidth,video.videoHeight));
    const w=Math.max(2,Math.round(video.videoWidth*s));
    const h=Math.max(2,Math.round(video.videoHeight*s));
    const c=document.createElement('canvas');c.width=w;c.height=h;
    const ctx=c.getContext('2d',{willReadFrequently:true}); if(!ctx) return null;
    ctx.drawImage(video,0,0,w,h);
    const f=ctx.getImageData(0,0,w,h),p=f.data,bg=dominantBorderColor(p,w,h);
    const br=bg.r*255,bgG=bg.g*255,bb=bg.b*255;
    let minX=w,minY=h,maxX=-1,maxY=-1;
    const threshold=52, t2=threshold*threshold;
    for(let y=0;y<h;y++) for(let x=0;x<w;x++){
      const i=((y*w)+x)*4,dr=p[i]-br,dg=p[i+1]-bgG,db=p[i+2]-bb;
      const lum=(p[i]+p[i+1]+p[i+2])/3;
      const chroma=Math.max(p[i],p[i+1],p[i+2])-Math.min(p[i],p[i+1],p[i+2]);
      const dist2=dr*dr+dg*dg+db*db;
      // Ignore only clearly studio-background pixels. Saturated/darker trophy
      // details are retained even when they are near the background in RGB.
      if(dist2<=t2 && lum>205 && chroma<42) continue;
      if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;
    }
    if(maxX<minX||maxY<minY) return {crop:[0,0,1,1],bg};
    let cw=maxX-minX+1,ch=maxY-minY+1;
    const px=cw*CROP_PADDING,py=ch*CROP_PADDING;
    minX=Math.max(0,minX-px);maxX=Math.min(w,maxX+px);
    minY=Math.max(0,minY-py);maxY=Math.min(h,maxY+py);
    return {crop:[minX/w,minY/h,(maxX-minX)/w,(maxY-minY)/h],bg};
  }

  function shader(gl,type,src){
    const sh=gl.createShader(type);gl.shaderSource(sh,src);gl.compileShader(sh);
    if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)||'shader compile failed');
    return sh;
  }

  function createRenderer(canvas,video,analysis){
    const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:true});
    if(!gl) return null;
    const vs=shader(gl,gl.VERTEX_SHADER,`
      attribute vec2 a_pos;
      attribute vec2 a_uv;
      varying vec2 v_uv;
      uniform vec2 u_fit;
      void main(){ gl_Position=vec4(a_pos*u_fit,0.0,1.0); v_uv=a_uv; }
    `);
    const fs=shader(gl,gl.FRAGMENT_SHADER,`
      precision mediump float;
      varying vec2 v_uv;
      uniform sampler2D u_tex;
      uniform vec4 u_crop;
      uniform vec3 u_bg;
      void main(){
        vec2 uv=vec2(u_crop.x+v_uv.x*u_crop.z, u_crop.y+v_uv.y*u_crop.w);
        vec4 c=texture2D(u_tex,uv);
        float hi=max(c.r,max(c.g,c.b));
        float lo=min(c.r,min(c.g,c.b));
        float chroma=hi-lo;
        float lum=dot(c.rgb,vec3(0.2126,0.7152,0.0722));
        float dist=distance(c.rgb,u_bg);

        // Primary color-distance key. Near-background studio pixels become clear;
        // real trophy color/detail becomes opaque smoothly instead of jagged.
        float alphaDist=smoothstep(0.055,0.185,dist);

        // Extra cleanup for neutral high-luminance gray/white studio shading.
        // Dark silver, gold, flags, engraving and the base are protected.
        float neutral=1.0-smoothstep(0.035,0.13,chroma);
        float bright=smoothstep(0.77,0.965,lum);
        float studio=neutral*bright;
        float alpha=max(alphaDist, smoothstep(0.02,0.11,chroma)*0.92);
        alpha*=1.0-(studio*(1.0-alphaDist)*0.92);
        alpha=clamp(alpha,0.0,1.0);

        // Keep genuinely dark/metallic trophy pixels fully solid.
        alpha=max(alpha,1.0-smoothstep(0.52,0.80,lum));
        gl_FragColor=vec4(c.rgb,c.a*alpha);
      }
    `);
    const prog=gl.createProgram();gl.attachShader(prog,vs);gl.attachShader(prog,fs);gl.linkProgram(prog);
    if(!gl.getProgramParameter(prog,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog)||'program link failed');
    gl.useProgram(prog);

    const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([
      -1,-1, 0,0,  1,-1, 1,0, -1,1, 0,1,
      -1,1, 0,1,   1,-1, 1,0,  1,1, 1,1
    ]),gl.STATIC_DRAW);
    const stride=16;
    const ap=gl.getAttribLocation(prog,'a_pos');gl.enableVertexAttribArray(ap);gl.vertexAttribPointer(ap,2,gl.FLOAT,false,stride,0);
    const au=gl.getAttribLocation(prog,'a_uv');gl.enableVertexAttribArray(au);gl.vertexAttribPointer(au,2,gl.FLOAT,false,stride,8);
    const uCrop=gl.getUniformLocation(prog,'u_crop'),uBg=gl.getUniformLocation(prog,'u_bg'),uFit=gl.getUniformLocation(prog,'u_fit');
    gl.uniform4fv(uCrop,new Float32Array(analysis.crop));
    gl.uniform3f(uBg,analysis.bg.r,analysis.bg.g,analysis.bg.b);

    const cropW=analysis.crop[2]*video.videoWidth,cropH=analysis.crop[3]*video.videoHeight;
    const ratio=cropW/cropH;
    if(ratio>=1) gl.uniform2f(uFit,0.93,0.93/ratio); else gl.uniform2f(uFit,0.93*ratio,0.93);

    const tex=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
    gl.clearColor(0,0,0,0);gl.viewport(0,0,canvas.width,canvas.height);

    return ()=>{
      if(video.readyState<2) return;
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bindTexture(gl.TEXTURE_2D,tex);
      try{gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,video);}catch{return;}
      gl.drawArrays(gl.TRIANGLES,0,6);
    };
  }

  function schedule(player){
    if(player.cancelled) return;
    const tick=()=>{
      if(!player.stage.isConnected){player.cancelled=true;players.delete(player);return;}
      player.render();
      if(typeof player.video.requestVideoFrameCallback==='function') player.handle=player.video.requestVideoFrameCallback(tick);
      else player.handle=requestAnimationFrame(tick);
    };
    if(typeof player.video.requestVideoFrameCallback==='function') player.handle=player.video.requestVideoFrameCallback(tick);
    else player.handle=requestAnimationFrame(tick);
  }

  function play(player){
    const p=player.video.play();
    if(p&&p.catch) p.catch(()=>setTimeout(()=>{if(player.stage.isConnected)player.video.play().catch(()=>{});},250));
  }

  function enhanceTrophy(img){
    if(!(img instanceof HTMLImageElement)||img.closest('.champion-trophy-video-stage')||img.dataset.sclTrophyWebglPending==='true') return;
    img.dataset.sclTrophyWebglPending='true';
    const parent=img.parentNode;if(!parent)return;

    const stage=document.createElement('span');stage.className='champion-trophy-video-stage';stage.setAttribute('role','img');stage.setAttribute('aria-label',img.alt||'Sister Cities trophy');
    const fallback=img.cloneNode(true);fallback.classList.add('champion-trophy-video-fallback');fallback.alt='';fallback.setAttribute('aria-hidden','true');stage.appendChild(fallback);
    const canvas=document.createElement('canvas');canvas.width=INTERNAL_SIZE;canvas.height=INTERNAL_SIZE;canvas.className='champion-trophy-video-canvas';canvas.setAttribute('aria-hidden','true');stage.appendChild(canvas);
    const video=document.createElement('video');video.className='champion-trophy-video-source';video.src=VIDEO_SRC;video.autoplay=true;video.loop=true;video.muted=true;video.defaultMuted=true;video.playsInline=true;video.preload='auto';video.disablePictureInPicture=true;video.setAttribute('muted','');video.setAttribute('playsinline','');video.setAttribute('webkit-playsinline','');video.setAttribute('aria-hidden','true');stage.appendChild(video);
    parent.insertBefore(stage,img);img.remove();

    const begin=()=>{
      if(!stage.isConnected)return;
      const info=analyze(video)||{crop:[0,0,1,1],bg:{r:1,g:1,b:1}};
      let render;
      try{render=createRenderer(canvas,video,info);}catch(e){console.warn('Trophy WebGL renderer failed',e);}
      if(!render){stage.classList.add('webgl-failed');play({stage,video});return;}
      const player={stage,video,render,handle:0,cancelled:false};players.add(player);
      render();stage.classList.add('is-ready');play(player);schedule(player);
    };
    video.addEventListener('loadeddata',begin,{once:true});
    video.addEventListener('canplay',()=>{for(const p of players)if(p.video===video)play(p);});
    video.load();
  }

  function enhanceAll(){const root=document.getElementById('championTeam');if(!root)return;root.querySelectorAll('.champion-trophy:not(.champion-trophy-video-fallback)').forEach(enhanceTrophy);}
  enhanceAll();
  const root=document.getElementById('championTeam');if(root)new MutationObserver(()=>requestAnimationFrame(enhanceAll)).observe(root,{childList:true,subtree:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)players.forEach(play);});
  window.addEventListener('pageshow',()=>players.forEach(play));
})();
