// js/attract-mode.js
const canvas = document.getElementById('attractCanvas');
const ctx = canvas.getContext('2d', { alpha: true });

let DPR = 1;
let ents = [];
let running = false;
let rafId = 0;
let last = 0;

const COLORS = {
    player: { robot: '#0ff', body: '#0dd', detail: '#0aa', eye: '#ff0' },
    basic: '#f0f',   // = scout
    fast: '#f44',   // = interceptor
    tank: '#84f',   // = crusher
    split: '#f80',   // = shredder
    grid: { line: 'rgba(0,255,255,.07)', major: 'rgba(0,255,255,.12)', dot: 'rgba(0,255,255,.10)' }
};

function resize() {
    const r = canvas.getBoundingClientRect();
    DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = Math.round(r.width * DPR);
    canvas.height = Math.round(r.height * DPR);
    // recalc trajectoires pour rester dans l’écran
    ents.forEach(e => {
        e.x = clamp(e.x, e.w / 2, canvas.width - e.w / 2);
        e.y = clamp(e.y, e.h / 2, canvas.height - e.h / 2);
    });
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

// ---------- Entités “autonomes” ----------
function spawnEntities() {
    ents = [];

    // Player visuel
    ents.push({
        kind: 'player',
        x: canvas.width * 0.35,
        y: canvas.height * 0.45,
        vx: 60, vy: -40, rot: 0,
        w: 26 * DPR, h: 28 * DPR,
        magnet: 80 * DPR,
        invul: false
    });

    const types = [
        { kind: 'scout', color: COLORS.basic, r: 16 * DPR, speed: 90 },
        { kind: 'interceptor', color: COLORS.fast, r: 18 * DPR, speed: 120 },
        { kind: 'crusher', color: COLORS.tank, r: 20 * DPR, speed: 70 },
        { kind: 'shredder', color: COLORS.split, r: 18 * DPR, speed: 100 },
    ];

    // 6–8 ennemis
    const N = 7;
    for (let i = 0; i < N; i++) {
        const t = types[i % types.length];
        const ang = Math.random() * Math.PI * 2;
        ents.push({
            ...t,
            x: canvas.width * (0.2 + Math.random() * 0.6),
            y: canvas.height * (0.2 + Math.random() * 0.6),
            vx: Math.cos(ang) * (t.speed * (0.6 + Math.random() * 0.6)),
            vy: Math.sin(ang) * (t.speed * (0.6 + Math.random() * 0.6)),
            pulse: Math.random() * Math.PI * 2,
            spin: Math.random() * Math.PI * 2
        });
    }
}

// ---------- Dessins inspirés de renderer.js ----------
function drawGrid() {
    const tile = 36 * DPR;
    const majorEvery = 5;
    ctx.lineWidth = 1;

    for (let x = 0; x <= canvas.width; x += tile) {
        const idx = Math.floor(x / tile);
        ctx.strokeStyle = (idx % majorEvery === 0) ? COLORS.grid.major : COLORS.grid.line;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += tile) {
        const idy = Math.floor(y / tile);
        ctx.strokeStyle = (idy % majorEvery === 0) ? COLORS.grid.major : COLORS.grid.line;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
    // petits points
    ctx.fillStyle = COLORS.grid.dot;
    for (let x = 0; x <= canvas.width; x += tile) {
        for (let y = 0; y <= canvas.height; y += tile) {
            if (((x / tile + y / tile) & 1) === 1) { ctx.fillRect(x - 0.5, y - 0.5, 1.5, 1.5); }
        }
    }
}

function drawPlayer(e) {
    const c = COLORS.player;
    const x = e.x, y = e.y;

    ctx.save();
    ctx.translate(x, y);

    // champ magnet discret
    ctx.strokeStyle = 'rgba(100,200,255,.18)';
    ctx.setLineDash([8, 4]);
    ctx.beginPath(); ctx.arc(0, 0, e.magnet, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);

    // lueur
    ctx.shadowColor = c.robot; ctx.shadowBlur = 15;

    // corps
    ctx.fillStyle = c.robot; ctx.fillRect(-8 * DPR, -10 * DPR, 16 * DPR, 20 * DPR);
    // tête
    ctx.fillStyle = c.body; ctx.fillRect(-6 * DPR, -14 * DPR, 12 * DPR, 6 * DPR);
    // yeux
    ctx.fillStyle = c.eye; ctx.fillRect(-4 * DPR, -12 * DPR, 2 * DPR, 2 * DPR); ctx.fillRect(2 * DPR, -12 * DPR, 2 * DPR, 2 * DPR);
    // épaules/armes
    ctx.fillStyle = c.detail; ctx.fillRect(-12 * DPR, -8 * DPR, 4 * DPR, 6 * DPR); ctx.fillRect(8 * DPR, -8 * DPR, 4 * DPR, 6 * DPR);
    // bras
    ctx.fillRect(-10 * DPR, -2 * DPR, 3 * DPR, 8 * DPR); ctx.fillRect(7 * DPR, -2 * DPR, 3 * DPR, 8 * DPR);
    // jambes
    ctx.fillStyle = '#088'; ctx.fillRect(-6 * DPR, 6 * DPR, 4 * DPR, 8 * DPR); ctx.fillRect(2 * DPR, 6 * DPR, 4 * DPR, 8 * DPR);

    ctx.restore();
    ctx.shadowBlur = 0;
}

function drawScout(e) {
    const r = e.r;
    ctx.save(); ctx.translate(e.x, e.y);
    ctx.shadowColor = e.color; ctx.shadowBlur = 12;
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(-r * 0.7, r * 0.5);
    ctx.lineTo(r * 0.7, r * 0.5);
    ctx.closePath(); ctx.fill();

    const thr = Math.random() > 0.5 ? '#ff8' : '#f84';
    ctx.fillStyle = thr;
    ctx.beginPath(); ctx.arc(-r * 0.4, r * 0.3, r * 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.4, r * 0.3, r * 0.2, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#0ff';
    ctx.beginPath(); ctx.arc(0, -r * 0.5, r * 0.15, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.shadowBlur = 0;
}

function drawInterceptor(e) {
    const r = e.r;
    ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.spin * 0.3);
    ctx.shadowColor = e.color; ctx.shadowBlur = 12;

    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.moveTo(0, -r); ctx.lineTo(r * 0.6, 0); ctx.lineTo(0, r); ctx.lineTo(-r * 0.6, 0);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = '#f66';
    ctx.fillRect(-r * 0.9, -r * 0.2, r * 0.4, r * 0.4);
    ctx.fillRect(r * 0.5, -r * 0.2, r * 0.4, r * 0.4);

    ctx.restore();
    ctx.fillStyle = '#4ff';
    ctx.beginPath(); ctx.arc(e.x, e.y, r * 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
}

function drawCrusher(e) {
    const r = e.r;
    ctx.save(); ctx.translate(e.x, e.y);
    ctx.shadowColor = e.color; ctx.shadowBlur = 12;

    // hexagone
    ctx.fillStyle = e.color;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3, X = Math.cos(a) * r, Y = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
    }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#aaf'; ctx.lineWidth = 2; ctx.stroke();

    // tourelle croisée
    ctx.save(); ctx.rotate(e.spin * 0.5);
    ctx.fillStyle = '#66f';
    ctx.fillRect(-r * 0.6, -r * 0.1, r * 1.2, r * 0.2);
    ctx.fillRect(-r * 0.1, -r * 0.6, r * 0.2, r * 1.2);
    ctx.restore();

    // “œil”
    const p = Math.sin(e.pulse) * 0.3 + 0.7;
    ctx.fillStyle = '#f84';
    ctx.beginPath(); ctx.arc(e.x, e.y, r * 0.2 * p, 0, Math.PI * 2); ctx.fill();

    ctx.restore(); ctx.shadowBlur = 0;
}

function drawShredder(e) {
    const r = e.r;
    ctx.save(); ctx.translate(e.x, e.y);
    ctx.shadowColor = e.color; ctx.shadowBlur = 10;

    // étoile
    ctx.save(); ctx.rotate(e.spin * 0.3);
    ctx.fillStyle = e.color;
    const spikes = 8;
    ctx.beginPath();
    for (let i = 0; i < spikes; i++) {
        const a = i * 2 * Math.PI / spikes;
        const R = (i % 2 === 0) ? r : r * 0.6;
        const X = Math.cos(a) * R, Y = Math.sin(a) * R;
        if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
    }
    ctx.closePath(); ctx.fill();
    ctx.restore();

    // lames
    ctx.save(); ctx.rotate(-e.spin * 0.8);
    ctx.strokeStyle = '#fa4'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-r * 0.8, 0); ctx.lineTo(r * 0.8, 0);
    ctx.moveTo(0, -r * 0.8); ctx.lineTo(0, r * 0.8);
    ctx.stroke();
    ctx.restore();

    // noyau
    ctx.fillStyle = (Math.sin(e.pulse * 2) > 0) ? '#ff0' : '#f80';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2); ctx.fill();

    ctx.restore(); ctx.shadowBlur = 0;
}

// ---------- Boucle ----------
function update(dt) {
    const W = canvas.width, H = canvas.height;

    ents.forEach(e => {
        e.x += (e.vx || 0) * dt;
        e.y += (e.vy || 0) * dt;

        // rebond
        const pad = 8 * DPR;
        const w = e.r ? e.r : (e.w || pad), h = e.r ? e.r : (e.h || pad);
        if (e.x < w + pad) { e.x = w + pad; e.vx = Math.abs(e.vx || 0); }
        else if (e.x > W - (w + pad)) { e.x = W - (w + pad); e.vx = -Math.abs(e.vx || 0); }
        if (e.y < h + pad) { e.y = h + pad; e.vy = Math.abs(e.vy || 0); }
        else if (e.y > H - (h + pad)) { e.y = H - (h + pad); e.vy = -Math.abs(e.vy || 0); }

        if (e.pulse !== undefined) e.pulse += dt;
        if (e.spin !== undefined) e.spin += dt;
    });
}

function draw() {
    // fond très léger + grille
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0,0,0,.65)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGrid();

    // entités
    ents.forEach(e => {
        if (e.kind === 'player') return; // dessiné après pour passer “au-dessus”
        switch (e.kind) {
            case 'scout': drawScout(e); break;
            case 'interceptor': drawInterceptor(e); break;
            case 'crusher': drawCrusher(e); break;
            case 'shredder': drawShredder(e); break;
        }
    });
    // player par-dessus
    const p = ents.find(x => x.kind === 'player'); if (p) drawPlayer(p);
}

function loop(ts) {
    if (!running) return;
    const dt = Math.min(0.04, (ts - (last || ts)) / 1000);
    last = ts;
    update(dt);
    draw();
    rafId = requestAnimationFrame(loop);
}

// ---------- API ----------
export function startAttract() {
    if (running) return;
    running = true;
    resize();
    spawnEntities();
    last = 0;
    rafId = requestAnimationFrame(loop);
}
export function stopAttract() {
    running = false;
    cancelAnimationFrame(rafId);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// accessibilité + responsif
window.addEventListener('resize', resize);
document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAttract();
    else if (document.getElementById('startScreen')?.style.display !== 'none') startAttract();
});
