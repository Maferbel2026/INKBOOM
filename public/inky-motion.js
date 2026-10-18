/* Approved Inky previews, loaded near their cards and played only on screen. */
let disposeInkyMotion = () => {};

function inkyMoodCard(name, key) {
 return `<figure class="mood-card" data-inky-mood="${key}"><div class="inky-mood-stage"><img class="inky-mood-poster" src="assets/inky-motion/${key}-poster.webp" alt="Inky: ${name}" width="320" height="320" loading="lazy" decoding="async"><div class="inky-mood-sprite" aria-hidden="true" data-frame="0"></div></div><figcaption>${name}</figcaption></figure>`;
}

function mountInkyMotion(root) {
 const section = root.querySelector('.inky-emotions');
 if (!section || !('IntersectionObserver' in window)) return () => {};
 const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
 const control = section.querySelector('[data-inky-toggle]');
 const sequence = [0, 0, 0, 0, 1, 0, 2, 3, 2, 3, 0];
 const focusedSequence = [0, 0, 0, 0, 1, 0, 2, 0, 2, 0];
 const entries = [...section.querySelectorAll('[data-inky-mood]')].map(card => ({
  card, sprite: card.querySelector('.inky-mood-sprite'), key: card.dataset.inkyMood,
  near: false, visible: false, loaded: false, loading: false, phase: 0
 }));
 let paused = false, reduced = preference.matches, timer = null, disposed = false;

 function paint(entry, frame) {
  entry.sprite.dataset.frame = String(frame);
  entry.sprite.style.backgroundPosition = `${frame % 2 * 100}% ${Math.floor(frame / 2) * 100}%`;
 }

 function refresh() {
  clearTimeout(timer); timer = null;
  control.hidden = reduced;
  control.textContent = paused ? 'Animar a Inky ▶' : 'Pausar a Inky ⏸';
  control.setAttribute('aria-pressed', String(paused));
  entries.forEach(entry => {
   entry.card.classList.toggle('is-animated', entry.loaded && !reduced);
   entry.card.dataset.inkyPlaying = String(entry.loaded && entry.visible && !reduced && !paused && !document.hidden);
  });
  if (!disposed && !reduced && !paused && !document.hidden && entries.some(entry => entry.loaded && entry.visible)) {
   timer = setTimeout(tick, 230);
  }
 }

 function tick() {
  timer = null;
  if (disposed) return;
  entries.filter(entry => entry.loaded && entry.visible).forEach(entry => {
   const frames = entry.key === 'enfocado' ? focusedSequence : sequence;
   paint(entry, frames[entry.phase++ % frames.length]);
  });
  refresh();
 }

 function load(entry) {
  if (entry.loaded || entry.loading || reduced || disposed) return;
  entry.loading = true;
  const image = new Image();
  image.decoding = 'async';
  image.onload = async () => {
   try { await image.decode(); } catch { /* onload already confirms a usable image */ }
   if (disposed) return;
   entry.loaded = true;
   entry.sprite.style.backgroundImage = `url("${image.src}")`;
   paint(entry, 0);
   refresh();
  };
  image.onerror = () => { entry.loading = false; };
  image.src = `assets/inky-motion/${entry.key}-sheet.webp`;
 }

 const nearby = new IntersectionObserver(changes => {
  changes.forEach(change => {
   const entry = entries.find(item => item.card === change.target);
   entry.near = change.isIntersecting;
   if (entry.near) load(entry);
  });
 }, { rootMargin: '300px 0px' });
 const visibility = new IntersectionObserver(changes => {
  changes.forEach(change => {
   entries.find(item => item.card === change.target).visible = change.isIntersecting;
  });
  refresh();
 }, { threshold: 0 });
 function toggle() { paused = !paused; refresh(); }
 function preferenceChanged() {
  reduced = preference.matches;
  if (!reduced) entries.filter(entry => entry.near).forEach(load);
  refresh();
 }
 control.addEventListener('click', toggle);
 document.addEventListener('visibilitychange', refresh);
 preference.addEventListener('change', preferenceChanged);
 entries.forEach(entry => { nearby.observe(entry.card); visibility.observe(entry.card); });
 refresh();
 return () => {
  disposed = true;
  clearTimeout(timer);
  nearby.disconnect(); visibility.disconnect();
  control.removeEventListener('click', toggle);
  document.removeEventListener('visibilitychange', refresh);
  preference.removeEventListener('change', preferenceChanged);
 };
}
