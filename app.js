const cases = {
  sofa: { title: "Sofa renewal", description: "A fabric-safe refresh for everyday seating.", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1500&q=90" },
  carpet: { title: "Carpet reset", description: "A closer look at traffic lanes and overall brightness.", image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1500&q=90" },
  mattress: { title: "Mattress care", description: "A fresher-looking surface, from edge to edge.", image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1500&q=90" }
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
  document.querySelector('#before-image').src = item.image;
  document.querySelector('#after-image').src = item.image;
  range.value = 48; setComparison(48);
}));

const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } }), { threshold: .12 });
document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
document.querySelector('#demo-form').addEventListener('submit', (event) => { event.preventDefault(); const note = document.querySelector('.preview-note'); note.hidden = false; note.textContent = 'Presentation preview: request sending will be enabled in the production version.'; });
