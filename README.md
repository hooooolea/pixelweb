<p align="center">
  <img src="public/favicon.svg" width="80" alt="Pixel Art Studio" />
</p>

<h1 align="center">🎨 像素画工坊 · Pixel Art Studio</h1>

<p align="center">
  Free online tool to turn any image into pixel art / Perler bead patterns.
  <br/>
  All processing happens locally in your browser — zero uploads, zero servers.
</p>

<p align="center">
  <a href="https://ejuerz.com/pixelweb/"><strong>🔗 ejuerz.com/pixelweb</strong></a>
</p>

<p align="center">
  <img src="screenshot-light.png" width="48%" alt="Light mode" />
  &nbsp;
  <img src="screenshot-dark.png" width="48%" alt="Dark mode" />
</p>

---

## ✨ Features

- 🖼️ **Image → Pixel Art** — upload any photo, get pixel art instantly
- 🎨 **7 Color Palettes** — Auto-extract / Game Boy / NES / Grayscale / Sepia / Vaporwave / **Perler (拼豆)**
- 🧩 **Perler Beads Mode** — real Perler brand RGB values, perfect for fuse bead patterns
- 🎚️ **Pixel Size** — adjustable from 2px to 64px
- 🌊 **Dithering** — Floyd–Steinberg dithering for retro texture
- 📐 **Grid Overlay** — toggle grid lines, ideal for bead-by-bead pattern making
- 🌗 **Dark / Light Theme** — one-click toggle with localStorage persistence
- 🔒 **100% Private** — everything runs client-side, images never leave your device
- 📦 **Export** — download as PNG at 1x / 2x / 4x resolution

---

## 📸 Screenshots

| Light Mode | Dark Mode |
|-----------|----------|
| ![Light](screenshot-light.png) | ![Dark](screenshot-dark.png) |

---

## 🧵 Perler Beads Mode (拼豆)

Select the **拼豆 Perler** palette + enable grid lines → download → you have a printable Perler bead pattern. Every pixel maps to a real bead color.

> Colors sourced from the [official Perler color chart](https://oneimage.co/blogs/bead-brands-color-guide/).

---

## 🛠️ Tech Stack

- React 19 + TypeScript
- Vite 7
- Tailwind CSS 3 + shadcn/ui
- lucide-react icons
- Floyd–Steinberg dithering + median-cut color quantization

---

## 🚀 Local Development

```bash
git clone https://github.com/hooooolea/pixelweb.git
cd pixelweb
npm install
npm run dev
# → http://localhost:3000
```

```bash
npm run build   # production build → dist/
```

---

## 📄 License

MIT

---

<p align="center">
  Made by <a href="https://ejuerz.com">ejuer</a> · <a href="mailto:ejuer_z@163.com">ejuer_z@163.com</a>
</p>

---

# 🇨🇳 中文

## 🎨 像素画工坊

免费在线图片转像素画 / 拼豆图纸工具。所有处理在浏览器本地完成，图片不上传任何服务器。

**🔗 [ejuerz.com/pixelweb](https://ejuerz.com/pixelweb/)**

---

## ✨ 功能

- 🖼️ 上传任意图片，一键转像素画
- 🎨 7 种调色板：自动提取 / Game Boy / NES / 灰阶 / 复古棕褐 / 蒸汽波 / **拼豆 Perler**
- 🧩 **拼豆模式** — 使用官方 Perler 色卡真实 RGB 值，生成可打印的拼豆图纸
- 🎚️ 像素块 2px–64px 随意调节
- 🌊 Floyd–Steinberg 抖动纹理
- 📐 网格线开关，做拼豆图纸必备
- 🌗 深色 / 浅色一键切换，自动记忆偏好
- 🔒 纯本地处理，拖进去→转完→下载，关了网页啥也不留
- 📦 支持 1x / 2x / 4x 高清导出 PNG

---

## 🧵 拼豆模式

选择 **拼豆 Perler** 调色板 + 开启网格线 → 下载 PNG → 就是一张可以直接对照着拼的图纸。每个像素块对应一颗珠子，颜色完全匹配 Perler 实体色卡。

> 颜色数据来源：[Perler 官方色卡](https://oneimage.co/blogs/bead-brands-color-guide/)

---

## 🚀 本地开发

```bash
git clone https://github.com/hooooolea/pixelweb.git
cd pixelweb
npm install
npm run dev    # http://localhost:3000
npm run build  # 生产构建 → dist/
```

---

## 📄 协议

MIT

---

<p align="center">
  Made by <a href="https://ejuerz.com">ejuer</a> · <a href="mailto:ejuer_z@163.com">ejuer_z@163.com</a>
</p>
