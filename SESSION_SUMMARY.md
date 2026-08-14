# Session Summary — pixelweb（像素画工坊）

> 最近更新：2026-08-14

## 项目是什么

图片转像素画 + 拼豆（Perler）图纸生成器。纯前端，所有处理在浏览器本地完成，图片不上传服务器。

- 线上地址：https://ejuerz.com/pixelweb/
- 源码仓库：https://github.com/hooooolea/pixelweb
- 部署方式：构建产物 `dist/` 拷贝到 Astro 博客仓库 `ejuerz-ai-blog` 的 `public/pixelweb/`，随 Cloudflare Pages 一起发布

## 技术栈

React 19 + TypeScript + Vite 7 + Tailwind CSS 3 + shadcn/ui + lucide-react

## 文件结构

```
src/
├── lib/pixel.ts        # 像素化引擎（核心算法，约 534 行）
├── pages/Home.tsx      # 主页面（UI 全部，约 668 行）
├── components/ui/      # 5 个 shadcn 组件：button/label/select/slider/switch
├── App.tsx             # 路由（单页 / 路由到 Home）
└── main.tsx            # 入口 + BrowserRouter basename="/pixelweb"
```

## 核心功能

### 图片模式
- 上传图片 → 像素化（降采样 → 调色板量化 → 最近邻放大）
- 7 种调色板：自动提取 / Game Boy / NES / 灰阶 / 复古棕褐 / 蒸汽波 / **拼豆 Perler**
- 像素块大小 2-64px、Floyd–Steinberg 抖动纹理

### 文字模式（图片/文字 切换）
- 输入文字（支持换行）→ 渲染成像素网格
- 6 种配色：黑白/彩虹/莫兰迪/对比色/糖果色/森林
- `TEXT_SCALE = 8`：文字按 `textSize * 8` 渲染，再以 `pixelSize=8` 像素化，让 textSize 直接对应输出字符高度

### 拼豆专用功能
- 珠子用量统计（每种颜色数量 + 百分比）
- 限定用色（滑块限制到前 N 种颜色）
- 缺色替换（每种颜色标注最近替代色）
- 底板预览（29×29 标准拼豆板网格 + 板位坐标）
- 色号标注（像素块上叠加色号数字，深浅色自动切换黑白字）

## 调色板数据结构（Kimi 改动重点）

`pixel.ts` 中 `PaletteColor` 接口：

```ts
interface PaletteColor {
  name: string   // 颜色名，如 "Black 黑色"
  color: RGB     // [r,g,b]
  code?: string  // 拼豆色号，如 "P18"、"P01"
}
```

Perler 调色板 34 种颜色，每个都带真实色号 code（P18 黑、P01 白、P05 红…），来源 Perler 官方色卡。

## Kimi 最近的改动

1. **`pixel.ts`**：新增 `PaletteColor` 接口，`PALETTES` 从 `RGB[]` 改为 `PaletteColor[]`，Perler 色卡加了真实色号 code 和颜色名
2. **`Home.tsx`**：
   - 新增 `TEXT_SCALE = 8`，文字/图片统一走 `pixelate` 管线（删掉了之前单独的文字渲染路径）
   - 彩虹等配色改用「文本哈希种子」确定性分配颜色（可复现，不再每次随机）
   - 色块 tooltip 显示 `name · code`，颜色统计面板显示色号

## 我本次修复

Kimi 留下 2 个 TS 报错（auto 调色板映射缺 `code` 字段），已补 `code: undefined` 修复，`npm run build` 通过。

## 已知事项 / 待办

- **部署同步**：改完 pixelweb 源码后，需 `npm run build` → `cp -r dist/* ../ejuerz-ai-blog/public/pixelweb/` → 两个仓库分别 push
- **Cloudflare 缓存**：改动生效慢，经常要手动 Purge Cache（`https://ejuerz.com/pixelweb/`）
- Astro 博客 `tsconfig.json` 已把 `public/pixelweb` 排除，避免 astro check 扫描压缩 JS 超时
- README.md（中文）+ README-en.md（英文）已写好，注意同步新功能

## 两个仓库

| 仓库 | 作用 |
|------|------|
| `hooooolea/pixelweb` | 工具源码（React/Vite） |
| `hooooolea/ejuerz-ai-blog` | Astro 博客，托管 `/pixelweb/` 构建产物 |
