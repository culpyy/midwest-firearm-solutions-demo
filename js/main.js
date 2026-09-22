// Build tracker section on index.html. Reads/writes through js/store.js so
// this stays in sync with the Builds tab on admin.html - same shared,
// localStorage-only state, no backend.

function stampClass(stage) {
  return { queued: 'stamp-queued', booth: 'stamp-booth', curing: 'stamp-curing', ready: 'stamp-ready', complete: 'stamp-complete' }[stage];
}

function statusSelectHTML(job) {
  const options = MFS.STAGES.map(s => `<option value="${s}" ${s === job.stage ? 'selected' : ''}>${MFS.STAGE_LABEL[s]}</option>`).join('');
  return `<select class="status-select" data-code="${job.code}" aria-label="Status for ${job.title}">${options}</select>`;
}

function openImageFullSize(src, title) {
  const w = window.open('', '_blank');
  w.document.write(`<title>${title || 'Reference photo'}</title><body style="margin:0;background:#111;display:flex;align-items:center;justify-content:center;min-height:100vh;"><img src="${src}" style="max-width:100%;max-height:100vh;"></body>`);
}

function ticketHTML(job, { withAdvance }) {
  return `
    <div class="ticket">
      <div class="ticket-code">${job.code}</div>
      <div class="ticket-body">
        <h3>${job.title}</h3>
        ${withAdvance ? `<p class="customer-name">${job.customerName}</p>` : ''}
        <p class="spec">${job.spec}</p>
        <p class="note">${job.note}</p>
        ${job.referenceImage ? `<img src="${job.referenceImage}" alt="Reference photo" class="intake-ref-thumb" title="${job.referenceImageName || 'Reference photo'}">` : ''}
      </div>
      <div class="ticket-status">
        <span class="stamp ${stampClass(job.stage)}">${MFS.STAGE_LABEL[job.stage]}</span>
        ${withAdvance ? statusSelectHTML(job) : ''}
      </div>
    </div>
  `;
}

function wireReferenceThumbs(container) {
  container.querySelectorAll('.intake-ref-thumb').forEach(img => {
    img.addEventListener('click', () => openImageFullSize(img.src, img.title));
  });
}

function renderCustomerRail() {
  const el = document.getElementById('customer-rail');
  if (!el) return;
  const mine = MFS.getJobs().filter(j => j.customer === 'demo-customer');
  el.innerHTML = mine.map(j => ticketHTML(j, { withAdvance: false })).join('');
  wireReferenceThumbs(el);
}

function renderShopStats() {
  const el = document.getElementById('shop-stats');
  if (!el) return;
  const jobs = MFS.getJobs();
  const counts = MFS.STAGES.reduce((acc, s) => ({ ...acc, [s]: 0 }), {});
  jobs.forEach(j => counts[j.stage]++);
  el.innerHTML = `
    <div class="stat"><div class="num">${jobs.length}</div><div class="label">Jobs in the shop</div></div>
    <div class="stat"><div class="num">${counts.booth + counts.curing}</div><div class="label">In progress</div></div>
    <div class="stat"><div class="num">${counts.ready}</div><div class="label">Ready for pickup</div></div>
  `;
}

function renderShopRail() {
  const el = document.getElementById('shop-rail');
  if (!el) return;
  el.innerHTML = MFS.getJobs().map(j => ticketHTML(j, { withAdvance: true })).join('');
  wireReferenceThumbs(el);

  el.querySelectorAll('.status-select[data-code]').forEach(sel => {
    sel.addEventListener('change', () => {
      MFS.setJobStage(sel.dataset.code, sel.value);
      renderShopStats();
      renderShopRail();
      renderCustomerRail();
    });
  });
}

function initTabs() {
  const tabCustomer = document.getElementById('tab-customer');
  const tabShop = document.getElementById('tab-shop');
  if (!tabCustomer || !tabShop) return;
  const panelCustomer = document.getElementById('panel-customer');
  const panelShop = document.getElementById('panel-shop');

  function show(which) {
    const customerActive = which === 'customer';
    tabCustomer.setAttribute('aria-selected', String(customerActive));
    tabShop.setAttribute('aria-selected', String(!customerActive));
    panelCustomer.hidden = !customerActive;
    panelShop.hidden = customerActive;
  }

  tabCustomer.addEventListener('click', () => show('customer'));
  tabShop.addEventListener('click', () => show('shop'));
}

renderCustomerRail();
renderShopStats();
renderShopRail();
initTabs();
