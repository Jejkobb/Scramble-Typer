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
const TARGET_SWAPS = 5;
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
const COPY_FEEDBACK_DURATION = 1800;
const LOCAL_WORDS_FILE = "./words_alpha.txt";
const SWAP_COLOR_PALETTE = [
  { solid: "#54d2a0", soft: "rgba(84, 210, 160, 0.24)" },
  { solid: "#6ecbff", soft: "rgba(110, 203, 255, 0.24)" },
  { solid: "#89f0a8", soft: "rgba(137, 240, 168, 0.24)" },
  { solid: "#ffd166", soft: "rgba(255, 209, 102, 0.24)" },
  { solid: "#c59bff", soft: "rgba(197, 155, 255, 0.24)" },
];

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

const pregameView = document.getElementById("pregameView");
const pregameSource = document.getElementById("pregameSource");
const readyBtn = document.getElementById("readyBtn");

const gameView = document.getElementById("gameView");
const roundStat = document.getElementById("roundStat");
const wordStat = document.getElementById("wordStat");
const progressStat = document.getElementById("progressStat");
const mistakeStat = document.getElementById("mistakeStat");
const timeStat = document.getElementById("timeStat");
const statusLine = document.getElementById("statusLine");
const swapLegend = document.getElementById("swapLegend");
const roundProgress = document.getElementById("roundProgress");
const totalWords = document.getElementById("totalWords");
const wordDisplay = document.getElementById("wordDisplay");

const keyboardStage = document.getElementById("keyboardStage");
const swapBeam = document.getElementById("swapBeam");
const swapToast = document.getElementById("swapToast");
const swapOverlay = document.getElementById("swapOverlay");
const overlayKeyA = document.getElementById("overlayKeyA");
const overlayKeyB = document.getElementById("overlayKeyB");

const finishModal = document.getElementById("finishModal");
const finishSummary = document.getElementById("finishSummary");
const finishTime = document.getElementById("finishTime");
const finishMistakes = document.getElementById("finishMistakes");
const finishWords = document.getElementById("finishWords");
const copyScoreBtn = document.getElementById("copyScoreBtn");
const playAgainBtn = document.getElementById("playAgainBtn");

const tokens = [];
const slotIndex = new Map();

const state = {
  phase: "pregame", // pregame | playing | scrambling | finished
  round: 1,
  words: [],
  wordIndex: 0,
  typedIndex: 0,
  totalWords: 0,
  swapCount: 0,
  finalRoundActive: false,
  mistakes: 0,
  toastTimer: null,
  errorTimer: null,
  timerInterval: null,
  timerStarted: false,
  timerStartMs: 0,
  elapsedMs: 0,
  swappedLetters: new Set(),
  recentSwapLetters: new Set(),
  swapColorByLetter: new Map(),
  swapHistory: [],
  hintToken: null,
  dictionarySource: "fallback",
  dictionaryWords: wordBank.length,
  shareText: "",
  copyResetTimer: null,
};

createKeyboard();
bindEvents();
enterPregame();
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
      if (state.phase !== "playing") {
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
  readyBtn.addEventListener("click", startChallenge);
  playAgainBtn.addEventListener("click", startChallenge);
  copyScoreBtn.addEventListener("click", copyShareScore);
}

function enterPregame() {
  state.phase = "pregame";
  gameView.classList.add("hidden");
  finishModal.classList.add("hidden");
  pregameView.classList.remove("hidden");
  setPregameSourceText();
}

function startChallenge() {
  resetRunState();
  pregameView.classList.add("hidden");
  finishModal.classList.add("hidden");
  gameView.classList.remove("hidden");

  state.phase = "playing";
  state.words = pickRoundWords(ROUND_WORD_COUNT);
  state.wordIndex = 0;
  state.typedIndex = 0;

  resetKeyboard();
  renderWord();
  updateStats();
  setStatus(`Finish ${TARGET_SWAPS} swaps as fast as possible. Dictionary: ${state.dictionarySource}.`);
}

function resetRunState() {
  state.round = 1;
  state.wordIndex = 0;
  state.typedIndex = 0;
  state.totalWords = 0;
  state.swapCount = 0;
  state.finalRoundActive = false;
  state.mistakes = 0;
  state.words = [];
  state.swappedLetters.clear();
  state.recentSwapLetters.clear();
  state.swapColorByLetter.clear();
  state.swapHistory = [];
  state.shareText = "";

  clearTimeout(state.copyResetTimer);
  state.copyResetTimer = null;
  copyScoreBtn.textContent = "Share Score";
  updateSwapLegend();

  resetTimer();
}

function onKeyDown(event) {
  if (state.phase !== "playing") {
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
  if (state.phase !== "playing") {
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
  if (state.phase !== "playing") {
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

  if (state.finalRoundActive) {
    finishChallenge();
    return;
  }

  await runScramblePhase();
}

async function runScramblePhase() {
  state.phase = "scrambling";
  clearHintKey();
  updateStats();
  const roundRecentSwapLetters = new Set();

  if (state.swapCount >= TARGET_SWAPS) {
    startFinalRound(state.recentSwapLetters);
    return;
  }

  const remaining = TARGET_SWAPS - state.swapCount;
  const swapsThisRound = Math.max(0, Math.min(SWAPS_PER_ROUND, remaining));
  if (swapsThisRound === 0) {
    startFinalRound(state.recentSwapLetters);
    return;
  }

  setStatus(`Round clear. Scrambling ${swapsThisRound} pair${swapsThisRound === 1 ? "" : "s"} (${remaining} swap${remaining === 1 ? "" : "s"} left).`);

  for (let step = 1; step <= swapsThisRound; step += 1) {
    const pair = pickProgressSwapPair();
    if (!pair) {
      break;
    }
    const colorIndex = state.swapCount % SWAP_COLOR_PALETTE.length;
    await animateSwap(pair[0], pair[1], roundRecentSwapLetters, colorIndex);
    state.swapCount += 1;
    updateStats();
  }

  if (state.swapCount >= TARGET_SWAPS) {
    state.recentSwapLetters = roundRecentSwapLetters;
    startFinalRound(state.recentSwapLetters);
    return;
  }

  state.round += 1;
  state.recentSwapLetters = roundRecentSwapLetters;
  state.words = pickRoundWords(ROUND_WORD_COUNT, state.recentSwapLetters);
  state.wordIndex = 0;
  state.typedIndex = 0;
  state.phase = "playing";

  renderWord();
  updateStats();
  setStatus(`Round ${state.round} started. Reach ${TARGET_SWAPS} total swaps as fast as possible.`);
}

function finishChallenge() {
  state.phase = "finished";
  clearHintKey();
  stopTimer();

  const finalTime = formatElapsedMs(state.elapsedMs);
  setStatus(`Challenge complete: ${TARGET_SWAPS} swaps in ${finalTime}.`);
  showSwapToast(`Clear in ${finalTime}.`);

  finishTime.textContent = finalTime;
  finishMistakes.textContent = String(state.mistakes);
  finishWords.textContent = String(state.totalWords);
  finishSummary.textContent = `You completed 5 swaps in ${finalTime} with ${state.mistakes} mistake${state.mistakes === 1 ? "" : "s"}.`;

  state.shareText = buildShareText();
  copyScoreBtn.textContent = "Share Score";
  finishModal.classList.remove("hidden");
  updateStats();
}

function buildShareText() {
  const finalTime = formatElapsedMs(state.elapsedMs);
  const link = `${window.location.origin}${window.location.pathname}`;
  return `I finished Scramble Typer (5-swap challenge) in ${finalTime} with ${state.mistakes} mistake${state.mistakes === 1 ? "" : "s"}. Beat me: ${link}`;
}

async function copyShareScore() {
  if (!state.shareText) {
    return;
  }

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(state.shareText);
    } else {
      const ghost = document.createElement("textarea");
      ghost.value = state.shareText;
      document.body.appendChild(ghost);
      ghost.select();
      document.execCommand("copy");
      document.body.removeChild(ghost);
    }

    copyScoreBtn.textContent = "Copied to Clipboard";
    clearTimeout(state.copyResetTimer);
    state.copyResetTimer = setTimeout(() => {
      copyScoreBtn.textContent = "Share Score";
    }, COPY_FEEDBACK_DURATION);
  } catch (_error) {
    copyScoreBtn.textContent = "Copy Failed";
  }
}

async function animateSwap(slotA, slotB, roundRecentSwapLetters = null, colorIndex = 0) {
  const tokenA = slotIndex.get(slotA);
  const tokenB = slotIndex.get(slotB);
  if (!tokenA || !tokenB || tokenA === tokenB) {
    return;
  }

  state.swappedLetters.add(tokenA.letter);
  state.swappedLetters.add(tokenB.letter);
  applySwapMemory(tokenA.letter, tokenB.letter, colorIndex);
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

    if (state.swapColorByLetter.has(letter)) {
      const color = getSwapColor(state.swapColorByLetter.get(letter));
      span.style.setProperty("--swap-color", color.solid);
      span.style.setProperty("--swap-color-soft", color.soft);
      span.classList.add("was-swapped");
    }

    if (i < state.typedIndex) {
      span.classList.add("typed");
    } else if (i === state.typedIndex && state.phase === "playing") {
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
  progressStat.textContent = `${state.swapCount} / ${TARGET_SWAPS}`;
  mistakeStat.textContent = String(state.mistakes);
  timeStat.textContent = formatElapsedMs(getElapsedMs());
  roundProgress.textContent = `Word ${Math.min(state.wordIndex + 1, ROUND_WORD_COUNT)} / ${ROUND_WORD_COUNT}`;
  totalWords.textContent = `${state.totalWords} words complete`;
}

function startFinalRound(preferredLetters) {
  state.finalRoundActive = true;
  state.round += 1;
  state.words = pickRoundWords(ROUND_WORD_COUNT, preferredLetters);
  state.wordIndex = 0;
  state.typedIndex = 0;
  state.phase = "playing";
  renderWord();
  updateStats();
  setStatus("Final round. Complete 5 words with all swaps active.");
}

function applySwapMemory(letterA, letterB, colorIndex) {
  state.swapColorByLetter.set(letterA, colorIndex);
  state.swapColorByLetter.set(letterB, colorIndex);
  state.swapHistory.push({
    number: state.swapCount + 1,
    pair: `${letterA}<->${letterB}`,
    colorIndex,
  });

  applyTokenColorForLetter(letterA, colorIndex);
  applyTokenColorForLetter(letterB, colorIndex);
  updateSwapLegend();
}

function applyTokenColorForLetter(letter, colorIndex) {
  const token = getTokenByLetter(letter);
  if (!token) {
    return;
  }
  const color = getSwapColor(colorIndex);
  token.el.classList.add("has-swap-color");
  token.el.style.setProperty("--swap-color", color.solid);
  token.el.style.setProperty("--swap-color-soft", color.soft);
}

function getSwapColor(index) {
  return SWAP_COLOR_PALETTE[index % SWAP_COLOR_PALETTE.length];
}

function updateSwapLegend() {
  swapLegend.innerHTML = "";
  for (const entry of state.swapHistory) {
    const pill = document.createElement("span");
    pill.className = "swap-pill";
    const color = getSwapColor(entry.colorIndex);
    pill.style.setProperty("--swap-color", color.solid);
    pill.style.setProperty("--swap-color-soft", color.soft);
    pill.textContent = `#${entry.number} ${entry.pair}`;
    swapLegend.appendChild(pill);
  }
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
    token.el.classList.remove("is-pressed", "is-swap-target", "settle", "is-next-target", "has-swap-color");
    token.el.style.removeProperty("--swap-color");
    token.el.style.removeProperty("--swap-color-soft");
    placeToken(token, false);
  }
  state.hintToken = null;
  rebuildSlotIndex();
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

    if (state.phase === "pregame") {
      setPregameSourceText();
    }

    if (isAtRoundStart()) {
      state.words = pickRoundWords(ROUND_WORD_COUNT);
      renderWord();
      updateStats();
    }

    if (state.phase === "playing") {
      setStatus(`Finish ${TARGET_SWAPS} swaps as fast as possible. Dictionary: local file (${state.dictionaryWords.toLocaleString()} words).`);
    }
  } catch (_error) {
    setWordBank(FALLBACK_WORD_BANK, "fallback");
    setPregameSourceText();
  }
}

function setWordBank(words, source) {
  wordBank = words;
  wordsByLength = buildWordsByLength(wordBank);
  availableLengths = Object.keys(wordsByLength).map((len) => Number(len)).sort((a, b) => a - b);
  state.dictionarySource = source;
  state.dictionaryWords = wordBank.length;
}

function setPregameSourceText() {
  if (state.dictionarySource === "local") {
    pregameSource.textContent = `Dictionary: local file (${state.dictionaryWords.toLocaleString()} words)`;
  } else {
    pregameSource.textContent = `Dictionary: fallback list (${state.dictionaryWords.toLocaleString()} words)`;
  }
}

function isAtRoundStart() {
  return state.phase === "playing"
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
  if (state.timerStarted || state.phase !== "playing") {
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

function updateNextKeyHint() {
  clearHintKey();

  if (state.phase !== "playing") {
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
