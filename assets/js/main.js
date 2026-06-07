// ===== 通用：触屏长按检测 =====
// 移动端区分单击（tap）和长按：touchstart 计时，touchend 时超阈值视为长按
function createTouchHandler(onTap, onLongPress, thresholdMs = 500) {
  let timer = null;
  let canceled = false;
  return {
    start() {
      canceled = false;
      timer = setTimeout(() => {
        if (!canceled) {
          canceled = true;
          onLongPress();
        }
        timer = null;
      }, thresholdMs);
    },
    end() {
      if (timer) { clearTimeout(timer); timer = null; }
      if (!canceled) onTap();
      canceled = false;
    },
    cancel() {
      canceled = true;
      if (timer) { clearTimeout(timer); timer = null; }
    }
  };
}

// ===== 工具函数 =====
const Utils = {
  // HTML转义，防止XSS攻击
  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  // 提取B站视频BV号
  extractBvid(url) {
    const match = url.match(/BV[a-zA-Z0-9]{10}/);
    return match ? match[0] : null;
  },

  // 构建B站视频嵌入URL
  buildBilibiliEmbedUrl(url, autoplay = 0) {
    const bvid = this.extractBvid(url);
    if (bvid) {
      return `//player.bilibili.com/player.html?bvid=${bvid}&autoplay=${autoplay}&high_quality=1&danmaku=0`;
    }
    return url || '';
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
    let targetDate = new Date(currentYear, this.targetMonth, this.targetDay, 0, 0, 0, 0);

    if (now >= targetDate) {
      targetDate = new Date(currentYear + 1, this.targetMonth, this.targetDay, 0, 0, 0, 0);
    }

    return targetDate;
  }

  update() {
    const now = new Date();
    
    // 生日当天（6月8日）的特殊处理
    const isBirthday = now.getMonth() === this.targetMonth && now.getDate() === this.targetDay;
    
    if (isBirthday) {
      // 生日当天显示"00:00:00"和"生日快乐"
      this.elements.days.textContent = '00';
      this.elements.hours.textContent = '00';
      this.elements.mins.textContent = '00';
      this.elements.secs.textContent = '00';
      this.elements.caption.innerHTML = '<span class="date">生日快乐！</span>';
      return;  // 提前返回，不计算倒计时
    }

    const targetDate = this.getNextTargetDate();
    const diff = targetDate - now;

    // 防护：diff为负数时重置为0
    if (diff < 0) {
      console.warn('CountdownController: diff为负数，已重置');
      this.elements.days.textContent = '00';
      this.elements.hours.textContent = '00';
      this.elements.mins.textContent = '00';
      this.elements.secs.textContent = '00';
      this.elements.caption.innerHTML = `距离<span class="date">${this.targetLabel}</span>还有`;
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    this.elements.days.textContent = String(days).padStart(2, '0');
    this.elements.hours.textContent = String(hours).padStart(2, '0');
    this.elements.mins.textContent = String(mins).padStart(2, '0');
    this.elements.secs.textContent = String(secs).padStart(2, '0');
    this.elements.caption.innerHTML = `距离<span class="date">${this.targetLabel}</span>还有`;
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
    this.navItems = document.querySelectorAll('.nav-item');
    this.mobileNavItems = document.querySelectorAll('.mobile-nav-item');
    this.pages = document.querySelectorAll('.page');
    this.observer = null;
    this._pageRatios = new Map();
    this._activePage = null;
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
    const clickHandler = (e) => {
      e.preventDefault();
      const pageNum = e.currentTarget.dataset.page;
      this.applyActiveNav(pageNum);
      const page = document.getElementById('page' + pageNum);
      if (page) {
        page.scrollIntoView({ behavior: 'smooth' });
      }
    };

    this.navItems.forEach(item => {
      item.addEventListener('click', clickHandler);
    });

    if (this.mobileNavItems.length) {
      this.mobileNavItems.forEach(item => {
        item.addEventListener('click', clickHandler);
      });
    }
  }

  setupScrollObserver() {
    this.observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1] }
    );

    this.pages.forEach(page => this.observer.observe(page));
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      const pageNum = entry.target.id.replace('page', '');
      this._pageRatios.set(pageNum, entry.intersectionRatio);
    });

    let bestPage = null;
    let bestRatio = 0;
    this._pageRatios.forEach((ratio, pageNum) => {
      if (ratio > bestRatio) {
        bestRatio = ratio;
        bestPage = pageNum;
      }
    });

    if (bestPage !== null && bestPage !== this._activePage) {
      this._activePage = bestPage;
      this.applyActiveNav(bestPage);
    }
  }

  applyActiveNav(pageNum) {
    this._activePage = pageNum;
    this.navItems.forEach(item => {
      item.classList.toggle('active', item.dataset.page === pageNum);
    });
    if (this.mobileNavItems.length) {
      this.mobileNavItems.forEach(item => {
        item.classList.toggle('active', item.dataset.page === pageNum);
      });
    }
  }

  setActive(pageNum) {
    this.applyActiveNav(String(pageNum));
    const page = document.getElementById('page' + pageNum);
    if (page) {
      page.scrollIntoView({ behavior: 'smooth' });
    }
  }
}

// 初始化导航控制器
const navController = new NavController({ threshold: 0.5 });

// ===== 弹幕管理器（无轨道自由浮动版）=====
// 参考：参考网站采用随机位置+独立运动，各弹幕互不干扰
class DanmakuManager {
  constructor(options = {}) {
    this.container = document.getElementById('danmakuContainer');
    this.danmakus = new Set();
    this.isMobile = options.isMobile || (window.innerWidth <= 768);
    // 弹幕持续时间（秒），每个弹幕独立随机
    // 桌面 14~22 秒，移动端 11~18 秒
    this.minDuration = options.minDuration || (this.isMobile ? 11 : 14);
    this.maxDuration = options.maxDuration || (this.isMobile ? 18 : 22);
    // 弹幕在容器高度范围内随机发射，容器 overflow:hidden 自动裁切超出部分
    // 最多同时显示的弹幕数，防止拥堵
    this.maxVisible = options.maxVisible || (this.isMobile ? 15 : 30);
    // 去重池：记录最近弹幕指纹，避免短期重复
    this._dedupPool = [];
    this._dedupSize = options.dedupSize || 5;
    // 暂停状态
    this._paused = false;
    // 边界避开发射配置：每个屏占比模式下需要避开的边界区域
    // 格式: { mode: 屏占比模式索引, avoidRanges: [[start%, end%], ...] }
    this._avoidConfigs = [
      // 100vh 模式：避开底部6%区域，确保弹幕完整显示
      { mode: 0, avoidRanges: [[94, 100]] },
      // 50vh 模式：避开中间47%-53%区域（切换线附近）
      { mode: 1, avoidRanges: [[47, 53]] },
      // 25vh 模式：避开中间22%-28%区域（切换线附近）
      { mode: 2, avoidRanges: [[22, 28]] }
    ];
    this.init();
  }

  init() {
    if (!this.container) {
      console.warn('DanmakuManager: 缺少必要的DOM元素');
      return;
    }
  }

  /**
   * 发射一条弹幕。每条弹幕随机垂直位置+随机duration，互不干涉。
   * 如果当前可见弹幕已达上限则跳过。
   */
  createDanmaku(name, text, cnText) {
    if (!name || !text) return null;
    if (this._paused) return null;
    // 已达上限，跳过
    if (this.danmakus.size >= this.maxVisible) return null;
    // 去重
    if (this._isDuplicate(text)) return null;
    this._recordSent(text);

    const durationSec = this.minDuration + Math.random() * (this.maxDuration - this.minDuration);
    // top% 在容器高度范围内随机发射，但要预留弹幕自身高度避免被裁切
    // 弹幕高度约为 32px（PC端）或 24px（移动端）
    const danmakuHeight = this.isMobile ? 24 : 32;
    const containerHeight = this.container.offsetHeight;
    
    // 获取当前屏占比模式（从全局控制器获取）
    const currentMode = window.danmakuModeController ? window.danmakuModeController.getCurrentMode() : 0;
    
    // 计算有效发射区域（排除边界区域）
    const validRanges = this._calculateValidRanges(containerHeight, danmakuHeight, currentMode);
    
    // 在有效区域内随机选择一个位置
    const topPct = this._randomPositionInRanges(validRanges, containerHeight);
    
    if (topPct === null) {
      return null; // 没有有效区域可发射
    }
    
    return this._emit(name, text, cnText, topPct, durationSec);
  }
  
  /**
   * 计算有效发射区域（排除需要避开的边界区域）
   * @param {number} containerHeight - 容器高度
   * @param {number} danmakuHeight - 弹幕高度
   * @param {number} currentMode - 当前屏占比模式索引
   * @returns {Array} - 有效区域数组，格式: [{start: 起始像素, end: 结束像素}, ...]
   */
  _calculateValidRanges(containerHeight, danmakuHeight, currentMode) {
    // 基础安全边距（顶部和底部各3%）
    const baseMargin = 0.03; // 3%
    const safeTop = containerHeight * baseMargin;
    const safeBottom = containerHeight * (1 - baseMargin) - danmakuHeight;
    
    if (safeTop >= safeBottom) {
      return []; // 没有有效区域
    }
    
    // 获取当前模式需要避开的边界区域
    const avoidConfig = this._avoidConfigs.find(c => c.mode === currentMode);
    const avoidRanges = avoidConfig ? avoidConfig.avoidRanges : [];
    
    // 将避开区域转换为像素范围
    const avoidPixelRanges = avoidRanges.map(range => ({
      start: containerHeight * (range[0] / 100),
      end: containerHeight * (range[1] / 100)
    }));
    
    // 从基础有效区域中减去需要避开的区域
    let validRanges = [{ start: safeTop, end: safeBottom }];
    
    for (const avoid of avoidPixelRanges) {
      const newValid = [];
      for (const valid of validRanges) {
        // 避开区域与有效区域不重叠
        if (avoid.end <= valid.start || avoid.start >= valid.end) {
          newValid.push(valid);
        } else {
          // 左侧剩余有效区域
          if (valid.start < avoid.start) {
            newValid.push({ start: valid.start, end: Math.min(avoid.start, valid.end) });
          }
          // 右侧剩余有效区域
          if (valid.end > avoid.end) {
            newValid.push({ start: Math.max(avoid.end, valid.start), end: valid.end });
          }
        }
      }
      validRanges = newValid;
    }
    
    // 过滤无效区域
    return validRanges.filter(r => r.start < r.end);
  }
  
  /**
   * 在有效区域内随机选择一个位置
   * @param {Array} validRanges - 有效区域数组
   * @param {number} containerHeight - 容器高度
   * @returns {number|null} - 随机位置百分比，无有效区域返回null
   */
  _randomPositionInRanges(validRanges, containerHeight) {
    if (validRanges.length === 0) {
      return null;
    }
    
    // 计算所有有效区域的总长度
    const totalLength = validRanges.reduce((sum, range) => sum + (range.end - range.start), 0);
    
    // 随机选择一个位置
    let randomOffset = Math.random() * totalLength;
    
    // 找到随机位置所在的区域
    for (const range of validRanges) {
      const rangeLength = range.end - range.start;
      if (randomOffset < rangeLength) {
        const absolutePosition = range.start + randomOffset;
        return (absolutePosition / containerHeight) * 100;
      }
      randomOffset -= rangeLength;
    }
    
    return null;
  }

  _emit(name, text, cnText, topPct, durationSec) {
    const el = document.createElement('div');
    el.className = 'danmaku-item';

    const escapedName = Utils.escapeHtml(name);
    const escapedText = Utils.escapeHtml(text);
    const escapedCnText = cnText ? Utils.escapeHtml(cnText) : '';

    el.innerHTML = `<span class="danmaku-name">${escapedName}</span><span class="danmaku-text">| ${escapedText}</span>`;
    el.dataset.text = escapedText;
    el.dataset.cnText = escapedCnText;
    el.dataset.lang = 'jp';
    el.dataset.name = escapedName;
    el.dataset.duration = durationSec;

    // 弹幕相对容器定位，容器是受控舞台层（z-index 低于顶层 UI + isolation 隔离 + mask 软边缘 + overflow 兜底）
    const containerHeight = this.container.offsetHeight;
    const finalTop = containerHeight * topPct / 100;
    el.style.top = `${finalTop}px`;
    el.style.position = 'absolute';
    el.style.animationDuration = `${durationSec}s`;

    this.danmakus.add(el);
    this.container.appendChild(el);

    if (escapedCnText) {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.flipDanmaku(el);
      });
    }

    el.addEventListener('animationend', () => {
      this.removeDanmaku(el);
    }, { once: true });

    return el;
  }

  flipDanmaku(el) {
    if (el.classList.contains('flipping')) return;
    el.classList.add('flipping');
    const isJp = el.dataset.lang === 'jp';
    const escapedName = el.dataset.name;

    setTimeout(() => {
      if (!this.danmakus.has(el)) return;
      const newText = isJp ? el.dataset.cnText : el.dataset.text;
      el.innerHTML = `<span class="danmaku-name">${escapedName}</span><span class="danmaku-text">| ${newText}</span>`;
      el.dataset.lang = isJp ? 'cn' : 'jp';
      el.classList.remove('flipping');
    }, 200);
  }

  removeDanmaku(el) {
    if (!this.danmakus.has(el)) return;
    this.danmakus.delete(el);
    el.remove();
  }

  // ===== 去重 =====
  _isDuplicate(text) {
    const key = text.trim().slice(0, 20);
    return this._dedupPool.includes(key);
  }

  _recordSent(text) {
    const key = text.trim().slice(0, 20);
    this._dedupPool.push(key);
    if (this._dedupPool.length > this._dedupSize) {
      this._dedupPool.shift();
    }
  }

  // ===== 暂停/恢复（只控制播放器发射，不干涉已发射弹幕动画）=====
  pause() {
    this._paused = true;
  }

  resume() {
    this._paused = false;
  }

  hideAll() {
    this.danmakus.forEach(el => { el.style.visibility = 'hidden'; });
  }

  showAll() {
    this.danmakus.forEach(el => { el.style.visibility = ''; });
  }

  clear() {
    this.danmakus.forEach(el => el.remove());
    this.danmakus.clear();
    this._dedupPool = [];
  }
}

// 初始化弹幕管理器
const danmakuManager = new DanmakuManager();

// ===== 留言板渲染器（支持分页）=====
class MessageBoardRenderer {
  constructor(data) {
    this.data = this.sanitizeData(data) || [];
    this.currentPage = 1;
    this._isMobile = window.innerWidth <= 768;
    this.itemsPerPage = this._isMobile ? 4 : 8;
    this.elements = null;
    this._prevPageHandler = null;
    this._nextPageHandler = null;
    this._resizeHandler = null;
    
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
      text: item.text ? Utils.escapeHtml(String(item.text)) : '',
      cnText: item.cnText ? Utils.escapeHtml(String(item.cnText)) : ''
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

    // 监听断点切换：移动/桌面互切时同步每页条数与分页器模式
    this._resizeHandler = () => {
      const nowMobile = window.innerWidth <= 768;
      if (nowMobile === this._isMobile) return;
      this._isMobile = nowMobile;
      this.itemsPerPage = nowMobile ? 4 : 8;
      const totalPages = this.getTotalPages();
      if (this.currentPage > totalPages) this.currentPage = totalPages || 1;
      this.render();
    };
    window.addEventListener('resize', this._resizeHandler);
    
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

    const colorIndex = index % this.cardColors.length;
    card.style.background = this.cardColors[colorIndex];

    const randomRotation = (Math.random() * 2.4 - 1.2).toFixed(2);
    card.style.setProperty('--tilt', `${randomRotation}deg`);

    const inner = document.createElement('div');
    inner.className = 'message-card-inner';

    const front = this.createCardFace(item, 'front');
    const back = this.createCardFace(item, 'back');

    inner.appendChild(front);
    inner.appendChild(back);
    card.appendChild(inner);

    if (item.cnText) {
      card.classList.add('flippable');
      card.addEventListener('click', () => {
        if (inner.classList.contains('flipping')) return;
        inner.classList.add('flipping');
        this.matchCardHeight(card, inner, !inner.classList.contains('flipped'));
        setTimeout(() => {
          inner.classList.toggle('flipped');
          this.releaseCardHeight(card, inner);
          inner.classList.remove('flipping');
        }, 50);
      });
    }

    card.addEventListener('mouseenter', () => {
      // 悬浮效果与3D翻转互不影响，正反两面都应生效
      card.classList.add('message-card-hover');
    });

    card.addEventListener('mouseleave', () => {
      card.classList.remove('message-card-hover');
    });

    return card;
  }

  matchCardHeight(card, inner, toBack) {
    const targetFace = toBack
      ? inner.querySelector('.message-card-back')
      : inner.querySelector('.message-card-front');
    const temp = targetFace.cloneNode(true);
    temp.style.position = 'absolute';
    temp.style.visibility = 'hidden';
    temp.style.width = card.clientWidth + 'px';
    temp.style.backfaceVisibility = 'visible';
    temp.style.transform = 'none';
    document.body.appendChild(temp);
    const height = temp.offsetHeight;
    document.body.removeChild(temp);
    card.style.transition = 'height 0.3s ease';
    card.style.height = height + 'px';
  }

  releaseCardHeight(card, inner) {
    setTimeout(() => {
      // 释放内联高度，回归 grid 自动等高，避免翻面后高度被锁死
      card.style.height = '';
      card.style.transition = '';
    }, 350);
  }

  createCardFace(item, face) {
    const faceEl = document.createElement('div');
    faceEl.className = `message-card-${face}`;

    const tape = document.createElement('span');
    tape.className = 'message-tape';

    const content = document.createElement('div');
    content.className = 'message-content';

    const textPara = document.createElement('p');
    textPara.className = 'message-text';
    textPara.textContent = face === 'front' ? item.text : (item.cnText || item.text);

    content.appendChild(textPara);

    const footer = document.createElement('div');
    footer.className = 'message-footer';

    const author = document.createElement('span');
    author.className = 'message-author';
    author.textContent = `— ${item.name}`;

    footer.appendChild(author);

    faceEl.appendChild(tape);
    faceEl.appendChild(content);
    faceEl.appendChild(footer);

    return faceEl;
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

    // 移动端：极简模式（仅显示首页、当前页、末页，其余以 … 省略），避免窄屏页码挤爆
    if (this._isMobile) {
      this.renderMobilePagination(totalPages);
      return;
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

  renderMobilePagination(totalPages) {
    // 移动端显示：首页 + 当前页前后各1页（共3个中间页码）+ 末页
    // 配合左右 ‹ › 按钮，窄屏也能逐页翻动且不撑爆宽度。
    
    // 首页
    this.addPageNumber(1);
    
    // 中间3个关键页码：当前页前后各1页
    const prevPage = Math.max(2, this.currentPage - 1);
    const nextPage = Math.min(totalPages - 1, this.currentPage + 1);
    
    // 首页与中间区域之间需要省略号
    if (prevPage > 2) {
      this.addDots();
    }
    
    // 添加中间页码（确保不重复首页和末页）
    for (let i = prevPage; i <= nextPage; i++) {
      if (i !== 1 && i !== totalPages) {
        this.addPageNumber(i);
      }
    }
    
    // 中间区域与末页之间需要省略号
    if (nextPage < totalPages - 1) {
      this.addDots();
    }
    
    // 末页（总页数大于1才显示）
    if (totalPages > 1) {
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
}

// ===== 弹幕自动播放器（简化版）=====
class DanmakuAutoPlayer {
  constructor(manager, data, options = {}) {
    this.manager = manager;
    this.data = data || [];
    const isMobile = window.innerWidth <= 768;
    this.interval = options.interval || (isMobile ? 4000 : 2000);
    this.maxTextLen = options.maxTextLen || 91;
    this.intervalId = null;
  }

  start() {
    if (this.intervalId) return;
    if (this.data.length === 0) return;

    this.intervalId = setInterval(() => {
      this._emitOne();
    }, this.interval);
  }

  _isTooLong(item) {
    return item.text.length > this.maxTextLen || item.cnText.length > this.maxTextLen;
  }

  _emitOne() {
    if (this.data.length === 0) return;
    for (let attempt = 0; attempt < 10; attempt++) {
      const idx = Math.floor(Math.random() * this.data.length);
      const item = this.data[idx];
      if (!this._isTooLong(item)) {
        this.manager.createDanmaku(item.name, item.text, item.cnText);
        return;
      }
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

// 初始化弹幕自动播放器
const danmakuAutoPlayer = new DanmakuAutoPlayer(danmakuManager, sampleDanmaku);
danmakuAutoPlayer.start();

// 渲染留言板
const messageBoardRenderer = new MessageBoardRenderer(sampleDanmaku);

// ===== 音乐播放器 =====
class MusicPlayer {
  constructor(options = {}) {
    this.audio = document.getElementById('bgMusic');
    this.btn = document.getElementById('musicBtn');
    this.badge = document.getElementById('musicBadge');
    this.isPlaying = false;
    this.currentIndex = 0;
    this.autoPlay = options.autoPlay !== undefined ? options.autoPlay : false;
    this._touchFired = false;

    // 播放列表（badge 显示曲目标记）
    this.playlist = [
      { src: './assets/audio/bgm_01.mp3', badge: '♭' },
      { src: './assets/audio/bgm_03.mp3', badge: '♮' },
      { src: './assets/audio/bgm_04.mp3', badge: '♯' },
      { src: './assets/audio/bgm_02.mp3', badge: '♪' },
    ];

    this.init();
  }

  init() {
    if (!this.audio || !this.btn) {
      console.warn('MusicPlayer: 缺少必要的DOM元素');
      return;
    }
    this.loadTrack(this.currentIndex);
    this.setupEventListeners();

    if (this.autoPlay) {
      this.play();
    }
  }

  loadTrack(index) {
    const track = this.playlist[index];
    if (!track) return;
    this.audio.src = track.src;
    if (this.badge) this.badge.textContent = track.badge;
    // 如果当前正在播放，切换src后自动续播
    if (this.isPlaying) {
      this.audio.play().catch(() => {});
    }
  }

  switchTrack() {
    this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
    this.loadTrack(this.currentIndex);
  }

  setupEventListeners() {
    // 左键点击：开关
    this._clickHandler = () => {
      if (this._touchFired) { this._touchFired = false; return; }  // 触屏已处理，跳过
      if (this.isPlaying) this.pause();
      else this.play();
    };

    // 右键点击：切歌
    this._contextHandler = (e) => {
      e.preventDefault();
      if (this.playlist.length <= 1) return;
      this.switchTrack();
    };

    // 触屏：单击=开关，长按=切歌
    this._touchHandler = createTouchHandler(
      () => {
        this._touchFired = true;
        if (this.isPlaying) this.pause();
        else this.play();
      },
      () => {
        this._touchFired = true;
        if (this.playlist.length > 1) this.switchTrack();
      },
      450
    );
    this._touchStartHandler = () => { this._touchHandler.start(); };
    this._touchEndHandler = () => { this._touchHandler.end(); };
    this._touchMoveHandler = () => { this._touchHandler.cancel(); };

    this.btn.addEventListener('click', this._clickHandler);
    this.btn.addEventListener('contextmenu', this._contextHandler);
    this.btn.addEventListener('touchstart', this._touchStartHandler, { passive: true });
    this.btn.addEventListener('touchend', this._touchEndHandler, { passive: true });
    this.btn.addEventListener('touchmove', this._touchMoveHandler, { passive: true });

    // 歌曲播完自动切到下一首
    this._endedHandler = () => this.switchTrack();
    this.audio.addEventListener('ended', this._endedHandler);
  }

  play() {
    this.audio.play().catch((err) => {
      console.warn('MusicPlayer: 自动播放被阻止', err);
    });
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
}

// 初始化音乐播放器
const musicPlayer = new MusicPlayer();

// ===== 弹幕显示模式控制器（简化版）=====
// 无轨道后，模式只控制容器显示/隐藏，以及自动播放器的启停
class DanmakuModeController {
  constructor(options = {}) {
    this.container = document.getElementById('danmakuContainer');
    this.btn = document.getElementById('danmakuBtn');
    this.badge = document.getElementById('danmakuBadge');
    this.manager = options.manager || null;
    this.autoPlayer = options.autoPlayer || null;

    // 弹幕开关状态
    this._isOn = true;
    // 屏占比模式索引（仅在开启时有效）
    this._sizeMode = 0;
    this._sizeModes = [
      { height: '100vh', badge: '' },
      { height: '50vh', badge: '1/2' },
      { height: '25vh', badge: '1/4' }
    ];
    this._touchFired = false;
    this.init();
  }

  init() {
    if (!this.btn || !this.badge || !this.container) {
      console.warn('DanmakuModeController: 缺少必要的DOM元素');
      return;
    }
    // 左键点击：开关
    this._clickHandler = () => {
      if (this._touchFired) { this._touchFired = false; return; }
      this.toggle();
    };

    // 右键点击：切换屏占比
    this._contextHandler = (e) => {
      e.preventDefault();
      this.cycleSize();
    };

    // 触屏：单击=开关，长按=切换屏占比
    this._touchHandler = createTouchHandler(
      () => {
        this._touchFired = true;
        this.toggle();
      },
      () => {
        this._touchFired = true;
        this.cycleSize();
      },
      450
    );
    this._touchStartHandler = () => { this._touchHandler.start(); };
    this._touchEndHandler = () => { this._touchHandler.end(); };
    this._touchMoveHandler = () => { this._touchHandler.cancel(); };

    this.btn.addEventListener('click', this._clickHandler);
    this.btn.addEventListener('contextmenu', this._contextHandler);
    this.btn.addEventListener('touchstart', this._touchStartHandler, { passive: true });
    this.btn.addEventListener('touchend', this._touchEndHandler, { passive: true });
    this.btn.addEventListener('touchmove', this._touchMoveHandler, { passive: true });

    this.applyState();
  }

  // 左键：开关弹幕
  toggle() {
    this._isOn = !this._isOn;
    this.applyState();
  }

  // 右键：循环切换屏占比（仅开启时有效）
  cycleSize() {
    if (!this._isOn) return;
    this._sizeMode = (this._sizeMode + 1) % this._sizeModes.length;
    this.applySize();
  }

  applyState() {
    if (this._isOn) {
      // 开启弹幕
      this.container.style.display = 'block';
      this.applySize();

      this.container.style.webkitMaskImage = 'linear-gradient(to bottom, transparent 0%, #000 5%, #000 95%, transparent 100%)';
      this.container.style.maskImage = 'linear-gradient(to bottom, transparent 0%, #000 5%, #000 95%, transparent 100%)';

      if (this.manager) {
        this.manager.showAll();
        this.manager.resume();
      }
      if (this.autoPlayer) this.autoPlayer.start();

      this.btn.classList.remove('off');
      this.btn.classList.add('on');
    } else {
      // 关闭弹幕
      this.container.style.webkitMaskImage = 'linear-gradient(to bottom, transparent 0%, transparent 100%)';
      this.container.style.maskImage = 'linear-gradient(to bottom, transparent 0%, transparent 100%)';

      if (this.manager) {
        this.manager.pause();
        this.manager.hideAll();
      }
      if (this.autoPlayer) this.autoPlayer.stop();

      this.btn.classList.remove('on');
      this.btn.classList.add('off');
      this.badge.textContent = '';
    }
  }

  applySize() {
    const size = this._sizeModes[this._sizeMode];
    // 修复：当设置100vh模式时，需要减去顶部偏移量90px，避免容器超出视口底部
    if (size.height === '100vh') {
      this.container.style.height = 'calc(100vh - 90px)';
    } else {
      this.container.style.height = size.height;
    }
    this.badge.textContent = size.badge;
  }

  /**
   * 获取当前屏占比模式
   * @returns {number} 当前模式索引
   */
  getCurrentMode() {
    return this._sizeMode;
  }

  /**
   * 获取弹幕开关状态
   * @returns {boolean} 是否开启
   */
  isOn() {
    return this._isOn;
  }
}

// 初始化弹幕模式控制器
const danmakuModeController = new DanmakuModeController({ manager: danmakuManager, autoPlayer: danmakuAutoPlayer });
// 暴露到全局，供 DanmakuManager 使用
window.danmakuModeController = danmakuModeController;

// ===== 樱花飘落效果 =====
class SakuraEffect {
  constructor(options = {}) {
    const isMobile = window.innerWidth <= 768;
    this.interval = options.interval || (isMobile ? 500 : 200);
    this.lifetime = options.lifetime || (isMobile ? 12000 : 15000);
    this.minDuration = options.minDuration || (isMobile ? 8 : 6);
    this.maxDuration = options.maxDuration || (isMobile ? 18 : 14);
    this.minFontSize = isMobile ? 6 : 10;
    this.maxFontSize = isMobile ? 12 : 28;
    this.flowerTypes = ['❀', '✿', '❁', '✾', '❃', '✿'];
    this.flowerColors = ['#ffb7c5', '#ffc0cb', '#f8b4c4', '#e89bb3', '#d4708a', '#f5a3b5'];
    this.maxActive = options.maxActive || 30;
    this.intervalId = null;
    this.activeSakuras = new Set();
    this.init();
  }

  init() {
    this.start();
  }

  createSakura() {
    if (this.activeSakuras.size >= this.maxActive) return;
    const sakura = document.createElement('div');
    sakura.className = 'sakura';
    
    const randomType = this.flowerTypes[Math.floor(Math.random() * this.flowerTypes.length)];
    const randomColor = this.flowerColors[Math.floor(Math.random() * this.flowerColors.length)];
    
    sakura.innerHTML = randomType;
    sakura.style.left = `${Math.random() * 100}vw`;
    sakura.style.fontSize = `${this.minFontSize + Math.random() * (this.maxFontSize - this.minFontSize)}px`;
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
}

// 初始化樱花效果
const sakuraEffect = new SakuraEffect({
  interval: 200,
  lifetime: 15000,
  minDuration: 6,
  maxDuration: 14
});

// ===== 页面可见性管理器（统一处理后台节流）=====
// 所有 setInterval 的模块在页面不可见时停止，可见时恢复
class PageVisibilityManager {
  constructor() {
    this._controllers = [];
    this._handleVisibility = this._handleVisibility.bind(this);
    document.addEventListener('visibilitychange', this._handleVisibility);
  }

  /** 注册一个拥有 start()/stop() 方法的控制器 */
  register(controller) {
    if (controller && typeof controller.start === 'function' && typeof controller.stop === 'function') {
      this._controllers.push(controller);
    }
  }

  _handleVisibility() {
    if (document.hidden) {
      this._controllers.forEach(c => c.stop());
    } else {
      this._controllers.forEach(c => c.start());
    }
  }
}

// 注册需要后台节流的模块
const pageVisibility = new PageVisibilityManager();
pageVisibility.register(sakuraEffect);
pageVisibility.register(danmakuAutoPlayer);

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
    this._pendingUpdate = false;
    this._scrollHandler = () => {
      if (this._pendingUpdate) return;
      this._pendingUpdate = true;
      requestAnimationFrame(() => {
        this._pendingUpdate = false;
        this.update();
      });
    };
    // capture:true → 即便滚动发生在 body(而非 window)上，捕获阶段也能在 window 接住事件
    window.addEventListener('scroll', this._scrollHandler, { passive: true, capture: true });
  }

  // 兼容兜底：html/body 设了 overflow-x:hidden 后，overflow-y 计算值变 auto，
  // 移动端(尤其 iOS Safari)会让 <body> 成为真正的滚动容器，此时 window.scrollY 恒为 0。
  // 用 pageYOffset → documentElement → body 依次兜底，保证 PC / 移动端取值一致。
  getScrollTop() {
    return window.pageYOffset
      || document.documentElement.scrollTop
      || document.body.scrollTop
      || 0;
  }

  update() {
    const shouldShow = this.getScrollTop() <= this.threshold;

    if (shouldShow && !this.isShown) {
      this.hint.classList.remove('hidden');
      this.isShown = true;
    } else if (!shouldShow && this.isShown) {
      this.hint.classList.add('hidden');
      this.isShown = false;
    }
  }
}

// 初始化滚动提示
const scrollHintController = new ScrollHintController({ threshold: 100 });

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
        const desc = item.dataset.desc || item.querySelector('.gift-card-desc')?.textContent || '';
        
        this.open(type, url, title, desc);
      };
      item.addEventListener('click', itemClickHandler);
      this._giftItemHandlers.push({ element: item, handler: itemClickHandler });
    });
  }

  open(type, url, title, desc) {
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
      const embedUrl = Utils.buildBilibiliEmbedUrl(url, 1);

      const iframe = document.createElement('iframe');
      iframe.src = embedUrl;
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      this.content.appendChild(iframe);

      this.title.textContent = title;
      this.desc.textContent = desc || '点击播放视频';
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
      this.desc.textContent = desc || '';
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
    const timelineWrapper = document.querySelector('.timeline-wrapper');
    if (!timelineWrapper) return;

    // ===== tooltip 悬浮：延迟隐藏，让鼠标有时间移动到左图 =====
    const hideTimers = new Map();

    timelineWrapper.addEventListener('mouseover', (e) => {
      const item = e.target.closest('.timeline-item');
      if (!item) return;
      if (hideTimers.has(item)) {
        clearTimeout(hideTimers.get(item));
        hideTimers.delete(item);
      }
      item.classList.add('tooltip-visible');
    });

    timelineWrapper.addEventListener('mouseout', (e) => {
      const item = e.target.closest('.timeline-item');
      if (!item) return;
      const related = e.relatedTarget;
      if (related && item.contains(related)) return;
      const timer = setTimeout(() => {
        item.classList.remove('tooltip-visible');
        hideTimers.delete(item);
      }, 50);
      hideTimers.set(item, timer);
    });

    // ===== 点击事件 =====
    timelineWrapper.addEventListener('click', (e) => {
      if (e.target.closest('.timeline-video-link')) return;

      const tooltipImage = e.target.closest('.tooltip-image');
      if (!tooltipImage) return;

      e.preventDefault();
      this.open(tooltipImage.src, tooltipImage.alt);
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
}

// ===== 视频弹窗控制器 =====
class VideoModalController {
  constructor() {
    this.overlay = document.getElementById('videoModalOverlay');
    this.modal = this.overlay ? this.overlay.querySelector('.video-modal') : null;
    this.iframe = document.getElementById('videoModalPlayer');
    this.descEl = document.getElementById('videoModalDesc');
    this.titleEl = document.getElementById('videoModalTitle');
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
    if (this.titleEl) {
      this.titleEl.textContent = title || desc || '';
    }
    if (this.descEl) {
      this.descEl.textContent = desc || '';
    }
    this.overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    musicPlayer.audio.muted = true;
  }

  close() {
    this.overlay.classList.remove('active');
    // 关键：清空 iframe.src 停止后台播放与发声
    this.iframe.src = '';
    document.body.style.overflow = '';
    musicPlayer.audio.muted = false;
  }

  buildEmbedSrc(url) {
    return Utils.buildBilibiliEmbedUrl(url, 0);
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

  // 视频卡片"查看更多"按钮
  const videoLoadMoreBtn = document.getElementById('videoLoadMoreBtn');
  if (videoLoadMoreBtn) {
    let videoExpanded = false;
    const hiddenCards = document.querySelectorAll('.video-section:first-of-type .video-card.video-more-hidden');
    videoLoadMoreBtn.addEventListener('click', () => {
      videoExpanded = !videoExpanded;
      hiddenCards.forEach(card => {
        card.classList.toggle('video-more-hidden', !videoExpanded);
      });
      videoLoadMoreBtn.textContent = videoExpanded ? '收起 ▴' : '查看更多 ▾';
      videoLoadMoreBtn.classList.toggle('expanded', videoExpanded);
    });
  }

  // 特殊赠礼"查看更多"按钮（仅移动端生效）
  const giftLoadMoreBtn = document.getElementById('giftLoadMoreBtn');
  if (giftLoadMoreBtn) {
    let giftExpanded = false;
    const hiddenGifts = document.querySelectorAll('#page6 .gift-more-hidden');
    // 初始状态：移动端隐藏，PC端CSS不生效所以始终可见
    giftLoadMoreBtn.addEventListener('click', () => {
      giftExpanded = !giftExpanded;
      hiddenGifts.forEach(card => {
        card.classList.toggle('gift-more-hidden', !giftExpanded);
      });
      giftLoadMoreBtn.textContent = giftExpanded ? '收起 ▴' : '查看更多 ▾';
    });
  }

  // 歌曲部分"查看更多"按钮（复用视频部分的样式和类名）
  const songLoadMoreBtn = document.getElementById('songLoadMoreBtn');
  if (songLoadMoreBtn) {
    let songExpanded = false;
    const hiddenSongs = document.querySelectorAll('.video-section:nth-of-type(2) .video-card.video-more-hidden');
    songLoadMoreBtn.addEventListener('click', () => {
      songExpanded = !songExpanded;
      hiddenSongs.forEach(card => {
        card.classList.toggle('video-more-hidden', !songExpanded);
      });
      songLoadMoreBtn.textContent = songExpanded ? '收起 ▴' : '查看更多 ▾';
      songLoadMoreBtn.classList.toggle('expanded', songExpanded);
    });
  }

  const novelSynopsis = document.getElementById('novelSynopsis');
  const novelSynopsisHint = document.getElementById('novelSynopsisHint');
  if (novelSynopsis && novelSynopsisHint) {
    let isJp = true;
    let isAnimating = false;
    const novelSynopsisInner = novelSynopsis.querySelector('.novel-synopsis-inner');
    const novelSynopsisCN = novelSynopsis.querySelector('.novel-synopsis-cn');
    const novelSynopsisJP = novelSynopsis.querySelector('.novel-synopsis-jp');

    const syncSynopsisHeight = () => {
      if (!novelSynopsisInner) return;
      const activeEl = isJp ? novelSynopsisJP : novelSynopsisCN;
      if (activeEl) {
        activeEl.style.position = 'relative';
        activeEl.style.visibility = 'hidden';
        activeEl.style.opacity = '1';
        const height = activeEl.scrollHeight;
        activeEl.style.position = '';
        activeEl.style.visibility = '';
        activeEl.style.opacity = '';
        novelSynopsisInner.style.height = height + 'px';
      }
    };
    syncSynopsisHeight();

    novelSynopsisHint.addEventListener('click', () => {
      if (isAnimating) return;
      isAnimating = true;

      if (!isJp) {
        novelSynopsis.classList.add('is-switching');
        novelSynopsis.classList.remove('is-switching-back');
      } else {
        novelSynopsis.classList.add('is-switching-back');
        novelSynopsis.classList.remove('is-switching');
      }

      const totalDuration = isJp ? 650 : 650;
      setTimeout(() => {
        isJp = !isJp;
        novelSynopsis.classList.toggle('is-jp', isJp);
        novelSynopsis.classList.remove('is-switching', 'is-switching-back');
        novelSynopsisHint.textContent = isJp ? '点击切换中文 ▸' : '日本語で読む ▸';
        syncSynopsisHeight();
        isAnimating = false;
      }, totalDuration);
    });
  }

  // ===== 粉丝来信文字切换 =====
  const fanletterText = document.getElementById('fanletterText');
  const fanletterSwitch = document.getElementById('fanletterSwitch');
  const fanletterCN = document.getElementById('fanletterCN');
  const fanletterJP = document.getElementById('fanletterJP');
  if (fanletterText && fanletterSwitch) {
    let isFanletterJp = fanletterText.classList.contains('is-jp');
    let fanletterAnimating = false;
    const fanletterContent = fanletterText.querySelector('.fanletter-text-content');

    const syncFanletterHeight = () => {
      if (!fanletterContent) return;
      const activeEl = isFanletterJp ? fanletterJP : fanletterCN;
      if (activeEl) {
        activeEl.style.position = 'relative';
        activeEl.style.visibility = 'hidden';
        activeEl.style.opacity = '1';
        const height = activeEl.scrollHeight;
        activeEl.style.position = '';
        activeEl.style.visibility = '';
        activeEl.style.opacity = '';
        fanletterContent.style.height = height + 'px';
      }
    };
    syncFanletterHeight();

    fanletterSwitch.addEventListener('click', () => {
      if (fanletterAnimating) return;
      fanletterAnimating = true;

      if (!isFanletterJp) {
        fanletterText.classList.add('is-switching');
        fanletterText.classList.remove('is-switching-back');
      } else {
        fanletterText.classList.add('is-switching-back');
        fanletterText.classList.remove('is-switching');
      }

      setTimeout(() => {
        isFanletterJp = !isFanletterJp;
        fanletterText.classList.toggle('is-jp', isFanletterJp);
        fanletterText.classList.remove('is-switching', 'is-switching-back');
        fanletterSwitch.textContent = isFanletterJp ? '点击切换中文 ▸' : '日本語で読む ▸';
        syncFanletterHeight();
        fanletterAnimating = false;
      }, 650);
    });
  }

  // ===== 粉丝来信 2 文字切换 =====
  const fanletterText2 = document.getElementById('fanletterText2');
  const fanletterSwitch2 = document.getElementById('fanletterSwitch2');
  const fanletterCN2 = document.getElementById('fanletterCN2');
  const fanletterJP2 = document.getElementById('fanletterJP2');
  if (fanletterText2 && fanletterSwitch2) {
    let isFanletterJp2 = fanletterText2.classList.contains('is-jp');
    let fanletterAnimating2 = false;
    const fanletterContent2 = fanletterText2.querySelector('.fanletter-text-content');

    const syncFanletterHeight2 = () => {
      if (!fanletterContent2) return;
      const activeEl = isFanletterJp2 ? fanletterJP2 : fanletterCN2;
      if (activeEl) {
        activeEl.style.position = 'relative';
        activeEl.style.visibility = 'hidden';
        activeEl.style.opacity = '1';
        const height = activeEl.scrollHeight;
        activeEl.style.position = '';
        activeEl.style.visibility = '';
        activeEl.style.opacity = '';
        fanletterContent2.style.height = height + 'px';
      }
    };
    syncFanletterHeight2();

    fanletterSwitch2.addEventListener('click', () => {
      if (fanletterAnimating2) return;
      fanletterAnimating2 = true;

      if (!isFanletterJp2) {
        fanletterText2.classList.add('is-switching');
        fanletterText2.classList.remove('is-switching-back');
      } else {
        fanletterText2.classList.add('is-switching-back');
        fanletterText2.classList.remove('is-switching');
      }

      setTimeout(() => {
        isFanletterJp2 = !isFanletterJp2;
        fanletterText2.classList.toggle('is-jp', isFanletterJp2);
        fanletterText2.classList.remove('is-switching', 'is-switching-back');
        fanletterSwitch2.textContent = isFanletterJp2 ? '点击切换中文 ▸' : '日本語で読む ▸';
        syncFanletterHeight2();
        fanletterAnimating2 = false;
      }, 650);
    });
  }

  // 粉丝来信3日语切换
  const fanletterText3 = document.getElementById('fanletterText3');
  const fanletterSwitch3 = document.getElementById('fanletterSwitch3');
  const fanletterCN3 = document.getElementById('fanletterCN3');
  const fanletterJP3 = document.getElementById('fanletterJP3');
  if (fanletterText3 && fanletterSwitch3) {
    let isFanletterJp3 = fanletterText3.classList.contains('is-jp');
    let fanletterAnimating3 = false;
    const fanletterContent3 = fanletterText3.querySelector('.fanletter-text-content');

    const syncFanletterHeight3 = () => {
      if (!fanletterContent3) return;
      const activeEl = isFanletterJp3 ? fanletterJP3 : fanletterCN3;
      if (activeEl) {
        activeEl.style.position = 'relative';
        activeEl.style.visibility = 'hidden';
        activeEl.style.opacity = '1';
        const height = activeEl.scrollHeight;
        activeEl.style.position = '';
        activeEl.style.visibility = '';
        activeEl.style.opacity = '';
        fanletterContent3.style.height = height + 'px';
      }
    };
    syncFanletterHeight3();

    fanletterSwitch3.addEventListener('click', () => {
      if (fanletterAnimating3) return;
      fanletterAnimating3 = true;

      if (!isFanletterJp3) {
        fanletterText3.classList.add('is-switching');
        fanletterText3.classList.remove('is-switching-back');
      } else {
        fanletterText3.classList.add('is-switching-back');
        fanletterText3.classList.remove('is-switching');
      }

      setTimeout(() => {
        isFanletterJp3 = !isFanletterJp3;
        fanletterText3.classList.toggle('is-jp', isFanletterJp3);
        fanletterText3.classList.remove('is-switching', 'is-switching-back');
        fanletterSwitch3.textContent = isFanletterJp3 ? '点击切换中文 ▸' : '日本語で読む ▸';
        syncFanletterHeight3();
        fanletterAnimating3 = false;
      }, 650);
    });
  }

  // 粉丝来信视频点击
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

  // Page3 时间线中外链链接（如动态帖子等）
  document.querySelectorAll('.timeline-external-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const url = link.dataset.url;
      const target = link.dataset.target || '_blank';
      if (url) {
        window.open(url, target);
      }
    });
  });

  // Page6 粉丝来信视频点击（打开B站视频弹窗）
  document.querySelectorAll('.fanletter-video-inner').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      videoModalController.open({
        title: el.dataset.videoTitle || '',
        url: el.dataset.videoUrl || '',
        desc: el.dataset.videoDesc || ''
      });
    });
  });

  // Page3 时间线语言切换
  class TimelineLangController {
    constructor() {
      this.title = document.querySelector('.page-title[data-timeline-lang]');
      this.titles = document.querySelectorAll('.timeline-title');
      this.descs = document.querySelectorAll('.timeline-desc');
      this.hint = document.querySelector('.timeline-lang-hint');
      this.isJapanese = true;
      this.isAnimating = false;
      this.init();
    }

    init() {
      if (!this.title) return;
      this.title.addEventListener('click', () => this.toggle());
    }

    toggle() {
      if (this.isAnimating) return;
      this.isAnimating = true;

      // 先渐隐所有内容
      const allItems = [...this.titles, ...this.descs];
      allItems.forEach(el => {
        el.style.opacity = '0';
        el.style.transition = 'opacity 0.3s ease';
      });
      // 渐隐提示文字
      if (this.hint) {
        this.hint.style.opacity = '0';
        this.hint.style.transition = 'opacity 0.3s ease';
      }

      setTimeout(() => {
        // 切换语言数据
        this.isJapanese = !this.isJapanese;
        this.updateContent();
        this.title.dataset.timelineLang = this.isJapanese ? 'ja' : 'cn';

        // 渐显所有内容
        setTimeout(() => {
          allItems.forEach(el => {
            el.style.opacity = '1';
          });
          // 渐显提示文字
          if (this.hint) {
            this.hint.style.opacity = '1';
          }
          setTimeout(() => {
            // 清除内联样式
            allItems.forEach(el => {
              el.style.opacity = '';
              el.style.transition = '';
            });
            if (this.hint) {
              this.hint.style.opacity = '';
              this.hint.style.transition = '';
            }
            this.isAnimating = false;
          }, 400);
        }, 50);
      }, 350);
    }

    updateContent() {
      this.titles.forEach(el => {
        const text = this.isJapanese ? el.dataset.ja : el.dataset.cn;
        if (text) el.textContent = text;
      });
      this.descs.forEach(el => {
        const text = this.isJapanese ? el.dataset.ja : el.dataset.cn;
        if (text) el.innerHTML = text;
      });
      // 更新提示文字
      if (this.hint) {
        const text = this.isJapanese ? this.hint.dataset.ja : this.hint.dataset.cn;
        if (text) this.hint.textContent = text;
      }
      // 重新绑定视频链接事件
      document.querySelectorAll('.timeline-video-link').forEach(link => {
        link.removeEventListener('click', this.handleVideoLink);
        link.addEventListener('click', this.handleVideoLink);
      });
      // 重新绑定外链事件
      document.querySelectorAll('.timeline-external-link').forEach(link => {
        link.removeEventListener('click', this.handleExternalLink);
        link.addEventListener('click', this.handleExternalLink);
      });
    }

    handleVideoLink(e) {
      e.preventDefault();
      e.stopPropagation();
      videoModalController.open({
        title: e.currentTarget.dataset.title || '',
        url: e.currentTarget.dataset.url || '',
        desc: e.currentTarget.textContent || ''
      });
    }

    handleExternalLink(e) {
      e.preventDefault();
      e.stopPropagation();
      const url = e.currentTarget.dataset.url;
      const target = e.currentTarget.dataset.target || '_blank';
      if (url) {
        window.open(url, target);
      }
    }
  }

  // 初始化时间线语言切换
  new TimelineLangController();
});
