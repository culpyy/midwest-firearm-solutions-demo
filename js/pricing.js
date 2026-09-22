// Real pricing pulled from midwestfirearmsolutions.com's Cerakote Pricing,
// Stippling Pricing, and Laser Engraving pages. Used to auto-calculate an
// estimate on the intake form as the customer builds their order - nothing
// here is quoted to a real customer or billed anywhere.

const MFS_PRICING = (() => {
  const EXTRA_COLOR_PRICE = 65;

  const CERAKOTE = {
    handgun: {
      label: 'Handgun',
      disassembly: 75,
      parts: [
        { id: 'slide', label: 'Slide', price: 90 },
        { id: 'frame', label: 'Frame', price: 90 },
        { id: 'slideframe', label: 'Slide + frame together', price: 180, note: 'Cheaper than the two separately' },
        { id: 'barrel', label: 'Barrel', price: 65 },
        { id: 'magbase', label: 'Magazine baseplate', price: 25 },
        { id: 'smallparts', label: 'Small parts (slide stop, mag release, etc.), each', price: 15 },
      ],
    },
    ar: {
      label: 'AR-style rifle or pistol',
      disassembly: 90,
      parts: [
        { id: 'lower', label: 'Lower receiver', price: 90 },
        { id: 'upper', label: 'Upper receiver', price: 90 },
        { id: 'handguard', label: 'Hand-guard', price: 90 },
        { id: 'combo', label: 'Upper + lower + hand-guard together', price: 270, note: 'Cheaper than the three separately' },
        { id: 'barrel', label: 'Barrel', price: 120 },
        { id: 'stock', label: 'Stock', price: 60, startingAt: true },
        { id: 'grip', label: 'Grip', price: 25 },
        { id: 'buffertube', label: 'Buffer tube', price: 30 },
        { id: 'charghandle', label: 'Charging handle', price: 25 },
        { id: 'smallparts', label: 'Small parts (bolt catch, takedown pins, etc.), each', price: 15 },
        { id: 'bcg', label: 'Bolt carrier group', price: 75 },
        { id: 'optic', label: 'Optic', price: 130, startingAt: true },
        { id: 'scopemount', label: 'Scope mount or rings', price: 90 },
      ],
    },
    bolt: {
      label: 'Bolt action rifle',
      disassembly: 90,
      parts: [
        { id: 'receiver', label: 'Receiver only', price: 140 },
        { id: 'receiverbarrel', label: 'Receiver + barrel assembly', price: 240 },
        { id: 'barrel', label: 'Barrel', price: 120 },
        { id: 'stock', label: 'Stock', price: 165, startingAt: true },
        { id: 'bolt', label: 'Bolt', price: 65, startingAt: true },
        { id: 'scope', label: 'Scope', price: 130, startingAt: true },
        { id: 'scopemount', label: 'Scope mount or rings', price: 90 },
      ],
    },
    shotgun: {
      label: 'Shotgun',
      disassembly: 90,
      parts: [
        { id: 'receiver', label: 'Receiver only', price: 140 },
        { id: 'barrel', label: 'Barrel', price: 120 },
        { id: 'receiverbarrel', label: 'Receiver + barrel', price: 240, note: 'Includes the extension tube on most models' },
        { id: 'stock', label: 'Stock', price: 105, startingAt: true },
        { id: 'forend', label: 'Forend', price: 80, startingAt: true },
      ],
    },
  };

  const STIPPLING_PACKAGES = [
    { id: 'patrol', label: 'Glock Patrol', price: 250, desc: '360° stippling in any offered pattern, trigger-guard undercuts' },
    { id: 'level1', label: 'Glock Level I', price: 275, desc: 'Patrol, plus accelerator pad stippling on both sides' },
    { id: 'level2', label: 'Glock Level II', price: 300, desc: 'Level I, plus accelerator pad cuts (stippled after)' },
  ];

  const STIPPLING_ADDONS = [
    { id: 'gripreduction', label: 'Grip reduction', price: 175 },
    { id: 'gripchop', label: 'Grip chop (17-19 size)', price: 200 },
    { id: 'fingergroove', label: 'Finger groove removal', price: 25 },
    { id: 'padstipple', label: 'Accelerator pad stipple', price: 30 },
    { id: 'padcutstippled', label: 'Accelerator cut, stippled', price: 45 },
    { id: 'padcutsmooth', label: 'Accelerator cut, smooth', price: 65 },
    { id: 'smoothpads', label: 'Smooth accelerator pads (Level II only)', price: 45 },
  ];

  const LASER_TYPES = [
    { id: 'nfa', label: 'NFA engraving', price: 45, desc: 'Meets ATF depth and height requirements' },
    { id: 'text', label: 'Custom text (letters, quotes, names)', price: 75, desc: '$75 minimum for up to 5 words, then $10 per extra word', wordInput: true },
    { id: 'magpul', label: 'Magpul magazine engraving', price: 25, desc: 'Both sides, includes a new Gen 2 Magpul magazine' },
    { id: 'ownmag', label: 'Engrave your own magazine', price: 20, desc: 'Per magazine' },
    { id: 'stippling', label: 'Glock laser stippling', price: 175, startingAt: true, desc: 'Factory black Glock frames only' },
    { id: 'image', label: 'Custom image or logo', price: 60, startingAt: true, desc: 'Price depends on the image' },
  ];

  const SETUP_FEE = 20;

  // Representative swatch set of well-known Cerakote colors, for picking a
  // base color and (if going custom pattern) additional colors on top of it.
  // Hex values are close approximations for the swatch, not official codes.
  const CERAKOTE_COLORS = [
    { id: 'graphite-black', label: 'Graphite Black', hex: '#1c1c1e' },
    { id: 'sniper-grey', label: 'Sniper Grey', hex: '#8b8d8f' },
    { id: 'tactical-grey', label: 'Tactical Grey', hex: '#54565a' },
    { id: 'stainless', label: 'Stainless', hex: '#c8c9cb' },
    { id: 'magpul-fde', label: 'Magpul FDE', hex: '#b8a488' },
    { id: 'coyote-tan', label: 'Coyote Tan', hex: '#a6835c' },
    { id: 'burnt-bronze', label: 'Burnt Bronze', hex: '#6b4a2f' },
    { id: 'od-green', label: 'OD Green', hex: '#4b5320' },
    { id: 'multicam-green', label: 'Multicam Green', hex: '#6e6b4e' },
    { id: 'federal-blue', label: 'Federal Blue', hex: '#3a4a5c' },
    { id: 'crimson', label: 'Crimson', hex: '#9b2c2c' },
    { id: 'prison-pink', label: 'Prison Pink', hex: '#e8a0b8' },
    { id: 'purple', label: 'Purple', hex: '#5b3a7a' },
    { id: 'gold', label: 'Gold', hex: '#b8860b' },
  ];

  function money(n) { return '$' + n.toFixed(2); }

  return { EXTRA_COLOR_PRICE, CERAKOTE, CERAKOTE_COLORS, STIPPLING_PACKAGES, STIPPLING_ADDONS, LASER_TYPES, SETUP_FEE, money };
})();
