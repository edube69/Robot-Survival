import { db } from './firebase-config.js';
import {
    collection, query, orderBy, limit as fsLimit, onSnapshot, getCountFromServer
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const listEl = document.getElementById('highscores-list');
const titleEl = document.querySelector('.leaderboard-title');
const totalEl = document.getElementById('totalPlayers');
const recordEl = document.getElementById('worldRecord');

const musicToggle = document.getElementById('musicToggle');
const volumeRange = document.getElementById('volume');
const bgm = document.getElementById('bgm');
const FRCA = 'fr-CA';

const q = query(
    collection(db, 'highscores'),
    orderBy('score', 'desc'),
    fsLimit(20)
);

let firstLoad = true;
let lastTopScore = null;

// ====== MUSIQUE ============================================================
let chip = null; // moteur WebAudio fallback
const savedVol = Number(localStorage.getItem('bgmVolume') ?? 0.5);
bgm.volume = savedVol;
volumeRange.value = String(savedVol);

// petit moteur chiptune si pas de mp3 dispo
function makeChipPlayer() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const gain = ctx.createGain(); gain.gain.value = savedVol; gain.connect(ctx.destination);

    let timer = null;
    let playing = false;

    // simple boucle 8-bit
    const NOTES = [440, 392, 523.25, 349.23, 440, 659.25, 523.25, 392]; // A4, G4, C5, F4...
    const TEMPO = 130; // bpm
    const stepMs = (60 / TEMPO) * 1000;

    function tick(i) {
        const o = ctx.createOscillator();
        o.type = 'square';
        o.frequency.value = NOTES[i % NOTES.length];
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.23);

        o.connect(g); g.connect(gain);
        o.start();
        o.stop(ctx.currentTime + 0.25);
    }

    return {
        async play() {
            if (playing) return;
            try { await ctx.resume(); } catch { }
            let i = 0;
            playing = true;
            tick(i++);
            timer = setInterval(() => tick(i++), stepMs);
        },
        stop() {
            if (!playing) return;
            playing = false;
            clearInterval(timer);
            timer = null;
        },
        setVolume(v) { gain.gain.value = v; },
        get playing() { return playing; }
    };
}

// --- utils date ---
function formatDate(value) {
    try {
        if (!value) return "—";
        // Accepte {seconds:number} (Firebase), timestamp number, ou string ISO
        let d;
        if (typeof value === "object" && typeof value.seconds === "number") {
            d = new Date(value.seconds * 1000);
        } else if (typeof value === "number") {
            d = new Date(value);
        } else {
            d = new Date(value);
        }
        if (isNaN(d.getTime())) return "—";

        // Format court AAAA-MM-JJ (ou fr-CA locale)
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    } catch {
        return "—";
    }
}

function useMp3Engine() {
    return !!bgm && !!bgm.getAttribute('src');
}

musicToggle.addEventListener('click', async () => {
    if (useMp3Engine()) {
        if (bgm.paused) {
            try { await bgm.play(); } catch (e) { console.warn('Autoplay bloqué:', e); }
            musicToggle.textContent = 'Music: ON';
            musicToggle.setAttribute('aria-pressed', 'true');
            localStorage.setItem('bgmEnabled', '1');
        } else {
            bgm.pause();
            musicToggle.textContent = 'Music: OFF';
            musicToggle.setAttribute('aria-pressed', 'false');
            localStorage.setItem('bgmEnabled', '0');
        }
    } else {
        if (!chip) chip = makeChipPlayer();
        if (!chip.playing) {
            await chip.play();
            musicToggle.textContent = 'Music: ON';
            musicToggle.setAttribute('aria-pressed', 'true');
            localStorage.setItem('bgmEnabled', '1');
        } else {
            chip.stop();
            musicToggle.textContent = 'Music: OFF';
            musicToggle.setAttribute('aria-pressed', 'false');
            localStorage.setItem('bgmEnabled', '0');
        }
    }
});

volumeRange.addEventListener('input', () => {
    const v = Number(volumeRange.value);
    if (useMp3Engine()) bgm.volume = v;
    if (chip) chip.setVolume(v);
    localStorage.setItem('bgmVolume', String(v));
});

// Rejouer si l’utilisateur l’avait activée (une interaction peut être requise)
if (localStorage.getItem('bgmEnabled') === '1') {
    // on ne force pas le play (autoplay) — il recliquera si nécessaire
    musicToggle.textContent = 'Music: ON';
    musicToggle.setAttribute('aria-pressed', 'true');
}

// ====== LEADERBOARD TEMPS RÉEL =============================================
onSnapshot(q, (snap) => {
    const rows = [];
    let rank = 1;
    let currentTop = null;

    snap.forEach(doc => {
        const d = doc.data();
        if (rank === 1) currentTop = Number(d.score || 0);
        rows.push(renderRow(rank++, d));
    });

    listEl.innerHTML = rows.join('');
    listEl.querySelectorAll('.score-entry').forEach((row, i) => {
        row.style.animationDelay = `${i * 40}ms`;
    });

    recordEl.textContent = (currentTop ?? 0).toLocaleString(FRCA);

    // Confetti si tu viens de battre le high score (via sessionStorage)
    const last = safeParse(sessionStorage.getItem('lastScore')); // {score, name, time, kills}
    if (!firstLoad && last && typeof last.score === 'number' && currentTop != null && last.score >= currentTop) {
        confetti();
        // on ne le rejoue pas en boucle
        sessionStorage.removeItem('lastScore');
    }

    // flash titre si top change
    if (!firstLoad && currentTop != null && currentTop !== lastTopScore) {
        titleEl.classList.add('flash');
        setTimeout(() => titleEl.classList.remove('flash'), 700);
    }
    lastTopScore = currentTop;
    firstLoad = false;
}, (err) => {
    listEl.innerHTML = `<p style="color:#f88">Erreur de lecture: ${err.message}</p>`;
});

// compteur total (toutes entrées)
getCountFromServer(collection(db, 'highscores')).then((snap) => {
    totalEl.textContent = snap.data().count.toLocaleString(FRCA);
}).catch(() => { });

// ====== RENDER ==============================================================
function renderRow(rank, d) {
    const name = esc((d.playerName ?? '???').toString().slice(0, 16));
    const score = Number(d.score ?? 0).toLocaleString(FRCA);
    const kills = esc(String(d.kills ?? '-'));
    const time = typeof d.time === 'string'
        ? esc(d.time)
        : (d.time?.seconds ? `${Math.round(d.time.seconds)}s` : '');

    // Affiche la date du doc (Firestore Timestamp ou autre)
    const dateText = formatDate(d.timestamp ?? d.createdAt);

    return `
  <div class="score-entry appear${rank === 1 ? ' is-top' : ''}" data-rank="${rank}">
    <span class="rank">#${rank}</span>
    <span class="name">${name}</span>
    <span class="score">${score}</span>
    <span class="kills">${kills}</span>
    <span class="time">${time}</span>
    <span class="date">${dateText}</span>
  </div>
`;
}

function esc(s) { return String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m])); }
function safeParse(s) { try { return JSON.parse(s); } catch { return null; } }

// ====== BACKGROUND STARFIELD ===============================================
const bg = document.getElementById('bgCanvas');
const fx = document.getElementById('fxCanvas');
const ctx = bg.getContext('2d');
const fxc = fx.getContext('2d');
let stars = [];

function resize() {
    bg.width = fx.width = window.innerWidth;
    bg.height = fx.height = window.innerHeight;
    stars = Array.from({ length: Math.min(180, Math.floor(bg.width * bg.height / 8000)) }, () => ({
        x: Math.random() * bg.width,
        y: Math.random() * bg.height,
        z: Math.random() * 1 + 0.2,
        s: Math.random() * 1.2 + 0.3
    }));
}
window.addEventListener('resize', resize);
resize();

function tickStars() {
    ctx.clearRect(0, 0, bg.width, bg.height);
    for (const st of stars) {
        st.y += st.z * 0.6; // vitesse
        if (st.y > bg.height) { st.y = -2; st.x = Math.random() * bg.width; }
        ctx.globalAlpha = 0.35 + st.z * 0.4;
        ctx.fillStyle = '#9fffd9';
        ctx.fillRect(st.x, st.y, st.s, st.s);
    }
    requestAnimationFrame(tickStars);
}
tickStars();

// ====== CONFETTI ============================================================
function confetti() {
    const N = 200;
    const parts = [];
    for (let i = 0; i < N; i++) {
        parts.push({
            x: fx.width / 2, y: fx.height * 0.25,
            vx: (Math.random() - 0.5) * 6,
            vy: Math.random() * -4 - 2,
            g: 0.12 + Math.random() * 0.05,
            life: 90 + Math.random() * 60,
            size: 2 + Math.random() * 3,
            hue: Math.floor(Math.random() * 360)
        });
    }

    function step() {
        fxc.clearRect(0, 0, fx.width, fx.height);
        for (const p of parts) {
            p.vy += p.g; p.x += p.vx; p.y += p.vy; p.life--;
            fxc.fillStyle = `hsl(${p.hue} 90% 60%)`;
            fxc.fillRect(p.x, p.y, p.size, p.size);
        }
        if (parts.some(p => p.life > 0)) requestAnimationFrame(step);
        else fxc.clearRect(0, 0, fx.width, fx.height);
    }
    step();
}
