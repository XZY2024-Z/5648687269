/**
 * OFree 博客渲染脚本
 * 负责加载和渲染博客文章列表、文章详情、首页推荐文章
 * 支持从独立 Markdown 文件加载文章内容
 */

const Blog = {
  data: null,
  
  /**
   * 获取正确的路径前缀（根据当前页面位置自动检测）
   * @returns {string} 路径前缀
   */
  getPathPrefix() {
    const currentPath = window.location.pathname;
    if (currentPath.includes('/pages/')) {
      return '../';
    }
    return './';
  },
  
  /**
   * 加载博客元数据
   */
  async loadData() {
    try {
      const prefix = this.getPathPrefix();
      const response = await fetch(`${prefix}data/blog-data.json`);
      this.data = await response.json();
      return this.data;
    } catch (error) {
      console.error('加载博客数据失败:', error);
      return null;
    }
  },
  
  /**
   * 加载 Markdown 文件内容
   * @param {string} filePath - MD 文件路径
   */
  async loadMarkdownFile(filePath) {
    try {
      const prefix = this.getPathPrefix();
      const response = await fetch(`${prefix}${filePath}`);
      if (!response.ok) {
        throw new Error('文件不存在');
      }
      const markdown = await response.text();
      return markdown;
    } catch (error) {
      console.error('加载Markdown文件失败:', error);
      return null;
    }
  },
  
  /**
   * 解析 Markdown 为 HTML
   * @param {string} markdown - Markdown 文本
   */
  parseMarkdown(markdown) {
    if (!markdown) return '';
    
    // 使用 marked 库解析（如果已加载）
    if (typeof marked !== 'undefined') {
      return marked.parse(markdown);
    }
    
    // 简单的 Markdown 解析器（备用）
    return markdown
      // 标题
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      // 粗体
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // 斜体
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // 链接
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>')
      // 无序列表
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      // 有序列表
      .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
      // 代码块
      .replace(/```(\w+)?\n([\s\S]+?)```/g, '<pre><code class="language-$1">$2</code></pre>')
      // 行内代码
      .replace(/`(.+?)`/g, '<code>$1</code>')
      // 表格（简单处理）
      .replace(/\|(.+)\|/g, function(match) {
        const cells = match.split('|').filter(c => c.trim());
        if (cells.some(c => c.trim().match(/^-+$/))) {
          return ''; // 分隔线跳过
        }
        return '<tr>' + cells.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>';
      })
      // 段落
      .replace(/\n\n/g, '</p><p>')
      // 换行
      .replace(/\n/g, '<br>')
      // 清理
      .replace(/<p><\/p>/g, '')
      .replace(/<p><br><\/p>/g, '')
      .replace(/<p>(<[hluot])/g, '$1')
      .replace(/(<\/[hluot].*?>)<\/p>/g, '$1');
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
    if (category === '全部') {
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
    
    const prefix = this.getPathPrefix();
    return articles.map(article => `
      <div class="article-card" onclick="window.location.href='${prefix}pages/blog-post.html?id=${article.id}'">
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
    
    const prefix = this.getPathPrefix();
    return articles.map(article => `
      <div class="article-card article-card-full" onclick="window.location.href='${prefix}pages/blog-post.html?id=${article.id}'">
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
  async renderArticleDetail(articleId) {
    const article = this.getArticleById(articleId);
    if (!article) {
      return `<div class="no-articles">文章不存在</div>`;
    }
    
    // 加载 Markdown 文件内容
    let content = '';
    if (article.file) {
      const markdown = await this.loadMarkdownFile(article.file);
      content = this.parseMarkdown(markdown);
    }
    
    const prefix = this.getPathPrefix();
    return `
      <article class="article-detail">
        <div class="article-detail-header">
          <a href="${prefix}pages/blog.html" class="back-link">← 返回博客列表</a>
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
    
    const prefix = this.getPathPrefix();
    return `
      <div class="related-articles">
        <h4>相关文章推荐</h4>
        <div class="related-articles-list">
          ${articles.map(article => `
            <div class="article-card article-card-small" onclick="window.location.href='${prefix}pages/blog-post.html?id=${article.id}'">
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
  await Blog.loadData();
  const container = document.getElementById('featured-articles');
  if (container) {
    container.innerHTML = Blog.renderFeaturedCards(3);
  }
}

// 初始化博客列表页
async function initBlogList() {
  await Blog.loadData();
  
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
  await Blog.loadData();
  
  // 从URL获取文章ID
  const urlParams = new URLSearchParams(window.location.search);
  const articleId = urlParams.get('id');
  
  const container = document.getElementById('article-detail-container');
  if (container && articleId) {
    container.innerHTML = await Blog.renderArticleDetail(articleId);
    
    // 渲染相关文章
    const relatedContainer = document.getElementById('related-articles-container');
    if (relatedContainer) {
      relatedContainer.innerHTML = Blog.renderRelatedArticles(articleId);
    }
  }
}
