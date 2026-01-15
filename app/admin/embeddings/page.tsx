"use client"

import { useState } from "react"
import { Loader2, Zap } from "lucide-react"

export default function EmbeddingsPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState("")
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`])
  }

  const generateEmbeddings = async () => {
    setIsGenerating(true)
    setLogs([])
    setProgress("Iniciando...")
    addLog("Iniciando generación de embeddings...")

    try {
      const response = await fetch("/api/generate-embeddings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate" }),
      })

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
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
                setProgress(`Procesando ${data.processed} / ${data.total}`)
                if (data.current) {
                  addLog(`Procesando: ${data.current}`)
                }
                if (data.lastCompleted) {
                  addLog(`✓ Completado: ${data.lastCompleted}`)
                }
              } else if (data.status === "complete") {
                setProgress("¡Completado!")
                addLog(`✓ ${data.message || "Todos los embeddings generados exitosamente"}`)
              } else if (data.status === "error") {
                setProgress("Error")
                addLog(`✗ Error: ${data.error}`)
              }
            } catch (parseError) {
              console.error("Error parseando datos:", parseError)
            }
          }
        }
      }
    } catch (error: any) {
      addLog(`✗ Error fatal: ${error.message}`)
      setProgress("Error")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Generar Embeddings</h1>
          <p className="text-slate-400">
            Procesa los knowledge_chunks sin embeddings y genera vectores usando OpenAI text-embedding-3-small
          </p>
        </div>

        {/* Control Panel */}
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-1">Estado</h2>
              <p className="text-slate-400">{progress || "Listo para iniciar"}</p>
            </div>
            <button
              onClick={generateEmbeddings}
              disabled={isGenerating}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-all font-medium flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Iniciar Generación
                </>
              )}
            </button>
          </div>
        </div>

        {/* Logs */}
        <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <h2 className="text-lg font-semibold">Logs</h2>
          </div>
          <div className="p-4 bg-slate-950 font-mono text-sm max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No hay logs aún. Haz clic en "Iniciar Generación"</p>
            ) : (
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className="text-slate-300">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Environment Variables Info */}
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
          <h3 className="text-lg font-semibold mb-3">Variables de Entorno Requeridas</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <code className="px-2 py-1 bg-slate-800 rounded text-slate-300">OPENAI_API_KEY</code>
              <span className="text-slate-400">- Clave API de OpenAI</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="px-2 py-1 bg-slate-800 rounded text-slate-300">NEXT_PUBLIC_SUPABASE_URL</code>
              <span className="text-slate-400">- URL de Supabase (ya configurada)</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="px-2 py-1 bg-slate-800 rounded text-slate-300">SUPABASE_SERVICE_ROLE_KEY</code>
              <span className="text-slate-400">- Service role key de Supabase</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
