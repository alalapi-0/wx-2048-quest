import { createGame, DIRECTIONS } from "../core/game.js";

let game = null;

const $preset = document.getElementById("preset");
const $seed = document.getElementById("seed");
const $apply = document.getElementById("apply");
const $grid = document.getElementById("grid");
const $status = document.getElementById("status");
const $log = document.getElementById("log");
const $meta = document.getElementById("meta");

const $btnUp = document.getElementById("up");
const $btnLeft = document.getElementById("left");
const $btnRight = document.getElementById("right");
const $btnDown = document.getElementById("down");
const $btnRestart = document.getElementById("restart");

function presetConfig(key, seed) {
  if (key === "L1") {
    return { gridSize: 2, startTiles: 2, spawnValues: [2], target: 16, seed };
  }
  if (key === "L2") {
    return { gridSize: 3, startTiles: 2, spawnValues: [2, 4], target: 64, seed };
  }
  return { gridSize: 4, startTiles: 2, spawnValues: [2, 4], target: 2048, seed };
}

function initGame() {
  const cfg = presetConfig($preset.value, $seed.value.trim());
  game = createGame(cfg);
  renderAll();
  log(`重开: ${JSON.stringify({ gridSize: cfg.gridSize, spawnValues: cfg.spawnValues, target: cfg.target, seed: cfg.seed })}`);
}

function renderAll() {
  const s = game.getSnapshot();
  $grid.style.gridTemplateColumns = `repeat(${s.grid.length}, 64px)`;
  $grid.innerHTML = "";
  for (const row of s.grid) {
    for (const v of row) {
      const d = document.createElement("div");
      d.className = "cell";
      d.textContent = v === 0 ? "" : String(v);
      d.style.background = v === 0 ? "#eee" : tone(v);
      d.style.color = v <= 4 ? "#333" : "#fff";
      $grid.appendChild(d);
    }
  }
  $status.textContent = `score=${s.score} moves=${s.moves} won=${s.won} over=${s.over}`;
  $meta.textContent = `grid=${s.grid.length}×${s.grid.length}`;
}

function tone(v) {
  const map = {
    2: "#e9edf5",
    4: "#c8d5f0",
    8: "#9cb7ea",
    16: "#6d98e0",
    32: "#4a7ed6",
    64: "#2f66c9",
    128: "#1f54b7",
    256: "#1847a0",
    512: "#133c89",
    1024: "#0d2f6e",
    2048: "#0a275e"
  };
  return map[v] || "#0a275e";
}

function doMove(dir) {
  const r = game.move(dir);
  if (r.moved) {
    log(`move ${dir} merged=${r.merged} +${r.scoreDelta}`);
  } else {
    log(`move ${dir} no-op`);
  }
  renderAll();
}

function log(msg) {
  const time = new Date().toLocaleTimeString();
  $log.textContent = `[${time}] ${msg}\n` + $log.textContent;
}

$apply.addEventListener("click", () => initGame());
$btnRestart.addEventListener("click", () => initGame());
$btnUp.addEventListener("click", () => doMove(DIRECTIONS.UP));
$btnLeft.addEventListener("click", () => doMove(DIRECTIONS.LEFT));
$btnRight.addEventListener("click", () => doMove(DIRECTIONS.RIGHT));
$btnDown.addEventListener("click", () => doMove(DIRECTIONS.DOWN));

window.addEventListener("keydown", e => {
  if (e.key === "ArrowUp") doMove(DIRECTIONS.UP);
  if (e.key === "ArrowLeft") doMove(DIRECTIONS.LEFT);
  if (e.key === "ArrowRight") doMove(DIRECTIONS.RIGHT);
  if (e.key === "ArrowDown") doMove(DIRECTIONS.DOWN);
});

initGame();
