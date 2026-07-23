<h1 align="center">Pixel Art Studio</h1>

<p align="center">Image to Pixel Art · Perler Bead Pattern Generator · 100% Client-Side</p>

<p align="center">
  <a href="https://ejuerz.com/pixelweb/">Live Demo</a>
  ·
  <a href="README.md">中文</a>
</p>

<p align="center">
  <img src="screenshot-light.png" width="48%" />
  &nbsp;
  <img src="screenshot-dark.png" width="48%" />
</p>

## Features

- Upload any image and convert to pixel art instantly
- 7 color palettes: Auto / Game Boy / NES / Grayscale / Sepia / Vaporwave / **Perler**
- Perler mode uses real Perler brand RGB values for printable bead patterns
- Adjustable pixel size from 2px to 64px
- Floyd–Steinberg dithering
- Grid overlay for bead-by-bead pattern making
- Dark / Light theme with auto-saved preference
- All processing is local — images never leave your device
- Export PNG at 1x / 2x / 4x resolution

## Perler Beads Mode

Select the **Perler** palette, enable grid lines, and download — you'll get a ready-to-use bead pattern. Every pixel maps to a real bead color.

> Colors sourced from the [official Perler color chart](https://oneimage.co/blogs/bead-brands-color-guide/)

## Tech Stack

React 19 + TypeScript / Vite 7 / Tailwind CSS 3 + shadcn/ui / lucide-react / Floyd–Steinberg dithering + median-cut quantization

## Local Dev

```bash
git clone https://github.com/hooooolea/pixelweb.git
cd pixelweb
npm install
npm run dev    # → http://localhost:3000
npm run build  # → dist/
```

## License

MIT · Made by [ejuer](https://ejuerz.com)
