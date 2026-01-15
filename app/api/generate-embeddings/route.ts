import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export const maxDuration = 300 // 5 minutes timeout for long-running process
export const dynamic = "force-dynamic"

interface EmbeddingProgress {
  total: number
  processed: number
  current: string | null
  status: "processing" | "complete" | "error"
  error?: string
}

export async function POST(request: Request) {
  try {
    const { action } = await request.json()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Supabase credentials not configured" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (action === "count") {
      // Count rows without embeddings
      const { count, error } = await supabase
        .from("knowledge_chunks")
        .select("*", { count: "exact", head: true })
        .is("embedding", null)

      if (error) {
        console.error("[v0] Error counting chunks:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ count: count || 0 })
    }

    if (action === "generate") {
      // Stream progress updates
      const encoder = new TextEncoder()

      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Fetch all chunks without embeddings
            const { data: chunks, error: fetchError } = await supabase
              .from("knowledge_chunks")
              .select("id, task_text, task_id, domain")
              .is("embedding", null)

            if (fetchError) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: fetchError.message })}\n\n`))
              controller.close()
              return
            }

            if (!chunks || chunks.length === 0) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ status: "complete", message: "No chunks to process" })}\n\n`),
              )
              controller.close()
              return
            }

            const total = chunks.length
            let processed = 0

            // Process each chunk
            for (const chunk of chunks) {
              try {
                // Send progress update
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      status: "processing",
                      total,
                      processed,
                      current: `${chunk.task_id}: ${chunk.task_text.substring(0, 50)}...`,
                    })}\n\n`,
                  ),
                )

                // Generate embedding using OpenAI
                const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    input: chunk.task_text,
                    model: "text-embedding-3-small",
                  }),
                })

                if (!embeddingResponse.ok) {
                  const errorText = await embeddingResponse.text()
                  throw new Error(`OpenAI API error: ${errorText}`)
                }

                const embeddingData = await embeddingResponse.json()
                const embedding = embeddingData.data[0].embedding

                // Save embedding to Supabase
                const { error: updateError } = await supabase
                  .from("knowledge_chunks")
                  .update({ embedding })
                  .eq("id", chunk.id)

                if (updateError) {
                  throw new Error(`Supabase update error: ${updateError.message}`)
                }

                processed++

                // Send success update
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      status: "processing",
                      total,
                      processed,
                      current: null,
                      lastCompleted: chunk.task_id,
                    })}\n\n`,
                  ),
                )

                // Add small delay to avoid rate limiting
                await new Promise((resolve) => setTimeout(resolve, 100))
              } catch (chunkError: any) {
                console.error("[v0] Error processing chunk:", chunk.id, chunkError)
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      status: "error",
                      error: `Error on ${chunk.task_id}: ${chunkError.message}`,
                      total,
                      processed,
                    })}\n\n`,
                  ),
                )
              }
            }

            // Send completion
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  status: "complete",
                  total,
                  processed,
                  message: `Successfully processed ${processed} out of ${total} chunks`,
                })}\n\n`,
              ),
            )
            controller.close()
          } catch (error: any) {
            console.error("[v0] Fatal error in embedding generation:", error)
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  status: "error",
                  error: error.message,
                })}\n\n`,
              ),
            )
            controller.close()
          }
        },
      })

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: any) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
