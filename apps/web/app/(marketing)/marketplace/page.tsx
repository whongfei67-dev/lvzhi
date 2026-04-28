'use client'

import { preferTradForKeShiLu } from "@/lib/keshilu-text";
import { useState } from 'react'
import Link from 'next/link'
import {
  Store,
  Search,
  ShoppingCart,
  Star,
  ArrowRight,
  Tag,
  Zap,
  Shield,
  CheckCircle
} from 'lucide-react'

/**
 * 市场（Marketplace）页面 — UI预演方案
 * 视觉方向：琥珀咖啡色系 + 思源宋体 + 丝绒质感
 */

const HERO_IMAGE = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=80"

const CATEGORIES = [
  { name: '全部商品', count: 1280, icon: Store },
  { name: 'Skills 技能包', count: 650, icon: Zap },
  { name: '智能体', count: 380, icon: Tag },
  { name: '模板工具', count: 250, icon: ShoppingCart },
]

const FEATURED_PRODUCTS = [
  {
    id: '1',
    name: 'AI 合同风险排查助手',
    creator: '张律师',
    type: '智能体',
    price: '免费',
    uses: '5.6k',
    rating: 4.8,
    tags: ['合同审查', '自动化'],
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&q=80'
  },
  {
    id: '2',
    name: '劳动争议处理全流程',
    creator: '陈晓敏',
    type: 'Skills',
    price: '¥99',
    uses: '1.2k',
    rating: 4.9,
    tags: ['劳动争议', '流程指引'],
    image: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=400&q=80'
  },
  {
    id: '3',
    name: '企业合规自查清单',
    creator: '王建国',
    type: 'Skills',
    price: '¥79',
    uses: '980',
    rating: 4.7,
    tags: ['企业合规', '清单工具'],
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&q=80'
  },
  {
    id: '4',
    name: '婚姻家事咨询机器人',
    creator: '林雨欣',
    type: '智能体',
    price: '免费',
    uses: '3.2k',
    rating: 4.6,
    tags: ['婚姻家事', '咨询问答'],
    image: 'https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?w=400&q=80'
  }
]

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('')

  return (
    <div className="min-h-screen marketing-page-shell-tint">
      {/* ── Hero ── */}
      <section className="page-header" style={{ position: 'relative' }}>
        <div className="page-header-bg" style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 0,
          overflow: 'hidden'
        }}>
          <img
            src={HERO_IMAGE}
            alt="市场"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
          <div className="marketing-hero-photo-overlay" />
        </div>
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 w-full">
          <div className="page-header-content animate-fade-in-up">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-[rgba(212,165,116,0.25)]">
              <Store className="w-4 h-4 text-[#B8860B]" />
              <span className="text-sm font-medium text-[#D4A574]">市场</span>
            </div>

            <h1 className="page-title">{preferTradForKeShiLu("发现优质法律产品与服务")}</h1>
            <p className="page-desc">{preferTradForKeShiLu("浏览由认证律师和创作者打造的 Skills、智能体、模板与工具，找到最适合你的解决方案")}</p>

            {/* 搜索框 */}
            <div className="mt-8">
              <div className="search-box mx-auto max-w-xl">
                <Search className="text-[#9A8B78]" />
                <input
                  type="text"
                  placeholder="搜索产品、创作者、关键词..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-[#2C2416]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 商品分类 ── */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="section-header mb-12">
            <div className="section-label">Categories</div>
            <h2 className="section-title text-[#D4A574]">商品分类</h2>
            <p className="section-subtitle">
              {preferTradForKeShiLu("按类型浏览，快速找到所需")}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map((cat, idx) => (
              <button
                key={cat.name}
                onClick={() => setSelectedType(cat.name === '全部商品' ? '' : cat.name)}
                className={`card group p-6 text-center transition-all ${selectedType === cat.name || (selectedType === '' && cat.name === '全部商品') ? 'border-[rgba(212,165,116,0.4)] ring-2 ring-[rgba(212,165,116,0.2)]' : ''}`}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="w-14 h-14 rounded-2xl bg-[rgba(212,165,116,0.15)] flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <cat.icon className="w-7 h-7 text-[#D4A574]" />
                </div>
                <h3 className="font-semibold text-[#2C2416] mb-1">{cat.name}</h3>
                <p className="text-sm text-[#9A8B78]">{cat.count} 件商品</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── 精选商品 ── */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="section-label">Featured</div>
              <h2 className="section-title text-[#D4A574]">精选商品</h2>
              <p className="section-subtitle mt-2 text-[#5D4E3A]">
                {preferTradForKeShiLu("由认证创作者打造的高质量法律产品")}
              </p>
            </div>
            <Link
              href="/marketplace/all"
              className="hidden items-center gap-1 text-sm font-semibold text-[#D4A574] transition-all group-hover:gap-2 sm:flex"
            >
              查看全部 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {FEATURED_PRODUCTS.map((product, idx) => (
              <Link
                key={product.id}
                href={`/marketplace/product/${product.id}`}
                className="card group overflow-hidden"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                {/* 商品封面 */}
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      product.type === '智能体'
                        ? 'bg-[rgba(212,165,116,0.9)] text-[#D4A574]'
                        : 'bg-white/90 text-[#D4A574]'
                    }`}>
                      {product.type}
                    </span>
                  </div>
                </div>

                {/* 商品信息 */}
                <div className="p-5">
                  <h3 className="font-semibold text-[#2C2416] mb-1 line-clamp-2 group-hover:text-[#D4A574] transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-sm text-[#5D4E3A] mb-3">创作者：{product.creator}</p>

                  <div className="flex items-center justify-between text-sm mb-3">
                    <div className="flex items-center gap-2">
                      {product.tags.map(tag => (
                        <span key={tag} className="tag text-xs">{tag}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 text-[#D4A574] font-medium">
                      <Star className="w-4 h-4 fill-[#D4A574] text-[#D4A574]" />
                      {product.rating}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[rgba(212,165,116,0.25)]">
                    <span className="text-lg font-bold text-[#D4A574]">{product.price}</span>
                    <span className="text-sm text-[#9A8B78]">{product.uses} 已使用</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 平台优势 ── */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="section-header mb-12">
            <div className="section-label">Why Us</div>
            <h2 className="section-title text-[#D4A574]">为什么选择律植市场</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="card group p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[rgba(212,165,116,0.15)] flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-[#D4A574]" />
              </div>
              <h3 className="font-semibold text-[#2C2416] mb-2">质量保证</h3>
              <p className="text-sm text-[#5D4E3A]">所有商品均经过平台审核，确保内容专业可靠</p>
            </div>
            <div className="card group p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[rgba(212,165,116,0.15)] flex items-center justify-center mx-auto mb-4">
                <Zap className="w-7 h-7 text-[#D4A574]" />
              </div>
              <h3 className="font-semibold text-[#2C2416] mb-2">即开即用</h3>
              <p className="text-sm text-[#5D4E3A]">在线预览、即时购买、即刻使用，高效便捷</p>
            </div>
            <div className="card group p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[rgba(212,165,116,0.15)] flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-[#D4A574]" />
              </div>
              <h3 className="font-semibold text-[#2C2416] mb-2">持续支持</h3>
              <p className="text-sm text-[#5D4E3A]">购买后可获得创作者支持与内容更新</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-[#D4A574] mb-4">
            开始探索法律产品市场
          </h2>
          <p className="text-lg text-[#5D4E3A] mb-8">
            发现、使用、分享，让法律工作更高效
          </p>
          <Link href="/marketplace/all" className="btn-slide primary">
            <ShoppingCart className="w-5 h-5" />
            浏览市场
          </Link>
        </div>
      </section>
    </div>
  )
}
