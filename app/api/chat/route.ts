import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { generateText } from "ai"


export const runtime = "nodejs"

// BCBA exam topics for variety in question generation
const BCBA_TOPICS = [
  "reinforcement schedules (FR, VR, FI, VI)",
  "punishment procedures and ethical considerations",
  "stimulus control and discrimination training",
  "motivating operations (EO and AO)",
  "functional behavior assessment (FBA)",
  "verbal behavior (mand, tact, echoic, intraverbal)",
  "generalization and maintenance",
  "single-subject experimental designs (reversal, multiple baseline)",
  "differential reinforcement (DRA, DRI, DRO, DRL)",
  "extinction and extinction bursts",
  "prompting and prompt fading",
  "shaping and chaining (forward, backward, total task)",
  "token economies",
  "behavioral measurement (frequency, duration, latency, IRT)",
  "interobserver agreement (IOA)",
  "ethics and professional conduct",
  "supervision requirements",
  "preference assessments",
  "skill acquisition programs",
  "behavior reduction procedures"
]

const RBT_TOPICS = [
  "data collection methods",
  "discrete trial training (DTT)",
  "natural environment training (NET)",
  "prompting hierarchies",
  "reinforcement delivery",
  "professional boundaries",
  "documentation requirements",
  "crisis intervention basics",
  "following behavior plans",
  "communicating with supervisors"
]

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
  const openaiApiKey = process.env.OPENAI_API_KEY
  if (!openaiApiKey) return null

  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
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

function getHighlightWords(questionText: string): string[] {
  const highlightPatterns = [
    // Contrast words
    "However",
    "Although",
    "But",
    "Despite",
    "Instead",
    // Timing words
    "Initially",
    "Subsequently",
    "Prior to",
    "After",
    "Before",
    "First",
    "Then",
    "Finally",
    // Trap words
    "FIRST",
    "BEST",
    "MOST",
    "ALWAYS",
    "NEVER",
    "ONLY",
    "PRIMARY",
    "PRIMARILY",
    "NEXT",
  ]

  const found: string[] = []
  highlightPatterns.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "gi")
    if (regex.test(questionText)) {
      found.push(word)
    }
  })
  return found
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json()
    const { message, action, topic, examLevel = "bcba" } = body

    // Vercel AI Gateway handles API keys automatically for supported providers

    // Get RAG context based on the query
    const ragQuery = topic || message || (examLevel === "rbt" ? "RBT exam concepts" : "BCBA exam concepts")
    const ragContext = await searchKnowledge(ragQuery, examLevel)

    const examLevelContext =
      examLevel === "rbt"
        ? `You are preparing questions for the RBT (Registered Behavior Technician) exam.
RBT is a paraprofessional certification focused on IMPLEMENTATION of behavior plans.
RBT questions should focus on:
- Following written behavior plans
- Data collection during sessions
- Recognizing when to ask supervisor for help
- Professional conduct and scope of practice
- Direct implementation skills (DTT, prompting, reinforcement delivery)
Questions should be practical and implementation-focused, NOT analytical or design-based.
Use simpler vocabulary appropriate for paraprofessional level.`
        : `You are preparing questions for the BCBA (Board Certified Behavior Analyst) exam.
BCBA is a graduate-level certification focused on DESIGNING and ANALYZING behavior programs.
BCBA questions should focus on:
- Assessment and analysis
- Treatment design and modification
- Supervision and ethics
- Research and experimental design
- Clinical decision-making
Questions should require critical thinking and application of principles.`

    let systemPrompt = ""
    let userPrompt = ""

    // Select random topic for practice questions
    const topics = examLevel === "rbt" ? RBT_TOPICS : BCBA_TOPICS
    const randomTopic = topics[Math.floor(Math.random() * topics.length)]

    // Build prompts based on action type
    switch (action) {
      case "practice":
        systemPrompt = `You are "ABA Sensei" 🥋, an expert AI tutor for ${examLevel.toUpperCase()} exam preparation.

═══════════════════════════════════════════════════════
📐 GOLDEN FORMATTING RULES
═══════════════════════════════════════════════════════
1. No Walls of Text: Keep rationales to 2-3 sentences MAX
2. Visual Hierarchy: Use **bold** for key terms
3. Tone: Professional, empathetic, motivating, direct

═══════════════════════════════════════════════════════
🧠 TEACHING ALGORITHM (Use for rationales)
═══════════════════════════════════════════════════════
For EACH option rationale, follow this structure:
1. Direct Answer: Why this IS or ISN'T correct (1 sentence)
2. Quick Analogy: Real-world comparison that makes it "click" (1 sentence)
3. Exam Tip: How to identify this on test day (1 sentence)

${examLevelContext}

${ragContext ? `KNOWLEDGE BASE CONTEXT:\n${ragContext}\n` : ""}

═══════════════════════════════════════════════════════
🚨 TRAP DETECTOR (Analyze each question you create)
═══════════════════════════════════════════════════════

TERMINOLOGY TRAPS - ABA words with different everyday meanings:
- "Negative" = REMOVAL (not "bad") - like subtracting in math
- "Consequence" = ANY event after behavior (not punishment)
- "Punishment" = Behavior DECREASES (can be pleasant removal)
- "Reinforcement" = Behavior INCREASES (can be unpleasant removal)
- "Discrimination" = Distinguishing stimuli (not social prejudice)
- "Extinction" = Withholding reinforcement (not disappearing)

CONCEPTUAL TRAPS - Similar concepts students confuse:
- MO vs SD: MO changes VALUE, SD signals AVAILABILITY
- DRA/DRI/DRO/DRL: Alt behavior, Incompatible, Other, Low rate
- Validity vs Reliability: Accuracy vs Consistency

STRUCTURE TRAPS - Question phrasing tricks:
- FIRST/NEXT/BEFORE = Sequence matters
- BEST/MOST/PRIMARY = Multiple correct, pick optimal
- ALWAYS/NEVER = Usually incorrect (too absolute)

═══════════════════════════════════════════════════════
📝 RESPONSE RULES
═══════════════════════════════════════════════════════
- Create questions that test APPLICATION, not just recall
- Use realistic clinical scenarios (3-4 sentences max)
- Match difficulty to ${examLevel.toUpperCase()} level
- Respond in the SAME LANGUAGE as the user
- Include ONE intuitive analogy in the correct answer's rationale
- Keep trapAnalysis brief: 1-2 lines only if genuinely tricky`

        userPrompt = `CRITICAL LANGUAGE RULE:
- Question text: ALWAYS IN ENGLISH (real exam simulation)
- Option texts: ALWAYS IN ENGLISH (real exam simulation)  
- Rationales and explanations: Match user's language for better understanding
- trapAnalysis and quickTip: Match user's language

This simulates the real exam experience where questions are in English.

═══════════════════════════════════════════════════════
🎯 MANDATORY TOPIC FOR THIS QUESTION: ${randomTopic}
═══════════════════════════════════════════════════════

Create ONE unique ${examLevel.toUpperCase()} practice question specifically about: ${randomTopic}

⛔ DO NOT create a question about "dimensions of ABA" or "7 dimensions"
⛔ DO NOT ask "which dimension is demonstrated"
⛔ DO NOT create generic questions
✅ Focus ONLY on: ${randomTopic}

VARY THE QUESTION FORMAT - choose ONE:
1. Clinical scenario: "What should the ${examLevel.toUpperCase()} do FIRST?"
2. Definition-based: "Which term BEST describes...?"
3. Ethical dilemma: "What is the MOST appropriate action?"
4. Data interpretation: "Based on this data, what conclusion...?"
5. Procedure identification: "This technique is an example of...?"
6. Comparison: "What is the PRIMARY difference between X and Y?"

${topic ? `Additional topic context: ${topic}` : ""}

The CORRECT answer's rationale MUST include:
1. Why it's correct (1 sentence)
2. An intuitive analogy starting with "Think of it like..." (1 sentence)  
3. A quick exam tip (1 sentence)

Respond with ONLY valid JSON:
{
  "question": "Clinical scenario ending with a question (3-4 sentences max)",
  "difficulty": "Medium",
  "options": [
    {"id": "A", "text": "Option text", "isCorrect": true, "rationale": "Why correct. Think of it like [analogy]. Exam tip: [tip]"},
    {"id": "B", "text": "Option text", "isCorrect": false, "rationale": "Why wrong in 1-2 sentences"},
    {"id": "C", "text": "Option text", "isCorrect": false, "rationale": "Why wrong in 1-2 sentences"},
    {"id": "D", "text": "Option text", "isCorrect": false, "rationale": "Why wrong in 1-2 sentences"}
  ],
  "trapAnalysis": {
    "hasTrap": true or false,
    "trapType": "terminology" | "conceptual" | "structure" | null,
    "trapWord": "The specific tricky word/concept" or null,
    "trapExplanation": "1 line: what it REALLY means in ABA" or null,
    "quickTip": "1-line memory trick for the exam",
    "commonConfusion": "What students often mix this up with" or null
  }
}`
        break

      case "flashcards":
        systemPrompt = `You are an expert ${examLevel.toUpperCase()} tutor. Create concise flashcards for studying.

${examLevelContext}

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
- Match content to ${examLevel.toUpperCase()} level
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
        systemPrompt = `You are an expert ${examLevel.toUpperCase()} tutor. Create brief, focused study guides.

${examLevelContext}

${
  ragContext
    ? `KNOWLEDGE BASE CONTEXT:
${ragContext}

`
    : ""
}RULES:
- Keep it SHORT (3-4 key points max)
- Use simple language appropriate for ${examLevel.toUpperCase()} level
- Include practical examples
- Respond in the same language as the user`

        userPrompt = `Create a brief study guide about: ${topic || message}

Format:
**Topic Name**

1. Key Point 1 (1-2 sentences)
2. Key Point 2 (1-2 sentences)
3. Key Point 3 (1-2 sentences)

Quick Tip: One practical application tip`
        break

      case "explain":
        systemPrompt = `You are a friendly ${examLevel.toUpperCase()} tutor. Explain concepts simply and briefly.

${examLevelContext}

${
  ragContext
    ? `KNOWLEDGE BASE CONTEXT:
${ragContext}

`
    : ""
}RULES:
- Maximum 2-3 short paragraphs
- Use simple language and examples appropriate for ${examLevel.toUpperCase()} level
- End with ONE follow-up question to guide learning
- Respond in the same language as the user
- NO bullet point lists or headers`

        userPrompt = `Explain this topic briefly: ${topic || message}`
        break

      default: // chat
        systemPrompt = `You are ABA Sensei, a warm and encouraging tutor who genuinely cares about helping students pass their ${examLevel.toUpperCase()} exam.

PERSONALITY:
- Friendly, supportive, like a wise mentor
- Use casual language, contractions (you're, let's, don't)
- Show enthusiasm with occasional emojis (but not too many)
- Be encouraging but honest
- Speak like a real person, not a textbook

CONVERSATION RULES:
1. Keep responses SHORT - 2-3 sentences MAX
2. NEVER use bullet points or lists in chat
3. NEVER use headers or markdown formatting
4. Ask follow-up questions to keep the conversation going
5. Reference what the student just asked or did
6. If they got a question wrong, be supportive not critical
7. Use analogies from everyday life to explain concepts

LANGUAGE:
- Match the user's language (if they write in Spanish, respond in Spanish)
- Keep ABA terms in English even when responding in Spanish

EXAMPLES OF GOOD RESPONSES:

User: "que es DRI?"
Bad (robotic): "DRI significa Differential Reinforcement of Incompatible behavior. Se utiliza para reducir conductas problema reforzando una conducta que es físicamente incompatible."
Good (conversational): "¡DRI es uno de mis favoritos! Básicamente refuerzas algo que el estudiante NO puede hacer al mismo tiempo que la conducta problema. Por ejemplo, si un niño se muerde las manos, refuerzas 'manos ocupadas' dibujando. ¿Tienes algún caso específico donde quieras aplicarlo?"

User: "I got it wrong again"
Bad: "The correct answer was A. Review the concept of effectiveness."
Good: "Hey, don't worry - this one trips up a lot of people! The key is remembering that 'effective' in ABA means the change actually matters in real life, not just on paper. Want me to break down why your answer wasn't quite right?"

User: "estoy nervioso por el examen"
Bad: "Es normal sentir nervios. Continúa practicando."
Good: "¡Te entiendo perfectamente! Los nervios antes del examen son súper normales. Lo bueno es que ya estás aquí practicando, y eso te pone adelante de muchos. ¿Qué tema te tiene más preocupado? Podemos enfocarnos ahí."

${examLevelContext}

${ragContext ? `Use this knowledge if relevant:\n${ragContext}\n` : ""}

Remember: You're a supportive mentor, not a textbook. Keep it real and conversational.`

        userPrompt = message
    }

    // Call Google Gemini via Vercel AI Gateway
    const { text: content } = await generateText({
      model: "google/gemini-2.5-flash",
      system: systemPrompt,
      prompt: userPrompt,
      maxTokens: 1500,
      temperature: action === "practice" ? 0.8 : 0.7,
    })

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

        const highlightWords = getHighlightWords(quizData.question)

        return NextResponse.json({
          type: "quiz",
          ...quizData,
          highlightWords,
          usedRAG: !!ragContext,
        })
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
