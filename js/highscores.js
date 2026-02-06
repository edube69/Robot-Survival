import { db } from './firebase-config.js';
import { collection, query, orderBy, limit as fsLimit, onSnapshot, getCountFromServer, where } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { i18n } from './i18n.js';

i18n.init();

const listEl = document.getElementById('highscores-list');
const titleEl = document.querySelector('.leaderboard-title');
const totalEl = document.getElementById('totalPlayers');
const recordEl = document.getElementById('worldRecord');
const musicToggle = document.getElementById('musicToggle');
const volumeRange = document.getElementById('volume');
const bgm = document.getElementById('bgm');

// Use locale based on current language
function getLocale() { return i18n.getLang() === 'fr' ? 'fr-CA' : 'en-US'; }

const q = query(collection(db, 'highscores'), orderBy('score', 'desc'), fsLimit(10));

let firstLoad = true;
let lastTopScore = null;
let cachedDocs = [];
let playerRank = null;
let lastScoreMeta = safeParse(sessionStorage.getItem('lastScore'));

// ==== Player rank utils =====================================================
async function fetchPlayerRank(score) {
    try {
        const qRank = query(collection(db, 'highscores'), where('score', '>', score));
        const snap = await getCountFromServer(qRank);
        return (snap.data().count || 0) + 1;
    } catch (e) { console.warn('Rank fetch failed', e); return null; }
}

function renderLeaderboard() {
    if (!cachedDocs) return;
    const rows = []; let rankCounter = 1;
    cachedDocs.forEach(d => { const data = d.data(); rows.push(renderRow(rankCounter++, data, (playerRank && playerRank <= 10 && playerRank === (rankCounter - 1)))); });
    if (lastScoreMeta && playerRank && playerRank > 10 && typeof lastScoreMeta.score === 'number') {
        rows.push('<div class="score-entry ellipsis" data-temp="1">\u2026</div>');
        rows.push(renderCustomPlayerRow(playerRank, lastScoreMeta));
    }
    listEl.innerHTML = rows.join('');

    listEl.querySelectorAll('.score-entry').forEach((row,i)=> row.style.animationDelay = `${i*40}ms`);

    if (lastScoreMeta && playerRank && playerRank > 10) setTimeout(()=>collapseToTop10(), 5500);
}
function collapseToTop10(){ const extra = listEl.querySelectorAll('.player-rank, .ellipsis'); extra.forEach(el=>{ el.classList.add('collapse-out'); setTimeout(()=>el.remove(),550); }); }

// ====== SNAPSHOT ============================================================
onSnapshot(q, async snap => {
    cachedDocs = Array.from(snap.docs);

    if (lastScoreMeta && typeof lastScoreMeta.score === 'number' && !playerRank) {
        if (lastScoreMeta.rank) playerRank = lastScoreMeta.rank; else { playerRank = await fetchPlayerRank(lastScoreMeta.score); if (playerRank) { lastScoreMeta.rank = playerRank; sessionStorage.setItem('lastScore', JSON.stringify(lastScoreMeta)); } }
    }
    renderLeaderboard();

    if (snap.docs.length) {
        const topScore = Number(snap.docs[0].data().score || 0);
        recordEl.textContent = topScore.toLocaleString(getLocale());
        if (!firstLoad && topScore !== lastTopScore) { titleEl.classList.add('flash'); setTimeout(()=>titleEl.classList.remove('flash'),700); }
        lastTopScore = topScore;
    }
    const last = lastScoreMeta;
    if (!firstLoad && last && typeof last.score === 'number' && lastTopScore != null && last.score >= lastTopScore) { confetti(); sessionStorage.removeItem('lastScore'); }

    firstLoad = false;
}, err => { console.error(err); listEl.innerHTML = `<p style="color:#f88">${i18n.t('hs_error', { message: esc(err.message) })}</p>`; });

// Total players count
getCountFromServer(collection(db,'highscores')).then(snap=>{ totalEl.textContent = snap.data().count.toLocaleString(getLocale()); }).catch(()=>{});

// ====== RENDER HELPERS ======================================================
function renderRow(rank,d,highlight){ const name = esc((d.playerName??'???').toString().slice(0,16)); const score = Number(d.score??0).toLocaleString(getLocale()); const kills = esc(String(d.kills??'-')); const time = typeof d.time==='string'? esc(d.time): (d.time?.seconds? `${Math.round(d.time.seconds)}s`: ''); const dateText = formatDate(d.timestamp??d.createdAt); const cls = `score-entry appear${rank===1?' is-top':''}${highlight?' player-rank':''}`; return `<div class="${cls}" data-rank="${rank}"><span class="rank">#${rank}</span><span class="name">${name}</span><span class="score">${score}</span><span class="kills">${kills}</span><span class="time">${time}</span><span class="date">${dateText}</span></div>`; }
function renderCustomPlayerRow(rank,meta){ const name = esc((meta.name??meta.playerName??'YOU').toString().slice(0,16)); const score = Number(meta.score||0).toLocaleString(getLocale()); const kills = esc(String(meta.kills??'-')); const time = typeof meta.time==='string'? esc(meta.time): (meta.time? `${meta.time}s`: ''); const dateText = formatDate(meta.timestamp); return `<div class="score-entry player-rank appear" data-rank="${rank}" data-temp="1"><span class="rank">#${rank}</span><span class="name">${name}</span><span class="score">${score}</span><span class="kills">${kills}</span><span class="time">${time}</span><span class="date">${dateText}</span></div>`; }

// ====== MUSIC & UI ==========================================================
const savedVol = Number(localStorage.getItem('bgmVolume') ?? 0.5); bgm.volume = savedVol; volumeRange.value = String(savedVol); function useMp3Engine(){ return !!bgm && !!bgm.getAttribute('src'); }
let chip=null; function makeChipPlayer(){ const Ctx=window.AudioContext||window.webkitAudioContext; const ctx=new Ctx(); const gain=ctx.createGain(); gain.gain.value=savedVol; gain.connect(ctx.destination); let timer=null; let playing=false; const NOTES=[440,392,523.25,349.23,440,659.25,523.25,392]; const TEMPO=130; const stepMs=(60/TEMPO)*1000; function tick(i){ const o=ctx.createOscillator(); o.type='square'; o.frequency.value=NOTES[i%NOTES.length]; const g=ctx.createGain(); g.gain.setValueAtTime(0.0001,ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.15,ctx.currentTime+0.01); g.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+0.23); o.connect(g); g.connect(gain); o.start(); o.stop(ctx.currentTime+0.25); } return { async play(){ if(playing)return; try{await ctx.resume();}catch{} let i=0; playing=true; tick(i++); timer=setInterval(()=>tick(i++),stepMs); }, stop(){ if(!playing)return; playing=false; clearInterval(timer); timer=null; }, setVolume(v){ gain.gain.value=v; }, get playing(){ return playing; } }; }

musicToggle.addEventListener('click', async ()=>{ if(useMp3Engine()){ if(bgm.paused){ try{await bgm.play();}catch{} musicToggle.textContent=i18n.t('hs_music_on'); musicToggle.setAttribute('aria-pressed','true'); localStorage.setItem('bgmEnabled','1'); } else { bgm.pause(); musicToggle.textContent=i18n.t('hs_music_off'); musicToggle.setAttribute('aria-pressed','false'); localStorage.setItem('bgmEnabled','0'); } } else { if(!chip) chip=makeChipPlayer(); if(!chip.playing){ await chip.play(); musicToggle.textContent=i18n.t('hs_music_on'); musicToggle.setAttribute('aria-pressed','true'); localStorage.setItem('bgmEnabled','1'); } else { chip.stop(); musicToggle.textContent=i18n.t('hs_music_off'); musicToggle.setAttribute('aria-pressed','false'); localStorage.setItem('bgmEnabled','0'); } } });
volumeRange.addEventListener('input',()=>{ const v=Number(volumeRange.value); if(useMp3Engine()) bgm.volume=v; if(chip) chip.setVolume(v); localStorage.setItem('bgmVolume',String(v)); });
if(localStorage.getItem('bgmEnabled')==='1'){ musicToggle.textContent=i18n.t('hs_music_on'); musicToggle.setAttribute('aria-pressed','true'); } else { musicToggle.textContent=i18n.t('hs_music_off'); }

// Language toggle
const hsLangToggle = document.getElementById('hsLangToggle');
if (hsLangToggle) {
    hsLangToggle.addEventListener('click', () => {
        i18n.toggleLang();
        // Re-render with new language
        renderLeaderboard();
        // Update music button text
        if (useMp3Engine()) {
            musicToggle.textContent = bgm.paused ? i18n.t('hs_music_off') : i18n.t('hs_music_on');
        } else if (chip) {
            musicToggle.textContent = chip.playing ? i18n.t('hs_music_on') : i18n.t('hs_music_off');
        } else {
            musicToggle.textContent = i18n.t('hs_music_off');
        }
    });
}

// Apply initial translations
i18n.applyTranslations();

// ===== BACKGROUND + CONFETTI ================================================
const bg = document.getElementById('bgCanvas'); const fx = document.getElementById('fxCanvas'); const ctxBg = bg.getContext('2d'); const ctxFx = fx.getContext('2d'); let stars=[]; function resize(){ bg.width=fx.width=window.innerWidth; bg.height=fx.height=window.innerHeight; stars=Array.from({length:Math.min(180,Math.floor(bg.width*bg.height/8000))},()=>({x:Math.random()*bg.width,y:Math.random()*bg.height,z:Math.random()*1+0.2,s:Math.random()*1.2+0.3})); } window.addEventListener('resize',resize); resize(); function tickStars(){ ctxBg.clearRect(0,0,bg.width,bg.height); for(const st of stars){ st.y+=st.z*0.6; if(st.y>bg.height){ st.y=-2; st.x=Math.random()*bg.width; } ctxBg.globalAlpha=0.35+st.z*0.4; ctxBg.fillStyle='#9fffd9'; ctxBg.fillRect(st.x,st.y,st.s,st.s); } requestAnimationFrame(tickStars);} tickStars();
function confetti(){ const N=200; const parts=[]; for(let i=0;i<N;i++){ parts.push({x:fx.width/2,y:fx.height*0.25,vx:(Math.random()-0.5)*6,vy:Math.random()*-4-2,g:0.12+Math.random()*0.05,life:90+Math.random()*60,size:2+Math.random()*3,hue:Math.floor(Math.random()*360)});} function step(){ ctxFx.clearRect(0,0,fx.width,fx.height); for(const p of parts){ p.vy+=p.g; p.x+=p.vx; p.y+=p.vy; p.life--; ctxFx.fillStyle=`hsl(${p.hue} 90% 60%)`; ctxFx.fillRect(p.x,p.y,p.size,p.size);} if(parts.some(p=>p.life>0)) requestAnimationFrame(step); else ctxFx.clearRect(0,0,fx.width,fx.height);} step(); }

// ==== Helpers ====
function esc(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[m])); }
function safeParse(s){ try { return JSON.parse(s); } catch { return null; } }
function formatDate(value){ try{ if(!value) return '\u2013'; let d; if(typeof value==='object' && typeof value.seconds==='number'){ d=new Date(value.seconds*1000);} else if(typeof value==='number'){ d=new Date(value);} else { d=new Date(value);} if(isNaN(d.getTime())) return '\u2013'; const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const day=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}`; } catch { return '\u2013'; } }
