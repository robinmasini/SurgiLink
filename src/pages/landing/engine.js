// SurgiLink landing engine: scroll-scrubbed hero film + whole-page motion.
// Vanilla on purpose: the React page only renders markup, this drives it.

const VIDEO_URL = '/landing/hero-scrub.mp4';
const VIDEO_BYTES = 7049901; // fallback when Content-Length is missing
const POSTER_URL = '/landing/hero-poster.jpg';

// Must match the CSS media query in landing.css character for character.
// The film now plays on every screen; only reduced motion gets the still hero.
const GATES = [
    '(prefers-reduced-motion: reduce)',
];

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const smoothstep = (p, e0, e1) => {
    const t = clamp((p - e0) / (e1 - e0), 0, 1);
    return t * t * (3 - 2 * t);
};
function rng(seed) {
    let s = seed >>> 0;
    return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

function splitText(el, mode, seed) {
    if (el.dataset.splitDone) return;
    el.dataset.splitDone = '1';
    const r = rng(seed);
    const text = el.textContent;
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = text;
    const vis = document.createElement('span');
    vis.setAttribute('aria-hidden', 'true');
    // keep inline styling of <em>/<span class=gold> by walking child nodes
    const nodes = [...el.childNodes];
    const words = [];
    nodes.forEach((node) => {
        const wrapper = node.nodeType === 1 ? node.cloneNode(false) : null;
        const target = wrapper || vis;
        const parts = node.textContent.split(/(\s+)/);
        parts.forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { target.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            w.className = 'w';
            if (mode === 'chars') {
                [...part].forEach((ch) => {
                    const c = document.createElement('span');
                    c.className = 'c';
                    c.textContent = ch;
                    w.appendChild(c);
                });
            } else {
                w.textContent = part;
            }
            words.push(w);
            target.appendChild(w);
        });
        if (wrapper) vis.appendChild(wrapper);
    });
    el.textContent = '';
    el.append(sr, vis);

    const spread = parseFloat(el.dataset.spread || '0.5');
    if (mode === 'chars') {
        const chars = [...vis.querySelectorAll('.c')];
        chars.forEach((c, i) => {
            c.style.setProperty('--th', (i / chars.length * spread + r() * 0.06).toFixed(3));
            c.style.setProperty('--jx', `${Math.round((r() < 0.5 ? -1 : 1) * (18 + r() * 40))}px`);
        });
    } else {
        words.forEach((w, i) => w.style.setProperty('--th', (i / words.length * 0.55).toFixed(3)));
    }
}

// Odometer: every digit is a strip of numbers that falls into place like a wheel.
// Right-hand digits spin more turns than left-hand ones, as on a real counter.
function buildOdometer(el) {
    if (el._odo) return el._odo;
    const chars = Number(el.dataset.odo).toLocaleString('fr-FR').replace(/\s/g, ' ').split('');
    const digitCount = chars.filter((c) => /\d/.test(c)).length;
    const cols = [];
    el.textContent = '';
    let di = 0;
    chars.forEach((ch) => {
        if (!/\d/.test(ch)) {
            const sep = document.createElement('span');
            sep.className = 'odo-sep';
            sep.textContent = ch === ' ' ? '\u2009' : ch;
            el.appendChild(sep);
            return;
        }
        const d = Number(ch);
        const spins = 1 + di;                        // 1 turn on the left, more on the right
        const n = spins * 10 + d;                    // index of the final digit, counted from the bottom
        const col = document.createElement('span');
        col.className = 'odo-col';
        const strip = document.createElement('span');
        strip.className = 'odo-strip';
        // top to bottom: one spare above (overshoot), then n..0 so the strip falls downward
        for (let j = n + 1; j >= 0; j--) {
            const it = document.createElement('span');
            it.textContent = String(j % 10);
            strip.appendChild(it);
        }
        col.appendChild(strip);
        el.appendChild(col);
        cols.push({ strip, n, i: di, last: null });
        di++;
    });
    el._odo = { cols, count: digitCount };
    return el._odo;
}
const easeOutBack = (t) => { const c1 = 1.2, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
function setOdometer(odo, q) {
    const stagger = 0.14;
    const span = 1 - stagger * (odo.count - 1);
    odo.cols.forEach((c) => {
        // the left digit lands last so the amount reads as it settles
        const start = stagger * (odo.count - 1 - c.i);
        const t = clamp((q - start) / span, 0, 1);
        const e = t === 0 ? 0 : t === 1 ? 1 : easeOutBack(t);
        // show item index (n+1 - n*e) from the top: item 1 is the final digit, item n+1 is 0
        const y = -(1 + c.n * (1 - e));
        const v = y.toFixed(3);
        if (v !== c.last) { c.strip.style.transform = `translate3d(0, ${v}em, 0)`; c.last = v; }
    });
}

export function initLanding(root) {
    if (!root) return () => {};
    const cleanups = [];
    const on = (t, ev, fn, o) => { t.addEventListener(ev, fn, o); cleanups.push(() => t.removeEventListener(ev, fn, o)); };
    document.documentElement.classList.add('sl-html');
    cleanups.push(() => document.documentElement.classList.remove('sl-html'));

    const reducedMQ = matchMedia('(prefers-reduced-motion: reduce)');
    const portraitMQ = matchMedia('(orientation: portrait)');

    /* ---------- Hero film ---------- */
    const hero = root.querySelector('[data-hero]');
    const stage = hero.querySelector('.stage');
    const video = stage.querySelector('video');
    const poster = stage.querySelector('.poster');
    const ring = stage.querySelector('.ring');
    const bands = [...stage.querySelectorAll('[data-band]')].map((el, i) => {
        const [a, b] = el.dataset.band.split(',').map(Number);
        el.querySelectorAll('[data-split]').forEach((s, j) => splitText(s, s.dataset.split, 101 + i * 17 + j));
        return {
            el, a, b, i,
            ramp: el.dataset.ramp ? Number(el.dataset.ramp) : null,
            odo: el.querySelector('[data-odo]') ? buildOdometer(el.querySelector('[data-odo]')) : null,
            op: -1, k: -1, live: null,
        };
    });
    const last = bands.length - 1;
    let loadK = 0;

    function heroProgress() {
        const rect = hero.getBoundingClientRect();
        const range = hero.offsetHeight - innerHeight;
        return range > 0 ? clamp(-rect.top / range, 0, 1) : 0;
    }

    function updateCaptions(p) {
        bands.forEach((band) => {
            const { a, b, i } = band;
            const f = Math.min(0.02, (b - a) / 3);
            const inE = (i === 0 || a <= 0) ? 1 : smoothstep(p, a, a + f);
            const outE = (i === last || b >= 1) ? 1 : 1 - smoothstep(p, b - f, b);
            const op = +(inE * outE).toFixed(3);
            let k = clamp((p - a) / (band.ramp || Math.min(0.025, (b - a) * 0.35)), 0, 1);
            if (a <= 0) k = Math.max(k, loadK);
            if (a <= 0 && p <= a) k = loadK;
            if (Math.abs(op - band.op) > 0.004 || (op === 0) !== (band.op === 0) || (op === 1) !== (band.op === 1)) {
                band.el.style.setProperty('--op', op);
                band.el.classList.toggle('shown', op > 0);
                band.op = op;
            }
            if (Math.abs(k - band.k) > 0.008 || (k === 1 && band.k !== 1) || (k === 0 && band.k !== 0)) { band.el.style.setProperty('--k', k.toFixed(3)); band.k = k; }
            const live = op > 0.5;
            if (live !== band.live) { band.el.classList.toggle('live', live); band.live = live; }
            if (band.odo) {
                // the wheel rolls over the first part of the band, driven by scroll (reversible)
                setOdometer(band.odo, clamp((p - band.a - 0.004) / 0.11, 0, 1));
            }
        });
        // portrait screens only see a vertical slice of the film: follow the gloves
        // first, then pan right to keep the patient's face whole on the illustration
        if (portraitMQ.matches) {
            const ox = (42 + 22 * smoothstep(p, 0.56, 0.8)).toFixed(1) + '%';
            if (ox !== stage._ox) { stage.style.setProperty('--ox', ox); stage._ox = ox; }
        }
        const sc = p > 0.015;
        if (stage._sc !== sc) { stage.classList.toggle('scrolled', sc); stage._sc = sc; }
    }

    // gated seeks
    let seekBusy = false;
    let pendingTime = null;
    function requestSeek(t) {
        if (!video.duration || !videoReady) return;
        t = clamp(t, 0, video.duration - 0.04);
        if (seekBusy) { pendingTime = t; return; }
        if (Math.abs(video.currentTime - t) < 0.001) return;
        seekBusy = true;
        video.currentTime = t;
    }
    on(video, 'seeked', () => {
        seekBusy = false;
        if (pendingTime !== null) { const t = pendingTime; pendingTime = null; requestSeek(t); }
    });
    on(video, 'error', () => { seekBusy = false; pendingTime = null; failVideo(); });

    // lerp loop that rests
    let target = 0, shown = 0, rafId = null, lastTick = 0, heroOnScreen = true, videoReady = false;
    function tick(now) {
        const dt = Math.min(100, now - (lastTick || now));
        lastTick = now;
        const k = 0.14;
        shown += (target - shown) * (1 - Math.pow(1 - k, dt / 16.667));
        if (Math.abs(target - shown) < 0.0004) { shown = target; rafId = null; lastTick = 0; }
        else rafId = requestAnimationFrame(tick);
        requestSeek(shown * (video.duration || 0));
        updateCaptions(shown);
    }
    function onScroll() {
        target = heroProgress();
        if (rafId === null && heroOnScreen) rafId = requestAnimationFrame(tick);
    }
    const heroIO = new IntersectionObserver(([e]) => { heroOnScreen = e.isIntersecting; if (heroOnScreen) onScroll(); });
    heroIO.observe(hero);
    cleanups.push(() => heroIO.disconnect());

    // band one assembles on load, then hands over to scroll
    let loadRaf = null;
    const t0 = performance.now();
    function loadRamp(now) {
        loadK = smoothstep((now - t0) / 1600, 0.12, 1);
        updateCaptions(shown);
        if (loadK < 1) loadRaf = requestAnimationFrame(loadRamp);
    }

    // blob loader with ring
    let heroInited = false;
    let abortCtrl = null;
    let objectURL = null;
    function initHeroOnce() {
        if (heroInited) return;
        heroInited = true;
        poster.style.backgroundImage = `url('${POSTER_URL}')`;
        let started = false;
        const start = () => { if (started) return; started = true; loadHeroBlob().catch(failVideo); };
        const img = new Image();
        img.onload = start; img.onerror = start; img.src = POSTER_URL;
        const tmo = setTimeout(start, 4000);
        cleanups.push(() => clearTimeout(tmo));
    }
    async function loadHeroBlob() {
        abortCtrl = new AbortController();
        let watchdog = setTimeout(() => abortCtrl.abort(), 20000);
        const res = await fetch(VIDEO_URL, { priority: 'low', signal: abortCtrl.signal });
        if (!res.ok || !res.body) throw new Error('video unavailable');
        const total = Number(res.headers.get('Content-Length')) || VIDEO_BYTES;
        const reader = res.body.getReader();
        const chunks = [];
        let got = 0, lastRing = 0;
        for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            clearTimeout(watchdog);
            watchdog = setTimeout(() => abortCtrl.abort(), 20000);
            chunks.push(value);
            got += value.length;
            const frac = Math.min(1, got / total);
            const now = performance.now();
            if (now - lastRing > 100 || frac === 1) { lastRing = now; ring.style.setProperty('--ld', Math.round(126 * (1 - frac))); }
        }
        clearTimeout(watchdog);
        ring.style.setProperty('--ld', 0);
        objectURL = URL.createObjectURL(new Blob(chunks, { type: 'video/mp4' }));
        video.src = objectURL;
        video.load();
        let ready = false;
        const onReady = () => {
            if (ready) return;
            ready = true;
            videoReady = true;
            requestSeek(heroProgress() * video.duration);
            stage.classList.add('video-ready');
        };
        video.addEventListener('canplay', onReady, { once: true });
        video.addEventListener('loadeddata', onReady, { once: true });
        // iOS Safari only paints frames of a video that has been started once:
        // a muted play/pause primes the decoder without the visitor seeing it.
        video.addEventListener('loadedmetadata', () => {
            const pr = video.play();
            if (pr && pr.then) pr.then(() => { video.pause(); onReady(); }).catch(() => {});
        }, { once: true });
    }
    function failVideo() {
        if (stage.classList.contains('video-failed')) return;
        stage.classList.add('video-failed');
        poster.style.backgroundImage = `url('${POSTER_URL}')`;
    }
    cleanups.push(() => { abortCtrl?.abort(); if (objectURL) URL.revokeObjectURL(objectURL); });

    let scrubOn = false;
    function enableScrub() {
        if (scrubOn) return;
        scrubOn = true;
        initHeroOnce();
        addEventListener('scroll', onScroll, { passive: true });
        bands.forEach((b) => { b.op = -1; b.k = -1; b.live = null; });
        unpinFinalStates();
        loadRaf = requestAnimationFrame(loadRamp);
        updateCaptions(heroProgress());
        onScroll();
    }
    function disableScrub() {
        if (!scrubOn) return;
        scrubOn = false;
        removeEventListener('scroll', onScroll);
        if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
    }
    function applyHeroMode() {
        if (GATES.some((q) => matchMedia(q).matches)) disableScrub();
        else enableScrub();
    }
    const MQLS = GATES.map((q) => matchMedia(q));
    MQLS.forEach((m) => on(m, 'change', applyHeroMode));
    cleanups.push(() => { disableScrub(); if (loadRaf) cancelAnimationFrame(loadRaf); });

    /* ---------- Reveals ---------- */
    const revealIO = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
            if (!e.isIntersecting) return;
            e.target.classList.add('in');
            revealIO.unobserve(e.target);
            // retire stagger delays once entrances are done so hovers never lag
            const t = setTimeout(() => e.target.classList.add('settled'), 1800);
            cleanups.push(() => clearTimeout(t));
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    root.querySelectorAll('[data-reveal]').forEach((s) => revealIO.observe(s));
    cleanups.push(() => revealIO.disconnect());

    /* ---------- Timeline drawn by scroll ---------- */
    const tl = root.querySelector('[data-timeline]');
    const tlA = tl.querySelector('.tl-draw-a');
    const tlB = tl.querySelector('.tl-draw-b');
    const tlSteps = [...tl.querySelectorAll('.tl-steps li')];
    let tlLast = -1;
    function drawTimeline() {
        const r = tl.getBoundingClientRect();
        const p = clamp((innerHeight * 0.85 - r.top) / (r.height * 0.9), 0, 1);
        if (Math.abs(p - tlLast) < 0.003) return;
        tlLast = p;
        const pa = clamp(p / 0.57, 0, 1);
        const pb = clamp((p - 0.57) / 0.43, 0, 1);
        tlA.style.strokeDashoffset = (1 - pa).toFixed(3);
        tlB.style.strokeDashoffset = (1 - pb).toFixed(3);
        tlSteps.forEach((li, i) => {
            const want = p >= i / (tlSteps.length - 1) - 0.02;
            if (li._on !== want) { li.classList.toggle('on', want); li._on = want; }
        });
    }

    /* ---------- Product tilt ---------- */
    const tiltSec = root.querySelector('[data-tilt]');
    const shots = [...tiltSec.querySelectorAll('.shot')];
    let tiltLast = -1;
    function tilt() {
        const r = tiltSec.getBoundingClientRect();
        const p = clamp((innerHeight - r.top) / (innerHeight * 0.9), 0, 1);
        const v = +(1 - smoothstep(p, 0.1, 0.95)).toFixed(3);
        if (v === tiltLast) return;
        tiltLast = v;
        shots.forEach((s) => s.style.setProperty('--tilt', v));
    }

    let pageRaf = null;
    function pageFrame() {
        pageRaf = null;
        if (pinned) return;
        drawTimeline();
        tilt();
    }
    const onPageScroll = () => { if (pageRaf === null) pageRaf = requestAnimationFrame(pageFrame); };
    on(window, 'scroll', onPageScroll, { passive: true });
    on(window, 'resize', onPageScroll);

    /* ---------- Gold dust ---------- */
    const canvas = root.querySelector('.sl-dust');
    const ctx = canvas.getContext('2d');
    let dustRaf = null, parts = [], dpr = 1;
    function sizeDust() {
        dpr = Math.min(2, devicePixelRatio || 1);
        canvas.width = innerWidth * dpr;
        canvas.height = innerHeight * dpr;
        const n = innerWidth < 720 ? 18 : 38;
        const r = rng(7);
        parts = Array.from({ length: n }, () => ({
            x: r() * canvas.width, y: r() * canvas.height,
            s: (0.6 + r() * 1.6) * dpr, vy: (0.05 + r() * 0.16) * dpr, vx: (r() - 0.5) * 0.08 * dpr,
            a: 0.15 + r() * 0.4, ph: r() * Math.PI * 2,
        }));
    }
    function dust(now) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        parts.forEach((p) => {
            p.y -= p.vy; p.x += p.vx + Math.sin(now / 3000 + p.ph) * 0.12;
            if (p.y < -10) { p.y = canvas.height + 10; }
            if (p.x < -10) p.x = canvas.width + 10; else if (p.x > canvas.width + 10) p.x = -10;
            const tw = 0.6 + 0.4 * Math.sin(now / 1400 + p.ph);
            ctx.beginPath();
            ctx.fillStyle = `rgba(192,166,102,${(p.a * tw).toFixed(3)})`;
            ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
            ctx.fill();
        });
        dustRaf = requestAnimationFrame(dust);
    }
    function startDust() { if (dustRaf === null && !reducedMQ.matches && !document.hidden) dustRaf = requestAnimationFrame(dust); }
    function stopDust() { if (dustRaf !== null) { cancelAnimationFrame(dustRaf); dustRaf = null; } }
    sizeDust();
    on(window, 'resize', sizeDust);
    cleanups.push(stopDust);

    /* ---------- Visibility + reduced motion ---------- */
    on(document, 'visibilitychange', () => {
        document.body.classList.toggle('sl-paused', document.hidden);
        if (document.hidden) stopDust(); else startDust();
    });
    cleanups.push(() => document.body.classList.remove('sl-paused'));

    let pinned = false;
    function pinToFinalStates() {
        pinned = true;
        root.classList.add('pinned');
        stopDust();
        tlA.style.strokeDashoffset = 0; tlB.style.strokeDashoffset = 0;
        tlSteps.forEach((li) => { li.classList.add('on'); li._on = true; });
    }
    function unpinFinalStates() {
        if (!pinned) return;
        pinned = false;
        root.classList.remove('pinned');
        tlLast = -1; tiltLast = -1;
        tlSteps.forEach((li) => { li._on = undefined; });
        startDust();
        onPageScroll();
    }
    on(reducedMQ, 'change', (e) => { if (e.matches) pinToFinalStates(); else applyHeroMode(); });

    if (reducedMQ.matches) pinToFinalStates();
    else { startDust(); onPageScroll(); }
    applyHeroMode();

    return () => cleanups.forEach((fn) => fn());
}
