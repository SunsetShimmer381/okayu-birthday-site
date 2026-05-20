# 项目 Review 报告

> 审查对象：`猫羽おかゆ お誕生日` 静态站点
> 审查范围：`index.html`、`assets/js/main.js`、`assets/css/style.css`、`novel_jp.txt`、`novel_zh.txt`
> 审查方式：纯代码审查，未修改任何本地文件

---

## 1. 整体架构、技术栈与文件依赖

### 1.1 技术栈

- 纯静态站点，无构建工具。HTML + CSS + 原生 ES Class JavaScript。
- 字体：通过 `@import` 引入 Google Fonts（Noto Sans JP）与 CDN 上的 LXGW WenKai。
- 资源：本地 `assets/{css,js,images,videos,audio}/`、根目录两个小说文本 `novel_jp.txt` / `novel_zh.txt`。
- 浏览器特性依赖：`fetch`、`IntersectionObserver`、`WeakMap`、`Promise/async`、`requestAnimationFrame`、CSS Grid / Flex / `clamp()` / `aspect-ratio` / `backdrop-filter`。

### 1.2 文件依赖关系

```
index.html
 ├─ <link>   assets/css/style.css      ← 唯一样式入口
 │           ├─ @import Noto Sans JP（Google Fonts CDN）
 │           └─ @import LXGW WenKai（jsDelivr CDN）
 ├─ <script> assets/js/main.js         ← 唯一脚本入口（页面尾部加载）
 │           └─ fetch('./novel_jp.txt') / fetch('./novel_zh.txt')
 ├─ <audio>  assets/audio/background_music.mp3
 │           assets/audio/background_music.ogg   ← 实际不存在，仅备用 source
 ├─ <img>    assets/images/*.webp
 └─ iframe   //player.bilibili.com/...（在 GiftModalController 动态注入）
```

### 1.3 `main.js` 模块组织

按 ES Class 分层，每个类自管 DOM / 事件 / 销毁。顶层在脚本加载时即实例化大部分类（不等待 `DOMContentLoaded`，因为 `<script>` 放在 `</body>` 前），而 `NovelLoader` / `GiftModalController` / `TimelineImageViewer` 在 `DOMContentLoaded` 时异步初始化。

| 类 | 职责 |
| --- | --- |
| `Utils` | HTML 转义、B 站 BV 号提取 |
| `CountdownController` | Page1 倒计时 |
| `ImageSlider` | Page1 立式照片自动轮播 |
| `NavController` | 顶部导航 + IntersectionObserver 高亮 |
| `DanmakuManager` / `DanmakuAutoPlayer` / `DanmakuSender` | 弹幕 |
| `MessageBoardRenderer` | Page5 留言卡片 |
| `MusicPlayer` / `DanmakuModeController` | 右下角两个圆形开关 |
| `SakuraEffect` | 樱花飘落背景 |
| `ScrollHintController` | 滚动提示 |
| `NovelLoader` / `NovelSyncController` | **Page6 中日小说加载与同步** |
| `GiftModalController` / `TimelineImageViewer` | 模态浮层 |

### 1.4 顺便发现的几个"非主线"代码隐患

- `index.html:31` 多了一个闭合标签 `</audio></audio>`（无效 HTML，但浏览器容错）。
- `index.html:30` 备用 `background_music.ogg` 在 `assets/audio/` 中并不存在。
- **5 个内联 `onclick` 引用的全局函数全部不存在**（`main.js` 已没有 `toggleMusic / toggleDanmaku / nextImage / openVideoModal / closeVideoModal`）：
  - `toggleMusic` / `toggleDanmaku` —— 因 `MusicPlayer` 与 `DanmakuModeController` 自己又用 `addEventListener('click', ...)` 重复绑定了一次，**功能仍能工作**，但每次点击控制台都会抛 `ReferenceError`。
  - `nextImage` —— `ImageSlider` 只暴露了 `next()` 实例方法，并未挂到 `window`。`index.html:98` 点击立式照片的"手动切换"已**彻底失效**，只剩自动轮播。
  - `openVideoModal` / `closeVideoModal` —— Page4 的 6 张视频卡片全部依赖此函数，**点击会抛错且模态框不会打开**。这是页面级 Bug。
- `DanmakuSender` 引用的 `danmakuName / danmakuText / danmakuSend / messagesBox` 在当前 HTML 里全部不存在，整个类相当于死代码（构造时打 warning 后退出）。

---

## 2. 「小说中日双语切换 / 对照」功能定位与失效原因

### 2.1 代码定位

- HTML：`index.html:500-520` 渲染 `#novelJapanese` / `#novelChinese` 两栏。
- CSS：`assets/css/style.css:1292-1414`（`.novel-container / .novel-content / .novel-paragraph.highlighted` 等）。
- 实际"切换 / 对照"不是按钮切换，而是**鼠标悬停**触发的左右联动：
  - **加载**：`main.js:905-965` `NovelLoader.load() → formatNovelText()`，对每行用正则 `^([\d]+)[.、:：]\s*` 抽出行首数字作为 `data-serial`。
  - **同步**：`main.js:967-1066` `NovelSyncController`，构建 `jpSerialMap / zhSerialMap`（key = serial 字符串，value = 段落 DOM），`mouseenter` 时通过相同的 serial 在对侧查找并 `classList.add('highlighted')` + `scrollTo`。

### 2.2 当前为什么会失效（潜在 Bug 列表）

#### Bug A —— 源数据已经"对不齐"了（最直接的失效原因）

两个 txt 都用手工编号 `1.`、`2.` … `238.`，**但中文文件比日文少了一行内容**，从酒馆场景开始整体错位了一行：

- `novel_jp.txt:159` = `「何だ、ただのぼんやり娘か！...」`
- `novel_zh.txt:158` = `"什么嘛，原来是个呆头呆脑的小姑娘！..."`（对应 JP-159）
- `novel_zh.txt:159` = `"猫羽粥在心里吐槽（好可怕的大人……）..."`（其实对应 JP-160）
- 从 `novel_zh.txt:160` 开始一直是空白省略号行 `……`，比 JP 文件少了一行；之后 161-238 整体**错位 1**。

结果：当你 hover 日文第 172 段 `「お嬢ちゃん、魔術師に興味があるのかい？」`，代码按 serial `172` 在中文 map 里找到的却是 `"巫师……"猫羽粥喃喃道。`（实际对应日文 171）。两边 serial 数字相同但语义不同，**于是高亮和滚动看上去就"乱跳"**——这跟 commit message 里写的"双语索引未正常匹配（等待整本小说上传后修正）"完全吻合。

#### Bug B —— 匹配策略本身过于脆弱

`NovelSyncController` 完全依赖"两个文件里同一个数字 = 同一个段落"这一**强不变量**，但代码里没有任何校验：

- 没有比较两个 map 的 key 集合是否一致；
- 没有比较两个文件的段落总数；
- 一旦某个数字只在一边出现，hover 时只是静默 `targetSerialMap.has(serial) === false`，没有任何降级（既不报警告，也不退回到"按段落 index"匹配）。

#### Bug C —— 序号正则的边界

`formatNovelText()` 里：

```js
const serialMatch = trimmedText.match(/^([\d]+)[.、:：]\s*/);
```

- `[\d]+` 只接受 ASCII 数字，不接受全角数字（`１．` 这种就会丢 serial）。
- 分隔符里漏了中文句号 `。` 和全角句点 `．`。
- 反过来又过于宽松：任何以"数字 + 上述标点"开头的句子都会被吃成 serial。例如正文里写"1995年那场战争"被错写成"1995. 那场战争"就会被当作 serial=1995，并把 `"1995. "` 从正文中删掉。

#### Bug D —— `formatNovelText` 把 `cleanedText` 直接拼进 `innerHTML`，没有走 `Utils.escapeHtml`

源文件是本地 `.txt`，目前没有真正的 XSS 风险，但破坏了项目其他模块（`DanmakuManager`、`MessageBoardRenderer`）一致的转义约定。如果以后 txt 里出现 `<` `&` 等字符，会导致渲染异常或被当作标签解析。

#### Bug E —— "离开小说区域时清空高亮"那段事件监听写错了

```js
document.addEventListener('mouseleave', (e) => { ... }, true);
```

`mouseleave` **不冒泡**，即使加 `capture: true`，document 上的 `mouseleave` 也只会在**鼠标真正离开整个文档 / 窗口**时触发一次，所以这段"离开就清高亮"基本永远不会按预期跑（在页面内随意移动鼠标，高亮不会被这段逻辑清掉）。正确写法应监听 `.novel-container` 的 `mouseleave`（或者用 `mouseout` + 检查 `relatedTarget`）。

#### Bug F —— 移动端根本触发不了同步

联动唯一的入口是 `mouseenter`，触屏上不会稳定触发；又没有任何手动语言切换按钮（标题只是装饰用的 `<span class="novel-lang">`），所以在手机上**完全没法对照阅读**——这同时也是 §3 的一部分。

---

## 3. 移动端（手机端）适配问题

整体响应式做了一些断点（768 / 900 / 950 / 480），但漏洞不少。

### 3.1 严重问题

1. **导航条在小屏会被挤出屏幕。**
   `.nav` 用了 `white-space: nowrap` + `transform: translateX(-50%)`，里面有 7 个 nav-item + 6 个分隔符。`@media (max-width: 768px)` 仅把字号降到 11px、padding 减到 4-6px，但**没有横向滚动 / 没有换行 / 没有汉堡菜单**。在 360-375px 屏幕上整条会超出视口，左右边的"プロローグ / 謝辞"会被裁掉。

2. **Page4 视频卡片在任何端都点不开**（见 §1.4 的 `openVideoModal` Bug）—— 不是 CSS 问题，但在手机端更致命，因为桌面端至少能 hover 看到指针样式。

3. **Page6 小说对照功能在手机上完全不可用**（见 Bug F）。同时移动端断点把 `.novel-content` 强制压到 `max-height: 300px`，再叠加无切换按钮，等于"中日两栏各得一个 300px 高小框，且无法联动"。

4. **手动切换照片在手机端也失效**（见 §1.4 的 `nextImage` Bug）。`.click-hint` 文案"点击切换"在触屏上反而具有误导性。

### 3.2 偏严重的样式 / 布局问题

5. **`body { padding-top: 80px }` 在 768px 以下没收窄。**
   断点里把 `.nav` 自己变矮了，但 body 顶部还预留 80px，首屏文字上方留白过多。

6. **`.page { padding: 100px 24px }` 在任何断点都没缩。**
   手机上首屏可见区域被 100+100=200px 内边距吞掉，名字、倒计时挤在屏幕中段一小条。

7. **倒计时 `repeat(4, 1fr)` + 每格 `min-width: 70px`。**
   4×70 + 3×gap(10) = 310px。一旦在 page1 左栏宽度小于 ≈330px（小屏 + 父级 padding）就会撑破栅格、横向溢出。没有"小屏改 2×2"的回退。

8. **`.danmaku-container { height: 60vh }`（默认模式甚至 100vh 全屏）在手机上太遮挡。**
   完全没有 mobile 媒体查询。手机上首页打开就是大半屏弹幕在飘，加上 `.control-buttons` 在右下、`.scroll-hint` 在中下、`.portrait-card` 在中段，UI 拥挤。

9. **Timeline tooltip 在 ≤900px 重新定位到 `top: -220px`。**
   小屏上由于 tooltip 有 200px 宽 + 图片 120px 高 + caption，整体高度容易超出元素顶部到屏幕顶部的距离，导致 tooltip 漂到导航栏后面甚至被裁。同时 tooltip 依赖 `:hover`，触屏上根本不出现，目前只靠 `TimelineImageViewer` 截击了 `.tooltip-image` 的 click，但 `.tooltip-image` 在没 hover 时 `opacity: 0; visibility: hidden; pointer-events: none`——所以触屏用户**根本看不到也点不到放大入口**。

10. **`.video-modal` 即使在 768px 下还是 `width: 95%; max-width: 960px`，aspect-ratio 又写在 `padding-top: 56.25%`。**
    在 360px 屏幕上视频高度约 192px，下方还有 `padding: 16px 20px` 的标题区。能看，但偏小；同时没有横屏方向时切换全屏按钮的桥接（iframe 自带的全屏按钮在 iOS WebView 偶尔被禁）。

11. **`.info-row` 始终是 `display: flex; justify-content: space-between` + `info-value { text-align: right }`。**
    "デビュー日 / 2026年4月18日"这种行勉强能挤一行，但"发色 / 瞳色 / 白/粉发 · 红瞳"这种值偏长时，flex 不允许换行——会被截或撑爆容器。手机端没有"label 一行、value 下一行"的栈式布局。

12. **`.gift-grid` 只在 ≤768px 改成 1 列，但 `.gift-item` 内 `.sticker`（绝对定位贴纸）和 `.tape` 在小屏没动位置 / 尺寸——容易盖在 `.gift-title` 上。**

### 3.3 偏代码层（已写过但还有漏洞）

13. **断点散落，互相覆盖关系隐式。**
    `@media (max-width: 768px)` 出现了 5 次（452 / 1103 / 1416 / 1746 / 2236），`950px`、`900px`、`480px` 各 1-2 次，相同断点没有合并，容易导致 Page2 的 `.profile-container` 在 950px 已经变成单列、又在 768px 重复改成单列。优先级靠书写顺序 + 特异性，未来增改极易踩坑。

14. **页面 `<meta viewport>` 已经写了 `width=device-width, initial-scale=1.0`，是对的；但全站没有 `overflow-x: hidden` 兜底**，配合 §3.1.1 的 nav 溢出和 §3.2.7 的倒计时溢出，在手机上很容易出现整页可横向滚动。

15. **Touch 设备没有任何 `(hover: hover)` / `(pointer: fine)` 兜底**：所有靠 `:hover` 触发的内容（timeline tooltip、portrait-card click-hint、novel 同步、video-card 上浮阴影）在手机上都退化为不可用或不可见。

---

## 4. 总结

- **架构清晰**：单 HTML + 单 CSS + 单 JS，类化组织合理，但部分类（`DanmakuSender`）已是死代码、几个 `onclick` 全局函数被重构后没清理，**Page4 的视频弹窗、Page1 的手动切图在生产上是直接坏的**。
- **小说对照失效**的根因是**手工对齐的 serial 在中文文件第 159 行附近少了一行就连锁错位**；代码层面则缺少校验、降级、对触屏的支持，以及 `document mouseleave` 那个不会触发的清理逻辑也是个隐藏 Bug。
- **移动端**有响应式雏形，但首屏 padding 不收、nav 易溢出、倒计时 4 列硬撑、小说与时间线高度依赖 hover、Page4 视频卡点不开——综合起来手机访问体验明显劣化。

### 建议的修复优先级

1. 补回 / 恢复 5 个 `onclick` 对应的全局函数，或改用 `addEventListener` 重写绑定；
2. 小说同步改成"先按 paragraph index 1:1 对齐，再用 serial 兜底"，并在加载完成后做对齐校验，错位时给出 warning；
3. 导航与 Page padding 在 ≤768px 收窄，倒计时改 2×2，并在 `body` 上加 `overflow-x: hidden`；
4. 给 hover 类交互（timeline tooltip、novel 同步、portrait 切换）加 `click / touchstart` fallback。
