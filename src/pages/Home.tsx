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
  ImagePlus,
  LayoutGrid,
  Moon,
  Palette,
  RefreshCw,
  Sparkles,
  Sun,
  Upload,
  Waves,
} from 'lucide-react'
import {
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

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const resultCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [colorCounts, setColorCounts] = useState<BeadCount[]>([])

  useEffect(() => {
    setSource(createSampleImage())
  }, [])

  useEffect(() => {
    if (!source || !canvasRef.current) return
    const result = pixelate(source, opts)
    resultCanvasRef.current = result.canvas
    setColorCounts(result.colorCounts)

    const view = canvasRef.current
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
  }, [source, opts, showOriginal])

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
            <p className="hidden font-mono text-xs text-[#8B857D] dark:text-zinc-500 sm:block">
              图片 → 像素画 · 本地处理 · 不上传服务器
            </p>
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
              <ImagePlus className="h-4 w-4 text-amber-600 dark:text-fuchsia-400" />
              图片
            </div>
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
                if (f) loadFile(f)
                e.target.value = ''
              }}
            />
            <p className="mt-2 truncate text-center text-xs text-[#8B857D] dark:text-zinc-500">
              当前：{fileName}
              {isSample && '（可替换）'}
            </p>
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
        <p>像素画工坊 · 所有处理均在浏览器本地完成，图片不会离开你的设备</p>
        <p>
          反馈 & 联系：<a href="mailto:ejuer_z@163.com" className="text-[#6B6560] dark:text-zinc-500 hover:text-amber-600 dark:hover:text-fuchsia-400 transition-colors">ejuer_z@163.com</a>
          <span className="mx-2">·</span>
          <a href="https://ejuerz.com" className="text-[#6B6560] dark:text-zinc-500 hover:text-amber-600 dark:hover:text-fuchsia-400 transition-colors">ejuerz.com</a>
        </p>
      </footer>
    </div>
  )
}
