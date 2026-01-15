import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  try {
    const { message, examLevel, language } = await req.json()

    console.log("[v0] Chat API: Received request", { message, examLevel, language })

    // Validate API key
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey || apiKey === "your_anthropic_api_key_here" || !apiKey.startsWith("sk-ant-")) {
      console.error("[v0] Chat API: Invalid ANTHROPIC_API_KEY")
      return Response.json(
        { error: "ANTHROPIC_API_KEY not properly configured. Please add your API key in the Vars section." },
        { status: 500 },
      )
    }

    // Initialize Supabase for RAG
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[v0] Chat API: Supabase not configured")
      return Response.json(
        { error: "Supabase not properly configured. Please check your environment variables." },
        { status: 500 },
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Initialize OpenAI for generating embedding of user's message
    const openaiKey = process.env.OPENAI_API_KEY
    let relevantContext = ""

    if (openaiKey && openaiKey !== "your_openai_api_key_here") {
      try {
        console.log("[v0] Chat API: Generating embedding for user message...")

        // Generate embedding for user's message
        const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: "text-embedding-3-small",
            input: message,
          }),
        })

        if (!embeddingResponse.ok) {
          throw new Error("Failed to generate embedding")
        }

        const embeddingData = await embeddingResponse.json()
        const queryEmbedding = embeddingData.data[0].embedding

        console.log("[v0] Chat API: Searching knowledge base with embedding...")

        // Search knowledge_chunks using vector similarity
        const { data: similarChunks, error: searchError } = await supabase.rpc("match_knowledge_chunks", {
          query_embedding: queryEmbedding,
          match_threshold: 0.7,
          match_count: 5,
          p_exam_level: examLevel?.toLowerCase() || "bcba",
        })

        if (searchError) {
          console.error("[v0] Chat API: Error searching knowledge base:", searchError)
        } else if (similarChunks && similarChunks.length > 0) {
          console.log(`[v0] Chat API: Found ${similarChunks.length} relevant knowledge chunks`)

          relevantContext = similarChunks
            .map((chunk: any) => `[${chunk.task_id}] ${chunk.task_text}\nKeywords: ${chunk.keywords}`)
            .join("\n\n")
        } else {
          console.log("[v0] Chat API: No relevant knowledge chunks found")
        }
      } catch (error) {
        console.error("[v0] Chat API: Error in RAG process:", error)
        // Continue without RAG context if it fails
      }
    } else {
      console.log("[v0] Chat API: OpenAI API key not configured, skipping RAG")
    }

    // Initialize Claude
    const anthropic = new Anthropic({
      apiKey: apiKey,
    })

    console.log("[v0] Chat API: Calling Claude API...")

    // Construct prompt with RAG context
    const systemPrompt = `You are ABA Sensei 🥋, a friendly and encouraging tutor for BCBA/RBT exam preparation. You specialize in Applied Behavior Analysis.

${relevantContext ? `RELEVANT KNOWLEDGE FROM BACB TASK LIST:\n${relevantContext}\n\n` : ""}

YOUR COMMUNICATION STYLE:
- Keep responses SHORT (2-3 paragraphs maximum)
- Be conversational and warm, not academic or formal
- Use natural language, avoid excessive bullet points or headers
- Always keep ABA technical terms in English (reinforcement, extinction, MO, SD, etc.)
- End with ONE follow-up question to guide the conversation
- NO long lists unless explicitly requested

EXAMPLES:
Good: "Great question about reinforcement! In ABA, positive reinforcement means adding something pleasant after a behavior to increase it. For example, giving a child praise after they complete their homework. What specific scenario would you like to explore?"

Bad: "## Reinforcement Overview\n**Types:**\n- Positive reinforcement\n- Negative reinforcement\n**Applications:**\n- Educational settings\n- Clinical settings..."

Language for explanations: ${language || "English"}
Exam Level: ${examLevel || "BCBA"}
Remember: Keep it brief, friendly, and conversational. Guide the user with one question at a time.`

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
    })

    console.log("[v0] Chat API: Claude response received")

    const aiMessage = response.content[0].type === "text" ? response.content[0].text : ""

    return Response.json({
      message: aiMessage,
      hasRagContext: !!relevantContext,
      sourcesCount: relevantContext ? relevantContext.split("\n\n").length : 0,
    })
  } catch (error) {
    console.error("[v0] Chat API: Error:", error)
    return Response.json(
      {
        error: "Failed to generate response",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
