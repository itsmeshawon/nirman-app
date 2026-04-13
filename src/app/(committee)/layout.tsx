export default function CommitteeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#0F766E]">NirmaN — Committee Review</h1>
        <a href="/profile" className="text-sm font-medium text-gray-600 hover:text-[#0F766E] transition-colors bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
          My Profile
        </a>
      </header>
      <main className="p-6">{children}</main>
    </div>
  )
}
