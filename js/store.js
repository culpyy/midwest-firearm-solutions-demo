// Shared mock "backend" for the whole demo. Everything here is client-side
// only - localStorage on this browser, nothing sent anywhere. This is what
// lets separate pages (index.html's tracker, admin.html, intake.html,
// reviews.html) all read/write the same demo state without a real database.
// Clearing site data resets the whole demo back to the seeded state below.

const MFS = (() => {
  const KEYS = {
    jobs: 'mfs_demo_jobs',
    cart: 'mfs_demo_cart',
    intake: 'mfs_demo_intake',
    reviews: 'mfs_demo_reviews',
    orders: 'mfs_demo_orders',
  };

  const STAGES = ['queued', 'booth', 'curing', 'ready'];
  const STAGE_LABEL = {
    queued: 'Queued',
    booth: 'In the booth',
    curing: 'Curing',
    ready: 'Ready for pickup',
  };

  const SEED_JOBS = [
    { code: 'MFS-2026-014', title: 'Glock 48', spec: 'Cerakote — Purple Splinter', note: 'The purple splinter finish in the photo above.', stage: 'curing', customer: 'demo-customer' },
    { code: 'MFS-2026-015', title: 'AR-15 Lower', spec: 'Stippling — grip + flared mag well', note: 'In the booth now, should be out by end of day.', stage: 'booth', customer: 'other' },
    { code: 'MFS-2026-016', title: '1911', spec: 'Full Cerakote + laser serial refresh', note: 'Dropped off with the Glock 48 — coming out of the oven this afternoon.', stage: 'curing', customer: 'demo-customer' },
    { code: 'MFS-2026-017', title: 'Bolt Rifle Stock', spec: 'Cerakote — Kryptek pattern', note: 'Next in line once the 1911 clears the booth.', stage: 'queued', customer: 'other' },
    { code: 'MFS-2026-018', title: 'AR Flush Mount', spec: 'Laser engraved shop logo', note: 'Same customer as the Glock 48 — batching them together.', stage: 'queued', customer: 'demo-customer' },
  ];

  const PRODUCTS = [
    { id: 'p1', name: 'Carbon Fiber Tactical Sharpie', price: 25.00, spec: 'Because a regular Sharpie doesn’t match your build.', stock: 14 },
    { id: 'p2', name: 'AR Flush Mount', price: 20.00, spec: 'Wall-mounted, holds an AR flush against the wall.', stock: 9 },
    { id: 'p3', name: 'AR15/AR10 Receiver Set Laser Holding Fixture', price: 25.00, spec: 'Holds a receiver set square for laser engraving.', stock: 6 },
    { id: 'p4', name: 'Digital Download — Receiver Set Laser Fixture', price: 40.00, spec: 'The cut file for the fixture above, if you’re running your own laser.', stock: 999 },
    { id: 'p5', name: '20oz Tumbler Rotary Jig', price: 25.00, spec: 'Rotary jig sized for a standard 20oz tumbler.', stock: 11 },
  ];

  const SEED_REVIEWS = [
    { name: 'J. Marsh', rating: 5, text: 'Purple splinter Cerakote on my 48 came out better than the reference photo I sent. Turnaround was exactly what they quoted.', stage: 'published' },
    { name: 'C. Deleon', rating: 5, text: 'Stippled my AR grip and mag release. Clean, consistent texture, no burn-through. Would send them another one.', stage: 'published' },
    { name: 'R. Whitfield', rating: 4, text: 'Laser engraving on the flush mount is sharp. Took a few days longer than expected but they gave me a heads up.', stage: 'published' },
  ];

  const SEED_ORDERS = [
    { id: 'MFS-ORD-2201', items: '20oz Tumbler Rotary Jig x2', total: 50.00, status: 'shipped', customer: 'K. Ostrander' },
    { id: 'MFS-ORD-2202', items: 'AR Flush Mount, Carbon Fiber Tactical Sharpie', total: 45.00, status: 'processing', customer: 'D. Yun' },
    { id: 'MFS-ORD-2203', items: 'AR15/AR10 Receiver Set Laser Holding Fixture', total: 25.00, status: 'pickup ready', customer: 'M. Alvarez' },
  ];

  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable - demo still works in-memory */ }
    document.dispatchEvent(new CustomEvent('mfs:updated', { detail: { key } }));
  }

  // ---- Jobs / build tracker ----
  function getJobs() { return load(KEYS.jobs, SEED_JOBS); }
  function saveJobs(jobs) { save(KEYS.jobs, jobs); }
  function advanceJob(code) {
    const jobs = getJobs();
    const job = jobs.find(j => j.code === code);
    if (!job) return;
    const idx = STAGES.indexOf(job.stage);
    if (idx < STAGES.length - 1) job.stage = STAGES[idx + 1];
    saveJobs(jobs);
  }

  // ---- Cart ----
  function getCart() { return load(KEYS.cart, []); }
  function saveCart(cart) { save(KEYS.cart, cart); }
  function addToCart(product, qty = 1) {
    const cart = getCart();
    const existing = cart.find(i => i.id === product.id);
    if (existing) existing.qty += qty;
    else cart.push({ id: product.id, name: product.name, price: product.price, qty });
    saveCart(cart);
  }
  function updateCartQty(id, qty) {
    const cart = getCart();
    const item = cart.find(i => i.id === id);
    if (!item) return;
    if (qty < 1) { saveCart(cart.filter(i => i.id !== id)); return; }
    item.qty = qty;
    saveCart(cart);
  }
  function removeFromCart(id) { saveCart(getCart().filter(i => i.id !== id)); }
  function clearCart() { saveCart([]); }
  function cartTotal() { return getCart().reduce((sum, i) => sum + i.price * i.qty, 0); }
  function cartCount() { return getCart().reduce((sum, i) => sum + i.qty, 0); }

  // ---- Intake submissions ----
  function getIntake() { return load(KEYS.intake, []); }
  function addIntake(entry) {
    const list = getIntake();
    list.unshift({ ...entry, id: 'IN-' + Date.now(), submittedAt: new Date().toISOString() });
    save(KEYS.intake, list);
  }

  // ---- Reviews ----
  function getReviews() { return load(KEYS.reviews, SEED_REVIEWS); }
  function addReview(entry) {
    const list = getReviews();
    list.unshift({ ...entry, stage: 'pending' });
    save(KEYS.reviews, list);
  }
  function approveReview(index) {
    const list = getReviews();
    if (list[index]) list[index].stage = 'published';
    save(KEYS.reviews, list);
  }

  // ---- Orders (seeded only - checkout.html adds to this list) ----
  function getOrders() { return load(KEYS.orders, SEED_ORDERS); }
  function addOrder(order) {
    const list = getOrders();
    list.unshift(order);
    save(KEYS.orders, list);
  }

  function resetDemo() {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
    location.reload();
  }

  return {
    STAGES, STAGE_LABEL, PRODUCTS,
    getJobs, saveJobs, advanceJob,
    getCart, saveCart, addToCart, updateCartQty, removeFromCart, clearCart, cartTotal, cartCount,
    getIntake, addIntake,
    getReviews, addReview, approveReview,
    getOrders, addOrder,
    resetDemo,
  };
})();
