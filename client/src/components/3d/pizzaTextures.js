import * as THREE from 'three';

const textureCache = new Map();

const rand = (seed) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * Canvas-baked food textures (cached). No external assets.
 */
export const getPizzaTextures = () => {
  if (textureCache.has('bundle')) return textureCache.get('bundle');

  const bundle = {
    crustMap: makeCrustMap(768),
    crustNormal: makeNoiseNormal(512, 0.72),
    sauceMap: makeSauceMap(640),
    sauceNormal: makeNoiseNormal(384, 0.4),
    cheeseMap: makeCheeseMap(768),
    cheeseRough: makeCheeseRoughness(384),
    cheeseNormal: makeNoiseNormal(384, 0.35),
  };
  textureCache.set('bundle', bundle);
  return bundle;
};

function finishMap(canvas, { repeat = 1, colorSpace = true } = {}) {
  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(repeat, repeat);
  map.anisotropy = 8;
  map.needsUpdate = true;
  if (colorSpace && 'colorSpace' in map) {
    map.colorSpace = THREE.SRGBColorSpace;
  }
  return map;
}

function makeCrustMap(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.05,
    size / 2,
    size / 2,
    size * 0.55,
  );
  grad.addColorStop(0, '#f0c98a');
  grad.addColorStop(0.35, '#e0a65f');
  grad.addColorStop(0.62, '#c98445');
  grad.addColorStop(0.82, '#a86530');
  grad.addColorStop(1, '#6e3d1c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Flour / crumb grain
  for (let i = 0; i < 1400; i += 1) {
    const x = rand(i * 3.1) * size;
    const y = rand(i * 7.7) * size;
    const r = 0.5 + rand(i * 1.9) * 3.2;
    const shade = 100 + Math.floor(rand(i * 4.2) * 110);
    ctx.fillStyle = `rgba(${shade}, ${Math.floor(shade * 0.62)}, ${Math.floor(shade * 0.28)}, ${0.06 + rand(i) * 0.16})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Oven blister / leopard
  for (let i = 0; i < 110; i += 1) {
    const a = rand(i * 9.2) * Math.PI * 2;
    const rad = size * (0.34 + rand(i * 2.4) * 0.16);
    const x = size / 2 + Math.cos(a) * rad;
    const y = size / 2 + Math.sin(a) * rad;
    ctx.fillStyle = `rgba(${40 + rand(i) * 50}, ${18 + rand(i * 2) * 20}, ${8 + rand(i * 3) * 12}, ${0.12 + rand(i * 1.1) * 0.4})`;
    ctx.beginPath();
    ctx.ellipse(
      x,
      y,
      2 + rand(i) * 8,
      1 + rand(i * 3) * 5,
      a,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  // Soft flour dust near center
  for (let i = 0; i < 80; i += 1) {
    const x = size * (0.3 + rand(i * 2.2) * 0.4);
    const y = size * (0.3 + rand(i * 5.1) * 0.4);
    ctx.fillStyle = `rgba(255, 245, 220, ${0.04 + rand(i) * 0.08})`;
    ctx.beginPath();
    ctx.arc(x, y, 4 + rand(i) * 14, 0, Math.PI * 2);
    ctx.fill();
  }

  return finishMap(canvas);
}

function makeSauceMap(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createRadialGradient(
    size * 0.42,
    size * 0.46,
    size * 0.04,
    size / 2,
    size / 2,
    size * 0.48,
  );
  grad.addColorStop(0, '#e24a30');
  grad.addColorStop(0.4, '#c2301c');
  grad.addColorStop(0.75, '#9a1c12');
  grad.addColorStop(1, '#6e120c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 180; i += 1) {
    const x = rand(i * 2.2) * size;
    const y = rand(i * 5.5) * size;
    ctx.fillStyle = `rgba(${120 + rand(i) * 100}, ${12 + rand(i * 2) * 45}, ${8 + rand(i * 3) * 25}, ${0.07 + rand(i * 4) * 0.22})`;
    ctx.beginPath();
    ctx.ellipse(
      x,
      y,
      6 + rand(i) * 32,
      5 + rand(i * 2) * 22,
      rand(i) * Math.PI,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  // Herb flecks
  for (let i = 0; i < 60; i += 1) {
    ctx.fillStyle = `rgba(${30 + rand(i) * 40}, ${90 + rand(i * 2) * 60}, ${20 + rand(i * 3) * 30}, ${0.15 + rand(i) * 0.25})`;
    ctx.fillRect(rand(i * 6) * size, rand(i * 7) * size, 1 + rand(i) * 2, 2 + rand(i * 2) * 4);
  }

  return finishMap(canvas);
}

function makeCheeseMap(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createRadialGradient(
    size * 0.4,
    size * 0.38,
    size * 0.04,
    size / 2,
    size / 2,
    size * 0.52,
  );
  grad.addColorStop(0, '#fffaf0');
  grad.addColorStop(0.28, '#ffe9b8');
  grad.addColorStop(0.55, '#f6d48a');
  grad.addColorStop(0.8, '#e8bc62');
  grad.addColorStop(1, '#d4a04a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Melt stretch strands
  for (let i = 0; i < 220; i += 1) {
    const x = rand(i * 1.7) * size;
    const y = rand(i * 4.1) * size;
    ctx.strokeStyle = `rgba(255, 252, 240, ${0.07 + rand(i) * 0.22})`;
    ctx.lineWidth = 1 + rand(i * 2) * 4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(
      x + (rand(i * 3) - 0.5) * 50,
      y + (rand(i * 4) - 0.5) * 50,
      x + (rand(i * 5) - 0.5) * 80,
      y + (rand(i * 6) - 0.5) * 60,
    );
    ctx.stroke();
  }

  // Oil pools / browned spots
  for (let i = 0; i < 70; i += 1) {
    const x = rand(i * 8.1) * size;
    const y = rand(i * 3.3) * size;
    ctx.fillStyle = `rgba(${200 + rand(i) * 40}, ${140 + rand(i * 2) * 50}, ${40 + rand(i * 3) * 40}, ${0.08 + rand(i) * 0.2})`;
    ctx.beginPath();
    ctx.arc(x, y, 3 + rand(i) * 12, 0, Math.PI * 2);
    ctx.fill();
  }

  return finishMap(canvas);
}

function makeCheeseRoughness(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#6a6a6a';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 600; i += 1) {
    const v = Math.floor(70 + rand(i) * 140);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.beginPath();
    ctx.arc(rand(i * 2) * size, rand(i * 3) * size, 1 + rand(i) * 4, 0, Math.PI * 2);
    ctx.fill();
  }
  return finishMap(canvas, { colorSpace: false });
}

function makeNoiseNormal(size, strength = 0.5) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = (y * size + x) * 4;
      const n = rand(x * 0.17 + y * 0.31);
      const nx = Math.floor(128 + (n - 0.5) * 255 * strength);
      const ny = Math.floor(
        128 + (rand(x * 0.41 + y * 0.13) - 0.5) * 255 * strength,
      );
      img.data[i] = nx;
      img.data[i + 1] = ny;
      img.data[i + 2] = 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return finishMap(canvas, { colorSpace: false });
}
