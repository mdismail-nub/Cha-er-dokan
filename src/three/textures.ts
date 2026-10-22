import * as THREE from 'three';

function finalizeColorTexture(
  canvas: HTMLCanvasElement,
  maxAnisotropy: number,
  repeatX = 1,
  repeatY = 1
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.needsUpdate = true;
  return tex;
}

export function createCorrugatedTinTexture(maxAnisotropy: number): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const width = 512;
  const height = 512;

  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = width;
  colorCanvas.height = height;
  const ctx = colorCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bCtx = bumpCanvas.getContext('2d')!;

  // Base galvanized zinc-grey with warm oxidation
  ctx.fillStyle = '#7e8487';
  ctx.fillRect(0, 0, width, height);

  const ridges = 24;
  const ridgeWidth = width / ridges;

  for (let i = 0; i < ridges; i++) {
    const x = i * ridgeWidth;
    const grad = ctx.createLinearGradient(x, 0, x + ridgeWidth, 0);
    grad.addColorStop(0.0, '#62676a');
    grad.addColorStop(0.25, '#8f969a');
    grad.addColorStop(0.5, '#a3aaae');
    grad.addColorStop(0.75, '#787e82');
    grad.addColorStop(1.0, '#62676a');
    ctx.fillStyle = grad;
    ctx.fillRect(x, 0, ridgeWidth, height);

    const bGrad = bCtx.createLinearGradient(x, 0, x + ridgeWidth, 0);
    bGrad.addColorStop(0.0, '#222222');
    bGrad.addColorStop(0.5, '#efefef');
    bGrad.addColorStop(1.0, '#222222');
    bCtx.fillStyle = bGrad;
    bCtx.fillRect(x, 0, ridgeWidth, height);
  }

  // Subtle weathered rust patches along roof seams and edges
  for (let i = 0; i < 65; i++) {
    const rx = ((i * 79) % width);
    const ry = ((i * 137) % height);
    const rRadius = 10 + (i % 28);
    const rustGrad = ctx.createRadialGradient(rx, ry, 2, rx, ry, rRadius);
    rustGrad.addColorStop(0, 'rgba(138, 72, 38, 0.34)');
    rustGrad.addColorStop(0.6, 'rgba(116, 64, 36, 0.16)');
    rustGrad.addColorStop(1, 'rgba(116, 64, 36, 0)');
    ctx.fillStyle = rustGrad;
    ctx.fillRect(rx - rRadius, ry - rRadius, rRadius * 2, rRadius * 2);
  }

  // Horizontal overlapping panel seam
  ctx.fillStyle = 'rgba(42, 38, 35, 0.45)';
  ctx.fillRect(0, height * 0.5 - 2, width, 4);

  const map = finalizeColorTexture(colorCanvas, maxAnisotropy, 2, 1);

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.colorSpace = THREE.NoColorSpace;
  bumpMap.anisotropy = maxAnisotropy;
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(2, 1);
  bumpMap.needsUpdate = true;

  return { map, bumpMap };
}

export function createWeatheredWoodTexture(
  maxAnisotropy: number,
  baseColor = '#6e472b',
  grainColor = '#4a2e19',
  repeatX = 1,
  repeatY = 1
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 512, 512);

  // Wood fiber streaks
  ctx.strokeStyle = grainColor;
  for (let i = 0; i < 180; i++) {
    ctx.globalAlpha = 0.08 + (i % 7) * 0.025;
    ctx.lineWidth = 1 + (i % 3);
    const y = (i * 512) / 180;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(
      170,
      y + Math.sin(i * 0.7) * 8,
      340,
      y - Math.cos(i * 0.5) * 8,
      512,
      y
    );
    ctx.stroke();
  }

  // Plank horizontal joints
  ctx.globalAlpha = 0.42;
  ctx.fillStyle = '#29170b';
  for (let p = 1; p <= 4; p++) {
    ctx.fillRect(0, p * 128 - 2, 512, 3);
  }
  ctx.globalAlpha = 1.0;

  return finalizeColorTexture(canvas, maxAnisotropy, repeatX, repeatY);
}

export function createBrickPlinthTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Mortar background
  ctx.fillStyle = '#8d8478';
  ctx.fillRect(0, 0, 512, 256);

  const rows = 6;
  const cols = 8;
  const brickH = 256 / rows;
  const brickW = 512 / cols;

  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (brickW * 0.5);
    for (let c = -1; c <= cols; c++) {
      const bx = c * brickW + offset + 3;
      const by = r * brickH + 3;
      const bw = brickW - 6;
      const bh = brickH - 6;

      const shade = ((r * 7 + c * 13) % 24) - 12;
      const red = Math.min(200, Math.max(120, 158 + shade));
      const green = Math.min(110, Math.max(55, 76 + Math.floor(shade * 0.5)));
      const blue = Math.min(85, Math.max(40, 54 + Math.floor(shade * 0.4)));

      ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
      ctx.fillRect(bx, by, bw, bh);
    }
  }

  return finalizeColorTexture(canvas, maxAnisotropy, 3, 1);
}

export function createAsphaltRoadTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base warm sun-baked asphalt
  ctx.fillStyle = '#333230';
  ctx.fillRect(0, 0, 512, 512);

  // Dusty earthen shoulder gradients along top and bottom edges of road
  const topShoulder = ctx.createLinearGradient(0, 0, 0, 75);
  topShoulder.addColorStop(0, '#8c7252');
  topShoulder.addColorStop(0.5, 'rgba(130, 105, 75, 0.45)');
  topShoulder.addColorStop(1, 'rgba(51, 50, 48, 0)');
  ctx.fillStyle = topShoulder;
  ctx.fillRect(0, 0, 512, 75);

  const botShoulder = ctx.createLinearGradient(0, 512 - 75, 0, 512);
  botShoulder.addColorStop(0, 'rgba(51, 50, 48, 0)');
  botShoulder.addColorStop(0.5, 'rgba(130, 105, 75, 0.45)');
  botShoulder.addColorStop(1, '#8c7252');
  ctx.fillStyle = botShoulder;
  ctx.fillRect(0, 512 - 75, 512, 75);

  // Aggregate mineral speckle
  for (let i = 0; i < 2200; i++) {
    const x = (i * 97) % 512;
    const y = (i * 193) % 512;
    const v = 42 + (i % 32);
    ctx.fillStyle = `rgb(${v}, ${v - 1}, ${v - 3})`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Worn dashed centerline
  ctx.fillStyle = '#d8cfb8';
  ctx.fillRect(45, 250, 165, 12);
  ctx.fillRect(295, 250, 165, 12);

  return finalizeColorTexture(canvas, maxAnisotropy, 4, 1);
}

export function createEarthGroundTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Bangladeshi roadside sandy clay / grassy earth
  ctx.fillStyle = '#8b7355';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 900; i++) {
    const x = (i * 131) % 512;
    const y = (i * 257) % 512;
    const size = 2 + (i % 6);
    if (i % 5 === 0) {
      ctx.fillStyle = 'rgba(92, 108, 58, 0.25)'; // subtle dry grass patch
    } else if (i % 2 === 0) {
      ctx.fillStyle = 'rgba(115, 92, 65, 0.35)';
    } else {
      ctx.fillStyle = 'rgba(156, 132, 98, 0.3)';
    }
    ctx.fillRect(x, y, size, size);
  }

  return finalizeColorTexture(canvas, maxAnisotropy, 10, 10);
}

export function createSignboardTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Deep bottle-green hand-painted board background
  ctx.fillStyle = '#143828';
  ctx.fillRect(0, 0, 1024, 256);

  // Warm golden-ochre double border
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 8;
  ctx.strokeRect(14, 14, 1024 - 28, 256 - 28);

  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 4;
  ctx.strokeRect(26, 26, 1024 - 52, 256 - 52);

  // Corner motifs
  ctx.fillStyle = '#eab308';
  const corners = [
    [34, 34],
    [1024 - 50, 34],
    [34, 256 - 50],
    [1024 - 50, 256 - 50],
  ];
  corners.forEach(([cx, cy]) => {
    ctx.fillRect(cx, cy, 16, 16);
  });

  // Main Bengali & English Title
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 58px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('বিসমিল্লাহ চায়ের দোকান • BISMILLAH CHA', 512, 104);

  // Subtitle
  ctx.fillStyle = '#fed7aa';
  ctx.font = '600 30px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('গরম দুধ চা, লাল চা ও বিস্কুট  |  Fresh Milk Tea, Lal Cha & Toast Biscuits', 512, 182);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createLungiTexture(
  maxAnisotropy: number,
  primaryHex = '#1e3a8a',
  secondaryHex = '#172554',
  stripeHex = '#93c5fd'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = primaryHex;
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = secondaryHex;
  for (let i = 0; i < 256; i += 32) {
    ctx.fillRect(i, 0, 16, 256);
  }
  ctx.globalAlpha = 0.55;
  for (let j = 0; j < 256; j += 32) {
    ctx.fillRect(0, j, 256, 16);
  }

  ctx.globalAlpha = 0.75;
  ctx.fillStyle = stripeHex;
  for (let i = 0; i < 256; i += 32) {
    ctx.fillRect(i, 0, 2, 256);
    ctx.fillRect(0, i, 256, 2);
  }
  ctx.globalAlpha = 1.0;

  return finalizeColorTexture(canvas, maxAnisotropy, 2, 2);
}
