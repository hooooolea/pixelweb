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
  ImagePlus,
  Palette,
  RefreshCw,
  Sparkles,
  Upload,
  Waves,
} from 'lucide-react'
import {
  createSampleImage,
  pixelate,
  PALETTES,
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
]

const DEFAULTS: PixelOptions = {
  pixelSize: 12,
  colorCount: 16,
  palette: 'auto',
  dither: false,
  grid: false,
}

export default function Home() {
  const [source, setSource] = useState<HTMLImageElement | HTMLCanvasElement | null>(null)
  const [fileName, setFileName] = useState('示例图片')
  const [isSample, setIsSample] = useState(true)
  const [opts, setOpts] = useState<PixelOptions>(DEFAULTS)
  const [showOriginal, setShowOriginal] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [exportScale, setExportScale] = useState('1')

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const resultCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 初始加载示例图
  useEffect(() => {
    setSource(createSampleImage())
  }, [])

  // 参数或图片变化时重新渲染
  useEffect(() => {
    if (!source || !canvasRef.current) return
    const result = pixelate(source, opts)
    resultCanvasRef.current = result

    const view = canvasRef.current
    const maxW = view.parentElement?.clientWidth ?? 800
    const scale = Math.min(1, maxW / result.width)
    view.width = Math.round(result.width * scale)
    view.height = Math.round(result.height * scale)
    const ctx = view.getContext('2d')!
    ctx.imageSmoothingEnabled = false
    if (showOriginal) {
      ctx.drawImage(source, 0, 0, view.width, view.height)
    } else {
      ctx.drawImage(result, 0, 0, view.width, view.height)
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
    <div className="min-h-screen bg-[#0d0d14] text-zinc-100">
      {/* 顶栏 */}
      <header className="border-b border-zinc-800/80 bg-[#0d0d14]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 grid-cols-2 overflow-hidden rounded-sm">
              <span className="bg-fuchsia-500" />
              <span className="bg-cyan-400" />
              <span className="bg-amber-400" />
              <span className="bg-lime-400" />
            </div>
            <div>
              <h1 className="font-mono text-lg font-bold tracking-widest">像素画工坊</h1>
              <p className="text-xs text-zinc-500">PIXEL ART STUDIO</p>
            </div>
          </div>
          <p className="hidden font-mono text-xs text-zinc-500 sm:block">
            图片 → 像素画 · 本地处理 · 不上传服务器
          </p>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[320px_1fr]">
        {/* 控制面板 */}
        <aside className="space-y-5">
          <div className="rounded-none border border-zinc-800 bg-zinc-900/60 p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-300">
              <ImagePlus className="h-4 w-4 text-fuchsia-400" />
              图片
            </div>
            <Button
              variant="outline"
              className="w-full rounded-none border-dashed border-zinc-700 bg-transparent hover:border-fuchsia-500 hover:bg-fuchsia-500/10"
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
            <p className="mt-2 truncate text-center text-xs text-zinc-500">
              当前：{fileName}
              {isSample && '（可替换）'}
            </p>
          </div>

          <div className="space-y-5 rounded-none border border-zinc-800 bg-zinc-900/60 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              像素参数
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-zinc-400">像素块大小</Label>
                <span className="font-mono text-xs text-fuchsia-400">{opts.pixelSize}px</span>
              </div>
              <Slider
                min={2}
                max={64}
                step={1}
                value={[opts.pixelSize]}
                onValueChange={([v]) => set('pixelSize', v)}
              />
              <p className="text-[11px] text-zinc-600">越大越抽象，越小越细腻</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-zinc-400">
                  <Palette className="mr-1 inline h-3 w-3" />
                  调色板
                </Label>
              </div>
              <Select value={opts.palette} onValueChange={(v) => set('palette', v as PaletteId)}>
                <SelectTrigger className="rounded-none border-zinc-700 bg-zinc-950">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none border-zinc-700 bg-zinc-900">
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
                      className="h-4 w-4 border border-black/40"
                      style={{ backgroundColor: `rgb(${c[0]},${c[1]},${c[2]})` }}
                    />
                  ))}
                </div>
              )}
            </div>

            {opts.palette === 'auto' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-zinc-400">颜色数量</Label>
                  <span className="font-mono text-xs text-fuchsia-400">{opts.colorCount} 色</span>
                </div>
                <Slider
                  min={2}
                  max={64}
                  step={1}
                  value={[opts.colorCount]}
                  onValueChange={([v]) => set('colorCount', v)}
                />
              </div>
            )}

            <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
              <Label className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Waves className="h-3 w-3" />
                抖动纹理 (Dithering)
              </Label>
              <Switch checked={opts.dither} onCheckedChange={(v) => set('dither', v)} />
            </div>

            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Grid3X3 className="h-3 w-3" />
                显示网格线
              </Label>
              <Switch checked={opts.grid} onCheckedChange={(v) => set('grid', v)} />
            </div>
          </div>

          <div className="space-y-3 rounded-none border border-zinc-800 bg-zinc-900/60 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
              <Download className="h-4 w-4 text-lime-400" />
              导出
            </div>
            <div className="flex gap-2">
              <Select value={exportScale} onValueChange={setExportScale}>
                <SelectTrigger className="w-24 rounded-none border-zinc-700 bg-zinc-950">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none border-zinc-700 bg-zinc-900">
                  <SelectItem value="1">1x</SelectItem>
                  <SelectItem value="2">2x</SelectItem>
                  <SelectItem value="4">4x</SelectItem>
                </SelectContent>
              </Select>
              <Button
                className="flex-1 rounded-none bg-fuchsia-600 font-semibold hover:bg-fuchsia-500"
                onClick={download}
              >
                <Download className="mr-2 h-4 w-4" />
                下载 PNG
              </Button>
            </div>
            <Button
              variant="ghost"
              className="w-full rounded-none text-zinc-500 hover:text-zinc-200"
              onClick={() => setOpts(DEFAULTS)}
            >
              <RefreshCw className="mr-2 h-3 w-3" />
              重置参数
            </Button>
          </div>
        </aside>

        {/* 预览区 */}
        <section
          className={`relative flex min-h-[420px] items-center justify-center rounded-none border-2 transition-colors ${
            dragOver
              ? 'border-fuchsia-500 bg-fuchsia-500/10'
              : 'border-zinc-800 bg-[#12121c]'
          }`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {/* 棋盘格背景 */}
          <div
            className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                'repeating-conic-gradient(#1a1a26 0% 25%, #12121c 0% 50%)',
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
            <p className="relative z-10 text-zinc-500">加载中…</p>
          )}

          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-zinc-700 bg-zinc-950/90 px-4 py-1.5 text-xs text-zinc-400">
            <Eye className="h-3.5 w-3.5" />
            {showOriginal ? '原图' : '按住图片可查看原图'}
          </div>

          {dragOver && (
            <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
              <p className="font-mono text-lg font-bold text-fuchsia-300">松开鼠标导入图片</p>
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-zinc-800/80 py-6 text-center text-xs text-zinc-600 space-y-1">
        <p>像素画工坊 · 所有处理均在浏览器本地完成，图片不会离开你的设备</p>
        <p>
          反馈 & 联系：<a href="mailto:ejuer_z@163.com" className="text-zinc-500 hover:text-fuchsia-400 transition-colors">ejuer_z@163.com</a>
          <span className="mx-2">·</span>
          <a href="https://ejuerz.com" className="text-zinc-500 hover:text-fuchsia-400 transition-colors">ejuerz.com</a>
        </p>
      </footer>
    </div>
  )
}
