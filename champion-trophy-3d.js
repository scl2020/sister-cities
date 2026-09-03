// =====================
// SISTER CITIES — VIDEO-DRIVEN CHAMPION TROPHY
// Uses the real 360-degree trophy footage uploaded to GitHub. The source video
// remains hidden; each frame is chroma-keyed against its border background and
// drawn into a transparent, high-resolution canvas shown in the Champion card.
// =====================

(function initSclChampionTrophyVideo() {
  if (window.SCL_CHAMPION_TROPHY_VIDEO_INSTALLED) return;
  window.SCL_CHAMPION_TROPHY_VIDEO_INSTALLED = true;

  const VIDEO_SRC = './assets/gemini_generated_video_3906FDD0.mp4';
  const DISPLAY_RES = 300;
  const ANALYSIS_MAX = 320;
  const OUTPUT_PADDING = 16;
  const players = new Set();

  function dominantBorderColor(data, width, height) {
    const bins = new Map();
    const step = Math.max(1, Math.floor(Math.min(width, height) / 80));
    const edge = Math.max(2, Math.floor(Math.min(width, height) * 0.035));

    function addPixel(x, y) {
      const i = ((y * width) + x) * 4;
      const a = data[i + 3];
      if (a < 180) return;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const key = `${r >> 4},${g >> 4},${b >> 4}`;
      const entry = bins.get(key) || { count: 0, r: 0, g: 0, b: 0 };
      entry.count += 1;
      entry.r += r;
      entry.g += g;
      entry.b += b;
      bins.set(key, entry);
    }

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < edge; x += step) addPixel(x, y);
      for (let x = Math.max(0, width - edge); x < width; x += step) addPixel(x, y);
    }
    for (let x = 0; x < width; x += step) {
      for (let y = 0; y < edge; y += step) addPixel(x, y);
      for (let y = Math.max(0, height - edge); y < height; y += step) addPixel(x, y);
    }

    let winner = null;
    bins.forEach(entry => {
      if (!winner || entry.count > winner.count) winner = entry;
    });

    if (!winner || !winner.count) return { r: 255, g: 255, b: 255 };
    return {
      r: winner.r / winner.count,
      g: winner.g / winner.count,
      b: winner.b / winner.count
    };
  }

  function isolateFrame(player) {
    const { video, sourceCanvas, sourceCtx, outputCanvas, outputCtx } = player;
    if (!video.videoWidth || !video.videoHeight || video.readyState < 2) return false;

    if (!player.sourceReady) {
      const scale = Math.min(1, ANALYSIS_MAX / Math.max(video.videoWidth, video.videoHeight));
      sourceCanvas.width = Math.max(2, Math.round(video.videoWidth * scale));
      sourceCanvas.height = Math.max(2, Math.round(video.videoHeight * scale));
      player.sourceReady = true;
    }

    const sw = sourceCanvas.width;
    const sh = sourceCanvas.height;
    sourceCtx.clearRect(0, 0, sw, sh);
    sourceCtx.drawImage(video, 0, 0, sw, sh);

    let frame;
    try {
      frame = sourceCtx.getImageData(0, 0, sw, sh);
    } catch {
      return false;
    }

    const pixels = frame.data;
    const bg = dominantBorderColor(pixels, sw, sh);
    const bgLum = (bg.r + bg.g + bg.b) / 3;
    const low = bgLum > 230 || bgLum < 25 ? 20 : 27;
    const high = bgLum > 230 || bgLum < 25 ? 78 : 92;
    const low2 = low * low;
    const high2 = high * high;

    let minX = sw;
    let minY = sh;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < sh; y += 1) {
      for (let x = 0; x < sw; x += 1) {
        const i = ((y * sw) + x) * 4;
        const dr = pixels[i] - bg.r;
        const dg = pixels[i + 1] - bg.g;
        const db = pixels[i + 2] - bg.b;
        const dist2 = (dr * dr) + (dg * dg) + (db * db);

        let alpha;
        if (dist2 <= low2) {
          alpha = 0;
        } else if (dist2 >= high2) {
          alpha = 255;
        } else {
          const t = (Math.sqrt(dist2) - low) / (high - low);
          const smooth = t * t * (3 - (2 * t));
          alpha = Math.round(255 * smooth);
        }

        pixels[i + 3] = alpha;

        if (alpha > 42) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX < minX || maxY < minY) return false;

    sourceCtx.putImageData(frame, 0, 0);

    const marginX = Math.max(2, Math.round((maxX - minX + 1) * 0.035));
    const marginY = Math.max(2, Math.round((maxY - minY + 1) * 0.035));
    minX = Math.max(0, minX - marginX);
    maxX = Math.min(sw - 1, maxX + marginX);
    minY = Math.max(0, minY - marginY);
    maxY = Math.min(sh - 1, maxY + marginY);

    const cropW = (maxX - minX) + 1;
    const cropH = (maxY - minY) + 1;
    const usable = DISPLAY_RES - (OUTPUT_PADDING * 2);
    const scale = Math.min(usable / cropW, usable / cropH);
    const drawW = cropW * scale;
    const drawH = cropH * scale;
    const drawX = (DISPLAY_RES - drawW) / 2;
    const drawY = (DISPLAY_RES - drawH) / 2;

    outputCtx.clearRect(0, 0, DISPLAY_RES, DISPLAY_RES);
    outputCtx.drawImage(sourceCanvas, minX, minY, cropW, cropH, drawX, drawY, drawW, drawH);

    if (!player.ready) {
      player.ready = true;
      player.stage.classList.add('is-ready');
    }
    return true;
  }

  function scheduleFrames(player) {
    if (player.cancelled) return;

    if (typeof player.video.requestVideoFrameCallback === 'function') {
      player.frameHandle = player.video.requestVideoFrameCallback(() => {
        if (!player.stage.isConnected) {
          destroyPlayer(player);
          return;
        }
        isolateFrame(player);
        scheduleFrames(player);
      });
      return;
    }

    const tick = () => {
      if (player.cancelled) return;
      if (!player.stage.isConnected) {
        destroyPlayer(player);
        return;
      }
      isolateFrame(player);
      player.frameHandle = window.requestAnimationFrame(tick);
    };
    player.frameHandle = window.requestAnimationFrame(tick);
  }

  function destroyPlayer(player) {
    if (!player || player.cancelled) return;
    player.cancelled = true;
    players.delete(player);
    try {
      if (typeof player.video.cancelVideoFrameCallback === 'function' && player.frameHandle) {
        player.video.cancelVideoFrameCallback(player.frameHandle);
      } else if (player.frameHandle) {
        window.cancelAnimationFrame(player.frameHandle);
      }
    } catch {}
    try { player.video.pause(); } catch {}
  }

  function startPlayback(player) {
    const playPromise = player.video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        const retry = () => {
          if (!player.stage.isConnected) return;
          player.video.play().catch(() => {});
        };
        window.setTimeout(retry, 250);
        window.setTimeout(retry, 900);
      });
    }
  }

  function enhanceTrophy(img) {
    if (!(img instanceof HTMLImageElement)) return;
    if (img.closest('.champion-trophy-video-stage')) return;
    if (img.dataset.sclTrophyVideoPending === 'true') return;
    img.dataset.sclTrophyVideoPending = 'true';

    const stage = document.createElement('span');
    stage.className = 'champion-trophy-video-stage';
    stage.setAttribute('role', 'img');
    stage.setAttribute('aria-label', img.alt || 'Sister Cities trophy');

    const fallback = img.cloneNode(true);
    fallback.classList.add('champion-trophy-video-fallback');
    fallback.removeAttribute('id');
    fallback.setAttribute('aria-hidden', 'true');
    fallback.alt = '';
    stage.appendChild(fallback);

    const canvas = document.createElement('canvas');
    canvas.width = DISPLAY_RES;
    canvas.height = DISPLAY_RES;
    canvas.setAttribute('aria-hidden', 'true');
    stage.appendChild(canvas);

    const video = document.createElement('video');
    video.className = 'champion-trophy-video-source';
    video.src = VIDEO_SRC;
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('aria-hidden', 'true');
    stage.appendChild(video);

    const parent = img.parentNode;
    if (!parent) return;
    parent.insertBefore(stage, img);
    img.remove();

    const sourceCanvas = document.createElement('canvas');
    const sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
    const outputCtx = canvas.getContext('2d', { alpha: true });
    if (!sourceCtx || !outputCtx) return;

    sourceCtx.imageSmoothingEnabled = true;
    sourceCtx.imageSmoothingQuality = 'high';
    outputCtx.imageSmoothingEnabled = true;
    outputCtx.imageSmoothingQuality = 'high';

    const player = {
      stage,
      video,
      sourceCanvas,
      sourceCtx,
      outputCanvas: canvas,
      outputCtx,
      sourceReady: false,
      ready: false,
      frameHandle: 0,
      cancelled: false
    };
    players.add(player);

    const begin = () => {
      if (player.cancelled) return;
      startPlayback(player);
      isolateFrame(player);
      scheduleFrames(player);
    };

    video.addEventListener('loadeddata', begin, { once: true });
    video.addEventListener('canplay', () => startPlayback(player));
    video.addEventListener('ended', () => startPlayback(player));
    video.addEventListener('error', () => player.stage.classList.remove('is-ready'));
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
      if (player.stage.isConnected) startPlayback(player);
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
