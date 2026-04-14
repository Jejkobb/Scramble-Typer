"use strict";

const KEY_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

const ROW_OFFSETS = [0, 0.5, 1.3];
const ROUND_WORD_COUNT = 5;
const SWAPS_PER_ROUND = 1;
const MIN_RECENT_SWAP_WORDS_PER_ROUND = 3;
const SPRINT_TARGET_SWAPS = 5;
const WORD_MIN_LENGTH = 4;
const WORD_MAX_LENGTH = 11;
const SWAP_WARNING_DURATION = 1300;
const SWAP_WARNING_FADE_GAP = 220;
const SWAP_PREPARE_DURATION = 340;
const SWAP_TRAVEL_DURATION = 860;
const SWAP_SETTLE_DURATION = 320;
const SWAP_END_GAP = 120;
const SWAP_NEAR_DISTANCE = 1.8;
const SWAP_EXPANDED_DISTANCE = 2.6;
const LOCAL_WORDS_FILE = "./words_alpha.txt";

const BASE_WORD_BANK = [
  "about", "above", "adapt", "agent", "angle", "apple", "arena", "badge", "basic", "beach",
  "begin", "berry", "blink", "bloom", "board", "boost", "brain", "brave", "brick", "broad",
  "brown", "build", "cable", "camel", "candy", "carry", "chain", "chair", "charm", "chase",
  "chess", "chief", "chill", "civic", "class", "clean", "clear", "climb", "clock", "cloud",
  "coast", "color", "comic", "coral", "craft", "crane", "crazy", "cream", "crisp", "crowd",
  "dance", "debut", "delta", "dodge", "draft", "dream", "drift", "drive", "eager", "early",
  "earth", "elite", "ember", "enjoy", "equal", "error", "event", "faith", "fancy", "feast",
  "field", "flash", "fling", "flock", "focus", "force", "frame", "fresh", "frost", "fruit",
  "giant", "glide", "globe", "glory", "grace", "grain", "graph", "green", "grind", "group",
  "habit", "happy", "heart", "honey", "house", "human", "ideal", "image", "index", "inner",
  "ivory", "jelly", "joint", "judge", "knock", "known", "label", "laser", "laugh", "layer",
  "learn", "lemon", "level", "light", "limit", "logic", "lucky", "magic", "major", "maker",
  "mango", "metal", "model", "money", "moral", "motor", "music", "noble", "noise", "north",
  "ocean", "offer", "orbit", "order", "other", "paint", "panel", "party", "peace", "phase",
  "phone", "piano", "pilot", "pitch", "plain", "plant", "point", "power", "prime", "prize",
  "quest", "quick", "quiet", "radio", "raise", "range", "rapid", "reach", "relax", "rhyme",
  "river", "robot", "rough", "round", "royal", "scale", "scene", "scope", "serve", "shade",
  "shift", "shine", "skill", "smart", "smile", "solid", "sound", "spark", "speed", "spice",
  "sport", "stack", "stage", "start", "steel", "storm", "style", "sugar", "sunny", "sweet",
  "table", "taste", "teach", "thick", "thing", "throw", "tiger", "title", "today", "token",
  "topic", "touch", "tower", "trace", "track", "trade", "train", "trend", "trust", "twice",
  "unity", "upper", "urban", "value", "video", "vivid", "vocal", "voice", "water", "wheel",
  "where", "white", "whole", "world", "young", "zebra",
];

const EXTRA_WORD_BANK = [
  "atom", "beam", "clay", "drum", "echo", "fern", "glow", "hike", "jolt", "kite", "lava", "mint",
  "navy", "opal", "palm", "quiz", "reef", "silk", "trip", "unit", "vast", "wave", "yarn", "zone",
  "admire", "anchor", "breeze", "camera", "castle", "charge", "double", "effort", "flight", "garden",
  "honest", "island", "jungle", "kitten", "legend", "market", "nature", "option", "planet", "quartz",
  "rocket", "silver", "thrive", "update", "vacuum", "window", "zephyr",
  "balance", "captain", "diamond", "episode", "freedom", "gallery", "harvest", "journey", "kingdom",
  "library", "morning", "network", "outlook", "present", "quarter", "respect", "science", "temples",
  "unified", "victory", "whisper", "yearing",
  "abstract", "baseline", "corridor", "daylight", "elephant", "festival", "generate", "headline",
  "interest", "junction", "landmark", "magnetic", "notebook", "optimize", "protocol", "question",
  "reliable", "solution", "together", "ultimate", "validate", "workshop",
  "adventure", "butterfly", "character", "direction", "explainer", "framework", "heartbeat", "keyboard",
  "landscape", "magnitude", "navigator", "pineapple", "starlight", "treasured", "wildcards",
  "backspace", "blueprint", "checklist", "developer", "fireworks", "goldenhour", "lighthouse",
  "paperclips", "playground", "scrambler", "storybook", "typewriter",
  "autopilots", "bookmarks", "earthbound", "flashcards", "groundwork", "newsworthy", "riversides",
  "sunflower", "underlined", "viewpoints",
  "afterglows", "backgrounds", "brainstorms", "friendships", "masterpiece", "northbounder",
  "soundtracks",
];

const FALLBACK_WORD_BANK = sanitizeWords([...BASE_WORD_BANK, ...EXTRA_WORD_BANK]);

const ALPHABET = KEY_ROWS.flat();
const SLOT_LAYOUT = buildSlotLayout();

let wordBank = [...FALLBACK_WORD_BANK];
let wordsByLength = buildWordsByLength(wordBank);
let availableLengths = Object.keys(wordsByLength).map((len) => Number(len)).sort((a, b) => a - b);

const keyboardStage = document.getElementById("keyboardStage");
const swapBeam = document.getElementById("swapBeam");
const swapToast = document.getElementById("swapToast");
const swapOverlay = document.getElementById("swapOverlay");
const overlayKeyA = document.getElementById("overlayKeyA");
const overlayKeyB = document.getElementById("overlayKeyB");
const wordDisplay = document.getElementById("wordDisplay");
const roundStat = document.getElementById("roundStat");
const wordStat = document.getElementById("wordStat");
const progressLabel = document.getElementById("progressLabel");
const progressStat = document.getElementById("progressStat");
const mistakeStat = document.getElementById("mistakeStat");
const timeStat = document.getElementById("timeStat");
const statusLine = document.getElementById("statusLine");
const roundProgress = document.getElementById("roundProgress");
const totalWords = document.getElementById("totalWords");
const restartBtn = document.getElementById("restartBtn");
const sharePanel = document.getElementById("sharePanel");
const resultSummary = document.getElementById("resultSummary");
const shareText = document.getElementById("shareText");
const copyScoreBtn = document.getElementById("copyScoreBtn");
const nativeShareBtn = document.getElementById("nativeShareBtn");
const copyStatus = document.getElementById("copyStatus");

const tokens = [];
const slotIndex = new Map();

const state = {
  round: 1,
  words: [],
  wordIndex: 0,
  typedIndex: 0,
  totalWords: 0,
  swapCount: 0,
  mistakes: 0,
  mode: "playing",
  toastTimer: null,
  errorTimer: null,
  timerInterval: null,
  timerStarted: false,
  timerStartMs: 0,
  elapsedMs: 0,
  swappedLetters: new Set(),
  recentSwapLetters: new Set(),
  hintToken: null,
  dictionarySource: "fallback",
  dictionaryWords: wordBank.length,
};

createKeyboard();
bindEvents();
startNewGame();
void loadLocalWordBank();

function buildSlotLayout() {
  const layout = {};
  for (let rowIndex = 0; rowIndex < KEY_ROWS.length; rowIndex += 1) {
    const row = KEY_ROWS[rowIndex];
    for (let col = 0; col < row.length; col += 1) {
      const letter = row[col];
      layout[letter] = {
        x: ROW_OFFSETS[rowIndex] + col,
        y: rowIndex,
      };
    }
  }
  return layout;
}

function createKeyboard() {
  for (const letter of ALPHABET) {
    const token = {
      letter,
      slot: letter,
      el: document.createElement("div"),
      button: document.createElement("button"),
      pressTimer: null,
    };

    token.el.className = "key-token no-transition";
    token.button.className = "keycap";
    token.button.type = "button";
    token.button.textContent = letter;
    token.button.setAttribute("aria-label", `Type ${letter}`);
    token.button.addEventListener("click", () => {
      if (state.mode !== "playing") {
        return;
      }
      activateToken(token);
      processTypedLetter(token.letter);
    });

    token.el.appendChild(token.button);
    keyboardStage.appendChild(token.el);
    tokens.push(token);
    placeToken(token, false);
  }

  rebuildSlotIndex();
}

function bindEvents() {
  document.addEventListener("keydown", onKeyDown);
  restartBtn.addEventListener("click", startNewGame);
  copyScoreBtn.addEventListener("click", copyShareScore);
  nativeShareBtn.addEventListener("click", shareScoreNatively);
  if (navigator.share) {
    nativeShareBtn.classList.remove("hidden");
  }
}

function onKeyDown(event) {
  if (state.mode !== "playing") {
    return;
  }
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }
  const pressed = event.key.toUpperCase();
  if (!/^[A-Z]$/.test(pressed)) {
    return;
  }

  event.preventDefault();
  const token = slotIndex.get(pressed);
  if (!token) {
    return;
  }
  activateToken(token);
  processTypedLetter(token.letter);
}

function activateToken(token) {
  token.el.classList.add("is-pressed");
  clearTimeout(token.pressTimer);
  token.pressTimer = setTimeout(() => {
    token.el.classList.remove("is-pressed");
  }, 130);
}

function processTypedLetter(letter) {
  if (state.mode !== "playing") {
    return;
  }

  startTimerIfNeeded();

  const word = getCurrentWord();
  if (!word) {
    return;
  }

  const expected = word[state.typedIndex];
  if (letter !== expected) {
    state.mistakes += 1;
    updateStats();
    pulseWordError();
    return;
  }

  state.typedIndex += 1;
  renderWord();
  if (state.typedIndex === word.length) {
    void completeWord();
  }
}

function pulseWordError() {
  wordDisplay.classList.remove("is-error");
  void wordDisplay.offsetWidth;
  wordDisplay.classList.add("is-error");
  clearTimeout(state.errorTimer);
  state.errorTimer = setTimeout(() => {
    wordDisplay.classList.remove("is-error");
  }, 260);
}

async function completeWord() {
  if (state.mode !== "playing") {
    return;
  }

  state.totalWords += 1;
  clearWordFeedback();
  wordDisplay.classList.remove("is-complete");
  void wordDisplay.offsetWidth;
  wordDisplay.classList.add("is-complete");
  await wait(210);
  wordDisplay.classList.remove("is-complete");

  if (state.wordIndex < ROUND_WORD_COUNT - 1) {
    state.wordIndex += 1;
    state.typedIndex = 0;
    renderWord();
    updateStats();
    setStatus("Nice rhythm. Keep going.");
    return;
  }

  await runScramblePhase();
}

async function runScramblePhase() {
  state.mode = "scrambling";
  clearHintKey();
  updateStats();
  const roundRecentSwapLetters = new Set();

  if (state.swapCount >= SPRINT_TARGET_SWAPS) {
    finishGame();
    return;
  }

  const remainingForGoal = SPRINT_TARGET_SWAPS - state.swapCount;
  const swapsThisRound = Math.max(0, Math.min(SWAPS_PER_ROUND, remainingForGoal));
  if (swapsThisRound === 0) {
    finishGame();
    return;
  }

  setStatus(`Round clear. Scrambling ${swapsThisRound} pair${swapsThisRound === 1 ? "" : "s"} (${remainingForGoal} swap${remainingForGoal === 1 ? "" : "s"} left).`);

  for (let step = 1; step <= swapsThisRound; step += 1) {
    const pair = pickProgressSwapPair();
    if (!pair) {
      break;
    }
    await animateSwap(pair[0], pair[1], roundRecentSwapLetters);
    state.swapCount += 1;
    updateStats();
  }

  if (state.swapCount >= SPRINT_TARGET_SWAPS) {
    finishGame();
    return;
  }

  state.round += 1;
  state.recentSwapLetters = roundRecentSwapLetters;
  state.words = pickRoundWords(ROUND_WORD_COUNT, state.recentSwapLetters);
  state.wordIndex = 0;
  state.typedIndex = 0;
  state.mode = "playing";

  renderWord();
  updateStats();
  setStatus(`Round ${state.round} started. Reach ${SPRINT_TARGET_SWAPS} total swaps as fast as possible.`);
}

async function animateSwap(slotA, slotB, roundRecentSwapLetters = null) {
  const tokenA = slotIndex.get(slotA);
  const tokenB = slotIndex.get(slotB);
  if (!tokenA || !tokenB || tokenA === tokenB) {
    return;
  }

  state.swappedLetters.add(tokenA.letter);
  state.swappedLetters.add(tokenB.letter);
  if (roundRecentSwapLetters) {
    roundRecentSwapLetters.add(tokenA.letter);
    roundRecentSwapLetters.add(tokenB.letter);
  }

  tokenA.el.classList.add("is-swap-target");
  tokenB.el.classList.add("is-swap-target");
  await showSwapOverlay(tokenA.letter, tokenB.letter);
  showSwapToast(`Swap ${tokenA.letter} <-> ${tokenB.letter}`);
  showSwapBeam(tokenA, tokenB);
  await wait(SWAP_PREPARE_DURATION);

  const oldSlotA = tokenA.slot;
  tokenA.slot = tokenB.slot;
  tokenB.slot = oldSlotA;

  placeToken(tokenA, true);
  placeToken(tokenB, true);
  rebuildSlotIndex();

  await wait(SWAP_TRAVEL_DURATION);
  tokenA.el.classList.add("settle");
  tokenB.el.classList.add("settle");
  await wait(SWAP_SETTLE_DURATION);

  tokenA.el.classList.remove("settle", "is-swap-target");
  tokenB.el.classList.remove("settle", "is-swap-target");
  hideSwapBeam();
  await wait(SWAP_END_GAP);
}

function showSwapBeam(tokenA, tokenB) {
  const a = getTokenCenterPx(tokenA);
  const b = getTokenCenterPx(tokenB);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);

  swapBeam.style.left = `${a.x}px`;
  swapBeam.style.top = `${a.y}px`;
  swapBeam.style.width = `${Math.max(1, length)}px`;
  swapBeam.style.transform = `rotate(${angle}rad)`;
  swapBeam.classList.add("active");
}

function hideSwapBeam() {
  swapBeam.classList.remove("active");
}

function getTokenCenterPx(token) {
  const stageRect = keyboardStage.getBoundingClientRect();
  const tokenRect = token.el.getBoundingClientRect();
  return {
    x: (tokenRect.left - stageRect.left) + (tokenRect.width / 2),
    y: (tokenRect.top - stageRect.top) + (tokenRect.height / 2),
  };
}

function pickProgressSwapPair() {
  const fixed = getFixedSlots();
  if (fixed.length === 0) {
    return null;
  }

  const displaced = ALPHABET.filter((slot) => slotIndex.get(slot).letter !== slot);

  const nearFixedPair = pickNearbyPair(fixed, fixed, SWAP_NEAR_DISTANCE, true);
  if (nearFixedPair) {
    return nearFixedPair;
  }

  const nearFixedToDisplaced = pickNearbyPair(fixed, displaced, SWAP_NEAR_DISTANCE, false);
  if (nearFixedToDisplaced) {
    return nearFixedToDisplaced;
  }

  const expandedFixedPair = pickNearbyPair(fixed, fixed, SWAP_EXPANDED_DISTANCE, true);
  if (expandedFixedPair) {
    return expandedFixedPair;
  }

  const expandedFixedToDisplaced = pickNearbyPair(fixed, displaced, SWAP_EXPANDED_DISTANCE, false);
  if (expandedFixedToDisplaced) {
    return expandedFixedToDisplaced;
  }

  // Last-resort nearest fixed -> displaced swap to prevent deadlock.
  return pickNearestFixedToDisplaced(fixed, displaced);
}

function getFixedSlots() {
  const fixed = [];
  for (const slot of ALPHABET) {
    const token = slotIndex.get(slot);
    if (token && token.letter === slot) {
      fixed.push(slot);
    }
  }
  return fixed;
}

function pickNearbyPair(leftSlots, rightSlots, maxDistance, uniquePair) {
  const candidates = [];

  for (const left of leftSlots) {
    for (const right of rightSlots) {
      if (left === right) {
        continue;
      }
      if (uniquePair && left > right) {
        continue;
      }

      const distance = getSlotDistance(left, right);
      if (distance <= maxDistance) {
        candidates.push({ left, right, distance });
      }
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  // Prefer physically closer swaps for a clearer, local scrambling feel.
  const weighted = [];
  for (const candidate of candidates) {
    const weight = 1 / (candidate.distance + 0.2);
    weighted.push({ ...candidate, weight });
  }

  const chosen = weightedRandomByWeight(weighted);
  return [chosen.left, chosen.right];
}

function pickNearestFixedToDisplaced(fixed, displaced) {
  if (fixed.length === 0) {
    return null;
  }

  if (displaced.length === 0) {
    const shuffled = shuffle([...fixed]);
    return shuffled.length >= 2 ? [shuffled[0], shuffled[1]] : null;
  }

  let bestPair = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const home of fixed) {
    for (const target of displaced) {
      if (home === target) {
        continue;
      }
      const distance = getSlotDistance(home, target);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestPair = [home, target];
      }
    }
  }
  return bestPair;
}

function getSlotDistance(slotA, slotB) {
  const a = SLOT_LAYOUT[slotA];
  const b = SLOT_LAYOUT[slotB];
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function placeToken(token, animate) {
  if (!animate) {
    token.el.classList.add("no-transition");
  } else {
    token.el.classList.remove("no-transition");
  }

  const position = SLOT_LAYOUT[token.slot];
  token.el.style.setProperty("--x", String(position.x));
  token.el.style.setProperty("--y", String(position.y));

  if (!animate) {
    requestAnimationFrame(() => {
      token.el.classList.remove("no-transition");
    });
  }
}

function rebuildSlotIndex() {
  slotIndex.clear();
  for (const token of tokens) {
    slotIndex.set(token.slot, token);
  }
}

function setStatus(message) {
  statusLine.textContent = message;
}

function showSwapToast(message) {
  swapToast.textContent = message;
  swapToast.classList.remove("show");
  void swapToast.offsetWidth;
  swapToast.classList.add("show");

  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => {
    swapToast.classList.remove("show");
  }, 900);
}

async function showSwapOverlay(letterA, letterB) {
  if (!swapOverlay || !overlayKeyA || !overlayKeyB) {
    return;
  }

  overlayKeyA.textContent = letterA;
  overlayKeyB.textContent = letterB;

  swapOverlay.classList.remove("show");
  void swapOverlay.offsetWidth;
  swapOverlay.classList.add("show");

  await wait(SWAP_WARNING_DURATION);
  swapOverlay.classList.remove("show");
  await wait(SWAP_WARNING_FADE_GAP);
}

function getCurrentWord() {
  return state.words[state.wordIndex] || "";
}

function renderWord() {
  const word = getCurrentWord();
  wordDisplay.innerHTML = "";

  for (let i = 0; i < word.length; i += 1) {
    const span = document.createElement("span");
    span.className = "word-letter";
    const letter = word[i];
    span.textContent = letter;

    if (state.swappedLetters.has(letter)) {
      span.classList.add("was-swapped");
    }

    if (i < state.typedIndex) {
      span.classList.add("typed");
    } else if (i === state.typedIndex && state.mode === "playing") {
      span.classList.add("current");
    }
    wordDisplay.appendChild(span);
  }

  roundProgress.textContent = `Word ${Math.min(state.wordIndex + 1, ROUND_WORD_COUNT)} / ${ROUND_WORD_COUNT}`;
  totalWords.textContent = `${state.totalWords} words complete`;
  updateNextKeyHint();
}

function updateStats() {
  roundStat.textContent = String(state.round);
  wordStat.textContent = `${Math.min(state.wordIndex + 1, ROUND_WORD_COUNT)} / ${ROUND_WORD_COUNT}`;
  progressLabel.textContent = "Swaps";
  progressStat.textContent = `${state.swapCount} / ${SPRINT_TARGET_SWAPS}`;
  timeStat.textContent = formatElapsedMs(getElapsedMs());
  mistakeStat.textContent = String(state.mistakes);
  roundProgress.textContent = `Word ${Math.min(state.wordIndex + 1, ROUND_WORD_COUNT)} / ${ROUND_WORD_COUNT}`;
  totalWords.textContent = `${state.totalWords} words complete`;
}

function pickRoundWords(count, preferredLetters = null) {
  if (availableLengths.length === 0) {
    return Array.from({ length: count }, () => "TYPE");
  }

  const poolByLength = {};
  for (const length of availableLengths) {
    poolByLength[length] = shuffle([...wordsByLength[length]]);
  }

  const used = new Set();
  const roundWords = [];
  const preferredSet = preferredLetters && preferredLetters.size > 0 ? preferredLetters : null;
  const targetPreferredCount = preferredSet
    ? Math.min(MIN_RECENT_SWAP_WORDS_PER_ROUND, count, countWordsContainingAnyLetter(wordBank, preferredSet))
    : 0;

  let preferredPicked = 0;
  while (roundWords.length < count) {
    const mustUsePreferred = preferredPicked < targetPreferredCount;
    let chosen = pickWordWithRules(poolByLength, used, preferredSet, mustUsePreferred);
    if (!chosen && mustUsePreferred) {
      chosen = pickWordWithRules(poolByLength, used, preferredSet, false);
    }
    if (!chosen) {
      break;
    }

    roundWords.push(chosen.toUpperCase());
    used.add(chosen);
    if (preferredSet && wordHasAnyLetter(chosen, preferredSet)) {
      preferredPicked += 1;
    }
  }

  while (roundWords.length < count) {
    roundWords.push("TYPE");
  }

  return roundWords;
}

function resetKeyboard() {
  hideSwapBeam();
  clearTimeout(state.toastTimer);
  clearTimeout(state.errorTimer);
  swapToast.textContent = "";
  swapToast.classList.remove("show");
  clearWordFeedback();
  swapOverlay.classList.remove("show");

  for (const token of tokens) {
    token.slot = token.letter;
    token.el.classList.remove("is-pressed", "is-swap-target", "settle", "is-next-target");
    placeToken(token, false);
  }
  state.hintToken = null;
  rebuildSlotIndex();
}

function finishGame() {
  state.mode = "finished";
  clearHintKey();
  stopTimer();
  const finalTime = formatElapsedMs(state.elapsedMs);
  setStatus(`Challenge complete: ${SPRINT_TARGET_SWAPS} swaps in ${finalTime}.`);
  showSwapToast(`Clear in ${finalTime}.`);
  showSharePanel();
  restartBtn.classList.remove("hidden");
  updateStats();
}

function startNewGame() {
  state.round = 1;
  state.words = pickRoundWords(ROUND_WORD_COUNT);
  state.wordIndex = 0;
  state.typedIndex = 0;
  state.totalWords = 0;
  state.swapCount = 0;
  state.mistakes = 0;
  state.mode = "playing";
  state.swappedLetters.clear();
  state.recentSwapLetters.clear();
  resetTimer();

  restartBtn.classList.add("hidden");
  sharePanel.classList.add("hidden");
  copyStatus.textContent = "";
  shareText.value = "";
  resultSummary.textContent = "";
  resetKeyboard();
  renderWord();
  updateStats();
  setStatus(`Finish ${SPRINT_TARGET_SWAPS} swaps as fast as possible. Source: ${state.dictionarySource}.`);
}

async function loadLocalWordBank() {
  try {
    const response = await fetch(LOCAL_WORDS_FILE, { cache: "force-cache" });
    if (!response.ok) {
      throw new Error(`Local dictionary request failed (${response.status})`);
    }

    const raw = await response.text();
    const parsed = sanitizeWords(raw.split(/\r?\n/));
    if (parsed.length < 1000) {
      throw new Error("Local dictionary returned too few usable words");
    }

    setWordBank(parsed, "local");

    if (isAtRoundStart()) {
      state.words = pickRoundWords(ROUND_WORD_COUNT);
      state.wordIndex = 0;
      state.typedIndex = 0;
      renderWord();
      updateStats();
    }

    if (state.mode === "playing") {
      setStatus(`Finish ${SPRINT_TARGET_SWAPS} swaps as fast as possible. Source: local file (${state.dictionaryWords.toLocaleString()} words).`);
    }
  } catch (_error) {
    setWordBank(FALLBACK_WORD_BANK, "fallback");
  }
}

function setWordBank(words, source) {
  wordBank = words;
  wordsByLength = buildWordsByLength(wordBank);
  availableLengths = Object.keys(wordsByLength).map((len) => Number(len)).sort((a, b) => a - b);
  state.dictionarySource = source;
  state.dictionaryWords = wordBank.length;
}

function isAtRoundStart() {
  return state.mode === "playing"
    && state.round === 1
    && state.totalWords === 0
    && state.wordIndex === 0
    && state.typedIndex === 0;
}

function clearWordFeedback() {
  wordDisplay.classList.remove("is-error");
  wordDisplay.classList.remove("is-complete");
}

function startTimerIfNeeded() {
  if (state.timerStarted || state.mode !== "playing") {
    return;
  }
  state.timerStarted = true;
  state.timerStartMs = performance.now();
  state.timerInterval = setInterval(() => {
    timeStat.textContent = formatElapsedMs(getElapsedMs());
  }, 100);
}

function stopTimer() {
  if (state.timerStarted) {
    state.elapsedMs = getElapsedMs();
  }
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
  state.timerStarted = false;
  timeStat.textContent = formatElapsedMs(state.elapsedMs);
}

function resetTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
  state.timerStarted = false;
  state.timerStartMs = 0;
  state.elapsedMs = 0;
  timeStat.textContent = formatElapsedMs(0);
}

function getElapsedMs() {
  if (state.timerStarted) {
    return Math.max(0, performance.now() - state.timerStartMs);
  }
  return Math.max(0, state.elapsedMs);
}

function formatElapsedMs(ms) {
  const safe = Math.max(0, ms);
  const totalSeconds = Math.floor(safe / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((safe % 1000) / 100);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${tenths}`;
}

function showSharePanel() {
  const finalTime = formatElapsedMs(state.elapsedMs);
  const link = window.location.href;
  const message = `I finished Scramble Typer 5-Swap Challenge in ${finalTime} with ${state.mistakes} mistake${state.mistakes === 1 ? "" : "s"}. Can you beat me? ${link}`;
  resultSummary.textContent = `Final time: ${finalTime}. Mistakes: ${state.mistakes}.`;
  shareText.value = message;
  sharePanel.classList.remove("hidden");
}

async function copyShareScore() {
  const text = shareText.value.trim();
  if (!text) {
    return;
  }

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      shareText.focus();
      shareText.select();
      document.execCommand("copy");
    }
    copyStatus.textContent = "Score copied to clipboard.";
  } catch (_error) {
    copyStatus.textContent = "Could not copy automatically. You can copy the text manually.";
  }
}

async function shareScoreNatively() {
  if (!navigator.share || !shareText.value.trim()) {
    return;
  }

  try {
    await navigator.share({
      title: "Scramble Typer Score",
      text: shareText.value,
      url: window.location.href,
    });
  } catch (_error) {
    // User cancellation is a normal outcome.
  }
}

function updateNextKeyHint() {
  clearHintKey();

  if (state.mode !== "playing") {
    return;
  }

  const word = getCurrentWord();
  if (!word || state.typedIndex >= word.length) {
    return;
  }

  const neededLetter = word[state.typedIndex];
  const token = getTokenByLetter(neededLetter);
  if (!token) {
    return;
  }

  token.el.classList.add("is-next-target");
  state.hintToken = token;
}

function clearHintKey() {
  if (!state.hintToken) {
    return;
  }
  state.hintToken.el.classList.remove("is-next-target");
  state.hintToken = null;
}

function getTokenByLetter(letter) {
  for (const token of tokens) {
    if (token.letter === letter) {
      return token;
    }
  }
  return null;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function buildWordsByLength(words) {
  const groups = {};
  for (const word of words) {
    if (!groups[word.length]) {
      groups[word.length] = [];
    }
    groups[word.length].push(word);
  }
  return groups;
}

function sanitizeWords(words) {
  return [...new Set(words)]
    .map((word) => word.trim().toLowerCase())
    .filter((word) => /^[a-z]+$/.test(word) && word.length >= WORD_MIN_LENGTH && word.length <= WORD_MAX_LENGTH);
}

function pickWordWithRules(poolByLength, used, preferredSet, mustUsePreferred) {
  const lengthOrder = shuffle([...availableLengths]);
  for (const length of lengthOrder) {
    const pool = poolByLength[length];
    for (const word of pool) {
      if (used.has(word)) {
        continue;
      }
      if (mustUsePreferred && preferredSet && !wordHasAnyLetter(word, preferredSet)) {
        continue;
      }
      return word;
    }
  }
  return null;
}

function countWordsContainingAnyLetter(words, letters) {
  let count = 0;
  for (const word of words) {
    if (wordHasAnyLetter(word, letters)) {
      count += 1;
    }
  }
  return count;
}

function wordHasAnyLetter(word, letters) {
  for (const letter of letters) {
    if (word.includes(letter.toLowerCase())) {
      return true;
    }
  }
  return false;
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function weightedRandomByWeight(items) {
  let total = 0;
  for (const item of items) {
    total += item.weight;
  }

  let roll = Math.random() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) {
      return item;
    }
  }

  return items[items.length - 1];
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
