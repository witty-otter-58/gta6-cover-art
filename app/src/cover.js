// Sunset Coast cover renderer. Everything is drawn on one canvas: a set of
// photo panels (2 x 2 grid, three vertical strips, or one hero panel over
// two small ones), a sunset / neon colour grade washed over them, a synthwave
// sun with slats, and the caption in big bold italic capitals with a tagline
// under it. No images are fetched: photos come from the page's own <img>
// objects, loaded from the user's files or the bundled samples.

export const GRADES = {
  sunset: {
    sky: ['#ff9a3c', '#ff5e62', '#c724b1'],
    wash: 'rgba(255, 94, 98, 0.28)',
    accent: '#ffb347',
    band: '#1c0b2e',
  },
  neon: {
    sky: ['#00e5ff', '#7b2ff7', '#ff2e88'],
    wash: 'rgba(0, 229, 255, 0.22)',
    accent: '#00e5ff',
    band: '#0b1030',
  },
  teal: {
    sky: ['#2de1c2', '#2b6cb0', '#7b2ff7'],
    wash: 'rgba(45, 225, 194, 0.20)',
    accent: '#2de1c2',
    band: '#0b1e2e',
  },
};

/** Panel rectangles for a layout, as fractions of the canvas. The last rect
 *  is the caption band; the rest are photo panels. */
export function panelRects(layout, w, h) {
  const gap = 0.008 * Math.min(w, h);
  const bandH = h * 0.22;
  const top = h - bandH;
  if (layout === 'strips') {
    const pw = (w - gap * 4) / 3;
    return [
      { x: gap, y: gap, w: pw, h: top - gap * 2 },
      { x: gap * 2 + pw, y: gap, w: pw, h: top - gap * 2 },
      { x: gap * 3 + pw * 2, y: gap, w: pw, h: top - gap * 2 },
      { x: 0, y: top, w, h: bandH },
    ];
  }
  if (layout === 'hero') {
    const heroH = (top - gap * 3) * 0.62;
    const smallH = top - gap * 3 - heroH;
    const sw = (w - gap * 3) / 2;
    return [
      { x: gap, y: gap, w: w - gap * 2, h: heroH },
      { x: gap, y: gap * 2 + heroH, w: sw, h: smallH },
      { x: gap * 2 + sw, y: gap * 2 + heroH, w: sw, h: smallH },
      { x: 0, y: top, w, h: bandH },
    ];
  }
  const pw = (w - gap * 3) / 2;
  const ph = (top - gap * 3) / 2;
  return [
    { x: gap, y: gap, w: pw, h: ph },
    { x: gap * 2 + pw, y: gap, w: pw, h: ph },
    { x: gap, y: gap * 2 + ph, w: pw, h: ph },
    { x: gap * 2 + pw, y: gap * 2 + ph, w: pw, h: ph },
    { x: 0, y: top, w, h: bandH },
  ];
}

/** Draws one photo into a panel rect, cover-fit, with a zoom and a pan.
 *  `shift` slides the crop window so the same photo looks different in
 *  each panel when one photo fills the whole cover. */
export function drawPanelPhoto(ctx, img, rect, crop, shift) {
  if (!img) return false;
  const zoom = crop.zoom || 1;
  const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
  const dw = img.naturalWidth * base * zoom;
  const dh = img.naturalHeight * base * zoom;
  const ox = (dw - rect.w) / 2;
  const oy = (dh - rect.h) / 2;
  const dx = (crop.panX || 0) + (shift ? shift.x : 0);
  const dy = (crop.panY || 0) + (shift ? shift.y : 0);
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(img, rect.x - ox + dx * ox, rect.y - oy + dy * oy, dw, dh);
  ctx.restore();
  return true;
}

function drawSun(ctx, cx, cy, r, grade) {
  const sun = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  grade.sky.forEach((c, i) => sun.addColorStop(i / (grade.sky.length - 1), c));
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = sun;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  // Slats cut across the sun's lower half, synthwave style.
  ctx.fillStyle = 'rgba(20, 8, 40, 0.85)';
  let y = cy + r * 0.05;
  let thick = r * 0.045;
  while (y < cy + r) {
    ctx.fillRect(cx - r, y, r * 2, thick);
    y += thick * 2.4;
    thick *= 1.35;
  }
  ctx.restore();
}

function fitFont(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `italic 900 ${size}px "Arial Black", Impact, "Helvetica Neue", sans-serif`;
  while (size > 12 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `italic 900 ${size}px "Arial Black", Impact, "Helvetica Neue", sans-serif`;
  }
  return size;
}

/**
 * Draws the whole cover onto `canvas` at its own pixel size.
 * state: { photos: (HTMLImageElement|null)[], crops: {zoom,panX,panY}[],
 *   layout, grade, caption, tagline, onePhoto }
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const rects = panelRects(state.layout || 'grid', w, h);
  const band = rects[rects.length - 1];
  const panels = rects.slice(0, -1);

  // Deep dusk backdrop; panels sit on it with thin gaps.
  ctx.fillStyle = '#160a24';
  ctx.fillRect(0, 0, w, h);

  const shifts = [
    { x: -0.35, y: -0.2 },
    { x: 0.35, y: 0.15 },
    { x: -0.15, y: 0.3 },
    { x: 0.3, y: -0.3 },
  ];
  panels.forEach((rect, i) => {
    const slot = state.onePhoto ? 0 : i % state.photos.length;
    const img = state.photos[slot] || state.photos[0];
    const crop = state.crops[slot] || { zoom: 1, panX: 0, panY: 0 };
    const filled = drawPanelPhoto(
      ctx,
      img,
      rect,
      crop,
      state.onePhoto ? shifts[i % shifts.length] : null,
    );
    if (!filled) {
      const g = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
      g.addColorStop(0, '#3a1c5c');
      g.addColorStop(1, '#1c0b2e');
      ctx.fillStyle = g;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = `700 ${Math.round(rect.h * 0.055)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('ADD A PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
    }
    // Thin bright frame around each panel.
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = Math.max(2, w * 0.002);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  });

  // Colour grade washed over the photo area only.
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, w, band.y);
  ctx.clip();
  const wash = ctx.createLinearGradient(0, 0, w, band.y);
  wash.addColorStop(0, grade.wash);
  wash.addColorStop(0.6, 'rgba(255, 94, 98, 0.10)');
  wash.addColorStop(1, 'rgba(120, 20, 140, 0.30)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, band.y);
  const vignette = ctx.createRadialGradient(
    w / 2, band.y / 2, Math.min(w, band.y) * 0.35,
    w / 2, band.y / 2, Math.max(w, band.y) * 0.75,
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(10,0,20,0.45)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, band.y);
  ctx.restore();

  // The sun is tucked into the top-right corner so it never sits on a face.
  // The hero layout's wide top panel is mostly sky, so its sun is bigger
  // and hangs lower; the tighter grid and strip layouts get a small sun
  // clipped hard into the corner.
  const heroSun = state.layout === 'hero';
  const sunR = Math.min(w, h) * (heroSun ? 0.13 : 0.075);
  const sunX = heroSun ? w - sunR * 0.9 : w - sunR * 0.2;
  const sunY = heroSun ? sunR * 1.05 : sunR * 0.75;
  drawSun(ctx, sunX, sunY, sunR, grade);

  // Caption band.
  ctx.fillStyle = grade.band;
  ctx.fillRect(band.x, band.y, band.w, band.h);
  ctx.fillStyle = grade.accent;
  ctx.fillRect(band.x, band.y, band.w, Math.max(3, h * 0.006));

  const caption = (state.caption || '').trim().toUpperCase();
  if (caption) {
    const size = fitFont(ctx, caption, w * 0.92, band.h * 0.44);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(20, 4, 40, 0.9)';
    ctx.lineWidth = size * 0.14;
    ctx.strokeText(caption, w / 2, band.y + band.h * 0.42);
    const grad = ctx.createLinearGradient(0, band.y, 0, band.y + band.h * 0.7);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, '#ffd9a0');
    ctx.fillStyle = grad;
    ctx.fillText(caption, w / 2, band.y + band.h * 0.42);
  }
  const tagline = (state.tagline || '').trim().toUpperCase();
  if (tagline) {
    let size = band.h * 0.13;
    ctx.font = `600 ${size}px system-ui, sans-serif`;
    while (size > 10 && ctx.measureText(tagline).width > w * 0.88) {
      size -= 1;
      ctx.font = `600 ${size}px system-ui, sans-serif`;
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    // Letterspaced by hand: canvas has no letter-spacing everywhere.
    const spaced = tagline.split('').join('  ');
    ctx.fillText(spaced, w / 2, band.y + band.h * 0.82);
  }
}
