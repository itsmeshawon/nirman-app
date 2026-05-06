"use client"

import { createContext, useContext, useState } from "react"

type PageTitleContextValue = {
  pageTitleSuffix: string | null
  setPageTitleSuffix: (suffix: string | null) => void
}

export const PageTitleContext = createContext<PageTitleContextValue>({
  pageTitleSuffix: null,
  setPageTitleSuffix: () => {},
})

export function usePageTitle() {
  return useContext(PageTitleContext)
}

export function PageTitleProvider({ children }: { children: React.ReactNode }) {
  const [pageTitleSuffix, setPageTitleSuffix] = useState<string | null>(null)
  return (
    <PageTitleContext.Provider value={{ pageTitleSuffix, setPageTitleSuffix }}>
      {children}
    </PageTitleContext.Provider>
  )
}
