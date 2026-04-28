/**
 * 压测准备脚本
 * 
 * 功能:
 * 1. 安装 k6 工具 (macOS: brew install k6, Linux: sudo gpg --keyserver)
 * 2. 生成测试账号 JWT Token
 * 3. 生成压测数据 (100+ 智能体, 1000+ 用户)
 */

import http from 'k6/http'
import { HttpsAgent } from 'https'

const API_BASE = process.env.API_BASE || 'http://localhost:4000'

/**
 * 生成测试账号
 */
async function generateTestAccounts() {
  console.log('📝 生成测试账号...')
  
  const roles = ['admin', 'creator', 'seeker']
  const accounts = []
  
  for (let i = 1; i <= 10; i++) {
    for (const role of roles) {
      const email = `loadtest_${role}_${i}@test.com`
      
      try {
        // 尝试注册
        const registerRes = await http.post(`${API_BASE}/api/auth/register`, 
          JSON.stringify({
            email,
            password: 'LoadTest123!',
            role: role === 'admin' ? 'admin' : role,
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          }
        )
        
        if (registerRes.status === 200 || registerRes.status === 409) {
          // 尝试登录获取 token
          const loginRes = await http.post(`${API_BASE}/api/auth/login`,
            JSON.stringify({
              email,
              password: 'LoadTest123!',
            }),
            {
              headers: { 'Content-Type': 'application/json' },
            }
          )
          
          if (loginRes.status === 200) {
            const body = JSON.parse(loginRes.body)
            accounts.push({
              email,
              role,
              token: body.data?.token,
              userId: body.data?.user?.id,
            })
            console.log(`  ✅ ${role} account: ${email}`)
          }
        }
      } catch (e) {
        console.log(`  ⚠️ Failed for ${email}: ${e.message}`)
      }
    }
  }
  
  console.log(`\n📊 生成了 ${accounts.length} 个测试账号`)
  return accounts
}

/**
 * 生成测试智能体
 */
async function generateTestAgents(accounts) {
  console.log('\n🤖 生成测试智能体...')
  
  const creators = accounts.filter(a => a.role === 'creator')
  const agents = []
  
  for (let i = 1; i <= 100; i++) {
    const creator = creators[i % creators.length]
    
    if (!creator.token) continue
    
    try {
      const agentRes = await http.post(`${API_BASE}/api/agents`,
        JSON.stringify({
          name: `LoadTest Agent ${i}`,
          description: `这是压测生成的第 ${i} 个智能体`,
          category: ['合同审查', '劳动纠纷', '知识产权', '公司法务'][i % 4],
          price: Math.floor(Math.random() * 100) + 10,
          is_public: true,
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${creator.token}`,
          },
        }
      )
      
      if (agentRes.status === 200) {
        const body = JSON.parse(agentRes.body)
        agents.push({
          id: body.data?.id,
          name: `LoadTest Agent ${i}`,
          creator: creator.email,
        })
      }
    } catch (e) {
      // 忽略错误
    }
  }
  
  console.log(`\n📊 生成了 ${agents.length} 个测试智能体`)
  return agents
}

/**
 * 生成测试帖子
 */
async function generateTestPosts(accounts) {
  console.log('\n📝 生成测试帖子...')
  
  const seekers = accounts.filter(a => a.role === 'seeker')
  const posts = []
  
  for (let i = 1; i <= 200; i++) {
    const seeker = seekers[i % seekers.length]
    
    if (!seeker.token) continue
    
    try {
      const postRes = await http.post(`${API_BASE}/api/community/posts`,
        JSON.stringify({
          title: `LoadTest 帖子 ${i}`,
          content: `这是压测生成的第 ${i} 个帖子内容`,
          tags: ['法律咨询', '问答', '分享'][i % 3],
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${seeker.token}`,
          },
        }
      )
      
      if (postRes.status === 200) {
        const body = JSON.parse(postRes.body)
        posts.push({
          id: body.data?.id,
          title: `LoadTest 帖子 ${i}`,
        })
      }
    } catch (e) {
      // 忽略错误
    }
  }
  
  console.log(`\n📊 生成了 ${posts.length} 个测试帖子`)
  return posts
}

/**
 * 导出测试数据
 */
function exportTestData(accounts, agents, posts) {
  const data = {
    timestamp: new Date().toISOString(),
    accounts: accounts.map(a => ({
      email: a.email,
      role: a.role,
      token: a.token,
    })),
    agents: agents.map(a => ({ id: a.id, name: a.name })),
    posts: posts.map(p => ({ id: p.id, title: p.title })),
  }
  
  console.log('\n📤 导出测试数据...')
  console.log(JSON.stringify(data, null, 2))
  
  // 保存到文件
  const fs = require('fs')
  const path = require('path')
  
  const outputPath = path.join(__dirname, 'test-data.json')
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2))
  
  console.log(`\n✅ 测试数据已保存到: ${outputPath}`)
  console.log('\n📋 使用方法:')
  console.log(`  k6 run scenarios.js --env TEST_USERS='${JSON.stringify(data.accounts)}'`)
  
  return data
}

/**
 * 主函数
 */
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗')
  console.log('║           律植 (Lvzhi) 压测准备脚本                            ║')
  console.log('╚═══════════════════════════════════════════════════════════════╝')
  console.log(`\nAPI 地址: ${API_BASE}\n`)
  
  // 检查 API 是否可用
  try {
    const healthRes = await http.get(`${API_BASE}/health`)
    if (healthRes.status !== 200) {
      console.log('❌ API 服务不可用，请先启动服务')
      console.log('   运行: cd apps/api && pnpm dev')
      process.exit(1)
    }
    console.log('✅ API 服务正常')
  } catch (e) {
    console.log('❌ 无法连接 API 服务')
    console.log('   请确保服务已启动: cd apps/api && pnpm dev')
    process.exit(1)
  }
  
  // 生成测试数据
  const accounts = await generateTestAccounts()
  const agents = await generateTestAgents(accounts)
  const posts = await generateTestPosts(accounts)
  
  // 导出
  const data = exportTestData(accounts, agents, posts)
  
  console.log('\n╔═══════════════════════════════════════════════════════════════╗')
  console.log('║                   压测准备完成!                                 ║')
  console.log('╚═══════════════════════════════════════════════════════════════╝')
  console.log('\n下一步:')
  console.log('1. 安装 k6: brew install k6 (macOS)')
  console.log('2. 运行压测: cd apps/api/load-test && k6 run scenarios.js')
}

main().catch(console.error)
