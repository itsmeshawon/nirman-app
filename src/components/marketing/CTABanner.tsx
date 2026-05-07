"use client"

import { useRef } from "react"
import Link from "next/link"
import { motion, useInView } from "framer-motion"

export function CTABanner() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <section className="bg-[#1B4FFF] py-24 px-4">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-3xl mx-auto text-center"
      >
        <h2 className="text-3xl lg:text-[44px] font-bold text-white leading-tight mb-4">
          Your project deserves better than WhatsApp.
        </h2>
        <p className="text-[#BFCFFF] text-lg mb-10">
          Join the developers building trust with Truzo.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center bg-white text-[#1B4FFF] px-10 py-4 rounded-full text-base font-bold hover:bg-[#E8EDFF] transition-all active:scale-95 shadow-lg shadow-black/20"
        >
          Log In
        </Link>
        <p className="text-[#BFCFFF] text-sm mt-5">
          Free during pilot. No credit card required.
        </p>
      </motion.div>
    </section>
  )
}
