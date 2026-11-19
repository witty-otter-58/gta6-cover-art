// Fixed scenes for screenshots, driven by the query string:
//   ?shot=editor — the full page, sample photos loaded into the slots.
//   ?shot=cover  — the cover alone, filling the viewport.
// Common params: layout (grid|strips|hero), grade (sunset|neon|teal),
// size (1080x1080|1080x1350|1920x1080), caption, tagline,
// photos (comma list of sample names, one per slot), one (1 = one photo
// fills every panel), crop (comma list of slot:zoom:panX:panY overrides,
// e.g. 0:1:0:0.6 pans slot 0 down so a wide panel shows a face, not a torso).
// window.__shotReady is set once the cover is painted.
export async function runShot(shot, query, state, app) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const size = (query.get('size') || '1080x1080').split('x').map(Number);
  const names = (query.get('photos') || 'pier,boulevard,pier').split(',');
  const loaded = [];
  for (const name of names) {
    loaded.push(await app.loadImage(`samples/${name}.jpg`));
  }
  const crops = state.crops.map((c) => ({ ...c }));
  for (const part of (query.get('crop') || '').split(',').filter(Boolean)) {
    const [slot, zoom, panX, panY] = part.split(':').map(Number);
    if (Number.isInteger(slot) && crops[slot]) {
      crops[slot] = {
        zoom: zoom || 1,
        panX: panX || 0,
        panY: panY || 0,
      };
    }
  }
  const next = {
    photos: loaded,
    crops,
    layout: query.get('layout') || 'grid',
    grade: query.get('grade') || 'sunset',
    caption: query.get('caption') || 'Sunset Heist',
    tagline: query.get('tagline') || 'One last job on the coast',
    onePhoto: query.get('one') === '1',
    sizeW: size[0] || 1080,
    sizeH: size[1] || 1080,
  };
  app.setState(next);
  app.redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
