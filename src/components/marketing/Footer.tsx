"use client"

import Link from "next/link"
import { Phone, Globe } from "lucide-react"

const PRODUCT_LINKS = ["Features", "How it Works", "Pricing", "Changelog"]
const COMPANY_LINKS = ["About", "Blog", "Contact", "Careers"]
const LEGAL_LINKS = ["Privacy Policy", "Terms of Service"]

export function Footer() {
  return (
    <footer className="bg-[#1A1A2E] border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 lg:gap-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="text-[22px] font-bold text-[#1B4FFF] mb-3">Truzo</div>
            <p className="text-[#9CA3AF] text-sm leading-relaxed mb-4">
              Trust. Transparent. Built.
            </p>
            <div className="space-y-2">
              <a
                href="https://truzo.app"
                className="flex items-center gap-2 text-[#9CA3AF] hover:text-white text-sm transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                truzo.app
              </a>
              <a
                href="tel:01676524172"
                className="flex items-center gap-2 text-[#9CA3AF] hover:text-white text-sm transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                01676524172
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <p className="text-white font-semibold text-sm mb-4">Product</p>
            <ul className="space-y-3">
              {PRODUCT_LINKS.map((link) => (
                <li key={link}>
                  <a
                    href={link === "Pricing" ? "/pricing" : "#"}
                    className="text-[#9CA3AF] hover:text-white text-sm transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="text-white font-semibold text-sm mb-4">Company</p>
            <ul className="space-y-3">
              {COMPANY_LINKS.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-[#9CA3AF] hover:text-white text-sm transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-white font-semibold text-sm mb-4">Legal</p>
            <ul className="space-y-3">
              {LEGAL_LINKS.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-[#9CA3AF] hover:text-white text-sm transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[#6B7280] text-sm">
            © 2025 Truzo. Built for Bangladesh.
          </p>
          <a
            href="https://truzo.app"
            className="text-[#6B7280] hover:text-[#9CA3AF] text-sm transition-colors"
          >
            truzo.app
          </a>
        </div>
      </div>
    </footer>
  )
}
