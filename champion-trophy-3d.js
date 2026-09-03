// =====================
// SISTER CITIES — HD TRANSPARENT VIDEO CHAMPION TROPHY
//
// Desktop keeps the WebGL path that already renders cleanly. Mobile/iOS uses a
// high-resolution 2D matte instead because Mobile Safari can show a live-only
// rectangular WebGL compositing layer even when the canvas itself is transparent.
// Both paths use the uploaded Gemini MP4 as the only animation source.
// =====================

(function initSclChampionTrophyTransparentVideo(){
  if(window.SCL_CHAMPION_TROPHY_VIDEO_INSTALLED) return;
  window.SCL_CHAMPION_TROPHY_VIDEO_INSTALLED = true;

  const VIDEO_SRC = './assets/gemini_generated_video_3906FDD0.mp4';
  const INTERNAL_SIZE = 360; // 6x the 60px CSS footprint; sharp on Retina screens
  const ANALYSIS_MAX = 360;
  const CROP_PADDING = 0.075;
  const players = new Set();

  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const useMobile2D = isIOS || window.matchMedia('(max-width: 820px)').matches;

  function dominantBorderColor(data,w,h){
    let r=0,g=0,b=0,n=0;
    const edge=Math.max(3,Math.floor(Math.min(w,h)*0.055));
    const step=Math.max(1,Math.floor(Math.min(w,h)/90));
    const add=(x,y)=>{
      const i=((y*w)+x)*4;
      if(data[i+3] < 16) return;
      r+=data[i]; g+=data[i+1]; b+=data[i+2]; n++;
    };
    for(let y=0;y<h;y+=step){
      for(let x=0;x<edge;x+=step) add(x,y);
      for(let x=Math.max(0,w-edge);x<w;x+=step) add(x,y);
    }
    for(let x=0;x<w;x+=step){
      for(let y=0;y<edge;y+=step) add(x,y);
      for(let y=Math.max(0,h-edge);y<h;y+=step) add(x,y);
    }
    return n ? {r:r/n/255,g:g/n/255,b:b/n/255} : {r:1,g:1,b:1};
  }

  function analyze(video){
    if(!video.videoWidth||!video.videoHeight) return null;
    const s=Math.min(1,ANALYSIS_MAX/Math.max(video.videoWidth,video.videoHeight));
    const w=Math.max(2,Math.round(video.videoWidth*s));
    const h=Math.max(2,Math.round(video.videoHeight*s));
    const c=document.createElement('canvas');
    c.width=w; c.height=h;
    const ctx=c.getContext('2d',{willReadFrequently:true});
    if(!ctx) return null;
    ctx.imageSmoothingEnabled=true;
    ctx.imageSmoothingQuality='high';
    ctx.drawImage(video,0,0,w,h);

    let f;
    try{ f=ctx.getImageData(0,0,w,h); }catch{ return null; }
    const p=f.data;
    const bg=dominantBorderColor(p,w,h);
    const br=bg.r*255,bgG=bg.g*255,bb=bg.b*255;

    let minX=w,minY=h,maxX=-1,maxY=-1;
    const closeThreshold=62;
    const close2=closeThreshold*closeThreshold;

    for(let y=0;y<h;y++){
      for(let x=0;x<w;x++){
        const i=((y*w)+x)*4;
        const rr=p[i],gg=p[i+1],bbp=p[i+2];
        const hi=Math.max(rr,gg,bbp),lo=Math.min(rr,gg,bbp);
        const chroma=hi-lo;
        const lum=(rr+gg+bbp)/3;
        const dr=rr-br,dg=gg-bgG,db=bbp-bb;
        const dist2=dr*dr+dg*dg+db*db;

        const neutralStudio=(lum>172 && chroma<58);
        const nearBorderColor=(dist2<=close2 && lum>150 && chroma<70);
        if(neutralStudio || nearBorderColor) continue;

        if(x<minX)minX=x;
        if(x>maxX)maxX=x;
        if(y<minY)minY=y;
        if(y>maxY)maxY=y;
      }
    }

    if(maxX<minX||maxY<minY) return {crop:[0,0,1,1],bg};

    const cw=maxX-minX+1,ch=maxY-minY+1;
    const px=cw*CROP_PADDING,py=ch*CROP_PADDING;
    minX=Math.max(0,minX-px); maxX=Math.min(w,maxX+px);
    minY=Math.max(0,minY-py); maxY=Math.min(h,maxY+py);

    return {
      crop:[minX/w,minY/h,(maxX-minX)/w,(maxY-minY)/h],
      bg
    };
  }

  function compileShader(gl,type,src){
    const sh=gl.createShader(type);
    gl.shaderSource(sh,src);
    gl.compileShader(sh);
    if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)){
      throw new Error(gl.getShaderInfoLog(sh)||'shader compile failed');
    }
    return sh;
  }

  function createWebGLRenderer(canvas,video,analysis){
    const gl=canvas.getContext('webgl',{
      alpha:true,
      premultipliedAlpha:false,
      antialias:true,
      preserveDrawingBuffer:false
    });
    if(!gl) return null;

    const vs=compileShader(gl,gl.VERTEX_SHADER,`
      attribute vec2 a_pos;
      attribute vec2 a_uv;
      varying vec2 v_uv;
      uniform vec2 u_fit;
      void main(){
        gl_Position=vec4(a_pos*u_fit,0.0,1.0);
        v_uv=a_uv;
      }
    `);

    const fs=compileShader(gl,gl.FRAGMENT_SHADER,`
      precision highp float;
      varying vec2 v_uv;
      uniform sampler2D u_tex;
      uniform vec4 u_crop;
      uniform vec3 u_bg;

      void main(){
        vec2 uv=vec2(
          u_crop.x + v_uv.x*u_crop.z,
          u_crop.y + v_uv.y*u_crop.w
        );
        vec4 c=texture2D(u_tex,uv);

        float hi=max(c.r,max(c.g,c.b));
        float lo=min(c.r,min(c.g,c.b));
        float chroma=hi-lo;
        float lum=dot(c.rgb,vec3(0.2126,0.7152,0.0722));
        float dist=distance(c.rgb,u_bg);

        float alphaDist=smoothstep(0.105,0.315,dist);
        float colorProtect=smoothstep(0.060,0.175,chroma);
        float darkProtect=1.0-smoothstep(0.555,0.775,lum);
        float alpha=max(alphaDist,max(colorProtect,darkProtect));

        float neutral=1.0-smoothstep(0.055,0.155,chroma);
        float lightNeutral=smoothstep(0.60,0.91,lum);
        float backdropRange=1.0-smoothstep(0.22,0.43,dist);
        float studio=neutral*lightNeutral*backdropRange;
        alpha=mix(alpha,0.0,studio*0.985);

        float pale=smoothstep(0.73,0.975,lum)
          *(1.0-smoothstep(0.075,0.19,chroma))
          *(1.0-smoothstep(0.23,0.42,dist));
        alpha*=1.0-(pale*0.96);

        alpha=clamp(alpha,0.0,1.0);
        if(alpha<0.018) discard;
        gl_FragColor=vec4(c.rgb,c.a*alpha);
      }
    `);

    const program=gl.createProgram();
    gl.attachShader(program,vs);
    gl.attachShader(program,fs);
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS)){
      throw new Error(gl.getProgramInfoLog(program)||'program link failed');
    }
    gl.useProgram(program);

    const buf=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,buf);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([
      -1,-1, 0,0,   1,-1, 1,0,  -1,1, 0,1,
      -1, 1, 0,1,   1,-1, 1,0,   1,1, 1,1
    ]),gl.STATIC_DRAW);

    const stride=16;
    const aPos=gl.getAttribLocation(program,'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos,2,gl.FLOAT,false,stride,0);
    const aUv=gl.getAttribLocation(program,'a_uv');
    gl.enableVertexAttribArray(aUv);
    gl.vertexAttribPointer(aUv,2,gl.FLOAT,false,stride,8);

    const uCrop=gl.getUniformLocation(program,'u_crop');
    const uBg=gl.getUniformLocation(program,'u_bg');
    const uFit=gl.getUniformLocation(program,'u_fit');
    gl.uniform4fv(uCrop,new Float32Array(analysis.crop));
    gl.uniform3f(uBg,analysis.bg.r,analysis.bg.g,analysis.bg.b);

    const cropW=analysis.crop[2]*video.videoWidth;
    const cropH=analysis.crop[3]*video.videoHeight;
    const ratio=cropW/cropH;
    if(ratio>=1) gl.uniform2f(uFit,0.95,0.95/ratio);
    else gl.uniform2f(uFit,0.95*ratio,0.95);

    const tex=gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D,tex);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);

    gl.clearColor(0,0,0,0);
    gl.viewport(0,0,canvas.width,canvas.height);

    return ()=>{
      if(video.readyState<2) return;
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bindTexture(gl.TEXTURE_2D,tex);
      try{
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,video);
      }catch{
        return;
      }
      gl.drawArrays(gl.TRIANGLES,0,6);
    };
  }

  // Mobile Safari path: process the source video directly into a 360x360 2D
  // canvas. The old blurry version first shrank the video to a tiny analysis
  // frame and then enlarged it again; this renderer never does that. A border-
  // connected flood matte removes the studio rectangle without erasing bright
  // silver/gold details inside the trophy.
  function createMobile2DRenderer(canvas,video,analysis){
    const ctx=canvas.getContext('2d',{alpha:true,willReadFrequently:true});
    if(!ctx) return null;
    ctx.imageSmoothingEnabled=true;
    ctx.imageSmoothingQuality='high';

    const cropX=analysis.crop[0]*video.videoWidth;
    const cropY=analysis.crop[1]*video.videoHeight;
    const cropW=analysis.crop[2]*video.videoWidth;
    const cropH=analysis.crop[3]*video.videoHeight;
    const ratio=cropW/cropH;
    const fit=0.95;
    let drawW,drawH;
    if(ratio>=1){
      drawW=canvas.width*fit;
      drawH=drawW/ratio;
    }else{
      drawH=canvas.height*fit;
      drawW=drawH*ratio;
    }
    const drawX=(canvas.width-drawW)/2;
    const drawY=(canvas.height-drawH)/2;

    let candidate=null, mask=null, queue=null;

    const isCandidate=(d,i,bgr,bgg,bgb)=>{
      if(d[i+3] < 10) return false;
      const r=d[i],g=d[i+1],b=d[i+2];
      const hi=Math.max(r,g,b),lo=Math.min(r,g,b);
      const chroma=hi-lo;
      const lum=(r+g+b)/3;
      const dr=r-bgr,dg=g-bgg,db=b-bgb;
      const dist=Math.sqrt(dr*dr+dg*dg+db*db);
      return lum>142 && chroma<68 && dist<138;
    };

    return ()=>{
      if(video.readyState<2) return;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      try{
        ctx.drawImage(video,cropX,cropY,cropW,cropH,drawX,drawY,drawW,drawH);
      }catch{
        return;
      }

      const x0=Math.max(0,Math.floor(drawX));
      const y0=Math.max(0,Math.floor(drawY));
      const x1=Math.min(canvas.width,Math.ceil(drawX+drawW));
      const y1=Math.min(canvas.height,Math.ceil(drawY+drawH));
      const w=Math.max(1,x1-x0);
      const h=Math.max(1,y1-y0);

      let frame;
      try{ frame=ctx.getImageData(x0,y0,w,h); }catch{ return; }
      const d=frame.data;
      const bg=dominantBorderColor(d,w,h);
      const bgr=bg.r*255,bgg=bg.g*255,bgb=bg.b*255;
      const total=w*h;
      if(!candidate||candidate.length!==total){
        candidate=new Uint8Array(total);
        mask=new Uint8Array(total);
        queue=new Int32Array(total);
      }else{
        candidate.fill(0);
        mask.fill(0);
      }

      for(let p=0;p<total;p++){
        const i=p*4;
        candidate[p]=isCandidate(d,i,bgr,bgg,bgb)?1:0;
      }

      let head=0,tail=0;
      const seed=(p)=>{
        if(p<0||p>=total||!candidate[p]||mask[p]) return;
        mask[p]=1;
        queue[tail++]=p;
      };
      for(let x=0;x<w;x++){
        seed(x);
        seed((h-1)*w+x);
      }
      for(let y=0;y<h;y++){
        seed(y*w);
        seed(y*w+(w-1));
      }

      while(head<tail){
        const p=queue[head++];
        const x=p%w;
        if(x>0) seed(p-1);
        if(x<w-1) seed(p+1);
        if(p>=w) seed(p-w);
        if(p<total-w) seed(p+w);
      }

      for(let p=0;p<total;p++){
        const i=p*4;
        if(mask[p]){
          d[i+3]=0;
          continue;
        }

        const x=p%w;
        const touchesBg=(x>0&&mask[p-1]) || (x<w-1&&mask[p+1]) ||
          (p>=w&&mask[p-w]) || (p<total-w&&mask[p+w]);
        if(!touchesBg) continue;

        const r=d[i],g=d[i+1],b=d[i+2];
        const hi=Math.max(r,g,b),lo=Math.min(r,g,b);
        const chroma=hi-lo;
        const lum=(r+g+b)/3;
        const dr=r-bgr,dg=g-bgg,db=b-bgb;
        const dist=Math.sqrt(dr*dr+dg*dg+db*db);
        if(lum>145 && chroma<78 && dist<150){
          const t=Math.max(0,Math.min(1,(dist-24)/(150-24)));
          const smooth=t*t*(3-2*t);
          d[i+3]=Math.min(d[i+3],Math.round(255*smooth));
        }
      }

      ctx.putImageData(frame,x0,y0);
    };
  }

  function schedule(player){
    if(player.cancelled) return;
    const tick=()=>{
      if(!player.stage.isConnected){
        player.cancelled=true;
        players.delete(player);
        return;
      }
      player.render();
      if(typeof player.video.requestVideoFrameCallback==='function'){
        player.handle=player.video.requestVideoFrameCallback(tick);
      }else{
        player.handle=requestAnimationFrame(tick);
      }
    };
    if(typeof player.video.requestVideoFrameCallback==='function'){
      player.handle=player.video.requestVideoFrameCallback(tick);
    }else{
      player.handle=requestAnimationFrame(tick);
    }
  }

  function play(player){
    const p=player.video.play();
    if(p&&p.catch){
      p.catch(()=>setTimeout(()=>{
        if(player.stage.isConnected) player.video.play().catch(()=>{});
      },250));
    }
  }

  function enhanceTrophy(img){
    if(!(img instanceof HTMLImageElement)) return;
    if(img.closest('.champion-trophy-video-stage')) return;
    if(img.dataset.sclTrophyVideoPending==='true') return;
    img.dataset.sclTrophyVideoPending='true';

    const parent=img.parentNode;
    if(!parent) return;

    const stage=document.createElement('span');
    stage.className='champion-trophy-video-stage';
    if(useMobile2D) stage.classList.add('mobile-2d');
    stage.setAttribute('role','img');
    stage.setAttribute('aria-label',img.alt||'Sister Cities trophy');

    const fallback=img.cloneNode(true);
    fallback.classList.add('champion-trophy-video-fallback');
    fallback.alt='';
    fallback.setAttribute('aria-hidden','true');
    stage.appendChild(fallback);

    const canvas=document.createElement('canvas');
    canvas.width=INTERNAL_SIZE;
    canvas.height=INTERNAL_SIZE;
    canvas.className='champion-trophy-video-canvas';
    canvas.setAttribute('aria-hidden','true');
    stage.appendChild(canvas);

    const video=document.createElement('video');
    video.className='champion-trophy-video-source';
    video.src=VIDEO_SRC;
    video.autoplay=true;
    video.loop=true;
    video.muted=true;
    video.defaultMuted=true;
    video.playsInline=true;
    video.preload='auto';
    video.disablePictureInPicture=true;
    video.setAttribute('muted','');
    video.setAttribute('playsinline','');
    video.setAttribute('webkit-playsinline','');
    video.setAttribute('aria-hidden','true');
    stage.appendChild(video);

    parent.insertBefore(stage,img);
    img.remove();

    const begin=()=>{
      if(!stage.isConnected) return;
      const info=analyze(video)||{crop:[0,0,1,1],bg:{r:1,g:1,b:1}};
      let render=null;
      try{
        render=useMobile2D
          ? createMobile2DRenderer(canvas,video,info)
          : createWebGLRenderer(canvas,video,info);
      }catch(error){
        console.warn('Trophy transparency renderer failed',error);
      }
      if(!render) return;

      const player={stage,video,render,handle:0,cancelled:false};
      players.add(player);
      render();
      stage.classList.add('is-ready');
      play(player);
      schedule(player);
    };

    video.addEventListener('loadeddata',begin,{once:true});
    video.addEventListener('canplay',()=>{
      for(const p of players) if(p.video===video) play(p);
    });
    video.load();
  }

  function enhanceAll(){
    const root=document.getElementById('championTeam');
    if(!root) return;
    root.querySelectorAll('.champion-trophy:not(.champion-trophy-video-fallback)').forEach(enhanceTrophy);
  }

  enhanceAll();
  const root=document.getElementById('championTeam');
  if(root){
    new MutationObserver(()=>requestAnimationFrame(enhanceAll))
      .observe(root,{childList:true,subtree:true});
  }

  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden) players.forEach(play);
  });
  window.addEventListener('pageshow',()=>players.forEach(play));
})();
