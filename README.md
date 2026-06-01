# 猫羽おかゆ お誕生日 — 应援纪念页

为 VTuber **猫羽おかゆ**（Nekoha Okayu / 白粥）制作的生日应援单页网站，包含粉丝留言弹幕、音乐播放、精选切片、数字礼物、同人小说等模块。

---

## 页面结构

共 7 个全屏板块（`section.page`），通过桌面端顶部导航栏与移动端底部导航栏切换。

| 页面 | ID | 名称 | 内容 |
|------|-----|------|------|
| Page 1 | `#page1` | プロローグ | 生日倒计时、主视觉照片轮播、向下滚动提示 |
| Page 2 | `#page2` | アーカイブ | 基本情报卡片、人物设定、爱称、饮食喜好、日常用语 |
| Page 3 | `#page3` | 軌跡 | 出道至今六段大事记时间线（含悬浮图片与视频链接） |
| Page 4 | `#page4` | コメント | 精选切片视频网格（猫的动静 / 猫的歌声，含"查看更多"折叠） |
| Page 5 | `#page5` | メッセージ | 粉丝留言卡片（分页浏览，中日双语翻转切换） |
| Page 6 | `#page6` | デジタルギフト | 粉丝投稿插画/视频卡片、同人小说章节导航、故事梗概、粉丝来信 |
| Page 7 | `#page7` | 謝辞 | 致谢列表与制作者信息 |

---

## 核心功能

### 导航系统

- **桌面端**：顶部固定圆角导航栏，7 个日文标签，高亮当前所在页面
- **移动端**：底部固定导航栏，图标 + 中文标签，适配安全区域（`safe-area-inset-bottom`）
- **高亮逻辑**：`IntersectionObserver` 多阈值检测（0~1），始终高亮视口中占比最高的页面
- 桌/移两套导航通过 `applyActiveNav()` 同步高亮

### 音乐播放器

- 4 首 BGM（`assets/audio/bgm_01.mp3` ~ `bgm_04.mp3`）
- **列表循环**：播完自动切下一首，最后一首回到第一首
- 按钮右上角显示曲目符号：♭ ♮ ♯ ♪
- **交互**：左键/触屏单击 = 开关音乐，右键/触屏长按(450ms) = 切歌
- 打开视频弹窗时自动静音，关闭视频后恢复

### 弹幕系统

- 数据源：`assets/js/danmaku-data.js`（57 条粉丝留言）
- 自动循环发射弹幕（桌面端 2s/条，移动端 4s/条）
- **长度筛选**：中/日文字数超过 91 字的留言不会被发射，仅在留言卡片展示
- **显示控制**：开关弹幕（单击），循环切换屏占比 100vh → 50vh → 25vh（右键/长按）
- 弹幕屏幕容器使用 CSS `contain` 隔离，不影响页面布局

### 视频弹窗

- 点击视频卡片打开悬浮弹窗，内嵌 Bilibili iframe 播放器
- 自动构建 `bilibili.com` 嵌入链接（`Utils.buildBilibiliEmbedUrl`）
- 关闭时清空 `iframe.src` 停止播放，ESC / 点击遮罩也可关闭
- 打开时自动静音 BGM，关闭后恢复

### 留言卡片

- `danmaku-data.js` 数据驱动，JS 动态创建 DOM
- **分页**：每页 6 张卡片，底部页码导航
- **中日双语翻转**：点击卡片翻转切换中文/日文，高度自适应内容长度
- `matchCardHeight()` 通过克隆节点测量目标面高度，实现平滑过渡

### 故事梗概 / 粉丝来信

- 日语优先展示（初始状态 `is-jp`），点击"点击切换中文"按钮切换
- **高度自适应**：切换后根据实际文本长度调整容器高度，右侧图片/排版随之居中
- 使用 `position: absolute` + JS 动态测量 `scrollHeight` 实现

### 礼物卡片

- 6 张卡片：3 张插画（3:4）+ 1 张插画（4:3）+ 2 个视频（4:3）
- 点击插画卡片打开大图弹窗（`GiftModalController`）
- 点击视频卡片调用 Bilibili 嵌入播放
- **移动端**：默认显示前 3 张，点击"查看更多"展开后 3 张

### 其他特效

- **樱花飘落**：`SakuraEffect` 类，最多 30 个活动粒子，页面不可见时暂停
- **倒计时**：`CountdownController`，目标日期设为当天 23:59:59，生日当天显示"生日快乐"
- **主视觉照片轮播**：5 张主视觉图淡入淡出切换
- **时间线图片**：鼠标悬浮显示缩略图，点击全屏查看（`TimelineImageViewer`）
- **滚动提示**：首页底部呼吸动画箭头，滚动后渐隐

---

## 项目结构

```
sssdsd/
├── index.html                     # 主页面（全部 7 个板块）
├── README.md
└── assets/
    ├── css/
    │   └── style.css              # 全局样式（约 2900 行）
    ├── js/
    │   ├── main.js                # 核心逻辑（控制器、工具函数、初始化）
    │   └── danmaku-data.js        # 弹幕/留言数据
    ├── audio/
    │   ├── bgm_01.mp3             # ♭ 降记号
    │   ├── bgm_02.mp3             # ♮ 还原记号
    │   ├── bgm_03.mp3             # ♯ 升记号
    │   └── bgm_04.mp3             # ♪ 八分音符
    ├── images/
    │   ├── favicon.ico            # 网页图标
    │   ├── mainPicture1~5.webp    # Page1 主视觉照片
    │   ├── timeline_1~6.webp      # Page3 时间线图片
    │   ├── video_1~6.webp         # Page4 切片封面
    │   ├── song_1~3.webp          # Page4 歌声切片封面
    │   ├── gift_bianhua.webp      # Page6 彼岸花插画
    │   ├── gift_chou.webp         # Page6 蝴蝶插画
    │   ├── gift_DPic.webp         # Page6 D_picture 插画
    │   ├── gift_tutu.webp         # Page6 书法作品
    │   ├── gift_video1.webp       # Page6 视频封面
    │   └── gift_miku.webp         # Page6 粉丝来信贺图
    ├── videos/
    │   ├── video_1.mp4            # 备用视频
    │   └── video_2.mp4            # 备用视频
    └── novel/
        ├── cn/                    # 中文版（7 章 .txt + full.txt）
        └── jp/                    # 日文版（7 章 .txt + full.txt）
```

---

## 技术实现

### 控制器类

| 类名 | 职责 |
|------|------|
| `CountdownController` | 生日倒计时，每秒更新，跨天自动重置 |
| `MusicPlayer` | BGM 播放列表管理、播放/暂停/切歌、触屏冲突防护 |
| `DanmakuAutoPlayer` | 定时循环发射弹幕，长度筛选 |
| `DanmakuManager` | 弹幕 DOM 创建、布局、动画 |
| `DanmakuModeController` | 弹幕开关与屏占比切换 |
| `MessageCardController` | 留言卡片分页、中日翻转、高度适配 |
| `VideoModalController` | 视频弹窗打开/关闭，BGM 静音联动 |
| `GiftModalController` | 礼物卡片弹窗（图片/视频） |
| `TimelineImageViewer` | 时间线图片全屏查看 |
| `ScrollHintController` | 首页滚动提示渐隐（RAF 节流） |
| `SakuraEffect` | 樱花飘落粒子特效 |

### JavaScript 工具函数

| 函数 | 用途 |
|------|------|
| `createTouchHandler(onTap, onLongPress, thresholdMs)` | 通用触屏长按检测，避免 click+touch 重复触发 |
| `Utils.buildBilibiliEmbedUrl(url, autoplay)` | 统一 B 站视频嵌入链接构建 |
| `Utils.escapeHTML(str)` | XSS 防护 |
| `Utils.isMobile()` | 设备类型判断 |

### 性能优化

- `requestAnimationFrame` 节流 scroll 事件
- `passive: true` 触屏事件监听
- 懒加载图片（`loading="lazy"`）
- CSS `contain` 隔离弹幕容器
- 樱花特效粒子上限 30 个，页面不可见时暂停
- 弹幕 DOM 上限限制，超量时移除最早元素
- 消息卡片 `cloneNode` 测量高度（避免重排）

### 兼容性

- `backdrop-filter` 同步提供 `-webkit-backdrop-filter` 前缀（Safari 兼容）
- `env(safe-area-inset-bottom)` 带 `0px` 降级值（旧浏览器兼容）
- 渐变底色作为毛玻璃效果的降级方案

---

## 字体

| 字体 | 用途 | 来源 |
|------|------|------|
| LXGW WenKai | 中文正文 | jsDelivr CDN |
| Noto Sans JP | 日文正文 | Google Fonts |

---

## 使用方式

直接在浏览器中打开 `index.html` 即可。所有资源使用相对路径引用，无需构建工具或本地服务器。

如需部署到服务器，将整个目录上传至 Web 根目录即可。
