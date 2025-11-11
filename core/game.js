"use strict";

import { createPRNG } from "./random.js";

export const DIRECTIONS = {
  UP: "up",
  DOWN: "down",
  LEFT: "left",
  RIGHT: "right"
};

const DEFAULTS = {
  gridSize: 4,
  startTiles: 2,
  spawnValues: [2, 4],
  spawnProb: null,
  target: 2048,
  seed: "wx-2048-quest"
};

export function createGame(cfg = {}) {
  const conf = normalizeConfig(cfg);
  const rng = createPRNG(conf.seed);

  const state = {
    grid: makeGrid(conf.gridSize),
    score: 0,
    moved: false,
    won: false,
    over: false,
    moves: 0
  };

  function normalizeConfig(c) {
    const merged = { ...DEFAULTS, ...c };
    if (!(Number.isInteger(merged.gridSize) && merged.gridSize >= 2 && merged.gridSize <= 8)) {
      throw new Error("gridSize 必须是 2..8 的整数");
    }
    if (!(Number.isInteger(merged.startTiles) && merged.startTiles >= 0 && merged.startTiles <= merged.gridSize * merged.gridSize)) {
      throw new Error("startTiles 非法");
    }
    if (!Array.isArray(merged.spawnValues) || merged.spawnValues.length === 0) {
      throw new Error("spawnValues 至少包含一个数值");
    }
    if (merged.spawnProb != null) {
      if (!Array.isArray(merged.spawnProb) || merged.spawnProb.length !== merged.spawnValues.length) {
        throw new Error("spawnProb 长度需与 spawnValues 一致");
      }
      const sum = merged.spawnProb.reduce((a, b) => a + b, 0);
      if (!(sum > 0)) {
        throw new Error("spawnProb 总和需大于 0");
      }
      merged._spawnProbNorm = merged.spawnProb.map(p => p / sum);
    } else {
      const eq = 1 / merged.spawnValues.length;
      merged._spawnProbNorm = merged.spawnValues.map(() => eq);
    }
    if (!(Number.isInteger(merged.target) && merged.target >= 2)) {
      throw new Error("target 非法");
    }
    merged.seed = String(merged.seed || DEFAULTS.seed);
    return merged;
  }

  function makeGrid(n) {
    return Array.from({ length: n }, () => Array(n).fill(0));
  }

  function cloneGrid(g) {
    return g.map(row => row.slice());
  }

  function emptyCells(g) {
    const arr = [];
    for (let r = 0; r < g.length; r++) {
      for (let c = 0; c < g.length; c++) {
        if (g[r][c] === 0) arr.push([r, c]);
      }
    }
    return arr;
  }

  function randomSpawnValue() {
    const p = rng.nextFloat();
    let acc = 0;
    for (let i = 0; i < conf.spawnValues.length; i++) {
      acc += conf._spawnProbNorm[i];
      if (p <= acc) return conf.spawnValues[i];
    }
    return conf.spawnValues[conf.spawnValues.length - 1];
  }

  function spawn(n = 1) {
    if (!(Number.isInteger(n) && n >= 0)) {
      throw new Error("spawn 参数需为非负整数");
    }
    let placed = 0;
    for (let i = 0; i < n; i++) {
      const cells = emptyCells(state.grid);
      if (cells.length === 0) break;
      const idx = Math.floor(rng.nextFloat() * cells.length);
      const [r, c] = cells[idx];
      state.grid[r][c] = randomSpawnValue();
      placed++;
    }
    if (placed > 0) {
      updateWin();
      updateGameOver();
    } else if (!canMove()) {
      updateGameOver();
    }
    return placed;
  }

  function init() {
    rng.reseed(conf.seed);
    state.grid = makeGrid(conf.gridSize);
    state.score = 0;
    state.moved = false;
    state.won = false;
    state.over = false;
    state.moves = 0;
    spawn(conf.startTiles);
    updateWin();
    updateGameOver();
  }

  init();

  function rotateLeft(g) {
    const n = g.length;
    const out = makeGrid(n);
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        out[n - 1 - c][r] = g[r][c];
      }
    }
    return out;
  }

  function rotateRight(g) {
    const n = g.length;
    const out = makeGrid(n);
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        out[c][n - 1 - r] = g[r][c];
      }
    }
    return out;
  }

  function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  function slideLeftRow(row) {
    const n = row.length;
    const compact = row.filter(v => v !== 0);
    const merged = [];
    let scoreDelta = 0;
    for (let i = 0; i < compact.length; i++) {
      if (i < compact.length - 1 && compact[i] === compact[i + 1]) {
        const v = compact[i] * 2;
        merged.push(v);
        scoreDelta += v;
        i++;
      } else {
        merged.push(compact[i]);
      }
    }
    while (merged.length < n) merged.push(0);
    const moved = !arraysEqual(row, merged);
    return { row: merged, moved, scoreDelta };
  }

  function restoreOrientation(grid, dir) {
    if (dir === DIRECTIONS.UP) return rotateRight(grid);
    if (dir === DIRECTIONS.DOWN) return rotateLeft(grid);
    if (dir === DIRECTIONS.RIGHT) return grid.map(row => row.slice().reverse());
    return grid;
  }

  function normalizeForLeft(grid, dir) {
    if (dir === DIRECTIONS.UP) return rotateLeft(grid);
    if (dir === DIRECTIONS.DOWN) return rotateRight(grid);
    if (dir === DIRECTIONS.RIGHT) return grid.map(row => row.slice().reverse());
    return grid;
  }

  function move(dir) {
    if (!Object.values(DIRECTIONS).includes(dir)) {
      throw new Error(`未知方向: ${dir}`);
    }
    if (state.over) {
      return { moved: false, merged: 0, scoreDelta: 0 };
    }

    const norm = normalizeForLeft(state.grid, dir);
    let totalDelta = 0;
    let anyMoved = false;
    const processed = norm.map(row => {
      const { row: nextRow, moved, scoreDelta } = slideLeftRow(row);
      totalDelta += scoreDelta;
      if (moved) anyMoved = true;
      return nextRow;
    });

    if (!anyMoved) {
      state.moved = false;
      updateWin();
      updateGameOver();
      return { moved: false, merged: 0, scoreDelta: 0 };
    }

    const restored = restoreOrientation(processed, dir);
    state.grid = cloneGrid(restored);
    state.score += totalDelta;
    state.moves += 1;
    state.moved = true;
    const mergedValue = totalDelta;
    spawn(1);
    updateWin();
    updateGameOver();
    return { moved: true, merged: mergedValue, scoreDelta: totalDelta };
  }

  function canMove() {
    if (emptyCells(state.grid).length > 0) return true;
    const n = state.grid.length;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const v = state.grid[r][c];
        if (r + 1 < n && state.grid[r + 1][c] === v) return true;
        if (c + 1 < n && state.grid[r][c + 1] === v) return true;
      }
    }
    return false;
  }

  function updateWin() {
    const n = state.grid.length;
    let won = false;
    for (let r = 0; r < n && !won; r++) {
      for (let c = 0; c < n && !won; c++) {
        if (state.grid[r][c] >= conf.target) won = true;
      }
    }
    state.won = won;
  }

  function updateGameOver() {
    state.over = !canMove();
  }

  function getSnapshot() {
    return {
      grid: cloneGrid(state.grid),
      score: state.score,
      moved: state.moved,
      won: state.won,
      over: state.over,
      moves: state.moves
    };
  }

  function setSeed(seed) {
    const s = String(seed || "");
    conf.seed = s;
    rng.reseed(s);
  }

  function reset() {
    init();
  }

  function loadFromGrid(grid) {
    const n = conf.gridSize;
    if (!Array.isArray(grid) || grid.length !== n) {
      throw new Error("grid 尺寸不匹配");
    }
    const next = makeGrid(n);
    for (let r = 0; r < n; r++) {
      if (!Array.isArray(grid[r]) || grid[r].length !== n) {
        throw new Error("grid 行尺寸不匹配");
      }
      for (let c = 0; c < n; c++) {
        const value = Number(grid[r][c] || 0);
        next[r][c] = value > 0 ? value : 0;
      }
    }
    state.grid = next;
    state.moved = false;
    updateWin();
    updateGameOver();
  }

  return {
    state,
    config: { ...conf },
    reset,
    move,
    spawn,
    canMove,
    getSnapshot,
    setSeed,
    loadFromGrid
  };
}
