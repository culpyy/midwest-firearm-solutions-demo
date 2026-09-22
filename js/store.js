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
    stock: 'mfs_demo_stock',
  };

  const STAGES = ['queued', 'booth', 'curing', 'ready', 'complete'];
  const STAGE_LABEL = {
    queued: 'Queued',
    booth: 'In the booth',
    curing: 'Curing',
    ready: 'Ready for pickup',
    complete: 'Picked up & paid',
  };

  const SEED_JOBS = [
    { code: 'MFS-2026-014', title: 'Glock 48', spec: 'Cerakote, Purple Splinter', note: 'The purple splinter finish in the photo above.', stage: 'curing', customer: 'demo-customer', customerName: 'Marcus Webb' },
    { code: 'MFS-2026-015', title: 'AR-15 Lower', spec: 'Stippling, grip + flared mag well', note: 'In the booth now, should be out by end of day.', stage: 'booth', customer: 'other', customerName: 'Dana Whitfield' },
    { code: 'MFS-2026-016', title: '1911', spec: 'Full Cerakote + laser serial refresh', note: 'Dropped off with the Glock 48. Coming out of the oven this afternoon.', stage: 'curing', customer: 'demo-customer', customerName: 'Marcus Webb' },
    { code: 'MFS-2026-017', title: 'Bolt Rifle Stock', spec: 'Cerakote, Kryptek pattern', note: 'Next in line once the 1911 clears the booth.', stage: 'queued', customer: 'other', customerName: 'Corey Nguyen' },
    { code: 'MFS-2026-018', title: 'AR Flush Mount', spec: 'Laser engraved shop logo', note: 'Same customer as the Glock 48. Batching them together.', stage: 'queued', customer: 'demo-customer', customerName: 'Marcus Webb' },
  ];

  const PRODUCTS = [
    { id: 'p1', name: 'Carbon Fiber Tactical Sharpie', price: 25.00, spec: 'Because a regular Sharpie doesn’t match your build.', stock: 14 },
    { id: 'p2', name: 'AR Flush Mount', price: 20.00, spec: 'Wall-mounted, holds an AR flush against the wall.', stock: 9 },
    { id: 'p3', name: 'AR15/AR10 Receiver Set Laser Holding Fixture', price: 25.00, spec: 'Holds a receiver set square for laser engraving.', stock: 6 },
    { id: 'p4', name: 'Digital Download: Receiver Set Laser Fixture', price: 40.00, spec: 'The cut file for the fixture above, if you’re running your own laser.', stock: 999 },
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
  function setJobStage(code, stage) {
    if (!STAGES.includes(stage)) return;
    const jobs = getJobs();
    const job = jobs.find(j => j.code === code);
    if (!job) return;
    job.stage = stage;
    saveJobs(jobs);
  }

  // ---- Products (stock is editable and persisted; name/price/spec are fixed) ----
  function getProducts() {
    const stockOverrides = load(KEYS.stock, {});
    return PRODUCTS.map(p => ({ ...p, stock: stockOverrides[p.id] ?? p.stock }));
  }
  function setStock(id, stock) {
    const n = Math.max(0, parseInt(stock, 10) || 0);
    const stockOverrides = load(KEYS.stock, {});
    stockOverrides[id] = n;
    save(KEYS.stock, stockOverrides);
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
  function removeIntake(id) {
    save(KEYS.intake, getIntake().filter(entry => entry.id !== id));
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
  const ORDER_STATUSES = ['processing', 'pickup ready', 'shipped'];
  function getOrders() { return load(KEYS.orders, SEED_ORDERS); }
  function addOrder(order) {
    const list = getOrders();
    list.unshift(order);
    save(KEYS.orders, list);
  }
  function setOrderStatus(id, status) {
    if (!ORDER_STATUSES.includes(status)) return;
    const list = getOrders();
    const order = list.find(o => o.id === id);
    if (!order) return;
    order.status = status;
    save(KEYS.orders, list);
  }

  function resetDemo() {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
    location.reload();
  }

  return {
    STAGES, STAGE_LABEL, ORDER_STATUSES,
    getProducts, setStock,
    getJobs, saveJobs, advanceJob, setJobStage,
    getCart, saveCart, addToCart, updateCartQty, removeFromCart, clearCart, cartTotal, cartCount,
    getIntake, addIntake, removeIntake,
    getReviews, addReview, approveReview,
    getOrders, addOrder, setOrderStatus,
    resetDemo,
  };
})();
