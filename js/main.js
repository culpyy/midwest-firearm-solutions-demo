// Sample data only — nothing here is connected to a real shop or customer.
const STAGES = ['queued', 'booth', 'curing', 'ready'];

const STAGE_LABEL = {
  queued: 'Queued',
  booth: 'In the booth',
  curing: 'Curing',
  ready: 'Ready for pickup',
};

const jobs = [
  {
    code: 'MFS-2026-014',
    title: 'Glock 48',
    spec: 'Cerakote — Purple Splinter',
    note: 'The purple splinter finish in the photo above.',
    stage: 'curing',
  },
  {
    code: 'MFS-2026-015',
    title: 'AR-15 Lower',
    spec: 'Stippling — grip + flared mag well',
    note: 'In the booth now, should be out by end of day.',
    stage: 'booth',
  },
  {
    code: 'MFS-2026-016',
    title: '1911',
    spec: 'Full Cerakote + laser serial refresh',
    note: 'Coming out of the oven this afternoon.',
    stage: 'curing',
  },
  {
    code: 'MFS-2026-017',
    title: 'Bolt Rifle Stock',
    spec: 'Cerakote — Kryptek pattern',
    note: 'Next in line once the 1911 clears the booth.',
    stage: 'queued',
  },
  {
    code: 'MFS-2026-018',
    title: 'AR Flush Mount',
    spec: 'Laser engraved shop logo',
    note: 'Customer dropped off two — batching them together.',
    stage: 'queued',
  },
];

function stampClass(stage) {
  return {
    queued: 'stamp-queued',
    booth: 'stamp-booth',
    curing: 'stamp-curing',
    ready: 'stamp-ready',
  }[stage];
}

function ticketHTML(job, { withAdvance }) {
  const advanceIndex = STAGES.indexOf(job.stage) + 1;
  const nextLabel = STAGE_LABEL[STAGES[advanceIndex]];
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
        <span class="stamp ${stampClass(job.stage)}">${STAGE_LABEL[job.stage]}</span>
        ${advanceBtn}
      </div>
    </div>
  `;
}

function renderCustomerRail() {
  const el = document.getElementById('customer-rail');
  // Customer view: just their one job (the Glock 48 from the hero photo).
  el.innerHTML = ticketHTML(jobs[0], { withAdvance: false });
}

function renderShopStats() {
  const counts = STAGES.reduce((acc, s) => ({ ...acc, [s]: 0 }), {});
  jobs.forEach(j => counts[j.stage]++);

  const el = document.getElementById('shop-stats');
  el.innerHTML = `
    <div class="stat"><div class="num">${jobs.length}</div><div class="label">Jobs in the shop</div></div>
    <div class="stat"><div class="num">${counts.booth + counts.curing}</div><div class="label">In progress</div></div>
    <div class="stat"><div class="num">${counts.ready}</div><div class="label">Ready for pickup</div></div>
  `;
}

function renderShopRail() {
  const el = document.getElementById('shop-rail');
  el.innerHTML = jobs.map(j => ticketHTML(j, { withAdvance: true })).join('');

  el.querySelectorAll('.ticket-advance[data-code]').forEach(btn => {
    btn.addEventListener('click', () => {
      const job = jobs.find(j => j.code === btn.dataset.code);
      const idx = STAGES.indexOf(job.stage);
      if (idx < STAGES.length - 1) job.stage = STAGES[idx + 1];
      renderShopStats();
      renderShopRail();
      renderCustomerRail();
    });
  });
}

function initTabs() {
  const tabCustomer = document.getElementById('tab-customer');
  const tabShop = document.getElementById('tab-shop');
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
