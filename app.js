const WORKER_ORIGIN = 'https://shine-pro-services.pokecomunicacao.workers.dev';

let cases = {
  sofa: { title: "Sofa renewal", description: "A fabric-safe refresh for everyday seating.", before: "sofa-before.png", after: "sofa-after.png" },
  carpet: { title: "Area rug renewal", description: "Traffic marks lift, pattern and texture return.", before: "rug-before.png", after: "rug-after.png" },
  mattress: { title: "Mattress care", description: "A fresher-looking surface, from edge to edge.", before: "mattress-before.png", after: "mattress-after.png" }
};

const range = document.querySelector('#comparison-range');
const before = document.querySelector('#before-layer');
const line = document.querySelector('#slider-line');
function setComparison(value) { before.style.width = `${value}%`; line.style.left = `${value}%`; document.querySelector('#before-image').style.width = `${10000 / value}%`; }
range.addEventListener('input', () => setComparison(range.value));
function selectCase(id) {
  const item = cases[id];
  if (!item) return;
  document.querySelectorAll('[data-case]').forEach((tab) => tab.classList.toggle('active', tab.dataset.case === id));
  document.querySelector('#case-title').textContent = item.title;
  document.querySelector('#case-description').textContent = item.description;
  document.querySelector('#before-image').src = item.before;
  document.querySelector('#after-image').src = item.after;
  range.value = 48; setComparison(48);
}
function bindCaseTabs() {
  document.querySelectorAll('[data-case]').forEach((button) => button.addEventListener('click', () => selectCase(button.dataset.case)));
}
bindCaseTabs();

let faqPendingOpen;
function faqMarkup(faqs) {
  return faqs.map((faq, index) => `<article class="faq-item"><button class="faq-question" type="button" aria-expanded="false" aria-controls="faq-answer-${index}"><span>${escapeHtml(faq.question)}</span><b aria-hidden="true">+</b></button><div class="faq-answer" id="faq-answer-${index}" aria-hidden="true"><div><p>${escapeHtml(faq.answer)}</p></div></div></article>`).join('');
}
function upgradeFaqFallback() {
  const list = document.querySelector('.faq-list');
  if (!list || list.querySelector('.faq-question')) return;
  const faqs = [...list.querySelectorAll('details')].map((detail) => {
    const summary = detail.querySelector('summary');
    const symbol = summary?.querySelector('b');
    symbol?.remove();
    return { question: summary?.textContent?.trim() || '', answer: detail.querySelector('p')?.textContent?.trim() || '' };
  });
  if (faqs.length) list.innerHTML = faqMarkup(faqs);
}
function bindFaqAccordion() {
  const list = document.querySelector('.faq-list');
  if (!list) return;
  let openItem = list.querySelector('.faq-item.is-open');
  list.querySelectorAll('.faq-question').forEach((button) => button.addEventListener('click', () => {
    const item = button.closest('.faq-item');
    if (!item) return;
    const setOpen = (target, open) => {
      target.classList.toggle('is-open', open);
      target.querySelector('.faq-question').setAttribute('aria-expanded', String(open));
      target.querySelector('.faq-answer').setAttribute('aria-hidden', String(!open));
    };
    if (faqPendingOpen) { clearTimeout(faqPendingOpen); faqPendingOpen = null; }
    if (openItem === item) { setOpen(item, false); openItem = null; return; }
    if (openItem) {
      setOpen(openItem, false);
      openItem = null;
      faqPendingOpen = setTimeout(() => { setOpen(item, true); openItem = item; faqPendingOpen = null; }, 380);
      return;
    }
    setOpen(item, true);
    openItem = item;
  }));
}
upgradeFaqFallback();
bindFaqAccordion();

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' })[character]);
}
function assetUrl(value) {
  if (!value) return '';
  if (/^https?:\/\//.test(value)) return value;
  if (value.startsWith('/api/media/')) return `${WORKER_ORIGIN}${value}`;
  return value.split('/').pop();
}
function metricValue(value) {
  const text = String(value || '0');
  const number = Number(text.replace(/[^0-9.]/g, '')) || 0;
  const suffix = text.replace(/[0-9,.]/g, '');
  return { number, suffix, decimals: text.includes('.') ? 1 : 0 };
}
function renderServices(services) {
  const active = services.filter((service) => service.active !== false);
  if (!active.length) return;
  document.querySelector('.service-grid').innerHTML = active.map((service, index) => `<article class="service-card reveal visible"><div class="card-image"><img src="${escapeHtml(assetUrl(service.image))}" alt="${escapeHtml(service.title)}" /><span>${String(index + 1).padStart(2, '0')}</span></div><div><h3>${escapeHtml(service.title)}</h3><p>${escapeHtml(service.text)}</p><footer><small>${escapeHtml(service.detail)}</small></footer></div></article>`).join('');
}
function renderTransformations(transformations) {
  const active = transformations.filter((item) => item.active !== false);
  if (!active.length) return;
  cases = Object.fromEntries(active.map((item) => [item.id, { title: item.title, description: item.description, before: assetUrl(item.beforeImage), after: assetUrl(item.afterImage) }]));
  const tabs = document.querySelector('.case-tabs');
  tabs.innerHTML = active.map((item, index) => `<button class="${index === 0 ? 'active' : ''}" type="button" data-case="${escapeHtml(item.id)}"><span>${String(index + 1).padStart(2, '0')}</span>${escapeHtml(item.title)}</button>`).join('');
  bindCaseTabs();
  selectCase(active[0].id);
}
function renderProcess(steps) {
  const active = steps.filter((step) => step.active !== false);
  if (!active.length) return;
  document.querySelector('.steps').innerHTML = active.map((step, index) => `<article class="reveal visible"><span>${String(index + 1).padStart(2, '0')}</span><h3>${escapeHtml(step.title)}</h3><p>${escapeHtml(step.text)}</p></article>`).join('');
}
function renderFaqs(faqs) {
  const active = faqs.filter((faq) => faq.active !== false);
  if (!active.length) return;
  document.querySelector('.faq-list').innerHTML = faqMarkup(active);
  bindFaqAccordion();
}
function renderTestimonials(testimonials) {
  const section = document.querySelector('.reviews');
  if (!testimonials.length) { section?.setAttribute('hidden', ''); return; }
  section?.removeAttribute('hidden');
  document.querySelector('.review-grid').innerHTML = testimonials.slice(0, 3).map((item) => `<article class="review-card reveal visible"><span>${'★'.repeat(Math.max(1, Math.min(5, Number(item.rating) || 5)))}</span><blockquote>“${escapeHtml(item.quote)}”</blockquote><footer><b>${escapeHtml(item.author)}</b><small>${escapeHtml(item.context)}</small></footer></article>`).join('');
}
function socialIcon(network) {
  if (network === 'instagram') return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.6" r=".8" fill="currentColor" stroke="none"/></svg>';
  if (network === 'facebook') return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 21v-8h3l.5-3H14V8.5c0-.9.3-1.5 1.7-1.5H18V4.3c-.4-.1-1.3-.3-2.5-.3-2.6 0-4.4 1.6-4.4 4.5V10H8v3h3.1v8"/></svg>';
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.6a8 8 0 0 1-11.8 7L4 20l1.5-4.1A8 8 0 1 1 20 11.6Z"/><path d="M9.2 8.4c.2-.5.4-.5.7-.5h.5c.2 0 .4.1.5.4l.8 1.8c.1.3.1.5-.1.7l-.5.6c.7 1.2 1.5 2 2.7 2.7l.6-.5c.2-.2.4-.2.7-.1l1.8.8c.3.1.4.3.4.5v.5c0 .3 0 .5-.5.7-.4.2-1 .3-1.6.1-2-.6-4.3-2.5-5.5-4.4-.8-1.3-1.2-2.7-1-3.5Z"/></svg>';
}
function renderContacts(contacts) {
  contacts = contacts || {};
  const footer = document.querySelector('.footer-top > div:last-child');
  const links = ['<details class="phone-menu"><summary aria-label="Contact Shine Pro at (904) 408-7466">(904) 408-7466</summary><div class="phone-menu-options"><a href="tel:+19044087466">Call</a><a href="https://wa.me/19044087466" target="_blank" rel="noopener noreferrer">WhatsApp</a></div></details>'];
  contacts = { ...contacts, whatsapp: 'https://wa.me/19044087466' };
  if (contacts.email) links.push(`<a href="mailto:${escapeHtml(contacts.email)}">${escapeHtml(contacts.email)}</a>`);
  if (contacts.address) links.push(`<small>${escapeHtml(contacts.address)}</small>`);
  if (contacts.businessHours) links.push(`<small>${escapeHtml(contacts.businessHours)}</small>`);
  const social = [['instagram', 'Instagram'], ['facebook', 'Facebook'], ['whatsapp', 'WhatsApp']].map(([key, label]) => contacts[key]
    ? `<a href="${escapeHtml(contacts[key])}" target="_blank" rel="noreferrer" aria-label="${label}">${socialIcon(key)}</a>`
    : `<span aria-label="${label} — configure in Contacts">${socialIcon(key)}</span>`).join('');
  footer.innerHTML = `<b>CONTACT</b>${links.join('')}<a href="#estimate">Request an estimate</a><div class="socials">${social}</div>`;
}
function applyPublishedData(data) {
  const content = data.content;
  if (!content) return;
  const hero = document.querySelector('.hero');
  hero.querySelector('.eyebrow').textContent = content.eyebrow;
  hero.querySelector('h1').textContent = /just vacuuming/i.test(content.heroTitle || '') ? 'It’s your home’s time to SHINE' : content.heroTitle;
  hero.querySelector('.hero-copy').textContent = content.heroText;
  const impact = document.querySelector('.impact');
  impact.querySelector('.impact-copy .eyebrow').textContent = content.impactKicker;
  impact.querySelector('.impact-copy h2').textContent = content.impactTitle;
  [[content.impactOneValue, content.impactOneLabel], [content.impactTwoValue, content.impactTwoLabel], [content.impactThreeValue, content.impactThreeLabel]].forEach(([value, label], index) => {
    const metric = impact.querySelectorAll('.metric')[index];
    const parsed = metricValue(value);
    const counter = metric.querySelector('strong');
    counter.dataset.count = parsed.number;
    counter.dataset.suffix = parsed.suffix;
    counter.dataset.decimals = parsed.decimals;
    counter.textContent = `0${parsed.suffix}`;
    metric.querySelector('span').textContent = label;
  });
  const servicesHead = document.querySelector('.services .section-head');
  servicesHead.querySelector('h2').textContent = content.servicesTitle;
  servicesHead.querySelector('h2 + p').textContent = content.servicesText;
  document.querySelector('.results-copy .eyebrow').textContent = content.transformationKicker;
  document.querySelector('.results-copy h2').textContent = content.transformationTitle;
  document.querySelector('.results-copy h2 + p').textContent = content.transformationText;
  document.querySelector('.story-copy h2').textContent = content.storyTitle;
  document.querySelector('.story-copy h2 + p').textContent = content.storyText;
  document.querySelector('.estimate-copy h2').textContent = content.bookingTitle;
  document.querySelector('.estimate-copy h2 + p').textContent = /no payment/i.test(content.bookingText || '') ? 'Build your estimate, choose a preferred time, and review your service before contacting our team.' : content.bookingText;
  renderServices(data.services || []);
  renderTransformations(data.transformations || []);
  renderProcess((data.processSteps || []).map(step => ({ ...step, text: /reserve without paying|no payment/i.test(step.text || '') ? 'Request a preferred time at least 24 hours ahead. Our team will confirm availability.' : step.text })));
  renderFaqs(data.faqs || []);
  renderTestimonials(data.testimonials || []);
  renderContacts(data.contacts);
}

fetch(`${WORKER_ORIGIN}/api/public`, { cache: 'no-store' })
  .then((response) => response.ok ? response.json() : Promise.reject(new Error('Could not load published content.')))
  .then(applyPublishedData)
  .catch(() => { /* The page remains usable with its local presentation fallback. */ });

const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } }), { threshold: .12 });
document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
const countObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
  if (!entry.isIntersecting) return;
  const element = entry.target; const end = Number(element.dataset.count); const suffix = element.dataset.suffix || ''; const decimals = Number(element.dataset.decimals || 0); const started = performance.now();
  const tick = (now) => { const p = Math.min((now - started) / 1350, 1); const value = end * (1 - Math.pow(1 - p, 4)); element.textContent = `${decimals ? value.toFixed(decimals) : Math.round(value).toLocaleString('en-US')}${suffix}`; if (p < 1) requestAnimationFrame(tick); };
  requestAnimationFrame(tick); countObserver.unobserve(element);
}), { threshold: .6 });
document.querySelectorAll('[data-count]').forEach((element) => countObserver.observe(element));

