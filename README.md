# 猫羽おかゆ お誕生日 🎂

一个为 **猫羽おかゆ** 制作的生日庆祝静态网页。

## 项目结构

```
sssdsd/
├── index.html              # 主页面
├── README.md               # 项目说明
├── .gitignore              # Git 忽略规则
├── assets/
│   ├── images/             # 图片资源
│   └── videos/             # 视频资源
├── novel_jp.txt            # 日文小说
└── novel_zh.txt            # 中文小说翻译
```

## 说明

- 纯 HTML + CSS 静态页面，无需构建工具
- 使用 Google Fonts（Noto Sans JP）和 LXGW WenKai 字体
- 响应式设计，适配移动端

  
  claude 改动：
  1. 宏观总结

  本次重构把 Page6 的中日双语对照功能从「前端运行时启发式对齐」彻底切换为「构建期预对齐 + 运行时纯 id 直查」，同时顺手补完了移动端响应式与 Page Review 报告。根本治愈了"hover/click 之后中日段落全局错位"的高亮 Bug，并把整套对齐代码量从 ~80 行降到 ~10 行。

  2. 改动文件清单

  ┌──────────────────────┬──────┬───────────────────┬─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
  │         文件         │ 类型 │     增/删行数     │                                                          说明                                                           │
  ├──────────────────────┼──────┼───────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ assets/js/main.js    │ 修改 │ +165 / −109       │ 重写 NovelLoader（JSON 加载）与 NovelSyncController（id 直查）；保留并加固事件委托 / 滚动补偿 / nav 偏移逻辑            │
  ├──────────────────────┼──────┼───────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ assets/css/style.css │ 修改 │ +174 / −0         │ 新增"移动端响应式综合修复"区块（nav 横滑、overflow-x: hidden 兜底、倒计时 2×2、info-row 堆叠、@media (hover: none) 等） │
  ├──────────────────────┼──────┼───────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ novel_data.json      │ 新增 │ +1192 行 (~57 KB) │ 构建期生成的语义对齐数据，238 条 { id, jp, zh }                                                                         │
  ├──────────────────────┼──────┼───────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Review_Report.md     │ 新增 │ 186 行            │ 项目初版 Review 报告（架构、Bug 定位、移动端问题）                                                                      │
  └──────────────────────┴──────┴───────────────────┴─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

  ▎ index.html / novel_jp.txt / novel_zh.txt 未修改——原始数据保留，HTML 容器结构复用。

  3. 逻辑说明 —— 旧代码痛点 vs. 新代码方案

  3.1 旧代码的核心痛点

  前端每次刷新都要"现场猜对齐"，启发式经历了三轮翻车：

  1. 第一版（serial 直接匹配）
  读两份 txt → 用正则 ^(\d+)[.、:：]\s* 抽出行首数字当 data-serial → 同 serial 互相高亮。
  痛点：完全依赖人手把两份 txt 的"1./2./3."编号一一对齐。中文文件第 27 行附近合并了两段日文之后，整个翻译里日文比中文多一行，从那以后 serial 数字相同但内容不同——hover JP-172 高亮到 ZH-172（实际对应 JP-171），全篇错位。
  2. 第二版（pidx 主键 + serial 兜底）
  引入"第 N 个非空段落"作为绝对主键 data-pidx，serial 作为 fallback。
  痛点：因为两侧的 pidx 总能命中（每个段落都有 pidx），serial 兜底永远跑不到；只要中间发生一次合并/拆分，后续所有 pidx 全部偏移一行，错位面积反而更大。
  3. 第三版（Block-level 相对匹配）
  按 serial 聚成 Block，块内取相对位置，越界贴底。
  痛点：仍然要求两侧 serial 集合大体一致；而且只要源 txt 一个数字写错，整篇还是会塌方。本质上"运行时根据手工编号反推语义对齐"是错的，对齐应该在构建期完成、写到一处不可变的数据里。

  此外还堆叠了几个隐性 Bug：

  - document.addEventListener('mouseleave', …, true) 在 document 上几乎永不触发，导致"离开小说区清空高亮"逻辑形同虚设；
  - 内层滚动用 targetP.offsetTop，而 .novel-content 祖先没有 position 定位，offsetParent 一路走到 <body>，得到几千像素的页面坐标，喂给容器 scrollTo 会被钳到底端——表现为"位置乱跳/直接滚到最底";
  - 逐段绑定 mouseenter，无法对未来段落内子节点（<br>、ruby、span）做事件委托。

  3.2 新代码方案 —— JSON-Driven 三段式

  Step ① 构建期：语义对齐成 novel_data.json

  用 Python 离线脚本把两份 txt 处理一次：
  - 1–26、29–238 直对 1:1；
  - JP-27 + JP-28 → 合并到 entry 27 的 jp 字段（中文译者把两句日文揉成一段中文）；
  - JP-239 → 拆到 entry 238 的 zh 字段两行（最后一句日文里旁白和台词同行，中文拆开了）；
  - 多行用 \n 连接；脚本里加了 assert used_jp == range(1,240) 双向断言，保证 1–239 行全部恰好覆盖一次，零遗漏。

  输出：238 条 [{ "id", "jp", "zh" }, …]。id 从此就是全局唯一的绝对锚点。

  Step ② 加载期：NovelLoader 一次 fetch

  const data = await (await fetch('./novel_data.json')).json();
  const jpHtml = data.map(e => `<p class="novel-paragraph" data-id="${e.id}">${escape(e.jp).replaceAll('\n','<br>')}</p>`).join('');

  不再有 formatNovelText 的正则切分、不再有 data-pidx / data-serial 这套元数据，DOM 上每个段落只挂一个 data-id。\n 渲染为 <br> 保留阅读节奏，文本统一走 Utils.escapeHtml。

  Step ③ 运行期：NovelSyncController 退化到 O(1) 直查

  setupMappings() {
    this.jpById.clear(); this.zhById.clear();
    this.elements.jpContainer.querySelectorAll('.novel-paragraph[data-id]')
      .forEach(p => this.jpById.set(p.dataset.id, p));
    this.elements.zhContainer.querySelectorAll('.novel-paragraph[data-id]')
      .forEach(p => this.zhById.set(p.dataset.id, p));
  }
  findCounterpart(sourceP, isJp) {
    return (isJp ? this.zhById : this.jpById).get(sourceP.dataset.id) || null;
  }

  匹配代码从近 80 行 Block 算法塌缩成两行。因为对齐已经在 JSON 里固化，运行时不可能再错位——这就是"全局错位 Bug"被根治的根因。

  3.3 配套保留 / 加固的体验逻辑

  - 事件委托：mouseover / click / touchstart 挂在 .novel-content 容器上，走 e.target.closest('.novel-paragraph')，未来段落里加 <br> / <span> / <ruby> 都能正确冒泡命中。_lastHoverP 去抖防止同段落内重复触发。
  - mouseleave 修正：从 document 改挂到 .novel-container（mouseleave 不冒泡），高亮清理终于真的会触发。
  - 滚动定位修复 + nav 补偿：内层用 getBoundingClientRect() 精算"段落相对容器顶端的偏移 + 容器现有 scrollTop"，把目标段放到容器视口上 1/3 处；同时 getNavBottom() + ensureColumnVisible() 检查目标列是否被 fixed 导航栏盖住或滑出视口，必要时 window.scrollBy
  做页面级补偿（手机端两列堆叠场景尤其关键）。

  3.4 顺手做掉的事

  1. 移动端响应式综合修复（CSS +174 行）：html, body { overflow-x: hidden }、img/video/iframe { max-width: 100% }、nav 横向滚动、倒计时 2×2、.info-row 列堆叠、timeline tooltip 宽度自适应、@media (hover: none) 让 hover 关键入口在触屏上常显，等等。
  2. Review_Report.md：项目初版 Review，包含架构梳理、Bug 定位、移动端问题清单——可作为本次重构的"问题背景档案"留档。

  4. 验收清单

  - Page6 加载后，DevTools 在 #novelJapanese / #novelChinese 下各看到 238 个 <p class="novel-paragraph" data-id="1..238">。
  - Network 面板只有 1 次 novel_data.json 请求，没有 novel_jp.txt / novel_zh.txt 请求。
  - hover/click 任意段落，对侧同 id 段落高亮、内层滚到容器视口上 1/3 处。
  - 移动端窄屏下 nav 可横滑、首屏无横向溢出、两列堆叠时联动滚动会自动越过 nav 高度。
  - Console 干净，没有 data-pidx / data-serial / Block 错位相关 warning。

  5. 风险与回滚

  - 运行时新增依赖：必须能 fetch 到同源 novel_data.json。本地用 Live Server / 任意静态服务即可；file:// 直接打开 HTML 会被浏览器 CORS 拦截 fetch——这是 JSON-Driven 方案的固有约束。
  - 回滚路径：单文件 revert assets/js/main.js + 删 novel_data.json 即恢复到上一版 Block-level 实现；txt 源文件没动过，没有数据丢失风险。
