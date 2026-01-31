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
    // 二级分类：遍历所有子分类，为每个子分类创建独立的锚点
    for (const [subCategoryId, sites] of Object.entries(categoryData)) {
      if (Array.isArray(sites)) {
        // 为每个子分类创建独立的容器和锚点
        html += `<div class="category-container" id="${subCategoryId}">`;
        html += `<h4 class="text-gray"><i class="linecons-tag" style="margin-right: 7px;"></i>${subCategoryId}</h4>`;
        html += renderSiteList(sites);
        html += '</div><br />';
      }
    }
  }
  
  return html;
}

// 生成侧边栏菜单项
function generateMenuItems(data) {
  let menuHtml = '';
  
  const iconMap = {
    '常用推荐': 'linecons-star',
    '推荐': 'linecons-heart',
    '社区资讯': 'linecons-doc',
    '灵感采集': 'linecons-lightbulb',
    '素材资源': 'linecons-thumbs-up',
    '常用工具': 'linecons-diamond',
    '学习教程': 'linecons-pencil',
    'UED团队': 'linecons-user'
  };
  
  for (const [categoryId, categoryData] of Object.entries(data)) {
    const icon = iconMap[categoryId] || 'linecons-tag';
    
    // 判断是否为一级分类（数组）
    if (Array.isArray(categoryData)) {
      menuHtml += `
        <li>
          <a href="#${categoryId}" class="smooth" onclick="event.stopPropagation();">
            <i class="${icon}"></i>
            <span class="title">${categoryId}</span>
          </a>
        </li>
      `;
    } 
    // 判断是否为二级分类（对象）
    else if (typeof categoryData === 'object' && !Array.isArray(categoryData)) {
      menuHtml += `
        <li class="has-sub">
          <a href="javascript:void(0);" onclick="event.stopPropagation();">
            <i class="${icon}"></i>
            <span class="title">${categoryId}</span>
          </a>
          <ul>
      `;
      
      // 添加子菜单项，锚点指向子分类ID
      for (const subCategoryId of Object.keys(categoryData)) {
        if (Array.isArray(categoryData[subCategoryId])) {
          menuHtml += `
            <li>
              <a href="#${subCategoryId}" class="smooth" onclick="event.stopPropagation();">
                <span class="title">${subCategoryId}</span>
              </a>
            </li>
          `;
        }
      }
      
      menuHtml += `
          </ul>
        </li>
      `;
    }
  }
  
  return menuHtml;
}

// 修复滚动容器
function fixScrollContainer() {
  const container = document.querySelector('.main-menu-container');
  if (container) {
    // 确保容器有正确的高度
    const header = document.querySelector('.logo-env');
    if (header) {
      const headerHeight = header.offsetHeight;
      const windowHeight = window.innerHeight;
      container.style.height = (windowHeight - headerHeight - 20) + 'px';
    }
    
    // 强制重新计算滚动
    container.style.overflowY = 'auto';
    container.style.overflowX = 'hidden';
  }
}

// 重新初始化菜单的平滑滚动功能
function initMenuSmoothScroll() {
  $("a.smooth").off('click').on('click', function(ev) {
    ev.preventDefault();
    ev.stopPropagation(); // 阻止事件冒泡

    // 处理移动端菜单显示
    if (window.public_vars && window.public_vars.$mainMenu) {
      public_vars.$mainMenu.add(public_vars.$sidebarProfile).toggleClass('mobile-is-visible');
    }
    
    // 销毁可能的滚动条
    if (typeof ps_destroy === 'function') {
      ps_destroy();
    }
    
    // 平滑滚动到目标位置
    const targetId = $(this).attr("href");
    const targetElement = $(targetId);
    if (targetElement.length) {
      $("html, body").animate({
        scrollTop: targetElement.offset().top - 30
      }, {
        duration: 500,
        easing: "swing"
      });
    }
    
    // 修复滚动容器
    setTimeout(fixScrollContainer, 100);
  });
}

// 初始化菜单交互
function initMenuInteractions() {
  // 初始化折叠菜单功能
  $('.has-sub > a').off('click').on('click', function(e) {
    e.preventDefault();
    e.stopPropagation(); // 阻止事件冒泡
    
    const $parent = $(this).parent();
    const $ul = $parent.find('> ul');
    
    if (!$parent.hasClass('expanded')) {
      // 关闭其他已展开的菜单
      $('.has-sub.expanded').each(function() {
        const $this = $(this);
        if (!$this.is($parent)) {
          $this.removeClass('expanded').find('> ul').slideUp(300);
        }
      });
      
      // 展开当前菜单
      $parent.addClass('expanded');
      $ul.slideDown(300, function() {
        // 展开后修复滚动容器
        fixScrollContainer();
      });
    } else {
      // 关闭当前菜单
      $parent.removeClass('expanded');
      $ul.slideUp(300, function() {
        // 关闭后修复滚动容器
        fixScrollContainer();
      });
    }
    
    // 阻止默认的平滑滚动
    return false;
  });
  
  // 初始化菜单项激活状态
  $("#main-menu li ul li").off('click').on('click', function(e) {
    e.stopPropagation(); // 阻止事件冒泡
    $(this).siblings('li').removeClass('active');
    $(this).addClass('active');
  });
}

// 页面加载后渲染所有分类和侧边栏菜单
document.addEventListener('DOMContentLoaded', async function() {
  try {
    // 加载JSON数据
    const response = await fetch('data.json');
    const data = await response.json();
    
    // 获取总容器
    const container = document.getElementById('categories-container');
    if (!container) {
      console.error('找不到分类容器');
      return;
    }
    
    // 渲染网站分类内容
    container.innerHTML = '';
    for (const [categoryId, categoryData] of Object.entries(data)) {
      container.innerHTML += renderCategory(categoryId, categoryData);
    }
    
    // 获取侧边栏菜单容器
    const mainMenu = document.getElementById('main-menu');
    if (mainMenu) {
      
      // 保存关于本站项
      const aboutItem = mainMenu.querySelector('li');
      const aboutItemHtml = aboutItem ? aboutItem.outerHTML : '';
      
      // 清空现有菜单项
      mainMenu.innerHTML = '';
      
      // 生成并添加动态菜单项
      const dynamicMenuHtml = generateMenuItems(data);
      mainMenu.innerHTML = dynamicMenuHtml + aboutItemHtml;
      
      // 重新初始化菜单交互
      initMenuInteractions();
      initMenuSmoothScroll();
    }
    
    // 初始化懒加载
    if (window.lozad) {
      const observer = lozad();
      observer.observe();
    }
    
    // 加载完数据后修复滚动容器
    setTimeout(() => {
      fixScrollContainer();
      
      if (typeof public_vars !== 'undefined') {
        // 重新绑定菜单点击事件
        $(document).off('click', '.has-sub').on('click', '.has-sub', function() {
          var _this = $(this);
          if(!$(this).hasClass('expanded')) {
            setTimeout(function() {
              _this.find('ul').attr("style","");
              fixScrollContainer();
            }, 300);
          } else {
            $('.has-sub ul').each(function(id, ele) {
              var _that = $(this);
              if(_this.find('ul')[0] != ele) {
                setTimeout(function() {
                  _that.attr("style","");
                  fixScrollContainer();
                }, 300);
              }
            });
          }
        });
        
        // 重新绑定菜单切换按钮
        $('.user-info-menu .hidden-sm').off('click').on('click', function() {
          if($('.sidebar-menu').hasClass('collapsed')) {
            $('.has-sub.expanded > ul').attr("style","");
          } else {
            $('.has-sub.expanded > ul').show();
          }
          fixScrollContainer();
        });
      }
    }, 200);
    
  } catch (error) {
    console.error('加载数据失败:', error);
    const container = document.getElementById('categories-container');
    if (container) {
      container.innerHTML = '<div class="error">加载失败，请刷新重试</div>';
    }
  }
});

// 窗口大小变化时重新计算滚动容器高度
window.addEventListener('resize', fixScrollContainer);