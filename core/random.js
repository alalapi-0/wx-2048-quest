"use strict";

/**
 * 简易可复现 PRNG
 * - 字符串 seed 先转 32 位整型种子
 * - 使用 mulberry32 作为核心算法
 */
function hashStringToSeed(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createPRNG(seedString = "wx-2048-quest") {
  let seed = hashStringToSeed(String(seedString || ""));
  let rand = mulberry32(seed);
  return {
    nextFloat() {
      return rand();
    },
    reseed(newSeed) {
      seed = hashStringToSeed(String(newSeed || ""));
      rand = mulberry32(seed);
    }
  };
}
