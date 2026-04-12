export default function CommitteeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-bold text-[#0F766E]">NirmaN — Committee Review</h1>
      </header>
      <main className="p-6">{children}</main>
    </div>
  )
}
