"use client"

import { useRef } from "react"
import { color, motion, useInView } from "framer-motion"
import { CheckCircle2 } from "lucide-react"
import Link from "next/link"

const BULLETS = [
  "View all published expenses with attached proof",
  "Download your receipts and statements anytime",
  "See construction progress in real time",
  "Your data is private — nobody else can see your payments",
]

function ShareholderMockup() {
  return (
    <div className="relative w-full max-w-[300px] mx-auto">
      {/* Phone frame */}
      <div className="relative bg-white rounded-[36px] shadow-2xl border-[6px] border-[#1A1A2E] overflow-hidden aspect-[9/19]">
        {/* Status bar */}
        <div className="bg-[#1A1A2E] h-8 flex items-center justify-between px-5">
          <span className="text-white text-[10px] font-semibold">9:41</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-1.5 bg-white rounded-sm opacity-60" />
            <div className="w-3 h-1.5 bg-white rounded-sm opacity-80" />
            <div className="w-3 h-1.5 bg-white rounded-sm" />
          </div>
        </div>

        {/* App content */}
        <div className="bg-[#F5F7FF] flex-1 h-full overflow-hidden">
          {/* App header */}
          <div className="bg-white border-b border-[#E5E8F0] px-4 py-3">
            <p className="text-[10px] text-[#6B7280] font-medium">My Payments</p>
            <p className="text-[13px] font-bold text-[#111827]">Green Valley Heights</p>
          </div>

          <div className="p-3 space-y-2.5">
            {/* Balance card */}
            <div className="bg-[#1B4FFF] rounded-xl p-3.5 text-white">
              <p className="text-[10px] text-white/70 uppercase tracking-wider font-semibold mb-1">Total Paid</p>
              <p className="text-[22px] font-bold leading-none text-white">৳18,50,000</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[10px] text-white/70">Next due: Mar 20</span>
                <span className="bg-white/20 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">Active</span>
              </div>
            </div>

            {/* Recent payments */}
            <div className="bg-white rounded-xl border border-[#E5E8F0] overflow-hidden">
              <div className="px-3 py-2 border-b border-[#F0F0F0]">
                <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">Recent Payments</p>
              </div>
              {[
                { label: "Jan Installment", amount: "৳50,000", status: "Paid", color: "text-emerald-600 bg-emerald-50" },
                { label: "Feb Installment", amount: "৳50,000", status: "Paid", color: "text-emerald-600 bg-emerald-50" },
                { label: "Mar Installment", amount: "৳50,000", status: "Due", color: "text-amber-600 bg-amber-50" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between px-3 py-2 border-b border-[#F5F5F5] last:border-0">
                  <div>
                    <p className="text-[11px] font-semibold text-[#111827]">{item.label}</p>
                    <p className="text-[10px] text-[#9CA3AF]">{item.amount}</p>
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${item.color}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Expense activity */}
            <div className="bg-white rounded-xl border border-[#E5E8F0] p-3">
              <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Latest Update</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1B4FFF]/30 to-[#00C2A8]/20 shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold text-[#111827]">3rd floor progress</p>
                  <p className="text-[10px] text-[#9CA3AF]">1 hour ago · 6 photos</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating label */}
      <div className="absolute -right-6 top-1/3 bg-white rounded-xl shadow-xl p-2.5 border border-[#E5E8F0]">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[11px] font-bold text-[#111827]">Private</span>
        </div>
        <p className="text-[10px] text-[#6B7280]">Only you can see this</p>
      </div>
    </div>
  )
}

export function ForShareholders() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <section
      id="for-shareholders"
      className="py-24 px-4"
      style={{
        background: "linear-gradient(135deg, #E8EDFF 0%, #E0F9F6 100%)",
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#1B4FFF] bg-[#1B4FFF]/10 px-3 py-1.5 rounded-full inline-block mb-5">
              For Shareholders
            </span>
            <h2 className="text-[32px] lg:text-[40px] font-bold text-[#111827] leading-tight mb-5">
              Finally, see where your money goes.
            </h2>
            <p className="text-[17px] text-[#4B5563] leading-relaxed mb-8">
              Truzo gives every shareholder a private dashboard with their complete
              payment history, upcoming dues, approved expenses with proof, and live
              construction updates. You invested in this building. You deserve to
              know everything.
            </p>

            <ul className="space-y-3.5 mb-10">
              {BULLETS.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#1B4FFF] shrink-0 mt-0.5" />
                  <span className="text-[15px] text-[#374151]">{bullet}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/login"
              className="inline-flex items-center justify-center bg-[#1B4FFF] text-white px-8 py-3.5 rounded-full font-semibold hover:bg-[#0A3ACC] transition-all active:scale-95"
            >
              View Your Dashboard
            </Link>
          </motion.div>

          {/* Right */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="flex justify-center lg:justify-end"
          >
            <ShareholderMockup />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
