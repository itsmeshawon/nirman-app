"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { 
  FileText, 
  Download, 
  Plus, 
  Trash2, 
  Search, 
  File as FileIcon,
  Loader2
} from "lucide-react"
import { format } from "date-fns"
import { DOCUMENT_CATEGORIES } from "@/lib/validations"
import { createClient } from "@/lib/supabase/client"

interface Document {
  id: string
  name: string
  category: string
  file_path: string
  file_type: string
  file_size?: number
  uploaded_at: string
}

interface DocumentsClientProps {
  projectId: string
  initialDocuments: Document[]
}

export function DocumentsClient({ projectId, initialDocuments }: DocumentsClientProps) {
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>(initialDocuments)
  const [searchQuery, setSearchQuery] = useState("")
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  
  // Upload form state
  const [uploadName, setUploadName] = useState("")
  const [uploadCategory, setUploadCategory] = useState<string>("")
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  const supabase = createClient()

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadFile || !uploadName || !uploadCategory) {
      toast.error("Please fill in all fields")
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", uploadFile)
    formData.append("name", uploadName)
    formData.append("category", uploadCategory)

    try {
      const res = await fetch(`/api/projects/${projectId}/documents`, {
        method: "POST",
        body: formData
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")

      setDocuments([data.document, ...documents])
      toast.success("Document uploaded successfully")
      setIsUploadOpen(false)
      // Reset form
      setUploadName("")
      setUploadCategory("")
      setUploadFile(null)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return

    try {
      const res = await fetch(`/api/projects/${projectId}/documents/${docId}`, {
        method: "DELETE"
      })
      if (!res.ok) throw new Error("Failed to delete document")

      setDocuments(documents.filter(d => d.id !== docId))
      toast.success("Document deleted")
    } catch (err: any) {
      toast.error(err.message)
    }
  }

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

  const filteredDocs = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Document Library</h1>
          <p className="text-on-surface-variant text-sm">Manage construction drawings, land papers, and legal documents.</p>
        </div>

        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary hover:bg-primary text-white text-sm font-medium cursor-pointer">
              <Plus className="w-4 h-4" />
              Upload Document
            </span>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>
                Add a new document to the project library.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Document Name</Label>
                <Input 
                  id="name" 
                  placeholder="e.g. Ground Floor Plan" 
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={uploadCategory} onValueChange={(v) => setUploadCategory(v ?? "")} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">File</Label>
                <Input 
                  id="file" 
                  type="file" 
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  required 
                  className="cursor-pointer"
                />
              </div>
              <div className="flex justify-end pt-4">
                <Button 
                  type="submit" 
                  className="bg-primary hover:bg-primary w-full"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : "Upload"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2 rounded-lg border px-3 py-2">
        <Search className="w-4 h-4 text-outline" />
        <input 
          type="text" 
          placeholder="Search by name or category..." 
          className="flex-1 text-sm outline-none"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-variant/20/50">
              <TableHead>No.</TableHead>
              <TableHead>Document Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Upload Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDocs.length > 0 ? (
              filteredDocs.map((doc, idx) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium text-on-surface-variant">{idx + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <FileIcon className="w-4 h-4 mr-2 text-primary" />
                      <span className="font-medium text-on-surface">{doc.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-primary-container/20 text-primary border-primary-container/40">
                      {doc.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-on-surface-variant">
                    {format(new Date(doc.uploaded_at), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="text-on-surface-variant uppercase text-xs">
                    {doc.file_type.split("/").pop()}
                  </TableCell>
                  <TableCell className="text-on-surface-variant">
                    {doc.file_size ? formatFileSize(doc.file_size) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-primary hover:text-on-primary-container hover:bg-primary-container/20"
                        onClick={() => handleDownload(doc)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive hover:bg-error-container/20"
                        onClick={() => handleDelete(doc.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-on-surface-variant">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <FileText className="w-8 h-8 text-outline-variant" />
                    <p>No documents found.</p>
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
