"use client"

import { useRef, useState } from "react"
import { motion, AnimatePresence, useInView } from "framer-motion"
import { ChevronDown } from "lucide-react"

const FAQS = [
  {
    question: "What is Truzo?",
    answer:
      "Truzo is a construction governance and transparency platform for shared apartment projects in Bangladesh. It replaces Excel and WhatsApp with a single platform where every expense has proof, every payment has a receipt, and every shareholder is informed in real time.",
  },
  {
    question: "Who is Truzo for?",
    answer:
      "Truzo is built for two groups — real estate developers and construction companies who manage joint shareholder projects, and the shareholders themselves who want visibility into their investment. Committee members get approval powers, and finance staff can record expenses.",
  },
  {
    question: "How does the expense approval work?",
    answer:
      "Every expense goes through a governance workflow: Draft → Submitted → Committee Review → Approved → Published. Expenses are only visible to shareholders after they have been approved by the committee and published by the project admin. Every step is logged with timestamps.",
  },
  {
    question: "Can shareholders see each other's payment data?",
    answer:
      "No. Truzo enforces strict privacy at the database level. Every shareholder can only see their own payment history, dues, receipts, and statements. No shareholder can ever access another shareholder's financial data.",
  },
  {
    question: "What happens if a payment is late?",
    answer:
      "The project admin configures penalty rules — fixed amount, percentage of due, or daily percentage — with a grace period. After the grace period, penalties are automatically calculated. Project admins can waive penalties with a mandatory reason that is permanently logged.",
  },
  {
    question: "Do I need to install anything?",
    answer:
      "No. Truzo is a web platform accessible from any device — desktop, tablet, or mobile — at truzo.app. No app download required. Shareholders can log in from their phone browser.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes. Truzo uses Supabase (enterprise-grade PostgreSQL) with Row Level Security — meaning every user can only access data they are authorized to see. Files are stored securely with private access policies. All data is backed up daily.",
  },
  {
    question: "How much does Truzo cost?",
    answer:
      "Truzo is currently in pilot phase. Pricing is project-based — you pay per active project, not per user. Detailed pricing is coming soon. Contact us at 01676524172 to discuss your project.",
  },
  {
    question: "Is Truzo available outside Bangladesh?",
    answer:
      "Truzo is built for Bangladesh first, with the Bengali market's specific construction model in mind. Expansion to other South Asian markets is planned for Phase 2.",
  },
  {
    question: "How do I get started?",
    answer:
      'Click "Log In" in the top navigation to create your account or sign in. You can contact us directly at 01676524172 for a guided onboarding session.',
  },
]

function AccordionItem({
  faq,
  isOpen,
  onToggle,
  index,
}: {
  faq: (typeof FAQS)[0]
  isOpen: boolean
  onToggle: () => void
  index: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-20px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: Math.min(index * 0.05, 0.4), duration: 0.4 }}
      className="border-b border-[#E5E8F0] last:border-0"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 py-5 text-left group"
        aria-expanded={isOpen}
      >
        <span
          className={`text-[16px] font-semibold transition-colors ${
            isOpen ? "text-[#1B4FFF]" : "text-[#111827] group-hover:text-[#1B4FFF]"
          }`}
        >
          {faq.question}
        </span>
        <ChevronDown
          className={`w-5 h-5 shrink-0 transition-all duration-300 ${
            isOpen ? "rotate-180 text-[#1B4FFF]" : "text-[#9CA3AF] group-hover:text-[#1B4FFF]"
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="text-[15px] text-[#6B7280] leading-relaxed pb-5 pr-8">
              {faq.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState(0)
  const headRef = useRef<HTMLDivElement>(null)
  const headInView = useInView(headRef, { once: true, margin: "-80px" })

  return (
    <section id="faq" className="bg-white py-24 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div
          ref={headRef}
          initial={{ opacity: 0, y: 24 }}
          animate={headInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          className="text-center mb-14"
        >
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#1B4FFF] mb-3">
            FAQ
          </p>
          <h2 className="text-[32px] lg:text-[40px] font-bold text-[#111827] mb-4">
            Frequently asked questions
          </h2>
          <p className="text-[18px] text-[#6B7280]">
            Everything you need to know about Truzo
          </p>
        </motion.div>

        <div className="bg-white rounded-2xl border border-[#E5E8F0] px-6 lg:px-8">
          {FAQS.map((faq, i) => (
            <AccordionItem
              key={faq.question}
              faq={faq}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
              index={i}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
