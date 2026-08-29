// =====================
// SISTER CITIES — PROCEDURAL VOLUMETRIC CHAMPION TROPHY
//
// trophy.png is a single front-facing transparent image, so neither rotateY()
// nor a stack of copied images can produce a convincing side view. This pass
// renders every frame into one high-resolution canvas instead:
//   • the exact trophy.png supplies the front/back artwork;
//   • its alpha silhouette is measured once in-browser;
//   • each horizontal row gets a tapered depth value from the trophy's width;
//   • the rotating side is drawn as ONE continuous shaded metallic body.
//
// At 90/270 degrees the trophy therefore keeps a narrow, shaped profile rather
// than becoming paper-thin, an accordion of images, or a rectangular column.
// =====================

(function initSclChampionTrophy3D() {
  if (window.SCL_CHAMPION_TROPHY_3D_INSTALLED) return;
  window.SCL_CHAMPION_TROPHY_3D_INSTALLED = true;

  const SIZE = 240;              // 4.36x the 55px CSS display size
  const PADDING = 14;
  const CYCLE_MS = 5000;
  const ALPHA_THRESHOLD = 22;
  const modelCache = new Map();
  const players = new Set();
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  let rafId = 0;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  function alphaBounds(imageData, width, height) {
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const alpha = imageData[((y * width + x) * 4) + 3];
        if (alpha <= ALPHA_THRESHOLD) continue;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }

    return maxX >= minX && maxY >= minY
      ? { minX, minY, maxX, maxY }
      : null;
  }

  function smoothSeries(values, firstY, lastY, radius = 2) {
    const output = new Float32Array(values.length);

    for (let y = firstY; y <= lastY; y += 1) {
      let total = 0;
      let weightTotal = 0;
      for (let offset = -radius; offset <= radius; offset += 1) {
        const yy = y + offset;
        if (yy < firstY || yy > lastY) continue;
        const weight = (radius + 1) - Math.abs(offset);
        total += values[yy] * weight;
        weightTotal += weight;
      }
      output[y] = weightTotal ? total / weightTotal : values[y];
    }

    return output;
  }

  async function buildModel(src) {
    if (modelCache.has(src)) return modelCache.get(src);

    const promise = (async () => {
      const image = await loadImage(src);

      // First pass: fit the original image into a modest analysis canvas and
      // find the real non-transparent trophy bounds.
      const raw = document.createElement('canvas');
      raw.width = SIZE;
      raw.height = SIZE;
      const rawCtx = raw.getContext('2d', { willReadFrequently: true });
      rawCtx.imageSmoothingEnabled = true;
      rawCtx.imageSmoothingQuality = 'high';

      const containScale = Math.min(SIZE / image.naturalWidth, SIZE / image.naturalHeight);
      const containW = image.naturalWidth * containScale;
      const containH = image.naturalHeight * containScale;
      const containX = (SIZE - containW) / 2;
      const containY = (SIZE - containH) / 2;
      rawCtx.drawImage(image, containX, containY, containW, containH);

      const rawPixels = rawCtx.getImageData(0, 0, SIZE, SIZE);
      const bounds = alphaBounds(rawPixels.data, SIZE, SIZE);
      if (!bounds) throw new Error('Trophy artwork has no visible alpha silhouette.');

      // Second pass: crop away transparent padding and normalize the trophy into
      // the 240x240 render square. This keeps the side profile centered and crisp.
      const face = document.createElement('canvas');
      face.width = SIZE;
      face.height = SIZE;
      const faceCtx = face.getContext('2d', { willReadFrequently: true });
      faceCtx.imageSmoothingEnabled = true;
      faceCtx.imageSmoothingQuality = 'high';

      const cropW = (bounds.maxX - bounds.minX) + 1;
      const cropH = (bounds.maxY - bounds.minY) + 1;
      const usable = SIZE - (PADDING * 2);
      const cropScale = Math.min(usable / cropW, usable / cropH);
      const drawW = cropW * cropScale;
      const drawH = cropH * cropScale;
      const drawX = (SIZE - drawW) / 2;
      const drawY = (SIZE - drawH) / 2;

      faceCtx.drawImage(
        raw,
        bounds.minX,
        bounds.minY,
        cropW,
        cropH,
        drawX,
        drawY,
        drawW,
        drawH
      );

      const back = document.createElement('canvas');
      back.width = SIZE;
      back.height = SIZE;
      const backCtx = back.getContext('2d');
      backCtx.drawImage(face, 0, 0);
      backCtx.globalCompositeOperation = 'source-atop';
      backCtx.fillStyle = 'rgba(68, 43, 15, .18)';
      backCtx.fillRect(0, 0, SIZE, SIZE);
      backCtx.globalCompositeOperation = 'source-over';

      // Measure the normalized silhouette row-by-row. We use the outermost
      // visible pixels as the front contour, then derive a smaller depth contour
      // from each row's width. Wide trophy sections get more body; narrow stems
      // remain narrow from the side.
      const pixels = faceCtx.getImageData(0, 0, SIZE, SIZE).data;
      const left = new Float32Array(SIZE);
      const right = new Float32Array(SIZE);
      left.fill(Number.NaN);
      right.fill(Number.NaN);

      let firstY = SIZE;
      let lastY = -1;

      for (let y = 0; y < SIZE; y += 1) {
        let rowLeft = SIZE;
        let rowRight = -1;

        for (let x = 0; x < SIZE; x += 1) {
          const alpha = pixels[((y * SIZE + x) * 4) + 3];
          if (alpha <= ALPHA_THRESHOLD) continue;
          if (x < rowLeft) rowLeft = x;
          if (x > rowRight) rowRight = x;
        }

        if (rowRight >= rowLeft) {
          left[y] = rowLeft;
          right[y] = rowRight;
          firstY = Math.min(firstY, y);
          lastY = Math.max(lastY, y);
        }
      }

      if (lastY < firstY) throw new Error('Unable to build trophy side profile.');

      // Fill any tiny transparent gaps between disconnected artwork pieces so
      // the 90-degree view reads as one manufactured trophy body, not fragments.
      for (let y = firstY; y <= lastY; y += 1) {
        if (!Number.isNaN(left[y])) continue;

        let prev = y - 1;
        while (prev >= firstY && Number.isNaN(left[prev])) prev -= 1;
        let next = y + 1;
        while (next <= lastY && Number.isNaN(left[next])) next += 1;

        if (prev >= firstY && next <= lastY) {
          const t = (y - prev) / (next - prev);
          left[y] = left[prev] + ((left[next] - left[prev]) * t);
          right[y] = right[prev] + ((right[next] - right[prev]) * t);
        } else if (prev >= firstY) {
          left[y] = left[prev];
          right[y] = right[prev];
        } else if (next <= lastY) {
          left[y] = left[next];
          right[y] = right[next];
        }
      }

      const smoothLeft = smoothSeries(left, firstY, lastY, 2);
      const smoothRight = smoothSeries(right, firstY, lastY, 2);
      const depth = new Float32Array(SIZE);

      for (let y = firstY; y <= lastY; y += 1) {
        const span = Math.max(1, smoothRight[y] - smoothLeft[y]);
        // At full side view this gives roughly 2.3–6.5 CSS px of visible width,
        // depending on the actual trophy section. That is enough volume to read
        // as solid without becoming the thick rectangular bar seen previously.
        depth[y] = clamp(3.8 + (span * 0.050), 5.0, 14.2);
      }

      return {
        face,
        back,
        left: smoothLeft,
        right: smoothRight,
        depth,
        firstY,
        lastY,
        axis: SIZE / 2
      };
    })();

    modelCache.set(src, promise);
    return promise;
  }

  function traceVolume(ctx, model, cos, absSin) {
    const { axis, left, right, depth, firstY, lastY } = model;
    const leftProjected = new Float32Array((lastY - firstY) + 1);
    const rightProjected = new Float32Array((lastY - firstY) + 1);

    for (let y = firstY; y <= lastY; y += 1) {
      const a = axis + ((left[y] - axis) * cos);
      const b = axis + ((right[y] - axis) * cos);
      const side = depth[y] * absSin;
      const index = y - firstY;
      leftProjected[index] = Math.min(a, b) - side;
      rightProjected[index] = Math.max(a, b) + side;
    }

    ctx.beginPath();
    ctx.moveTo(leftProjected[0], firstY);
    for (let y = firstY + 1; y <= lastY; y += 1) {
      ctx.lineTo(leftProjected[y - firstY], y);
    }
    for (let y = lastY; y >= firstY; y -= 1) {
      ctx.lineTo(rightProjected[y - firstY], y);
    }
    ctx.closePath();
  }

  function drawFrame(player, now) {
    const { ctx, canvas, model } = player;
    const reduce = Boolean(reduceMotion?.matches);
    const phase = reduce ? 0 : ((now - player.startedAt) % CYCLE_MS) / CYCLE_MS;
    const angle = phase * Math.PI * 2;
    const cos = Math.cos(angle);
    const absCos = Math.abs(cos);
    const sin = Math.sin(angle);
    const absSin = Math.abs(sin);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Side body first: a single tapered metallic envelope derived from the
    // trophy silhouette. No repeated artwork exists in this side view.
    traceVolume(ctx, model, cos, absSin);

    const extent = 44;
    const gradient = ctx.createLinearGradient(
      model.axis - extent,
      0,
      model.axis + extent,
      0
    );

    if (sin >= 0) {
      gradient.addColorStop(0.00, '#2d1b09');
      gradient.addColorStop(0.18, '#6f4517');
      gradient.addColorStop(0.43, '#b97d2d');
      gradient.addColorStop(0.60, '#ddb15a');
      gradient.addColorStop(0.78, '#8b571c');
      gradient.addColorStop(1.00, '#321f0a');
    } else {
      gradient.addColorStop(0.00, '#321f0a');
      gradient.addColorStop(0.22, '#8b571c');
      gradient.addColorStop(0.40, '#ddb15a');
      gradient.addColorStop(0.57, '#b97d2d');
      gradient.addColorStop(0.82, '#6f4517');
      gradient.addColorStop(1.00, '#2d1b09');
    }

    ctx.fillStyle = gradient;
    ctx.fill();

    // Soft rim only when the object is substantially turned. This helps the
    // side read as one rounded metal surface instead of a flat gold cutout.
    if (absSin > 0.20) {
      ctx.save();
      traceVolume(ctx, model, cos, absSin);
      ctx.clip();
      const shineX = model.axis + (sin * 8);
      const shine = ctx.createLinearGradient(shineX - 15, 0, shineX + 15, 0);
      shine.addColorStop(0.00, 'rgba(255,255,255,0)');
      shine.addColorStop(0.48, 'rgba(255,233,173,.20)');
      shine.addColorStop(0.55, 'rgba(255,244,206,.32)');
      shine.addColorStop(1.00, 'rgba(255,255,255,0)');
      ctx.fillStyle = shine;
      ctx.fillRect(0, model.firstY, SIZE, model.lastY - model.firstY + 1);
      ctx.restore();
    }

    // Draw the detailed trophy face as a horizontally projected surface. It
    // naturally disappears at 90 degrees while the shaped body remains.
    if (absCos > 0.018) {
      ctx.save();
      ctx.globalAlpha = clamp(Math.pow(absCos, 0.45) * 1.10, 0, 1);
      ctx.translate(model.axis, 0);
      ctx.scale(cos, 1);
      ctx.translate(-model.axis, 0);
      ctx.drawImage(cos >= 0 ? model.face : model.back, 0, 0);
      ctx.restore();
    }
  }

  function animationLoop(now) {
    rafId = 0;

    players.forEach(player => {
      if (!player.stage.isConnected) {
        players.delete(player);
        return;
      }
      drawFrame(player, now);
    });

    if (players.size && !reduceMotion?.matches) {
      rafId = window.requestAnimationFrame(animationLoop);
    }
  }

  function ensureAnimation() {
    if (!rafId && players.size && !reduceMotion?.matches) {
      rafId = window.requestAnimationFrame(animationLoop);
    }
  }

  async function enhanceTrophy(img) {
    if (!img || img.closest('.champion-trophy-volume')) return;
    if (img.dataset.sclTrophyCanvasPending === 'true') return;
    img.dataset.sclTrophyCanvasPending = 'true';

    const src = img.currentSrc || img.src;
    if (!src) return;

    try {
      const model = await buildModel(src);
      if (!img.isConnected) return;

      const stage = document.createElement('span');
      stage.className = 'champion-trophy-volume';
      stage.setAttribute('role', 'img');
      stage.setAttribute('aria-label', img.alt || 'Trophy');

      const canvas = document.createElement('canvas');
      canvas.width = SIZE;
      canvas.height = SIZE;
      canvas.setAttribute('aria-hidden', 'true');
      stage.appendChild(canvas);

      const parent = img.parentNode;
      parent.insertBefore(stage, img);
      img.remove();

      const player = {
        stage,
        canvas,
        ctx: canvas.getContext('2d'),
        model,
        startedAt: performance.now()
      };

      player.ctx.imageSmoothingEnabled = true;
      player.ctx.imageSmoothingQuality = 'high';
      players.add(player);
      drawFrame(player, player.startedAt);
      ensureAnimation();
    } catch (error) {
      // Keep the original static trophy visible if enhancement ever fails.
      delete img.dataset.sclTrophyCanvasPending;
      console.warn('SCL trophy volume renderer could not initialize.', error);
    }
  }

  function enhanceTrophies() {
    const championTeam = document.getElementById('championTeam');
    if (!championTeam) return;

    championTeam
      .querySelectorAll('.champion-trophy:not([data-scl-trophy-canvas-pending="true"])')
      .forEach(enhanceTrophy);
  }

  function scheduleEnhance() {
    window.requestAnimationFrame(enhanceTrophies);
  }

  enhanceTrophies();

  const championTeam = document.getElementById('championTeam');
  if (championTeam) {
    const observer = new MutationObserver(scheduleEnhance);
    observer.observe(championTeam, { childList: true, subtree: true });
  }

  reduceMotion?.addEventListener?.('change', () => {
    players.forEach(player => {
      player.startedAt = performance.now();
      drawFrame(player, player.startedAt);
    });
    ensureAnimation();
  });
})();
