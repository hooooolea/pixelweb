import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Download,
  Eye,
  Grid3X3,
  Hash,
  LayoutGrid,
  Moon,
  Palette,
  RefreshCw,
  ImageIcon,
  Sparkles,
  Type,
  Sun,
  Upload,
  Waves,
} from 'lucide-react'
import {
  applyPalette,
  createSampleImage,
  getSubstitutions,
  pixelate,
  PALETTES,
  type BeadCount,
  type PaletteId,
  type PixelOptions,
} from '@/lib/pixel'

const PALETTE_OPTIONS: { id: PaletteId; name: string }[] = [
  { id: 'auto', name: '自动提取' },
  { id: 'gameboy', name: PALETTES.gameboy.name },
  { id: 'nes', name: PALETTES.nes.name },
  { id: 'gray', name: PALETTES.gray.name },
  { id: 'sepia', name: PALETTES.sepia.name },
  { id: 'vaporwave', name: PALETTES.vaporwave.name },
  { id: 'perler', name: PALETTES.perler.name },
]

const DEFAULTS: PixelOptions = {
  pixelSize: 12,
  colorCount: 16,
  palette: 'auto',
  dither: false,
  grid: false,
  maxColors: 0,
  boardGrid: false,
  symbols: false,
}

function useDark() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pixelweb-theme') === 'dark'
    }
    return false
  })

  useEffect(() => {
    const root = document.documentElement
    if (dark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('pixelweb-theme', dark ? 'dark' : 'light')
  }, [dark])

  return [dark, () => setDark((d: boolean) => !d)] as const
}

export default function Home() {
  const [source, setSource] = useState<HTMLImageElement | HTMLCanvasElement | null>(null)
  const [fileName, setFileName] = useState('示例图片')
  const [isSample, setIsSample] = useState(true)
  const [opts, setOpts] = useState<PixelOptions>(DEFAULTS)
  const [showOriginal, setShowOriginal] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [exportScale, setExportScale] = useState('1')
  const [dark, toggleDark] = useDark()
  const [mode, setMode] = useState<'image' | 'text'>('image')
  const [textInput, setTextInput] = useState('HELLO')
  const [textSize, setTextSize] = useState(8)
  const [textColors, setTextColors] = useState<'bw' | 'rainbow' | 'morandi' | 'contrast' | 'candy' | 'forest'>('bw')

  const COLOR_SCHEMES: Record<string, string[]> = {
    bw: ['#000000'],
    rainbow: ['#E74C3C','#E67E22','#F1C40F','#2ECC71','#1ABC9C','#3498DB','#9B59B6','#E91E63'],
    morandi: ['#C2A89E','#A8B5A2','#9B9E8D','#B8A9C9','#D4A5A5','#A5B8D4','#C9B8A8','#B5C9B5'],
    contrast: ['#FF0000','#00FF00','#0000FF','#FF00FF','#FFFF00','#00FFFF','#FF6600','#6600FF'],
    candy: ['#FFB3BA','#FFDFBA','#FFFFBA','#BAFFC9','#BAE1FF','#E8BAFF','#FFB3DE','#B3FFE0'],
    forest: ['#2D5A27','#4A7C3F','#6B8E4E','#8B9E6B','#3D5C3A','#5C7C4A','#7C9C5A','#4A6B3A'],
  }

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const resultCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [colorCounts, setColorCounts] = useState<BeadCount[]>([])

  const renderTextToCanvas = useCallback((text: string, size: number, palette: string[]): HTMLCanvasElement => {
    const c = document.createElement('canvas')
    const ctx = c.getContext('2d')!
    ctx.imageSmoothingEnabled = false
    const charW = size * 0.6
    const charH = size
    const lines = text.split('\n')
    const maxLen = Math.max(...lines.map(l => l.length), 1)
    c.width = Math.max(1, Math.ceil(maxLen * charW + size * 0.5))
    c.height = Math.max(1, Math.ceil(lines.length * charH + size * 0.5))
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, c.width, c.height)
    ctx.font = `bold ${size}px monospace`
    ctx.textBaseline = 'top'
    ctx.textAlign = 'left'
    if (palette.length > 1) {
      lines.forEach((line, i) => {
        let x = size * 0.2
        for (const ch of line) {
          ctx.fillStyle = palette[Math.floor(Math.random() * palette.length)]
          ctx.fillText(ch, x, i * charH + size * 0.2)
          x += ctx.measureText(ch).width
        }
      })
    } else {
      ctx.fillStyle = '#000000'
      lines.forEach((line, i) => {
        ctx.fillText(line, size * 0.2, i * charH + size * 0.2)
      })
    }
    return c
  }, [])

  useEffect(() => {
    if (mode === 'text') {
      setSource(renderTextToCanvas(textInput, textSize, COLOR_SCHEMES[textColors]))
      setIsSample(false)
    } else if (!source || isSample) {
      setSource(createSampleImage())
    }
  }, [mode])

  useEffect(() => {
    if (mode === 'text') {
      setSource(renderTextToCanvas(textInput, textSize, COLOR_SCHEMES[textColors]))
      setFileName('文字拼豆')
    }
  }, [textInput, textSize, textColors, COLOR_SCHEMES])

  useEffect(() => {
    setSource(createSampleImage())
  }, [])

  useEffect(() => {
    if (!source || !canvasRef.current) return
    const view = canvasRef.current

    if (mode === 'text') {
      // Text mode: no pixelation — render text directly, quantize to palette
      const tw = source instanceof HTMLCanvasElement ? source.width : (source as HTMLImageElement).naturalWidth
      const th = source instanceof HTMLCanvasElement ? source.height : (source as HTMLImageElement).naturalHeight
      const small = document.createElement('canvas')
      small.width = tw; small.height = th
      const sctx = small.getContext('2d')!
      sctx.drawImage(source, 0, 0)
      const img = sctx.getImageData(0, 0, tw, th)
      const palette = opts.palette === 'auto'
        ? Array.from(new Map(colorCounts.length > 0 ? colorCounts.map(c => [`${c.color[0]},${c.color[1]},${c.color[2]}`, c.color] as const) : [])).map(([, v]) => v)
        : PALETTES[opts.palette as Exclude<PaletteId, 'auto'>].colors
      if (palette.length === 0) {
        // Default palette for auto mode with no prior counts
        const fallbackPalette: [number,number,number][] = [
          [0,0,0],[255,255,255],[255,0,0],[0,255,0],[0,0,255],[255,255,0],[255,0,255],[0,255,255]
        ]
        applyPalette(img, fallbackPalette, false)
      } else {
        applyPalette(img, palette, false)
      }
      sctx.putImageData(img, 0, 0)
      // Draw grid
      if (opts.grid) {
        const gctx = small.getContext('2d')!
        gctx.strokeStyle = 'rgba(0,0,0,0.18)'
        gctx.lineWidth = 1
        gctx.beginPath()
        for (let x = 0; x <= tw; x++) { gctx.moveTo(x + 0.5, 0); gctx.lineTo(x + 0.5, th) }
        for (let y = 0; y <= th; y++) { gctx.moveTo(0, y + 0.5); gctx.lineTo(tw, y + 0.5) }
        gctx.stroke()
      }
      // Draw symbols
      if (opts.symbols && palette.length > 0) {
        const gctx2 = small.getContext('2d')!
        const colorIndex = new Map(palette.map((c, i) => [`${c[0]},${c[1]},${c[2]}`, i + 1]))
        const d2 = sctx.getImageData(0, 0, tw, th)
        gctx2.textAlign = 'center'; gctx2.textBaseline = 'middle'
        const fs = Math.max(6, 10)
        gctx2.font = `bold ${fs}px monospace`
        for (let py = 0; py < th; py++) {
          for (let px = 0; px < tw; px++) {
            const pi = (py * tw + px) * 4
            const key = `${d2.data[pi]},${d2.data[pi+1]},${d2.data[pi+2]}`
            const idx = colorIndex.get(key)
            if (idx !== undefined) {
              const lum = d2.data[pi] * 0.299 + d2.data[pi+1] * 0.587 + d2.data[pi+2] * 0.114
              gctx2.fillStyle = lum > 128 ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.8)'
              gctx2.fillText(String(idx), px + 0.5, py + 0.5)
            }
          }
        }
      }
      resultCanvasRef.current = small
      // Count colors
      const colorMap = new Map<string, number>()
      const fdata = sctx.getImageData(0, 0, tw, th)
      for (let i = 0; i < fdata.data.length; i += 4) {
        if (fdata.data[i+3] < 128) continue
        const k = `${fdata.data[i]},${fdata.data[i+1]},${fdata.data[i+2]}`
        colorMap.set(k, (colorMap.get(k) ?? 0) + 1)
      }
      const total = [...colorMap.values()].reduce((a, b) => a + b, 0) || 1
      const counts: BeadCount[] = [...colorMap.entries()].map(([k, n]) => {
        const [r, g, b] = k.split(',').map(Number)
        return { color: [r, g, b] as [number, number, number], count: n, percentage: Math.round((n / total) * 1000) / 10 }
      }).sort((a, b) => b.count - a.count)
      setColorCounts(counts)
      // Scale to fit preview
      const maxW = view.parentElement?.clientWidth ?? 800
      const scale = Math.min(1, maxW / tw)
      view.width = Math.round(tw * scale)
      view.height = Math.round(th * scale)
      const vctx = view.getContext('2d')!
      vctx.imageSmoothingEnabled = false
      vctx.drawImage(small, 0, 0, view.width, view.height)
    } else {
      // Image mode: full pixelation pipeline
      const result = pixelate(source, opts)
      resultCanvasRef.current = result.canvas
      setColorCounts(result.colorCounts)

      const outCanvas = result.canvas
      const maxW = view.parentElement?.clientWidth ?? 800
      const scale = Math.min(1, maxW / outCanvas.width)
      view.width = Math.round(outCanvas.width * scale)
      view.height = Math.round(outCanvas.height * scale)
      const ctx = view.getContext('2d')!
      ctx.imageSmoothingEnabled = false
      if (showOriginal) {
        ctx.drawImage(source, 0, 0, view.width, view.height)
      } else {
        ctx.drawImage(outCanvas, 0, 0, view.width, view.height)
      }
    }
  }, [source, opts, showOriginal, mode])

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      setSource(img)
      setFileName(file.name.replace(/\.[^.]+$/, ''))
      setIsSample(false)
      URL.revokeObjectURL(url)
    }
    img.src = url
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) loadFile(file)
    },
    [loadFile]
  )

  const download = useCallback(() => {
    const result = resultCanvasRef.current
    if (!result) return
    const scale = Number(exportScale)
    const out = document.createElement('canvas')
    out.width = result.width * scale
    out.height = result.height * scale
    const ctx = out.getContext('2d')!
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(result, 0, 0, out.width, out.height)
    const a = document.createElement('a')
    a.href = out.toDataURL('image/png')
    a.download = `${fileName}-像素画.png`
    a.click()
  }, [fileName, exportScale])

  const set = <K extends keyof PixelOptions>(key: K, value: PixelOptions[K]) =>
    setOpts((o) => ({ ...o, [key]: value }))

  const activePalette =
    opts.palette === 'auto' ? null : PALETTES[opts.palette as Exclude<PaletteId, 'auto'>].colors

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1A1A] dark:bg-[#0d0d14] dark:text-zinc-100 transition-colors">
      {/* 顶栏 */}
      <header className="border-b border-[#E5E0D8] dark:border-zinc-800/80 bg-[#FAF8F5]/90 dark:bg-[#0d0d14]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 grid-cols-2 overflow-hidden rounded-sm">
              <span className="bg-amber-500 dark:bg-fuchsia-500" />
              <span className="bg-orange-400 dark:bg-cyan-400" />
              <span className="bg-yellow-400 dark:bg-amber-400" />
              <span className="bg-amber-600 dark:bg-lime-400" />
            </div>
            <div>
              <h1 className="font-mono text-lg font-bold tracking-widest text-[#1A1A1A] dark:text-zinc-100">像素画工坊</h1>
              <p className="text-xs text-[#8B857D] dark:text-zinc-500">PIXEL ART STUDIO</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleDark}
              className="rounded-lg p-2 text-[#8B857D] hover:text-[#1A1A1A] hover:bg-[#F5F0EB] dark:text-zinc-500 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              aria-label="切换主题"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[280px_1fr]">
        {/* 控制面板 */}
        <aside className="space-y-5">
          <div className="rounded-xl border border-[#E5E0D8] dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#6B6560] dark:text-zinc-300">
              {mode === 'image' ? (
                <ImageIcon className="h-4 w-4 text-amber-600 dark:text-fuchsia-400" />
              ) : (
                <Type className="h-4 w-4 text-amber-600 dark:text-fuchsia-400" />
              )}
              {mode === 'image' ? '图片' : '文字'}
            </div>
            <div className="flex gap-1 mb-4">
              <button
                onClick={() => setMode('image')}
                className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
                  mode === 'image'
                    ? 'bg-amber-600 text-white dark:bg-fuchsia-600'
                    : 'bg-[#F5F0EB] text-[#8B857D] dark:bg-zinc-800 dark:text-zinc-500'
                }`}
              >
                图片
              </button>
              <button
                onClick={() => setMode('text')}
                className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
                  mode === 'text'
                    ? 'bg-amber-600 text-white dark:bg-fuchsia-600'
                    : 'bg-[#F5F0EB] text-[#8B857D] dark:bg-zinc-800 dark:text-zinc-500'
                }`}
              >
                文字
              </button>
            </div>
            {mode === 'image' ? (
              <>
                <Button
                  variant="outline"
                  className="w-full rounded-lg border-dashed border-[#D4CDC3] dark:border-zinc-700 bg-[#FAF8F5] dark:bg-transparent hover:border-amber-500 dark:hover:border-fuchsia-500 hover:bg-amber-50 dark:hover:bg-fuchsia-500/10 text-[#6B6560] dark:text-zinc-400"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  上传图片
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) { loadFile(f); setIsSample(false) }
                    e.target.value = ''
                  }}
                />
                <p className="mt-2 truncate text-center text-xs text-[#8B857D] dark:text-zinc-500">
                  当前：{fileName}
                  {isSample && '（可替换）'}
                </p>
              </>
            ) : (
              <>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="输入文字，支持换行"
                  rows={3}
                  maxLength={200}
                  className="w-full rounded-lg border border-[#D4CDC3] dark:border-zinc-700 bg-[#FAF8F5] dark:bg-zinc-950 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-current resize-none text-[#1A1A1A] dark:text-zinc-100 placeholder:text-[#8B857D]"
                />
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-[#6B6560] dark:text-zinc-400">字号</Label>
                    <span className="font-mono text-xs text-amber-600 dark:text-fuchsia-400">{textSize}px</span>
                  </div>
                  <Slider
                    min={4}
                    max={32}
                    step={1}
                    value={[textSize]}
                    onValueChange={([v]) => setTextSize(v)}
                  />
                </div>
                <div className="mt-3">
                  <Label className="text-xs text-[#6B6560] dark:text-zinc-400 mb-1.5 block">配色</Label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {([
                      { key: 'bw', label: '黑白', preview: ['#000','#888'] },
                      { key: 'rainbow', label: '彩虹', preview: ['#E74C3C','#F1C40F','#2ECC71','#3498DB'] },
                      { key: 'morandi', label: '莫兰迪', preview: ['#C2A89E','#A8B5A2','#B8A9C9','#D4A5A5'] },
                      { key: 'contrast', label: '对比色', preview: ['#FF0000','#00FF00','#0000FF','#FF00FF'] },
                      { key: 'candy', label: '糖果色', preview: ['#FFB3BA','#FFDFBA','#BAE1FF','#E8BAFF'] },
                      { key: 'forest', label: '森林', preview: ['#2D5A27','#4A7C3F','#6B8E4E','#8B9E6B'] },
                    ] as const).map(({ key, label, preview }) => (
                      <button
                        key={key}
                        onClick={() => setTextColors(key)}
                        className={`rounded-md py-1.5 text-[11px] font-medium transition-colors ${
                          textColors === key
                            ? 'bg-amber-600 text-white dark:bg-fuchsia-600'
                            : 'bg-[#F5F0EB] text-[#8B857D] dark:bg-zinc-800 dark:text-zinc-500 hover:bg-[#E5E0D8] dark:hover:bg-zinc-700'
                        }`}
                      >
                        <div className="flex justify-center gap-0.5 mb-0.5">
                          {preview.map((c, i) => (
                            <span key={i} className="h-2 w-2 rounded-full" style={{ backgroundColor: c }} />
                          ))}
                        </div>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="space-y-5 rounded-xl border border-[#E5E0D8] dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#6B6560] dark:text-zinc-300">
              <Sparkles className="h-4 w-4 text-amber-600 dark:text-cyan-400" />
              像素参数
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-[#6B6560] dark:text-zinc-400">像素块大小</Label>
                <span className="font-mono text-xs text-amber-600 dark:text-fuchsia-400">{opts.pixelSize}px</span>
              </div>
              <Slider
                min={2}
                max={64}
                step={1}
                value={[opts.pixelSize]}
                onValueChange={([v]) => set('pixelSize', v)}
              />
              <p className="text-[11px] text-[#8B857D] dark:text-zinc-600">越大越抽象，越小越细腻</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-[#6B6560] dark:text-zinc-400">
                  <Palette className="mr-1 inline h-3 w-3" />
                  调色板
                </Label>
              </div>
              <Select value={opts.palette} onValueChange={(v) => set('palette', v as PaletteId)}>
                <SelectTrigger className="rounded-lg border-[#D4CDC3] dark:border-zinc-700 bg-[#FAF8F5] dark:bg-zinc-950">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-[#D4CDC3] dark:border-zinc-700 bg-white dark:bg-zinc-900">
                  {PALETTE_OPTIONS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {activePalette && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {activePalette.map((c, i) => (
                    <span
                      key={i}
                      className="h-4 w-4 rounded-sm border border-black/20 dark:border-black/40"
                      style={{ backgroundColor: `rgb(${c[0]},${c[1]},${c[2]})` }}
                    />
                  ))}
                </div>
              )}
            </div>

            {opts.palette === 'auto' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-[#6B6560] dark:text-zinc-400">颜色数量</Label>
                  <span className="font-mono text-xs text-amber-600 dark:text-fuchsia-400">{opts.colorCount} 色</span>
                </div>
                <Slider
                  min={2}
                  max={64}
                  step={1}
                  value={[opts.colorCount]}
                  onValueChange={([v]) => set('colorCount', v)}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-[#6B6560] dark:text-zinc-400">限定用色</Label>
                  <span className="font-mono text-xs text-amber-600 dark:text-fuchsia-400">
                    {opts.maxColors > 0 ? `${opts.maxColors} 色` : '全部'}
                  </span>
                </div>
                <Slider
                  min={0}
                  max={PALETTES[opts.palette as Exclude<PaletteId, 'auto'>].colors.length}
                  step={1}
                  value={[opts.maxColors]}
                  onValueChange={([v]) => set('maxColors', v)}
                />
                <p className="text-[11px] text-[#8B857D] dark:text-zinc-600">
                  {opts.maxColors > 0 ? `只用出现最多的 ${opts.maxColors} 种颜色` : '使用全部颜色'}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-[#E5E0D8] dark:border-zinc-800 pt-4">
              <Label className="flex items-center gap-1.5 text-xs text-[#6B6560] dark:text-zinc-400">
                <Waves className="h-3 w-3" />
                抖动纹理 (Dithering)
              </Label>
              <Switch checked={opts.dither} onCheckedChange={(v) => set('dither', v)} />
            </div>

            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5 text-xs text-[#6B6560] dark:text-zinc-400">
                <Grid3X3 className="h-3 w-3" />
                显示网格线
              </Label>
              <Switch checked={opts.grid} onCheckedChange={(v) => set('grid', v)} />
            </div>

            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5 text-xs text-[#6B6560] dark:text-zinc-400">
                <Hash className="h-3 w-3" />
                色号标注
              </Label>
              <Switch checked={opts.symbols} onCheckedChange={(v) => set('symbols', v)} />
            </div>

            {opts.palette === 'perler' && (
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-xs text-[#6B6560] dark:text-zinc-400">
                  <LayoutGrid className="h-3 w-3" />
                  底板预览 (29×29)
                </Label>
                <Switch checked={opts.boardGrid} onCheckedChange={(v) => set('boardGrid', v)} />
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-xl border border-[#E5E0D8] dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#6B6560] dark:text-zinc-300">
              <Download className="h-4 w-4 text-amber-600 dark:text-lime-400" />
              导出
            </div>
            <div className="flex gap-2">
              <Select value={exportScale} onValueChange={setExportScale}>
                <SelectTrigger className="w-24 rounded-lg border-[#D4CDC3] dark:border-zinc-700 bg-[#FAF8F5] dark:bg-zinc-950">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-[#D4CDC3] dark:border-zinc-700 bg-white dark:bg-zinc-900">
                  <SelectItem value="1">1x</SelectItem>
                  <SelectItem value="2">2x</SelectItem>
                  <SelectItem value="4">4x</SelectItem>
                </SelectContent>
              </Select>
              <Button
                className="flex-1 rounded-lg bg-amber-600 dark:bg-fuchsia-600 font-semibold hover:bg-amber-500 dark:hover:bg-fuchsia-500 text-white"
                onClick={download}
              >
                <Download className="mr-2 h-4 w-4" />
                下载 PNG
              </Button>
            </div>
            <Button
              variant="ghost"
              className="w-full rounded-lg text-[#8B857D] dark:text-zinc-500 hover:text-[#1A1A1A] dark:hover:text-zinc-200 hover:bg-[#F5F0EB] dark:hover:bg-zinc-800"
              onClick={() => setOpts(DEFAULTS)}
            >
              <RefreshCw className="mr-2 h-3 w-3" />
              重置参数
            </Button>
          </div>

          {colorCounts.length > 0 && (() => {
            const isAuto = opts.palette === 'auto'
            const palette = isAuto ? colorCounts.map(c => c.color) : PALETTES[opts.palette as Exclude<PaletteId, 'auto'>].colors
            const subs = isAuto ? new Map() : getSubstitutions(palette)
            return (
            <div className="rounded-xl border border-[#E5E0D8] dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#6B6560] dark:text-zinc-300 mb-3">
                {isAuto ? '颜色统计' : '珠子用量'}
                <span className="ml-auto text-xs font-normal text-[#8B857D] dark:text-zinc-500">
                  {colorCounts.reduce((s, c) => s + c.count, 0)} 像素 · {colorCounts.length} 色
                </span>
              </div>
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {colorCounts.map((bc, i) => {
                  const key = `${bc.color[0]},${bc.color[1]},${bc.color[2]}`
                  const sub = subs.get(key)
                  return (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span
                      className="h-4 w-4 rounded-sm border border-black/10 dark:border-white/10 shrink-0"
                      style={{ backgroundColor: `rgb(${bc.color[0]},${bc.color[1]},${bc.color[2]})` }}
                    />
                    <span className="text-[#6B6560] dark:text-zinc-400 w-7 text-right font-mono">{bc.count}</span>
                    <span className="text-[#8B857D] dark:text-zinc-500">{bc.percentage}%</span>
                    {sub && (
                      <span className="ml-auto text-[#8B857D] dark:text-zinc-600 flex items-center gap-1">
                        缺货用 →
                        <span
                          className="h-3 w-3 rounded-sm border border-black/10 dark:border-white/10 inline-block"
                          style={{ backgroundColor: `rgb(${sub[0]},${sub[1]},${sub[2]})` }}
                        />
                      </span>
                    )}
                  </div>
                  )
                })}
              </div>
            </div>
            )
          })()}
        </aside>

        {/* 预览区 */}
        <section
          className={`relative flex min-h-[420px] items-center justify-center rounded-xl border-2 transition-colors ${
            dragOver
              ? 'border-amber-500 dark:border-fuchsia-500 bg-amber-50 dark:bg-fuchsia-500/10'
              : 'border-[#E5E0D8] dark:border-zinc-800 bg-[#F5F0EB] dark:bg-[#12121c]'
          }`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <div
            className="absolute inset-0 opacity-[0.15] dark:opacity-[0.35]"
            style={{
              backgroundImage:
                'repeating-conic-gradient(#E5E0D8 0% 25%, #F5F0EB 0% 50%)',
              backgroundSize: '24px 24px',
            }}
          />
          {source ? (
            <canvas
              ref={canvasRef}
              className="relative z-10 max-h-[70vh] max-w-full select-none"
              style={{ imageRendering: 'pixelated' }}
              onMouseDown={() => setShowOriginal(true)}
              onMouseUp={() => setShowOriginal(false)}
              onMouseLeave={() => setShowOriginal(false)}
              onTouchStart={() => setShowOriginal(true)}
              onTouchEnd={() => setShowOriginal(false)}
            />
          ) : (
            <p className="relative z-10 text-[#8B857D] dark:text-zinc-500">加载中…</p>
          )}

          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[#D4CDC3] dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/90 px-4 py-1.5 text-xs text-[#6B6560] dark:text-zinc-400 shadow-sm">
            <Eye className="h-3.5 w-3.5" />
            {showOriginal ? '原图' : '按住图片可查看原图'}
          </div>

          {dragOver && (
            <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
              <p className="font-mono text-lg font-bold text-amber-600 dark:text-fuchsia-300">松开鼠标导入图片</p>
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-[#E5E0D8] dark:border-zinc-800/80 py-6 text-center text-xs text-[#8B857D] dark:text-zinc-600 space-y-1">
        <p>图片 → 像素画 · 本地处理 · 不上传服务器</p>
        <p>
          反馈 & 联系：<a href="mailto:ejuer_z@163.com" className="text-[#6B6560] dark:text-zinc-500 hover:text-amber-600 dark:hover:text-fuchsia-400 transition-colors">ejuer_z@163.com</a>
          <span className="mx-2">·</span>
          <a href="https://ejuerz.com" className="text-[#6B6560] dark:text-zinc-500 hover:text-amber-600 dark:hover:text-fuchsia-400 transition-colors">ejuerz.com</a>
        </p>
      </footer>
    </div>
  )
}
