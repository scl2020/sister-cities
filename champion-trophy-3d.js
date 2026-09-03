// =====================
// SISTER CITIES — NATIVE VIDEO CHAMPION TROPHY
//
// The uploaded MP4 is already the high-quality 360-degree trophy animation.
// Previous code downsampled every frame to a small analysis canvas, chroma-keyed
// those reduced pixels, then enlarged the cropped result again. That destroyed
// fine detail even though the source video itself was sharp.
//
// This version keeps the MP4 as the visible renderer. A tiny offscreen canvas is
// used ONCE only to locate the trophy inside the frame; the browser then displays
// the original decoded video pixels directly, cropped by CSS. No frame is ever
// resampled through a presentation canvas.
// =====================

(function initSclChampionTrophyNativeVideo() {
  if (window.SCL_CHAMPION_TROPHY_NATIVE_VIDEO_INSTALLED) return;
  window.SCL_CHAMPION_TROPHY_NATIVE_VIDEO_INSTALLED = true;

  const VIDEO_SRC = './assets/gemini_generated_video_3906FDD0.mp4';
  const ANALYSIS_MAX = 360;
  const STAGE_SIZE = 60;
  const CROP_PADDING = 0.065;
  const players = new Set();

  function dominantBorderColor(data, width, height) {
    const bins = new Map();
    const step = Math.max(1, Math.floor(Math.min(width, height) / 72));
    const edge = Math.max(2, Math.floor(Math.min(width, height) * 0.04));

    const add = (x, y) => {
      const i = ((y * width) + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const key = `${r >> 4},${g >> 4},${b >> 4}`;
      const item = bins.get(key) || { count: 0, r: 0, g: 0, b: 0 };
      item.count += 1;
      item.r += r;
      item.g += g;
      item.b += b;
      bins.set(key, item);
    };

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < edge; x += step) add(x, y);
      for (let x = Math.max(0, width - edge); x < width; x += step) add(x, y);
    }
    for (let x = 0; x < width; x += step) {
      for (let y = 0; y < edge; y += step) add(x, y);
      for (let y = Math.max(0, height - edge); y < height; y += step) add(x, y);
    }

    let winner = null;
    bins.forEach(item => {
      if (!winner || item.count > winner.count) winner = item;
    });

    if (!winner) return { r: 255, g: 255, b: 255 };
    return {
      r: winner.r / winner.count,
      g: winner.g / winner.count,
      b: winner.b / winner.count
    };
  }

  function detectCrop(video) {
    if (!video.videoWidth || !video.videoHeight) return null;

    const scale = Math.min(1, ANALYSIS_MAX / Math.max(video.videoWidth, video.videoHeight));
    const aw = Math.max(2, Math.round(video.videoWidth * scale));
    const ah = Math.max(2, Math.round(video.videoHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = aw;
    canvas.height = ah;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(video, 0, 0, aw, ah);

    let frame;
    try {
      frame = ctx.getImageData(0, 0, aw, ah);
    } catch {
      return null;
    }

    const p = frame.data;
    const bg = dominantBorderColor(p, aw, ah);
    const bgLum = (bg.r + bg.g + bg.b) / 3;
    const threshold = bgLum > 225 || bgLum < 30 ? 46 : 58;
    const threshold2 = threshold * threshold;

    let minX = aw;
    let minY = ah;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < ah; y += 1) {
      for (let x = 0; x < aw; x += 1) {
        const i = ((y * aw) + x) * 4;
        const dr = p[i] - bg.r;
        const dg = p[i + 1] - bg.g;
        const db = p[i + 2] - bg.b;
        const dist2 = (dr * dr) + (dg * dg) + (db * db);
        if (dist2 <= threshold2) continue;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }

    if (maxX < minX || maxY < minY) return null;

    const cropW = (maxX - minX) + 1;
    const cropH = (maxY - minY) + 1;
    const padX = cropW * CROP_PADDING;
    const padY = cropH * CROP_PADDING;

    minX = Math.max(0, minX - padX);
    maxX = Math.min(aw, maxX + padX);
    minY = Math.max(0, minY - padY);
    maxY = Math.min(ah, maxY + padY);

    return {
      x: (minX / aw) * video.videoWidth,
      y: (minY / ah) * video.videoHeight,
      width: ((maxX - minX) / aw) * video.videoWidth,
      height: ((maxY - minY) / ah) * video.videoHeight
    };
  }

  function applyNativeCrop(video, crop) {
    if (!crop) {
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.left = '0';
      video.style.top = '0';
      video.style.objectFit = 'contain';
      return;
    }

    const scale = Math.min(STAGE_SIZE / crop.width, STAGE_SIZE / crop.height);
    const renderedW = video.videoWidth * scale;
    const renderedH = video.videoHeight * scale;
    const cropRenderedW = crop.width * scale;
    const cropRenderedH = crop.height * scale;

    video.style.width = `${renderedW}px`;
    video.style.height = `${renderedH}px`;
    video.style.left = `${((STAGE_SIZE - cropRenderedW) / 2) - (crop.x * scale)}px`;
    video.style.top = `${((STAGE_SIZE - cropRenderedH) / 2) - (crop.y * scale)}px`;
    video.style.objectFit = 'fill';
  }

  function startPlayback(player) {
    const promise = player.video.play();
    if (promise && typeof promise.catch === 'function') {
      promise.catch(() => {
        window.setTimeout(() => {
          if (player.stage.isConnected) player.video.play().catch(() => {});
        }, 250);
      });
    }
  }

  function enhanceTrophy(img) {
    if (!(img instanceof HTMLImageElement)) return;
    if (img.closest('.champion-trophy-video-stage')) return;
    if (img.dataset.sclTrophyNativeVideoPending === 'true') return;
    img.dataset.sclTrophyNativeVideoPending = 'true';

    const parent = img.parentNode;
    if (!parent) return;

    const stage = document.createElement('span');
    stage.className = 'champion-trophy-video-stage';
    stage.setAttribute('role', 'img');
    stage.setAttribute('aria-label', img.alt || 'Sister Cities trophy');

    const fallback = img.cloneNode(true);
    fallback.classList.add('champion-trophy-video-fallback');
    fallback.removeAttribute('id');
    fallback.alt = '';
    fallback.setAttribute('aria-hidden', 'true');
    stage.appendChild(fallback);

    const video = document.createElement('video');
    video.className = 'champion-trophy-video-source';
    video.src = VIDEO_SRC;
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.disablePictureInPicture = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('aria-hidden', 'true');
    stage.appendChild(video);

    parent.insertBefore(stage, img);
    img.remove();

    const player = { stage, video };
    players.add(player);

    const prepare = () => {
      if (!stage.isConnected) return;
      const crop = detectCrop(video);
      applyNativeCrop(video, crop);
      stage.classList.add('is-ready');
      startPlayback(player);
    };

    video.addEventListener('loadeddata', prepare, { once: true });
    video.addEventListener('canplay', () => startPlayback(player));
    video.addEventListener('error', () => stage.classList.remove('is-ready'));
    video.load();
  }

  function enhanceAll() {
    const championTeam = document.getElementById('championTeam');
    if (!championTeam) return;
    championTeam
      .querySelectorAll('.champion-trophy:not(.champion-trophy-video-fallback)')
      .forEach(enhanceTrophy);
  }

  function restartVisiblePlayers() {
    players.forEach(player => {
      if (!player.stage.isConnected) {
        players.delete(player);
        return;
      }
      startPlayback(player);
    });
  }

  enhanceAll();

  const championTeam = document.getElementById('championTeam');
  if (championTeam) {
    const observer = new MutationObserver(() => window.requestAnimationFrame(enhanceAll));
    observer.observe(championTeam, { childList: true, subtree: true });
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) restartVisiblePlayers();
  });
  window.addEventListener('pageshow', restartVisiblePlayers);
})();
