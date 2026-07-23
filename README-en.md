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

## Core Features

- Upload any image, convert to pixel art instantly
- 7 palettes: Auto / Game Boy / NES / Grayscale / Sepia / Vaporwave / Perler
- Pixel size adjustable from 2px to 64px
- Floyd–Steinberg dithering
- Pixel grid overlay
- Dark / Light theme with auto-saved preference
- 100% client-side — images never leave your device
- Export PNG (1x / 2x / 4x)

## Perler Beads Mode

Select the **Perler** palette to unlock the following. Color data from [official Perler color chart](https://oneimage.co/blogs/bead-brands-color-guide/):

- **Bead Count** — auto-calculates how many beads of each color you need
- **Color Limiter** — restrict to top N colors with a slider
- **Color Substitution** — shows nearest alternative when a color runs out
- **Board Preview** — 29×29 standard Perler board grid with coordinates

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
