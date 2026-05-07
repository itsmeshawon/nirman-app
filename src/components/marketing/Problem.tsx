"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { ReceiptText, ShieldX, EyeOff, ArrowDown } from "lucide-react"

const PROBLEMS = [
  {
    icon: ReceiptText,
    title: "No Proof",
    description:
      "Expenses shared on WhatsApp with no receipts, no proof, no way to verify where the money went.",
  },
  {
    icon: ShieldX,
    title: "No Governance",
    description:
      "Shareholders have no say in expenses. Decisions happen behind closed doors. Trust breaks down.",
  },
  {
    icon: EyeOff,
    title: "No Transparency",
    description:
      "Payment schedules tracked in Excel. Penalties applied without records. Disputes with no audit trail.",
  },
]

function ProblemCard({
  icon: Icon,
  title,
  description,
  index,
}: {
  icon: React.ElementType
  title: string
  description: string
  index: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.1, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white rounded-2xl border border-[#E5E8F0] p-6 flex gap-5 group hover:shadow-md transition-shadow"
      style={{ borderLeft: "3px solid #E5E8F0" }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.borderLeftColor = "#EF4444"
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.borderLeftColor = "#E5E8F0"
      }}
    >
      <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center mt-0.5">
        <Icon className="w-5 h-5 text-red-500" />
      </div>
      <div>
        <h3 className="text-[17px] font-bold text-[#111827] mb-2">{title}</h3>
        <p className="text-[15px] text-[#6B7280] leading-relaxed">{description}</p>
      </div>
    </motion.div>
  )
}

export function Problem() {
  const headRef = useRef<HTMLDivElement>(null)
  const headInView = useInView(headRef, { once: true, margin: "-80px" })
  const cta = useRef<HTMLDivElement>(null)
  const ctaInView = useInView(cta, { once: true, margin: "-40px" })

  return (
    <section className="bg-[#F5F7FF] py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          ref={headRef}
          initial={{ opacity: 0, y: 24 }}
          animate={headInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          className="text-center mb-14"
        >
          <h2 className="text-[32px] lg:text-[40px] font-bold text-[#111827] leading-tight">
            Construction projects run on Excel and WhatsApp.
            <br />
            <span className="text-[#EF4444]">That&apos;s the problem.</span>
          </h2>
        </motion.div>

        <div className="flex flex-col gap-4">
          {PROBLEMS.map((p, i) => (
            <ProblemCard key={p.title} {...p} index={i} />
          ))}
        </div>

        <motion.div
          ref={cta}
          initial={{ opacity: 0, y: 16 }}
          animate={ctaInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-12 flex flex-col items-center gap-3"
        >
          <p className="text-[17px] font-semibold text-[#1B4FFF]">
            Sound familiar? You need Truzo.
          </p>
          <ArrowDown className="w-5 h-5 text-[#1B4FFF] animate-bounce" />
        </motion.div>
      </div>
    </section>
  )
}
