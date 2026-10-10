import PptxGenJS from 'pptxgenjs';

const prs = new PptxGenJS();
prs.layout = 'LAYOUT_WIDE';

const C = {
  bg:       '080A09',
  surface:  '111512',
  elevated: '161C18',
  emerald:  '35D07F',
  white:    'F5F4EE',
  muted:    '929A94',
  border:   '272E29',
  red:      'E85D5D',
  yellow:   'D4A435',
  blue:     '7B8FE8',
};
const FONT = 'Calibri';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const addBg    = s => { s.background = { color: C.bg }; };
const addBar   = s => s.addShape(prs.ShapeType.rect, { x:0, y:0, w:13.33, h:0.06, fill:{color:C.emerald}, line:{color:C.emerald} });
const addFooter= (s, t='VERITY  ·  Trust, verified.') => {
  s.addShape(prs.ShapeType.rect, { x:0, y:7.3, w:13.33, h:0.2, fill:{color:C.surface}, line:{color:C.border,width:0.3} });
  s.addText(t, { x:0, y:7.3, w:13.33, h:0.2, align:'center', fontSize:8, color:C.muted, fontFace:FONT });
};
const addSlideNum = (s, n) => s.addText(`${n} / 8`, { x:12.5, y:7.3, w:0.8, h:0.2, align:'right', fontSize:8, color:C.muted, fontFace:FONT });

const card = (s, x, y, w, h, fillColor=C.surface) =>
  s.addShape(prs.ShapeType.roundRect, { x, y, w, h, fill:{color:fillColor}, line:{color:C.border,width:0.5}, rectRadius:0.1 });

const heading = (s, t, y=0.42) =>
  s.addText(t, { x:0.5, y, w:12.3, h:0.55, fontSize:26, bold:true, color:C.white, fontFace:FONT });

const sub = (s, t, y=1.05) =>
  s.addText(t, { x:0.5, y, w:12.3, h:0.35, fontSize:13, color:C.muted, fontFace:FONT });

const dot = (s, x, y, color=C.emerald) =>
  s.addShape(prs.ShapeType.ellipse, { x, y, w:0.1, h:0.1, fill:{color}, line:{color} });

const bullets = (s, items, x, y, w, gap=0.42) =>
  items.forEach((item, i) => {
    dot(s, x, y + i*gap + 0.05);
    s.addText(item, { x:x+0.2, y:y+i*gap, w:w-0.2, h:gap, fontSize:12, color:C.white, fontFace:FONT, valign:'middle' });
  });

const accentLine = (s, x, y, w=3.0) =>
  s.addShape(prs.ShapeType.rect, { x, y, w, h:0.04, fill:{color:C.emerald}, line:{color:C.emerald} });

const topStripe = (s, x, y, w, color=C.emerald) =>
  s.addShape(prs.ShapeType.rect, { x, y, w, h:0.05, fill:{color}, line:{color} });

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 1 — Cover
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = prs.addSlide();
  addBg(s); addBar(s);

  // Shield icon
  s.addShape(prs.ShapeType.pentagon, { x:5.9, y:0.9, w:1.5, h:1.5, fill:{color:C.elevated}, line:{color:C.emerald,width:1.5}, rotate:180 });
  s.addText('✓', { x:5.9, y:1.0, w:1.5, h:1.5, align:'center', valign:'middle', fontSize:38, bold:true, color:C.emerald, fontFace:FONT });

  // Wordmark
  s.addText('VERITY', { x:1, y:2.55, w:11.33, h:1.4, align:'center', fontSize:80, bold:true, color:C.white, fontFace:FONT, charSpacing:20 });

  // Tagline
  s.addText('Trust, verified.', { x:1, y:4.1, w:11.33, h:0.5, align:'center', fontSize:18, color:C.muted, fontFace:FONT, italic:true });

  // Accent rule
  accentLine(s, 4.9, 4.75, 3.5);

  // Tag badges
  const tags = [['MERN Stack',C.emerald],['QR Verification',C.emerald],['SHA-256 Integrity',C.emerald],['JWT + bcrypt',C.emerald]];
  tags.forEach(([t,c], i) => {
    card(s, 1.5+i*2.58, 5.1, 2.3, 0.38, C.elevated);
    topStripe(s, 1.5+i*2.58, 5.1, 2.3, c);
    s.addText(t, { x:1.5+i*2.58, y:5.1, w:2.3, h:0.38, align:'center', valign:'middle', fontSize:11, bold:true, color:c, fontFace:FONT });
  });

  s.addText('Hackathon 2026  ·  Full-Stack Document Verification Platform', { x:1, y:6.7, w:11.33, h:0.3, align:'center', fontSize:10, color:C.muted, fontFace:FONT });

  addFooter(s); addSlideNum(s, 1);
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 2 — The Problem
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = prs.addSlide();
  addBg(s); addBar(s);
  heading(s, 'The Problem');
  sub(s, 'Document fraud is rampant — and verification is broken.');

  const stats = [
    { v:'17M+', l:'Fake degrees\nissued per year',   c:C.red    },
    { v:'90%',  l:'Orgs verify docs\nmanually',      c:C.yellow },
    { v:'40%',  l:'Employers report\nresumé fraud',  c:C.red    },
    { v:'~0',   l:'Tamper-proof public\nverification systems', c:C.muted },
  ];
  stats.forEach((st, i) => {
    const x = 0.4+i*3.18;
    card(s, x, 1.6, 3.0, 1.3, C.surface);
    topStripe(s, x, 1.6, 3.0, st.c);
    s.addText(st.v, { x, y:1.68, w:3.0, h:0.65, align:'center', fontSize:32, bold:true, color:st.c, fontFace:FONT });
    s.addText(st.l, { x, y:2.3, w:3.0, h:0.5, align:'center', fontSize:10, color:C.muted, fontFace:FONT });
  });

  card(s, 0.4, 3.2, 12.4, 3.65, C.surface);
  s.addText('Current Pain Points', { x:0.65, y:3.35, w:6, h:0.38, fontSize:14, bold:true, color:C.white, fontFace:FONT });
  accentLine(s, 0.65, 3.75, 2.5);
  const pains = [
    'Paper certificates are easily forged with consumer design software',
    'Email-based verification leaks personally identifiable information to third parties',
    'No instant public channel to confirm a credential is still active and valid',
    'Revocation is invisible — a cancelled license looks identical to a valid one',
    'No cryptographic proof that document data has not been modified after issuance',
  ];
  bullets(s, pains, 0.65, 3.9, 12.0, 0.5);

  addFooter(s); addSlideNum(s, 2);
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 3 — Our Solution
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = prs.addSlide();
  addBg(s); addBar(s);
  heading(s, 'Our Solution — VERITY');
  sub(s, 'A cinematic, production-grade document verification platform built in 24 hours.');

  const pillars = [
    { icon:'🔐', title:'Issue',  color:C.emerald, desc:'Admins issue documents with a unique cryptographic ID, a SHA-256 integrity hash over protected fields, and a QR code — all generated server-side in a single POST request.' },
    { icon:'📲', title:'Verify', color:C.blue,    desc:'Anyone scans the QR or visits the public URL. The server recalculates the integrity hash live and returns the real-time status — no login required, no sensitive data exposed.' },
    { icon:'🚫', title:'Revoke', color:C.red,     desc:'One click to revoke. The next QR scan immediately reflects REVOKED — no stale cache, no workaround. Status is always computed server-side, never trusted from the client.' },
  ];

  pillars.forEach((p, i) => {
    const x = 0.4+i*4.3;
    card(s, x, 1.55, 4.0, 5.1, C.surface);
    topStripe(s, x, 1.55, 4.0, p.color);
    s.addText(p.icon, { x, y:1.7, w:4.0, h:0.75, align:'center', fontSize:34, fontFace:FONT });
    accentLine(s, x+1.3, 2.55, 1.4);
    s.addText(p.title, { x, y:2.65, w:4.0, h:0.5, align:'center', fontSize:20, bold:true, color:p.color, fontFace:FONT });
    s.addText(p.desc, { x:x+0.2, y:3.22, w:3.6, h:3.1, fontSize:11.5, color:C.muted, fontFace:FONT, valign:'top', wrap:true });
  });

  addFooter(s); addSlideNum(s, 3);
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 4 — Tech Stack
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = prs.addSlide();
  addBg(s); addBar(s);
  heading(s, 'Technology Stack');
  sub(s, 'Production-grade tools — chosen for correctness, not convenience.');

  const cols = [
    { title:'Frontend',            color:C.emerald, items:['React 18 + TypeScript','Vite 5 (build + HMR)','Tailwind CSS','Framer Motion','Three.js / Canvas','React Query v5','Zustand (state)','React Router v6'] },
    { title:'Backend',             color:C.blue,    items:['Node.js + Express','TypeScript strict mode','Mongoose + MongoDB','JWT + bcrypt (auth)','express-validator','express-rate-limit','Helmet + CORS','Swagger / OpenAPI 3.0'] },
    { title:'Security & Integrity',color:C.yellow,  items:['SHA-256 integrity hash','Server-side recalculation','Timing-safe comparison','Unique verification IDs','QR → public verify URL','Revocation audit log','Verification history','Zero client-trusted status'] },
  ];

  cols.forEach((col, i) => {
    const x = 0.4+i*4.3;
    card(s, x, 1.5, 4.0, 5.7, C.surface);
    topStripe(s, x, 1.5, 4.0, col.color);
    s.addText(col.title, { x:x+0.15, y:1.6, w:3.7, h:0.42, fontSize:13, bold:true, color:col.color, fontFace:FONT });
    col.items.forEach((item, j) => {
      dot(s, x+0.2, 2.18+j*0.57+0.05);
      s.addText(item, { x:x+0.42, y:2.18+j*0.57, w:3.4, h:0.5, fontSize:11, color:C.white, fontFace:FONT, valign:'middle' });
    });
  });

  addFooter(s); addSlideNum(s, 4);
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 5 — Architecture
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = prs.addSlide();
  addBg(s); addBar(s);
  heading(s, 'System Architecture');
  sub(s, 'Clean separation between public verification and authenticated administration.');

  // Three layer boxes
  const layers = [
    { label:'React Frontend', sub:'Vite · TypeScript · Tailwind · Framer Motion', x:0.35, color:C.emerald },
    { label:'Express API',    sub:'Node.js · JWT · Validation · Rate Limit',       x:4.8,  color:C.blue   },
    { label:'MongoDB Atlas',  sub:'Mongoose · Documents · Logs · Aggregations',    x:9.25, color:C.yellow },
  ];
  layers.forEach(l => {
    card(s, l.x, 1.7, 3.75, 1.55, C.surface);
    topStripe(s, l.x, 1.7, 3.75, l.color);
    s.addText(l.label, { x:l.x+0.15, y:1.82, w:3.45, h:0.45, fontSize:14, bold:true, color:l.color, fontFace:FONT });
    s.addText(l.sub,   { x:l.x+0.15, y:2.28, w:3.45, h:0.35, fontSize:10, color:C.muted, fontFace:FONT });
  });
  // Arrows
  [[4.12,2.44],[8.57,2.44]].forEach(([x,y]) =>
    s.addShape(prs.ShapeType.rightArrow, { x, y, w:0.62, h:0.28, fill:{color:C.border}, line:{color:C.emerald,width:0.8} })
  );

  // Flow rows
  s.addText('Request Flows', { x:0.4, y:3.55, w:5, h:0.38, fontSize:14, bold:true, color:C.white, fontFace:FONT });

  const flows = [
    { t:'Admin Flow',    d:'Login → JWT issued → Manage documents (CRUD) → Revoke → Download QR code',      c:C.emerald },
    { t:'Public Flow',   d:'Scan QR → GET /api/verify/:id (no auth) → Server recalculates hash → Live status', c:C.blue   },
    { t:'Integrity Flow',d:'On every verify: stored hash vs fresh hash → VALID / INTEGRITY_FAILED in < 50ms', c:C.yellow },
  ];
  flows.forEach((f, i) => {
    card(s, 0.35, 4.05+i*1.05, 12.55, 0.88, C.surface);
    s.addShape(prs.ShapeType.rect, { x:0.35, y:4.05+i*1.05, w:0.06, h:0.88, fill:{color:f.c}, line:{color:f.c} });
    s.addText(f.t, { x:0.58, y:4.1+i*1.05, w:2.5, h:0.35, fontSize:12, bold:true, color:f.c, fontFace:FONT });
    s.addText(f.d, { x:0.58, y:4.48+i*1.05, w:12.0, h:0.35, fontSize:11, color:C.muted, fontFace:FONT });
  });

  // Endpoint strip
  const apis = ['POST /auth/login','GET /documents','POST /documents','POST /documents/:id/revoke','GET /verify/:id  ← public','GET /stats/dashboard'];
  card(s, 0.35, 7.1, 12.55, 0.4, C.elevated);
  apis.forEach((a, i) => s.addText(a, { x:0.5+i*2.18, y:7.15, w:2.15, h:0.28, fontSize:7.5, color:C.emerald, fontFace:FONT }));

  addFooter(s); addSlideNum(s, 5);
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 6 — Key Features
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = prs.addSlide();
  addBg(s); addBar(s);
  heading(s, 'Key Features');
  sub(s, 'Every feature is functional — no mocks, no placeholders, no fake data.');

  const features = [
    { icon:'🎬', title:'Cinematic Intro',    desc:'Canvas particle field → 3D floating document with scan-line laser → timed logo reveal. 6–8s, skip button, respects prefers-reduced-motion.', c:C.emerald },
    { icon:'📋', title:'Document Registry',  desc:'Full CRUD with live search, filter by status & type, sortable columns, server-side pagination. All queries hit real MongoDB.', c:C.emerald },
    { icon:'🔒', title:'SHA-256 Integrity',  desc:'Deterministic hash over 7 protected fields. Recalculated on every verify. Timing-safe buffer comparison prevents oracle attacks.', c:C.yellow },
    { icon:'📲', title:'QR Verification',    desc:'Every document gets a unique QR pointing to /verify/:id. Public, no login. Reflects live revocation status on every scan.', c:C.blue   },
    { icon:'🚫', title:'Instant Revocation', desc:'Admin clicks Revoke → next QR scan shows REVOKED immediately. Status always computed server-side — impossible to bypass.', c:C.red    },
    { icon:'📊', title:'Live Dashboard',     desc:'Real MongoDB aggregations: total, valid, revoked, expired, expiring-soon, 14-day verification trend chart, recent activity.', c:C.emerald },
    { icon:'🔑', title:'Secure Auth',        desc:'bcrypt 12-round hashing. JWT with 7-day expiry. Role-based access control. Auth and verify routes rate-limited independently.', c:C.yellow },
    { icon:'📚', title:'Swagger Docs',       desc:'Full OpenAPI 3.0 spec auto-generated. Available at /api-docs. All 12 endpoints documented with request and response schemas.', c:C.blue   },
  ];

  features.forEach((f, i) => {
    const col = i % 4, row = Math.floor(i/4);
    const x = 0.3+col*3.22, y = 1.55+row*2.7;
    card(s, x, y, 3.05, 2.52, C.surface);
    topStripe(s, x, y, 3.05, f.c);
    s.addText(f.icon, { x, y:y+0.15, w:3.05, h:0.58, align:'center', fontSize:26, fontFace:FONT });
    s.addText(f.title, { x:x+0.12, y:y+0.76, w:2.82, h:0.38, fontSize:12, bold:true, color:f.c, fontFace:FONT });
    s.addText(f.desc,  { x:x+0.12, y:y+1.17, w:2.82, h:1.22, fontSize:9.5, color:C.muted, fontFace:FONT, wrap:true, valign:'top' });
  });

  addFooter(s); addSlideNum(s, 6);
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 7 — Live Demo Flow
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = prs.addSlide();
  addBg(s); addBar(s);
  heading(s, 'Live Demo Flow');
  sub(s, 'End-to-end walkthrough — every step connects to real MongoDB data.');

  const steps = [
    { n:'01', title:'Cinematic Intro',    desc:'Particles coalesce → 3D document forms with scan-line → VERITY logo reveals → seamless app transition', c:C.emerald },
    { n:'02', title:'Admin Login',         desc:'admin@verity.dev · JWT issued · Role-based sidebar · Dashboard loads live aggregate stats from MongoDB', c:C.emerald },
    { n:'03', title:'View Dashboard',      desc:'8 seeded docs · verification trend chart (14 days) · expiring-soon alerts · real MongoDB aggregations', c:C.emerald },
    { n:'04', title:'Issue a Document',    desc:'Fill form → POST /api/documents → SHA-256 hash computed → QR generated server-side → stored in MongoDB', c:C.blue   },
    { n:'05', title:'Scan QR  →  VALID',   desc:'Open /verify/:id in any browser (no login) → server recalculates hash → returns VALID + integrity verified ✓', c:C.blue },
    { n:'06', title:'Revoke Document',     desc:'Click Revoke in the admin dashboard → status updated → revokedBy + revokedAt + reason recorded in DB', c:C.red    },
    { n:'07', title:'Scan QR  →  REVOKED', desc:'Same URL, same QR code → server returns REVOKED with timestamp and reason. Instant. No cache to clear.', c:C.red   },
    { n:'08', title:'Integrity Tamper',    desc:'Corrupt the hash directly in MongoDB → next verify returns INTEGRITY FAILED — tamper detection live on stage', c:C.yellow },
  ];

  steps.forEach((step, i) => {
    const col = i%2, row = Math.floor(i/2);
    const x = 0.35+col*6.55, y = 1.55+row*1.38;
    card(s, x, y, 6.25, 1.2, C.surface);
    // Left colour stripe
    s.addShape(prs.ShapeType.roundRect, { x, y, w:0.06, h:1.2, fill:{color:step.c}, line:{color:step.c}, rectRadius:0 });
    // Number badge
    card(s, x+0.18, y+0.28, 0.55, 0.55, C.elevated);
    s.addText(step.n, { x:x+0.18, y:y+0.28, w:0.55, h:0.55, align:'center', valign:'middle', fontSize:11, bold:true, color:step.c, fontFace:FONT });
    // Text
    s.addText(step.title, { x:x+0.88, y:y+0.13, w:5.15, h:0.38, fontSize:13, bold:true, color:C.white, fontFace:FONT });
    s.addText(step.desc,  { x:x+0.88, y:y+0.54, w:5.15, h:0.55, fontSize:10.5, color:C.muted, fontFace:FONT });
  });

  addFooter(s); addSlideNum(s, 7);
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 8 — Why VERITY Wins
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = prs.addSlide();
  addBg(s); addBar(s);
  heading(s, 'Why VERITY Wins');
  sub(s, 'Built for judges who know the difference between a demo and a product.');

  const wins = [
    { icon:'⚡', t:'Fully Functional',   d:'React talks to a real Express API.\nMongoDB stores and retrieves live data.\nNo mocks. No fake charts. No localStorage.', c:C.emerald },
    { icon:'🎬', t:'Cinematic Quality',  d:'Canvas particles, floating 3D document,\ntimed logo reveal, seamless transition.\nFeels like a product launch, not a hackathon.', c:C.blue },
    { icon:'🔐', t:'Real Security',      d:'SHA-256 + timing-safe comparison.\nbcrypt 12-round hashing.\nRate limiting, CORS, Helmet on every route.', c:C.yellow },
    { icon:'🧪', t:'Production-Ready',   d:'TypeScript strict mode throughout.\n28/28 tests passing (Vitest + Jest).\nSwagger docs at /api-docs.', c:C.emerald },
  ];

  wins.forEach((w, i) => {
    const x = 0.35+i*3.18;
    card(s, x, 1.55, 3.0, 3.7, C.surface);
    topStripe(s, x, 1.55, 3.0, w.c);
    s.addText(w.icon, { x, y:1.7, w:3.0, h:0.7, align:'center', fontSize:30, fontFace:FONT });
    accentLine(s, x+0.9, 2.48, 1.2);
    s.addText(w.t, { x:x+0.12, y:2.55, w:2.78, h:0.42, fontSize:14, bold:true, color:w.c, fontFace:FONT });
    s.addText(w.d, { x:x+0.12, y:3.0,  w:2.78, h:1.85, fontSize:11, color:C.muted, fontFace:FONT, wrap:true });
  });

  // Numbers row
  const nums = [
    { v:'8',    l:'Screens built',       c:C.emerald },
    { v:'12',   l:'API endpoints',       c:C.blue    },
    { v:'28',   l:'Tests passing',       c:C.yellow  },
    { v:'100%', l:'Real MongoDB data',   c:C.emerald },
  ];
  nums.forEach((n, i) => {
    card(s, 0.35+i*3.18, 5.45, 3.0, 1.2, C.elevated);
    s.addText(n.v, { x:0.35+i*3.18, y:5.52, w:3.0, h:0.65, align:'center', fontSize:30, bold:true, color:n.c, fontFace:FONT });
    s.addText(n.l, { x:0.35+i*3.18, y:6.17, w:3.0, h:0.3,  align:'center', fontSize:11, color:C.muted, fontFace:FONT });
  });

  // CTA bar
  card(s, 3.2, 6.78, 6.9, 0.5, C.elevated);
  s.addShape(prs.ShapeType.rect, { x:3.2, y:6.78, w:6.9, h:0.05, fill:{color:C.emerald}, line:{color:C.emerald} });
  s.addText('localhost:5173   ·   admin@verity.dev   ·   Verity@Admin2024!', {
    x:3.2, y:6.83, w:6.9, h:0.45, align:'center', valign:'middle', fontSize:11, color:C.emerald, fontFace:FONT,
  });

  addFooter(s, 'VERITY  ·  Trust, verified.  ·  Hackathon 2026');
  addSlideNum(s, 8);
}

// ─── Save ──────────────────────────────────────────────────────────────────────
const outPath = 'c:\\Users\\rajam\\Desktop\\verity\\VERITY_Presentation.pptx';
await prs.writeFile({ fileName: outPath });
console.log(`\n✅  Saved: ${outPath}\n`);
