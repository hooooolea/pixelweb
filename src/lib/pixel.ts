// 像素化处理引擎：降采样、调色板量化、抖动算法

export type PaletteId = 'auto' | 'gameboy' | 'nes' | 'gray' | 'sepia' | 'vaporwave' | 'perler'

export interface BeadCount {
  color: RGB
  count: number
  percentage: number
}

export interface PixelResult {
  canvas: HTMLCanvasElement
  colorCounts: BeadCount[]
}

export interface PixelOptions {
  pixelSize: number // 像素块大小
  colorCount: number // 自动模式下的颜色数 / 固定调色板时限制用色数
  palette: PaletteId
  dither: boolean // Floyd–Steinberg 抖动
  grid: boolean // 网格线
  maxColors: number // 0=不限制，>0 时只使用出现最多的 N 种颜色
  boardGrid: boolean // 拼豆底板 29×29 网格
  symbols: boolean // 像素块上叠加色号标注
}

type RGB = [number, number, number]

export interface PaletteColor {
  name: string
  color: RGB
  code?: string // 拼豆等品牌的色号，如 P18、P80
}

export const PALETTES: Record<Exclude<PaletteId, 'auto'>, { name: string; colors: PaletteColor[] }> = {
  gameboy: {
    name: 'Game Boy',
    colors: [
      { name: 'Darkest Green', color: [15, 56, 15] },
      { name: 'Dark Green', color: [48, 98, 48] },
      { name: 'Light Green', color: [139, 172, 15] },
      { name: 'Lightest Green', color: [155, 188, 15] },
    ],
  },
  nes: {
    name: '红白机 NES',
    colors: [
      { name: 'Black', color: [0, 0, 0] },
      { name: 'White', color: [252, 252, 252] },
      { name: 'Grey', color: [128, 128, 128] },
      { name: 'Red', color: [248, 56, 0] },
      { name: 'Orange', color: [252, 160, 68] },
      { name: 'Yellow', color: [248, 184, 0] },
      { name: 'Green', color: [0, 168, 0] },
      { name: 'Blue', color: [0, 120, 248] },
      { name: 'Indigo', color: [60, 60, 255] },
      { name: 'Purple', color: [188, 40, 188] },
      { name: 'Pink', color: [248, 120, 136] },
      { name: 'Cyan', color: [0, 232, 216] },
    ],
  },
  gray: {
    name: '黑白灰阶',
    colors: Array.from({ length: 8 }, (_, i) => {
      const v = Math.round((i / 7) * 255)
      return { name: `Gray ${i + 1}`, color: [v, v, v] as RGB }
    }),
  },
  sepia: {
    name: '复古棕褐',
    colors: [
      { name: 'Sepia 1', color: [46, 27, 13] },
      { name: 'Sepia 2', color: [96, 64, 32] },
      { name: 'Sepia 3', color: [150, 108, 60] },
      { name: 'Sepia 4', color: [200, 160, 104] },
      { name: 'Sepia 5', color: [232, 204, 160] },
      { name: 'Sepia 6', color: [250, 238, 210] },
    ],
  },
  vaporwave: {
    name: '蒸汽波',
    colors: [
      { name: 'Deep Purple', color: [13, 2, 33] },
      { name: 'Purple', color: [67, 17, 102] },
      { name: 'Magenta', color: [148, 22, 127] },
      { name: 'Pink', color: [255, 113, 206] },
      { name: 'Cyan', color: [1, 205, 254] },
      { name: 'Mint', color: [5, 255, 161] },
      { name: 'Lavender', color: [185, 103, 255] },
      { name: 'Yellow', color: [255, 251, 150] },
    ],
  },
  perler: {
    name: '拼豆 Perler',
    colors: [
      { code: 'P18', name: 'Black 黑色', color: [50, 50, 52] },
      { code: 'P01', name: 'White 白色', color: [234, 239, 238] },
      { code: 'P17', name: 'Grey 灰色', color: [144, 148, 151] },
      { code: 'P92', name: 'Dark Grey 深灰', color: [88, 92, 97] },
      { code: 'P181', name: 'Light Grey 浅灰', color: [179, 186, 184] },
      { code: 'P05', name: 'Red 红色', color: [176, 53, 60] },
      { code: 'P961', name: 'Cherry 深红', color: [157, 43, 58] },
      { code: 'P211', name: 'Tomato 番茄红', color: [209, 67, 55] },
      { code: 'P04', name: 'Orange 橙色', color: [235, 123, 49] },
      { code: 'P57', name: 'Cheddar 芝士黄', color: [251, 177, 70] },
      { code: 'P03', name: 'Yellow 黄色', color: [231, 206, 62] },
      { code: 'P56', name: 'Pastel Yellow 淡黄', color: [233, 226, 144] },
      { code: 'P02', name: 'Creme 奶油', color: [225, 226, 187] },
      { code: 'P80', name: 'Bright Green 亮绿', color: [77, 171, 100] },
      { code: 'P10', name: 'Dark Green 深绿', color: [0, 123, 78] },
      { code: 'P61', name: 'Kiwi Lime 青柠', color: [105, 184, 69] },
      { code: 'P219', name: 'Fern 草绿', color: [127, 151, 26] },
      { code: 'P08', name: 'Dark Blue 深蓝', color: [14, 80, 146] },
      { code: 'P09', name: 'Light Blue 浅蓝', color: [39, 140, 201] },
      { code: 'P52', name: 'Pastel Blue 淡蓝', color: [74, 156, 207] },
      { code: 'P62', name: 'Turquoise 青蓝', color: [0, 152, 197] },
      { code: 'P58', name: 'Toothpaste 牙膏绿', color: [150, 209, 212] },
      { code: 'P07', name: 'Purple 紫色', color: [104, 75, 134] },
      { code: 'P182', name: 'Lavender 淡紫', color: [175, 159, 206] },
      { code: 'P54', name: 'Pastel Lavender 浅紫', color: [147, 127, 191] },
      { code: 'P83', name: 'Pink 粉色', color: [212, 84, 150] },
      { code: 'P06', name: 'Bubblegum 泡泡糖', color: [216, 114, 154] },
      { code: 'P203', name: 'Flamingo 火烈鸟', color: [242, 175, 183] },
      { code: 'P38', name: 'Magenta 品红', color: [224, 66, 132] },
      { code: 'P12', name: 'Brown 棕色', color: [103, 76, 68] },
      { code: 'P21', name: 'Light Brown 浅棕', color: [147, 104, 72] },
      { code: 'P35', name: 'Tan 褐色', color: [197, 172, 144] },
      { code: 'P33', name: 'Peach 肤色', color: [233, 191, 185] },
      { code: 'P208', name: 'Toasted Marshmallow 米白', color: [222, 218, 206] },
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

/** 估算图片的合理颜色数（用于自动模式的智能默认值），返回 2–32 之间 */
export function estimateColorCount(source: HTMLImageElement | HTMLCanvasElement): number {
  const sw = source instanceof HTMLImageElement ? source.naturalWidth : source.width
  const sh = source instanceof HTMLImageElement ? source.naturalHeight : source.height
  // 缩小到小尺寸再统计
  const c = document.createElement('canvas')
  const scale = Math.min(1, 64 / Math.max(sw, sh))
  c.width = Math.max(1, Math.round(sw * scale))
  c.height = Math.max(1, Math.round(sh * scale))
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(source, 0, 0, c.width, c.height)
  const data = ctx.getImageData(0, 0, c.width, c.height).data
  const colors = new Set<number>()
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue
    // 量化到 4 bit/通道，减少噪声
    const r = (data[i] >> 4) & 0xf
    const g = (data[i + 1] >> 4) & 0xf
    const b = (data[i + 2] >> 4) & 0xf
    colors.add((r << 8) | (g << 4) | b)
  }
  // 直接映射到合理范围：颜色越少给越细，越多给越粗，上限 32
  const n = colors.size
  if (n <= 2) return 2
  if (n <= 4) return n
  if (n <= 8) return 8
  if (n <= 12) return 12
  if (n <= 16) return 16
  if (n <= 24) return 24
  return 32
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
export function applyPalette(img: ImageData, palette: RGB[], dither: boolean): void {
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
export function pixelate(source: HTMLImageElement | HTMLCanvasElement, opts: PixelOptions): PixelResult {
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
  const palette: RGB[] =
    opts.palette === 'auto'
      ? medianCut(img.data, opts.colorCount)
      : PALETTES[opts.palette].colors.map((c) => c.color)
  applyPalette(img, palette, opts.dither)

  // 颜色限制：只保留出现最多的 N 种颜色
  if (opts.maxColors > 0 && opts.maxColors < palette.length) {
    const topColors = countColors(img.data)
      .slice(0, opts.maxColors)
      .map(c => c.color)
    remapToColors(img, topColors)
  }

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

  // 5. 拼豆底板网格 (29×29)
  if (opts.boardGrid) {
    const boardSize = 29 * opts.pixelSize
    // 底板边界
    octx.strokeStyle = 'rgba(255,140,0,0.5)'
    octx.lineWidth = 2
    for (let bx = 0; bx <= out.width; bx += boardSize) {
      octx.beginPath()
      octx.moveTo(bx + 0.5, 0)
      octx.lineTo(bx + 0.5, out.height)
      octx.stroke()
    }
    for (let by = 0; by <= out.height; by += boardSize) {
      octx.beginPath()
      octx.moveTo(0, by + 0.5)
      octx.lineTo(out.width, by + 0.5)
      octx.stroke()
    }
    // 底板数量标注
    const bxCount = Math.ceil(out.width / boardSize)
    const byCount = Math.ceil(out.height / boardSize)
    octx.font = `${Math.max(10, opts.pixelSize * 0.8)}px monospace`
    octx.fillStyle = 'rgba(255,140,0,0.8)'
    octx.textAlign = 'center'
    for (let bx = 0; bx < bxCount; bx++) {
      for (let by = 0; by < byCount; by++) {
        octx.fillText(
          `${bx + 1},${by + 1}`,
          bx * boardSize + boardSize / 2,
          by * boardSize + boardSize / 2 + Math.max(4, opts.pixelSize * 0.3)
        )
      }
    }
  }

  // 5.5 色号标注
  if (opts.symbols && opts.pixelSize >= 4) {
    const colorIndex = new Map<string, number>()
    palette.forEach((c, i) => colorIndex.set(`${c[0]},${c[1]},${c[2]}`, i + 1))
    const sdata = sctx.getImageData(0, 0, pw, ph)
    octx.textAlign = 'center'
    octx.textBaseline = 'middle'
    const fontSize = Math.max(7, opts.pixelSize * 0.55)
    octx.font = `bold ${fontSize}px monospace`
    // 决定文字颜色：亮色背景用深色文字，暗色背景用白色文字
    for (let py = 0; py < ph; py++) {
      for (let px = 0; px < pw; px++) {
        const pi = (py * pw + px) * 4
        const d = sdata.data
        const key = `${d[pi]},${d[pi + 1]},${d[pi + 2]}`
        const idx = colorIndex.get(key)
        if (idx === undefined) continue
        const cx = px * opts.pixelSize + opts.pixelSize / 2
        const cy = py * opts.pixelSize + opts.pixelSize / 2
        const lum = d[pi] * 0.299 + d[pi + 1] * 0.587 + d[pi + 2] * 0.114
        octx.fillStyle = lum > 128 ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.85)'
        octx.fillText(String(idx), cx, cy)
      }
    }
  }

  // 6. 统计颜色数量
  const colorCounts = countColors(img.data)

  return { canvas: out, colorCounts }
}

/** 将图像重新映射到指定的颜色列表 */
function remapToColors(img: ImageData, colors: RGB[]): void {
  const { data } = img
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue
    const c = nearestColor(colors, data[i], data[i + 1], data[i + 2])
    data[i] = c[0]
    data[i + 1] = c[1]
    data[i + 2] = c[2]
  }
}

/** 为调色板的每个颜色找最近替代色 */
export function getSubstitutions(palette: RGB[]): Map<string, RGB> {
  const map = new Map<string, RGB>()
  for (const c of palette) {
    let best: RGB | null = null
    let bestD = Infinity
    for (const other of palette) {
      if (other === c) continue
      const d = colorDist(c, other[0], other[1], other[2])
      if (d < bestD) { bestD = d; best = other }
    }
    if (best) map.set(`${c[0]},${c[1]},${c[2]}`, best)
  }
  return map
}

/** 统计每种颜色在像素图中的数量 */
function countColors(data: Uint8ClampedArray): BeadCount[] {
  const map = new Map<string, number>()
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue
    const key = `${data[i]},${data[i + 1]},${data[i + 2]}`
    map.set(key, (map.get(key) ?? 0) + 1)
  }
  const total = [...map.values()].reduce((a, b) => a + b, 0)
  return [...map.entries()]
    .map(([key, count]) => {
      const [r, g, b] = key.split(',').map(Number)
      return { color: [r, g, b] as RGB, count, percentage: Math.round((count / total) * 1000) / 10 }
    })
    .sort((a, b) => b.count - a.count)
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
