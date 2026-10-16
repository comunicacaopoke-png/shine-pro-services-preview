const cases = {
  sofa: { title: "Sofa renewal", description: "A fabric-safe refresh for everyday seating.", before: "sofa-before.png", after: "sofa-after.png" },
  carpet: { title: "Area rug renewal", description: "Traffic marks lift, pattern and texture return.", before: "rug-before.png", after: "rug-after.png" },
  mattress: { title: "Mattress care", description: "A fresher-looking surface, from edge to edge.", before: "mattress-before.png", after: "mattress-after.png" }
};

const range = document.querySelector('#comparison-range');
const before = document.querySelector('#before-layer');
const line = document.querySelector('#slider-line');
function setComparison(value) { before.style.width = `${value}%`; line.style.left = `${value}%`; document.querySelector('#before-image').style.width = `${10000 / value}%`; }
range.addEventListener('input', () => setComparison(range.value));
document.querySelectorAll('[data-case]').forEach((button) => button.addEventListener('click', () => {
  const item = cases[button.dataset.case];
  document.querySelectorAll('[data-case]').forEach((tab) => tab.classList.toggle('active', tab === button));
  document.querySelector('#case-title').textContent = item.title;
  document.querySelector('#case-description').textContent = item.description;
  document.querySelector('#before-image').src = item.before;
  document.querySelector('#after-image').src = item.after;
  range.value = 48; setComparison(48);
}));

const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } }), { threshold: .12 });
document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
const countObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
  if (!entry.isIntersecting) return;
  const element = entry.target; const end = Number(element.dataset.count); const suffix = element.dataset.suffix || ''; const decimals = Number(element.dataset.decimals || 0); const started = performance.now();
  const tick = (now) => { const p = Math.min((now - started) / 1350, 1); const value = end * (1 - Math.pow(1 - p, 4)); element.textContent = `${decimals ? value.toFixed(decimals) : Math.round(value).toLocaleString('en-US')}${suffix}`; if (p < 1) requestAnimationFrame(tick); };
  requestAnimationFrame(tick); countObserver.unobserve(element);
}), { threshold: .6 });
document.querySelectorAll('[data-count]').forEach((element) => countObserver.observe(element));
document.querySelector('#demo-form').addEventListener('submit', (event) => { event.preventDefault(); const note = document.querySelector('.preview-note'); note.hidden = false; note.textContent = 'Presentation preview: request sending will be enabled in the production version.'; });
