/* ═══════════════════════════════════════════════════════
   NeuroConcrete — Enhanced JavaScript
   ═══════════════════════════════════════════════════════ */
"use strict";

// ── Config ──────────────────────────────────────────────
const FIELDS = ["cement","slag","ash","water","superplastic","coarseagg","fineagg","age"];
const LABELS = {
  cement:"Cement", slag:"Slag", ash:"Fly Ash", water:"Water",
  superplastic:"Superplasticizer", coarseagg:"Coarse Agg.", fineagg:"Fine Agg.", age:"Age"
};
const UNITS = {
  cement:"kg/m³", slag:"kg/m³", ash:"kg/m³", water:"kg/m³",
  superplastic:"kg/m³", coarseagg:"kg/m³", fineagg:"kg/m³", age:"days"
};
const RANGES = {
  cement:[100,540], slag:[0,360], ash:[0,200], water:[120,250],
  superplastic:[0,32], coarseagg:[800,1145], fineagg:[594,993], age:[1,365]
};
const PRESETS = {
  standard: { cement:310, slag:0,   ash:0,   water:180, superplastic:6,  coarseagg:980,  fineagg:800, age:28  },
  high:     { cement:500, slag:100, ash:50,  water:155, superplastic:18, coarseagg:900,  fineagg:700, age:90  },
  eco:      { cement:200, slag:180, ash:100, water:175, superplastic:5,  coarseagg:1000, fineagg:820, age:28  },
  uhpc:     { cement:540, slag:0,   ash:0,   water:120, superplastic:32, coarseagg:800,  fineagg:600, age:180 }
};

let activeTab = "form";

/* ══════════════════════════════════════════════════════
   PARTICLE CANVAS
══════════════════════════════════════════════════════ */
function initParticles() {
  const canvas = document.getElementById("particle-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let W = canvas.width = window.innerWidth;
  let H = canvas.height = window.innerHeight;

  const count = Math.min(60, Math.floor(W * H / 25000));
  const particles = [];

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.r = Math.random() * 1.5 + 0.3;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = (Math.random() - 0.5) * 0.3;
      this.alpha = Math.random() * 0.5 + 0.1;
      const colors = ["99,102,241","6,182,212","16,185,129","139,92,246"];
      this.color = colors[Math.floor(Math.random() * colors.length)];
    }
    update() {
      this.x += this.vx; this.y += this.vy;
      if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color},${this.alpha})`;
      ctx.fill();
    }
  }

  for (let i = 0; i < count; i++) particles.push(new Particle());

  // Connect nearby particles
  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(99,102,241,${0.06 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);
    drawConnections();
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
  }
  animate();

  window.addEventListener("resize", () => {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  });
}

/* ══════════════════════════════════════════════════════
   COUNTER ANIMATION
══════════════════════════════════════════════════════ */
function animateCounters() {
  document.querySelectorAll(".counter-val").forEach(el => {
    const target = parseFloat(el.dataset.target);
    const suffix = el.dataset.suffix || "";
    const duration = 1800;
    const isFloat = target % 1 !== 0;
    let start = null;

    function step(ts) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const val = target * ease;
      el.textContent = (isFloat ? val.toFixed(2) : Math.floor(val)) + suffix;
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = (isFloat ? target.toFixed(2) : target) + suffix;
    }
    requestAnimationFrame(step);
  });
}

/* ══════════════════════════════════════════════════════
   INTERSECTION OBSERVER (scroll reveal)
══════════════════════════════════════════════════════ */
function initScrollReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        // Trigger counter animation when hero stats are visible
        if (e.target.classList.contains("hero-counters")) {
          animateCounters();
        }
        // Trigger FI bar animations
        if (e.target.classList.contains("fi-bars")) {
          e.target.querySelectorAll(".fi-fill").forEach(fill => {
            fill.style.animationPlayState = "running";
          });
        }
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll(
    ".hiw-step,.insight-card,.feature-card,.grade-ref-card"
  ).forEach((el, i) => {
    el.classList.add("reveal");
    el.style.transitionDelay = `${(i % 4) * 0.08}s`;
    obs.observe(el);
  });

  // Hero counters
  const counters = document.querySelector(".hero-counters");
  if (counters) obs.observe(counters);

  // FI bars
  const fiBars = document.querySelector(".fi-bars");
  if (fiBars) obs.observe(fiBars);
}

/* ══════════════════════════════════════════════════════
   TAB SWITCHING
══════════════════════════════════════════════════════ */
function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll(".tab-btn").forEach(b => {
    b.classList.toggle("active", b.id === `tab-${tab}`);
    b.setAttribute("aria-selected", b.id === `tab-${tab}`);
  });
  document.querySelectorAll(".tab-content").forEach(c => {
    c.classList.toggle("active", c.id === `content-${tab}`);
  });
  resetResult();
}

/* ══════════════════════════════════════════════════════
   SLIDER SYNC
══════════════════════════════════════════════════════ */
function initSliders() {
  document.querySelectorAll(".range-input").forEach(slider => {
    const numEl = document.getElementById(slider.dataset.target);
    if (!numEl) return;

    const updateFill = () => {
      const pct = ((+slider.value - +slider.min) / (+slider.max - +slider.min)) * 100;
      slider.style.background =
        `linear-gradient(to right,#6366f1 0%,#06b6d4 ${pct}%,rgba(255,255,255,0.1) ${pct}%)`;
    };

    slider.addEventListener("input", () => { numEl.value = slider.value; updateFill(); });
    numEl.addEventListener("input", () => {
      let v = parseFloat(numEl.value);
      const mn = +slider.min, mx = +slider.max;
      if (!isNaN(v)) { v = Math.min(mx, Math.max(mn, v)); slider.value = v; updateFill(); }
    });
    updateFill();
  });
}

/* ══════════════════════════════════════════════════════
   GET / VALIDATE VALUES
══════════════════════════════════════════════════════ */
function getValues() {
  const data = {};
  FIELDS.forEach(f => {
    const id = activeTab === "form" ? `f-${f}` : `sv-${f}`;
    const el = document.getElementById(id);
    data[f] = el ? parseFloat(el.value) : null;
  });
  return data;
}

function validate(data) {
  document.querySelectorAll(".input-wrap input").forEach(el => el.classList.remove("error"));
  let valid = true;
  FIELDS.forEach(f => {
    const [mn, mx] = RANGES[f];
    const v = data[f];
    if (isNaN(v) || v === null || v < mn || v > mx) {
      valid = false;
      if (activeTab === "form") {
        const el = document.getElementById(`f-${f}`);
        if (el) el.classList.add("error");
      }
    }
  });
  return valid;
}

/* ══════════════════════════════════════════════════════
   PREDICT
══════════════════════════════════════════════════════ */
async function predict() {
  const data = getValues();
  if (!validate(data)) {
    showError("Please fill in all fields with valid values within the specified ranges.");
    return;
  }
  showLoading();
  try {
    const res = await fetch("/api/predict", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok || json.error) throw new Error(json.error || "Server error");
    showResult(json);
  } catch(err) {
    showError(err.message || "Network error. Is the Flask server running?");
  }
}

/* ══════════════════════════════════════════════════════
   UI STATE MANAGEMENT
══════════════════════════════════════════════════════ */
function setResultState(state) {
  const states = ["idle","loading","output","error"];
  states.forEach(s => {
    const el = document.getElementById(`result-${s}`);
    if (!el) return;
    el.style.display = s === state
      ? (s === "idle" ? "flex" : "block")
      : "none";
  });
  const panel = document.getElementById("result-panel");
  if (panel) panel.classList.toggle("glow", state === "output");
}

function showLoading() {
  setResultState("loading");
  const btn = document.getElementById("btn-predict");
  if (btn) btn.disabled = true;
  const lbl = document.getElementById("predict-label");
  if (lbl) lbl.textContent = "Predicting…";
}

function showError(msg) {
  const errEl = document.getElementById("error-msg");
  if (errEl) errEl.textContent = msg;
  setResultState("error");
  const btn = document.getElementById("btn-predict");
  if (btn) btn.disabled = false;
  const lbl = document.getElementById("predict-label");
  if (lbl) lbl.textContent = "Predict Strength";
}

function resetResult() {
  setResultState("idle");
  const btn = document.getElementById("btn-predict");
  if (btn) btn.disabled = false;
  const lbl = document.getElementById("predict-label");
  if (lbl) lbl.textContent = "Predict Strength";
}

/* ══════════════════════════════════════════════════════
   SHOW RESULT
══════════════════════════════════════════════════════ */
function showResult(json) {
  const btn = document.getElementById("btn-predict");
  if (btn) btn.disabled = false;
  const lbl = document.getElementById("predict-label");
  if (lbl) lbl.textContent = "Predict Strength";

  document.getElementById("r-number").textContent = json.prediction.toFixed(2);
  document.getElementById("result-grade-label").textContent = `${json.grade} Strength Concrete`;
  document.getElementById("grade-text").textContent = json.grade;
  document.getElementById("grade-desc").textContent = json.grade_desc;

  const badge = document.getElementById("grade-badge");
  if (badge) badge.className = `grade-badge ${json.grade_class}`;

  animateGauge(json.prediction);

  const grid = document.getElementById("summary-grid");
  if (grid) {
    grid.innerHTML = Object.entries(json.input).map(([k, v]) => `
      <div class="summary-item">
        <span class="summary-key">${LABELS[k] || k}</span>
        <span class="summary-val">${v} <small style="font-size:.64rem;opacity:.45">${UNITS[k]||''}</small></span>
      </div>
    `).join("");
  }

  setResultState("output");
  document.getElementById("result-panel")?.scrollIntoView({behavior:"smooth", block:"nearest"});
}

/* ══════════════════════════════════════════════════════
   GAUGE ANIMATION
══════════════════════════════════════════════════════ */
function animateGauge(mpa) {
  const arc   = document.getElementById("gauge-arc");
  const label = document.getElementById("gauge-label");
  const total = 283;
  const pct   = Math.min(mpa / 100, 1);
  const offset = total * (1 - pct);

  arc.style.transition = "stroke-dashoffset 1.3s cubic-bezier(.4,0,.2,1)";
  arc.style.strokeDashoffset = offset;

  let start = null;
  const dur = 1100;
  function step(ts) {
    if (!start) start = ts;
    const p = Math.min((ts - start) / dur, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    label.textContent = (mpa * ease).toFixed(1);
    if (p < 1) requestAnimationFrame(step);
    else label.textContent = mpa.toFixed(2);
  }
  requestAnimationFrame(step);
}

/* ══════════════════════════════════════════════════════
   RESET & PRESETS
══════════════════════════════════════════════════════ */
function resetInputs() {
  FIELDS.forEach(f => {
    const fEl = document.getElementById(`f-${f}`);
    if (fEl) { fEl.value = ""; fEl.classList.remove("error"); }
  });
  const defaults = {cement:250,slag:0,ash:0,water:180,superplastic:5,coarseagg:970,fineagg:794,age:28};
  FIELDS.forEach(f => {
    const sEl = document.getElementById(`s-${f}`);
    const svEl = document.getElementById(`sv-${f}`);
    if (sEl && svEl) {
      sEl.value = svEl.value = defaults[f];
      const pct = ((defaults[f] - +sEl.min) / (+sEl.max - +sEl.min)) * 100;
      sEl.style.background = `linear-gradient(to right,#6366f1 0%,#06b6d4 ${pct}%,rgba(255,255,255,.1) ${pct}%)`;
    }
  });
  resetResult();
}

function loadPreset(name) {
  const preset = PRESETS[name];
  if (!preset) return;
  FIELDS.forEach(f => {
    const v = preset[f];
    const fEl = document.getElementById(`f-${f}`);
    if (fEl) { fEl.value = v; fEl.classList.remove("error"); }
    const sEl  = document.getElementById(`s-${f}`);
    const svEl = document.getElementById(`sv-${f}`);
    if (sEl && svEl) {
      sEl.value = svEl.value = v;
      const pct = ((v - +sEl.min) / (+sEl.max - +sEl.min)) * 100;
      sEl.style.background = `linear-gradient(to right,#6366f1 0%,#06b6d4 ${pct}%,rgba(255,255,255,.1) ${pct}%)`;
    }
  });
  // Scroll to predictor then predict
  document.getElementById("predictor")?.scrollIntoView({behavior:"smooth"});
  setTimeout(predict, 600);
}

/* ══════════════════════════════════════════════════════
   NAVBAR SCROLL
══════════════════════════════════════════════════════ */
window.addEventListener("scroll", () => {
  document.getElementById("navbar")?.classList.toggle("scrolled", window.scrollY > 30);
}, {passive:true});

/* ══════════════════════════════════════════════════════
   SMOOTH SCROLL NAV LINKS
══════════════════════════════════════════════════════ */
document.addEventListener("click", e => {
  const link = e.target.closest("a[href^='#']");
  if (link) {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute("href"));
    if (target) target.scrollIntoView({behavior:"smooth", block:"start"});
  }
});

/* ══════════════════════════════════════════════════════
   ENTER KEY SUBMITS
══════════════════════════════════════════════════════ */
document.addEventListener("keydown", e => {
  if (e.key === "Enter" && document.activeElement.tagName === "INPUT") predict();
});

/* ══════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  initParticles();
  initSliders();
  initScrollReveal();
  setResultState("idle");
  console.log("NeuroConcrete UI ready.");
});
