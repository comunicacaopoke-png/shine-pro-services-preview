(() => {
  const root = document.querySelector('#booking-app');
  const slots = ['9:00 AM', '10:30 AM', '12:00 PM', '1:30 PM', '3:00 PM', '4:30 PM'];
  const inspection = 'On the day of service, before work begins, we inspect the items and verify your booking details. Differences in size, quantity or condition, and added services may incur additional charges, which we will explain and ask you to approve before proceeding.';
  const state = { step: 0, group: '', announcement: '', cart: [], conditions: [], firstTime: false, customerType: '', name: '', phone: '', email: '', customerCode: '', date: '', time: '', simulated: false, terms: false, message: '' };
  const currency = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  fetch('catalog.json?v=20261020-2').then(response => { if (!response.ok) throw new Error(); return response.json(); }).then(catalog => {
    const find = id => catalog.find(item => item.id === id);
    function estimate() { const subtotal = state.cart.reduce((sum, line) => sum + find(line.id).price * line.quantity, 0); const discount = state.firstTime ? Math.round(subtotal * 10) / 100 : 0; const discounted = subtotal - discount; return { subtotal, discount, total: state.cart.length ? Math.max(100, discounted) : 0, minimumAdjustment: state.cart.length ? Math.max(0, 100 - discounted) : 0 }; }
    function datetime() {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(state.date) || !slots.includes(state.time)) return NaN;
      const [year, month, day] = state.date.split('-').map(Number); const match = state.time.match(/^(\d+):(\d+) (AM|PM)$/); const hour = Number(match[1]) % 12 + (match[3] === 'PM' ? 12 : 0); const local = Date.UTC(year, month - 1, day, hour, Number(match[2])); const check = new Date(local);
      if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return NaN;
      const offset = instant => { const zone = new Intl.DateTimeFormat('en-US', { timeZone:'America/New_York', timeZoneName:'shortOffset' }).formatToParts(new Date(instant)).find(p => p.type === 'timeZoneName').value; const parts = zone.match(/GMT([+-])(\d+)(?::(\d+))?/); return parts ? (parts[1] === '+' ? 1 : -1) * (Number(parts[2]) * 60 + Number(parts[3] || 0)) * 60000 : 0; };
      return local - offset(local - offset(local));
    }
    function validDate() { return Number.isFinite(datetime()) && datetime() >= Date.now() + 86400000; }
    function add(id) { const line = state.cart.find(item => item.id === id); if (line) line.quantity = Math.min(10, line.quantity + 1); else state.cart.push({ id, quantity: 1 }); render(); }
    function cart() { return `<div class="booking-cart" aria-label="Selected services" aria-live="polite">${state.cart.length ? state.cart.map(line => { const item = find(line.id); return `<div class="booking-line"><span>${esc(item.name)}<small>${currency(item.price)} each</small></span><select data-qty="${esc(item.id)}" aria-label="Quantity for ${esc(item.name)}">${Array.from({length:10}, (_, i) => `<option ${line.quantity === i + 1 ? 'selected' : ''}>${i + 1}</option>`).join('')}</select><button type="button" data-remove="${esc(item.id)}">Remove</button></div>`; }).join('') : '<p>No services selected yet.</p>'}</div>`; }
    function price() { const q = estimate(); if (!state.cart.length) return ''; const minimum = q.minimumAdjustment > 0 ? `<small class="minimum-notice">The $100 minimum per visit applies: ${currency(q.minimumAdjustment)} has been added to reach the minimum.</small>` : state.step === 3 ? '<small>Minimum service charge: $100 per visit.</small>' : ''; return `<div class="price"><span>Services subtotal: ${currency(q.subtotal)}${state.firstTime ? ` · First-service discount: −${currency(q.discount)} (subject to verification)` : ''}</span><strong>${currency(q.total)}</strong>${minimum}<small>Estimated total. Larger areas and additional treatments are quoted after inspection.</small></div>`; }
    let groupTimer = null;
    let closingUntil = 0;
    function servicePicker() {
      const groups = [...new Set(catalog.map(item => item.group))];
      const labels = { 'Carpet cleaning': 'Carpet & stairs', 'Upholstery': 'Upholstery', 'Mattress': 'Mattresses', 'Synthetic area rug · cleaned on-site': 'Area rugs', 'Same-visit packages': 'Packages' };
      return `<div class="service-picker"><p class="service-picker-title">Choose a category</p><p class="booking-form-note">Tap a service to add it to your estimate.</p>${groups.map((group, index) => {
        const open = state.group === group;
        const items = catalog.filter(item => item.group === group);
        const option = item => {
          const quantity = state.cart.find(line => line.id === item.id)?.quantity || 0;
          const visibleName = /^rooms\d+$/.test(item.id) ? item.name.replace(/ \(up to 200 sq ft(?: each)?\)/, '') : item.name;
          return `<button type="button" class="service-option" data-service="${esc(item.id)}" aria-label="Add ${esc(item.name)}, ${currency(item.price)}${quantity ? `, ${quantity} currently selected` : ''}"><span class="service-option-name">${esc(visibleName)}${quantity ? `<small>${quantity} selected</small>` : ''}</span><span class="service-option-price">${currency(item.price)} <b aria-hidden="true">+</b></span></button>`;
        };
        const options = group === 'Carpet cleaning' ? `<p class="service-room-note">Rooms: up to 200 sq ft each</p><div class="service-rooms">${items.filter(item => /^rooms\d+$/.test(item.id)).map(option).join('')}</div><div class="service-extras">${items.filter(item => !/^rooms\d+$/.test(item.id)).map(option).join('')}</div>` : items.map(option).join('');
        return `<div class="service-group"><button type="button" class="service-group-toggle" data-group="${index}" aria-expanded="${open}" aria-controls="service-group-${index}"><span>${esc(labels[group] || group)}</span><span aria-hidden="true">${open ? '−' : '+'}</span></button><div id="service-group-${index}" class="service-panel ${open ? 'is-open' : ''}" aria-hidden="${!open}" ${open ? '' : 'inert'}><div class="service-panel-inner"><div class="service-options ${group === 'Same-visit packages' ? 'service-options-packages' : ''} ${group === 'Carpet cleaning' ? 'service-options-carpet' : ''}">${options}</div></div></div></div>`;
      }).join('')}<p class="service-announcement" role="status" aria-live="polite">${esc(state.announcement)}</p></div>`;
    }
    function render() {
      const groups = [...new Set(catalog.map(item => item.group))];
      const progress = `<div class="form-progress" aria-label="Step ${state.step + 1} of 4">${[0,1,2,3].map(n => `<i class="${n <= state.step ? 'active' : ''}"></i>`).join('')}</div>`;
      let content = '';
      if (state.step === 0) content = `<p class="eyebrow">STEP 01 · ABOUT YOU</p><h3>Let’s get to know you.</h3><p class="booking-intro">Start with your contact details so our team can help with your request.</p><div class="deposit-notice"><span class="deposit-notice-icon" aria-hidden="true">$</span><div><strong>$50 deposit required</strong><p>A $50 advance deposit is required to confirm a booking and is credited toward your service. Cancel at least 24 hours before your appointment or the deposit is forfeited.</p></div></div><form id="customer-details" class="booking-fields"><fieldset class="customer-choice"><legend>Have we cleaned for you before?</legend><div class="customer-choice-options"><label><input type="radio" name="customerType" value="returning" required ${state.customerType === 'returning' ? 'checked' : ''}><span>Yes, I’m a customer</span></label><label><input type="radio" name="customerType" value="new" ${state.customerType === 'new' ? 'checked' : ''}><span>No, I’m new</span></label></div></fieldset><label>Full name<input name="name" value="${esc(state.name)}" required autocomplete="name" placeholder="Your name" /></label><div class="booking-row"><label>Phone number<input name="phone" value="${esc(state.phone)}" type="tel" required autocomplete="tel" placeholder="(904) 555-0123" /></label><label>Email address<input name="email" value="${esc(state.email)}" type="email" required autocomplete="email" placeholder="you@example.com" /></label></div><label>Customer code <span class="field-optional">(optional)</span><input name="customerCode" value="${esc(state.customerCode)}" maxlength="15" placeholder="If Shine gave you a code" autocomplete="off" /></label><p class="privacy-note">Your details stay on this device while you build your request. Our team will verify returning customers and discounts directly with you; no identity verification happens on this page.</p><button class="button full" type="submit">Continue to services <span aria-hidden="true">→</span></button></form>`;
      if (state.step === 1) content = `<p class="eyebrow">STEP 02 · YOUR CLEANING</p><h3>Build your cleaning plan.</h3>${servicePicker()}${cart()}<p class="booking-policy">Rooms are up to 200 sq ft each; larger rooms are assessed for an additional charge. Standard stairs include up to 14 steps; landings are extra. Rug prices are for synthetic rugs cleaned on-site; other materials require a quote. Packages apply to the same visit.</p>${['Stains or heavy soiling','Pet urine or odor','Special fabric, larger areas or other treatment'].map(condition => `<label class="check"><input type="checkbox" data-condition="${esc(condition)}" ${state.conditions.includes(condition) ? 'checked' : ''} /> ${esc(condition)} — additional cost determined after assessment</label>`).join('')}<label class="check"><input type="checkbox" id="first-time" ${state.firstTime ? 'checked' : ''} /> Request 10% off my first service (subject to eligibility verification)</label>${price()}<div class="booking-actions"><button class="button booking-secondary" type="button" data-back>Back</button><button class="button" type="button" data-next>Continue to schedule</button></div>`;
      if (state.step === 2) content = `<p class="eyebrow">STEP 03 · PREFERRED TIME</p><h3>Choose a time that works.</h3><p class="booking-form-note">Request at least 24 hours ahead. Times are in Jacksonville, Florida. The team will confirm availability; this is not a reservation.</p><label>Preferred date<input id="booking-date" type="date" value="${esc(state.date)}" /></label><fieldset><legend>Preferred time</legend><div class="booking-times">${slots.map(time => `<button type="button" data-time="${esc(time)}" class="${time === state.time ? 'selected' : ''}">${esc(time)}</button>`).join('')}</div></fieldset>${price()}<div class="booking-actions"><button class="button booking-secondary" type="button" data-back>Back</button><button class="button" type="button" data-next>Continue</button></div>`;
      if (state.step === 3) content = `<p class="eyebrow">STEP 04 · REVIEW &amp; DEPOSIT</p><h3>One last look.</h3><p class="booking-intro">Review your cleaning plan and add anything else you need.</p><div class="review-heading"><span>YOUR SERVICES</span></div>${cart()}<div class="review-heading"><span>COMPLETE YOUR CLEAN</span></div><div class="booking-suggestions">${['hall','stairs','rug-5x7','queen'].map(id => `<button type="button" data-add="${id}">+ ${esc(find(id).name)} · ${currency(find(id).price)}</button>`).join('')}</div><div class="review-appointment"><span>YOUR PREFERRED TIME</span><strong>${esc(state.date)} · ${esc(state.time)}</strong><small>Jacksonville time · subject to availability</small></div><p class="booking-policy">${inspection}</p>${price()}<div class="deposit-summary"><div><span>Advance deposit required</span><strong>$50.00</strong></div><p>The deposit will be credited toward your service after it is paid. A 5% advance-deposit discount is available; eligibility and the final price will be confirmed by the team. This discount is not included in the estimate above.</p><p><strong>Cancellation policy:</strong> Cancel at least 24 hours before your appointment. Cancellations less than 24 hours before the appointment forfeit the deposit.</p></div><div class="payment-simulation"><span class="simulation-badge">PAYMENT SIMULATION</span><h4>$50 deposit</h4><p>Payment is not connected yet. This is a demonstration: no payment will be collected and no appointment will be reserved.</p><button type="button" class="simulation-button" data-simulate>Simulate $50 deposit</button>${state.simulated ? '<p class="simulation-result" role="status">Simulation complete. No payment was made. Contact our team to arrange the deposit and confirm availability.</p>' : ''}</div><label class="check agreement"><input type="checkbox" id="booking-terms" ${state.terms ? 'checked' : ''} /> <span>I understand the $100 minimum, the $50 deposit and 24-hour cancellation policy, and that inspection, pricing and availability require confirmation.</span></label><p class="privacy-note">To protect your details, your name, phone, email and customer code are not included in the WhatsApp link. Please share them and your service address directly with our team in the chat.</p><div class="booking-actions"><button class="button booking-secondary" type="button" data-back>Back</button><button class="button" type="button" data-contact>Contact us on WhatsApp</button></div>`;
      root.innerHTML = progress + content + (state.message ? `<p class="booking-message" role="alert">${esc(state.message)}</p>` : '');
      root.querySelector('#customer-details')?.addEventListener('input', event => { const field = event.target; if (['customerType', 'name', 'phone', 'email', 'customerCode'].includes(field.name)) state[field.name] = field.value; });
      root.querySelector('#customer-details')?.addEventListener('submit', event => { event.preventDefault(); const data = new FormData(event.target); for (const key of ['customerType', 'name', 'phone', 'email', 'customerCode']) state[key] = String(data.get(key) || '').trim(); state.step = 1; state.message = ''; render(); });
      root.querySelector('#booking-terms')?.addEventListener('change', event => { state.terms = event.target.checked; });
      root.querySelector('[data-simulate]')?.addEventListener('click', () => { state.simulated = true; render(); root.querySelector('.simulation-result')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); });
      root.querySelector('[data-contact]')?.addEventListener('click', () => {
        if (!state.terms) { state.message = 'Please agree to the service and cancellation terms before contacting us.'; render(); return; }
        if (!state.cart.length || !validDate()) { state.message = 'Please select a service and an available time at least 24 hours ahead.'; render(); return; }
        const q = estimate();
        const text = ['Hello Shine Pro, I would like to request service:', ...state.cart.map(line => `• ${find(line.id).name} × ${line.quantity} (${currency(find(line.id).price)} each)`), `Estimated total: ${currency(q.total)} (minimum $100 per visit)`, state.firstTime ? 'First-service discount requested, subject to verification.' : '', `Preferred time: ${state.date} at ${state.time} Jacksonville time`, 'I understand that the $50 deposit has not yet been paid and availability must be confirmed.'].filter(Boolean).join('\n');
        window.location.href = `https://wa.me/19044087466?text=${encodeURIComponent(text)}`;
      });
      root.querySelectorAll('[data-group]').forEach(button => button.addEventListener('click', () => {
        const index = Number(button.dataset.group);
        const selected = groups[index];
        const wasOpen = state.group === selected;
        const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        const duration = reducedMotion ? 0 : 320;
        clearTimeout(groupTimer);
        if (state.group) {
          const previous = groups.indexOf(state.group);
          const oldButton = root.querySelector(`[data-group="${previous}"]`);
          const oldPanel = root.querySelector(`#service-group-${previous}`);
          oldButton?.setAttribute('aria-expanded', 'false');
          if (oldButton) oldButton.lastElementChild.textContent = '+';
          oldPanel?.classList.remove('is-open');
          oldPanel?.setAttribute('aria-hidden', 'true');
          oldPanel?.setAttribute('inert', '');
          state.group = '';
          closingUntil = Date.now() + duration;
        }
        if (wasOpen) return;
        const openSelected = () => {
          const targetButton = root.querySelector(`[data-group="${index}"]`);
          const panel = root.querySelector(`#service-group-${index}`);
          if (!targetButton || !panel) return;
          state.group = selected;
          targetButton.setAttribute('aria-expanded', 'true');
          targetButton.lastElementChild.textContent = '−';
          panel.removeAttribute('inert');
          panel.setAttribute('aria-hidden', 'false');
          panel.classList.add('is-open');
        };
        const delay = Math.max(0, closingUntil - Date.now());
        if (delay) groupTimer = setTimeout(openSelected, delay);
        else openSelected();
      }));
      root.querySelectorAll('[data-service]').forEach(button => button.addEventListener('click', () => { const id = button.dataset.service; const item = find(id); if (!item) return; const quantity = state.cart.find(line => line.id === id)?.quantity || 0; state.message = ''; state.announcement = quantity >= 10 ? `Maximum quantity reached for ${item.name}.` : `${item.name} added to your estimate.`; add(id); root.querySelector(`[data-service="${id}"]`)?.focus({ preventScroll: true }); }));
      root.querySelectorAll('[data-add]').forEach(button => button.addEventListener('click', () => add(button.dataset.add)));
      root.querySelectorAll('[data-remove]').forEach(button => button.addEventListener('click', () => { state.cart = state.cart.filter(line => line.id !== button.dataset.remove); render(); }));
      root.querySelectorAll('[data-qty]').forEach(select => select.addEventListener('change', () => { state.cart.find(line => line.id === select.dataset.qty).quantity = Number(select.value); render(); }));
      root.querySelectorAll('[data-condition]').forEach(box => box.addEventListener('change', () => { state.conditions = box.checked ? [...state.conditions, box.dataset.condition] : state.conditions.filter(item => item !== box.dataset.condition); }));
      root.querySelector('#first-time')?.addEventListener('change', event => { state.firstTime = event.target.checked; render(); });
      root.querySelector('#booking-date')?.addEventListener('change', event => { state.date = event.target.value; });
      root.querySelectorAll('[data-time]').forEach(button => button.addEventListener('click', () => { state.time = button.dataset.time; render(); }));
      root.querySelector('[data-back]')?.addEventListener('click', () => { state.step--; state.message = ''; render(); });
      root.querySelector('[data-next]')?.addEventListener('click', () => { if (state.step === 1 && !state.cart.length) state.message = 'Please add at least one service or package.'; else if (state.step === 2 && !validDate()) state.message = 'Choose a date and time at least 24 hours from now (Jacksonville time).'; else { state.step++; state.message = ''; } render(); });

    }
    render();
  }).catch(() => { root.innerHTML = '<p>We could not load the estimate form. Please call <a href="tel:+19044087466">(904) 408-7466</a> for an estimate.</p>'; });
})();
