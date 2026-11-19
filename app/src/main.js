// Wires Sunset Coast: three photo slots (your files, read on this machine
// and never uploaded), per-photo crop sliders, layout / grade / caption /
// tagline controls, a live preview, and a PNG export at the post size you
// pick. A `?shot=` query sets up a fixed scene for a screenshot instead
// (see shots.js): editor shows the page with sample photos loaded, cover
// shows the cover alone at the export size.
import { drawCover } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const $ = (id) => document.getElementById(id);
const captionEl = $('caption');
const taglineEl = $('tagline');
const layoutEl = $('layout');
const gradeEl = $('grade');
const sizeEl = $('size');
const statusEl = $('status');
const onePhotoEl = $('onePhoto');
const cropSlotEl = $('cropSlot');
const zoomEl = $('zoom');
const panXEl = $('panX');
const panYEl = $('panY');

const state = {
  photos: [null, null, null],
  crops: [
    { zoom: 1, panX: 0, panY: 0 },
    { zoom: 1, panX: 0, panY: 0 },
    { zoom: 1, panX: 0, panY: 0 },
  ],
  layout: 'grid',
  grade: 'sunset',
  caption: 'Sunset Heist',
  tagline: 'One last job on the coast',
  onePhoto: false,
};

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function exportSize() {
  const [w, h] = sizeEl.value.split('x').map(Number);
  return { w, h };
}

function redraw() {
  const { w, h } = exportSize();
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  drawCover(canvas, state);
}

function syncCropInputs() {
  const crop = state.crops[Number(cropSlotEl.value)];
  zoomEl.value = String(Math.round(crop.zoom * 100));
  panXEl.value = String(Math.round(crop.panX * 100));
  panYEl.value = String(Math.round(crop.panY * 100));
}

function readControls() {
  state.layout = layoutEl.value;
  state.grade = gradeEl.value;
  state.caption = captionEl.value;
  state.tagline = taglineEl.value;
  state.onePhoto = onePhotoEl.checked;
  const crop = state.crops[Number(cropSlotEl.value)];
  crop.zoom = Number(zoomEl.value) / 100;
  crop.panX = Number(panXEl.value) / 100;
  crop.panY = Number(panYEl.value) / 100;
}

function bindFileInput(input, slot) {
  input.addEventListener('change', async () => {
    const file = input.files && input.files[0];
    if (!file) return;
    try {
      state.photos[slot] = await loadImage(URL.createObjectURL(file));
      statusEl.textContent = `Photo ${slot + 1} loaded — ${file.name}`;
      redraw();
    } catch {
      statusEl.textContent = `Could not read ${file.name} as an image.`;
    }
  });
}

bindFileInput($('photo0'), 0);
bindFileInput($('photo1'), 1);
bindFileInput($('photo2'), 2);

document.querySelectorAll('.sample').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const slot = Number(btn.closest('.slot').dataset.slot);
    state.photos[slot] = await loadImage(`samples/${btn.dataset.sample}.jpg`);
    statusEl.textContent = `Sample photo loaded into slot ${slot + 1}.`;
    redraw();
  });
});

[captionEl, taglineEl, layoutEl, gradeEl, sizeEl, onePhotoEl].forEach((el) => {
  el.addEventListener('input', () => {
    readControls();
    redraw();
  });
  el.addEventListener('change', () => {
    readControls();
    redraw();
  });
});
cropSlotEl.addEventListener('change', syncCropInputs);
[zoomEl, panXEl, panYEl].forEach((el) => {
  el.addEventListener('input', () => {
    readControls();
    redraw();
  });
});

$('export').addEventListener('click', () => {
  const { w, h } = exportSize();
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawCover(off, state);
  off.toBlob((blob) => {
    if (!blob) {
      statusEl.textContent = 'Export failed — try again.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `sunset-coast-${w}x${h}.png`;
    a.click();
    statusEl.textContent = `Saved sunset-coast-${w}x${h}.png`;
  }, 'image/png');
});

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), state, {
    loadImage,
    setState(next) {
      Object.assign(state, next);
      layoutEl.value = state.layout;
      gradeEl.value = state.grade;
      sizeEl.value = `${state.sizeW}x${state.sizeH}`;
      captionEl.value = state.caption;
      taglineEl.value = state.tagline;
      onePhotoEl.checked = state.onePhoto;
      syncCropInputs();
    },
    redraw,
  });
} else {
  redraw();
}
