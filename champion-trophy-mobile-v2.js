// =====================
// SISTER CITIES — MOBILE HD TROPHY MATTE V2
// Mobile-only renderer for the uploaded Gemini 360 trophy video.
// Keeps the existing 60px size, continuous autoplay/loop and transparent
// free-floating presentation, while protecting bright silver/gold highlights
// from being mistaken for the studio background.
// =====================

(function initSclChampionTrophyMobileV2(){
  const ua=navigator.userAgent||'';
  const isIOS=/iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
  const isMobile=isIOS || window.matchMedia('(max-width: 820px)').matches;
  if(!isMobile) return;

  // Block the legacy trophy renderer on mobile only. Desktop still loads it.
  window.SCL_CHAMPION_TROPHY_VIDEO_INSTALLED=true;

  const VIDEO_SRC='./assets/gemini_generated_video_3906FDD0.mp4';
  const INTERNAL_SIZE=360;
  const ANALYSIS_MAX=360;
  const CROP_PADDING=0.075;
  const players=new Set();

  function dominantBorderColor(data,w,h){
    let r=0,g=0,b=0,n=0;
    const edge=Math.max(3,Math.floor(Math.min(w,h)*0.055));
    const step=Math.max(1,Math.floor(Math.min(w,h)/90));
    const add=(x,y)=>{
      const i=((y*w)+x)*4;
      if(data[i+3]<16) return;
      r+=data[i];g+=data[i+1];b+=data[i+2];n++;
    };
    for(let y=0;y<h;y+=step){
      for(let x=0;x<edge;x+=step)add(x,y);
      for(let x=Math.max(0,w-edge);x<w;x+=step)add(x,y);
    }
    for(let x=0;x<w;x+=step){
      for(let y=0;y<edge;y+=step)add(x,y);
      for(let y=Math.max(0,h-edge);y<h;y+=step)add(x,y);
    }
    return n?{r:r/n/255,g:g/n/255,b:b/n/255}:{r:1,g:1,b:1};
  }

  function analyze(video){
    if(!video.videoWidth||!video.videoHeight)return null;
    const s=Math.min(1,ANALYSIS_MAX/Math.max(video.videoWidth,video.videoHeight));
    const w=Math.max(2,Math.round(video.videoWidth*s));
    const h=Math.max(2,Math.round(video.videoHeight*s));
    const c=document.createElement('canvas');
    c.width=w;c.height=h;
    const ctx=c.getContext('2d',{willReadFrequently:true});
    if(!ctx)return null;
    ctx.imageSmoothingEnabled=true;
    ctx.imageSmoothingQuality='high';
    ctx.drawImage(video,0,0,w,h);
    let frame;
    try{frame=ctx.getImageData(0,0,w,h);}catch{return null;}
    const d=frame.data;
    const bg=dominantBorderColor(d,w,h);
    const br=bg.r*255,bgG=bg.g*255,bb=bg.b*255;
    let minX=w,minY=h,maxX=-1,maxY=-1;
    const close2=62*62;

    for(let y=0;y<h;y++){
      for(let x=0;x<w;x++){
        const i=((y*w)+x)*4;
        const r=d[i],g=d[i+1],b=d[i+2];
        const hi=Math.max(r,g,b),lo=Math.min(r,g,b);
        const chroma=hi-lo;
        const lum=(r+g+b)/3;
        const dr=r-br,dg=g-bgG,db=b-bb;
        const dist2=dr*dr+dg*dg+db*db;
        const studio=(lum>172&&chroma<58) || (dist2<=close2&&lum>150&&chroma<70);
        if(studio)continue;
        if(x<minX)minX=x;if(x>maxX)maxX=x;
        if(y<minY)minY=y;if(y>maxY)maxY=y;
      }
    }

    if(maxX<minX||maxY<minY)return {crop:[0,0,1,1]};
    const cw=maxX-minX+1,ch=maxY-minY+1;
    const px=cw*CROP_PADDING,py=ch*CROP_PADDING;
    minX=Math.max(0,minX-px);maxX=Math.min(w,maxX+px);
    minY=Math.max(0,minY-py);maxY=Math.min(h,maxY+py);
    return {crop:[minX/w,minY/h,(maxX-minX)/w,(maxY-minY)/h]};
  }

  function createRenderer(canvas,video,analysis){
    const ctx=canvas.getContext('2d',{alpha:true,willReadFrequently:true});
    if(!ctx)return null;
    ctx.imageSmoothingEnabled=true;
    ctx.imageSmoothingQuality='high';

    const cropX=analysis.crop[0]*video.videoWidth;
    const cropY=analysis.crop[1]*video.videoHeight;
    const cropW=analysis.crop[2]*video.videoWidth;
    const cropH=analysis.crop[3]*video.videoHeight;
    const ratio=cropW/cropH;
    const fit=0.95;
    let drawW,drawH;
    if(ratio>=1){drawW=canvas.width*fit;drawH=drawW/ratio;}
    else{drawH=canvas.height*fit;drawW=drawH*ratio;}
    const drawX=(canvas.width-drawW)/2;
    const drawY=(canvas.height-drawH)/2;

    let candidate=null,mask=null,queue=null,holeSeen=null,holeQueue=null,componentSeen=null,componentQueue=null;

    function localGradient(d,p,w,h){
      const x=p%w,y=(p/w)|0,i=p*4;
      const r=d[i],g=d[i+1],b=d[i+2];
      let maxDiff=0;
      const test=(q)=>{
        const j=q*4;
        const diff=(Math.abs(r-d[j])+Math.abs(g-d[j+1])+Math.abs(b-d[j+2]))/3;
        if(diff>maxDiff)maxDiff=diff;
      };
      if(x>0)test(p-1);
      if(x<w-1)test(p+1);
      if(y>0)test(p-w);
      if(y<h-1)test(p+w);
      return maxDiff;
    }

    function isBackgroundCandidate(d,p,w,h,bgr,bgg,bgb){
      const i=p*4;
      if(d[i+3]<10)return false;
      const r=d[i],g=d[i+1],b=d[i+2];
      const hi=Math.max(r,g,b),lo=Math.min(r,g,b);
      const chroma=hi-lo;
      const lum=(r+g+b)/3;
      const dr=r-bgr,dg=g-bgg,db=b-bgb;
      const dist=Math.sqrt(dr*dr+dg*dg+db*db);
      const grad=localGradient(d,p,w,h);

      // Background is smooth, neutral and connected to the frame edge.
      // Metallic highlights may also be bright/neutral, but their local gradient
      // is usually much stronger, which prevents the flood from entering them.
      const ultraSmoothGray=lum>132 && chroma<46 && dist<150 && grad<11;
      const normalStudio=lum>148 && chroma<58 && dist<140 && grad<24;
      const brightStudio=lum>178 && chroma<68 && dist<165 && grad<34;
      return ultraSmoothGray || normalStudio || brightStudio;
    }

    return ()=>{
      if(video.readyState<2)return;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      try{ctx.drawImage(video,cropX,cropY,cropW,cropH,drawX,drawY,drawW,drawH);}catch{return;}

      const x0=Math.max(0,Math.floor(drawX));
      const y0=Math.max(0,Math.floor(drawY));
      const x1=Math.min(canvas.width,Math.ceil(drawX+drawW));
      const y1=Math.min(canvas.height,Math.ceil(drawY+drawH));
      const w=Math.max(1,x1-x0),h=Math.max(1,y1-y0),total=w*h;

      let frame;
      try{frame=ctx.getImageData(x0,y0,w,h);}catch{return;}
      const d=frame.data;
      const bg=dominantBorderColor(d,w,h);
      const bgr=bg.r*255,bgg=bg.g*255,bgb=bg.b*255;

      if(!candidate||candidate.length!==total){
        candidate=new Uint8Array(total);
        mask=new Uint8Array(total);
        queue=new Int32Array(total);
        holeSeen=new Uint8Array(total);
        holeQueue=new Int32Array(total);
        componentSeen=new Uint8Array(total);
        componentQueue=new Int32Array(total);
      }else{
        candidate.fill(0);mask.fill(0);holeSeen.fill(0);componentSeen.fill(0);
      }

      for(let p=0;p<total;p++)candidate[p]=isBackgroundCandidate(d,p,w,h,bgr,bgg,bgb)?1:0;

      // Flood ONLY from the outside border. Bright trophy pixels that happen to
      // resemble the backdrop are preserved unless a smooth background path can
      // physically reach them from the edge.
      let head=0,tail=0;
      const seed=(p)=>{
        if(p<0||p>=total||!candidate[p]||mask[p])return;
        mask[p]=1;queue[tail++]=p;
      };
      for(let x=0;x<w;x++){seed(x);seed((h-1)*w+x);}
      for(let y=0;y<h;y++){seed(y*w);seed(y*w+w-1);}
      while(head<tail){
        const p=queue[head++],x=p%w;
        if(x>0)seed(p-1);if(x<w-1)seed(p+1);
        if(p>=w)seed(p-w);if(p<total-w)seed(p+w);
      }

      for(let p=0;p<total;p++)if(mask[p])d[p*4+3]=0;

      // Hole protection: if an accidentally removed transparent area is fully
      // enclosed by the trophy rather than connected to the outside canvas,
      // restore its original alpha. This specifically prevents the white/glare
      // cutouts seen on bright silver and gold surfaces.
      head=0;tail=0;
      const seedHole=(p)=>{
        if(p<0||p>=total||holeSeen[p]||d[p*4+3]>8)return;
        holeSeen[p]=1;holeQueue[tail++]=p;
      };
      for(let x=0;x<w;x++){seedHole(x);seedHole((h-1)*w+x);}
      for(let y=0;y<h;y++){seedHole(y*w);seedHole(y*w+w-1);}
      while(head<tail){
        const p=holeQueue[head++],x=p%w;
        if(x>0)seedHole(p-1);if(x<w-1)seedHole(p+1);
        if(p>=w)seedHole(p-w);if(p<total-w)seedHole(p+w);
      }
      for(let p=0;p<total;p++){
        if(d[p*4+3]<=8 && !holeSeen[p])d[p*4+3]=255;
      }

      // Remove tiny detached source specks/shadow dots while leaving the trophy
      // itself untouched. Only very small opaque islands are discarded.
      const tinyLimit=Math.max(18,Math.floor(total*0.0009));
      for(let start=0;start<total;start++){
        if(componentSeen[start]||d[start*4+3]<24)continue;
        head=0;tail=0;componentSeen[start]=1;componentQueue[tail++]=start;
        while(head<tail){
          const p=componentQueue[head++],x=p%w;
          const add=(q)=>{
            if(q<0||q>=total||componentSeen[q]||d[q*4+3]<24)return;
            componentSeen[q]=1;componentQueue[tail++]=q;
          };
          if(x>0)add(p-1);if(x<w-1)add(p+1);
          if(p>=w)add(p-w);if(p<total-w)add(p+w);
        }
        if(tail<=tinyLimit){
          for(let k=0;k<tail;k++)d[componentQueue[k]*4+3]=0;
        }
      }

      ctx.putImageData(frame,x0,y0);
    };
  }

  function schedule(player){
    const tick=()=>{
      if(!player.stage.isConnected){player.cancelled=true;players.delete(player);return;}
      player.render();
      if(typeof player.video.requestVideoFrameCallback==='function')player.handle=player.video.requestVideoFrameCallback(tick);
      else player.handle=requestAnimationFrame(tick);
    };
    if(typeof player.video.requestVideoFrameCallback==='function')player.handle=player.video.requestVideoFrameCallback(tick);
    else player.handle=requestAnimationFrame(tick);
  }

  function play(player){
    const p=player.video.play();
    if(p&&p.catch)p.catch(()=>setTimeout(()=>{if(player.stage.isConnected)player.video.play().catch(()=>{});},250));
  }

  function enhanceTrophy(img){
    if(!(img instanceof HTMLImageElement))return;
    if(img.closest('.champion-trophy-video-stage'))return;
    if(img.dataset.sclTrophyMobileV2==='true')return;
    img.dataset.sclTrophyMobileV2='true';
    const parent=img.parentNode;if(!parent)return;

    const stage=document.createElement('span');
    stage.className='champion-trophy-video-stage mobile-2d';
    stage.setAttribute('role','img');
    stage.setAttribute('aria-label',img.alt||'Sister Cities trophy');

    const fallback=img.cloneNode(true);
    fallback.classList.add('champion-trophy-video-fallback');
    fallback.alt='';fallback.setAttribute('aria-hidden','true');
    stage.appendChild(fallback);

    const canvas=document.createElement('canvas');
    canvas.width=INTERNAL_SIZE;canvas.height=INTERNAL_SIZE;
    canvas.className='champion-trophy-video-canvas';
    canvas.setAttribute('aria-hidden','true');
    stage.appendChild(canvas);

    const video=document.createElement('video');
    video.className='champion-trophy-video-source';
    video.src=VIDEO_SRC;video.autoplay=true;video.loop=true;video.muted=true;
    video.defaultMuted=true;video.playsInline=true;video.preload='auto';
    video.disablePictureInPicture=true;
    video.setAttribute('muted','');video.setAttribute('playsinline','');
    video.setAttribute('webkit-playsinline','');video.setAttribute('aria-hidden','true');
    stage.appendChild(video);

    parent.insertBefore(stage,img);img.remove();

    const begin=()=>{
      if(!stage.isConnected)return;
      const info=analyze(video)||{crop:[0,0,1,1]};
      const render=createRenderer(canvas,video,info);
      if(!render)return;
      const player={stage,video,render,handle:0,cancelled:false};
      players.add(player);
      render();stage.classList.add('is-ready');play(player);schedule(player);
    };
    video.addEventListener('loadeddata',begin,{once:true});
    video.addEventListener('canplay',()=>{for(const p of players)if(p.video===video)play(p);});
    video.load();
  }

  function enhanceAll(){
    const root=document.getElementById('championTeam');if(!root)return;
    root.querySelectorAll('.champion-trophy:not(.champion-trophy-video-fallback)').forEach(enhanceTrophy);
  }

  enhanceAll();
  const root=document.getElementById('championTeam');
  if(root)new MutationObserver(()=>requestAnimationFrame(enhanceAll)).observe(root,{childList:true,subtree:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)players.forEach(play);});
  window.addEventListener('pageshow',()=>players.forEach(play));
})();
