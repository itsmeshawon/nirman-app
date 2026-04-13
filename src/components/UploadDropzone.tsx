"use client"

import React, { useCallback, useState } from "react"
import { UploadCloud, FileIcon, X, FileImage } from "lucide-react"

interface UploadDropzoneProps {
  onFilesSelected: (files: File[]) => void
  maxFiles?: number
  maxSizeMB?: number
  accept?: string
}

export function UploadDropzone({ onFilesSelected, maxFiles = 5, maxSizeMB = 10, accept = "image/*,application/pdf" }: UploadDropzoneProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    setErrorMsg("")
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files))
    }
  }, [selectedFiles])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg("")
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files))
    }
  }

  const processFiles = (newFiles: File[]) => {
    // Validate sizes and counts
    let validFiles: File[] = []
    let hasError = false
    
    for (let f of newFiles) {
       if (f.size > maxSizeMB * 1024 * 1024) {
          setErrorMsg(`File ${f.name} exceeds ${maxSizeMB}MB limit.`)
          hasError = true
          continue
       }
       if (accept.includes("image") && !f.type.startsWith("image/") && f.type !== "application/pdf") {
          setErrorMsg(`File ${f.name} is not a supported format.`)
          hasError = true
          continue
       }
       validFiles.push(f)
    }

    const totalFiles = [...selectedFiles, ...validFiles].slice(0, maxFiles)
    setSelectedFiles(totalFiles)
    onFilesSelected(totalFiles)
  }

  const removeFile = (index: number) => {
    const updated = [...selectedFiles]
    updated.splice(index, 1)
    setSelectedFiles(updated)
    onFilesSelected(updated)
  }

  return (
    <div className="w-full">
      <div 
        className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${isDragOver ? "border-indigo-500 bg-indigo-50" : "border-gray-300 bg-gray-50 hover:bg-gray-100"}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false) }}
        onDrop={handleDrop}
        onClick={() => document.getElementById("file-upload")?.click()}
      >
        <UploadCloud className="h-8 w-8 text-indigo-600 mb-2" />
        <p className="text-sm text-gray-700 font-medium mb-1">Click to upload or drag and drop</p>
        <p className="text-xs text-gray-500">JPG, PNG, PDF up to {maxSizeMB}MB (max {maxFiles})</p>
        <input 
           id="file-upload" 
           type="file" 
           multiple 
           accept={accept}
           className="hidden" 
           onChange={handleFileChange} 
        />
      </div>
      
      {errorMsg && <p className="text-sm text-red-500 mt-2">{errorMsg}</p>}

      {selectedFiles.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {selectedFiles.map((file, idx) => (
             <div key={idx} className="relative group border border-gray-200 rounded-md p-2 flex flex-col items-center justify-center bg-white">
                <button 
                  type="button" 
                  onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                  className="absolute -top-2 -right-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
                {file.type.startsWith("image/") ? (
                  <FileImage className="w-6 h-6 text-blue-500 mb-1" />
                ) : (
                  <FileIcon className="w-6 h-6 text-red-500 mb-1" />
                )}
                <span className="text-[10px] truncate max-w-[80px] text-gray-600">{file.name}</span>
             </div>
          ))}
        </div>
      )}
    </div>
  )
}
