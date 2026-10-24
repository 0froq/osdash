---
title: Paper
designStatus: ai-draft
description: 浅色是纤维，深色是颗粒。每一档都可以关掉。
props:
  - name: light
    type: boolean
    default: "true"
    description: 页面为浅色时画纤维。
  - name: dark
    type: boolean
    default: "true"
    description: 页面为深色时画颗粒。
slots:
  - name: default
    description: 纹理上面的内容。
---

Paper 把纸面纹理铺在它所包住的容器里。浅色是纤维，深色是颗粒。`light` 或 `dark` 设为 `false` 就卸掉那一档。纹理跟着页面主题走（文档上的 `data-theme`，或 `dark` 类）。

## 用法

```vue
<script setup lang="ts">
import { Paper } from '@froq/ui'
</script>

<template>
  <Paper class="ui">
    <p>落在这张纸上。</p>
  </Paper>
</template>
```

## 页面墨迹与手写

`@froq/ui/core` 还导出 `createInkWash`、`createPenStroke`、`layoutHandwriting`、`signatureEllipse`、`createPaperPaint`。`@froq/ui/vue` 的 `usePaperSignature` 等待字体和 DOM 稳定，250 ms 后启动墨点、900 ms 后启动笔线，卸载时清理画布、探针、observer、动画帧和计时器。它不添加文档 class，不拥有页面文案。

`usePaperSignature(root, options)` 的参数：

- `root`：页面元素 ref。页面需要定位及独立层叠上下文，例如 `position: relative; z-index: 0`；笔线画布位于内部 z-index -1，不应裁切。
- `anchors()`：由调用方提供可选的 `mark`、`rule`、`hand`、`handText`、`finalMark`、`finalSection`、`finalBand`（与终止符同高、不含文字的空带，笔从这里横穿而不是沿页边下行）、`margin`，以及 `sections`（每项为 `element`、`label`、可选 `price`）。宽度小于 860 px 时跨段抬笔，真实内容尺寸变化后重新读取锚点。
- `colors()`：宿主 token 解析后的六位 HEX `{ paper, ink, accent, dark }`。引擎接收已解析的数据，不读项目 CSS 变量。
- `mixColors(first, weight, second)`：宿主调色函数，weight 是第一种颜色的比例。LiG 继续传原有 OKLab 混色函数，保持原来的墨色。
- `settings()`：`paper`、`bloom`、`line`、`hand` 默认 true；`dwellAfter` 为秒，默认 0；`click` 默认 false。布局稳定后读取一次，修改设置需重新挂载。
- `animate` 默认 true，按时间把墨迹画出。关掉则直接画完。系统开启减少动态效果时也同样直接画完。
- `marks()` 返回独立的西文墨迹（`text`，再加 `element` 或文档坐标 `box`）。每一笔之前抬笔，所以它不属于页面路线。手写字体没有的字符按空格前进，不留笔画。不传 `marks` 时路线与原来一样。
- `tremor`、`roundJoins`、`fadeRoute` 默认 true。`continuePastHand` 默认 true，关掉后标语就是它自己的墨迹。`labels` 为 `ring` 或 `line`，默认 `ring`。

返回只读 `state`（`paper`、`bloom`、`stroke`、`hand`）及 `setColors(colors?)`。改变布局的状态需在笔迹测量前同步应用，例如 `watch(signature.state, applyFallbackClasses, { flush: 'sync' })`；延迟到模板更新后再改变手写文字的位置会造成测量错位。仅在对应状态成功启用后隐藏原排版的文字、分隔线或标点，DOM 文本继续作为无障碍内容和失败回退。宿主主题更新后调用 `setColors()`。WebGL2 不可用时保留原标点，2D context 不可用时保留原文字和分隔线；减少动态效果时直接完成笔迹及墨点。

墨点画布位于 body 下方，是**页面级**图层。每页只挂载一个协调器，宿主控制透明背景及页面转场。`Paper` 的不透明背景适合局部纸纹，会遮住 body 墨点；LiG 保留读取文档底色的页面包装，复用库的 `createPaperPaint`。

```ts
import { usePaperSignature } from '@froq/ui/vue'

const signature = usePaperSignature(page, {
  colors: readResolvedPalette,
  mixColors: mixPaletteColors,
  anchors: () => ({
    mark: firstStop.value,
    hand: tagline.value,
    handText: taglineCopy,
    rule: rule.value,
    sections: sectionAnchors,
    finalMark: lastStop.value,
    finalSection: lastSection.value,
    margin: firstLabel.value,
  }),
})
watch(theme, async () => {
  await nextTick()
  signature.setColors()
})
```

### 移动端稳定性

两个引擎共用文档坐标画布切片，保留 160 px overscan 和量化原点；位图尺寸未变化时不重新赋值，避免画布被清空。浏览器工具栏伸缩只更新画布切片，不重建笔迹。ResizeObserver 仅在页面实际内容尺寸变化时重建路径，并保留当前段进度和已完成状态。宿主布局应继续使用稳定视口单位。

这里不以 UI 自动化验证移动端效果。请手动检查快速双向滚动、工具栏伸缩、旋转屏幕、书写中切主题、末尾墨点、减少动态效果、context 不可用及延迟启动前卸载。EMS Allure 字形数据及 SIL OFL 声明随包放在 `core/signature`。
