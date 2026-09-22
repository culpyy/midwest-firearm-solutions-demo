// Build tracker section on index.html. Reads/writes through js/store.js so
// this stays in sync with the Builds tab on admin.html - same shared,
// localStorage-only state, no backend.

function stampClass(stage) {
  return { queued: 'stamp-queued', booth: 'stamp-booth', curing: 'stamp-curing', ready: 'stamp-ready' }[stage];
}

function ticketHTML(job, { withAdvance }) {
  const advanceIndex = MFS.STAGES.indexOf(job.stage) + 1;
  const nextLabel = MFS.STAGE_LABEL[MFS.STAGES[advanceIndex]];
  const advanceBtn = withAdvance
    ? (nextLabel
        ? `<button type="button" class="ticket-advance" data-code="${job.code}">Move to "${nextLabel}"</button>`
        : `<button type="button" class="ticket-advance" disabled>Done</button>`)
    : '';

  return `
    <div class="ticket">
      <div class="ticket-code">${job.code}</div>
      <div class="ticket-body">
        <h3>${job.title}</h3>
        <p class="spec">${job.spec}</p>
        <p class="note">${job.note}</p>
      </div>
      <div class="ticket-status">
        <span class="stamp ${stampClass(job.stage)}">${MFS.STAGE_LABEL[job.stage]}</span>
        ${advanceBtn}
      </div>
    </div>
  `;
}

function renderCustomerRail() {
  const el = document.getElementById('customer-rail');
  if (!el) return;
  const mine = MFS.getJobs().filter(j => j.customer === 'demo-customer');
  el.innerHTML = mine.map(j => ticketHTML(j, { withAdvance: false })).join('');
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

  el.querySelectorAll('.ticket-advance[data-code]').forEach(btn => {
    btn.addEventListener('click', () => {
      MFS.advanceJob(btn.dataset.code);
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
