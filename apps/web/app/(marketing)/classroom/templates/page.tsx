'use client'

import { preferTradForKeShiLu } from "@/lib/keshilu-text";
import { useState } from 'react'
import Link from 'next/link'
import { FileText, ArrowRight, Download, Copy, Check } from 'lucide-react'

export default function ClassroomTemplatesPage() {
  const TEMPLATES = [
    { name: '劳动合同模板', category: '劳动法', downloads: 2340 },
    { name: '保密协议模板', category: '合同法', downloads: 1890 },
    { name: '股权转让协议', category: '公司法', downloads: 1560 },
    { name: '房屋租赁合同', category: '合同法', downloads: 1420 },
    { name: '和解协议书', category: '民事', downloads: 1280 },
    { name: '授权委托书', category: '民事', downloads: 1150 },
  ]

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
            src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1920&q=80"
            alt="课程模板"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div className="marketing-hero-photo-overlay" />
        </div>
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 w-full">
          <div className="page-header-content animate-fade-in-up">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-[rgba(212,165,116,0.25)]">
              <FileText className="w-4 h-4 text-[#B8860B]" />
              <span className="text-sm font-medium text-[#D4A574]">课程模板</span>
            </div>
            <h1 className="page-title">{preferTradForKeShiLu("法律模板库")}</h1>
            <p className="page-desc">{preferTradForKeShiLu("专业的法律文书模板，即下即用，省时省力")}</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {TEMPLATES.map((template, idx) => (
              <div
                key={template.name}
                className="card group p-6"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[rgba(212,165,116,0.15)] flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-[#D4A574]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#2C2416] mb-1">{template.name}</h3>
                    <span className="tag text-xs">{template.category}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-[rgba(212,165,116,0.25)] flex items-center justify-between">
                  <span className="text-sm text-[#9A8B78]">{template.downloads} 次下载</span>
                  <button className="flex items-center gap-1 text-sm font-medium text-[#D4A574] hover:text-[#2C2416]">
                    <Download className="w-4 h-4" />
                    下载
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
