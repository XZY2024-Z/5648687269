// 渲染单个网站卡片
function renderSite(site) {
  return `
    <div class="col-sm-3">
      <div class="xe-widget xe-conversations box2 label-info" 
           onclick="window.open('${site.url}', '_blank')"
           data-toggle="tooltip" data-placement="bottom" 
           title="${site.url}" data-original-title="${site.url}">
        <div class="xe-comment-entry">
          <a class="xe-user-img">
            <img data-src="../assets/images/logos/${site.logo}" 
                 class="lozad img-circle" width="40">
          </a>
          <div class="xe-comment">
            <a href="#" class="xe-user-name overflowClip_1">
              <strong>${site.name}</strong>
            </a>
            <p class="overflowClip_2">${site.desc}</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 渲染网站列表（每4个一组）
function renderSiteList(sites) {
  let html = '';
  for (let i = 0; i < sites.length; i += 4) {
    html += '<div class="row">';
    for (let j = 0; j < 4 && i + j < sites.length; j++) {
      html += renderSite(sites[i + j]);
    }
    html += '</div>';
  }
  return html;
}

// 渲染一个完整分类（支持一级和二级结构）
function renderCategory(categoryId, categoryData) {
  let html = '';
  
  // 判断是否为数组（一级分类）
  if (Array.isArray(categoryData)) {
    // 一级分类：直接渲染标题和网站列表
    html += `<div class="category-container" id="${categoryId}">`;
    html += `<h4 class="text-gray"><i class="linecons-tag" style="margin-right: 7px;"></i>${categoryId}</h4>`;
    html += renderSiteList(categoryData);
    html += '</div><br />';
  } 
  // 判断是否为对象且包含子分类（二级分类）
  else if (typeof categoryData === 'object' && !Array.isArray(categoryData)) {
    // 二级分类：先渲染一级标题，再渲染子分类
    html += `<div class="category-container" id="${categoryId}">`;
    // html += `<h4 class="text-gray"><i class="linecons-tag" style="margin-right: 7px;"></i>${categoryId}</h4>`;
    
    // 遍历所有子分类
    for (const [subCategoryId, sites] of Object.entries(categoryData)) {
      if (Array.isArray(sites)) {
        // html += `<h5 class="subcategory-title">${subCategoryId}</h5>`;
        html += `<h4 class="text-gray"><i class="linecons-tag" style="margin-right: 7px;"></i>${subCategoryId}</h4>`;
        html += renderSiteList(sites);
      }
    }
    
    html += '</div><br />';
  }
  
  return html;
}

// 页面加载后渲染所有分类
document.addEventListener('DOMContentLoaded', async function() {
  try {
    // 获取总容器
    const container = document.getElementById('categories-container');
    if (!container) {
      console.error('找不到分类容器');
      return;
    }
    
    // 显示加载中提示
    container.innerHTML = '<div class="loading">正在加载数据...</div>';
    
    // 加载JSON数据
    const response = await fetch('data.json');
    const data = await response.json();
    
    // 清空容器
    container.innerHTML = '';
    
    // 遍历所有分类并渲染
    for (const [categoryId, categoryData] of Object.entries(data)) {
      container.innerHTML += renderCategory(categoryId, categoryData);
    }
    
    // 初始化懒加载
    if (window.lozad) {
      const observer = lozad();
      observer.observe();
    }
    
    // 如果需要，更新导航菜单中的链接
    updateNavLinks(Object.keys(data));
    
  } catch (error) {
    console.error('加载数据失败:', error);
    const container = document.getElementById('categories-container');
    if (container) {
      container.innerHTML = '<div class="error">加载失败，请刷新重试</div>';
    }
  }
});

// 更新导航链接（如果有左侧导航菜单）
function updateNavLinks(categoryIds) {
  // 假设左侧导航菜单有一个ID为"main-menu"的容器
  const navMenu = document.getElementById('main-menu');
  if (!navMenu) return;
  
  // 清空现有链接
  const linksContainer = navMenu.querySelector('.nav-links');
  if (!linksContainer) return;
  
  // 为每个分类创建链接
  categoryIds.forEach(categoryId => {
    const link = document.createElement('a');
    link.href = `#${categoryId}`;
    link.className = 'smooth';
    link.textContent = categoryId;
    link.onclick = function(e) {
      e.preventDefault();
      const target = document.getElementById(categoryId);
      if (target) {
        window.scrollTo({
          top: target.offsetTop - 30,
          behavior: 'smooth'
        });
      }
    };
    
    const li = document.createElement('li');
    li.appendChild(link);
    linksContainer.appendChild(li);
  });
}