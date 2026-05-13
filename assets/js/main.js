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
  autoPlayInterval: 5000,
  transitionDuration: 1000
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
    this.animationData = new WeakMap();
    this.minDuration = options.minDuration || 10;
    this.maxDuration = options.maxDuration || 16;
    this.maxTopPosition = options.maxTopPosition || 50;
    this.init();
  }

  init() {
    if (!this.container) {
      console.warn('DanmakuManager: 缺少必要的DOM元素');
      return;
    }
    this.initEventListeners();
  }

  initEventListeners() {
    // 使用事件委托，只在容器上绑定一次
    this.container.addEventListener('mouseenter', this.handleMouseEnter.bind(this), true);
    this.container.addEventListener('mouseleave', this.handleMouseLeave.bind(this), true);
  }

  createDanmaku(name, text) {
    if (!name || !text) return null;

    const el = document.createElement('div');
    el.className = 'danmaku-item';
    
    // 使用统一的工具函数进行HTML转义
    const escapedName = Utils.escapeHtml(name);
    const escapedText = Utils.escapeHtml(text);
    
    el.innerHTML = `<span class="danmaku-name">${escapedName}</span><span class="danmaku-text">| ${escapedText}</span>`;
    el.style.top = `${Math.random() * this.maxTopPosition}vh`;
    el.style.animationDuration = `${this.minDuration + Math.random() * (this.maxDuration - this.minDuration)}s`;
    
    const animationDuration = parseFloat(el.style.animationDuration);
    
    // 存储动画状态数据
    this.animationData.set(el, {
      animationDuration: animationDuration,
      isPaused: false,
      pauseStartTime: 0,
      totalPausedDuration: 0,
      animationStartTime: performance.now()
    });
    
    this.danmakus.add(el);
    this.container.appendChild(el);
    
    // 设置自动销毁
    const totalTime = animationDuration * 1000 + 2000;
    setTimeout(() => {
      this.removeDanmaku(el);
    }, totalTime);
    
    return el;
  }

  removeDanmaku(el) {
    if (this.danmakus.has(el)) {
      this.danmakus.delete(el);
      this.animationData.delete(el);
      el.remove();
    }
  }

  handleMouseEnter(e) {
    const target = e.target.closest('.danmaku-item');
    if (!target || !this.danmakus.has(target)) return;
    
    const data = this.animationData.get(target);
    if (data && !data.isPaused) {
      data.isPaused = true;
      data.pauseStartTime = performance.now();
      target.style.animationPlayState = 'paused';
    }
  }

  handleMouseLeave(e) {
    const target = e.target.closest('.danmaku-item');
    if (!target || !this.danmakus.has(target)) return;
    
    const data = this.animationData.get(target);
    if (data && data.isPaused) {
      data.isPaused = false;
      data.totalPausedDuration += performance.now() - data.pauseStartTime;
      const elapsed = performance.now() - data.animationStartTime - data.totalPausedDuration;
      const progress = Math.min(elapsed / (data.animationDuration * 1000), 1);
      target.style.animationDuration = data.animationDuration + 's';
      target.style.animationDelay = -progress * data.animationDuration + 's';
      target.style.animationPlayState = 'running';
    }
  }

  destroy() {
    this.danmakus.forEach(el => el.remove());
    this.danmakus.clear();
    this.animationData = new WeakMap();
    this.container.removeEventListener('mouseenter', this.handleMouseEnter, true);
    this.container.removeEventListener('mouseleave', this.handleMouseLeave, true);
  }
}

// 弹幕数据
const sampleDanmaku = [
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
const danmakuManager = new DanmakuManager();

// ===== 留言板渲染器 =====
class MessageBoardRenderer {
  constructor(data) {
    this.data = data || [];
    this.elements = {
      container: document.getElementById('messagesContainer'),
      count: document.getElementById('messagesCount')
    };
  }

  render() {
    if (!this.elements.container) {
      console.warn('MessageBoardRenderer: 缺少必要的DOM元素');
      return;
    }

    // 更新留言数量
    if (this.elements.count) {
      this.elements.count.textContent = this.data.length + ' 件';
    }

    // 清空容器
    this.elements.container.innerHTML = '';

    // 遍历数据，创建留言卡片
    this.data.forEach((item, index) => {
      const card = this.createCard(item, index);
      this.elements.container.appendChild(card);
    });
  }

  createCard(item, index) {
    const card = document.createElement('div');
    card.className = 'message-card';
    card.style.animationDelay = `${index * 0.1}s`;

    // 获取名字首字母作为头像显示（使用XSS防护）
    const firstChar = Utils.escapeHtml(item.name.charAt(0));
    const escapedName = Utils.escapeHtml(item.name);
    const escapedText = Utils.escapeHtml(item.text);
    const randomTime = this.getRandomTime();

    card.innerHTML = `
      <div class="message-header-inner">
        <div class="message-avatar">${firstChar}</div>
        <p class="message-sender">${escapedName}</p>
      </div>
      <p class="message-text">${escapedText}</p>
      <div class="message-time">${randomTime}</div>
    `;

    return card;
  }

  getRandomTime() {
    const hours = Math.floor(Math.random() * 24);
    const mins = Math.floor(Math.random() * 60);
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }
}

// ===== 弹幕发送器 =====
class DanmakuSender {
  constructor(options = {}) {
    this.defaultName = options.defaultName || '匿名艦長';
    this.placeholder = options.placeholder || 'コメントを入力してください';
    this.elements = {
      nameInput: document.getElementById('danmakuName'),
      textInput: document.getElementById('danmakuText'),
      sendBtn: document.getElementById('danmakuSend'),
      messagesBox: document.getElementById('messagesBox')
    };
    this.init();
  }

  init() {
    if (!this.elements.textInput) {
      console.warn('DanmakuSender: 缺少必要的DOM元素');
      return;
    }
    this.setupEventListeners();
  }

  setupEventListeners() {
    // 回车发送
    this.elements.textInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.send();
      }
    });

    // 按钮点击发送
    if (this.elements.sendBtn) {
      this.elements.sendBtn.addEventListener('click', () => this.send());
    }
  }

  send() {
    const name = this.elements.nameInput?.value.trim() || this.defaultName;
    const text = this.elements.textInput.value.trim();

    if (!text) {
      alert(this.placeholder);
      return;
    }

    // 使用弹幕管理器创建弹幕
    danmakuManager.createDanmaku(name, text);

    // 添加到留言列表
    this.addToMessagesBox(name, text);

    // 清空输入
    if (this.elements.nameInput) {
      this.elements.nameInput.value = '';
    }
    this.elements.textInput.value = '';
  }

  addToMessagesBox(name, text) {
    if (!this.elements.messagesBox) return;

    const messageItem = document.createElement('div');
    messageItem.className = 'message-item';
    
    // 使用统一的XSS防护
    const escapedName = Utils.escapeHtml(name);
    const escapedText = Utils.escapeHtml(text);
    
    messageItem.innerHTML = `
      <p class="message-sender">${escapedName}</p>
      <p class="message-text">${escapedText}</p>
    `;
    
    this.elements.messagesBox.prepend(messageItem);
    this.elements.messagesBox.scrollTop = 0;
  }
}

// ===== 弹幕自动播放器 =====
class DanmakuAutoPlayer {
  constructor(manager, data, options = {}) {
    this.manager = manager;
    this.data = data || [];
    this.interval = options.interval || 3000;
    this.currentIndex = 0;
    this.intervalId = null;
  }

  start() {
    if (this.intervalId) return;
    if (this.data.length === 0) return;

    // 立即发送第一条
    this.sendNext();

    this.intervalId = setInterval(() => {
      this.sendNext();
    }, this.interval);
  }

  sendNext() {
    const item = this.data[this.currentIndex];
    this.manager.createDanmaku(item.name, item.text);
    this.currentIndex = (this.currentIndex + 1) % this.data.length;
  }

  stop() {
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

// 初始化弹幕发送器
const danmakuSender = new DanmakuSender();

// 初始化弹幕自动播放器
const danmakuAutoPlayer = new DanmakuAutoPlayer(danmakuManager, sampleDanmaku, { interval: 3000 });
danmakuAutoPlayer.start();

// 渲染留言板
const messageBoardRenderer = new MessageBoardRenderer(sampleDanmaku);
messageBoardRenderer.render();

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
    this.btn.addEventListener('click', () => this.toggle());
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
    this.btn.removeEventListener('click', this.toggle);
    this.audio.pause();
    this.audio = null;
    this.btn = null;
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
    this.btn.addEventListener('click', () => this.toggle());
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
    this.btn.removeEventListener('click', this.toggle);
    this.container = null;
    this.btn = null;
    this.badge = null;
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
    window.addEventListener('scroll', () => this.update());
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
    window.removeEventListener('scroll', () => this.update());
    this.hint = null;
  }
}

// 初始化滚动提示
const scrollHintController = new ScrollHintController({ threshold: 100 });

// ===== 小说内容加载器 =====
class NovelLoader {
  constructor(options = {}) {
    this.jpUrl = options.jpUrl || './novel_jp.txt';
    this.zhUrl = options.zhUrl || './novel_zh.txt';
    this.elements = {
      jpContainer: document.getElementById('novelJapanese'),
      zhContainer: document.getElementById('novelChinese')
    };
    this.onLoadComplete = options.onLoadComplete || null;
  }

  async load() {
    // 并行加载中日文内容
    const [jpResult, zhResult] = await Promise.all([
      this.loadFile(this.jpUrl),
      this.loadFile(this.zhUrl)
    ]);

    // 设置内容
    this.elements.jpContainer.innerHTML = jpResult.success 
      ? this.formatNovelText(jpResult.content, 'jp')
      : '<p class="empty-text">【日本語の小説テキストをここに入力してください】</p>';

    this.elements.zhContainer.innerHTML = zhResult.success 
      ? this.formatNovelText(zhResult.content, 'zh')
      : '<p class="empty-text">【请在此输入中文小说文本】</p>';

    // 触发回调
    if (typeof this.onLoadComplete === 'function') {
      setTimeout(this.onLoadComplete, 100);
    }
  }

  async loadFile(url) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const content = await response.text();
        return { success: true, content };
      }
      return { success: false, error: 'HTTP error' };
    } catch (error) {
      console.error(`Failed to load ${url}:`, error);
      return { success: false, error: error.message };
    }
  }

  formatNovelText(text, lang) {
    const paragraphs = text.split('\n');
    return paragraphs.map((p, i) => {
      const trimmedText = p.trim();
      if (!trimmedText) {
        return `<p class="novel-paragraph empty" data-index="${i}" data-serial="" data-lang="${lang}">&nbsp;</p>`;
      }
      const serialMatch = trimmedText.match(/^([\d]+)[.、:：]\s*/);
      const serial = serialMatch ? serialMatch[1] : '';
      const cleanedText = serialMatch ? trimmedText.replace(serialMatch[0], '') : trimmedText;
      return `<p class="novel-paragraph" data-index="${i}" data-serial="${serial}" data-lang="${lang}">${cleanedText}</p>`;
    }).join('');
  }
}

// ===== 小说同步控制器 =====
class NovelSyncController {
  constructor() {
    this.elements = {
      jpContainer: document.getElementById('novelJapanese'),
      zhContainer: document.getElementById('novelChinese')
    };
    this.jpSerialMap = new Map();
    this.zhSerialMap = new Map();
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
    const jpParagraphs = this.elements.jpContainer.querySelectorAll('.novel-paragraph');
    const zhParagraphs = this.elements.zhContainer.querySelectorAll('.novel-paragraph');

    this.jpSerialMap.clear();
    this.zhSerialMap.clear();

    jpParagraphs.forEach(p => {
      const serial = p.dataset.serial;
      if (serial) {
        this.jpSerialMap.set(serial, p);
      }
    });

    zhParagraphs.forEach(p => {
      const serial = p.dataset.serial;
      if (serial) {
        this.zhSerialMap.set(serial, p);
      }
    });
  }

  highlightPair(sourceP, isJp) {
    // 移除所有高亮
    document.querySelectorAll('.novel-paragraph.highlighted').forEach(p => {
      p.classList.remove('highlighted');
    });

    const sourceSerial = sourceP.dataset.serial;
    const targetSerialMap = isJp ? this.zhSerialMap : this.jpSerialMap;
    const targetContainer = isJp ? this.elements.zhContainer : this.elements.jpContainer;

    // 高亮当前段落（非空行）
    if (!sourceP.classList.contains('empty') && sourceSerial) {
      sourceP.classList.add('highlighted');
    }

    // 使用序号查找对应的目标段落
    if (sourceSerial && targetSerialMap.has(sourceSerial)) {
      const targetP = targetSerialMap.get(sourceSerial);
      if (!targetP.classList.contains('empty')) {
        targetP.classList.add('highlighted');
      }

      // 滚动到对应位置
      const containerHeight = targetContainer.clientHeight;
      const targetTop = targetP.offsetTop;
      const scrollTarget = Math.max(0, targetTop - containerHeight / 3);

      targetContainer.scrollTo({
        top: scrollTarget,
        behavior: 'smooth'
      });
    }
  }

  setupEventListeners() {
    // 为日语段落添加事件监听
    this.elements.jpContainer.querySelectorAll('.novel-paragraph').forEach(p => {
      p.addEventListener('mouseenter', () => this.highlightPair(p, true));
    });

    // 为中文段落添加事件监听
    this.elements.zhContainer.querySelectorAll('.novel-paragraph').forEach(p => {
      p.addEventListener('mouseenter', () => this.highlightPair(p, false));
    });

    // 鼠标离开时移除所有高亮
    document.addEventListener('mouseleave', (e) => {
      const target = e.target;
      if (target && target.classList && 
          !target.classList.contains('novel-paragraph') && 
          !(target.closest && target.closest('.novel-content'))) {
        document.querySelectorAll('.novel-paragraph.highlighted').forEach(hp => {
          hp.classList.remove('highlighted');
        });
      }
    }, true);
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

    // 点击关闭按钮关闭弹窗
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }

    // 点击遮罩层关闭弹窗
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    // ESC键关闭弹窗
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.overlay.classList.contains('active')) {
        this.close();
      }
    });

    // 绑定礼物卡片点击事件
    this.bindGiftItemClick();
  }

  bindGiftItemClick() {
    const giftItems = document.querySelectorAll('.gift-item');
    giftItems.forEach(item => {
      item.addEventListener('click', () => {
        const type = item.dataset.type;
        const url = item.dataset.url;
        const title = item.dataset.title || item.querySelector('.gift-title')?.textContent || this.defaultTitle;
        
        this.open(type, url, title);
      });
    });
  }

  open(type, url, title) {
    // 清空内容
    this.content.innerHTML = '';

    if (!url || url.trim() === '') {
      // 预留内容，显示占位提示
      this.content.innerHTML = `
        <div style="aspect-ratio: 16/9; background: linear-gradient(135deg, #fff5f8 0%, #ffe8f0 100%); display: flex; align-items: center; justify-content: center;">
          <div style="text-align: center; color: #d4708a;">
            <div style="font-size: 48px; margin-bottom: 16px;">🎁</div>
            <div style="font-size: clamp(14px, 2vw, 16px);">内容即将开放</div>
            <div style="font-size: clamp(12px, 1.5vw, 14px); color: #888; margin-top: 8px;">敬请期待</div>
          </div>
        </div>
      `;
      this.title.textContent = title;
      this.desc.textContent = '该内容暂未开放，敬请期待';
    } else if (type === 'video') {
      // 视频内容
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
            <div style="text-align: center; color: #d4708a;">
              <div style="font-size: 48px; margin-bottom: 16px;">🖼️</div>
              <div style="font-size: clamp(14px, 2vw, 16px);">图片加载失败</div>
            </div>
          </div>
        `;
      };
      this.content.appendChild(img);
      
      this.title.textContent = title;
      this.desc.textContent = '点击图片可放大查看';
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

// ===== 页面初始化 =====
document.addEventListener('DOMContentLoaded', async () => {
  // 加载小说内容并设置同步
  const novelLoader = new NovelLoader({
    onLoadComplete: () => {
      const novelSyncController = new NovelSyncController();
      novelSyncController.init();
    }
  });
  await novelLoader.load();

  // 初始化礼物弹窗
  const giftModalController = new GiftModalController();

  // 初始化时间线图片查看器
  const timelineImageViewer = new TimelineImageViewer();
});
