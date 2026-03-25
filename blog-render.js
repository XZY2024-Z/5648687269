/**
 * OFree 博客渲染脚本
 * 负责加载和渲染博客文章列表、文章详情、首页推荐文章
 */

const Blog = {
  data: null,
  currentLang: 'cn',
  
  /**
   * 初始化博客模块
   * @param {string} lang - 语言设置 'cn' 或 'en'
   */
  async init(lang = 'cn') {
    this.currentLang = lang;
    await this.loadData();
  },
  
  /**
   * 加载博客数据
   */
  async loadData() {
    try {
      const response = await fetch('./blog-data.json');
      this.data = await response.json();
      return this.data;
    } catch (error) {
      console.error('加载博客数据失败:', error);
      return null;
    }
  },
  
  /**
   * 获取推荐文章（首页用）
   * @param {number} count - 返回文章数量
   */
  getFeaturedArticles(count = 3) {
    if (!this.data) return [];
    return this.data.articles.filter(article => article.featured).slice(0, count);
  },
  
  /**
   * 根据分类获取文章
   * @param {string} category - 分类名称
   */
  getArticlesByCategory(category) {
    if (!this.data) return [];
    if (category === '全部' || category === 'All') {
      return this.data.articles;
    }
    return this.data.articles.filter(article => article.category === category);
  },
  
  /**
   * 根据ID获取文章详情
   * @param {string} id - 文章ID
   */
  getArticleById(id) {
    if (!this.data) return null;
    return this.data.articles.find(article => article.id === id);
  },
  
  /**
   * 渲染首页推荐文章卡片
   * @param {number} count - 显示数量
   */
  renderFeaturedCards(count = 3) {
    const articles = this.getFeaturedArticles(count);
    if (articles.length === 0) {
      return `<div class="no-articles">暂无推荐文章</div>`;
    }
    
    return articles.map(article => `
      <div class="article-card" onclick="window.location.href='./blog-post.html?id=${article.id}'">
        <div class="article-card-header">
          <span class="article-category">${article.category}</span>
          <span class="article-date">${article.date}</span>
        </div>
        <h3 class="article-title">${article.title}</h3>
        <p class="article-summary">${article.summary}</p>
        <div class="article-tags">
          ${article.tags.map(tag => `<span class="article-tag">${tag}</span>`).join('')}
        </div>
      </div>
    `).join('');
  },
  
  /**
   * 渲染博客列表页文章卡片
   * @param {string} category - 当前选中的分类
   */
  renderBlogList(category = '全部') {
    const articles = this.getArticlesByCategory(category);
    if (articles.length === 0) {
      return `<div class="no-articles">该分类下暂无文章</div>`;
    }
    
    return articles.map(article => `
      <div class="article-card article-card-full" onclick="window.location.href='./blog-post.html?id=${article.id}'">
        <div class="article-card-header">
          <span class="article-category">${article.category}</span>
          <span class="article-date">${article.date}</span>
        </div>
        <h3 class="article-title">${article.title}</h3>
        <p class="article-summary">${article.summary}</p>
        <div class="article-tags">
          ${article.tags.map(tag => `<span class="article-tag">${tag}</span>`).join('')}
        </div>
      </div>
    `).join('');
  },
  
  /**
   * 渲染分类筛选标签
   * @param {string} activeCategory - 当前选中的分类
   */
  renderCategoryTabs(activeCategory = '全部') {
    if (!this.data) return '';
    
    return this.data.categories.map(cat => `
      <button class="category-tab ${cat === activeCategory ? 'active' : ''}" 
              onclick="Blog.filterByCategory('${cat}')">
        ${cat}
      </button>
    `).join('');
  },
  
  /**
   * 分类筛选函数
   * @param {string} category - 分类名称
   */
  filterByCategory(category) {
    // 更新标签状态
    document.querySelectorAll('.category-tab').forEach(tab => {
      tab.classList.toggle('active', tab.textContent.trim() === category);
    });
    
    // 更新文章列表
    const container = document.getElementById('blog-list-container');
    if (container) {
      container.innerHTML = this.renderBlogList(category);
    }
  },
  
  /**
   * 渲染文章详情页
   * @param {string} articleId - 文章ID
   */
  renderArticleDetail(articleId) {
    const article = this.getArticleById(articleId);
    if (!article) {
      return `<div class="no-articles">文章不存在</div>`;
    }
    
    // 将Markdown格式的内容转换为HTML
    const content = this.parseMarkdown(article.content);
    
    return `
      <article class="article-detail">
        <div class="article-detail-header">
          <a href="./blog.html" class="back-link">← 返回博客列表</a>
          <span class="article-category">${article.category}</span>
        </div>
        <h1 class="article-detail-title">${article.title}</h1>
        <div class="article-meta">
          <span class="article-date">📅 ${article.date}</span>
          <div class="article-tags">
            ${article.tags.map(tag => `<span class="article-tag">${tag}</span>`).join('')}
          </div>
        </div>
        <div class="article-content">
          ${content}
        </div>
      </article>
    `;
  },
  
  /**
   * 简单的Markdown解析器
   * @param {string} text - Markdown文本
   */
  parseMarkdown(text) {
    if (!text) return '';
    
    return text
      // 标题
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      // 段落
      .replace(/\n\n/g, '</p><p>')
      // 换行
      .replace(/\n/g, '<br>')
      // 列表
      .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
      // 包裹段落
      .replace(/^(?!<[hlu])/gm, '<p>')
      .replace(/(?<![>])$/gm, '</p>')
      // 清理空段落
      .replace(/<p><\/p>/g, '')
      .replace(/<p><br><\/p>/g, '')
      // 列表包装
      .replace(/(<li>.*<\/li>)+/g, '<ol>$&</ol>');
  },
  
  /**
   * 获取相关文章推荐
   * @param {string} articleId - 当前文章ID
   * @param {number} count - 返回数量
   */
  getRelatedArticles(articleId, count = 3) {
    if (!this.data) return [];
    const currentArticle = this.getArticleById(articleId);
    if (!currentArticle) return [];
    
    return this.data.articles
      .filter(article => article.id !== articleId)
      .filter(article => article.category === currentArticle.category || 
              article.tags.some(tag => currentArticle.tags.includes(tag)))
      .slice(0, count);
  },
  
  /**
   * 渲染相关文章推荐
   * @param {string} articleId - 当前文章ID
   */
  renderRelatedArticles(articleId) {
    const articles = this.getRelatedArticles(articleId);
    if (articles.length === 0) return '';
    
    return `
      <div class="related-articles">
        <h4>相关文章推荐</h4>
        <div class="related-articles-list">
          ${articles.map(article => `
            <div class="article-card article-card-small" onclick="window.location.href='./blog-post.html?id=${article.id}'">
              <span class="article-category">${article.category}</span>
              <h5 class="article-title">${article.title}</h5>
              <span class="article-date">${article.date}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
};

// 初始化首页推荐文章
async function initFeaturedArticles() {
  await Blog.init('cn');
  const container = document.getElementById('featured-articles');
  if (container) {
    container.innerHTML = Blog.renderFeaturedCards(3);
  }
}

// 初始化博客列表页
async function initBlogList() {
  await Blog.init('cn');
  
  // 渲染分类标签
  const tabsContainer = document.getElementById('category-tabs');
  if (tabsContainer) {
    tabsContainer.innerHTML = Blog.renderCategoryTabs('全部');
  }
  
  // 渲染文章列表
  const listContainer = document.getElementById('blog-list-container');
  if (listContainer) {
    listContainer.innerHTML = Blog.renderBlogList('全部');
  }
}

// 初始化文章详情页
async function initArticleDetail() {
  await Blog.init('cn');
  
  // 从URL获取文章ID
  const urlParams = new URLSearchParams(window.location.search);
  const articleId = urlParams.get('id');
  
  const container = document.getElementById('article-detail-container');
  if (container && articleId) {
    container.innerHTML = Blog.renderArticleDetail(articleId);
    
    // 渲染相关文章
    const relatedContainer = document.getElementById('related-articles-container');
    if (relatedContainer) {
      relatedContainer.innerHTML = Blog.renderRelatedArticles(articleId);
    }
  }
}
