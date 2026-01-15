import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

// Initialize Supabase client with service role key for RAG queries
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return null
  }

  return createClient(supabaseUrl, supabaseKey)
}

// Generate embedding for a query using OpenAI
async function generateEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text,
      }),
    })

    if (!response.ok) return null

    const data = await response.json()
    return data.data?.[0]?.embedding || null
  } catch (error) {
    console.error("[v0] Error generating embedding:", error)
    return null
  }
}

// Search knowledge_chunks using vector similarity
async function searchKnowledge(query: string, examLevel = "bcba"): Promise<string> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    console.log("[v0] Supabase not configured, skipping RAG")
    return ""
  }

  // Generate embedding for the query
  const embedding = await generateEmbedding(query)

  if (!embedding) {
    console.log("[v0] Could not generate embedding, falling back to keyword search")
    // Fallback: keyword-based search
    const { data, error } = await supabase
      .from("knowledge_chunks")
      .select("task_id, task_text, keywords, domain")
      .eq("exam_level", examLevel)
      .limit(5)

    if (error || !data || data.length === 0) return ""

    return data.map((chunk) => `[${chunk.task_id}] ${chunk.task_text}`).join("\n\n")
  }

  // Use RPC function for vector similarity search
  const { data, error } = await supabase.rpc("match_knowledge_chunks", {
    query_embedding: embedding,
    match_threshold: 0.5,
    match_count: 5,
    p_exam_level: examLevel,
  })

  if (error) {
    console.log("[v0] Vector search failed, trying direct query:", error.message)
    // Fallback to direct query
    const { data: fallbackData } = await supabase
      .from("knowledge_chunks")
      .select("task_id, task_text, keywords, domain")
      .eq("exam_level", examLevel)
      .limit(5)

    if (!fallbackData || fallbackData.length === 0) return ""

    return fallbackData.map((chunk) => `[${chunk.task_id}] ${chunk.task_text}`).join("\n\n")
  }

  if (!data || data.length === 0) return ""

  console.log(`[v0] RAG found ${data.length} relevant chunks`)

  return data.map((chunk: any) => `[${chunk.task_id}] ${chunk.task_text}`).join("\n\n")
}

interface ChatRequest {
  message: string
  action: "chat" | "practice" | "flashcards" | "studyguide" | "explain"
  topic?: string
  examLevel?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json()
    const { message, action, topic, examLevel = "bcba" } = body

    const apiKey = process.env.ANTHROPIC_API_KEY

    if (!apiKey || apiKey === "your_anthropic_api_key_here" || apiKey.length < 20) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 500 })
    }

    // Get RAG context based on the query
    const ragQuery = topic || message || "BCBA exam concepts"
    const ragContext = await searchKnowledge(ragQuery, examLevel)

    let systemPrompt = ""
    let userPrompt = ""

    // Build prompts based on action type
    switch (action) {
      case "practice":
        systemPrompt = `You are an expert BCBA exam prep AI. You create realistic, application-based practice questions.

${
  ragContext
    ? `KNOWLEDGE BASE CONTEXT (use this to create accurate questions):
${ragContext}

`
    : ""
}IMPORTANT RULES:
- Create questions that test APPLICATION, not just recall
- Use realistic clinical scenarios
- Keep responses BRIEF and conversational
- Respond in the same language as the user's message`

        userPrompt = `Create ONE practice question about: ${topic || "BCBA exam concepts"}

Respond with ONLY valid JSON:
{
  "question": "Clinical scenario ending with a question (3-4 sentences max)",
  "difficulty": "Medium",
  "options": [
    {"id": "A", "text": "Option text", "isCorrect": true, "rationale": "Brief explanation"},
    {"id": "B", "text": "Option text", "isCorrect": false, "rationale": "Brief explanation"},
    {"id": "C", "text": "Option text", "isCorrect": false, "rationale": "Brief explanation"},
    {"id": "D", "text": "Option text", "isCorrect": false, "rationale": "Brief explanation"}
  ]
}`
        break

      case "flashcards":
        systemPrompt = `You are an expert BCBA tutor. Create concise flashcards for studying.

${
  ragContext
    ? `KNOWLEDGE BASE CONTEXT:
${ragContext}

`
    : ""
}RULES:
- Create 5 flashcards maximum
- Front: Clear question or term
- Back: Concise answer (1-2 sentences)
- Respond in the same language as the user`

        userPrompt = `Create flashcards about: ${topic || message}

Respond with ONLY valid JSON:
{
  "flashcards": [
    {"front": "Question or term", "back": "Concise answer"},
    {"front": "Question or term", "back": "Concise answer"}
  ]
}`
        break

      case "studyguide":
        systemPrompt = `You are an expert BCBA tutor. Create brief, focused study guides.

${
  ragContext
    ? `KNOWLEDGE BASE CONTEXT:
${ragContext}

`
    : ""
}RULES:
- Keep it SHORT (3-4 key points max)
- Use simple language
- Include practical examples
- Respond in the same language as the user`

        userPrompt = `Create a brief study guide about: ${topic || message}

Format:
**Topic Name**

1. Key Point 1 (1-2 sentences)
2. Key Point 2 (1-2 sentences)
3. Key Point 3 (1-2 sentences)

💡 Quick Tip: One practical application tip`
        break

      case "explain":
        systemPrompt = `You are a friendly BCBA tutor. Explain concepts simply and briefly.

${
  ragContext
    ? `KNOWLEDGE BASE CONTEXT:
${ragContext}

`
    : ""
}RULES:
- Maximum 2-3 short paragraphs
- Use simple language and examples
- End with ONE follow-up question to guide learning
- Respond in the same language as the user
- NO bullet point lists or headers`

        userPrompt = `Explain this topic briefly: ${topic || message}`
        break

      default: // chat
        systemPrompt = `You are ABA Sensei, a friendly BCBA exam tutor. 

${
  ragContext
    ? `KNOWLEDGE BASE CONTEXT (use to provide accurate answers):
${ragContext}

`
    : ""
}RULES:
- Keep responses SHORT (2-3 sentences max)
- Be conversational, not academic
- End with ONE follow-up question
- NO lists, NO headers, NO bullet points
- Respond in the same language as the user`

        userPrompt = message
    }

    // Call Claude API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        temperature: action === "practice" ? 0.8 : 0.7,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Claude API error:", errorText)
      return NextResponse.json({ error: `AI API error: ${response.status}` }, { status: response.status })
    }

    const data = await response.json()
    const content = data.content?.[0]?.text

    if (!content) {
      return NextResponse.json({ error: "AI returned empty response" }, { status: 500 })
    }

    // Parse response based on action type
    if (action === "practice") {
      try {
        let jsonString = content
        const codeBlockMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
        if (codeBlockMatch) {
          jsonString = codeBlockMatch[1].trim()
        } else {
          const jsonMatch = content.match(/\{[\s\S]*\}/)
          if (jsonMatch) jsonString = jsonMatch[0].trim()
        }

        const quizData = JSON.parse(jsonString)
        return NextResponse.json({ type: "quiz", ...quizData, usedRAG: !!ragContext })
      } catch (e) {
        console.error("[v0] Failed to parse quiz response:", e)
        return NextResponse.json({ error: "Failed to parse quiz" }, { status: 500 })
      }
    }

    if (action === "flashcards") {
      try {
        let jsonString = content
        const codeBlockMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
        if (codeBlockMatch) {
          jsonString = codeBlockMatch[1].trim()
        } else {
          const jsonMatch = content.match(/\{[\s\S]*\}/)
          if (jsonMatch) jsonString = jsonMatch[0].trim()
        }

        const flashcardsData = JSON.parse(jsonString)
        return NextResponse.json({ type: "flashcards", ...flashcardsData, usedRAG: !!ragContext })
      } catch (e) {
        return NextResponse.json({ type: "text", content, usedRAG: !!ragContext })
      }
    }

    // For chat, explain, studyguide - return text
    return NextResponse.json({ type: "text", content, usedRAG: !!ragContext })
  } catch (error) {
    console.error("[v0] Chat API error:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
