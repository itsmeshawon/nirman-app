"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Building2, ShieldCheck, Users } from "lucide-react"

const STEPS = [
  {
    icon: Building2,
    badge: "Project Admin",
    badgeColor: "bg-[#1B4FFF]/10 text-[#1B4FFF]",
    step: "01",
    title: "Developer sets up",
    description:
      "Create your project, add shareholders, configure payment schedules, set committee members and approval rules.",
  },
  {
    icon: ShieldCheck,
    badge: "Committee",
    badgeColor: "bg-[#00C2A8]/10 text-[#00C2A8]",
    step: "02",
    title: "Expenses go through governance",
    description:
      "Every expense requires proof. Committee reviews and approves. Only approved expenses are published to shareholders.",
    flow: ["Draft", "Submitted", "Approved", "Published"],
  },
  {
    icon: Users,
    badge: "Shareholders",
    badgeColor: "bg-[#FF6B2B]/10 text-[#FF6B2B]",
    step: "03",
    title: "Shareholders stay informed",
    description:
      "Shareholders see published expenses, track payments, download receipts, and watch construction progress in real time.",
  },
]

function StepCard({
  step,
  index,
}: {
  step: (typeof STEPS)[0]
  index: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })
  const Icon = step.icon

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex flex-col bg-white rounded-2xl border border-[#E5E8F0] p-8 hover:shadow-lg transition-shadow"
    >
      <div className="absolute top-6 right-6 text-[56px] font-black text-[#F5F7FF] leading-none select-none">
        {step.step}
      </div>

      <div className="w-12 h-12 rounded-xl bg-[#F5F7FF] flex items-center justify-center mb-5">
        <Icon className="w-6 h-6 text-[#1B4FFF]" />
      </div>

      <span className={`text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full w-fit mb-4 ${step.badgeColor}`}>
        {step.badge}
      </span>

      <h3 className="text-[19px] font-bold text-[#111827] mb-3">{step.title}</h3>
      <p className="text-[15px] text-[#6B7280] leading-relaxed flex-1">{step.description}</p>

      {step.flow && (
        <div className="mt-5 pt-5 border-t border-[#F0F0F0] flex items-center gap-1.5 flex-wrap">
          {step.flow.map((s, i) => (
            <div key={s} className="flex items-center gap-1.5">
              <span
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                  i < step.flow!.length - 1
                    ? "bg-[#E8EDFF] text-[#1B4FFF]"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {s}
              </span>
              {i < step.flow!.length - 1 && (
                <span className="text-[#CBD5E1] text-sm">›</span>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

export function HowItWorks() {
  const headRef = useRef<HTMLDivElement>(null)
  const headInView = useInView(headRef, { once: true, margin: "-80px" })

  return (
    <section id="how-it-works" className="bg-white py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          ref={headRef}
          initial={{ opacity: 0, y: 24 }}
          animate={headInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          className="text-center mb-16"
        >
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#1B4FFF] mb-3">
            How It Works
          </p>
          <h2 className="text-[32px] lg:text-[40px] font-bold text-[#111827] mb-4">
            How Truzo works
          </h2>
          <p className="text-[18px] text-[#6B7280] max-w-lg mx-auto">
            Three roles. One platform. Zero ambiguity.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {STEPS.map((step, i) => (
            <StepCard key={step.step} step={step} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
