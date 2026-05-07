"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"

export function Testimonial() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <section className="bg-white py-24 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-white rounded-3xl border border-[#E5E8F0] shadow-xl p-10 lg:p-14"
        >
          {/* Big quote mark */}
          <div
            className="absolute top-8 left-10 text-[120px] leading-none font-black text-[#1B4FFF]/10 select-none pointer-events-none"
            aria-hidden
          >
            &ldquo;
          </div>

          <div className="relative">
            <p className="text-[19px] lg:text-[22px] font-medium text-[#111827] leading-relaxed mb-8">
              Before Truzo, we were managing 24 shareholders on WhatsApp. Disputes
              every month. Now every expense has proof, every shareholder can check
              their statement, and our committee approves everything.{" "}
              <span className="text-[#1B4FFF] font-semibold">
                Zero disputes in 3 months.
              </span>
            </p>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1B4FFF] to-[#00C2A8] flex items-center justify-center text-white font-bold text-lg shrink-0">
                KH
              </div>
              <div>
                <p className="font-bold text-[#111827]">Kamal Hossain</p>
                <p className="text-[14px] text-[#6B7280]">
                  Project Admin, Green Valley Heights — Bashundhara R/A
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
