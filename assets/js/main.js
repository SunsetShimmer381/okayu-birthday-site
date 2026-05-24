// ===== 工具函数 =====
const Utils = {
  // HTML转义，防止XSS攻击
  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  // 格式化时间
  formatTime(hours, mins) {
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  },

  // 验证B站视频URL
  validateBilibiliUrl(url) {
    const pattern = /^https?:\/\/www\.bilibili\.com\/video\/BV[a-zA-Z0-9]{10}(\/.*)?$/;
    return pattern.test(url);
  },

  // 提取B站视频BV号
  extractBvid(url) {
    const match = url.match(/BV[a-zA-Z0-9]{10}/);
    return match ? match[0] : null;
  }
};

// ===== 倒计时控制器 =====
class CountdownController {
  constructor(options = {}) {
    this.targetMonth = options.month || 5;  // 6月（索引从0开始）
    this.targetDay = options.day || 8;
    this.targetLabel = options.label || '6月8日';
    this.intervalId = null;
    this.elements = {
      days: document.getElementById('cdDays'),
      hours: document.getElementById('cdHours'),
      mins: document.getElementById('cdMins'),
      secs: document.getElementById('cdSecs'),
      caption: document.getElementById('cdCaption')
    };
    this.init();
  }

  init() {
    if (!this.hasValidElements()) {
      console.warn('CountdownController: 缺少必要的DOM元素');
      return;
    }
    this.update();
    this.start();
  }

  hasValidElements() {
    return Object.values(this.elements).every(el => el !== null);
  }

  getNextTargetDate() {
    const now = new Date();
    const currentYear = now.getFullYear();
    let targetDate = new Date(currentYear, this.targetMonth, this.targetDay);

    if (now > targetDate) {
      targetDate.setFullYear(currentYear + 1);
    }

    return targetDate;
  }

  update() {
    const now = new Date();
    const targetDate = this.getNextTargetDate();
    const diff = targetDate - now;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    this.elements.days.textContent = String(days).padStart(2, '0');
    this.elements.hours.textContent = String(hours).padStart(2, '0');
    this.elements.mins.textContent = String(mins).padStart(2, '0');
    this.elements.secs.textContent = String(secs).padStart(2, '0');

    const isBirthday = now.getMonth() === this.targetMonth && now.getDate() === this.targetDay;

    if (isBirthday) {
      this.elements.caption.innerHTML = '<span class="date">生日快乐！</span>';
    } else {
      this.elements.caption.innerHTML = `距离<span class="date">${this.targetLabel}</span>还有`;
    }
  }

  start() {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.update(), 1000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  destroy() {
    this.stop();
    this.elements = null;
  }
}

// 初始化倒计时
const countdownController = new CountdownController();

// ===== 图片轮播控制器 =====
class ImageSlider {
  constructor(options = {}) {
    this.images = options.images || [
      './assets/images/mainPicture1.webp',
      './assets/images/mainPicture2.webp',
      './assets/images/mainPicture3.webp',
      './assets/images/mainPicture4.webp',
      './assets/images/mainPicture5.webp'
    ];
    this.currentIndex = 0;
    this.isTransitioning = false;
    this.transitionDuration = options.transitionDuration || 1000;
    this.fadeDuration = options.fadeDuration || 100;
    this.autoPlay = options.autoPlay !== undefined ? options.autoPlay : true;
    this.autoPlayInterval = options.autoPlayInterval || 5000;
    this.autoPlayId = null;

    this.elements = {
      main: document.getElementById('mainPhoto'),
      next: document.getElementById('photoNext')
    };

    this.init();
  }

  init() {
    if (!this.elements.main || !this.elements.next) {
      console.warn('ImageSlider: 缺少必要的DOM元素');
      return;
    }

    // 初始化透明度
    this.elements.main.style.opacity = '1';
    this.elements.next.style.opacity = '0';

    // 预加载第一张图片
    if (this.images.length > 0) {
      this.elements.main.src = this.images[0];
    }

    // 启动自动播放
    if (this.autoPlay) {
      this.startAutoPlay();
    }
  }

  loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false); // 失败也继续
      img.src = src;
    });
  }

  async next() {
    if (this.isTransitioning || this.images.length === 0) return;

    this.isTransitioning = true;
    const nextIndex = (this.currentIndex + 1) % this.images.length;
    const nextSrc = this.images[nextIndex];

    try {
      // 预加载下一张图片
      await this.loadImage(nextSrc);

      // 显示过渡图片
      this.elements.next.src = nextSrc;

      // 使用requestAnimationFrame确保DOM更新
      await this.animate(() => {
        this.elements.next.style.opacity = '1';
      });

      // 等待过渡完成
      await this.delay(this.transitionDuration);

      // 更新主图并隐藏过渡图
      this.elements.main.src = nextSrc;

      await this.animate(() => {
        this.elements.next.style.opacity = '0';
      });

      await this.delay(this.fadeDuration);

      this.currentIndex = nextIndex;
    } catch (error) {
      console.error('ImageSlider transition error:', error);
    } finally {
      this.isTransitioning = false;
    }
  }

  animate(callback) {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(callback);
        resolve();
      });
    });
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  startAutoPlay() {
    if (this.autoPlayId) return;
    this.autoPlayId = setInterval(() => {
      this.next();
    }, this.autoPlayInterval);
  }

  stopAutoPlay() {
    if (this.autoPlayId) {
      clearInterval(this.autoPlayId);
      this.autoPlayId = null;
    }
  }

  goTo(index) {
    if (index < 0 || index >= this.images.length || this.isTransitioning) return;
    this.currentIndex = index;
    this.elements.main.src = this.images[index];
  }

  destroy() {
    this.stopAutoPlay();
    this.elements = null;
    this.images = null;
  }
}

// 初始化图片轮播
const imageSlider = new ImageSlider({
  autoPlay: true,
  autoPlayInterval: 3000,
  transitionDuration: 800
});

// ===== 导航控制器 =====
class NavController {
  constructor(options = {}) {
    this.threshold = options.threshold || 0.5;
    this.navItems = document.querySelectorAll('.nav-item');
    this.pages = document.querySelectorAll('.page');
    this.observer = null;
    this.init();
  }

  init() {
    if (!this.navItems.length || !this.pages.length) {
      console.warn('NavController: 缺少必要的DOM元素');
      return;
    }

    this.setupNavClickHandlers();
    this.setupScrollObserver();
  }

  setupNavClickHandlers() {
    this.navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const pageNum = item.dataset.page;
        const page = document.getElementById('page' + pageNum);
        if (page) {
          page.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  setupScrollObserver() {
    this.observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      { threshold: this.threshold }
    );

    this.pages.forEach(page => this.observer.observe(page));
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const pageId = entry.target.id;
        const pageNum = pageId.replace('page', '');
        this.updateActiveNav(pageNum);
      }
    });
  }

  updateActiveNav(pageNum) {
    this.navItems.forEach(item => {
      item.classList.remove('active');
      if (item.dataset.page === pageNum) {
        item.classList.add('active');
      }
    });
  }

  setActive(pageNum) {
    this.updateActiveNav(String(pageNum));
    const page = document.getElementById('page' + pageNum);
    if (page) {
      page.scrollIntoView({ behavior: 'smooth' });
    }
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.navItems = null;
    this.pages = null;
  }
}

// 初始化导航控制器
const navController = new NavController({ threshold: 0.5 });

// ===== 弹幕管理器 =====
class DanmakuManager {
  constructor(options = {}) {
    this.container = document.getElementById('danmakuContainer');
    this.danmakus = new Set();
    this.minDuration = options.minDuration || 10;
    this.maxDuration = options.maxDuration || 16;
    // 轨道系统 — 固定 6 条轨道，均匀分布
    this.trackCount = 6;
    this.trackTops = [8, 16, 24, 32, 40, 48]; // 6 条轨道的 top % 值
    this.nextTrack = 0;
    this.init();
  }

  init() {
    if (!this.container) {
      console.warn('DanmakuManager: 缺少必要的DOM元素');
      return;
    }
  }

  createDanmaku(name, text) {
    if (!name || !text) return null;

    const el = document.createElement('div');
    el.className = 'danmaku-item';
    
    const escapedName = Utils.escapeHtml(name);
    const escapedText = Utils.escapeHtml(text);
    
    el.innerHTML = `<span class="danmaku-name">${escapedName}</span><span class="danmaku-text">| ${escapedText}</span>`;
    
    // 轨道分配：轮转，保证弹幕均匀分布在 6 条轨道上
    el.style.top = `${this.trackTops[this.nextTrack % this.trackCount]}vh`;
    this.nextTrack++;
    
    // 弹幕动画时长随机
    el.style.animationDuration = `${this.minDuration + Math.random() * (this.maxDuration - this.minDuration)}s`;
    
    this.danmakus.add(el);
    this.container.appendChild(el);
    
    el.addEventListener('animationend', () => {
      this.removeDanmaku(el);
    });
    
    return el;
  }

  removeDanmaku(el) {
    if (this.danmakus.has(el)) {
      this.danmakus.delete(el);
      el.remove();
    }
  }

  destroy() {
    this.danmakus.forEach(el => el.remove());
    this.danmakus.clear();
  }
}

// 弹幕数据（留言板示例数据）
const sampleDanmaku = [
  { name: '【曦月】', text: '【ここにご自身のメッセージを入力してください】' },
  { name: '【空白】', text: '【ここにご自身のメッセージを入力してください】' },
  { name: '【空白】', text: '【ここにご自身のメッセージを入力してください】' },
  { name: '【空白】', text: '【ここにご自身のメッセージを入力してください】' },
  { name: '【空白】', text: '【ここにご自身のメッセージを入力してください】' },
  { name: '【空白】', text: '【ここにご自身のメッセージを入力してください】' },
  { name: '【空白】', text: '【ここにご自身のメッセージを入力してください】' },
  { name: '【空白】', text: '【ここにご自身のメッセージを入力してください】' },
  { name: '【空白】', text: '【ここにご自身のメッセージを入力してください】' },
  { name: '【空白】', text: '【ここにご自身のメッセージを入力してください】' },
  { name: '【空白】', text: '【ここにご自身のメッセージを入力してください】' },
  { name: '【空白】', text: '【ここにご自身のメッセージを入力してください】' },
  { name: '【空白】', text: '【ここにご自身のメッセージを入力してください】' },
  { name: '【空白】', text: '【ここにご自身のメッセージを入力してください】' },
  { name: '【空白】', text: '【ここにご自身のメッセージを入力してください】' },
  { name: '【空白】', text: '【ここにご自身のメッセージを入力してください】' }
];

// 初始化弹幕管理器
const danmakuManager = new DanmakuManager({
  minDuration: 16,  // 最小 16 秒（原来是 10）
  maxDuration: 24   // 最大 24 秒（原来是 16）
});

// ===== 留言板渲染器（支持分页）=====
class MessageBoardRenderer {
  constructor(data) {
    this.data = this.sanitizeData(data) || [];
    this.currentPage = 1;
    this.itemsPerPage = 8;
    this.elements = null;
    this._prevPageHandler = null;
    this._nextPageHandler = null;
    
    // 卡片背景色选项（马卡龙色系）
    this.cardColors = [
      '#FFE6ED',   // 浅粉色
      '#FFF3E0',   // 浅橙色/米色
      '#E3F2FD',   // 浅蓝色
      '#FCE4EC',   // 淡粉色
      '#E8F5E9',   // 浅绿色
      '#F3E5F5',   // 浅紫色
      '#FFF8E1',   // 浅黄色
      '#E0F7FA',   // 青色
    ];
    
    // 延迟初始化，确保DOM加载完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  // 数据清理和XSS防护
  sanitizeData(data) {
    if (!Array.isArray(data)) return [];
    return data.map(item => ({
      name: item.name ? Utils.escapeHtml(String(item.name)) : '匿名',
      text: item.text ? Utils.escapeHtml(String(item.text)) : ''
    }));
  }

  init() {
    this.elements = {
      container: document.getElementById('messagesContainer'),
      stats: document.getElementById('messagesStats'),
      pagination: document.getElementById('pagination'),
      paginationPrev: document.getElementById('paginationPrev'),
      paginationNext: document.getElementById('paginationNext'),
      paginationNumbers: document.getElementById('paginationNumbers')
    };
    
    // 绑定分页按钮事件
    this._prevPageHandler = () => this.prevPage();
    this._nextPageHandler = () => this.nextPage();
    
    if (this.elements.paginationPrev) {
      this.elements.paginationPrev.addEventListener('click', this._prevPageHandler);
    }
    if (this.elements.paginationNext) {
      this.elements.paginationNext.addEventListener('click', this._nextPageHandler);
    }
    
    this.render();
  }

  getTotalPages() {
    return Math.ceil(this.data.length / this.itemsPerPage);
  }

  getCurrentPageData() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.data.slice(start, end);
  }

  render() {
    if (!this.elements.container) {
      console.warn('MessageBoardRenderer: 缺少必要的DOM元素');
      return;
    }

    // 更新统计信息（使用DOM方法）
    if (this.elements.stats) {
      const totalPages = this.getTotalPages();
      this.elements.stats.innerHTML = '';
      
      const totalText = document.createTextNode(`共 `);
      const totalSpan = document.createElement('span');
      totalSpan.textContent = this.data.length;
      const text1 = document.createTextNode(` 条留言 · 第 `);
      const pageSpan = document.createElement('span');
      pageSpan.textContent = this.currentPage;
      const text2 = document.createTextNode(` / ${totalPages} 页`);
      
      this.elements.stats.appendChild(totalText);
      this.elements.stats.appendChild(totalSpan);
      this.elements.stats.appendChild(text1);
      this.elements.stats.appendChild(pageSpan);
      this.elements.stats.appendChild(text2);
    }

    // 清空容器
    while (this.elements.container.firstChild) {
      this.elements.container.removeChild(this.elements.container.firstChild);
    }

    // 获取当前页数据
    const pageData = this.getCurrentPageData();

    // 遍历数据，创建留言卡片
    pageData.forEach((item, index) => {
      const card = this.createCard(item, index);
      this.elements.container.appendChild(card);
    });

    // 渲染分页控件
    this.renderPagination();
  }

  createCard(item, index) {
    const card = document.createElement('div');
    card.className = 'message-card';
    card.style.animationDelay = `${index * 0.1}s`;

    // 添加随机背景色（马卡龙色系）
    const colorIndex = index % this.cardColors.length;
    card.style.background = this.cardColors[colorIndex];

    // 微倾斜（±1.2度）—— 真实便签贴歪一点但不会太大
    const randomRotation = (Math.random() * 2.4 - 1.2).toFixed(2);
    card.style.setProperty('--tilt', `${randomRotation}deg`);

    // 使用DOM方法创建元素，避免innerHTML的XSS风险
    const tape = document.createElement('span');
    tape.className = 'message-tape';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    const textPara = document.createElement('p');
    textPara.className = 'message-text';
    textPara.textContent = item.text; // 使用textContent防止XSS
    content.appendChild(textPara);
    
    const footer = document.createElement('div');
    footer.className = 'message-footer';
    
    const author = document.createElement('span');
    author.className = 'message-author';
    author.textContent = `— ${item.name}`; // 使用textContent防止XSS
    footer.appendChild(author);
    
    card.appendChild(tape);
    card.appendChild(content);
    card.appendChild(footer);

    // 鼠标悬浮效果 - 使用CSS类实现平滑过渡
    card.addEventListener('mouseenter', () => {
      card.classList.add('message-card-hover');
    });

    card.addEventListener('mouseleave', () => {
      card.classList.remove('message-card-hover');
    });

    return card;
  }

  renderPagination() {
    if (!this.elements.paginationNumbers) return;

    const totalPages = this.getTotalPages();
    this.elements.paginationNumbers.innerHTML = '';

    // 隐藏分页如果只有一页
    if (totalPages <= 1) {
      if (this.elements.pagination) {
        this.elements.pagination.style.display = 'none';
      }
      return;
    } else {
      if (this.elements.pagination) {
        this.elements.pagination.style.display = 'flex';
      }
    }

    // 更新按钮状态
    if (this.elements.paginationPrev) {
      this.elements.paginationPrev.disabled = this.currentPage === 1;
    }
    if (this.elements.paginationNext) {
      this.elements.paginationNext.disabled = this.currentPage === totalPages;
    }

    // 生成页码按钮（最多显示7个）
    let startPage = Math.max(1, this.currentPage - 3);
    let endPage = Math.min(totalPages, this.currentPage + 3);

    // 如果总页数少于7，显示全部
    if (totalPages <= 7) {
      startPage = 1;
      endPage = totalPages;
    }

    // 添加省略号
    if (startPage > 1) {
      this.addPageNumber(1);
      if (startPage > 2) {
        this.addDots();
      }
    }

    // 添加页码
    for (let i = startPage; i <= endPage; i++) {
      this.addPageNumber(i);
    }

    // 添加省略号
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        this.addDots();
      }
      this.addPageNumber(totalPages);
    }
  }

  addPageNumber(page) {
    const button = document.createElement('button');
    button.className = 'pagination-number' + (page === this.currentPage ? ' active' : '');
    button.textContent = page;
    button.addEventListener('click', () => this.goToPage(page));
    this.elements.paginationNumbers.appendChild(button);
  }

  addDots() {
    const dots = document.createElement('span');
    dots.className = 'pagination-dots';
    dots.textContent = '...';
    this.elements.paginationNumbers.appendChild(dots);
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.render();
    }
  }

  nextPage() {
    if (this.currentPage < this.getTotalPages()) {
      this.currentPage++;
      this.render();
    }
  }

  goToPage(page) {
    if (page >= 1 && page <= this.getTotalPages() && page !== this.currentPage) {
      this.currentPage = page;
      this.render();
    }
  }

  destroy() {
    if (this.elements.paginationPrev && this._prevPageHandler) {
      this.elements.paginationPrev.removeEventListener('click', this._prevPageHandler);
    }
    if (this.elements.paginationNext && this._nextPageHandler) {
      this.elements.paginationNext.removeEventListener('click', this._nextPageHandler);
    }
    this.elements = null;
    this._prevPageHandler = null;
    this._nextPageHandler = null;
  }
}

// ===== 弹幕发送器（已移除）=====
// 由于项目中没有弹幕发送表单，此类已删除
// 如需添加弹幕发送功能，请添加相应的HTML表单元素并恢复此类

// ===== 弹幕自动播放器 =====
class DanmakuAutoPlayer {
  constructor(manager, data, options = {}) {
    this.manager = manager;
    this.data = data || [];
    this.interval = options.interval || 3000;
    this.startDelay = null;
    this.intervalId = null;
  }

  start() {
    if (this.intervalId || this.startDelay) return;
    if (this.data.length === 0) return;

    // 首次延迟 800ms，然后开始密集发射
    this.startDelay = setTimeout(() => {
      this.startDelay = null;
      this.sendNext();

      this.intervalId = setInterval(() => {
        this.sendNext();
      }, this.interval);
    }, 800);
  }

  sendNext() {
    // 随机选取一条弹幕数据
    const randomIndex = Math.floor(Math.random() * this.data.length);
    const item = this.data[randomIndex];
    this.manager.createDanmaku(item.name, item.text);
  }

  stop() {
    if (this.startDelay) {
      clearTimeout(this.startDelay);
      this.startDelay = null;
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  destroy() {
    this.stop();
    this.manager = null;
    this.data = null;
  }
}

// 弹幕发送器（已移除）
// 如需添加弹幕发送功能，请先添加相应的HTML表单元素，然后恢复DanmakuSender类

// 初始化弹幕自动播放器
const danmakuAutoPlayer = new DanmakuAutoPlayer(danmakuManager, sampleDanmaku, { interval: 2500 });
danmakuAutoPlayer.start();

// 渲染留言板
const messageBoardRenderer = new MessageBoardRenderer(sampleDanmaku);

// ===== 音乐播放器 =====
class MusicPlayer {
  constructor(options = {}) {
    this.audio = document.getElementById('bgMusic');
    this.btn = document.getElementById('musicBtn');
    this.isPlaying = false;
    this.autoPlay = options.autoPlay !== undefined ? options.autoPlay : false;
    this.init();
  }

  init() {
    if (!this.audio || !this.btn) {
      console.warn('MusicPlayer: 缺少必要的DOM元素');
      return;
    }
    this.audio.loop = true;
    this.setupEventListeners();
    
    if (this.autoPlay) {
      this.play();
    }
  }

  setupEventListeners() {
    this._toggleHandler = () => this.toggle();
    this.btn.addEventListener('click', this._toggleHandler);
  }

  toggle() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    this.audio.play().catch(() => {});
    this.btn.classList.remove('off');
    this.btn.classList.add('on');
    this.isPlaying = true;
  }

  pause() {
    this.audio.pause();
    this.btn.classList.remove('on');
    this.btn.classList.add('off');
    this.isPlaying = false;
  }

  destroy() {
    this.btn.removeEventListener('click', this._toggleHandler);
    this.audio.pause();
    this.audio = null;
    this.btn = null;
    this._toggleHandler = null;
  }
}

// 初始化音乐播放器
const musicPlayer = new MusicPlayer();

// ===== 弹幕显示模式控制器 =====
class DanmakuModeController {
  constructor(options = {}) {
    this.container = document.getElementById('danmakuContainer');
    this.btn = document.getElementById('danmakuBtn');
    this.badge = document.getElementById('danmakuBadge');
    this.mode = options.initialMode || 0; // 0: 全屏, 1: 半屏, 2: 四分之一屏, 3: 关闭
    this.modes = [
      { height: '100vh', display: 'block', badge: '', on: true },
      { height: '50vh', display: 'block', badge: '1/2', on: true },
      { height: '25vh', display: 'block', badge: '1/4', on: true },
      { height: 'auto', display: 'none', badge: '', on: false }
    ];
    this.init();
  }

  init() {
    if (!this.btn || !this.badge || !this.container) {
      console.warn('DanmakuModeController: 缺少必要的DOM元素');
      return;
    }
    this._toggleHandler = () => this.toggle();
    this.btn.addEventListener('click', this._toggleHandler);
    this.applyMode(this.mode);
  }

  toggle() {
    this.mode = (this.mode + 1) % this.modes.length;
    this.applyMode(this.mode);
  }

  applyMode(modeIndex) {
    const mode = this.modes[modeIndex];
    this.container.style.height = mode.height;
    this.container.style.display = mode.display;
    
    if (mode.on) {
      this.btn.classList.remove('off');
      this.btn.classList.add('on');
    } else {
      this.btn.classList.remove('on');
      this.btn.classList.add('off');
    }
    
    this.badge.textContent = mode.badge;
  }

  setMode(modeIndex) {
    if (modeIndex >= 0 && modeIndex < this.modes.length) {
      this.mode = modeIndex;
      this.applyMode(this.mode);
    }
  }

  destroy() {
    this.btn.removeEventListener('click', this._toggleHandler);
    this.container = null;
    this.btn = null;
    this.badge = null;
    this._toggleHandler = null;
  }
}

// 初始化弹幕模式控制器
const danmakuModeController = new DanmakuModeController();

// ===== 樱花飘落效果 =====
class SakuraEffect {
  constructor(options = {}) {
    this.interval = options.interval || 200;
    this.lifetime = options.lifetime || 15000;
    this.minDuration = options.minDuration || 6;
    this.maxDuration = options.maxDuration || 14;
    this.flowerTypes = ['❀', '✿', '❁', '✾', '❃', '✿'];
    this.flowerColors = ['#ffb7c5', '#ffc0cb', '#f8b4c4', '#e89bb3', '#d4708a', '#f5a3b5'];
    this.intervalId = null;
    this.activeSakuras = new Set();
    this.init();
  }

  init() {
    this.start();
  }

  createSakura() {
    const sakura = document.createElement('div');
    sakura.className = 'sakura';
    
    const randomType = this.flowerTypes[Math.floor(Math.random() * this.flowerTypes.length)];
    const randomColor = this.flowerColors[Math.floor(Math.random() * this.flowerColors.length)];
    
    sakura.innerHTML = randomType;
    sakura.style.left = `${Math.random() * 100}vw`;
    sakura.style.fontSize = `${10 + Math.random() * 18}px`;
    sakura.style.opacity = `${0.3 + Math.random() * 0.5}`;
    sakura.style.color = randomColor;
    sakura.style.animationDuration = `${this.minDuration + Math.random() * (this.maxDuration - this.minDuration)}s`;
    
    document.body.appendChild(sakura);
    this.activeSakuras.add(sakura);

    setTimeout(() => {
      this.removeSakura(sakura);
    }, this.lifetime);
  }

  removeSakura(sakura) {
    this.activeSakuras.delete(sakura);
    sakura.remove();
  }

  start() {
    if (this.intervalId) return;
    this.createSakura(); // 立即创建第一个
    this.intervalId = setInterval(() => this.createSakura(), this.interval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  destroy() {
    this.stop();
    this.activeSakuras.forEach(s => s.remove());
    this.activeSakuras.clear();
    this.flowerTypes = null;
    this.flowerColors = null;
  }
}

// 初始化樱花效果
const sakuraEffect = new SakuraEffect({
  interval: 200,
  lifetime: 15000,
  minDuration: 6,
  maxDuration: 14
});

// ===== 滚动提示控制器 =====
class ScrollHintController {
  constructor(options = {}) {
    this.threshold = options.threshold || 100;
    this.hint = document.querySelector('.scroll-hint');
    this.isShown = true;
    this.init();
  }

  init() {
    if (!this.hint) {
      console.warn('ScrollHintController: 缺少必要的DOM元素');
      return;
    }
    this.setupEventListeners();
    this.update();
  }

  setupEventListeners() {
    this._scrollHandler = () => this.update();
    window.addEventListener('scroll', this._scrollHandler);
  }

  update() {
    const shouldShow = window.scrollY <= this.threshold;

    if (shouldShow && !this.isShown) {
      this.hint.classList.remove('hidden');
      this.isShown = true;
    } else if (!shouldShow && this.isShown) {
      this.hint.classList.add('hidden');
      this.isShown = false;
    }
  }

  destroy() {
    window.removeEventListener('scroll', this._scrollHandler);
    this.hint = null;
    this._scrollHandler = null;
  }
}

// 初始化滚动提示
const scrollHintController = new ScrollHintController({ threshold: 100 });

// ===== 小说内容加载器（JSON 驱动） =====
//
// 直接读取预先对齐过的 novel_data.json：
//   [{ "id": 1, "jp": "...", "zh": "..." }, ...]
// 每个 entry 是一对在语义上已经一一对应的中日段落。
// 不再分别拉两份 txt + 用正则切分 + 推测 pidx/serial——
// 那套启发式在翻译合并/拆分场景下永远是脆的。
class NovelLoader {
  constructor(options = {}) {
    this.dataUrl = options.dataUrl || './novel_data.json';
    this.elements = {
      jpContainer: document.getElementById('novelJapanese'),
      zhContainer: document.getElementById('novelChinese')
    };
    this.onLoadComplete = options.onLoadComplete || null;
  }

  async load() {
    try {
      const response = await fetch(this.dataUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('novel_data.json 顶层应为数组');
      this.render(data);
    } catch (error) {
      console.error('NovelLoader: 加载/解析 novel_data.json 失败', error);
      this.elements.jpContainer.innerHTML =
        '<p class="empty-text">【日本語の小説テキストをここに入力してください】</p>';
      this.elements.zhContainer.innerHTML =
        '<p class="empty-text">【请在此输入中文小说文本】</p>';
    }

    if (typeof this.onLoadComplete === 'function') {
      setTimeout(this.onLoadComplete, 100);
    }
  }

  render(data) {
    const jpHtml = data.map(entry => this.renderParagraph(entry.id, entry.jp)).join('');
    const zhHtml = data.map(entry => this.renderParagraph(entry.id, entry.zh)).join('');
    this.elements.jpContainer.innerHTML = jpHtml;
    this.elements.zhContainer.innerHTML = zhHtml;
  }

  // 每个 entry 渲染成一个 <p class="novel-paragraph" data-id="N">
  // 文本中的 '\n' 用 <br> 渲染——保留多句合并/拆分场景下的阅读节奏，
  // 同时让 .novel-paragraph 仍是单个 <p>，不破坏既有 .novel-content p 样式。
  renderParagraph(id, text) {
    const safeId = String(id);
    const raw = (text == null) ? '' : String(text);
    const body = raw
      .split('\n')
      .map(line => Utils.escapeHtml(line))
      .join('<br>');
    return `<p class="novel-paragraph" data-id="${safeId}">${body}</p>`;
  }
}

// ===== 小说同步控制器（按 data-id 1:1 映射） =====
//
// 数据已经在构建期（novel_data.json）做过语义对齐，每条 entry 都有唯一的 id，
// 中日两栏渲染时把 id 写到 .novel-paragraph[data-id]。
// 所以这里的匹配退化为最简单的形态：两张 id -> element 的 Map，O(1) 直查。
// 不再有任何启发式（pidx/serial/Block）逻辑。
class NovelSyncController {
  constructor() {
    this.elements = {
      jpContainer: document.getElementById('novelJapanese'),
      zhContainer: document.getElementById('novelChinese'),
      novelWrapper: document.querySelector('.novel-container'),
      nav: document.querySelector('.nav')
    };
    // id(string) -> 段落元素
    this.jpById = new Map();
    this.zhById = new Map();
    // 用于事件委托时去抖，避免在同一段落内移动鼠标反复触发滚动/高亮
    this._lastHoverP = null;
  }

  init() {
    if (!this.elements.jpContainer || !this.elements.zhContainer) {
      console.warn('NovelSyncController: 缺少必要的DOM元素');
      return;
    }
    this.setupMappings();
    this.setupEventListeners();
  }

  setupMappings() {
    this.jpById.clear();
    this.zhById.clear();
    this.elements.jpContainer.querySelectorAll('.novel-paragraph[data-id]').forEach(p => {
      this.jpById.set(p.dataset.id, p);
    });
    this.elements.zhContainer.querySelectorAll('.novel-paragraph[data-id]').forEach(p => {
      this.zhById.set(p.dataset.id, p);
    });

    if (this.jpById.size !== this.zhById.size) {
      console.warn(
        `NovelSyncController: 中日段落数不一致（JP=${this.jpById.size}, ZH=${this.zhById.size}），` +
        '请检查 novel_data.json 是否完整。'
      );
    }
  }

  // 绝对 1:1：同 id 在另一侧必然存在（由构建期保证），不存在则返回 null。
  findCounterpart(sourceP, isJp) {
    const id = sourceP.dataset.id;
    if (!id) return null;
    return (isJp ? this.zhById : this.jpById).get(id) || null;
  }

  highlightPair(sourceP, isJp) {
    this.clearHighlights();
    if (!sourceP || sourceP.classList.contains('empty')) return;

    sourceP.classList.add('highlighted');

    const targetP = this.findCounterpart(sourceP, isJp);
    if (!targetP || targetP.classList.contains('empty')) return;

    targetP.classList.add('highlighted');

    const targetContainer = isJp ? this.elements.zhContainer : this.elements.jpContainer;
    this.scrollContainerToParagraph(targetContainer, targetP);
    this.ensureColumnVisible(targetContainer);
  }

  // 用 getBoundingClientRect 计算段落相对于容器内部的真实偏移。
  // 之前用 targetP.offsetTop 的写法存在 bug：offsetTop 是相对于 offsetParent 的，
  // 而 .novel-content / .novel-column / .novel-container 等祖先都没有 position 定位，
  // offsetParent 会一路走到 <body>，于是得到的值是该段落距页面顶端几千像素，
  // 把这个值喂给容器自身的 scrollTo 会被钳到 scrollHeight 末尾，看上去就是"滚到最底/位置乱跳"。
  scrollContainerToParagraph(container, paragraphEl) {
    const containerRect = container.getBoundingClientRect();
    const paragraphRect = paragraphEl.getBoundingClientRect();
    // 段落顶端 相对 容器内容区顶端 的距离（再叠加容器当前已滚动量，得到目标 scrollTop）
    const relativeTop = paragraphRect.top - containerRect.top + container.scrollTop;
    // 让目标段落落在容器视口的上 1/3 处
    const desired = relativeTop - container.clientHeight / 3;
    container.scrollTo({ top: Math.max(0, desired), behavior: 'smooth' });
  }

  // fixed 悬浮导航栏的底边坐标（页面坐标系）。clamp() 让 nav 高度会随视口变化，
  // 这里实时取，不缓存。
  getNavBottom() {
    const nav = this.elements.nav || document.querySelector('.nav');
    if (!nav) return 0;
    const rect = nav.getBoundingClientRect();
    return Math.max(0, rect.bottom);
  }

  // 目标列若被 nav 遮住，或整列已位于视口下方（手机端两列堆叠时常见），
  // 用 window.scrollBy 把页面挪一下，让目标列处于 nav 下方的可视区。
  ensureColumnVisible(container) {
    const rect = container.getBoundingClientRect();
    const navBottom = this.getNavBottom();
    const gap = 12;
    const vh = window.innerHeight || document.documentElement.clientHeight;

    let pageDelta = 0;
    if (rect.top < navBottom + gap) {
      // 顶端被 nav 压住 -> 把页面往下卷，使容器顶端落在 nav 下方
      pageDelta = rect.top - (navBottom + gap);
    } else if (rect.top > vh - 80) {
      // 容器几乎在视口外（在屏幕下方）-> 把页面往上卷
      pageDelta = rect.top - (navBottom + gap);
    }
    if (pageDelta !== 0) {
      window.scrollBy({ top: pageDelta, behavior: 'smooth' });
    }
  }

  clearHighlights() {
    document.querySelectorAll('.novel-paragraph.highlighted').forEach(p => {
      p.classList.remove('highlighted');
    });
  }

  // 事件委托：监听挂在 .novel-content 容器上，
  // 不论 e.target 是段落本身、JSON 中 \n 渲染出的 <br>、文本节点，
  // 还是日后可能加入的 <span class="ruby"> 等子元素，
  // 都通过 closest('.novel-paragraph') 向上找到带 data-id 的段落容器，再做匹配。
  setupEventListeners() {
    const bind = (container, isJp) => {
      // mouseover 会冒泡（mouseenter 不冒泡，不能配合委托使用）
      const mouseoverHandler = (e) => {
        const p = e.target.closest && e.target.closest('.novel-paragraph');
        if (!p || !container.contains(p) || p.classList.contains('empty')) return;
        if (this._lastHoverP === p) return;   // 在同一段落里的子节点之间移动时跳过
        this._lastHoverP = p;
        this.highlightPair(p, isJp);
      };
      
      const clickHandler = (e) => {
        const p = e.target.closest && e.target.closest('.novel-paragraph');
        if (!p || !container.contains(p) || p.classList.contains('empty')) return;
        this.highlightPair(p, isJp);
      };
      
      const touchstartHandler = (e) => {
        const p = e.target.closest && e.target.closest('.novel-paragraph');
        if (!p || !container.contains(p) || p.classList.contains('empty')) return;
        this.highlightPair(p, isJp);
      };

      container.addEventListener('mouseover', mouseoverHandler);
      container.addEventListener('click', clickHandler);
      container.addEventListener('touchstart', touchstartHandler, { passive: true });

      // 保存处理器引用以便清理
      if (!this._eventHandlers) this._eventHandlers = [];
      this._eventHandlers.push({ container, type: 'mouseover', handler: mouseoverHandler });
      this._eventHandlers.push({ container, type: 'click', handler: clickHandler });
      this._eventHandlers.push({ container, type: 'touchstart', handler: touchstartHandler });
    };
    bind(this.elements.jpContainer, true);
    bind(this.elements.zhContainer, false);

    // mouseleave 不冒泡，原先挂在 document 上几乎不会触发；改挂在 .novel-container 上。
    if (this.elements.novelWrapper) {
      const mouseleaveHandler = () => {
        this.clearHighlights();
        this._lastHoverP = null;
      };
      this.elements.novelWrapper.addEventListener('mouseleave', mouseleaveHandler);
      this._eventHandlers.push({ container: this.elements.novelWrapper, type: 'mouseleave', handler: mouseleaveHandler });
    }
  }

  destroy() {
    if (this._eventHandlers) {
      this._eventHandlers.forEach(({ container, type, handler }) => {
        container.removeEventListener(type, handler);
      });
      this._eventHandlers = null;
    }
    this.jpById.clear();
    this.zhById.clear();
    this.elements = null;
    this._lastHoverP = null;
  }
}

// ===== 特殊赠礼弹窗控制器 =====
class GiftModalController {
  constructor(options = {}) {
    this.overlay = document.getElementById('giftModalOverlay');
    this.closeBtn = document.getElementById('giftModalClose');
    this.content = document.getElementById('giftModalContent');
    this.title = document.getElementById('giftModalTitle');
    this.desc = document.getElementById('giftModalDesc');
    this.defaultTitle = options.defaultTitle || '特殊贈り物';
    this.init();
  }

  init() {
    if (!this.overlay) {
      console.warn('GiftModalController: 缺少必要的DOM元素');
      return;
    }

    this._eventHandlers = [];

    // 点击关闭按钮关闭弹窗
    if (this.closeBtn) {
      const closeBtnHandler = () => this.close();
      this.closeBtn.addEventListener('click', closeBtnHandler);
      this._eventHandlers.push({ element: this.closeBtn, type: 'click', handler: closeBtnHandler });
    }

    // 点击遮罩层关闭弹窗
    const overlayClickHandler = (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    };
    this.overlay.addEventListener('click', overlayClickHandler);
    this._eventHandlers.push({ element: this.overlay, type: 'click', handler: overlayClickHandler });

    // ESC键关闭弹窗
    const keydownHandler = (e) => {
      if (e.key === 'Escape' && this.overlay.classList.contains('active')) {
        this.close();
      }
    };
    document.addEventListener('keydown', keydownHandler);
    this._eventHandlers.push({ element: document, type: 'keydown', handler: keydownHandler });

    // 绑定礼物卡片点击事件
    this.bindGiftItemClick();
  }

  bindGiftItemClick() {
    const giftItems = document.querySelectorAll('.gift-card');
    this._giftItemHandlers = [];
    
    giftItems.forEach(item => {
      const itemClickHandler = () => {
        const type = item.dataset.type;
        const url = item.dataset.url;
        const title = item.dataset.title || item.querySelector('.gift-card-title')?.textContent || this.defaultTitle;
        
        this.open(type, url, title);
      };
      item.addEventListener('click', itemClickHandler);
      this._giftItemHandlers.push({ element: item, handler: itemClickHandler });
    });
  }

  destroy() {
    // 清理事件监听器
    if (this._eventHandlers) {
      this._eventHandlers.forEach(({ element, type, handler }) => {
        element.removeEventListener(type, handler);
      });
      this._eventHandlers = null;
    }

    // 清理礼物卡片事件监听器
    if (this._giftItemHandlers) {
      this._giftItemHandlers.forEach(({ element, handler }) => {
        element.removeEventListener('click', handler);
      });
      this._giftItemHandlers = null;
    }

    this.overlay = null;
    this.closeBtn = null;
    this.content = null;
    this.title = null;
    this.desc = null;
  }

  open(type, url, title) {
    // 清空内容
    this.content.innerHTML = '';
    this.content.classList.remove('video-mode');

    if (!url || url.trim() === '') {
      // 预留内容，显示占位提示
      this.content.innerHTML = `
        <div style="aspect-ratio: 16/9; background: linear-gradient(135deg, #fff5f8 0%, #ffe8f0 100%); display: flex; align-items: center; justify-content: center;">
          <div style="text-align: center; color: #d4708a;">
            <div style="font-size: 16px; margin-bottom: 8px;">内容準備中</div>
            <div style="font-size: clamp(12px, 1.5vw, 14px); color: #b09090;">—— 敬请期待 ——</div>
          </div>
        </div>
      `;
      this.title.textContent = title;
      this.desc.textContent = '该内容暂未开放，敬请期待';
    } else if (type === 'video') {
      // 与 Page4 VideoModalController 采用相同的 padding-top 容器方案
      this.content.classList.add('video-mode');
      let embedUrl = url;
      if (url.includes('bilibili.com/video/')) {
        const bvid = Utils.extractBvid(url);
        if (bvid) {
          embedUrl = `//player.bilibili.com/player.html?bvid=${bvid}&autoplay=1&muted=0`;
        }
      }

      const iframe = document.createElement('iframe');
      iframe.src = embedUrl;
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      this.content.appendChild(iframe);

      this.title.textContent = title;
      this.desc.textContent = '点击播放视频';
    } else if (type === 'image') {
      // 图片内容
      const img = document.createElement('img');
      img.src = url;
      img.alt = title;
      img.loading = 'lazy';
      img.onerror = () => {
        img.style.display = 'none';
        this.content.innerHTML = `
          <div style="aspect-ratio: 16/9; background: linear-gradient(135deg, #fff5f8 0%, #ffe8f0 100%); display: flex; align-items: center; justify-content: center;">
            <div style="text-align: center; color: #b09090;">
              <div style="font-size: clamp(14px, 2vw, 16px);">图片加载失败</div>
            </div>
          </div>
        `;
      };
      this.content.appendChild(img);
      
      this.title.textContent = title;
      this.desc.textContent = '';
    }

    // 显示弹窗
    this.overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.overlay.classList.remove('active');
    document.body.style.overflow = '';
    
    // 停止视频播放
    const iframe = this.content.querySelector('iframe');
    if (iframe) {
      iframe.src = '';
    }
  }
}

// ===== 时间线图片查看器 =====
class TimelineImageViewer {
  constructor() {
    this.overlay = null;
    this.imageContainer = null;
    this.closeBtn = null;
    this.currentImage = null;
    this.init();
  }

  init() {
    this.createOverlay();
    this.bindEvents();
  }

  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'timeline-image-overlay';
    this.overlay.style.display = 'none';

    this.imageContainer = document.createElement('div');
    this.imageContainer.className = 'timeline-image-container';

    this.currentImage = document.createElement('img');
    this.currentImage.className = 'timeline-image-large';

    this.closeBtn = document.createElement('button');
    this.closeBtn.className = 'timeline-image-close';
    this.closeBtn.innerHTML = '&times;';

    this.imageContainer.appendChild(this.currentImage);
    this.imageContainer.appendChild(this.closeBtn);
    this.overlay.appendChild(this.imageContainer);
    document.body.appendChild(this.overlay);
  }

  bindEvents() {
    // 事件委托绑定到时间线容器
    const timelineWrapper = document.querySelector('.timeline-wrapper');
    if (!timelineWrapper) return;

    timelineWrapper.addEventListener('click', (e) => {
      const target = e.target;
      if (target.classList.contains('tooltip-image')) {
        e.preventDefault();
        this.open(target.src, target.alt);
      }
    });

    // 关闭按钮点击
    this.closeBtn.addEventListener('click', () => this.close());

    // 点击遮罩层关闭
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    // ESC键关闭
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.overlay.style.display === 'flex') {
        this.close();
      }
    });
  }

  open(src, alt) {
    if (!src || !this.currentImage) return;

    this.currentImage.src = src;
    this.currentImage.alt = Utils.escapeHtml(alt || '');
    this.overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.overlay.style.display = 'none';
    this.currentImage.src = '';
    document.body.style.overflow = '';
  }

  destroy() {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    this.overlay = null;
    this.imageContainer = null;
    this.closeBtn = null;
    this.currentImage = null;
  }
}

// ===== 视频弹窗控制器 =====
class VideoModalController {
  constructor() {
    this.overlay = document.getElementById('videoModalOverlay');
    this.modal = this.overlay ? this.overlay.querySelector('.video-modal') : null;
    this.iframe = document.getElementById('videoModalPlayer');
    this.descEl = document.getElementById('videoModalDesc');
    this.closeBtn = this.overlay ? this.overlay.querySelector('.video-modal-close') : null;
    this.cards = document.querySelectorAll('.video-card');
    this._keydownHandler = null;
    this.init();
  }

  init() {
    if (!this.overlay || !this.iframe || !this.closeBtn) {
      console.warn('VideoModalController: 缺少必要的DOM元素');
      return;
    }
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.cards.forEach(card => {
      card.addEventListener('click', () => {
        this.open({
          title: card.dataset.title || '',
          url: card.dataset.url || '',
          desc: card.dataset.desc || ''
        });
      });
    });

    this.closeBtn.addEventListener('click', () => this.close());

    // 点击遮罩关闭（不响应弹窗内点击）
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    // ESC 关闭
    this._keydownHandler = (e) => {
      if (e.key === 'Escape' && this.overlay.classList.contains('active')) {
        this.close();
      }
    };
    document.addEventListener('keydown', this._keydownHandler);
  }

  open({ title, url, desc }) {
    const embedSrc = this.buildEmbedSrc(url);
    this.iframe.src = embedSrc;
    if (this.descEl) {
      this.descEl.textContent = desc || title || '';
    }
    this.overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.overlay.classList.remove('active');
    // 关键：清空 iframe.src 停止后台播放与发声
    this.iframe.src = '';
    document.body.style.overflow = '';
  }

  buildEmbedSrc(url) {
    const match = url && url.match(/BV[a-zA-Z0-9]+/);
    if (match) {
      return `//player.bilibili.com/player.html?bvid=${match[0]}&autoplay=0&high_quality=1&danmaku=0`;
    }
    return url || '';
  }

  destroy() {
    if (this._keydownHandler) {
      document.removeEventListener('keydown', this._keydownHandler);
    }
    this.overlay = null;
    this.iframe = null;
    this.closeBtn = null;
    this.cards = null;
  }
}

// ===== 页面初始化 =====
document.addEventListener('DOMContentLoaded', async () => {
  // 初始化礼物弹窗
  const giftModalController = new GiftModalController();

  // 初始化时间线图片查看器
  const timelineImageViewer = new TimelineImageViewer();

  // 初始化视频弹窗
  const videoModalController = new VideoModalController();

  // Page3 时间线中内联视频链接（如"自我介绍视频"）
  document.querySelectorAll('.timeline-video-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      videoModalController.open({
        title: link.dataset.title || '',
        url: link.dataset.url || '',
        desc: link.textContent || ''
      });
    });
  });
});
