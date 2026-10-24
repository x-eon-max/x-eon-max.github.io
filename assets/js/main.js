/* ==========================================================================
   X-EON Portfolio — behaviour
   - Dynamic Color (Material Color Utilities, expressive scheme variant)
   - Shape-morphing avatar (M3 Expressive shape library approximation)
   - Projects grid + live GitHub stats
   - FR / EN i18n, light / dark theme, scroll reveal, nav highlight
   ========================================================================== */

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const store = {
  get: (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* --------------------------------------------------------------------------
   i18n
   -------------------------------------------------------------------------- */
const EN = {
  "skip": "Skip to content",
  "nav.about": "About", "nav.projects": "Projects", "nav.skills": "Skills", "nav.music": "Music", "nav.contact": "Contact",
  "palette.title": "Source color (Dynamic Color)", "palette.custom": "Custom",
  "hero.chip": "Open to open-source projects",
  "hero.tagline": "French 🇫🇷 high-schooler writing code <em>close to the hardware</em> on Linux — and making music.",
  "hero.cta1": "See projects",
  "stats.repos": "public repos", "stats.stars": "stars", "stats.followers": "followers",
  "about.title": "About",
  "about.hello": "Hi, I'm X-EON.",
  "about.p1": "I'm a French high-school student passionate about computers and music. I love understanding how things work under the hood — drivers, protocols, the Linux kernel… and turning that into simple tools that feel great to use.",
  "about.linux.t": "Linux first",
  "about.linux.p": "Arch Linux daily. Scripts, systemd services, udev, hidraw: I automate everything that can be automated.",
  "about.perf.t": "Performance-obsessed",
  "about.perf.p": "Direct file-descriptor writes, vectorised NumPy, no wasted loops: a tool should be lightweight.",
  "about.learn.t": "Always learning",
  "about.learn.p": "Open to collaborating and connecting with people who share the same interests. Feel free to open an issue or a PR on my repos!",
  "projects.title": "Projects", "filter.all": "All",
  "skills.title": "Skills", "skills.lang": "Languages", "skills.sys": "Systems & hardware", "skills.libs": "Frameworks & tools",
  "music.title": "Music",
  "music.h": "When I'm not coding, I'm producing.",
  "music.p": "Making music is my favourite way to unwind. Same love for detail and experimentation as in code — just with synths.",
  "music.synth": "Play synth chords",
  "music.synth.stop": "Stop audio",
  "contact.title": "Let's build something?",
  "contact.p": "The best way to reach me is GitHub: issues, pull requests or discussions on my projects.",
  "pages.title": "Other pages on this site",
  "pages.inferno": "Technical guide to compile and boot Inferno on Android",
  "pages.sti2d": "Discover the STI2D SIN track in French high school",
  "footer": "Designed with Material 3 Expressive, hand-coded.",
};
const FR = {}; // captured from the DOM on first run

let lang = store.get("lang", (navigator.language || "fr").startsWith("fr") ? "fr" : "en");

function captureFR() {
  $$("[data-i18n]").forEach(el => (FR[el.dataset.i18n] = el.textContent));
  $$("[data-i18n-html]").forEach(el => (FR[el.dataset.i18nHtml] = el.innerHTML));
}
function t(key) { return (lang === "en" ? EN : FR)[key] ?? FR[key] ?? key; }

function applyLang() {
  document.documentElement.lang = lang;
  $$("[data-i18n]").forEach(el => (el.textContent = t(el.dataset.i18n)));
  $$("[data-i18n-html]").forEach(el => (el.innerHTML = t(el.dataset.i18nHtml)));
  $(".lang-label").textContent = lang === "fr" ? "EN" : "FR";
  renderProjects(currentFilter, false);
}

/* --------------------------------------------------------------------------
   Theme + Dynamic Color
   -------------------------------------------------------------------------- */
const SEEDS = ["#1793d1", "#6750a4", "#00897b", "#e8710a", "#d81b60", "#558b2f"];
let mode = store.get("mode", matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
let seed = store.get("seed", SEEDS[0]);
let mcu = null; // material-color-utilities module (lazy)

const TOKENS = [
  "primary", "onPrimary", "primaryContainer", "onPrimaryContainer",
  "secondary", "onSecondary", "secondaryContainer", "onSecondaryContainer",
  "tertiary", "onTertiary", "tertiaryContainer", "onTertiaryContainer",
  "error", "surface", "onSurface", "onSurfaceVariant", "outline", "outlineVariant",
  "surfaceContainerLowest", "surfaceContainerLow", "surfaceContainer",
  "surfaceContainerHigh", "surfaceContainerHighest", "inverseSurface", "inverseOnSurface",
];
const kebab = s => s.replace(/[A-Z]/g, m => "-" + m.toLowerCase());

async function loadMCU() {
  if (mcu) return mcu;
  try {
    mcu = await import("https://esm.run/@material/material-color-utilities@0.3.0");
  } catch (e) {
    console.warn("Dynamic color unavailable, using static fallback scheme.", e);
    mcu = false;
  }
  return mcu;
}

async function applyTheme() {
  const root = document.documentElement;
  root.dataset.theme = mode;
  $("#theme-icon").textContent = mode === "dark" ? "light_mode" : "dark_mode";

  const lib = await loadMCU();
  if (!lib) return;
  try {
    // SchemeVibrant keeps the seed hue for primary (SchemeExpressive rotates it
    // by ~240°, which turned the Arch blue into olive green).
    const { argbFromHex, hexFromArgb, Hct, SchemeVibrant, MaterialDynamicColors } = lib;
    const scheme = new SchemeVibrant(Hct.fromInt(argbFromHex(seed)), mode === "dark", 0);
    for (const tk of TOKENS) {
      const dyn = MaterialDynamicColors[tk];
      if (dyn) root.style.setProperty(`--md-sys-color-${kebab(tk)}`, hexFromArgb(dyn.getArgb(scheme)));
    }
    $('meta[name="theme-color"]').content = hexFromArgb(MaterialDynamicColors.surface.getArgb(scheme));
  } catch (e) {
    console.warn("Dynamic color failed:", e);
  }
}

function buildSwatches() {
  const wrap = $("#swatches");
  wrap.innerHTML = "";
  SEEDS.forEach(c => {
    const b = document.createElement("button");
    b.className = "swatch";
    b.style.setProperty("--c", c);
    b.setAttribute("aria-label", c);
    b.setAttribute("aria-pressed", String(c === seed));
    b.addEventListener("click", () => setSeed(c));
    wrap.appendChild(b);
  });
  $("#custom-color").value = seed;
}
function setSeed(c) {
  seed = c;
  store.set("seed", c);
  $$(".swatch").forEach(s => s.setAttribute("aria-pressed", String(s.getAttribute("aria-label") === c)));
  applyTheme();
}

/* --------------------------------------------------------------------------
   Shape morphing (polar shapes sampled with the same point count so they
   can be interpolated point-by-point, like M3 Expressive's shape morph)
   -------------------------------------------------------------------------- */
const N = 180;
const superellipse = (th, n) => 1 / Math.pow(Math.pow(Math.abs(Math.cos(th)), n) + Math.pow(Math.abs(Math.sin(th)), n), 1 / n);
const SHAPES = {
  circle:   () => 1,
  cookie9:  th => 1 + 0.07 * Math.cos(9 * th),
  clover4:  th => 0.8 + 0.2 * Math.pow(Math.abs(Math.cos(2 * th)), 0.6),
  sunny:    th => 1 + 0.045 * Math.cos(12 * th),
  flower6:  th => 1 + 0.12 * Math.cos(6 * th),
  squircle: th => superellipse(th, 4),
  pentagon: th => 1 + 0.06 * Math.cos(5 * th),
  cookie4:  th => 1 + 0.1 * Math.cos(4 * th),
};
const SHAPE_ORDER = ["cookie9", "clover4", "squircle", "flower6", "sunny", "cookie4", "pentagon", "circle"];

function sample(name) {
  const f = SHAPES[name];
  const r = Array.from({ length: N }, (_, i) => f((i / N) * Math.PI * 2));
  const max = Math.max(...r);
  return r.map(v => v / max);
}
const SAMPLED = Object.fromEntries(Object.keys(SHAPES).map(k => [k, sample(k)]));

function pathFrom(radii, rot = 0) {
  let d = "";
  for (let i = 0; i < N; i++) {
    const th = (i / N) * Math.PI * 2 + rot;
    const x = 0.5 + 0.5 * radii[i] * Math.cos(th);
    const y = 0.5 + 0.5 * radii[i] * Math.sin(th);
    d += (i ? "L" : "M") + x.toFixed(4) + " " + y.toFixed(4);
  }
  return d + "Z";
}

function initMorph() {
  const clip = $("#avatar-clip-path");
  let idx = 0;
  let from = SAMPLED[SHAPE_ORDER[0]], to = from;
  let start = 0, rot = 0, last = performance.now();
  const DUR = 900;
  // Spring-ish ease with a little overshoot
  const ease = x => 1 - Math.pow(1 - x, 3) + Math.sin(x * Math.PI) * 0.12 * (1 - x);

  const next = () => {
    from = current();
    idx = (idx + 1) % SHAPE_ORDER.length;
    to = SAMPLED[SHAPE_ORDER[idx]];
    start = performance.now();
  };
  let cur = from;
  const current = () => cur;

  function frame(now) {
    const p = Math.min(1, (now - start) / DUR);
    const e = ease(p);
    cur = from.map((v, i) => v + (to[i] - v) * e);
    rot += ((now - last) / 1000) * 0.15;
    last = now;
    clip.setAttribute("d", pathFrom(cur, rot));
    if (!reduceMotion) requestAnimationFrame(frame);
  }
  clip.setAttribute("d", pathFrom(from));
  if (reduceMotion) return;
  requestAnimationFrame(frame);
  setInterval(next, 3200);
  $("#avatar").addEventListener("click", next);
}

/* --------------------------------------------------------------------------
   Hero letters react to the pointer (variable font weight / width axes)
   -------------------------------------------------------------------------- */
function initHeroType() {
  const letters = $$(".hero-letter");
  if (reduceMotion || !matchMedia("(pointer: fine)").matches) return;
  window.addEventListener("pointermove", e => {
    letters.forEach(l => {
      const r = l.getBoundingClientRect();
      const dist = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
      const k = Math.max(0, 1 - dist / 500);
      l.style.setProperty("--w", Math.round(500 + 500 * k));
      l.style.setProperty("--wd", Math.round(90 + 60 * k));
    });
  }, { passive: true });
}

/* --------------------------------------------------------------------------
   Projects (content based on each repo's own README / description)
   -------------------------------------------------------------------------- */
const LANG_COLORS = { Python: "#3572A5", TypeScript: "#3178c6", JavaScript: "#f1e05a", Batchfile: "#C1F12E", C: "#555555" };
const PROJECTS = [
  {
    repo: "dualsensectl-gui", icon: "sports_esports", lang: "Python", tags: ["linux", "python"], featured: true,
    stack: ["PyQt6", "dualsensectl", "udev"],
    fr: "Interface graphique complète pour les manettes PS5 DualSense sous Linux : gâchettes adaptatives, barre lumineuse RGB, micro, audio et batterie.",
    en: "Full-featured Linux GUI for PS5 DualSense controllers: adaptive triggers, RGB lightbar, microphone, audio and battery.",
  },
  {
    repo: "YAALUS", icon: "system_update_alt", lang: "Python", tags: ["linux", "python"], featured: true,
    stack: ["PyQt6", "pacman / AUR", "Flatpak", "systemd"],
    fr: "Suite de mise à jour et de maintenance pour Arch Linux : pacman, AUR et Flatpak, news Arch, nettoyage du cache, orphelins, miroirs, interface PyQt6.",
    en: "Arch Linux update & maintenance suite: pacman, AUR and Flatpak, Arch news, cache cleaning, orphans, mirrors, PyQt6 interface.",
  },
  {
    repo: "clevo_chroma", icon: "keyboard", lang: "Python", tags: ["linux", "python"],
    stack: ["os.pwrite", "GDK", "LUT"],
    fr: "Contrôleur RGB ultra-optimisé pour les claviers des portables Clevo sous Linux : ambilight natif, cycle fluide, quasi 0 % de CPU.",
    en: "Relentlessly optimised RGB controller for Clevo laptop keyboards on Linux: native ambilight, fluid cycle, near-0% CPU.",
  },
  {
    repo: "CLIVideoPlayer", icon: "smart_display", lang: "Python", tags: ["python"],
    stack: ["NumPy", "Pygame", "ANSI"],
    fr: "Lecteur vidéo dans le terminal : conversion des images en ASCII coloré en temps réel, multi-thread, synchronisé sur l'audio.",
    en: "Terminal video player: real-time coloured ASCII frames, multi-threaded decoding, synced to the audio clock.",
  },
  {
    repo: "LiveLyrics", icon: "lyrics", lang: "Python", tags: ["python", "windows"],
    stack: ["winsdk", "LRCLIB", "Discord"],
    fr: "Synchronise ton statut Discord avec les paroles de la musique en cours de lecture sur Windows.",
    en: "Syncs your Discord status with the lyrics of the song currently playing on Windows.",
  },
  {
    repo: "telemetryremover", icon: "shield_lock", lang: "Batchfile", tags: ["windows"],
    stack: ["Batch", "Windows 11"],
    fr: "Script pour désactiver la télémétrie et supprimer les bloatwares de Windows 11, avec un contrôle fin de ce qui est retiré.",
    en: "Script to disable telemetry and remove bloatware from Windows 11, with granular control over what gets removed.",
  },
  {
    repo: "mrpc", icon: "live_tv", lang: "TypeScript", tags: ["web"],
    stack: ["PreMiD", "TypeScript"],
    fr: "Presence PreMiD pour Movix : affiche ce que tu regardes dans ton statut Discord.",
    en: "PreMiD presence for Movix: shows what you're watching in your Discord status.",
  },
  {
    repo: "audio-file-downloader", icon: "download", lang: "JavaScript", tags: ["web"],
    stack: ["JavaScript", "Userscript"],
    fr: "Composant à utiliser avec le userscript SampleFocus Downloader.",
    en: "Companion component for the SampleFocus Downloader userscript.",
  },
];
const ghData = {}; // repo -> { stars, pushed, release }
let currentFilter = "all";

const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function renderProjects(filter = "all", animate = true) {
  const grid = $("#projects-grid");
  const fmt = new Intl.DateTimeFormat(lang, { month: "short", year: "numeric" });
  grid.innerHTML = PROJECTS.map(p => {
    const g = ghData[p.repo] || {};
    const hidden = filter !== "all" && !p.tags.includes(filter);
    return `
      <a class="project-card ${p.featured ? "featured" : ""} ${hidden ? "hidden" : ""} ${animate && !hidden ? "entering" : ""}"
         href="https://github.com/x-eon-max/${esc(p.repo)}" target="_blank" rel="noopener">
        <div class="project-top">
          <span class="project-icon"><span class="material-symbols-rounded">${p.icon}</span></span>
          <div>
            <h3 class="project-name">${esc(p.repo)}</h3>
            ${g.release ? `<span class="project-badge">${esc(g.release)}</span>` : ""}
          </div>
        </div>
        <p class="project-desc">${esc(p[lang] || p.fr)}</p>
        <div class="tag-row">${p.stack.map(s => `<span class="tag">${esc(s)}</span>`).join("")}</div>
        <div class="project-meta">
          <span><i class="lang-dot" style="--lc:${LANG_COLORS[p.lang] || "#888"}"></i>${esc(p.lang)}</span>
          ${g.stars != null ? `<span><span class="material-symbols-rounded">star</span>${g.stars}</span>` : ""}
          ${g.pushed ? `<span><span class="material-symbols-rounded">update</span>${fmt.format(new Date(g.pushed))}</span>` : ""}
          <span class="material-symbols-rounded go">arrow_forward</span>
        </div>
      </a>`;
  }).join("");
  $$(".project-card.entering", grid).forEach((c, i) => (c.style.animationDelay = `${i * 60}ms`));
}

function initFilters() {
  $$("#filters .filter-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      $$("#filters .filter-chip").forEach(c => c.classList.toggle("selected", c === chip));
      currentFilter = chip.dataset.filter;
      renderProjects(currentFilter, true);
    });
  });
}

/* Animated counter */
function countTo(el, value) {
  if (reduceMotion) { el.textContent = value; return; }
  const t0 = performance.now(), D = 1200;
  const step = now => {
    const p = Math.min(1, (now - t0) / D);
    el.textContent = Math.round(value * (1 - Math.pow(1 - p, 4)));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

async function loadGitHub() {
  const USER = "x-eon-max";
  const cacheKey = "gh-cache-v1";
  let cached = null;
  try { cached = JSON.parse(store.get(cacheKey, "null")); } catch { /* ignore */ }

  let data = cached && Date.now() - cached.t < 3600_000 ? cached : null;
  if (!data) {
    try {
      const [u, repos] = await Promise.all([
        fetch(`https://api.github.com/users/${USER}`).then(r => (r.ok ? r.json() : Promise.reject(r.status))),
        fetch(`https://api.github.com/users/${USER}/repos?per_page=100`).then(r => (r.ok ? r.json() : Promise.reject(r.status))),
      ]);
      const releases = {};
      await Promise.all(PROJECTS.filter(p => p.featured).map(async p => {
        const r = await fetch(`https://api.github.com/repos/${USER}/${p.repo}/releases/latest`);
        if (r.ok) releases[p.repo] = (await r.json()).tag_name;
      }));
      data = {
        t: Date.now(),
        user: { repos: u.public_repos, followers: u.followers },
        repos: repos.map(r => ({ name: r.name, stars: r.stargazers_count, pushed: r.pushed_at, fork: r.fork })),
        releases,
      };
      store.set(cacheKey, JSON.stringify(data));
    } catch (e) {
      console.warn("GitHub API unavailable (rate limit?)", e);
      data = cached; // stale cache is better than nothing
    }
  }
  if (!data) return;

  for (const r of data.repos) ghData[r.name] = { stars: r.stars, pushed: r.pushed, release: data.releases[r.name] };
  const stars = data.repos.filter(r => !r.fork).reduce((a, r) => a + r.stars, 0);
  countTo($("#stat-repos"), data.user.repos);
  countTo($("#stat-stars"), stars);
  countTo($("#stat-followers"), data.user.followers);
  renderProjects(currentFilter, false);
}

/* --------------------------------------------------------------------------
   UI chrome: reveal, nav highlight, app bar, FAB, palette sheet
   -------------------------------------------------------------------------- */
function initReveal() {
  const reveals = $$(".reveal");
  if (!reveals.length) return;

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.05, rootMargin: "0px 0px 80px 0px" });

  reveals.forEach(el => {
    const sibs = [...el.parentElement.children].filter(c => c.classList.contains("reveal"));
    el.style.setProperty("--d", `${sibs.indexOf(el) * 60}ms`);
    
    // If element is already in viewport, reveal immediately
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight + 50) {
      el.classList.add("in");
    } else {
      io.observe(el);
    }
  });

  // Fallback: ensure all elements become visible
  setTimeout(() => {
    $$(".reveal:not(.in)").forEach(el => el.classList.add("in"));
  }, 1000);
}

function initNav() {
  const links = $$(".nav-item");
  const map = new Map(links.map(l => [l.getAttribute("href").slice(1), l]));
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) links.forEach(l => l.classList.toggle("active", l === map.get(e.target.id)));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  ["hero", ...map.keys()].forEach(id => { const s = document.getElementById(id); if (s) io.observe(s); });

  const bar = $(".top-app-bar"), fab = $("#fab");
  const onScroll = () => {
    bar.classList.toggle("scrolled", scrollY > 8);
    fab.classList.toggle("visible", scrollY > innerHeight * 0.8);
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function initPalette() {
  const btn = $("#palette-toggle"), sheet = $("#palette-sheet");
  const close = () => { sheet.hidden = true; btn.setAttribute("aria-expanded", "false"); };
  btn.addEventListener("click", e => {
    e.stopPropagation();
    const open = sheet.hidden;
    sheet.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
  });
  sheet.addEventListener("click", e => e.stopPropagation());
  document.addEventListener("click", close);
  document.addEventListener("keydown", e => e.key === "Escape" && close());
  $("#custom-color").addEventListener("input", e => setSeed(e.target.value));
}

/* --------------------------------------------------------------------------
   Interactive Web Audio Synth & Reactive Equalizer
   -------------------------------------------------------------------------- */
let audioCtx = null;
let synthGain = null;
let analyser = null;
let isPlayingSynth = false;
let animId = null;

function initSynth() {
  const btn = $("#synth-toggle");
  if (!btn) return;
  const icon = $("#synth-icon");
  const label = $("#synth-label");
  const eq = $(".eq");
  const bars = $$(".eq span");

  function stop() {
    if (!audioCtx || !isPlayingSynth) return;
    isPlayingSynth = false;
    btn.classList.remove("playing");
    icon.textContent = "play_arrow";
    label.textContent = lang === "fr" ? "Jouer une nappe synthé" : "Play synth chords";
    eq.classList.remove("live");
    if (synthGain) {
      synthGain.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);
      setTimeout(() => {
        try { audioCtx.suspend(); } catch {}
      }, 600);
    }
    if (animId) cancelAnimationFrame(animId);
  }

  function play() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    isPlayingSynth = true;
    btn.classList.add("playing");
    icon.textContent = "pause";
    label.textContent = lang === "fr" ? "Arrêter l'audio" : "Stop audio";
    eq.classList.add("live");

    synthGain = audioCtx.createGain();
    synthGain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    synthGain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.8);

    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;

    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(400, audioCtx.currentTime);
    filter.frequency.linearRampToValueAtTime(1400, audioCtx.currentTime + 2.5);
    filter.Q.value = 3.5;

    const delay = audioCtx.createDelay();
    delay.delayTime.value = 0.28;
    const delayFeedback = audioCtx.createGain();
    delayFeedback.gain.value = 0.35;
    delay.connect(delayFeedback);
    delayFeedback.connect(delay);

    const freqs = [87.31, 130.81, 155.56, 196.00, 207.65, 261.63];
    freqs.forEach((f, i) => {
      const osc = audioCtx.createOscillator();
      osc.type = i % 2 === 0 ? "sawtooth" : "triangle";
      osc.frequency.setValueAtTime(f, audioCtx.currentTime);
      osc.detune.setValueAtTime((Math.random() - 0.5) * 12, audioCtx.currentTime);
      osc.connect(filter);
      osc.start();
    });

    filter.connect(synthGain);
    filter.connect(delay);
    delay.connect(synthGain);
    synthGain.connect(analyser);
    analyser.connect(audioCtx.destination);

    const freqData = new Uint8Array(analyser.frequencyBinCount);
    function updateEq() {
      if (!isPlayingSynth) return;
      analyser.getByteFrequencyData(freqData);
      bars.forEach((bar, i) => {
        const val = (freqData[i % freqData.length] / 255);
        const scale = Math.max(0.12, Math.min(1.0, val * 1.6));
        bar.style.height = `${Math.round(scale * 100)}%`;
      });
      animId = requestAnimationFrame(updateEq);
    }
    updateEq();
  }

  btn.addEventListener("click", () => {
    if (isPlayingSynth) stop();
    else play();
  });
}

/* --------------------------------------------------------------------------
   Interactive Terminal Drawer (CLI Mode)
   -------------------------------------------------------------------------- */
function initTerminal() {
  const scrim = $("#terminal-scrim");
  const toggleBtn = $("#term-toggle");
  const closeBtn = $("#term-close");
  const form = $("#term-form");
  const input = $("#term-input");
  const output = $("#term-output");
  const body = $("#term-body");

  if (!scrim || !toggleBtn) return;

  const open = () => {
    scrim.hidden = false;
    setTimeout(() => input.focus(), 80);
  };
  const close = () => {
    scrim.hidden = true;
  };

  toggleBtn.addEventListener("click", () => {
    if (scrim.hidden) open();
    else close();
  });
  closeBtn.addEventListener("click", close);
  scrim.addEventListener("click", e => {
    if (e.target === scrim) close();
  });

  window.addEventListener("keydown", e => {
    if ((e.ctrlKey && e.key.toLowerCase() === "k") || (e.key === "`" && document.activeElement !== input)) {
      e.preventDefault();
      if (scrim.hidden) open();
      else close();
    } else if (e.key === "Escape" && !scrim.hidden) {
      close();
    }
  });

  const history = [];
  let histIdx = -1;

  form.addEventListener("submit", e => {
    e.preventDefault();
    const cmd = input.value.trim();
    if (!cmd) return;
    history.push(cmd);
    histIdx = history.length;
    input.value = "";

    const userLine = document.createElement("div");
    userLine.innerHTML = `<span class="prompt">guest@x-eon:~$</span> ${esc(cmd)}`;
    output.appendChild(userLine);

    const parts = cmd.split(/\s+/);
    const c = parts[0].toLowerCase();
    const arg = parts[1]?.toLowerCase();
    const resp = document.createElement("div");

    switch (c) {
      case "help":
        resp.innerHTML = `Available commands:
  <span class="highlight">neofetch</span>    : Display system info & ASCII banner
  <span class="highlight">projects</span>    : List GitHub repositories
  <span class="highlight">about</span>       : About X-EON
  <span class="highlight">skills</span>      : Tech stack summary
  <span class="highlight">theme</span>       : Toggle theme or color (<span class="accent">dark</span>, <span class="accent">light</span>, <span class="accent">cyan</span>, <span class="accent">purple</span>, <span class="accent">amber</span>)
  <span class="highlight">clear</span>       : Clear terminal screen
  <span class="highlight">exit</span>        : Close terminal`;
        break;

      case "neofetch":
        resp.innerHTML = `<span class="accent">
       /\\         <span class="prompt">x-eon</span>@<span class="prompt">archlinux</span>
      /  \\        -------------------
     /\\   \\       <span class="highlight">OS:</span> Arch Linux x86_64
    /      \\      <span class="highlight">Host:</span> Clevo Workstation
   /   ,,   \\     <span class="highlight">Kernel:</span> Linux Zen (Rolling)
  /   |  |  -\\    <span class="highlight">Uptime:</span> Always Coding & Producing
 /_-''    ''-_\\   <span class="highlight">Shell:</span> zsh / bash
                  <span class="highlight">WM/DE:</span> KDE Plasma (Wayland)
                  <span class="highlight">DAW:</span> Bitwig Studio 6
                  <span class="highlight">Gamepad:</span> Sony DualSense (dualsensectl)
                  <span class="highlight">Projects:</span> dualsensectl-gui, YAALUS, clevo_chroma
        </span>`;
        break;

      case "projects":
      case "ls":
        resp.innerHTML = `Featured repositories on <span class="prompt">github.com/x-eon-max</span>:
  • <a href="https://github.com/x-eon-max/dualsensectl-gui" target="_blank" class="highlight">dualsensectl-gui</a>  : PyQt6 GUI for PS5 DualSense controllers
  • <a href="https://github.com/x-eon-max/YAALUS" target="_blank" class="highlight">YAALUS</a>            : Arch Linux Update & Maintenance Suite
  • <a href="https://github.com/x-eon-max/clevo_chroma" target="_blank" class="highlight">clevo_chroma</a>      : High-perf Linux RGB keyboard controller
  • <a href="https://github.com/x-eon-max/CLIVideoPlayer" target="_blank" class="highlight">CLIVideoPlayer</a>    : Terminal ANSI video player in Python
  • <a href="https://github.com/x-eon-max/LiveLyrics" target="_blank" class="highlight">LiveLyrics</a>        : Discord synced lyrics companion`;
        break;

      case "about":
      case "whoami":
        resp.innerHTML = `X-EON — High-school student from France 🇫🇷.
Passionate about low-level Linux internals (drivers, hidraw, systemd),
ergonomic desktop utilities (PyQt6), and electronic music production (Bitwig Studio).`;
        break;

      case "skills":
        resp.innerHTML = `Languages : Python, C, Bash, TypeScript, JavaScript, HTML/CSS, Batch
Systems   : Arch Linux, Linux Kernel, systemd, udev, D-Bus, PipeWire
Audio     : Bitwig Studio, VST3/CLAP, Sound Design, Web Audio API`;
        break;

      case "theme":
        if (arg === "dark" || arg === "light") {
          mode = arg;
          store.set("mode", mode);
          applyTheme();
          resp.innerHTML = `Theme set to <span class="highlight">${arg}</span> mode.`;
        } else if (arg === "cyan") {
          setSeed("#1793d1");
          resp.innerHTML = `Accent color set to <span class="highlight">Arch Cyan</span>.`;
        } else if (arg === "purple") {
          setSeed("#6750a4");
          resp.innerHTML = `Accent color set to <span class="highlight">Material Purple</span>.`;
        } else if (arg === "amber") {
          setSeed("#e8710a");
          resp.innerHTML = `Accent color set to <span class="highlight">Amber</span>.`;
        } else {
          resp.innerHTML = `Usage: theme <span class="accent">&lt;dark|light|cyan|purple|amber&gt;</span>`;
        }
        break;

      case "clear":
        output.innerHTML = "";
        return;

      case "exit":
      case "close":
        close();
        return;

      default:
        resp.innerHTML = `Command not found: <span class="accent">${esc(cmd)}</span>. Type <span class="highlight">help</span> for available commands.`;
        break;
    }
    output.appendChild(resp);
    body.scrollTop = body.scrollHeight;
  });

  input.addEventListener("keydown", e => {
    if (e.key === "ArrowUp") {
      if (histIdx > 0) {
        histIdx--;
        input.value = history[histIdx] || "";
      }
    } else if (e.key === "ArrowDown") {
      if (histIdx < history.length - 1) {
        histIdx++;
        input.value = history[histIdx] || "";
      } else {
        histIdx = history.length;
        input.value = "";
      }
    }
  });
}

/* --------------------------------------------------------------------------
   Boot
   -------------------------------------------------------------------------- */
captureFR();
$("#year").textContent = new Date().getFullYear();
renderProjects("all", false);
initFilters();
applyLang();
buildSwatches();
initPalette();
applyTheme();
initMorph();
initHeroType();
initReveal();
initNav();
initSynth();
initTerminal();
loadGitHub();

$("#theme-toggle").addEventListener("click", () => {
  mode = mode === "dark" ? "light" : "dark";
  store.set("mode", mode);
  const swap = () => applyTheme();
  document.startViewTransition && !reduceMotion ? document.startViewTransition(swap) : swap();
});
$("#lang-toggle").addEventListener("click", () => {
  lang = lang === "fr" ? "en" : "fr";
  store.set("lang", lang);
  applyLang();
});
