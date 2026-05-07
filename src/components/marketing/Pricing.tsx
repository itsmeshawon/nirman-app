"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Check } from "lucide-react"
import Link from "next/link"

const PACKAGES = [
  {
    name: "Starter",
    tagline: "Perfect for small projects",
    features: [
      "Expense tracking with proof",
      "Payment schedules",
      "PDF receipts",
      "Shareholder portal",
      "Basic reports",
    ],
    cta: "Join Waitlist",
    ctaHref: "/login",
    highlighted: false,
  },
  {
    name: "Standard",
    tagline: "Most popular choice",
    badge: "Most popular",
    features: [
      "Everything in Starter",
      "Construction activity feed",
      "Advanced reports & CSV",
      "Document management",
      "Committee workflows",
      "Penalty engine",
    ],
    cta: "Join Waitlist",
    ctaHref: "/login",
    highlighted: true,
  },
  {
    name: "Premium",
    tagline: "For large developments",
    features: [
      "Everything in Standard",
      "Priority support",
      "Custom approval rules",
      "Multi-project dashboard",
      "Dedicated onboarding",
    ],
    cta: "Contact Us",
    ctaHref: "tel:01676524172",
    highlighted: false,
  },
]

function PricingCard({
  pkg,
  index,
}: {
  pkg: (typeof PACKAGES)[0]
  index: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-40px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.12, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className={`relative flex flex-col rounded-2xl p-8 ${
        pkg.highlighted
          ? "bg-white border-2 border-[#1B4FFF] shadow-xl shadow-[#1B4FFF]/10"
          : "bg-white border border-[#E5E8F0]"
      }`}
    >
      {pkg.badge && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="bg-[#1B4FFF] text-white text-[11px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full whitespace-nowrap">
            {pkg.badge}
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-[20px] font-bold text-[#111827] mb-1">{pkg.name}</h3>
        <p className="text-[14px] text-[#6B7280]">{pkg.tagline}</p>
      </div>

      <div className="mb-6 pb-6 border-b border-[#F0F0F0]">
        <p className="text-[28px] font-bold text-[#111827]">
          Coming soon
        </p>
        <p className="text-[13px] text-[#9CA3AF] mt-1">Project-based pricing</p>
      </div>

      <ul className="space-y-3 flex-1 mb-8">
        {pkg.features.map((f) => (
          <li key={f} className="flex items-start gap-3">
            <Check
              className={`w-4 h-4 mt-0.5 shrink-0 ${
                pkg.highlighted ? "text-[#1B4FFF]" : "text-emerald-600"
              }`}
            />
            <span className="text-[14px] text-[#374151]">{f}</span>
          </li>
        ))}
      </ul>

      <Link
        href={pkg.ctaHref}
        className={`w-full text-center py-3.5 rounded-full font-semibold text-[15px] transition-all active:scale-95 ${
          pkg.highlighted
            ? "bg-[#1B4FFF] text-white hover:bg-[#0A3ACC]"
            : "bg-[#F5F7FF] text-[#374151] hover:bg-[#E8EDFF] hover:text-[#1B4FFF]"
        }`}
      >
        {pkg.cta}
      </Link>
    </motion.div>
  )
}

export function Pricing() {
  const headRef = useRef<HTMLDivElement>(null)
  const headInView = useInView(headRef, { once: true, margin: "-80px" })

  return (
    <section className="bg-[#F5F7FF] py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          ref={headRef}
          initial={{ opacity: 0, y: 24 }}
          animate={headInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          className="text-center mb-16"
        >
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#1B4FFF] mb-3">
            Pricing
          </p>
          <h2 className="text-[32px] lg:text-[40px] font-bold text-[#111827] mb-4">
            Simple, project-based pricing
          </h2>
          <p className="text-[18px] text-[#6B7280] max-w-md mx-auto">
            Pay per project. No per-user fees. No surprises.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-7">
          {PACKAGES.map((pkg, i) => (
            <PricingCard key={pkg.name} pkg={pkg} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
