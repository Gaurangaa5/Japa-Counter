(() => {
  "use strict";
  const KEY = "iskcon-japa-counter-v1";
  const $ = (id) => document.getElementById(id);
  const els = {
    count: $("countDisplay"), rounds: $("roundDisplay"), totalCounts: $("totalCounts"),
    totalRounds: $("totalRounds"), percent: $("progressPercent"), fill: $("progressFill"),
    beads: $("beadMarks"), button: $("countButton"), undo: $("undoButton"),
    reset: $("resetButton"), light: $("statusLight"), status: $("statusText")
  };

  let state = { total: 0, history: [] };
  let blinkTimer = null;

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY));
      if (saved && Number.isSafeInteger(saved.total) && saved.total >= 0) {
        state.total = saved.total;
        state.history = Array.isArray(saved.history) ? saved.history.filter((value) => Number.isSafeInteger(value) && value >= 0) : [];
      }
    } catch (_) { /* Start clean if stored data is unavailable or corrupted. */ }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {
      els.status.textContent = "SAVE UNAVAILABLE";
    }
  }
  function buildBeads() {
    const ns = "http://www.w3.org/2000/svg";
    for (let i = 0; i < 108; i++) {
      const angle = (i / 108) * Math.PI * 2;
      const bead = document.createElementNS(ns, "circle");
      bead.setAttribute("cx", (180 + Math.cos(angle) * 142).toFixed(2));
      bead.setAttribute("cy", (180 + Math.sin(angle) * 142).toFixed(2));
      bead.setAttribute("r", i % 9 === 0 ? "2.5" : "1.8");
      bead.setAttribute("class", "bead");
      els.beads.appendChild(bead);
    }
  }
  function render() {
    const inRound = state.total % 108;
    const rounds = Math.floor(state.total / 108);
    els.count.textContent = String(inRound).padStart(3, "0");
    const formattedRounds = rounds.toLocaleString();
    els.rounds.textContent = `${formattedRounds} ${rounds === 1 ? "ROUND" : "ROUNDS"}`;
    const roundChip = els.rounds.closest(".round-chip");
    if (roundChip) {
      const digitCount = String(rounds).length;
      roundChip.classList.toggle("compact", digitCount >= 4 && digitCount < 7);
      roundChip.classList.toggle("extra-compact", digitCount >= 7);
    }
    // These optional summary elements are not present in the current HTML.
    // Update them only when a future layout includes them.
    if (els.totalCounts) els.totalCounts.textContent = state.total.toLocaleString();
    if (els.totalRounds) els.totalRounds.textContent = rounds.toLocaleString();
    els.percent.textContent = `${Math.round((inRound / 108) * 100)}%`;
    els.fill.style.width = `${(inRound / 108) * 100}%`;
    [...els.beads.children].forEach((bead, i) => bead.classList.toggle("done", i < inRound));
    els.undo.disabled = state.history.length === 0;
    els.status.textContent = "READY";
    save();
  }
  function blink() {
    clearTimeout(blinkTimer);
    els.button.classList.remove("blink");
    els.light.classList.remove("active");
    // Force a fresh visual pulse on every tap, including rapid taps.
    void els.button.offsetWidth;
    els.button.classList.add("blink");
    els.light.classList.add("active");
    els.status.textContent = "COUNTED";
    blinkTimer = setTimeout(() => {
      els.button.classList.remove("blink");
      els.light.classList.remove("active");
      els.status.textContent = "READY";
    }, 260);
    els.button.classList.add("pressed");
    setTimeout(() => els.button.classList.remove("pressed"), 110);
  }
  function count(amount = 1) {
    // Never allow click events, strings, or invalid values to enter the total.
    if (!Number.isSafeInteger(amount) || amount < 1) amount = 1;
    if (!Number.isSafeInteger(state.total) || state.total < 0) state.total = 0;
    if (state.total > Number.MAX_SAFE_INTEGER - amount) return;
    state.history.push(state.total);
    state.total += amount;
    render();
    blink();
  }
  function undo() {
    if (!state.history.length) return;
    state.total = state.history.pop();
    render();
  }
  function reset() {
    if (state.total === 0) return;
    if (!window.confirm("Reset this japa session to zero? This cannot be undone.")) return;
    state.total = 0;
    state.history = [];
    render();
  }
  els.button.addEventListener("click", () => count(1));
  els.undo.addEventListener("click", undo);
  els.reset.addEventListener("click", reset);
  window.addEventListener("keydown", (event) => {
    // Spacebar is a keyboard equivalent of tapping COUNT: exactly one bead.
    // Ignore held/repeating keys, hidden tabs, editable fields and native
    // button activation so returning to the page cannot add surprise rounds.
    const target = event.target;
    const active = document.activeElement;
    const isTyping = target instanceof Element &&
      (target.isContentEditable || target.closest('input, textarea, select, button, [contenteditable="true"]'));
    const activeIsTyping = active instanceof Element &&
      (active.isContentEditable || active.closest('input, textarea, select, button, [contenteditable="true"]'));

    if (event.code !== "Space" || event.repeat || event.isComposing ||
        event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
        document.visibilityState !== "visible" || isTyping || activeIsTyping) {
      return;
    }

    event.preventDefault();
    count(1);
  });

  load();
  buildBeads();
  render();
})();