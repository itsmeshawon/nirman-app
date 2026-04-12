"use client"

import { useState } from "react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  FileText, 
  Download, 
  Search, 
  File as FileIcon,
  Filter
} from "lucide-react"
import { format } from "date-fns"
import { DOCUMENT_CATEGORIES } from "@/lib/validations"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface Document {
  id: string
  name: string
  category: string
  file_path: string
  file_type: string
  file_size?: number
  uploaded_at: string
}

interface ShareholderDocsClientProps {
  documents: Document[]
}

export function ShareholderDocsClient({ documents }: ShareholderDocsClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const supabase = createClient()

  const handleDownload = async (doc: Document) => {
    const { data: urlData } = await supabase.storage
      .from("project-documents")
      .getPublicUrl(doc.file_path)

    if (urlData?.publicUrl) {
      window.open(urlData.publicUrl, "_blank")
    } else {
      toast.error("Failed to generate download link")
    }
  }

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || doc.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gray-900 font-outfit">Project Documents</h1>
        <p className="text-gray-500 text-sm">Access important files, drawings, and legal papers for your project.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex items-center space-x-2 bg-white rounded-xl border px-3 py-2 shadow-sm">
          <Search className="w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search documents..." 
            className="flex-1 text-sm outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="w-full md:w-64">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="rounded-xl shadow-sm border-gray-200">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <SelectValue placeholder="All Categories" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {DOCUMENT_CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-md overflow-hidden transition-all duration-300">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
              <TableHead className="w-12 pl-6">No.</TableHead>
              <TableHead>Document</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead className="text-right pr-6">Download</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDocs.length > 0 ? (
              filteredDocs.map((doc, idx) => (
                <TableRow key={doc.id} className="group hover:bg-teal-50/30 transition-colors">
                  <TableCell className="pl-6 text-gray-400 font-medium">{idx + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="p-2 rounded-lg bg-teal-50 text-teal-600 mr-3 group-hover:bg-teal-100 transition-colors">
                        <FileIcon className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900 text-sm md:text-base">{doc.name}</span>
                        <span className="text-[10px] text-gray-400 uppercase md:hidden tracking-wider">
                          {format(new Date(doc.uploaded_at), "dd MMM yyyy")}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium rounded-lg px-2.5">
                      {doc.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-gray-500 font-medium">
                    {format(new Date(doc.uploaded_at), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => handleDownload(doc)}
                      className="text-teal-600 hover:bg-teal-100 hover:text-teal-700 rounded-xl"
                    >
                      <Download className="w-5 h-5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="p-4 rounded-full bg-gray-50">
                      <FileText className="w-10 h-10 text-gray-300" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-gray-900">No documents found</p>
                      <p className="text-sm">Try adjusting your search or category filter.</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
