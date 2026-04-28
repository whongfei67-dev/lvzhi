'use client'

import { preferTradForKeShiLu } from "@/lib/keshilu-text";
import { useState } from 'react'
import Link from 'next/link'
import { Briefcase, ArrowRight, MapPin, Clock } from 'lucide-react'

const JOB_CATEGORIES = [
  { name: '法务顾问', count: 128 },
  { name: '律师助理', count: 96 },
  { name: '合规专员', count: 78 },
  { name: '法律编辑', count: 65 },
  { name: '律所招聘', count: 145 },
  { name: '企业法务', count: 112 },
]

const FEATURED_JOBS = [
  { title: '高级法务顾问', company: '某科技公司', location: '北京', salary: '30k-50k', type: '全职' },
  { title: '律师助理', company: '某律师事务所', location: '上海', salary: '15k-25k', type: '全职' },
  { title: '合规专员', company: '某金融公司', location: '深圳', salary: '20k-35k', type: '全职' },
]

export default function JobsCategoryPage() {
  return (
    <div className="min-h-screen marketing-page-shell-tint">
      <section className="page-header" style={{ position: 'relative' }}>
        <div className="page-header-bg" style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 0,
          overflow: 'hidden'
        }}>
          <img
            src="https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1920&q=80"
            alt="职位分类"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div className="marketing-hero-photo-overlay" />
        </div>
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 w-full">
          <div className="page-header-content animate-fade-in-up">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-[rgba(212,165,116,0.25)]">
              <Briefcase className="w-4 h-4 text-[#B8860B]" />
              <span className="text-sm font-medium text-[#D4A574]">职位分类</span>
            </div>
            <h1 className="page-title">{preferTradForKeShiLu("法律行业招聘")}</h1>
            <p className="page-desc">{preferTradForKeShiLu("寻找适合你的法律行业工作机会")}</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
            {JOB_CATEGORIES.map((cat, idx) => (
              <Link
                key={cat.name}
                href={`/jobs?category=${encodeURIComponent(cat.name)}`}
                className="card group p-6"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <h3 className="font-semibold text-[#2C2416] mb-2">{cat.name}</h3>
                <p className="text-sm text-[#9A8B78]">{cat.count} 个职位</p>
                <ArrowRight className="w-5 h-5 text-[#9A8B78] mt-3 group-hover:text-[#D4A574] group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>

          <div className="section-header mb-8">
            <h2 className="section-title text-[#D4A574]">最新职位</h2>
          </div>

          <div className="space-y-4">
            {FEATURED_JOBS.map((job, idx) => (
              <Link
                key={job.title}
                href={`/jobs/${encodeURIComponent(job.title)}`}
                className="card group p-6 flex items-center justify-between"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div>
                  <h3 className="font-semibold text-[#2C2416] mb-1">{job.title}</h3>
                  <p className="text-sm text-[#5D4E3A]">{job.company}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-[#9A8B78]">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{job.location}
                    </span>
                    <span className="tag text-xs">{job.type}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[#D4A574]">{job.salary}</p>
                  <ArrowRight className="w-5 h-5 text-[#9A8B78] mt-2 group-hover:text-[#D4A574] group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
