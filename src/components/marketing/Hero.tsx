"use client"

import Link from "next/link"
import { motion, type Variants } from "framer-motion"

function DashboardMockup() {
  return (
    <div className="relative w-full max-w-[420px] mx-auto lg:mx-0">
      {/* Glow */}
      <div className="absolute inset-0 bg-[#1B4FFF]/30 blur-[80px] rounded-full scale-90 translate-y-6 pointer-events-none" />

      {/* Card */}
      <div className="relative bg-[#141420] rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
        {/* Browser chrome */}
        <div className="flex items-center gap-3 px-4 py-3 bg-[#0d0d1a] border-b border-white/5">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
            <div className="w-3 h-3 rounded-full bg-[#28C840]" />
          </div>
          <div className="flex-1 bg-[#1e1e2e] rounded-md px-3 py-1">
            <p className="text-[#6B7280] text-[11px] text-center">truzo.app/expenses</p>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold">
                Green Valley Heights
              </p>
              <p className="text-white font-semibold text-sm">Expenses</p>
            </div>
            <div className="bg-emerald-500/15 text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              3 Pending
            </div>
          </div>

          {/* Expense card */}
          <div className="bg-[#1e1e2e] rounded-xl p-3.5 border border-white/[0.06]">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5 font-medium">
                  Expense
                </p>
                <p className="text-white font-semibold text-[13px]">Foundation Steel Work</p>
              </div>
              <div className="flex items-center gap-1 bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold px-2 py-1 rounded-full shrink-0">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Proof
              </div>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-white font-bold text-base">৳2,45,000</span>
              <span className="text-emerald-400 text-xs font-medium">● Approved</span>
            </div>
            {/* Status flow */}
            <div className="flex items-center gap-1">
              {["Draft", "Submitted", "Approved", "Published"].map((s, i) => (
                <div key={s} className="flex items-center gap-1">
                  <span
                    className={`text-[9px] font-semibold px-2 py-0.5 rounded ${
                      i <= 2
                        ? "bg-[#1B4FFF]/25 text-[#7fa8ff]"
                        : "bg-white/5 text-white/25"
                    }`}
                  >
                    {s}
                  </span>
                  {i < 3 && (
                    <span className="text-white/20 text-[10px] leading-none">›</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Committee approval */}
          <div className="bg-[#1e1e2e] rounded-xl p-3.5 border border-white/[0.06]">
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold">
                Committee Review
              </p>
              <span className="text-[#6B9FFF] text-xs font-semibold">2 / 3 Approved</span>
            </div>
            <div className="flex items-center gap-4">
              {[
                { initials: "KH", approved: true },
                { initials: "RL", approved: true },
                { initials: "MA", approved: false },
              ].map(({ initials, approved }) => (
                <div key={initials} className="flex flex-col items-center gap-1.5">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white text-xs font-bold">
                      {initials}
                    </div>
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#1e1e2e] flex items-center justify-center ${
                        approved ? "bg-emerald-500" : "bg-amber-400"
                      }`}
                    >
                      {approved ? (
                        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-white/35 text-[9px] font-medium">{initials}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity feed */}
          <div className="bg-[#1e1e2e] rounded-xl p-3 border border-white/[0.06] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1B4FFF]/20 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-[#6B9FFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-[12px] font-medium truncate">Floor 3 slab work completed</p>
              <p className="text-white/35 text-[10px]">2 hours ago · 4 photos</p>
            </div>
            <div className="w-10 h-8 rounded-lg overflow-hidden shrink-0 bg-gradient-to-br from-[#1B4FFF]/40 to-[#00C2A8]/30" />
          </div>
        </div>
      </div>

      {/* Floating receipt badge */}
      <motion.div
        initial={{ opacity: 0, x: 16, y: -8 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="absolute -right-4 lg:-right-10 top-14 bg-white rounded-xl shadow-xl p-3 flex items-center gap-2.5 border border-[#E5E8F0]"
      >
        <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-[12px] font-semibold text-gray-800 whitespace-nowrap">Receipt generated</p>
          <p className="text-[10px] text-gray-500">TRZ-GVH-20260108-001</p>
        </div>
      </motion.div>

      {/* Floating proof badge */}
      <motion.div
        initial={{ opacity: 0, x: -16, y: 8 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 1.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="absolute -left-4 lg:-left-10 bottom-24 bg-white rounded-xl shadow-xl p-3 border border-[#E5E8F0]"
      >
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-2 h-2 rounded-full bg-[#1B4FFF]" />
          <span className="text-[11px] font-semibold text-gray-800">100% proof-required</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[11px] text-gray-600">Zero disputes</span>
        </div>
      </motion.div>
    </div>
  )
}

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
}

export function Hero() {
  return (
    <section
      className="relative min-h-screen flex items-center bg-[#1A1A2E] overflow-hidden pt-16"
      style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: "48px 48px",
      }}
    >
      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1B4FFF]/10 via-transparent to-[#00C2A8]/5 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-6"
          >
            <motion.div variants={itemVariants}>
              <span className="inline-flex items-center gap-2 bg-[#FF6B2B]/15 text-[#FF6B2B] border border-[#FF6B2B]/30 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B2B] animate-pulse" />
                Now in Pilot
              </span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-[40px] sm:text-[52px] lg:text-[64px] font-bold text-white leading-[1.08] tracking-tight"
            >
              Every Taka.
              <br />
              Every Decision.
              <br />
              <span className="text-[#1B4FFF]">On Record.</span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-[17px] lg:text-[19px] text-[#9CA3AF] leading-relaxed max-w-xl"
            >
              Truzo is the governance layer for shared construction projects.
              Proof-first expenses. Committee approvals. Shareholder transparency.
              All in one platform.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center bg-[#FF6B2B] text-white px-8 py-4 rounded-full text-base font-bold hover:bg-[#e55a1a] transition-all active:scale-95 shadow-lg shadow-[#FF6B2B]/25"
              >
                Get Started
              </Link>
              <button
                onClick={() =>
                  document
                    .getElementById("how-it-works")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="inline-flex items-center justify-center border-2 border-white/30 text-white px-8 py-4 rounded-full text-base font-semibold hover:border-white/60 hover:bg-white/5 transition-all active:scale-95"
              >
                See How It Works
              </button>
            </motion.div>

            <motion.p
              variants={itemVariants}
              className="text-[13px] text-white/40 flex items-center gap-2"
            >
              <span>Trusted by developers across Dhaka</span>
              <span className="text-white/20">·</span>
              <span>100% proof-required</span>
              <span className="text-white/20">·</span>
              <span>Zero disputes</span>
            </motion.p>
          </motion.div>

          {/* Right */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex justify-center lg:justify-end"
          >
            <DashboardMockup />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
