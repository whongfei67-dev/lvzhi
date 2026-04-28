/**
 * 法律智能体专用工具
 * 
 * 功能：
 * - 法条检索（RAG 向量库查询）
 * - 案例检索
 * - 法律风险评估
 */

import { query } from '../lib/database.js'
import type { ChatMessage } from '../types.js'

// ============================================
// 法条检索工具
// ============================================

export interface LawSearchResult {
  law_name: string
  article_number: string
  title: string
  content: string
  relevance_score: number
}

export async function searchLaws(keyword: string, limit = 5): Promise<LawSearchResult[]> {
  try {
    // 使用 PostgreSQL 全文搜索
    // 实际生产环境应该使用向量数据库（如 Milvus、Pinecone）
    const result = await query<{
      law_name: string
      article_number: string
      title: string
      content: string
    }>(
      `SELECT 
        law_name,
        article_number,
        title,
        content,
        ts_rank(to_tsvector('chinese', title || ' ' || content), plainto_tsquery('chinese', $1)) as rank
       FROM legal_provisions
       WHERE to_tsvector('chinese', title || ' ' || content) @@ plainto_tsquery('chinese', $1)
       ORDER BY rank DESC
       LIMIT $2`,
      [keyword, limit]
    )

    return result.rows.map((row, index) => ({
      ...row,
      relevance_score: 1 - (index * 0.15), // 模拟相关性分数
    }))
  } catch (error) {
    console.error('Law search error:', error)
    return []
  }
}

/**
 * 格式化法条为可读文本
 */
export function formatLawText(result: LawSearchResult): string {
  return `【${result.law_name} 第${result.article_number}条 ${result.title}】

${result.content}`
}

// ============================================
// 案例检索工具
// ============================================

export interface CaseSearchResult {
  id: string
  case_number: string
  case_type: string
  court_level: string
  judgment_date: string
  summary: string
  key_points: string[]
  judgment_result: string
  relevance_score: number
}

export async function searchCases(keyword: string, caseType?: string, limit = 3): Promise<CaseSearchResult[]> {
  try {
    const conditions = [
      `to_tsvector('chinese', summary || ' ' || key_points) @@ plainto_tsquery('chinese', $1)`,
    ]
    const params: unknown[] = [keyword]
    let paramIndex = 2

    if (caseType) {
      conditions.push(`case_type = $${paramIndex++}`)
      params.push(caseType)
    }

    const result = await query<{
      id: string
      case_number: string
      case_type: string
      court_level: string
      judgment_date: string
      summary: string
      key_points: string
      judgment_result: string
    }>(
      `SELECT 
        id, case_number, case_type, court_level, judgment_date,
        summary, key_points, judgment_result,
        ts_rank(to_tsvector('chinese', summary || ' ' || key_points), plainto_tsquery('chinese', $1)) as rank
       FROM legal_cases
       WHERE ${conditions.join(' AND ')}
       ORDER BY rank DESC
       LIMIT $${paramIndex}`,
      [...params, limit]
    )

    return result.rows.map((row, index) => ({
      id: row.id,
      case_number: row.case_number,
      case_type: row.case_type,
      court_level: row.court_level,
      judgment_date: row.judgment_date,
      summary: row.summary,
      key_points: typeof row.key_points === 'string' 
        ? JSON.parse(row.key_points) 
        : row.key_points,
      judgment_result: row.judgment_result,
      relevance_score: 1 - (index * 0.2),
    }))
  } catch (error) {
    console.error('Case search error:', error)
    return []
  }
}

/**
 * 格式化案例为可读文本
 */
export function formatCaseText(result: CaseSearchResult): string {
  return `【${result.case_type}】${result.case_number}

法院：${result.court_level}
判决日期：${result.judgment_date}

案件摘要：
${result.summary}

关键要点：
${result.key_points.map((point, i) => `${i + 1}. ${point}`).join('\n')}

判决结果：
${result.judgment_result}`
}

// ============================================
// 法律风险评估
// ============================================

export interface RiskAssessment {
  level: 'low' | 'medium' | 'high' | 'critical'
  score: number
  factors: string[]
  suggestions: string[]
}

export async function assessLegalRisk(
  scenario: string,
  riskFactors: string[]
): Promise<RiskAssessment> {
  // 简化的风险评估逻辑
  // 实际应该使用更复杂的规则引擎或 ML 模型

  const highRiskKeywords = [
    '合同诈骗', '非法集资', '洗钱', '偷税漏税', '职务侵占',
    '商业贿赂', '侵犯商业秘密', '知识产权侵权', '环境污染',
  ]

  const mediumRiskKeywords = [
    '违约', '侵权', '劳动纠纷', '债务纠纷', '合同争议',
    '股权纠纷', '合伙纠纷', '租赁纠纷',
  ]

  const lowRiskKeywords = [
    '咨询', '建议', '审查', '起草', '登记', '备案',
  ]

  let riskScore = 50 // 基础风险分数
  const factors: string[] = []
  const suggestions: string[] = []

  // 检查关键词
  for (const keyword of highRiskKeywords) {
    if (scenario.includes(keyword)) {
      riskScore += 30
      factors.push(`涉及高风险事项：${keyword}`)
    }
  }

  for (const keyword of mediumRiskKeywords) {
    if (scenario.includes(keyword)) {
      riskScore += 15
      factors.push(`涉及中等风险：${keyword}`)
    }
  }

  for (const keyword of lowRiskKeywords) {
    if (scenario.includes(keyword)) {
      riskScore -= 5
    }
  }

  // 根据风险因素调整
  for (const factor of riskFactors) {
    if (factor.includes('重大') || factor.includes('主要')) {
      riskScore += 20
      factors.push('涉及重大利益或事项')
    }
    if (factor.includes('金额') || factor.includes('标的')) {
      riskScore += 10
      factors.push('涉及较大金额')
    }
  }

  // 确定风险等级
  let level: RiskAssessment['level']
  if (riskScore >= 80) {
    level = 'critical'
    suggestions.push('建议立即咨询专业律师')
    suggestions.push('可能需要启动法律程序')
    suggestions.push('建议保留相关证据')
  } else if (riskScore >= 60) {
    level = 'high'
    suggestions.push('建议咨询专业律师')
    suggestions.push('谨慎处理，避免风险扩大')
    suggestions.push('做好证据保全')
  } else if (riskScore >= 40) {
    level = 'medium'
    suggestions.push('注意防范法律风险')
    suggestions.push('建议书面确认重要事项')
    suggestions.push('如有疑问可咨询律师')
  } else {
    level = 'low'
    suggestions.push('风险较低，但仍需注意合规')
    suggestions.push('建议保留书面记录')
  }

  return {
    level,
    score: Math.max(0, Math.min(100, riskScore)),
    factors: [...new Set(factors)], // 去重
    suggestions,
  }
}

// ============================================
// 构建法律 Agent 工具列表
// ============================================

export function getLegalTools() {
  return [
    {
      type: 'function' as const,
      function: {
        name: 'search_laws',
        description: '检索相关法律法规条文。根据用户问题搜索相关法律条款，返回最匹配的条文内容。适用于需要引用具体法条依据的场景。',
        parameters: {
          type: 'object',
          properties: {
            keyword: {
              type: 'string',
              description: '搜索关键词，如"劳动合同解除"、"违约金"等',
            },
            limit: {
              type: 'number',
              description: '返回结果数量，默认5条',
              default: 5,
            },
          },
          required: ['keyword'],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'search_cases',
        description: '检索相关法律案例。根据关键词搜索类似案例，帮助理解类似情况的判决结果。适用于需要参考判例的场景。',
        parameters: {
          type: 'object',
          properties: {
            keyword: {
              type: 'string',
              description: '搜索关键词',
            },
            case_type: {
              type: 'string',
              description: '案件类型筛选，如"民事"、"刑事"、"行政"',
            },
            limit: {
              type: 'number',
              description: '返回结果数量，默认3条',
              default: 3,
            },
          },
          required: ['keyword'],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'assess_risk',
        description: '评估法律风险等级。根据描述的场景和因素，评估当前情况的法律风险程度，并给出建议。',
        parameters: {
          type: 'object',
          properties: {
            scenario: {
              type: 'string',
              description: '具体情况描述',
            },
            risk_factors: {
              type: 'array',
              items: { type: 'string' },
              description: '风险因素列表',
            },
          },
          required: ['scenario'],
        },
      },
    },
  ]
}

/**
 * 执行工具调用
 */
export async function executeTool(
  toolName: string,
  args: Record<string, unknown>
): Promise<string> {
  switch (toolName) {
    case 'search_laws': {
      const results = await searchLaws(args.keyword as string, args.limit as number)
      if (results.length === 0) {
        return '未找到相关法条'
      }
      return results.map(formatLawText).join('\n\n')
    }

    case 'search_cases': {
      const results = await searchCases(
        args.keyword as string,
        args.case_type as string | undefined,
        args.limit as number
      )
      if (results.length === 0) {
        return '未找到相关案例'
      }
      return results.map(formatCaseText).join('\n\n')
    }

    case 'assess_risk': {
      const assessment = await assessLegalRisk(
        args.scenario as string,
        (args.risk_factors as string[]) || []
      )
      const levelText = {
        low: '低风险',
        medium: '中等风险',
        high: '高风险',
        critical: '极高风险',
      }
      return `风险评估结果：${levelText[assessment.level]} (${assessment.score}分)

风险因素：
${assessment.factors.length > 0 ? assessment.factors.map(f => `- ${f}`).join('\n') : '无明显风险因素'}

建议措施：
${assessment.suggestions.map(s => `- ${s}`).join('\n')}`
    }

    default:
      return `未知工具：${toolName}`
  }
}
