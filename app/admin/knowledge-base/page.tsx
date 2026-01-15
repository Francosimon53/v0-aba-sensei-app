"use client"

import type React from "react"

import { useState } from "react"
import { FileText, Trash2, RefreshCw, CheckCircle2, AlertCircle, Loader2, Cloud } from "lucide-react"
import Link from "next/link"

interface Document {
  id: string
  fileName: string
  uploadDate: string
  status: "indexed" | "processing" | "error"
  chunks?: number
  progress?: number
}

export default function KnowledgeBasePage() {
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: "1",
      fileName: "Cooper_Chapter_1.pdf",
      uploadDate: "Oct 24, 2025",
      status: "indexed",
      chunks: 142,
    },
    {
      id: "2",
      fileName: "BACB_Ethics_Code.pdf",
      uploadDate: "Oct 23, 2025",
      status: "indexed",
      chunks: 89,
    },
  ])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const totalDocuments = documents.length
  const totalChunks = documents.reduce((sum, doc) => sum + (doc.chunks || 0), 0)
  const lastUpdated = documents.length > 0 ? documents[0].uploadDate : "Never"

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files).filter((file) => file.type === "application/pdf")
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleFileUpload = (file: File) => {
    const newDoc: Document = {
      id: Date.now().toString(),
      fileName: file.name,
      uploadDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      status: "processing",
      progress: 0,
    }

    setDocuments([newDoc, ...documents])
    setIsUploading(true)

    // Simulate upload progress
    let progress = 0
    const interval = setInterval(() => {
      progress += 10
      setDocuments((prev) => prev.map((doc) => (doc.id === newDoc.id ? { ...doc, progress } : doc)))

      if (progress >= 100) {
        clearInterval(interval)
        setTimeout(() => {
          setDocuments((prev) =>
            prev.map((doc) =>
              doc.id === newDoc.id
                ? { ...doc, status: "indexed", chunks: Math.floor(Math.random() * 100) + 50, progress: undefined }
                : doc,
            ),
          )
          setIsUploading(false)
        }, 500)
      }
    }, 300)
  }

  const handleDelete = (id: string) => {
    setDocuments(documents.filter((doc) => doc.id !== id))
  }

  const handleReindex = (id: string) => {
    setDocuments(documents.map((doc) => (doc.id === id ? { ...doc, status: "processing", progress: 0 } : doc)))

    // Simulate reindexing
    let progress = 0
    const interval = setInterval(() => {
      progress += 10
      setDocuments((prev) => prev.map((doc) => (doc.id === id ? { ...doc, progress } : doc)))

      if (progress >= 100) {
        clearInterval(interval)
        setTimeout(() => {
          setDocuments((prev) =>
            prev.map((doc) => (doc.id === id ? { ...doc, status: "indexed", progress: undefined } : doc)),
          )
        }, 500)
      }
    }, 200)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-50 mb-2">Knowledge Base Manager</h1>
              <p className="text-slate-400">Manage the documents that power the AI Tutor.</p>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
              <div className="text-slate-400 text-sm mb-1">Total Documents</div>
              <div className="text-2xl font-bold text-slate-50">{totalDocuments}</div>
            </div>
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
              <div className="text-slate-400 text-sm mb-1">Total Chunks</div>
              <div className="text-2xl font-bold text-slate-50">{totalChunks}</div>
            </div>
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
              <div className="text-slate-400 text-sm mb-1">Last Updated</div>
              <div className="text-2xl font-bold text-slate-50">{lastUpdated}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Upload Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-12 bg-slate-900/50 transition-all ${
            isDragging
              ? "border-blue-500 bg-blue-500/10"
              : "border-slate-700 hover:border-blue-500/50 hover:bg-slate-900"
          }`}
        >
          <div className="flex flex-col items-center justify-center text-center">
            <Cloud className={`w-16 h-16 mb-4 ${isDragging ? "text-blue-400" : "text-slate-600"}`} />
            <p className="text-lg text-slate-300 mb-2">Drag & drop PDF files here</p>
            <p className="text-sm text-slate-500 mb-4">or</p>
            <label className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg cursor-pointer transition-all font-medium">
              Select File
              <input type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" />
            </label>
          </div>
        </div>

        {/* Documents List */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-xl font-semibold text-slate-50">Documents</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50">
                <tr className="border-b border-slate-800">
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">File Name</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Upload Date</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Chunks</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-slate-500" />
                        <span className="text-slate-300">{doc.fileName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{doc.uploadDate}</td>
                    <td className="px-6 py-4">
                      {doc.status === "indexed" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-sm">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Indexed
                        </span>
                      )}
                      {doc.status === "processing" && (
                        <div className="space-y-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-500/10 text-yellow-400 rounded-full text-sm">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Processing
                          </span>
                          {doc.progress !== undefined && (
                            <div className="w-32 bg-slate-800 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all"
                                style={{ width: `${doc.progress}%` }}
                              />
                            </div>
                          )}
                        </div>
                      )}
                      {doc.status === "error" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-sm">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Error
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-400">{doc.chunks || "-"}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleReindex(doc.id)}
                          disabled={doc.status === "processing"}
                          className="p-2 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Re-index"
                        >
                          <RefreshCw className="w-4 h-4 text-slate-400 hover:text-blue-400" />
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          disabled={doc.status === "processing"}
                          className="p-2 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {documents.length === 0 && (
              <div className="py-12 text-center text-slate-500">
                No documents uploaded yet. Start by uploading a PDF file.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
