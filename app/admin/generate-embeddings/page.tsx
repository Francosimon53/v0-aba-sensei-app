"use client"

import { useState, useEffect } from "react"
import { PlayCircle, CheckCircle2, AlertCircle, Loader2, Zap } from "lucide-react"
import Link from "next/link"

interface LogEntry {
  timestamp: string
  type: "info" | "success" | "error"
  message: string
}

export default function GenerateEmbeddingsPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState({ total: 0, processed: 0 })
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [currentChunk, setCurrentChunk] = useState<string | null>(null)
  const [chunksWithoutEmbeddings, setChunksWithoutEmbeddings] = useState<number | null>(null)

  const addLog = (type: "info" | "success" | "error", message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs((prev) => [...prev, { timestamp, type, message }])
  }

  const fetchCount = async () => {
    try {
      const response = await fetch("/api/generate-embeddings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "count" }),
      })
      const data = await response.json()
      setChunksWithoutEmbeddings(data.count)
      addLog("info", `Found ${data.count} chunks without embeddings`)
    } catch (error: any) {
      addLog("error", `Failed to count chunks: ${error.message}`)
    }
  }

  useEffect(() => {
    fetchCount()
  }, [])

  const startGeneration = async () => {
    setIsGenerating(true)
    setLogs([])
    setProgress({ total: 0, processed: 0 })
    addLog("info", "Starting embedding generation process...")

    try {
      const response = await fetch("/api/generate-embeddings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate" }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error("No response body")
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        const lines = text.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.status === "processing") {
                setProgress({ total: data.total, processed: data.processed })
                if (data.current) {
                  setCurrentChunk(data.current)
                  addLog("info", `Processing: ${data.current}`)
                }
                if (data.lastCompleted) {
                  addLog("success", `✓ Completed: ${data.lastCompleted}`)
                }
              } else if (data.status === "complete") {
                addLog("success", data.message || "All embeddings generated successfully!")
                setCurrentChunk(null)
                await fetchCount() // Refresh count
              } else if (data.status === "error") {
                addLog("error", data.error || "An error occurred")
              }
            } catch (parseError) {
              console.error("Failed to parse SSE data:", parseError)
            }
          }
        }
      }
    } catch (error: any) {
      addLog("error", `Fatal error: ${error.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const progressPercentage = progress.total > 0 ? (progress.processed / progress.total) * 100 : 0

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-50 mb-2">Generate Embeddings</h1>
              <p className="text-slate-400">Process knowledge chunks and generate vector embeddings for AI search.</p>
            </div>
            <Link
              href="/admin/knowledge-base"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
            >
              Back to Knowledge Base
            </Link>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
              <div className="text-slate-400 text-sm mb-1">Chunks Without Embeddings</div>
              <div className="text-2xl font-bold text-slate-50">
                {chunksWithoutEmbeddings !== null ? (
                  chunksWithoutEmbeddings
                ) : (
                  <Loader2 className="w-6 h-6 animate-spin" />
                )}
              </div>
            </div>
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
              <div className="text-slate-400 text-sm mb-1">Progress</div>
              <div className="text-2xl font-bold text-slate-50">
                {progress.processed} / {progress.total}
              </div>
            </div>
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
              <div className="text-slate-400 text-sm mb-1">Status</div>
              <div className="text-2xl font-bold text-slate-50">
                {isGenerating ? (
                  <span className="text-yellow-400 flex items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Running
                  </span>
                ) : (
                  <span className="text-green-400">Idle</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Control Panel */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-50 mb-2">Embedding Generation</h2>
              <p className="text-slate-400 text-sm">
                Generate vector embeddings for knowledge chunks using OpenAI's text-embedding-3-small model.
              </p>
            </div>
            <button
              onClick={startGeneration}
              disabled={isGenerating || chunksWithoutEmbeddings === 0}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-all font-medium flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <PlayCircle className="w-5 h-5" />
                  Start Generation
                </>
              )}
            </button>
          </div>

          {/* Progress Bar */}
          {progress.total > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Progress</span>
                <span className="text-slate-300 font-medium">{progressPercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              {currentChunk && (
                <div className="text-xs text-slate-500 mt-2 truncate">Currently processing: {currentChunk}</div>
              )}
            </div>
          )}
        </div>

        {/* Logs Panel */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-50">Process Logs</h2>
            <button
              onClick={() => setLogs([])}
              className="px-3 py-1 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
            >
              Clear Logs
            </button>
          </div>

          <div className="p-6 bg-slate-950 font-mono text-sm max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-slate-500 text-center py-8">No logs yet. Click "Start Generation" to begin.</div>
            ) : (
              <div className="space-y-2">
                {logs.map((log, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                    {log.type === "success" && <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />}
                    {log.type === "error" && <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
                    {log.type === "info" && <Zap className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />}
                    <span
                      className={
                        log.type === "success"
                          ? "text-green-300"
                          : log.type === "error"
                            ? "text-red-300"
                            : "text-slate-300"
                      }
                    >
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
