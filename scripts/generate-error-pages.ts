/**
 * 错误页面生成脚本
 * 
 * 为律植网站生成自定义错误页面
 * 
 * 使用方法:
 *   node scripts/generate-error-pages.js
 * 
 * 输出:
 *   apps/web/public/errors/503.html
 *   apps/web/public/errors/504.html
 *   apps/web/public/errors/500.html
 */

import fs from 'fs'
import path from 'path'

const OUTPUT_DIR = path.join(process.cwd(), 'apps/web/public/errors')

/**
 * 错误页面模板
 */
function generateErrorPage(code, title, description, suggestions) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${code} - ${title} | 律植</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .container {
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      padding: 60px;
      max-width: 600px;
      text-align: center;
    }
    
    .error-code {
      font-size: 120px;
      font-weight: 800;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1;
      margin-bottom: 20px;
    }
    
    .title {
      font-size: 28px;
      font-weight: 600;
      color: #333;
      margin-bottom: 16px;
    }
    
    .description {
      font-size: 16px;
      color: #666;
      line-height: 1.6;
      margin-bottom: 30px;
    }
    
    .suggestions {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 24px;
      text-align: left;
      margin-bottom: 30px;
    }
    
    .suggestions h3 {
      font-size: 14px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 12px;
    }
    
    .suggestions ul {
      list-style: none;
      color: #555;
      font-size: 14px;
    }
    
    .suggestions li {
      padding: 8px 0;
      padding-left: 24px;
      position: relative;
    }
    
    .suggestions li::before {
      content: '✓';
      position: absolute;
      left: 0;
      color: #667eea;
      font-weight: bold;
    }
    
    .actions {
      display: flex;
      gap: 16px;
      justify-content: center;
    }
    
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 14px 32px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.3s ease;
      cursor: pointer;
      border: none;
    }
    
    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
    }
    
    .btn-secondary {
      background: #f0f0f0;
      color: #333;
    }
    
    .btn-secondary:hover {
      background: #e0e0e0;
    }
    
    .footer {
      margin-top: 40px;
      font-size: 12px;
      color: #999;
    }
    
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    
    .loading-spinner {
      display: none;
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 1s linear infinite;
      margin-right: 8px;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .btn.loading .loading-spinner {
      display: inline-block;
    }
    
    @media (max-width: 480px) {
      .container {
        padding: 40px 24px;
      }
      
      .error-code {
        font-size: 80px;
      }
      
      .title {
        font-size: 22px;
      }
      
      .actions {
        flex-direction: column;
      }
      
      .btn {
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="error-code">${code}</div>
    <h1 class="title">${title}</h1>
    <p class="description">${description}</p>
    
    <div class="suggestions">
      <h3>您可以尝试</h3>
      <ul>
        ${suggestions.map(s => `<li>${s}</li>`).join('')}
      </ul>
    </div>
    
    <div class="actions">
      <button class="btn btn-primary" onclick="retry()">
        <span class="loading-spinner"></span>
        重新加载
      </button>
      <a href="/" class="btn btn-secondary">返回首页</a>
    </div>
    
    <div class="footer">
      <p>如有问题，请联系 <a href="mailto:support@lvzhi.com">support@lvzhi.com</a></p>
      <p>© 2024 律植 · 智能法律助手</p>
    </div>
  </div>
  
  <script>
    let retryCount = 0;
    const maxRetries = 3;
    
    function retry() {
      const btn = document.querySelector('.btn-primary');
      btn.classList.add('loading');
      btn.disabled = true;
      
      setTimeout(() => {
        if (retryCount < maxRetries) {
          retryCount++;
          window.location.reload();
        } else {
          btn.classList.remove('loading');
          btn.disabled = false;
          btn.textContent = '重试次数已用完';
        }
      }, 1000);
    }
    
    // 自动重试
    setTimeout(() => {
      if (retryCount === 0) {
        retry();
      }
    }, 5000);
  </script>
</body>
</html>`
}

/**
 * 错误页面配置
 */
const errorPages = [
  {
    code: 500,
    filename: '500.html',
    title: '服务器开小差了',
    description: '抱歉，服务器遇到了问题，无法完成您的请求。我们的技术团队已经收到通知，正在处理中。',
    suggestions: [
      '稍后再试，可能只是临时性问题',
      '刷新页面或点击"重新加载"按钮',
      '如果问题持续存在，请联系我们',
    ],
  },
  {
    code: 502,
    filename: '502.html',
    title: '网关错误',
    description: '服务器作为网关或代理，从上游服务器收到了无效响应。请稍后再试。',
    suggestions: [
      '这通常是临时性问题，请稍后刷新',
      '如果持续出现，可能是服务器正在维护',
      '您可以返回首页浏览其他内容',
    ],
  },
  {
    code: 503,
    filename: '503.html',
    title: '服务暂时不可用',
    description: '由于服务器正在维护或过载，服务暂时无法使用。请稍后再来，我们会尽快恢复服务。',
    suggestions: [
      '服务器可能正在维护中',
      '高峰时段访问量过大，请稍后再试',
      '您可以稍后刷新页面或联系我们',
    ],
  },
  {
    code: 504,
    filename: '504.html',
    title: '网关超时',
    description: '服务器作为网关，未能及时从上游服务器获取响应。请检查您的网络连接后重试。',
    suggestions: [
      '检查您的网络连接是否正常',
      '可能是服务器响应较慢，稍后再试',
      '如果问题持续，请联系我们的支持团队',
    ],
  },
]

/**
 * 生成错误页面
 */
async function generateErrorPages() {
  console.log('📄 正在生成错误页面...\n')
  
  // 确保目录存在
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  
  for (const page of errorPages) {
    const html = generateErrorPage(page.code, page.title, page.description, page.suggestions)
    const outputPath = path.join(OUTPUT_DIR, page.filename)
    
    fs.writeFileSync(outputPath, html)
    console.log(`✅ ${page.code} - ${page.title}`)
    console.log(`   文件: ${outputPath}`)
  }
  
  // 生成通用错误页面 (用于其他错误码)
  const genericHtml = generateErrorPage(
    'ERR',
    '出了点问题',
    '抱歉，发生了未知错误。请尝试刷新页面或返回首页。',
    [
      '刷新页面',
      '清除浏览器缓存后重试',
      '稍后再试',
    ]
  )
  
  fs.writeFileSync(path.join(OUTPUT_DIR, 'error.html'), genericHtml)
  console.log('\n✅ 通用错误页面')
  console.log(`   文件: ${path.join(OUTPUT_DIR, 'error.html')}`)
  
  // 生成 Nginx 配置片段
  const nginxConfig = `
# 错误页面配置
error_page 500 /errors/500.html;
error_page 502 /errors/502.html;
error_page 503 /errors/503.html;
error_page 504 /errors/504.html;

# 自定义错误页面
location /errors/ {
    internal;
    root /var/www/lvzhi/public;
}
`
  
  fs.writeFileSync(path.join(OUTPUT_DIR, 'nginx.conf'), nginxConfig)
  console.log('\n✅ Nginx 配置片段')
  console.log(`   文件: ${path.join(OUTPUT_DIR, 'nginx.conf')}`)
}

/**
 * 主函数
 */
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗')
  console.log('║           律植 (Lvzhi) 错误页面生成器                      ║')
  console.log('╚═══════════════════════════════════════════════════════════════╝\n')
  
  await generateErrorPages()
  
  console.log('\n╔═══════════════════════════════════════════════════════════════╗')
  console.log('║                   生成完成!                                 ║')
  console.log('╚═══════════════════════════════════════════════════════════════╝')
  console.log('\n📋 下一步:')
  console.log('1. 将错误页面部署到 CDN 或服务器')
  console.log('2. 配置 Nginx 使用自定义错误页面')
  console.log('3. 测试错误页面是否正常显示')
}

main().catch(console.error)
