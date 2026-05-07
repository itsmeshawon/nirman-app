import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata = { title: "Pricing" }

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#1A1A2E] flex flex-col items-center justify-center text-center px-4">
      <div className="max-w-lg">
        <div className="inline-flex items-center gap-2 bg-[#1B4FFF]/15 text-[#6B9FFF] text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-full mb-8">
          Coming Soon
        </div>
        <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
          Simple, project-based pricing
        </h1>
        <p className="text-[#9CA3AF] text-lg mb-10">
          Pay per project. No per-user fees. No surprises. Detailed pricing is launching soon.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="tel:01676524172"
            className="bg-[#1B4FFF] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#0A3ACC] transition-colors"
          >
            Contact Us — 01676524172
          </a>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 text-[#9CA3AF] hover:text-white transition-colors px-8 py-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
