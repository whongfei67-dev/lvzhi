"use client";

import Link from "next/link";
import { Check } from "lucide-react";

export interface PriceCardPlan {
  name: string;
  price: string;
  period?: string;
  description?: string;
  features: string[];
  excludedFeatures?: string[];
  cta: string;
  ctaHref?: string;
  ctaDisabled?: boolean;
  highlighted?: boolean;
  badge?: string;
}

interface PriceCardProps {
  plan: PriceCardPlan;
}

export function PriceCard({ plan }: PriceCardProps) {
  return (
    <div
      className={`relative flex flex-col rounded-3xl border p-6 transition-all ${
        plan.highlighted
          ? "border-emerald-500 bg-emerald-50/50 shadow-lg shadow-emerald-100"
          : "border-slate-200 bg-white"
      }`}
    >
      {/* Badge */}
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">
            {plan.badge}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="text-center">
        <h3 className={`text-lg font-semibold ${plan.highlighted ? "text-emerald-800" : "text-slate-900"}`}>
          {plan.name}
        </h3>
        <div className="mt-3 flex items-baseline justify-center gap-1">
          <span className={`text-4xl font-bold ${plan.highlighted ? "text-emerald-700" : "text-slate-950"}`}>
            {plan.price}
          </span>
          {plan.period && (
            <span className="text-sm text-slate-500">{plan.period}</span>
          )}
        </div>
        {plan.description && (
          <p className={`mt-3 text-sm ${plan.highlighted ? "text-emerald-700" : "text-slate-500"}`}>
            {plan.description}
          </p>
        )}
      </div>

      {/* Features */}
      <ul className="mt-6 space-y-3">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
              plan.highlighted ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600"
            }`}>
              <Check className="h-3 w-3" />
            </div>
            <span className={`text-sm ${plan.highlighted ? "text-emerald-800" : "text-slate-600"}`}>
              {feature}
            </span>
          </li>
        ))}
        {plan.excludedFeatures?.map((feature, index) => (
          <li key={`excluded-${index}`} className="flex items-start gap-3 opacity-50">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100">
              <span className="text-xs text-slate-400">×</span>
            </div>
            <span className="text-sm text-slate-400 line-through">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div className="mt-8">
        {plan.ctaHref ? (
          <Link
            href={plan.ctaHref}
            className={`flex w-full items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold transition-colors ${
              plan.highlighted
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
          >
            {plan.cta}
          </Link>
        ) : (
          <button
            disabled={plan.ctaDisabled}
            className={`flex w-full items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold transition-colors ${
              plan.ctaDisabled
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : plan.highlighted
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
          >
            {plan.cta}
          </button>
        )}
      </div>
    </div>
  );
}
