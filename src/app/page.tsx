import { Nav } from "@/components/marketing/Nav"
import { Hero } from "@/components/marketing/Hero"
import { Problem } from "@/components/marketing/Problem"
import { HowItWorks } from "@/components/marketing/HowItWorks"
import { Features } from "@/components/marketing/Features"
import { ForShareholders } from "@/components/marketing/ForShareholders"
import { Testimonial } from "@/components/marketing/Testimonial"
import { Pricing } from "@/components/marketing/Pricing"
import { FAQ } from "@/components/marketing/FAQ"
import { CTABanner } from "@/components/marketing/CTABanner"
import { Footer } from "@/components/marketing/Footer"

export const metadata = {
  title: "Truzo — Trust. Transparent. Built.",
  description:
    "The governance layer for shared construction projects in Bangladesh. Proof-first expenses, committee approvals, shareholder transparency.",
}

export default function LandingPage() {
  return (
    <div className="font-sans">
      <Nav />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <Features />
        <ForShareholders />
        <Testimonial />
        <Pricing />
        <FAQ />
        <CTABanner />
      </main>
      <Footer />
    </div>
  )
}
