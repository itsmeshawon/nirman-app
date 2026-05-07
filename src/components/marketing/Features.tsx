"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import {
  Receipt,
  ShieldCheck,
  Banknote,
  AlertCircle,
  Camera,
  History,
  Lock,
  BarChart3,
} from "lucide-react"

const FEATURES = [
  {
    icon: Receipt,
    title: "Proof-First Expenses",
    description:
      "Every expense must have proof attached before submission. No proof, no approval, no publishing. Period.",
  },
  {
    icon: ShieldCheck,
    title: "Committee Approval Workflow",
    description:
      "Elected committee members review, approve, or reject expenses. Configurable: majority or any single member.",
  },
  {
    icon: Banknote,
    title: "Payment Schedules & Receipts",
    description:
      "Monthly or milestone-based schedules auto-generated per shareholder. Every payment gets an instant PDF receipt.",
  },
  {
    icon: AlertCircle,
    title: "Penalty Engine",
    description:
      "Auto-calculated penalties after grace period. Fixed, percentage, or daily rate. Waivers logged permanently.",
  },
  {
    icon: Camera,
    title: "Construction Activity Feed",
    description:
      "Post photos, videos, and audio updates. Shareholders react and stay connected to their investment in real time.",
  },
  {
    icon: History,
    title: "Full Audit Trail",
    description:
      "Every action timestamped and logged forever. Who approved what, when, and why. Full accountability.",
  },
  {
    icon: Lock,
    title: "Shareholder Privacy",
    description:
      "Every shareholder sees only their own payment data. No cross-visibility. Privacy enforced at database level.",
  },
  {
    icon: BarChart3,
    title: "One-Click Reports",
    description:
      "Shareholder statements, expense ledgers, defaulter reports, collection summaries — PDF or CSV in seconds.",
  },
]

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof FEATURES)[0]
  index: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-40px" })
  const Icon = feature.icon

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.96, y: 20 }}
      animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
      transition={{ delay: (index % 4) * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="group relative bg-[#1e1e30] rounded-2xl p-6 border border-white/[0.07] hover:border-[#1B4FFF]/40 hover:bg-[#1e2040] transition-all"
    >
      <div className="w-10 h-10 rounded-xl bg-[#1B4FFF]/15 flex items-center justify-center mb-5 group-hover:bg-[#1B4FFF]/25 transition-colors">
        <Icon className="w-5 h-5 text-[#6B9FFF]" />
      </div>
      <h3 className="text-[16px] font-bold text-white mb-2">{feature.title}</h3>
      <p className="text-[14px] text-[#9CA3AF] leading-relaxed">{feature.description}</p>
    </motion.div>
  )
}

export function Features() {
  const headRef = useRef<HTMLDivElement>(null)
  const headInView = useInView(headRef, { once: true, margin: "-80px" })

  return (
    <section id="features" className="bg-[#1A1A2E] py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          ref={headRef}
          initial={{ opacity: 0, y: 24 }}
          animate={headInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          className="text-center mb-16"
        >
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#1B4FFF] mb-3">
            Features
          </p>
          <h2 className="text-[32px] lg:text-[40px] font-bold text-white mb-4">
            Everything a shared project needs
          </h2>
          <p className="text-[18px] text-[#9CA3AF] max-w-lg mx-auto">
            Built for the Bangladesh construction market
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-4 lg:gap-5">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
