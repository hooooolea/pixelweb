<h1 align="center">像素画工坊</h1>

<p align="center">图片转像素画 · 拼豆图纸生成器 · 纯本地处理</p>

<p align="center">
  <a href="https://ejuerz.com/pixelweb/">在线使用</a>
  ·
  <a href="README-en.md">English</a>
</p>

<p align="center">
  <img src="screenshot-light.png" width="48%" />
  &nbsp;
  <img src="screenshot-dark.png" width="48%" />
</p>

## 功能

- 上传任意图片，一键转为像素画
- 7 种调色板：自动提取 / Game Boy / NES / 灰阶 / 复古棕褐 / 蒸汽波 / **拼豆 Perler**
- 拼豆模式使用官方 Perler 色卡真实 RGB 值，颜色匹配实体珠子
- **珠子数量统计** — 自动计算每种颜色需要多少颗珠子
- **限定用色** — 滑块限制颜色数，手头只有几色也能拼
- **缺色替换** — 每种颜色显示最接近的替代色
- **底板预览** — 叠加 29×29 标准拼豆底板网格
- 像素块 2px–64px 可调
- Floyd–Steinberg 抖动纹理
- 深色 / 浅色主题切换，自动记忆
- 所有处理在浏览器本地完成，图片不上传任何服务器
- 支持 1x / 2x / 4x 导出 PNG

## 拼豆模式

选择 **拼豆 Perler** 调色板 → 限定用色 → 开底板网格 → 下载 PNG，即可获得可直接对照拼制的图纸。每个像素块对应一颗珠子。

> 颜色数据来源：[Perler 官方色卡](https://oneimage.co/blogs/bead-brands-color-guide/)

## 技术栈

React 19 + TypeScript / Vite 7 / Tailwind CSS 3 + shadcn/ui / lucide-react / Floyd–Steinberg 抖动 + 中位切分颜色量化

## 本地开发

```bash
git clone https://github.com/hooooolea/pixelweb.git
cd pixelweb
npm install
npm run dev    # → http://localhost:3000
npm run build  # → dist/
```

## License

MIT · Made by [ejuer](https://ejuerz.com)
