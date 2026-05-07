"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Phone, Menu, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "For Shareholders", href: "#for-shareholders" },
  { label: "FAQ", href: "#faq" },
]

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-[#E5E8F0]"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/"
              className={`text-[22px] font-bold tracking-tight transition-colors duration-300 ${
                scrolled ? "text-[#1B4FFF]" : "text-white"
              }`}
            >
              Truzo
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-[#1B4FFF] ${
                    scrolled ? "text-[#374151]" : "text-white/80 hover:text-white"
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-5">
              <a
                href="tel:01676524172"
                className={`flex items-center gap-1.5 text-sm transition-colors hover:text-[#1B4FFF] ${
                  scrolled ? "text-[#6B7280]" : "text-white/60"
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                01676524172
              </a>
              <Link
                href="/login"
                className="bg-[#1B4FFF] text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-[#0A3ACC] transition-all active:scale-95"
              >
                Log In
              </Link>
            </div>

            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-lg"
              aria-label="Open menu"
            >
              <Menu
                className={`w-6 h-6 ${scrolled ? "text-[#374151]" : "text-white"}`}
              />
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-[#1A1A2E] flex flex-col"
          >
            <div className="flex items-center justify-between px-6 h-16 border-b border-white/10">
              <span className="text-[22px] font-bold text-[#1B4FFF]">Truzo</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 text-white/60 hover:text-white"
                aria-label="Close menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex flex-col items-center justify-center flex-1 gap-8">
              {NAV_LINKS.map((link, i) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="text-2xl font-semibold text-white hover:text-[#1B4FFF] transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </motion.a>
              ))}

              <motion.a
                href="tel:01676524172"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-2 text-[#9CA3AF] mt-2"
              >
                <Phone className="w-4 h-4" />
                01676524172
              </motion.a>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="bg-[#1B4FFF] text-white px-10 py-3.5 rounded-full text-lg font-semibold hover:bg-[#0A3ACC] transition-colors"
                >
                  Log In
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
