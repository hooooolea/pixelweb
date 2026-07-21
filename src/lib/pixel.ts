// 像素化处理引擎：降采样、调色板量化、抖动算法

export type PaletteId = 'auto' | 'gameboy' | 'nes' | 'gray' | 'sepia' | 'vaporwave'

export interface PixelOptions {
  pixelSize: number // 像素块大小
  colorCount: number // 自动模式下的颜色数
  palette: PaletteId
  dither: boolean // Floyd–Steinberg 抖动
  grid: boolean // 网格线
}

type RGB = [number, number, number]

export const PALETTES: Record<Exclude<PaletteId, 'auto'>, { name: string; colors: RGB[] }> = {
  gameboy: {
    name: 'Game Boy',
    colors: [
      [15, 56, 15],
      [48, 98, 48],
      [139, 172, 15],
      [155, 188, 15],
    ],
  },
  nes: {
    name: '红白机 NES',
    colors: [
      [0, 0, 0],
      [252, 252, 252],
      [128, 128, 128],
      [248, 56, 0],
      [252, 160, 68],
      [248, 184, 0],
      [0, 168, 0],
      [0, 120, 248],
      [60, 60, 255],
      [188, 40, 188],
      [248, 120, 136],
      [0, 232, 216],
    ],
  },
  gray: {
    name: '黑白灰阶',
    colors: Array.from({ length: 8 }, (_, i) => {
      const v = Math.round((i / 7) * 255)
      return [v, v, v] as RGB
    }),
  },
  sepia: {
    name: '复古棕褐',
    colors: [
      [46, 27, 13],
      [96, 64, 32],
      [150, 108, 60],
      [200, 160, 104],
      [232, 204, 160],
      [250, 238, 210],
    ],
  },
  vaporwave: {
    name: '蒸汽波',
    colors: [
      [13, 2, 33],
      [67, 17, 102],
      [148, 22, 127],
      [255, 113, 206],
      [1, 205, 254],
      [5, 255, 161],
      [185, 103, 255],
      [255, 251, 150],
    ],
  },
}

function colorDist(a: RGB, r: number, g: number, b: number): number {
  // 加权欧氏距离，更接近人眼感知
  const dr = a[0] - r
  const dg = a[1] - g
  const db = a[2] - b
  return dr * dr * 0.299 + dg * dg * 0.587 + db * db * 0.114
}

function nearestColor(palette: RGB[], r: number, g: number, b: number): RGB {
  let best = palette[0]
  let bestD = Infinity
  for (const c of palette) {
    const d = colorDist(c, r, g, b)
    if (d < bestD) {
      bestD = d
      best = c
    }
  }
  return best
}

/** 中位切分法颜色量化：从图像中提取 n 个代表色 */
export function medianCut(data: Uint8ClampedArray, n: number): RGB[] {
  const pixels: RGB[] = []
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue
    pixels.push([data[i], data[i + 1], data[i + 2]])
  }
  if (pixels.length === 0) return [[0, 0, 0]]

  let boxes: RGB[][] = [pixels]
  while (boxes.length < n) {
    // 找最大箱体，沿最长通道切分
    let idx = -1
    let maxRange = -1
    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i]
      if (box.length < 2) continue
      let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0
      for (const p of box) {
        if (p[0] < minR) minR = p[0]
        if (p[0] > maxR) maxR = p[0]
        if (p[1] < minG) minG = p[1]
        if (p[1] > maxG) maxG = p[1]
        if (p[2] < minB) minB = p[2]
        if (p[2] > maxB) maxB = p[2]
      }
      const range = Math.max(maxR - minR, maxG - minG, maxB - minB)
      if (range > maxRange) {
        maxRange = range
        idx = i
      }
    }
    if (idx === -1) break

    const box = boxes[idx]
    let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0
    for (const p of box) {
      if (p[0] < minR) minR = p[0]
      if (p[0] > maxR) maxR = p[0]
      if (p[1] < minG) minG = p[1]
      if (p[1] > maxG) maxG = p[1]
      if (p[2] < minB) minB = p[2]
      if (p[2] > maxB) maxB = p[2]
    }
    const ranges = [maxR - minR, maxG - minG, maxB - minB]
    const channel = ranges.indexOf(Math.max(...ranges)) as 0 | 1 | 2
    box.sort((a, b) => a[channel] - b[channel])
    const mid = box.length >> 1
    boxes = [...boxes.slice(0, idx), box.slice(0, mid), box.slice(mid), ...boxes.slice(idx + 1)]
  }

  return boxes
    .filter((b) => b.length > 0)
    .map((box) => {
      let r = 0, g = 0, b = 0
      for (const p of box) {
        r += p[0]
        g += p[1]
        b += p[2]
      }
      const len = box.length
      return [Math.round(r / len), Math.round(g / len), Math.round(b / len)] as RGB
    })
}

/** 将图像映射到调色板，可选 Floyd–Steinberg 抖动 */
function applyPalette(img: ImageData, palette: RGB[], dither: boolean): void {
  const { data, width, height } = img
  if (!dither) {
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue
      const c = nearestColor(palette, data[i], data[i + 1], data[i + 2])
      data[i] = c[0]
      data[i + 1] = c[1]
      data[i + 2] = c[2]
    }
    return
  }
  // Floyd–Steinberg 误差扩散
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      if (data[i + 3] < 128) continue
      const oldR = data[i], oldG = data[i + 1], oldB = data[i + 2]
      const c = nearestColor(palette, oldR, oldG, oldB)
      data[i] = c[0]
      data[i + 1] = c[1]
      data[i + 2] = c[2]
      const er = oldR - c[0], eg = oldG - c[1], eb = oldB - c[2]
      const spread = (dx: number, dy: number, f: number) => {
        const nx = x + dx, ny = y + dy
        if (nx < 0 || nx >= width || ny >= height) return
        const j = (ny * width + nx) * 4
        data[j] = Math.max(0, Math.min(255, data[j] + er * f))
        data[j + 1] = Math.max(0, Math.min(255, data[j + 1] + eg * f))
        data[j + 2] = Math.max(0, Math.min(255, data[j + 2] + eb * f))
      }
      spread(1, 0, 7 / 16)
      spread(-1, 1, 3 / 16)
      spread(0, 1, 5 / 16)
      spread(1, 1, 1 / 16)
    }
  }
}

/**
 * 像素化主流程：
 * 1. 把原图缩小到 宽/pixelSize × 高/pixelSize（平滑降采样取平均色）
 * 2. 对小图做调色板量化（+ 可选抖动）
 * 3. 用最近邻放大回原尺寸，得到锐利像素块
 * 4. 可选叠加网格线
 */
export function pixelate(source: HTMLImageElement | HTMLCanvasElement, opts: PixelOptions): HTMLCanvasElement {
  const sw = source instanceof HTMLImageElement ? source.naturalWidth : source.width
  const sh = source instanceof HTMLImageElement ? source.naturalHeight : source.height
  const pw = Math.max(1, Math.round(sw / opts.pixelSize))
  const ph = Math.max(1, Math.round(sh / opts.pixelSize))

  // 1. 降采样
  const small = document.createElement('canvas')
  small.width = pw
  small.height = ph
  const sctx = small.getContext('2d')!
  sctx.imageSmoothingEnabled = true
  sctx.imageSmoothingQuality = 'high'
  sctx.drawImage(source, 0, 0, pw, ph)

  // 2. 量化
  const img = sctx.getImageData(0, 0, pw, ph)
  const palette =
    opts.palette === 'auto'
      ? medianCut(img.data, opts.colorCount)
      : PALETTES[opts.palette].colors
  applyPalette(img, palette, opts.dither)
  sctx.putImageData(img, 0, 0)

  // 3. 最近邻放大
  const out = document.createElement('canvas')
  out.width = pw * opts.pixelSize
  out.height = ph * opts.pixelSize
  const octx = out.getContext('2d')!
  octx.imageSmoothingEnabled = false
  octx.drawImage(small, 0, 0, out.width, out.height)

  // 4. 网格线
  if (opts.grid && opts.pixelSize >= 6) {
    octx.strokeStyle = 'rgba(0,0,0,0.18)'
    octx.lineWidth = 1
    octx.beginPath()
    for (let x = 0; x <= pw; x++) {
      octx.moveTo(x * opts.pixelSize + 0.5, 0)
      octx.lineTo(x * opts.pixelSize + 0.5, out.height)
    }
    for (let y = 0; y <= ph; y++) {
      octx.moveTo(0, y * opts.pixelSize + 0.5)
      octx.lineTo(out.width, y * opts.pixelSize + 0.5)
    }
    octx.stroke()
  }

  return out
}

/** 生成一张内置示例图（黄昏山谷），让用户不上传也能立即体验 */
export function createSampleImage(): HTMLCanvasElement {
  const w = 800
  const h = 600
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!

  // 天空渐变
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.75)
  sky.addColorStop(0, '#2b1055')
  sky.addColorStop(0.45, '#7597de')
  sky.addColorStop(0.75, '#ff9a76')
  sky.addColorStop(1, '#ffd0a0')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, w, h * 0.75)

  // 太阳 + 光晕
  const sun = ctx.createRadialGradient(w * 0.68, h * 0.52, 10, w * 0.68, h * 0.52, 160)
  sun.addColorStop(0, '#fff7d6')
  sun.addColorStop(0.25, '#ffd76e')
  sun.addColorStop(1, 'rgba(255,180,80,0)')
  ctx.fillStyle = sun
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = '#ffdf8e'
  ctx.beginPath()
  ctx.arc(w * 0.68, h * 0.52, 52, 0, Math.PI * 2)
  ctx.fill()

  // 云朵
  ctx.fillStyle = 'rgba(255,235,220,0.85)'
  const cloud = (cx: number, cy: number, s: number) => {
    ctx.beginPath()
    ctx.ellipse(cx, cy, 60 * s, 18 * s, 0, 0, Math.PI * 2)
    ctx.ellipse(cx + 40 * s, cy + 6 * s, 45 * s, 14 * s, 0, 0, Math.PI * 2)
    ctx.ellipse(cx - 45 * s, cy + 8 * s, 40 * s, 13 * s, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  cloud(w * 0.2, h * 0.2, 1)
  cloud(w * 0.5, h * 0.33, 0.7)
  cloud(w * 0.85, h * 0.14, 0.55)

  // 远山
  ctx.fillStyle = '#6b5b95'
  ctx.beginPath()
  ctx.moveTo(0, h * 0.75)
  ctx.lineTo(w * 0.15, h * 0.5)
  ctx.lineTo(w * 0.32, h * 0.7)
  ctx.lineTo(w * 0.5, h * 0.46)
  ctx.lineTo(w * 0.7, h * 0.72)
  ctx.lineTo(w * 0.88, h * 0.55)
  ctx.lineTo(w, h * 0.75)
  ctx.lineTo(w, h)
  ctx.lineTo(0, h)
  ctx.closePath()
  ctx.fill()

  // 近山
  ctx.fillStyle = '#3d3b6e'
  ctx.beginPath()
  ctx.moveTo(0, h * 0.78)
  ctx.lineTo(w * 0.25, h * 0.6)
  ctx.lineTo(w * 0.45, h * 0.8)
  ctx.lineTo(w * 0.65, h * 0.62)
  ctx.lineTo(w * 0.85, h * 0.82)
  ctx.lineTo(w, h * 0.72)
  ctx.lineTo(w, h)
  ctx.lineTo(0, h)
  ctx.closePath()
  ctx.fill()

  // 地面与水面
  ctx.fillStyle = '#1f2b52'
  ctx.fillRect(0, h * 0.82, w, h * 0.18)
  ctx.fillStyle = 'rgba(255,190,120,0.5)'
  for (let i = 0; i < 14; i++) {
    const y = h * 0.84 + i * 6
    const half = 30 + (14 - i) * 7
    ctx.fillRect(w * 0.68 - half, y, half * 2, 3)
  }

  // 飞鸟
  ctx.strokeStyle = '#2a1a44'
  ctx.lineWidth = 3
  const bird = (bx: number, by: number, s: number) => {
    ctx.beginPath()
    ctx.arc(bx - 8 * s, by, 8 * s, Math.PI * 1.15, Math.PI * 1.9)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(bx + 8 * s, by, 8 * s, Math.PI * 1.1, Math.PI * 1.85)
    ctx.stroke()
  }
  bird(w * 0.3, h * 0.28, 1)
  bird(w * 0.38, h * 0.22, 0.7)
  bird(w * 0.56, h * 0.18, 0.85)

  return c
}
