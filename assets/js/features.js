/**
 * OFREE 功能模块
 * 包含：搜索功能、暗黑模式、收藏功能、快捷键支持
 */

(function() {
  'use strict';

  // ============================================
  // 全局状态管理
  // ============================================
  const OFREE = {
    data: null,                    // 网站数据
    favorites: [],                 // 收藏列表
    theme: 'light',                // 当前主题（默认亮色）
    searchResults: [],             // 搜索结果
    isSearchOpen: false,           // 搜索框状态
    isFavoritesOpen: false         // 收藏面板状态
  };

  // ============================================
  // 工具函数
  // ============================================
  
  /**
   * 防抖函数
   * @param {Function} func - 要执行的函数
   * @param {number} wait - 等待时间（毫秒）
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * 从 localStorage 获取数据
   * @param {string} key - 键名
   * @param {*} defaultValue - 默认值
   */
  function getStorage(key, defaultValue) {
    try {
      const value = localStorage.getItem(key);
      if (value === null) return defaultValue;
      // 尝试解析 JSON，如果失败就返回原始值
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    } catch (e) {
      return defaultValue;
    }
  }

  /**
   * 保存数据到 localStorage
   * @param {string} key - 键名
   * @param {*} value - 值
   */
  function setStorage(key, value) {
    try {
      // 如果是字符串类型，直接存储；否则用 JSON 序列化
      if (typeof value === 'string') {
        localStorage.setItem(key, value);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (e) {
      console.warn('localStorage 保存失败:', e);
    }
  }

  /**
   * 高亮搜索关键词
   * @param {string} text - 原文本
   * @param {string} keyword - 关键词
   */
  function highlightKeyword(text, keyword) {
    if (!keyword) return text;
    const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark style="background: var(--primary-color); color: var(--bg-primary); padding: 0 2px; border-radius: 2px;">$1</mark>');
  }

  // ============================================
  // 搜索功能
  // ============================================
  
  /**
   * 搜索网站
   * @param {string} keyword - 搜索关键词
   */
  function searchSites(keyword) {
    if (!OFREE.data || !keyword.trim()) {
      return [];
    }

    const results = [];
    const lowerKeyword = keyword.toLowerCase().trim();

    // 遍历所有分类和网站
    for (const [category, categoryData] of Object.entries(OFREE.data)) {
      // 处理一级分类
      if (Array.isArray(categoryData)) {
        categoryData.forEach(site => {
          if (matchSite(site, lowerKeyword, category)) {
            results.push({ ...site, category, subCategory: null });
          }
        });
      }
      // 处理二级分类
      else if (typeof categoryData === 'object') {
        for (const [subCategory, sites] of Object.entries(categoryData)) {
          if (Array.isArray(sites)) {
            sites.forEach(site => {
              if (matchSite(site, lowerKeyword, category, subCategory)) {
                results.push({ ...site, category, subCategory });
              }
            });
          }
        }
      }
    }

    return results;
  }

  /**
   * 匹配网站
   */
  function matchSite(site, keyword, category, subCategory = null) {
    const nameMatch = site.name.toLowerCase().includes(keyword);
    const descMatch = site.desc.toLowerCase().includes(keyword);
    const categoryMatch = category.toLowerCase().includes(keyword);
    const subCategoryMatch = subCategory && subCategory.toLowerCase().includes(keyword);
    
    return nameMatch || descMatch || categoryMatch || subCategoryMatch;
  }

  /**
   * 渲染搜索结果
   * @param {Array} results - 搜索结果
   * @param {string} keyword - 搜索关键词
   */
  function renderSearchResults(results, keyword) {
    const container = document.querySelector('.search-results');
    if (!container) return;

    if (results.length === 0) {
      container.innerHTML = `
        <div class="search-no-results">
          <i class="fa fa-search" style="font-size: 32px; margin-bottom: 12px; opacity: 0.5;"></i>
          <p>未找到相关网站</p>
          <p style="font-size: 12px; margin-top: 8px;">试试其他关键词？</p>
        </div>
      `;
      return;
    }

    container.innerHTML = results.slice(0, 10).map(site => `
      <div class="search-result-item" data-url="${site.url}" data-name="${site.name}">
        <img src="../assets/images/logos/${site.logo}" alt="${site.name}" onerror="this.src='../assets/images/logos/default.png'">
        <div class="search-result-info">
          <div class="search-result-name">${highlightKeyword(site.name, keyword)}</div>
          <div class="search-result-desc">${highlightKeyword(site.desc, keyword)}</div>
        </div>
        ${site.subCategory ? 
          `<span class="search-result-category">${site.subCategory}</span>` :
          `<span class="search-result-category">${site.category}</span>`
        }
      </div>
    `).join('');

    // 绑定点击事件
    container.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const url = item.dataset.url;
        if (url) {
          window.open(url, '_blank');
          recordVisit(url, item.dataset.name);
        }
        closeSearch();
      });
    });
  }

  /**
   * 打开搜索
   */
  function openSearch() {
    const container = document.querySelector('.search-container');
    const input = document.querySelector('.search-input');
    const results = document.querySelector('.search-results');
    
    if (container && input) {
      OFREE.isSearchOpen = true;
      input.focus();
      if (results && input.value.trim()) {
        results.classList.add('active');
      }
    }
  }

  /**
   * 关闭搜索
   */
  function closeSearch() {
    const input = document.querySelector('.search-input');
    const results = document.querySelector('.search-results');
    
    if (input) {
      input.value = '';
    }
    if (results) {
      results.classList.remove('active');
    }
    OFREE.isSearchOpen = false;
  }

  /**
   * 初始化搜索功能
   */
  function initSearch() {
    // 创建搜索框HTML
    const searchHTML = `
      <div class="search-container" style="margin: 0 30px 30px;">
        <div class="search-wrapper">
          <input type="text" class="search-input" placeholder="搜索网站名称、描述或分类..." autocomplete="off">
          <i class="fa fa-search search-icon"></i>
          <span class="search-shortcut">Ctrl+K</span>
        </div>
        <div class="search-results"></div>
      </div>
    `;

    // 插入到页面标题后面
    const pageHeader = document.querySelector('.page-header');
    if (pageHeader) {
      pageHeader.insertAdjacentHTML('afterend', searchHTML);
    }

    const input = document.querySelector('.search-input');
    const results = document.querySelector('.search-results');

    if (!input || !results) return;

    // 输入事件（防抖）
    const debouncedSearch = debounce((value) => {
      const searchResults = searchSites(value);
      renderSearchResults(searchResults, value);
      results.classList.toggle('active', value.trim() !== '');
    }, 200);

    input.addEventListener('input', (e) => {
      debouncedSearch(e.target.value);
    });

    // 聚焦时显示结果
    input.addEventListener('focus', () => {
      if (input.value.trim()) {
        results.classList.add('active');
      }
    });

    // 点击外部关闭
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-container')) {
        results.classList.remove('active');
      }
    });

    // ESC 关闭
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeSearch();
      }
    });
  }

  // ============================================
  // 暗黑模式
  // ============================================
  
  /**
   * 切换主题
   */
  function toggleTheme() {
    OFREE.theme = OFREE.theme === 'dark' ? 'light' : 'dark';
    applyTheme(OFREE.theme);
    setStorage('ofree-theme', OFREE.theme);
  }

  /**
   * 应用主题
   * @param {string} theme - 主题名称
   */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeButton(theme);
  }

  /**
   * 更新主题按钮图标
   */
  function updateThemeButton(theme) {
    const btn = document.querySelector('.theme-toggle i');
    if (btn) {
      btn.className = theme === 'dark' ? 'fa fa-sun-o' : 'fa fa-moon-o';
    }
  }

  /**
   * 初始化主题
   */
  function initTheme() {
    // 从本地存储获取主题，默认亮色
    const savedTheme = getStorage('ofree-theme', 'light');
    OFREE.theme = savedTheme;
    
    // 应用主题
    applyTheme(OFREE.theme);

    // 创建主题切换按钮
    const themeBtnHTML = `
      <button class="theme-toggle" title="切换主题">
        <i class="fa ${OFREE.theme === 'dark' ? 'fa-sun-o' : 'fa-moon-o'}"></i>
      </button>
    `;
    document.body.insertAdjacentHTML('beforeend', themeBtnHTML);

    // 绑定点击事件
    const themeBtn = document.querySelector('.theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', toggleTheme);
    }
  }

  // ============================================
  // 收藏功能
  // ============================================
  
  /**
   * 切换收藏状态
   * @param {string} url - 网站URL
   * @param {string} name - 网站名称
   * @param {string} logo - 网站图标
   * @param {string} desc - 网站描述
   */
  function toggleFavorite(url, name, logo, desc) {
    const index = OFREE.favorites.findIndex(f => f.url === url);
    
    if (index > -1) {
      // 取消收藏
      OFREE.favorites.splice(index, 1);
    } else {
      // 添加收藏
      OFREE.favorites.push({ url, name, logo, desc, addedAt: Date.now() });
    }
    
    // 保存到本地存储
    setStorage('ofree-favorites', OFREE.favorites);
    
    // 更新UI
    updateFavoriteButtons();
    renderFavoritesPanel();
  }

  /**
   * 检查是否已收藏
   * @param {string} url - 网站URL
   */
  function isFavorite(url) {
    return OFREE.favorites.some(f => f.url === url);
  }

  /**
   * 更新收藏按钮状态
   */
  function updateFavoriteButtons() {
    document.querySelectorAll('.favorite-btn').forEach(btn => {
      const url = btn.dataset.url;
      btn.classList.toggle('active', isFavorite(url));
    });
  }

  /**
   * 渲染收藏面板
   */
  function renderFavoritesPanel() {
    const content = document.querySelector('.favorites-content');
    if (!content) return;

    if (OFREE.favorites.length === 0) {
      content.innerHTML = `
        <div class="favorites-empty">
          <i class="fa fa-heart-o"></i>
          <p>暂无收藏</p>
          <p style="font-size: 12px; margin-top: 8px;">点击卡片右上角的爱心添加收藏</p>
        </div>
      `;
      return;
    }

    content.innerHTML = OFREE.favorites.map(site => `
      <div class="favorite-item" style="display: flex; align-items: center; padding: 12px; background: var(--bg-card); border-radius: 8px; margin-bottom: 10px; cursor: pointer;" data-url="${site.url}">
        <img src="../assets/images/logos/${site.logo}" alt="${site.name}" style="width: 32px; height: 32px; border-radius: 6px; margin-right: 12px;" onerror="this.src='../assets/images/logos/default.png'">
        <div style="flex: 1; min-width: 0;">
          <div style="color: var(--text-primary); font-weight: 500;">${site.name}</div>
          <div style="color: var(--text-muted); font-size: 12px; margin-top: 2px;">${site.desc}</div>
        </div>
        <button class="remove-favorite" data-url="${site.url}" style="background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px;">
          <i class="fa fa-times"></i>
        </button>
      </div>
    `).join('');

    // 绑定点击事件
    content.querySelectorAll('.favorite-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (!e.target.closest('.remove-favorite')) {
          window.open(item.dataset.url, '_blank');
        }
      });
    });

    // 绑定移除按钮
    content.querySelectorAll('.remove-favorite').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const url = btn.dataset.url;
        const site = OFREE.favorites.find(f => f.url === url);
        if (site) {
          toggleFavorite(url, site.name, site.logo, site.desc);
        }
      });
    });
  }

  /**
   * 打开收藏面板
   */
  function openFavorites() {
    const panel = document.querySelector('.favorites-panel');
    const overlay = document.querySelector('.overlay');
    
    if (panel && overlay) {
      panel.classList.add('active');
      overlay.classList.add('active');
      OFREE.isFavoritesOpen = true;
    }
  }

  /**
   * 关闭收藏面板
   */
  function closeFavorites() {
    const panel = document.querySelector('.favorites-panel');
    const overlay = document.querySelector('.overlay');
    
    if (panel && overlay) {
      panel.classList.remove('active');
      overlay.classList.remove('active');
      OFREE.isFavoritesOpen = false;
    }
  }

  /**
   * 初始化收藏功能
   */
  function initFavorites() {
    // 从本地存储加载收藏
    OFREE.favorites = getStorage('ofree-favorites', []);

    // 创建收藏面板HTML
    const favoritesHTML = `
      <div class="overlay"></div>
      <div class="favorites-panel">
        <div class="favorites-header">
          <h3><i class="fa fa-heart" style="color: #ff4757; margin-right: 8px;"></i>我的收藏</h3>
          <button class="favorites-close"><i class="fa fa-times"></i></button>
        </div>
        <div class="favorites-content"></div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', favoritesHTML);

    // 渲染收藏面板
    renderFavoritesPanel();

    // 绑定关闭按钮
    const closeBtn = document.querySelector('.favorites-close');
    const overlay = document.querySelector('.overlay');
    
    if (closeBtn) {
      closeBtn.addEventListener('click', closeFavorites);
    }
    if (overlay) {
      overlay.addEventListener('click', closeFavorites);
    }

    // 在导航栏添加收藏按钮
    const navRight = document.querySelector('.user-info-menu.right-links');
    if (navRight) {
      const favBtnHTML = `
        <li class="hidden-sm hidden-xs">
          <a href="javascript:void(0);" id="open-favorites">
            <i class="fa fa-heart" style="color: #ff4757;"></i>
            <span>收藏</span>
          </a>
        </li>
      `;
      navRight.insertAdjacentHTML('afterbegin', favBtnHTML);
      
      document.getElementById('open-favorites')?.addEventListener('click', openFavorites);
    }
  }

  /**
   * 为卡片添加收藏按钮
   */
  function addFavoriteButtons() {
    document.querySelectorAll('.box2').forEach(card => {
      const onclick = card.getAttribute('onclick');
      if (!onclick) return;
      
      // 提取URL
      const match = onclick.match(/window\.open\('([^']+)',/);
      if (!match) return;
      
      const url = match[1];
      
      // 检查是否已有收藏按钮
      if (card.querySelector('.favorite-btn')) return;
      
      // 获取网站信息
      const nameEl = card.querySelector('.xe-user-name strong');
      const descEl = card.querySelector('.xe-comment p');
      const logoEl = card.querySelector('img');
      
      const name = nameEl ? nameEl.textContent : '';
      const desc = descEl ? descEl.textContent : '';
      const logo = logoEl ? logoEl.getAttribute('data-src')?.split('/').pop() || 'default.png' : 'default.png';
      
      // 添加收藏按钮
      const btn = document.createElement('button');
      btn.className = `favorite-btn ${isFavorite(url) ? 'active' : ''}`;
      btn.dataset.url = url;
      btn.dataset.name = name;
      btn.dataset.logo = logo;
      btn.dataset.desc = desc;
      btn.innerHTML = '<i class="fa fa-heart-o"></i>';
      btn.title = isFavorite(url) ? '取消收藏' : '添加收藏';
      
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(url, name, logo, desc);
        btn.title = isFavorite(url) ? '取消收藏' : '添加收藏';
      });
      
      card.appendChild(btn);
    });
  }

  // ============================================
  // 访问统计
  // ============================================
  
  /**
   * 记录访问
   * @param {string} url - 网站URL
   * @param {string} name - 网站名称
   */
  function recordVisit(url, name) {
    const visits = getStorage('ofree-visits', {});
    visits[url] = {
      name,
      count: (visits[url]?.count || 0) + 1,
      lastVisit: Date.now()
    };
    setStorage('ofree-visits', visits);
  }

  /**
   * 获取热门网站
   * @param {number} limit - 返回数量
   */
  function getTopSites(limit = 10) {
    const visits = getStorage('ofree-visits', {});
    return Object.entries(visits)
      .map(([url, data]) => ({ url, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  // ============================================
  // 快捷键支持
  // ============================================
  
  /**
   * 初始化快捷键
   */
  function initShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl + K 或 Ctrl + / 打开搜索
      if ((e.ctrlKey && (e.key === 'k' || e.key === '/')) || (e.metaKey && e.key === 'k')) {
        e.preventDefault();
        openSearch();
      }
      
      // ESC 关闭搜索和收藏面板
      if (e.key === 'Escape') {
        if (OFREE.isSearchOpen) {
          closeSearch();
        }
        if (OFREE.isFavoritesOpen) {
          closeFavorites();
        }
      }
      
      // Ctrl + D 打开收藏
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        openFavorites();
      }
    });

    // 显示快捷键提示
    const hintHTML = `
      <div class="shortcut-hint">
        <kbd>Ctrl</kbd> + <kbd>K</kbd> 搜索 | <kbd>Ctrl</kbd> + <kbd>D</kbd> 收藏
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', hintHTML);

    // 延迟显示提示
    setTimeout(() => {
      const hint = document.querySelector('.shortcut-hint');
      if (hint) {
        hint.classList.add('show');
        setTimeout(() => hint.classList.remove('show'), 5000);
      }
    }, 2000);
  }

  // ============================================
  // 初始化
  // ============================================
  
  /**
   * 加载网站数据
   */
  async function loadData() {
    try {
      const response = await fetch('data.json');
      OFREE.data = await response.json();
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  }

  /**
   * 初始化移动端菜单
   */
  function initMobileMenu() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar-menu');
    const overlay = document.querySelector('.mobile-overlay');
    
    if (!menuToggle || !sidebar) return;
    
    // 菜单按钮点击
    menuToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      sidebar.classList.toggle('open');
      if (overlay) {
        overlay.classList.toggle('active');
      }
    });
    
    // 遮罩点击关闭菜单
    if (overlay) {
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
      });
    }
    
    // 菜单项点击后关闭菜单
    const menuLinks = sidebar.querySelectorAll('a');
    menuLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth < 768) {
          setTimeout(() => {
            sidebar.classList.remove('open');
            if (overlay) {
              overlay.classList.remove('active');
            }
          }, 150);
        }
      });
    });
    
    // 窗口大小改变时重置菜单状态
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 768) {
        sidebar.classList.remove('open');
        if (overlay) {
          overlay.classList.remove('active');
        }
      }
    });
  }

  /**
   * 主初始化函数
   */
  async function init() {
    // 加载数据
    await loadData();
    
    // 初始化各功能模块
    initTheme();
    initFavorites();
    initShortcuts();
    initMobileMenu();
    
    // 等待卡片渲染完成后添加收藏按钮
    const observer = new MutationObserver(() => {
      addFavoriteButtons();
    });
    
    const container = document.getElementById('categories-container');
    if (container) {
      observer.observe(container, { childList: true, subtree: true });
    }
    
    // 初始添加收藏按钮
    setTimeout(addFavoriteButtons, 500);
    
    // 记录卡片点击
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.box2');
      if (card && !e.target.closest('.favorite-btn')) {
        const onclick = card.getAttribute('onclick');
        const match = onclick?.match(/window\.open\('([^']+)',/);
        if (match) {
          const nameEl = card.querySelector('.xe-user-name strong');
          recordVisit(match[1], nameEl?.textContent || '');
        }
      }
    });

    console.log('🚀 OFREE 功能模块加载完成');
  }

  // 暴露到全局
  window.OFREE = {
    search: searchSites,
    toggleTheme,
    toggleFavorite,
    openSearch,
    openFavorites,
    getTopSites
  };

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
